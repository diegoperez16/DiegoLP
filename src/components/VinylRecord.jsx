import { useRef, useMemo, useEffect, useState } from 'react'
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

/* ── Animation phases ────────────────────────────────────────────── */
const PHASE_ENTERING = 'entering'
const PHASE_IDLE     = 'idle'
const PHASE_EJECTING = 'ejecting'

export function VinylRecord({ isPlaying, albumColor = '#7c3aed', customCoverUrl, rpm = 33, position = [0, 0, 0], isEjecting = false, instant = false }) {
  const groupRef    = useRef()
  const animRef     = useRef()
  const speedRef    = useRef(0)
  const scratchingRef     = useRef(false)
  const scratchStartX     = useRef(0)
  const scratchStartAngle = useRef(0)

  // Animation state — instant skips entry animation (classic mode)
  const phaseRef = useRef(instant ? PHASE_IDLE : PHASE_ENTERING)
  const animT    = useRef(instant ? 1 : 0)

  // instant: position is never set by the entry animation, so seed it on mount
  useEffect(() => {
    if (instant && animRef.current) {
      const [px, py, pz] = position
      animRef.current.position.set(px, py, pz)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [pictureTex, setPictureTex] = useState(null)

  // Start eject animation when prop flips
  useEffect(() => {
    if (isEjecting) {
      phaseRef.current = PHASE_EJECTING
      animT.current = 0
      speedRef.current = 0
    }
  }, [isEjecting])

  useEffect(() => {
    if (!customCoverUrl) { setPictureTex(null); return }
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')
    loader.load(customCoverUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = 16
      setPictureTex(tex)
    })
  }, [customCoverUrl])

  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(buildGrooveTexture(albumColor))
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 16
    return tex
  }, [albumColor])

  // ── Scratch listeners ────────────────────────────────────────────
  function onScratchDown(e) {
    e.stopPropagation()
    scratchingRef.current = true
    scratchStartX.current = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    scratchStartAngle.current = groupRef.current?.rotation.y ?? 0
    speedRef.current = 0

    const onMove = (ev) => {
      if (!scratchingRef.current || !groupRef.current) return
      const x = ev.clientX ?? ev.touches?.[0]?.clientX ?? 0
      groupRef.current.rotation.y = scratchStartAngle.current + (x - scratchStartX.current) * 0.03
    }
    const onUp = () => {
      scratchingRef.current = false
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  useFrame((_, delta) => {
    if (!animRef.current || !groupRef.current) return

    const [px, py, pz] = position

    // ── Entry animation: arc in from shelf direction (bottom-right) ──
    if (phaseRef.current === PHASE_ENTERING) {
      animT.current = Math.min(animT.current + delta * 1.4, 1)
      const t = animT.current
      // easeOutBack
      const c1 = 1.70158, c3 = c1 + 1
      const ease = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)

      const startX = px + 3.5, startY = py - 2.0, startZ = pz + 2.5
      animRef.current.position.set(
        startX + (px - startX) * ease,
        startY + (py - startY) * ease,
        startZ + (pz - startZ) * ease
      )
      animRef.current.rotation.z = (Math.PI / 5) * (1 - ease)
      animRef.current.rotation.x = (Math.PI / 8) * (1 - ease)

      if (animT.current >= 1) {
        phaseRef.current = PHASE_IDLE
        animRef.current.position.set(px, py, pz)
        animRef.current.rotation.set(0, 0, 0)
      }
      return
    }

    // ── Eject animation: lift and fly off screen ──────────────────
    if (phaseRef.current === PHASE_EJECTING) {
      animT.current = Math.min(animT.current + delta * 1.3, 1)
      const t = animT.current
      const ease = t * t  // easeInQuad

      animRef.current.position.set(
        px + ease * 4.5,
        py + ease * 3.0,
        pz + ease * 1.5
      )
      animRef.current.rotation.z = ease * (Math.PI / 5)
      animRef.current.rotation.x = -ease * (Math.PI / 10)
      return
    }

    // ── Idle / playing: just spin ─────────────────────────────────
    if (!scratchingRef.current) {
      const rpmScale = rpm === 45 ? 1.36 : 1
      const target   = isPlaying ? 1.8 * rpmScale : 0
      speedRef.current += (target - speedRef.current) * Math.min(delta * 1.6, 1)
      groupRef.current.rotation.y += speedRef.current * delta
    }
  })

  return (
    <group ref={animRef}>
      <group ref={groupRef}>
        <mesh receiveShadow castShadow onPointerDown={onScratchDown} cursor="grab">
          <cylinderGeometry args={[1.42, 1.42, 0.038, 128]} />
          <meshPhysicalMaterial
            map={pictureTex || texture}
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
    </group>
  )
}
