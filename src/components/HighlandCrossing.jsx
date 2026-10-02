import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshReflectorMaterial, Stars, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import './HighlandCrossing.css'

/* The opening scene: a moonlit gorge, a stone viaduct, and a scarlet express
   crossing toward a castle on the promontory. Scroll progress (0 → 1, passed as
   a ref so it never re-renders) dollies the camera in toward the castle while
   the page's dawn overlay dissolves the night into the ivory site.
   Geometry: scripts/blender/create_hogwarts.py → public/models/highland-crossing.glb */
const MODEL = '/models/highland-crossing.glb' + (import.meta.env.DEV ? `?t=${Date.now()}` : '')   // dev: never serve a stale rebuild
const RAIL_Y = 7.58
const FUNNEL = new THREE.Vector3(6.62, 3.05, 0)
/* The run ends with the whole train (tail at origin − 10) buried inside the crag behind the portal at x = 7.4, so it never
   re-emerges on the far slope; after the pause it starts again from the west. Same speed as before (≈ 2.5 units/s). */
const TRAVEL = { from: -40, to: 20, seconds: 24, pause: 6 }
/* Landmarks come from scripts/blender/create_hogwarts.py (Blender Z-up (x, y, z) → web (x, z, -y)):
   castle summit at (16.5, 11.5, -5), castle top ≈ 23.3; tunnel portal at x = 7.4, crown 11.45; moon (26, 27.5, -30). */
const CASTLE = new THREE.Vector3(16.5, 17.5, -5)
const MOON = new THREE.Vector3(26, 27.5, -30)
const PORTAL_X = 7.4
/* Reduced motion: the train waits mid-crossing, nothing sways or flickers. The scroll dolly stays, since the visitor drives it. */
const CALM = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const SHOT = {
  wide: { position: new THREE.Vector3(-17, 8, 37), target: new THREE.Vector3(7.5, 5.5, -5) },
  castle: { position: new THREE.Vector3(-1, 15, 16), target: new THREE.Vector3(16.5, 17.5, -5) },
}

function haloTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.55)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/* Soft steam puffs: CPU-simulated, GPU-drawn as size-attenuated points. */
function Steam({ trainRef, emitting, count = 260 }) {
  const points = useRef()
  const sprite = useMemo(haloTexture, [])
  const state = useMemo(() => ({
    positions: new Float32Array(count * 3),
    ages: new Float32Array(count).fill(2),
    seeds: new Float32Array(count).map(() => Math.random()),
    lives: new Float32Array(count).map(() => 2.6 + Math.random() * 2.2),
    next: 0,
    accumulator: 0,
  }), [count])
  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uSprite: { value: sprite }, uTint: { value: new THREE.Color('#c9d3e6') } },
    vertexShader: `
      attribute float aAge; attribute float aSeed;
      varying float vAlpha;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float grow = 0.9 + aAge * 3.6 + aSeed * 0.6;
        gl_PointSize = grow * (240.0 / -mv.z);
        vAlpha = smoothstep(0.0, 0.12, aAge) * (1.0 - smoothstep(0.35, 1.0, aAge)) * 0.62;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform sampler2D uSprite; uniform vec3 uTint;
      varying float vAlpha;
      void main() {
        float mask = texture2D(uSprite, gl_PointCoord).a;
        gl_FragColor = vec4(uTint, mask * vAlpha);
      }`,
  }), [sprite])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20)
    const geometry = points.current?.geometry
    const train = trainRef.current
    if (!geometry || !train) return
    const { positions, ages, seeds, lives } = state
    const origin = FUNNEL.clone().add(train.position)
    state.accumulator += emitting ? dt * 34 : 0
    while (state.accumulator >= 1) {
      state.accumulator -= 1
      const i = state.next
      state.next = (i + 1) % count
      positions[i * 3] = origin.x + (Math.random() - 0.5) * 0.25
      positions[i * 3 + 1] = origin.y
      positions[i * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.25
      ages[i] = 0
      seeds[i] = Math.random()
    }
    for (let i = 0; i < count; i++) {
      if (ages[i] >= 1) continue
      ages[i] = Math.min(1, ages[i] + dt / lives[i])
      const t = ages[i]
      positions[i * 3] += (-2.6 - seeds[i] * 1.4) * dt * (0.6 + t)
      positions[i * 3 + 1] += (2.4 - t * 1.6 + seeds[i] * 0.6) * dt
      positions[i * 3 + 2] += Math.sin((t + seeds[i]) * 6.0) * 0.35 * dt
    }
    geometry.attributes.position.needsUpdate = true
    geometry.attributes.aAge.needsUpdate = true
  })

  return (
    <points ref={points} frustumCulled={false} material={material}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[state.positions, 3]} />
        <bufferAttribute attach="attributes-aAge" args={[state.ages, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[state.seeds, 1]} />
      </bufferGeometry>
    </points>
  )
}

