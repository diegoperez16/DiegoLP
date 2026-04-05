import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'

export function TurntableModel({ isPlaying, rpm = 33, onRpmToggle }) {
  const platterRef = useRef()
  const tonearmRef = useRef()
  const tonearmAngle = useRef(0.75)

  useFrame((_, delta) => {
    if (!platterRef.current || !tonearmRef.current) return
    if (isPlaying) platterRef.current.rotation.y += delta * 1.85
    const target = isPlaying ? 0.38 : 0.75
    tonearmAngle.current += (target - tonearmAngle.current) * Math.min(delta * 1.5, 1)
    tonearmRef.current.rotation.y = tonearmAngle.current
  })

  const btn33Active = rpm === 33
  const btn45Active = rpm === 45

  return (
    <group>
      {/* ── Plinth / Base ── */}
      <RoundedBox args={[3.8, 0.25, 3.0]} radius={0.06} smoothness={4} position={[0, -0.125, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#181210" roughness={0.8} metalness={0.02} />
      </RoundedBox>
      <mesh position={[0, 0.003, 0]}>
        <boxGeometry args={[3.78, 0.005, 2.98]} />
        <meshStandardMaterial color="#241808" roughness={0.88} metalness={0} />
      </mesh>

      {/* ── Platter recess ring ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0.08]}>
        <ringGeometry args={[1.44, 1.62, 72]} />
        <meshStandardMaterial color="#0f0f0f" roughness={0.6} metalness={0.15} />
      </mesh>

      {/* ── Spinning platter ── */}
      <group ref={platterRef} position={[0, 0.05, 0.08]}>
        <mesh receiveShadow>
          <cylinderGeometry args={[1.42, 1.42, 0.045, 80]} />
          <meshStandardMaterial color="#1e1e1e" roughness={0.5} metalness={0.35} />
        </mesh>
        <mesh position={[0, 0.025, 0]}>
          <cylinderGeometry args={[1.40, 1.40, 0.004, 80]} />
          <meshStandardMaterial color="#1a1408" roughness={0.97} metalness={0} />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.1, 16]} />
          <meshStandardMaterial color="#aaa" roughness={0.1} metalness={0.9} />
        </mesh>
      </group>

      {/* ── Tonearm assembly ── */}
      <group position={[1.42, 0.10, -0.82]}>
        <mesh>
          <cylinderGeometry args={[0.085, 0.085, 0.11, 16]} />
          <meshStandardMaterial color="#777" roughness={0.15} metalness={0.88} />
        </mesh>
        <mesh position={[0, 0.075, 0]}>
          <cylinderGeometry args={[0.11, 0.085, 0.035, 16]} />
          <meshStandardMaterial color="#999" roughness={0.1} metalness={0.9} />
        </mesh>
        <group ref={tonearmRef} position={[0, 0.095, 0]}>
          <mesh position={[-0.78, 0, 0.06]} rotation={[0.06, 0, -Math.PI / 2]}>
            <capsuleGeometry args={[0.020, 1.50, 4, 12]} />
            <meshStandardMaterial color="#888" roughness={0.1} metalness={0.92} />
          </mesh>
          <group position={[-1.60, -0.015, 0.12]}>
            <mesh rotation={[0.08, 0, 0.05]}>
              <boxGeometry args={[0.18, 0.040, 0.14]} />
              <meshStandardMaterial color="#777" roughness={0.18} metalness={0.82} />
            </mesh>
            <mesh position={[0, -0.030, 0.04]}>
              <boxGeometry args={[0.065, 0.035, 0.10]} />
              <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.4} />
            </mesh>
            <mesh position={[0, -0.056, 0.09]} rotation={[0.15, 0, 0]}>
              <coneGeometry args={[0.004, 0.042, 4]} />
              <meshStandardMaterial color="#ddd" roughness={0.04} metalness={1} />
            </mesh>
          </group>
          <mesh position={[0.26, 0, 0]}>
            <cylinderGeometry args={[0.062, 0.062, 0.10, 16]} />
            <meshStandardMaterial color="#555" roughness={0.08} metalness={0.92} />
          </mesh>
        </group>
      </group>

      {/* ── Corner feet ── */}
      {[[-1.72,-0.25,-1.32],[1.72,-0.25,-1.32],[-1.72,-0.25,1.38],[1.72,-0.25,1.38]].map((p, i) => (
        <mesh key={i} position={p}>
          <cylinderGeometry args={[0.06, 0.08, 0.08, 12]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.2} />
        </mesh>
      ))}

      {/* ── RPM buttons — clickable ── */}
      {/* 33 RPM */}
      <mesh position={[-0.60, 0.007, 1.24]} onClick={() => onRpmToggle?.(33)}>
        <cylinderGeometry args={[0.052, 0.052, 0.032, 14]} />
        <meshStandardMaterial
          color={btn33Active ? '#7c3aed' : '#2a2a2a'}
          roughness={0.3} metalness={0.5}
          emissive={btn33Active ? '#3b0f7a' : '#000'}
          emissiveIntensity={btn33Active && isPlaying ? 1.2 : btn33Active ? 0.4 : 0}
        />
      </mesh>
      {/* 45 RPM */}
      <mesh position={[-0.34, 0.007, 1.24]} onClick={() => onRpmToggle?.(45)}>
        <cylinderGeometry args={[0.052, 0.052, 0.032, 14]} />
        <meshStandardMaterial
          color={btn45Active ? '#7c3aed' : '#2a2a2a'}
          roughness={0.3} metalness={0.5}
          emissive={btn45Active ? '#3b0f7a' : '#000'}
          emissiveIntensity={btn45Active && isPlaying ? 1.2 : btn45Active ? 0.4 : 0}
        />
      </mesh>

      {/* ── Dust cover hinge ── */}
      <mesh position={[0, 0.016, -1.46]}>
        <boxGeometry args={[3.5, 0.020, 0.050]} />
        <meshStandardMaterial color="#555" roughness={0.2} metalness={0.75} />
      </mesh>
    </group>
  )
}
