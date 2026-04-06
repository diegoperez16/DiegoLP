import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, OrbitControls, PresentationControls, RoundedBox, Stars, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { TurntableModel } from './TurntableModel'
import { VinylRecord } from './VinylRecord'

/* ── Time-of-day lighting (classic mode) ────────────────────────── */
function getTimeLighting() {
  const h = new Date().getHours()
  if (h >= 5  && h < 9)  return { color: '#ffb890', intensity: 140, ambient: 0.38 }
  if (h >= 9  && h < 17) return { color: '#fff0d8', intensity: 190, ambient: 0.52 }
  if (h >= 17 && h < 20) return { color: '#ff9840', intensity: 165, ambient: 0.40 }
  if (h >= 20 && h < 23) return { color: '#d48828', intensity: 110, ambient: 0.28 }
  return                         { color: '#4455cc', intensity:  55, ambient: 0.14 }
}

/* ── Procedural wood grain texture ───────────────────────────────── */
function buildWoodTexture() {
  const W = 1024, H = 512
  const cv = document.createElement('canvas')
  cv.width = W; cv.height = H
  const ctx = cv.getContext('2d')

  const base = ctx.createLinearGradient(0, 0, W, 0)
  base.addColorStop(0,    '#8a6b4e')
  base.addColorStop(0.3,  '#8f7054')
  base.addColorStop(0.65, '#8a6b4e')
  base.addColorStop(1,    '#886849')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, W, H)

  for (let y = 0; y < H; y += 2) {
    const alpha = 0.008 + Math.abs(Math.sin(y * 0.14)) * 0.018
    ctx.beginPath()
    ctx.moveTo(0, y)
    for (let x = 0; x <= W; x += 48) {
      const wy = y + Math.sin(x * 0.008 + y * 0.03) * 3
      ctx.lineTo(x, wy)
    }
    ctx.strokeStyle = `rgba(40,18,6,${alpha})`
    ctx.lineWidth = 0.8
    ctx.stroke()
  }

  for (let i = 0; i < 7; i++) {
    const cx = (i / 7) * W + (Math.random() - 0.5) * 50
    const bw = 30 + Math.random() * 50
    const g = ctx.createLinearGradient(cx - bw, 0, cx + bw, 0)
    g.addColorStop(0,   'rgba(0,0,0,0)')
    g.addColorStop(0.5, `rgba(20,8,0,${0.03 + Math.random() * 0.04})`)
    g.addColorStop(1,   'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(cx - bw, 0, bw * 2, H)
  }

  return cv
}

function buildWoodRoughnessTexture() {
  const W = 512, H = 256
  const cv = document.createElement('canvas')
  cv.width = W; cv.height = H
  const ctx = cv.getContext('2d')
  ctx.fillStyle = '#999'
  ctx.fillRect(0, 0, W, H)
  for (let y = 0; y < H; y++) {
    const r = Math.floor(140 + Math.abs(Math.sin(y * 0.22)) * 40)
    ctx.fillStyle = `rgb(${r},${r},${r})`
    ctx.fillRect(0, y, W, 1)
  }
  return cv
}

/* ── Pulsing glow ring ───────────────────────────────────────────── */
function VinylGlow({ isPlaying, color }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const pulse  = 0.18 + Math.abs(Math.sin(clock.elapsedTime * 2.8)) * 0.28
    const target = isPlaying ? pulse : 0
    ref.current.material.opacity += (target - ref.current.material.opacity) * 0.06
    ref.current.material.color.set(color)
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.058, 0.08]}>
      <ringGeometry args={[1.18, 1.6, 72]} />
      <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