function Crossing({ progress }) {
  const { scene } = useGLTF(MODEL, true)   // Draco-compressed; decoder fetched on demand
  const trainRef = useRef()
  const castleLamp = useRef()
  const [emitting, setEmitting] = useState(false)
  const clockRef = useRef({ t: TRAVEL.seconds * 0.5 })
  const halo = useMemo(haloTexture, [])
  // Start aimed at the wide shot so the first frame is already framed (no swing in from the origin).
  const camera = useMemo(() => ({ position: SHOT.wide.position.clone(), target: SHOT.wide.target.clone(), look: SHOT.wide.target.clone() }), [])

  const model = useMemo(() => {
    const root = scene.clone(true)
    const parts = {}
    for (const child of [...root.children]) { parts[child.name] = child; parts[child.name.replace(/_/g, ' ')] = child }
    const lit = []
    root.traverse(object => {
      if (!object.isMesh) return
      object.castShadow = object.name !== 'Terrain'
      object.receiveShadow = true
      const list = Array.isArray(object.material) ? object.material : [object.material]
      list.forEach((material, index) => {
        const own = material.clone()
        if (Array.isArray(object.material)) object.material[index] = own
        else object.material = own
        if (['Lit castle window', 'Carriage glass', 'Carriage lamp'].includes(own.name)) lit.push({ material: own, base: own.emissiveIntensity || 1 })
        if (own.name === 'Loch water') object.visible = false
        if (own.name === 'Moon') { own.fog = false; own.emissiveIntensity = 1.6 }   // the moon sits beyond the fog, not inside it
      })
    })
    return { parts, lit }
  }, [scene])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20)
    if (!camera.primed) { camera.primed = true; state.camera.position.copy(SHOT.wide.position); state.camera.lookAt(SHOT.wide.target) }
    const clk = clockRef.current
    if (!CALM) clk.t += dt
    const cycle = TRAVEL.seconds + TRAVEL.pause
    const phase = clk.t % cycle
    const train = trainRef.current
    if (train) {
      const onTrack = phase < TRAVEL.seconds
      const u = onTrack ? phase / TRAVEL.seconds : 1
      const eased = u < 0.08 ? (u / 0.08) * (u / 0.08) * 0.08 : u
      train.position.x = TRAVEL.from + (TRAVEL.to - TRAVEL.from) * eased
      train.position.y = RAIL_Y + (CALM ? 0 : Math.sin(state.clock.elapsedTime * 9) * 0.012)
      train.rotation.z = CALM ? 0 : Math.sin(state.clock.elapsedTime * 7) * 0.003
      const visible = !CALM && onTrack && train.position.x > -30 && train.position.x + FUNNEL.x < PORTAL_X - 0.4   // funnel still outside the portal
      if (visible !== emitting) setEmitting(visible)
    }
    // Candlelight in the windows.
    const flicker = CALM ? 0.95 : 0.92 + Math.sin(state.clock.elapsedTime * 7.3) * 0.05 + Math.sin(state.clock.elapsedTime * 13.7) * 0.03
    for (const { material, base } of model.lit) material.emissiveIntensity = base * flicker
    if (castleLamp.current) castleLamp.current.intensity = 260 + (CALM ? 0 : Math.sin(state.clock.elapsedTime * 2.1) * 24)

    // Scroll dolly: wide shot of the crossing → in toward the castle, with a little breathing sway.
    const p = Math.min(1, Math.max(0, progress?.current ?? 0))
    const e = p * p * (3 - 2 * p)
    const t = state.clock.elapsedTime
    camera.position.lerpVectors(SHOT.wide.position, SHOT.castle.position, e)
    camera.target.lerpVectors(SHOT.wide.target, SHOT.castle.target, e)
    if (!CALM) { camera.position.x += Math.sin(t * 0.09) * 1.2 * (1 - e); camera.position.y += Math.sin(t * 0.13) * 0.4 }
    state.camera.position.lerp(camera.position, Math.min(dt * 4, 1))
    camera.look.lerp(camera.target, Math.min(dt * 4, 1))
    state.camera.lookAt(camera.look)
  })

  const { parts } = model
  return (
    <group>
      <primitive object={parts.Terrain} />
      <primitive object={parts.Viaduct} />
      <primitive object={parts.Track} />
      <primitive object={parts.Castle} />
      <primitive object={parts.Cliff} />
      <primitive object={parts.Pines} />
      <primitive object={parts.Moon} />
      <primitive object={parts.Train} ref={trainRef} />
      <Steam trainRef={trainRef} emitting={emitting} />
      <pointLight ref={castleLamp} position={[CASTLE.x, CASTLE.y + 6, CASTLE.z]} color="#ffb267" intensity={280} distance={44} decay={2} />
      <pointLight position={[PORTAL_X - 1.2, 11.9, 0]} color="#ffb267" intensity={18} distance={9} decay={2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, -0.52, -6]}>
        <planeGeometry args={[96, 60]} />
        <MeshReflectorMaterial blur={[420, 120]} resolution={768} mixBlur={1} mixStrength={14} roughness={0.85} depthScale={1.1} minDepthThreshold={0.8} maxDepthThreshold={1.2} color="#0a1526" metalness={0.5} mirror={0.6} />
      </mesh>
      {/* Moon halo, and a low mist lying on the loch between the piers. */}
      <sprite position={MOON.toArray()} scale={[16, 16, 1]}>
        <spriteMaterial map={halo} color="#cfdcff" transparent opacity={0.42} depthWrite={false} fog={false} />
      </sprite>
      {[[-14, 1.2, 4, 26, 5], [2, 0.9, 8, 30, 5.5], [-4, 1.6, -10, 34, 6]].map(([x, y, z, w, h], i) => (
        <sprite key={i} position={[x, y, z]} scale={[w, h, 1]}>
          <spriteMaterial map={halo} color="#8fa3d9" transparent opacity={0.09} depthWrite={false} />
        </sprite>
      ))}
    </group>
  )
}

