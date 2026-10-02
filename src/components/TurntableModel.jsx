import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

/* The deck is modelled in Blender (scripts/blender/create_turntable.py) and
   exported with one mesh per moving part, each with its origin at its pivot,
   so this component only has to rotate named nodes. Angles come from
   public/models/turntable.json — solved so the stylus lands at real groove
   radii and the arm sweeps like a 9" arm (pivot-to-spindle / effective length ≈ 1.07). */
export const TURNTABLE_MODEL = '/models/storybook-turntable.glb' + (import.meta.env.DEV ? `?t=${Date.now()}` : '')   // dev: never serve a stale rebuild
export const PLATTER_CENTRE = [0, 0.048, 0.10]
export const PLATTER_TOP_Y = 0.100

const SWING = { park: 1.2102, leadIn: 1.0604, mid: 0.8797 }        // tonearm rotation.y
const LIFT = { park: -0.03, cued: -0.075, onRecord: -0.027 }          // tonearm rotation.z, negative raises the stylus
const SIDE_SECONDS = 240                                              // how long the stylus takes to track inward
const HINT_RING = { inner: 0.16, outer: 1.40 }
/* The Blender file paints the deck in oxblood enamel with brass, buttercream and oak. The site wears it in emerald
   with brushed silver, cool white and navy; the keys are the material names from the Blender file. Its lights are
   white and green whatever the site's accent is: Diego asked for no coloured accents on the deck. */
const FINISH = {
  'Oxblood porcelain enamel': '#14513d', 'Engraved oxblood': '#0e3a2c',
  'Warm brass buttons': '#d3d8e0', 'Soft champagne brass': '#c4cad4', 'Spindle satin gold': '#e1e5ec',
  'Buttercream tonearm': '#eef1f6', 'Warm ivory inset': '#eceff4', 'Caramel oak trim': '#1b2c4d',
  'Cue indicator': '#c3cbdb', 'Play indicator': '#3f9e74',
}
const GLOW = '#dfe6f5'   // cool white: the cue light, the speed buttons, the ring that asks for a record

function findMaterial(mesh, name) {
  if (!mesh) return null
  const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
  return list.find(material => material?.name === name) ?? null
}

/* Pulsing ring on the slipmat while a record is waiting to be placed. */
function PlatterHint({ visible }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const pulse = 0.14 + Math.abs(Math.sin(clock.elapsedTime * 2.2)) * 0.22
    const target = visible ? pulse : 0
    ref.current.material.opacity += (target - ref.current.material.opacity) * 0.07
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[PLATTER_CENTRE[0], PLATTER_TOP_Y + 0.004, PLATTER_CENTRE[2]]}>
      <ringGeometry args={[HINT_RING.inner, HINT_RING.outer, 96]} />
      <meshBasicMaterial color={GLOW} transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