/* ── Floating accent particles ───────────────────────────────────── */
function Particles({ isPlaying, color, count = 50 }) {
  const ref = useRef()
  const [positions, speeds, phases] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const spd = new Float32Array(count)
    const phs = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 4.5
      pos[i * 3 + 1] = Math.random() * 4
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3.5
      spd[i] = 0.004 + Math.random() * 0.010
      phs[i] = Math.random() * Math.PI * 2
    }
    return [pos, spd, phs]
  }, [count])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const attr = ref.current.geometry.attributes.position
    const t = clock.elapsedTime
    if (isPlaying) {
      for (let i = 0; i < count; i++) {
        attr.array[i * 3 + 1] += speeds[i]
        attr.array[i * 3]     += Math.sin(t * 0.4 + phases[i]) * 0.003
        if (attr.array[i * 3 + 1] > 4.5) {
          attr.array[i * 3]     = (Math.random() - 0.5) * 4.5
          attr.array[i * 3 + 1] = -0.3
          attr.array[i * 3 + 2] = (Math.random() - 0.5) * 3.5
        }
      }
      attr.needsUpdate = true
    }
    const target = isPlaying ? 0.65 : 0
    ref.current.material.opacity += (target - ref.current.material.opacity) * 0.04
    ref.current.material.color.set(color)
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.026} color={color} transparent opacity={0} sizeAttenuation depthWrite={false} />
    </points>
  )
}

/* ── Desk (simulator mode only) ─────────────────────────────────── */
function Desk() {
  const { woodMap, roughMap } = useMemo(() => {
    const woodMap = new THREE.CanvasTexture(buildWoodTexture())
    woodMap.wrapS = woodMap.wrapT = THREE.RepeatWrapping
    woodMap.repeat.set(2.2, 1)
    woodMap.colorSpace = THREE.SRGBColorSpace
    woodMap.anisotropy = 16

    const roughMap = new THREE.CanvasTexture(buildWoodRoughnessTexture())
    roughMap.wrapS = roughMap.wrapT = THREE.RepeatWrapping
    roughMap.repeat.set(2.2, 1)

    return { woodMap, roughMap }
  }, [])

  const legMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: woodMap,
    roughnessMap: roughMap,
    roughness: 0.72,
    metalness: 0.02,
  }), [woodMap, roughMap])

  return (
    <>
      <RoundedBox args={[9, 0.35, 6]} radius={0.06} smoothness={4}
        position={[0, -0.425, -0.2]} receiveShadow castShadow>
        <meshStandardMaterial map={woodMap} roughnessMap={roughMap} roughness={0.62} metalness={0.02} />
      </RoundedBox>

      {[[-4.2, 2.5], [4.2, 2.5], [-4.2, -2.9], [4.2, -2.9]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, -1.6, lz]} castShadow receiveShadow material={legMat}>
          <boxGeometry args={[0.22, 2.0, 0.22]} />
        </mesh>
      ))}

      <ContactShadows
        position={[0, -2.62, -0.2]}
        opacity={0.5}
        scale={14}
        blur={3}
        far={0.5}
        color="#0a0818"
      />
    </>
  )
}

/* ── Classic scene ───────────────────────────────────────────────── */
function ClassicSceneContents({
  currentAlbum, isPlaying, rpm, onRpmToggle,
  discOnPlatter, isEjecting, showVinyl
}) {
  const lighting    = useMemo(() => getTimeLighting(), [])
  const accentColor = currentAlbum?.accentColor ?? '#a78bfa'
  const vinylColor  = currentAlbum ? currentAlbum.color : '#ffffff'

  useFrame((state) => {
    const targetY = isPlaying ? 3.2 : 3.8
    const targetZ = isPlaying ? 4.7 : 5.5
    state.camera.position.y += (targetY - state.camera.position.y) * 0.016
    state.camera.position.z += (targetZ - state.camera.position.z) * 0.016
  })

  return (
    <>
      <ambientLight intensity={lighting.ambient} />
      <pointLight position={[3.5, 6, 4]} intensity={lighting.intensity} color={lighting.color}
        castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.001} />
      <pointLight position={[-5, 4, 2]} intensity={50} color="#b0c8ff" />
      <pointLight position={[0, 3, -5]} intensity={28} color="#ffffff" />
      <spotLight position={[0.5, 8, 1]} angle={isPlaying ? 0.19 : 0.30} penumbra={0.9}
        intensity={isPlaying ? 440 : 48} color={accentColor} castShadow={false} decay={1.5} />

      <Environment preset="warehouse" environmentIntensity={0.18} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.26, 0]} receiveShadow>
        <planeGeometry args={[28, 20]} />
        <meshStandardMaterial color="#090909" roughness={0.96} metalness={0} />
      </mesh>

      {currentAlbum && (
        <>
          <VinylGlow isPlaying={isPlaying} color={accentColor} />
          <Particles isPlaying={isPlaying} color={accentColor} />
        </>
      )}

      <PresentationControls
        global
        polar={[-0.12, 0.18]}
        azimuth={[-0.35, 0.35]}
        speed={1.3}
        snap={{ mass: 4, tension: 380 }}
      >
        <group>
          <TurntableModel
            isPlaying={isPlaying}
            rpm={rpm}
            onRpmToggle={onRpmToggle}
            discOnPlatter={discOnPlatter}
            discAvailable={false}
          />
          {showVinyl && (
            <VinylRecord
              isPlaying={isPlaying}
              albumColor={vinylColor}
              rpm={rpm}
              position={[0, 0.096, 0.08]}
              isEjecting={isEjecting}
              instant
            />
          )}
        </group>
      </PresentationControls>

      <ContactShadows position={[0, -0.25, 0]} opacity={0.6} scale={12} blur={2.2} far={0.6} />
    </>
  )
}