export default function HighlandCrossing({ progress, active = true }) {
  return (
    <div className="opening-scene" aria-hidden="true">
      <Canvas shadows frameloop={active ? 'always' : 'never'} camera={{ position: SHOT.wide.position.toArray(), fov: 44, near: 0.5, far: 170 }} dpr={[1, 1.6]} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}>
        <color attach="background" args={['#060b18']} />
        <fog attach="fog" args={['#0a1224', 30, 110]} />
        <ambientLight intensity={0.2} color="#6f86c9" />
        {/* Moon: a cool backlight from behind the castle rims the towers and crag; a softer key from the front-left keeps the train and viaduct legible. */}
        <directionalLight position={[26, 30, -30]} intensity={1.4} color="#b9c8f2" />
        <directionalLight position={[-18, 22, 12]} intensity={1.7} color="#9fb4ea" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-36} shadow-camera-right={42} shadow-camera-top={36} shadow-camera-bottom={-14} shadow-camera-far={90} shadow-bias={-0.0006} />
        <hemisphereLight args={['#33507f', '#050810', 0.5]} />
        <Stars radius={90} depth={40} count={2600} factor={3.2} saturation={0} fade speed={CALM ? 0 : 0.4} />
        <Suspense fallback={null}>
          <Crossing progress={progress} />
        </Suspense>
      </Canvas>
    </div>
  )
}

useGLTF.preload(MODEL, true)