export function TurntableModel({ isPlaying, rpm = 33, onRpmToggle, discOnPlatter = false, discAvailable = false, onNeedleDrop, onNeedleLift, playProgress = null, showHint = true, modelUrl = TURNTABLE_MODEL, motionEnabled = true }) {
  const { scene } = useGLTF(modelUrl)

  const deck = useMemo(() => {
    const root = scene.clone(true)
    const parts = {}
    // three's GLTFLoader turns spaces into underscores; keep the Blender name as a key too.
    for (const child of [...root.children]) { parts[child.name] = child; parts[child.name.replace(/_/g, ' ')] = child }
    root.traverse(object => {
      if (!object.isMesh) return
      object.castShadow = true
      object.receiveShadow = true
      // Each instance owns its materials so button and LED states never leak between scenes.
      object.material = Array.isArray(object.material)
        ? object.material.map(material => material.clone())
        : object.material.clone()
      for (const material of [object.material].flat()) {
        if (FINISH[material.name]) material.color.set(FINISH[material.name])
        if (material.name === 'Cue indicator') material.emissive.set(GLOW).multiplyScalar(0.3)
        if (material.name === 'Play indicator') material.emissive.set('#4cc38a')
      }
    })
    const buttonMaterial = part => findMaterial(part, 'Warm brass buttons') || findMaterial(part, 'Brushed aluminium plate')
    const cap33 = buttonMaterial(parts['Button 33'])
    const cap45 = buttonMaterial(parts['Button 45'])
    const startCap = buttonMaterial(parts['Start stop'])
    for (const cap of [cap33, cap45, startCap]) if (cap) { cap.emissive = new THREE.Color(GLOW); cap.emissiveIntensity = 0 }
    return {
      parts,
      cap33, cap45, startCap,
      statusLed: findMaterial(parts['Status led'], 'Play indicator'),
      cueLed: findMaterial(parts['Cue led'], 'Cue indicator'),
    }
  }, [scene])

  const motion = useRef({ swing: SWING.park, lift: LIFT.park, speed: 0, side: 0, cue: 0, pulse: 0 })

  useFrame(({ clock }, delta) => {
    const m = motion.current
    const dt = Math.min(delta, 1 / 20)
    const { parts } = deck

    // Platter: same ramp constants as VinylRecord so the record and mat spin together.
    const targetSpeed = isPlaying && motionEnabled ? 1.8 * (rpm === 45 ? 1.36 : 1) : 0
    m.speed += (targetSpeed - m.speed) * Math.min(dt * 1.6, 1)
    if (parts.Platter) parts.Platter.rotation.y += m.speed * dt

    // Tonearm: track inward while playing, hold on pause, reset when the record leaves.
    if (Number.isFinite(playProgress)) m.side = Math.max(0, Math.min(1, playProgress))
    else if (isPlaying) m.side = Math.min(1, m.side + dt / SIDE_SECONDS)
    else if (!discOnPlatter) m.side = 0
    const swingTarget = !discOnPlatter ? SWING.park : SWING.leadIn + (SWING.mid - SWING.leadIn) * m.side
    const travelling = Math.abs(swingTarget - m.swing) > 0.02
    const liftTarget = travelling || (discOnPlatter && !isPlaying) ? LIFT.cued : !discOnPlatter ? LIFT.park : LIFT.onRecord
    m.lift += (liftTarget - m.lift) * Math.min(dt * 3.6, 1)
    // The arm only travels once it is clear of the record.
    if (m.lift < LIFT.cued + 0.02 || !travelling) m.swing += (swingTarget - m.swing) * Math.min(dt * 2.0, 1)
    if (parts.Tonearm) parts.Tonearm.rotation.set(0, m.swing, m.lift)

    // Cue lever throws when the arm is raised over the record.
    const cueTarget = discOnPlatter && !isPlaying ? 0.42 : 0
    m.cue += (cueTarget - m.cue) * Math.min(dt * 4, 1)
    if (parts['Cue lever']) parts['Cue lever'].rotation.x = m.cue

    // Indicators.
    m.pulse = motionEnabled ? 0.5 + Math.sin(clock.elapsedTime * 3.2) * 0.5 : 0.5
    if (deck.statusLed) deck.statusLed.emissiveIntensity = isPlaying ? 3.2 : discOnPlatter ? 0.5 : 0.12
    if (deck.cueLed) deck.cueLed.emissiveIntensity = discOnPlatter && !isPlaying ? 2.4 : 0.08
    if (deck.cap33) deck.cap33.emissiveIntensity = rpm === 33 ? (isPlaying ? 0.7 : 0.4) : 0
    if (deck.cap45) deck.cap45.emissiveIntensity = rpm === 45 ? (isPlaying ? 0.7 : 0.4) : 0
    if (deck.startCap) deck.startCap.emissiveIntensity = discOnPlatter && !isPlaying ? 0.15 + m.pulse * 0.35 : 0
  })

  function toggleNeedle(event) {
    event.stopPropagation()
    if (!discOnPlatter) return
    if (isPlaying) onNeedleLift?.()
    else onNeedleDrop?.()
  }
  const pointer = enabled => ({
    onPointerEnter: () => { if (enabled) document.body.style.cursor = 'pointer' },
    onPointerLeave: () => { document.body.style.cursor = '' },
  })
  const { parts } = deck

  return (
    <group>
      <primitive object={parts.Plinth} />
      <primitive object={parts['Dust cover hinges']} />
      <primitive object={parts['Tonearm base']} />
      <primitive object={parts['Tonearm rest']} />
      <primitive object={parts['Status led']} />
      <primitive object={parts['Cue led']} />
      <primitive object={parts.Platter} />
      <PlatterHint visible={discAvailable} />

      <primitive object={parts.Tonearm} onPointerDown={toggleNeedle} {...pointer(discOnPlatter)} />
      <primitive object={parts['Cue lever']} onPointerDown={toggleNeedle} {...pointer(discOnPlatter)} />
      <primitive object={parts['Button 33']} onClick={event => { event.stopPropagation(); onRpmToggle?.(33) }} {...pointer(Boolean(onRpmToggle))} />
      <primitive object={parts['Button 45']} onClick={event => { event.stopPropagation(); onRpmToggle?.(45) }} {...pointer(Boolean(onRpmToggle))} />
      <primitive object={parts['Start stop']} onPointerDown={toggleNeedle} {...pointer(discOnPlatter)}>
        {showHint && discOnPlatter && !isPlaying && (
          <Html position={[0, 0.16, 0]} center zIndexRange={[10, 0]}>
            <div className="deck-hint">Drop the needle</div>
          </Html>
        )}
      </primitive>
    </group>
  )
}
