import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, Html } from '@react-three/drei'

/* ── Tonearm angles (Y rotation at pivot [1.42, -0.82]) ─────────────
   Needle tip is ~1.60 units from pivot.
   Platter center at world [0, 0.08].
   Calculated so needle lands at correct radii from disc center:
     REST    → needle outside platter (r ≈ 1.9), arm to the side
     CUED    → needle over outer groove (r ≈ 1.30)
     PLAYING → needle in mid-groove (r ≈ 0.85)
────────────────────────────────────────────────────────────────── */
const ARM_REST    = 1.72   // arm swung to front-right, needle off disc
const ARM_CUED    = 1.28   // needle just inside outer groove edge
const ARM_PLAYING = 0.90   // needle tracking mid-groove area

/* ── Platter hint — pulsing ring when disc is ready to be placed ── */
function PlatterHint({ visible }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    const pulse = 0.15 + Math.abs(Math.sin(clock.elapsedTime * 2.2)) * 0.25
    const target = visible ? pulse : 0
    ref.current.material.opacity += (target - ref.current.material.opacity) * 0.07
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.056, 0.08]}>
      <ringGeometry args={[0.15, 1.40, 72]} />
      <meshBasicMaterial color="#7c3aed" transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

/* ── LED indicator ───────────────────────────────────────────────── */
function LED({ isPlaying, discOnPlatter }) {
  const ref = useRef()
  useFrame(() => {
    if (!ref.current) return
    const targetIntensity = isPlaying ? 1.8 : discOnPlatter ? 0.6 : 0.15
    const targetColor = isPlaying ? '#00ff88' : discOnPlatter ? '#ffaa00' : '#444444'
    ref.current.material.emissive.set(targetColor)
    ref.current.material.emissiveIntensity += (targetIntensity - ref.current.material.emissiveIntensity) * 0.08
  })
  return (
    <mesh ref={ref} position={[-0.10, 0.010, 1.24]}>
      <sphereGeometry args={[0.022, 10, 10]} />
      <meshStandardMaterial
        color="#111"
        emissive="#444444"
        emissiveIntensity={0.15}
        roughness={0.1}
        metalness={0.5}
      />
    </mesh>
  )
}

