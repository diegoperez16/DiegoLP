import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, ContactShadows, PresentationControls } from '@react-three/drei'
import * as THREE from 'three'
import { TurntableModel } from './TurntableModel'
import { VinylRecord } from './VinylRecord'

/* ── Time-of-day key light ───────────────────────────────────────── */
function getTimeLighting() {
  const h = new Date().getHours()
  if (h >= 5  && h < 9)  return { color: '#ffb890', intensity: 140, ambient: 0.38 } // dawn
  if (h >= 9  && h < 17) return { color: '#fff0d8', intensity: 190, ambient: 0.52 } // day
  if (h >= 17 && h < 20) return { color: '#ff9840', intensity: 165, ambient: 0.40 } // golden hour
  if (h >= 20 && h < 23) return { color: '#d48828', intensity: 110, ambient: 0.28 } // evening
  return                         { color: '#4455cc', intensity:  55, ambient: 0.14 } // night
}

/* ── Pulsing glow ring beneath the spinning vinyl ───────────────── */
function VinylGlow({ isPlaying, color }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const pulse = 0.18 + Math.abs(Math.sin(clock.elapsedTime * 2.8)) * 0.28
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

/* ── Floating accent particles that drift upward when playing ────── */
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

/* ── Main scene ──────────────────────────────────────────────────── */
function SceneContents({ currentAlbum, isPlaying, rpm, onRpmToggle }) {
  const lighting = useMemo(() => getTimeLighting(), [])
  const accentColor = currentAlbum?.accentColor ?? '#c8b89a'

  // Camera eases in when playing
  useFrame((state) => {
    const targetY = isPlaying ? 3.0 : 3.8
    const targetZ = isPlaying ? 4.2 : 5.5
    const targetCamX = isPlaying ? 2.2 : 1.5
    const targetLookX = isPlaying ? 1.2 : 0

    state.camera.position.x += (targetCamX - state.camera.position.x) * 0.02
    state.camera.position.y += (targetY - state.camera.position.y) * 0.02
    state.camera.position.z += (targetZ - state.camera.position.z) * 0.02

    if (!state.camera.lookTarget) state.camera.lookTarget = new THREE.Vector3(0, 0, 0)
    state.camera.lookTarget.x += (targetLookX - state.camera.lookTarget.x) * 0.02
    state.camera.lookAt(state.camera.lookTarget.x, 0, 0)
  })

  return (
    <>
      <ambientLight intensity={lighting.ambient} />

      {/* Time-of-day key light */}
      <pointLight
        position={[3.5, 6, 4]}
        intensity={lighting.intensity}
        color={lighting.color}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.001}
      />

      {/* Cool fill — left */}
      <pointLight position={[-5, 4, 2]} intensity={50} color="#b0c8ff" />

      {/* Rear rim */}
      <pointLight position={[0, 3, -5]} intensity={28} color="#ffffff" />

      {/* Album accent spotlight — dramatic when playing */}
      <spotLight
        position={[0.5, 8, 1]}
        angle={isPlaying ? 0.19 : 0.30}
        penumbra={0.9}
        intensity={isPlaying ? 440 : 48}
        color={accentColor}
        castShadow={false}
        decay={1.5}
      />

      <Environment preset="warehouse" environmentIntensity={0.18} />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.26, 0]} receiveShadow>
        <planeGeometry args={[28, 20]} />
        <meshStandardMaterial color="#090909" roughness={0.96} metalness={0} />
      </mesh>

      {/* Particles + glow (always in world space, outside PC group) */}
      {currentAlbum && (
        <>
          <VinylGlow isPlaying={isPlaying} color={accentColor} />
          <Particles isPlaying={isPlaying} color={accentColor} />
        </>
      )}

      {/* ── Draggable / orbitable turntable group ── */}
      <PresentationControls
        global
        polar={[-0.12, 0.18]}
        azimuth={[-0.35, 0.35]}
        speed={1.3}
        snap={{ mass: 4, tension: 380 }}
      >
        <group>
          <TurntableModel isPlaying={isPlaying} rpm={rpm} onRpmToggle={onRpmToggle} />
          {currentAlbum && (
            <VinylRecord
              isPlaying={isPlaying}
              albumColor={currentAlbum.color}
              rpm={rpm}
              position={[0, 0.096, 0.08]}
            />
          )}
        </group>
      </PresentationControls>

      <ContactShadows position={[0, -0.25, 0]} opacity={0.6} scale={12} blur={2.2} far={0.6} />
    </>
  )
}

export function Scene({ currentAlbum, isPlaying, rpm, onRpmToggle }) {
  return (
    <Canvas
      shadows
      camera={{ position: [1.5, 3.8, 5.5], fov: 44 }}
      gl={{ antialias: true, alpha: true, toneMappingExposure: 1.15 }}
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <SceneContents
          currentAlbum={currentAlbum}
          isPlaying={isPlaying}
          rpm={rpm}
          onRpmToggle={onRpmToggle}
        />
      </Suspense>
    </Canvas>
  )
}
