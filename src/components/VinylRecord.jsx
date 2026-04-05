import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ── Canvas groove texture ───────────────────────────────────────── */
function buildGrooveTexture(labelColor) {
  const size = 2048
  const canvas = document.createElement('canvas')
  canvas.width = size; canvas.height = size
  const ctx = canvas.getContext('2d')
  const cx = size / 2, cy = size / 2

  ctx.fillStyle = '#04040a'
  ctx.fillRect(0, 0, size, size)

  for (let r = 200; r < cx - 28; r += 4) {
    const drift = Math.abs(Math.sin(r * 0.11)) * 0.14 + Math.abs(Math.cos(r * 0.073)) * 0.07
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(4,4,10,0.95)'; ctx.lineWidth = 1.6; ctx.stroke()
    ctx.beginPath(); ctx.arc(cx, cy, r + 1.2, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(200,175,130,${drift})`; ctx.lineWidth = 0.8; ctx.stroke()
  }

  // Dead wax
  ctx.beginPath(); ctx.arc(cx, cy, 204, 0, Math.PI * 2)
  ctx.fillStyle = '#0a0a10'; ctx.fill()
  for (let i = 0; i < 4; i++) {
    ctx.beginPath(); ctx.arc(cx, cy, 196 - i * 4, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(70,65,80,0.45)'; ctx.lineWidth = 0.6; ctx.stroke()
  }

  // Label
  const lr = 218
  const grad = ctx.createRadialGradient(cx - 50, cy - 50, 8, cx, cy, lr)
  grad.addColorStop(0, lighten(labelColor, 50))
  grad.addColorStop(0.45, labelColor)
  grad.addColorStop(1, darken(labelColor, 40))
  ctx.beginPath(); ctx.arc(cx, cy, lr, 0, Math.PI * 2)
  ctx.fillStyle = grad; ctx.fill()
  ctx.beginPath(); ctx.arc(cx, cy, lr, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 3; ctx.stroke()
  ctx.beginPath(); ctx.arc(cx, cy, lr - 28, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1.5; ctx.stroke()

  ctx.save(); ctx.translate(cx, cy)
  ctx.font = `700 ${size * 0.022}px sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('DIEGO PÉREZ', 0, -size * 0.04)
  ctx.font = `400 ${size * 0.013}px monospace`
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.fillText('PORTFOLIO', 0, size * 0.02)
  ctx.restore()

  // Hole
  ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI * 2)
  ctx.fillStyle = '#000'; ctx.fill()

  return canvas
}

function lighten(hex, pct) {
  const n = parseInt(hex.slice(1), 16)
  return `rgb(${Math.min(255,((n>>16)&255)+pct)},${Math.min(255,((n>>8)&255)+pct)},${Math.min(255,(n&255)+pct)})`
}
function darken(hex, pct) {
  const n = parseInt(hex.slice(1), 16)
  return `rgb(${Math.max(0,((n>>16)&255)-pct)},${Math.max(0,((n>>8)&255)-pct)},${Math.max(0,(n&255)-pct)})`
}

/* ── Component ───────────────────────────────────────────────────── */
export function VinylRecord({ isPlaying, albumColor = '#7c3aed', rpm = 33, position = [0, 0, 0] }) {
  const groupRef = useRef()
  const speedRef = useRef(0)
  const scratchingRef = useRef(false)
  const scratchStartX = useRef(0)
  const scratchStartAngle = useRef(0)

  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(buildGrooveTexture(albumColor))
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 16
    return tex
  }, [albumColor])

  // ── Scratch: register global pointer listeners ────────────────
  function onScratchDown(e) {
    e.stopPropagation()  // prevent PresentationControls from capturing
    scratchingRef.current = true
    scratchStartX.current = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    scratchStartAngle.current = groupRef.current?.rotation.y ?? 0
    speedRef.current = 0

    const onMove = (ev) => {
      if (!scratchingRef.current || !groupRef.current) return
      const x = ev.clientX ?? ev.touches?.[0]?.clientX ?? 0
      const dx = x - scratchStartX.current
      groupRef.current.rotation.y = scratchStartAngle.current + dx * 0.03
    }
    const onUp = () => {
      scratchingRef.current = false
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  useEffect(() => () => {
    // noop — listeners are cleaned up in closures above
  }, [])

  useFrame((_, delta) => {
    if (!groupRef.current || scratchingRef.current) return
    const rpmScale = rpm === 45 ? 1.36 : 1   // 45/33 ≈ 1.36
    const target = isPlaying ? 1.8 * rpmScale : 0
    speedRef.current += (target - speedRef.current) * Math.min(delta * 1.6, 1)
    groupRef.current.rotation.y += speedRef.current * delta
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Main disc — clearcoat lacquer via MeshPhysicalMaterial */}
      <mesh receiveShadow castShadow onPointerDown={onScratchDown} cursor="grab">
        <cylinderGeometry args={[1.42, 1.42, 0.038, 128]} />
        <meshPhysicalMaterial
          map={texture}
          roughness={0.28}
          metalness={0.06}
          clearcoat={0.9}
          clearcoatRoughness={0.12}
          reflectivity={0.7}
          envMapIntensity={0.55}
        />
      </mesh>

      {/* Chrome edge ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.42, 0.018, 24, 128]} />
        <meshStandardMaterial color="#1c1c22" roughness={0.18} metalness={0.85} envMapIntensity={0.4} />
      </mesh>
    </group>
  )
}