/* ── Simulator scene ─────────────────────────────────────────────── */
function SimulatorSceneContents({
  currentAlbum, jukeboxTrack, isPlaying, rpm, onRpmToggle,
  discOnPlatter, isEjecting, showVinyl, onNeedleDrop, onNeedleLift
}) {
  const accentColor = currentAlbum?.accentColor ?? '#a78bfa'
  const vinylColor  = currentAlbum ? currentAlbum.color : '#ffffff'

  return (
    <>
      <OrbitControls
        enableDamping
        dampingFactor={0.06}
        target={[0, 0.2, 0]}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.1}
        minAzimuthAngle={-Math.PI * 0.6}
        maxAzimuthAngle={Math.PI * 0.6}
        minDistance={3.5}
        maxDistance={14}
        enablePan={false}
      />

      <ambientLight intensity={1.1} color="#aabbdd" />
      <directionalLight
        position={[0, 12, 2]}
        intensity={3.8}
        color="#eef3ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={28}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={7}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0008}
        shadow-normalBias={0.04}
      />
      <spotLight
        position={[0.5, 8, 1]}
        angle={isPlaying ? 0.18 : 0.30}
        penumbra={0.85}
        intensity={isPlaying ? 280 : 55}
        color={accentColor}
        castShadow={false}
        decay={1.6}
      />

      <Environment preset="night" environmentIntensity={0.12} />
      <Stars radius={10} depth={50} count={6000} factor={5} saturation={0.3} fade speed={1} />

      <Desk />

      <TurntableModel
        isPlaying={isPlaying}
        rpm={rpm}
        onRpmToggle={onRpmToggle}
        discOnPlatter={discOnPlatter}
        discAvailable={!!currentAlbum && !discOnPlatter && !isEjecting}
        onNeedleDrop={onNeedleDrop}
        onNeedleLift={onNeedleLift}
      />

      {showVinyl && (
        <VinylRecord
          isPlaying={isPlaying}
          albumColor={vinylColor}
          customCoverUrl={jukeboxTrack ? jukeboxTrack.coverUrl : null}
          rpm={rpm}
          position={[0, 0.096, 0.08]}
          isEjecting={isEjecting}
        />
      )}

      {(currentAlbum || jukeboxTrack) && (
        <>
          <VinylGlow isPlaying={isPlaying} color={accentColor} />
          <Particles isPlaying={isPlaying} color={accentColor} />
        </>
      )}
    </>
  )
}

/* ── Main export ─────────────────────────────────────────────────── */
export function Scene({ simulatorMode = false, ...props }) {
  return (
    <Canvas
      key={simulatorMode ? 'sim' : 'classic'}
      shadows={simulatorMode ? 'soft' : true}
      camera={simulatorMode
        ? { position: [1.5, 4.2, 7], fov: 42 }
        : { position: [1.5, 3.8, 5.5], fov: 44 }
      }
      gl={{ antialias: true, alpha: true, toneMappingExposure: 1.1 }}
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        {simulatorMode
          ? <SimulatorSceneContents {...props} />
          : <ClassicSceneContents {...props} />
        }
      </Suspense>
    </Canvas>
  )
}