export function TurntableModel({ isPlaying, rpm = 33, onRpmToggle, discOnPlatter = false, discAvailable = false, onNeedleDrop, onNeedleLift }) {
  const platterRef    = useRef()
  const tonearmRef    = useRef()
  const tonearmAngle  = useRef(ARM_REST)
  const needleLiftRef = useRef()   // cueing lift cylinder

  const btn33Active = rpm === 33
  const btn45Active = rpm === 45

  useFrame((_, delta) => {
    if (!platterRef.current || !tonearmRef.current) return

    // Platter spins only when playing
    if (isPlaying) platterRef.current.rotation.y += delta * 1.85

    // Tonearm position: rest → cued → playing
    const targetAngle = !discOnPlatter ? ARM_REST : isPlaying ? ARM_PLAYING : ARM_CUED
    tonearmAngle.current += (targetAngle - tonearmAngle.current) * Math.min(delta * 1.8, 1)
    tonearmRef.current.rotation.y = tonearmAngle.current

    // Cueing lift: needle raised when cued, lowered when playing
    if (needleLiftRef.current) {
      const targetLift = (discOnPlatter && !isPlaying) ? 0.04 : 0
      needleLiftRef.current.position.y += (targetLift - needleLiftRef.current.position.y) * Math.min(delta * 3, 1)
    }
  })

  function handleTonearmClick(e) {
    e.stopPropagation()
    if (!discOnPlatter) return
    if (isPlaying) {
      onNeedleLift?.()
    } else {
      onNeedleDrop?.()
    }
  }

  return (
    <group>
      {/* ── Plinth / Base ── */}
      <RoundedBox args={[3.8, 0.25, 3.0]} radius={0.06} smoothness={4} position={[0, -0.125, 0]} castShadow receiveShadow>
        {/* Upgraded to Physical material for premium realistic texture */}
        <meshPhysicalMaterial color="#1a1108" roughness={0.3} metalness={0.2} clearcoat={1.0} clearcoatRoughness={0.15} />
      </RoundedBox>

      {/* Plinth top face — slightly lighter wood tone */}
      <mesh position={[0, 0.003, 0]}>
        <boxGeometry args={[3.78, 0.005, 2.98]} />
        <meshPhysicalMaterial color="#241c0c" roughness={0.4} metalness={0.1} clearcoat={1.0} clearcoatRoughness={0.15} />
      </mesh>

      {/* ── Platter recess ring ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0.08]}>
        <ringGeometry args={[1.44, 1.62, 72]} />
        <meshStandardMaterial color="#0f0f0f" roughness={0.6} metalness={0.15} />
      </mesh>

      {/* Platter hint glow — only when disc selected but not yet placed */}
      <PlatterHint visible={discAvailable} />

      {/* ── Spinning platter ── */}
      <group ref={platterRef} position={[0, 0.05, 0.08]}>
        <mesh receiveShadow>
          <cylinderGeometry args={[1.42, 1.42, 0.045, 80]} />
          <meshStandardMaterial color="#1e1e1e" roughness={0.5} metalness={0.35} />
        </mesh>
        {/* Platter mat */}
        <mesh position={[0, 0.025, 0]}>
          <cylinderGeometry args={[1.40, 1.40, 0.004, 80]} />
          <meshStandardMaterial color="#1a1408" roughness={0.97} metalness={0} />
        </mesh>
        {/* Spindle */}
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.1, 16]} />
          <meshStandardMaterial color="#aaa" roughness={0.1} metalness={0.9} />
        </mesh>
      </group>

      {/* ── Tonearm assembly ── */}
      <group position={[1.42, 0.10, -0.82]}>
        {/* Pivot base */}
        <mesh>
          <cylinderGeometry args={[0.085, 0.085, 0.11, 16]} />
          <meshStandardMaterial color="#777" roughness={0.15} metalness={0.88} />
        </mesh>
        {/* Pivot cap */}
        <mesh position={[0, 0.075, 0]}>
          <cylinderGeometry args={[0.11, 0.085, 0.035, 16]} />
          <meshStandardMaterial color="#999" roughness={0.1} metalness={0.9} />
        </mesh>

        {/* ── Rotatable arm group ── */}
        <group
          ref={tonearmRef}
          position={[0, 0.095, 0]}
        >
          {/* Arm tube */}
          <mesh position={[-0.78, 0, 0.06]} rotation={[0.06, 0, -Math.PI / 2]}>
            <capsuleGeometry args={[0.020, 1.50, 4, 12]} />
            <meshStandardMaterial color="#888" roughness={0.1} metalness={0.92} />
          </mesh>

          {/* Counterweight — at the back of the arm */}
          <mesh position={[0.46, 0, 0]}>
            <cylinderGeometry args={[0.055, 0.055, 0.14, 20]} />
            <meshStandardMaterial color="#555" roughness={0.08} metalness={0.95} />
          </mesh>
          <mesh position={[0.46, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.055, 0.008, 8, 24]} />
            <meshStandardMaterial color="#888" roughness={0.1} metalness={0.85} />
          </mesh>

          {/* Headshell + cartridge */}
          <group ref={needleLiftRef} position={[-1.60, -0.015, 0.12]}>
            <mesh rotation={[0.08, 0, 0.05]}>
              <boxGeometry args={[0.18, 0.040, 0.14]} />
              <meshStandardMaterial color="#777" roughness={0.18} metalness={0.82} />
            </mesh>
            {/* Cartridge body */}
            <mesh position={[0, -0.030, 0.04]}>
              <boxGeometry args={[0.065, 0.035, 0.10]} />
              <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.4} />
            </mesh>
            {/* Stylus needle */}
            <mesh position={[0, -0.056, 0.09]} rotation={[0.15, 0, 0]}>
              <coneGeometry args={[0.004, 0.042, 4]} />
              <meshStandardMaterial color="#ddd" roughness={0.04} metalness={1} />
            </mesh>
          </group>

          {/* Cueing lever stub */}
          <mesh position={[0.26, 0, 0]}>
            <cylinderGeometry args={[0.062, 0.062, 0.10, 16]} />
            <meshStandardMaterial color="#555" roughness={0.08} metalness={0.92} />
          </mesh>
        </group>

        {/* Anti-skate dial (decorative) */}
        <mesh position={[0.28, 0.06, -0.22]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.048, 0.048, 0.02, 16]} />
          <meshStandardMaterial color="#666" roughness={0.12} metalness={0.9} />
        </mesh>
      </group>

      {/* ── Start/Stop Button ── */}
      <group
        position={[-1.6, 0.015, 1.24]}
        onPointerDown={e => { e.stopPropagation(); handleTonearmClick(e) }}
        onPointerEnter={() => { if (discOnPlatter) document.body.style.cursor = 'pointer' }}
        onPointerLeave={() => document.body.style.cursor = ''}>
        <mesh position={[0, -0.01, 0]}>
          <boxGeometry args={[0.26, 0.04, 0.20]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
        <mesh position={[0, isPlaying ? 0 : 0.008, 0]}>
          <boxGeometry args={[0.22, 0.02, 0.16]} />
          <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.2} />
          {discOnPlatter && !isPlaying && (
            <Html position={[0, 0.08, 0]} center>
              <style>{`
                @keyframes tooltipPulse {
                  0%, 100% { transform: scale(1) translateY(0); opacity: 0.8; }
                  50% { transform: scale(1.05) translateY(-3px); opacity: 1; }
                }
              `}</style>
              <div style={{
                color: '#fff', background: 'rgba(124, 58, 237, 0.9)', padding: '5px 12px',
                borderRadius: '20px', fontSize: '11px', fontWeight: 800, pointerEvents: 'none',
                whiteSpace: 'nowrap', animation: 'tooltipPulse 1.5s ease-in-out infinite',
                boxShadow: '0 4px 12px rgba(124,58,237,0.4)', fontFamily: 'sans-serif',
                letterSpacing: '0.05em', border: '1px solid rgba(255,255,255,0.2)'
              }}>
                PLAY ALBUM
              </div>
            </Html>
          )}
        </mesh>
      </group>

      {/* ── RPM buttons ── */}
      <mesh position={[-0.60, 0.007, 1.24]} onClick={() => onRpmToggle?.(33)}>
        <cylinderGeometry args={[0.052, 0.052, 0.032, 14]} />
        <meshStandardMaterial
          color={btn33Active ? '#7c3aed' : '#2a2a2a'}
          roughness={0.3} metalness={0.5}
          emissive={btn33Active ? '#3b0f7a' : '#000'}
          emissiveIntensity={btn33Active && isPlaying ? 1.2 : btn33Active ? 0.4 : 0}
        />
      </mesh>
      <mesh position={[-0.34, 0.007, 1.24]} onClick={() => onRpmToggle?.(45)}>
        <cylinderGeometry args={[0.052, 0.052, 0.032, 14]} />
        <meshStandardMaterial
          color={btn45Active ? '#7c3aed' : '#2a2a2a'}
          roughness={0.3} metalness={0.5}
          emissive={btn45Active ? '#3b0f7a' : '#000'}
          emissiveIntensity={btn45Active && isPlaying ? 1.2 : btn45Active ? 0.4 : 0}
        />
      </mesh>

      {/* ── LED status indicator ── */}
      <LED isPlaying={isPlaying} discOnPlatter={discOnPlatter} />

      {/* ── Corner feet ── */}
      {[[-1.72,-0.25,-1.32],[1.72,-0.25,-1.32],[-1.72,-0.25,1.38],[1.72,-0.25,1.38]].map((p, i) => (
        <mesh key={i} position={p}>
          <cylinderGeometry args={[0.06, 0.08, 0.08, 12]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.2} />
        </mesh>
      ))}

      {/* ── Hinge bar (dust cover mount) ── */}
      <mesh position={[0, 0.016, -1.46]}>
        <boxGeometry args={[3.5, 0.020, 0.050]} />
        <meshStandardMaterial color="#555" roughness={0.2} metalness={0.75} />
      </mesh>
    </group>
  )
}
