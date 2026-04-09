import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { portfolioContent } from '../data/portfolio'

const TABLE_TOP_Y = -0.25
const ALBUM_THICKNESS = 0.055
const DISC_THICKNESS = 0.035
const DRAG_DISC_Y = 0.24
const PLATTER_TARGET = { x: 0, z: 0.08, radius: 1.05 }
const TABLE_BOUNDS = { minX: -3.95, maxX: 3.95, minZ: -2.55, maxZ: 2.25 }

const ALBUM_LAYOUT = {
  about:      { x: -3.0, z:  1.75, rotate: -0.42 },
  education:  { x:  2.95, z:  1.55, rotate:  0.34 },
  experience: { x: -3.1, z: -0.45, rotate: -0.24 },
  projects:   { x:  2.95, z: -0.58, rotate:  0.26 },
  skills:     { x: -1.9, z: -1.95, rotate: -0.52 },
  contact:    { x:  2.0, z: -2.0,  rotate:  0.41 },
}

function createCanvasTexture(draw, width = 1024, height = 1024) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  draw(ctx, width, height)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function drawCardPatina(ctx, width, height) {
  ctx.save()

  ctx.globalAlpha = 0.08
  for (let i = 0; i < 1800; i += 1) {
    const shade = Math.floor(180 + Math.random() * 75)
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`
    ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1)
  }

  ctx.globalAlpha = 0.14
  ctx.strokeStyle = 'rgba(0,0,0,0.4)'
  ctx.lineWidth = 14
  ctx.beginPath()
  ctx.arc(width / 2, height / 2, width * 0.36, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(width * 0.03, height * 0.04)
  ctx.lineTo(width * 0.11, height * 0.12)
  ctx.moveTo(width * 0.97, height * 0.04)
  ctx.lineTo(width * 0.89, height * 0.12)
  ctx.moveTo(width * 0.03, height * 0.96)
  ctx.lineTo(width * 0.11, height * 0.88)
  ctx.moveTo(width * 0.97, height * 0.96)
  ctx.lineTo(width * 0.89, height * 0.88)
  ctx.stroke()

  ctx.restore()
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = text.split(/\s+/)
  const lines = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (ctx.measureText(next).width <= maxWidth) {
      current = next
      continue
    }

    if (current) lines.push(current)
    current = word
    if (lines.length === maxLines) break
  }

  if (current && lines.length < maxLines) lines.push(current)
  if (lines.length === maxLines && words.length > 0) {
    const last = lines[maxLines - 1]
    if (last && !last.endsWith('...')) {
      let clipped = last
      while (clipped.length > 3 && ctx.measureText(`${clipped}...`).width > maxWidth) {
        clipped = clipped.slice(0, -1)
      }
      lines[maxLines - 1] = `${clipped.trimEnd()}...`
    }
  }

  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + lineHeight * index)
  })

  return y + lineHeight * lines.length
}

function drawFrontArtwork(ctx, album, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, album.gradientA)
  gradient.addColorStop(1, album.gradientB)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  ctx.save()
  ctx.globalAlpha = 0.88
  ctx.strokeStyle = album.accentColor
  ctx.fillStyle = album.accentColor

  switch (album.id) {
    case 'about': {
      for (let i = 0; i < 4; i += 1) {
        ctx.lineWidth = 2 + i * 1.5
        ctx.globalAlpha = 0.18 + i * 0.1
        ctx.beginPath()
        ctx.arc(width / 2, height / 2, width * (0.14 + i * 0.11), 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.globalAlpha = 0.55
      ctx.beginPath()
      ctx.arc(width / 2, height / 2, width * 0.12, 0, Math.PI * 2)
      ctx.fill()
      break
    }

    case 'education': {
      ctx.globalAlpha = 0.46
      ctx.beginPath()
      ctx.moveTo(width * 0.18, height * 0.34)
      ctx.lineTo(width * 0.5, height * 0.18)
      ctx.lineTo(width * 0.82, height * 0.34)
      ctx.lineTo(width * 0.5, height * 0.48)
      ctx.closePath()
      ctx.fill()
      ctx.fillRect(width * 0.67, height * 0.34, width * 0.03, height * 0.18)
      for (let i = 0; i < 3; i += 1) {
        ctx.globalAlpha = 0.22 + i * 0.07
        ctx.fillRect(width * 0.18, height * (0.68 + i * 0.08), width * 0.42, height * 0.012)
      }
      break
    }

    case 'experience': {
      ctx.globalAlpha = 0.16
      for (let i = 0; i < 5; i += 1) {
        ctx.fillRect(width * (0.14 + i * 0.15), height * (0.62 - i * 0.06), width * 0.09, height * (0.16 + i * 0.05))
      }
      ctx.globalAlpha = 0.82
      ctx.lineWidth = 12
      ctx.beginPath()
      ctx.moveTo(width * 0.13, height * 0.74)
      ctx.lineTo(width * 0.31, height * 0.63)
      ctx.lineTo(width * 0.48, height * 0.51)
      ctx.lineTo(width * 0.65, height * 0.39)
      ctx.lineTo(width * 0.82, height * 0.29)
      ctx.lineTo(width * 0.93, height * 0.17)
      ctx.stroke()

      ctx.globalAlpha = 0.96
      ctx.fillStyle = '#f5e642'
      ctx.beginPath()
      ctx.arc(width * 0.82, height * 0.18, width * 0.1, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1a1200'
      ctx.font = '700 42px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('$4.99', width * 0.82, height * 0.18)
      break
    }

    case 'projects': {
      ctx.globalAlpha = 0.14
      const blocks = [
        [0.10, 0.12, 0.32, 0.28],
        [0.56, 0.12, 0.28, 0.22],
        [0.10, 0.56, 0.22, 0.28],
        [0.54, 0.48, 0.32, 0.34],
      ]
      blocks.forEach(([x, y, w, h]) => {
        ctx.fillRect(width * x, height * y, width * w, height * h)
      })
      ctx.globalAlpha = 0.3
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(width, height)
      ctx.moveTo(width, 0)
      ctx.lineTo(0, height)
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.fillStyle = '#f1f1f1'
      ctx.fillRect(width * 0.06, height * 0.06, width * 0.36, height * 0.16)
      ctx.fillStyle = '#000'
      ctx.font = '900 26px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('PARENTAL', width * 0.24, height * 0.13)
      ctx.fillText('ADVISORY', width * 0.24, height * 0.19)
      break
    }

    case 'skills': {
      const points = []
      const radius = width * 0.26
      for (let i = 0; i < 6; i += 1) {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2
        points.push([
          width / 2 + Math.cos(angle) * radius,
          height / 2 + Math.sin(angle) * radius,
        ])
      }
      ctx.globalAlpha = 0.45
      ctx.lineWidth = 4
      points.forEach(([x, y]) => {
        ctx.beginPath()
        ctx.moveTo(width / 2, height / 2)
        ctx.lineTo(x, y)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(x, y, width * 0.045, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 0.18
      ctx.beginPath()
      points.forEach(([x, y], index) => {
        if (index === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.closePath()
      ctx.fill()
      break
    }

    case 'contact':
    default: {
      ctx.globalAlpha = 0.2
      for (let i = 0; i < 3; i += 1) {
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.arc(width / 2, height / 2, width * (0.14 + i * 0.11), 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.globalAlpha = 0.42
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(width * 0.2, height * 0.32)
      ctx.lineTo(width * 0.5, height * 0.52)
      ctx.lineTo(width * 0.8, height * 0.32)
      ctx.lineTo(width * 0.8, height * 0.72)
      ctx.lineTo(width * 0.2, height * 0.72)
      ctx.closePath()
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(width / 2, height / 2, width * 0.09, 0, Math.PI * 2)
      ctx.fill()
      break
    }
  }

  ctx.restore()

  drawCardPatina(ctx, width, height)

  const footer = ctx.createLinearGradient(0, height * 0.64, 0, height)
  footer.addColorStop(0, 'rgba(5,5,8,0)')
  footer.addColorStop(0.45, 'rgba(5,5,8,0.75)')
  footer.addColorStop(1, 'rgba(5,5,8,0.95)')
  ctx.fillStyle = footer
  ctx.fillRect(0, height * 0.64, width, height * 0.36)

  ctx.textAlign = 'left'
  ctx.fillStyle = 'rgba(240,236,224,0.58)'
  ctx.font = '500 34px "Courier New", monospace'
  ctx.fillText(album.genre.toUpperCase(), width * 0.08, height * 0.82)

  ctx.fillStyle = '#f0ece0'
  ctx.font = '700 58px Georgia'
  ctx.fillText(album.title, width * 0.08, height * 0.9)

  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = 'italic 38px Georgia'
  ctx.textAlign = 'center'
  ctx.fillText('Diego Perez', width * 0.5, height * 0.95)
}

function drawBackArtwork(ctx, album, width, height) {
  const content = portfolioContent[album.id]
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, album.gradientA)
  gradient.addColorStop(0.52, '#131016')
  gradient.addColorStop(1, album.gradientB)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  drawCardPatina(ctx, width, height)

  ctx.fillStyle = 'rgba(255,255,255,0.05)'
  for (let y = 0; y < height; y += 28) {
    ctx.fillRect(0, y, width, 1)
  }

  const margin = width * 0.08
  let cursorY = 88

  ctx.fillStyle = 'rgba(240,236,224,0.56)'
  ctx.font = '500 28px "Courier New", monospace'
  ctx.textAlign = 'left'
  ctx.fillText(album.genre.toUpperCase(), margin, cursorY)

  cursorY += 56
  ctx.fillStyle = '#f6f0e4'
  ctx.font = '700 58px Georgia'
  cursorY = drawWrappedText(ctx, content.heading, margin, cursorY, width - margin * 2, 62, 2)

  cursorY += 12
  ctx.fillStyle = 'rgba(240,236,224,0.42)'
  ctx.font = '500 26px "Courier New", monospace'
  ctx.fillText(`${album.title} · ${album.rpm} RPM · ${album.year}`, margin, cursorY)

  cursorY += 42
  if (content.body) {
    ctx.fillStyle = 'rgba(246,240,228,0.88)'
    ctx.font = '400 28px Georgia'
    cursorY = drawWrappedText(ctx, content.body, margin, cursorY, width - margin * 2, 36, 7)
    cursorY += 26
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(margin, cursorY)
  ctx.lineTo(width - margin, cursorY)
  ctx.stroke()

  cursorY += 34
  for (const track of content.tracks.slice(0, 8)) {
    if (cursorY > height - 110) break

    ctx.fillStyle = 'rgba(240,236,224,0.48)'
    ctx.font = '500 24px "Courier New", monospace'
    ctx.fillText(track.number, margin, cursorY)

    ctx.fillStyle = '#f6f0e4'
    ctx.font = '600 30px Arial'
    const titleX = margin + 60
    const titleMaxWidth = width - margin * 2 - 170
    const title = track.title
    let clippedTitle = title
    while (ctx.measureText(clippedTitle).width > titleMaxWidth && clippedTitle.length > 3) {
      clippedTitle = `${clippedTitle.slice(0, -4)}...`
    }
    ctx.fillText(clippedTitle, titleX, cursorY)

    ctx.fillStyle = 'rgba(240,236,224,0.42)'
    ctx.font = '500 22px "Courier New", monospace'
    ctx.textAlign = 'right'
    ctx.fillText(track.duration, width - margin, cursorY)
    ctx.textAlign = 'left'

    cursorY += 26
    if (track.detail) {
      ctx.fillStyle = 'rgba(240,236,224,0.72)'
      ctx.font = '400 22px Georgia'
      cursorY = drawWrappedText(ctx, track.detail, titleX, cursorY, width - margin - titleX, 28, 2)
    }

    cursorY += 24
  }

  ctx.fillStyle = 'rgba(240,236,224,0.34)'
  ctx.font = '500 24px "Courier New", monospace'
  ctx.fillText('Stereo · 33 1/3 RPM · LP', margin, height - 54)
}

function drawDiscTexture(ctx, album, width, height) {
  ctx.fillStyle = '#07070a'
  ctx.fillRect(0, 0, width, height)

  const center = width / 2
  ctx.save()
  ctx.translate(center, center)

  for (let i = 0; i < 90; i += 1) {
    const radius = center * (0.18 + i * 0.0084)
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(255,255,255,0.024)' : 'rgba(0,0,0,0.22)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
    ctx.stroke()
  }

  const label = ctx.createRadialGradient(0, 0, 0, 0, 0, center * 0.24)
  label.addColorStop(0, album.accentColor)
  label.addColorStop(1, album.color)
  ctx.fillStyle = label
  ctx.beginPath()
  ctx.arc(0, 0, center * 0.24, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#0a0a0d'
  ctx.beginPath()
  ctx.arc(0, 0, center * 0.055, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 14
  ctx.beginPath()
  ctx.arc(0, 0, center * 0.29, 0, Math.PI * 2)
  ctx.stroke()

  ctx.fillStyle = 'rgba(255,255,255,0.82)'
  ctx.font = '700 60px Georgia'
  ctx.textAlign = 'center'
  ctx.fillText(album.genre.toUpperCase(), 0, 22)
  ctx.font = '500 32px "Courier New", monospace'
  ctx.fillText(album.rpm, 0, 70)
  ctx.restore()
}

function createAlbumAssets(album) {
  const frontTexture = createCanvasTexture((ctx, width, height) => drawFrontArtwork(ctx, album, width, height))
  const backTexture = createCanvasTexture((ctx, width, height) => drawBackArtwork(ctx, album, width, height))
  const discTexture = createCanvasTexture((ctx, width, height) => drawDiscTexture(ctx, album, width, height), 768, 768)
  backTexture.center.set(0.5, 0.5)
  backTexture.rotation = Math.PI
  backTexture.needsUpdate = true

  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: '#25190f',
    roughness: 0.92,
    metalness: 0.01,
  })

  const frontMaterial = new THREE.MeshStandardMaterial({
    map: frontTexture,
    roughness: 0.9,
    metalness: 0.02,
  })

  const backMaterial = new THREE.MeshStandardMaterial({
    map: backTexture,
    roughness: 0.9,
    metalness: 0.02,
  })

  const sleeveMaterials = [
    edgeMaterial,
    edgeMaterial,
    frontMaterial,
    backMaterial,
    edgeMaterial,
    edgeMaterial,
  ]

  const discSideMaterial = new THREE.MeshStandardMaterial({
    color: '#09090d',
    roughness: 0.52,
    metalness: 0.08,
  })

  const discTopMaterial = new THREE.MeshStandardMaterial({
    map: discTexture,
    roughness: 0.36,
    metalness: 0.08,
  })

  const discBottomMaterial = new THREE.MeshStandardMaterial({
    color: '#09090d',
    roughness: 0.58,
    metalness: 0.02,
  })

  return {
    sleeveMaterials,
    discMaterials: [discSideMaterial, discTopMaterial, discBottomMaterial],
  }
}

function AlbumSleeve({
  album,
  asset,
  layout,
  size,
  isSelected,
  isFlipped,
  inspectMode,
  discOnPlatter,
  onPress,
}) {
  const groupRef = useRef()
  const dragStartRef = useRef(null)
  const [inspectRotation, setInspectRotation] = useState({ x: 0, y: 0 })
  const camera = useThree(state => state.camera)

  useEffect(() => {
    if (!isSelected || !inspectMode) {
      setInspectRotation({ x: 0, y: 0 })
    }
  }, [isSelected, inspectMode, album.id])

  useFrame((_, delta) => {
    if (!groupRef.current) return

    if (isSelected && inspectMode) {
      const inspectPosition = new THREE.Vector3(0, 0.2, -2.35)
        .applyQuaternion(camera.quaternion)
        .add(camera.position)
      const targetQuaternion = camera.quaternion.clone().multiply(
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(
            -Math.PI / 2 + (isFlipped ? Math.PI : 0) + inspectRotation.x,
            inspectRotation.y,
            0,
            'XYZ'
          )
        )
      )
      const targetScale = 1.48

      groupRef.current.position.lerp(inspectPosition, Math.min(delta * 7, 1))
      groupRef.current.quaternion.slerp(targetQuaternion, Math.min(delta * 7, 1))
      groupRef.current.scale.x = THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 6, delta)
      groupRef.current.scale.y = THREE.MathUtils.damp(groupRef.current.scale.y, targetScale, 6, delta)
      groupRef.current.scale.z = THREE.MathUtils.damp(groupRef.current.scale.z, targetScale, 6, delta)
      return
    }

    const targetY = TABLE_TOP_Y + ALBUM_THICKNESS / 2 + (isSelected ? (isFlipped ? 0.58 : 0.06) : 0.003)
    const targetScale = isSelected ? (isFlipped ? 1.14 : 1.06) : 1
    const targetRotX = isFlipped ? Math.PI : 0

    groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, layout.x, 6, delta)
    groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, targetY, 7, delta)
    groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, layout.z, 6, delta)
    groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetRotX, 7, delta)
    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, layout.rotate, 6, delta)
    groupRef.current.rotation.z = THREE.MathUtils.damp(groupRef.current.rotation.z, 0, 7, delta)
    groupRef.current.scale.x = THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 6, delta)
    groupRef.current.scale.y = THREE.MathUtils.damp(groupRef.current.scale.y, targetScale, 6, delta)
    groupRef.current.scale.z = THREE.MathUtils.damp(groupRef.current.scale.z, targetScale, 6, delta)
  })

  return (
    <group
      ref={groupRef}
      position={[layout.x, TABLE_TOP_Y + ALBUM_THICKNESS / 2, layout.z]}
      rotation={[0, layout.rotate, 0]}
    >
      {isSelected && !inspectMode && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -ALBUM_THICKNESS / 2 - 0.026, 0]}>
          <ringGeometry args={[size * 0.43, size * 0.52, 40]} />
          <meshBasicMaterial color={album.accentColor} transparent opacity={discOnPlatter ? 0.2 : 0.34} />
        </mesh>
      )}

      <mesh
        castShadow
        receiveShadow
        material={asset.sleeveMaterials}
        onPointerDown={(event) => {
          event.stopPropagation()
          if (isSelected && inspectMode) {
            event.target.setPointerCapture(event.pointerId)
            dragStartRef.current = {
              x: event.clientX,
              y: event.clientY,
              rotationX: inspectRotation.x,
              rotationY: inspectRotation.y,
            }
            document.body.style.cursor = 'grabbing'
            return
          }
          onPress?.()
        }}
        onPointerMove={(event) => {
          if (!dragStartRef.current || !isSelected || !inspectMode) return
          event.stopPropagation()

          const deltaX = event.clientX - dragStartRef.current.x
          const deltaY = event.clientY - dragStartRef.current.y

          setInspectRotation({
            x: THREE.MathUtils.clamp(dragStartRef.current.rotationX + deltaY * 0.008, -1.2, 1.2),
            y: dragStartRef.current.rotationY + deltaX * 0.01,
          })
        }}
        onPointerUp={(event) => {
          if (dragStartRef.current && event.target.hasPointerCapture?.(event.pointerId)) {
            event.target.releasePointerCapture(event.pointerId)
          }
          dragStartRef.current = null
          document.body.style.cursor = isSelected ? 'grab' : 'pointer'
        }}
        onPointerCancel={(event) => {
          if (dragStartRef.current && event.target.hasPointerCapture?.(event.pointerId)) {
            event.target.releasePointerCapture(event.pointerId)
          }
          dragStartRef.current = null
          document.body.style.cursor = ''
        }}
        onPointerEnter={() => {
          document.body.style.cursor = isSelected && inspectMode ? 'grab' : 'pointer'
        }}
        onPointerLeave={() => {
          if (!dragStartRef.current) document.body.style.cursor = ''
        }}
      >
        <boxGeometry args={[size, ALBUM_THICKNESS, size]} />
      </mesh>
    </group>
  )
}

// Y where the disc rests when sitting on top of the sleeve (before being picked up)
const DISC_ON_SLEEVE_Y = TABLE_TOP_Y + ALBUM_THICKNESS + DISC_THICKNESS / 2

function LooseDisc({ asset, origin, sleeveOrigin, size, onPlace, onDraggingChange }) {
  const discRef = useRef()
  // Start at the sleeve position so the disc slides out on mount
  const positionRef = useRef(sleeveOrigin)
  const dragPlane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), -DRAG_DISC_Y),
    []
  )
  const dragPoint = useMemo(() => new THREE.Vector3(), [])
  const [dragging, setDragging] = useState(false)
  const [position, setPosition] = useState(sleeveOrigin)
  // emerged = false while the disc is still animating out of the sleeve
  const [emerged, setEmerged] = useState(false)

  useEffect(() => {
    positionRef.current = position
  }, [position])

  useEffect(() => {
    return () => {
      document.body.style.cursor = ''
      onDraggingChange?.(false)
    }
  }, [onDraggingChange])

  useEffect(() => {
    if (!asset?.discMaterials) return

    asset.discMaterials.forEach((material) => {
      material.depthTest = !dragging
      material.depthWrite = !dragging
      material.transparent = dragging
      material.needsUpdate = true
    })

    if (discRef.current) {
      discRef.current.renderOrder = dragging ? 80 : 0
    }
  }, [asset, dragging])

  useFrame((_, delta) => {
    if (!discRef.current) return
    if (dragging) return

    if (!emerged) {
      // Slide the disc out of the sleeve toward the rest position
      const speed = 4.5
      discRef.current.position.x = THREE.MathUtils.damp(discRef.current.position.x, origin[0], speed, delta)
      discRef.current.position.y = THREE.MathUtils.damp(discRef.current.position.y, origin[1], speed, delta)
      discRef.current.position.z = THREE.MathUtils.damp(discRef.current.position.z, origin[2], speed, delta)
      discRef.current.rotation.y = THREE.MathUtils.damp(discRef.current.rotation.y, origin[3], speed, delta)

      const dist = Math.hypot(
        discRef.current.position.x - origin[0],
        discRef.current.position.y - origin[1],
        discRef.current.position.z - origin[2]
      )
      if (dist < 0.025) setEmerged(true)
      return
    }

    discRef.current.position.x = origin[0]
    discRef.current.position.y = origin[1]
    discRef.current.position.z = origin[2]
    discRef.current.rotation.y = origin[3]
  })

  return (
    <mesh
      ref={discRef}
      castShadow
      receiveShadow
      material={asset.discMaterials}
      position={[position[0], position[1], position[2]]}
      rotation={[0, position[3], 0]}
      onPointerDown={!emerged ? undefined : (event) => {
        event.stopPropagation()
        event.target.setPointerCapture(event.pointerId)
        document.body.style.cursor = 'grabbing'
        setDragging(true)
        onDraggingChange?.(true)
      }}
      onPointerMove={!emerged ? undefined : (event) => {
        if (!dragging) return
        event.stopPropagation()

        if (event.ray.intersectPlane(dragPlane, dragPoint)) {
          const nextPosition = [
            THREE.MathUtils.clamp(dragPoint.x, TABLE_BOUNDS.minX, TABLE_BOUNDS.maxX),
            DRAG_DISC_Y,
            THREE.MathUtils.clamp(dragPoint.z, TABLE_BOUNDS.minZ, TABLE_BOUNDS.maxZ),
            discRef.current?.rotation.y ?? origin[3],
          ]
          positionRef.current = nextPosition
          setPosition(nextPosition)
        }
      }}
      onPointerUp={!emerged ? undefined : (event) => {
        if (!dragging) return

        event.stopPropagation()
        event.target.releasePointerCapture(event.pointerId)
        document.body.style.cursor = ''
        setDragging(false)
        onDraggingChange?.(false)

        const dx = positionRef.current[0] - PLATTER_TARGET.x
        const dz = positionRef.current[2] - PLATTER_TARGET.z
        if (Math.hypot(dx, dz) <= PLATTER_TARGET.radius) {
          onPlace?.()
          positionRef.current = origin
          setPosition(origin)
          return
        }

        positionRef.current = origin
        setPosition(origin)
      }}
      onPointerCancel={!emerged ? undefined : (event) => {
        if (!dragging) return
        event.stopPropagation()
        if (event.target.hasPointerCapture?.(event.pointerId)) {
          event.target.releasePointerCapture(event.pointerId)
        }
        document.body.style.cursor = ''
        setDragging(false)
        onDraggingChange?.(false)
        positionRef.current = origin
        setPosition(origin)
      }}
      onPointerEnter={!emerged ? undefined : () => { if (!dragging) document.body.style.cursor = 'grab' }}
      onPointerLeave={!emerged ? undefined : () => { if (!dragging) document.body.style.cursor = '' }}
    >
      <cylinderGeometry args={[size * 0.48, size * 0.48, DISC_THICKNESS, 64]} />
    </mesh>
  )
}

export function SimulatorAlbums3D({
  albums,
  selectedIndex,
  simulatorAlbumFlipped = false,
  simulatorInspectMode = false,
  discOnPlatter,
  isEjecting,
  onSelectAlbum,
  onPlaceDisc,
  onDraggingChange,
}) {
  const { size: viewportSize } = useThree()
  const compact = viewportSize.width < 900

  const albumSize = compact ? 0.96 : 1.16
  const layoutScale = compact ? 0.86 : 1

  const assets = useMemo(
    () => Object.fromEntries(albums.map((album) => [album.id, createAlbumAssets(album)])),
    [albums]
  )

  const selectedAlbum = selectedIndex !== null ? albums[selectedIndex] : null
  const selectedLayout = selectedAlbum ? ALBUM_LAYOUT[selectedAlbum.id] : null

  // Where the disc rests once extracted (beside the sleeve)
  const looseDiscOrigin = useMemo(() => {
    if (!selectedAlbum || !selectedLayout) return null

    const sideOffset = albumSize * 0.43
    const dx = Math.cos(selectedLayout.rotate) * sideOffset
    const dz = -Math.sin(selectedLayout.rotate) * sideOffset

    return [
      selectedLayout.x * layoutScale + dx,
      DRAG_DISC_Y,
      selectedLayout.z * layoutScale + dz,
      selectedLayout.rotate - 0.18,
    ]
  }, [albumSize, layoutScale, selectedAlbum, selectedLayout])

  // Where the disc starts — sitting on top of the sleeve before being pulled out
  const sleeveOrigin = useMemo(() => {
    if (!selectedAlbum || !selectedLayout) return null
    return [
      selectedLayout.x * layoutScale,
      DISC_ON_SLEEVE_Y,
      selectedLayout.z * layoutScale,
      selectedLayout.rotate,
    ]
  }, [layoutScale, selectedAlbum, selectedLayout])

  return (
    <group>
      {albums.map((album, index) => {
        const layout = ALBUM_LAYOUT[album.id]

        return (
          <AlbumSleeve
            key={album.id}
            album={album}
            asset={assets[album.id]}
            layout={{
              x: layout.x * layoutScale,
              z: layout.z * layoutScale,
              rotate: layout.rotate,
            }}
            size={albumSize}
            isSelected={index === selectedIndex}
            isFlipped={index === selectedIndex && simulatorAlbumFlipped}
            inspectMode={index === selectedIndex && simulatorInspectMode}
            discOnPlatter={discOnPlatter}
            onPress={() => onSelectAlbum?.(index)}
          />
        )
      })}

      {selectedAlbum && looseDiscOrigin && sleeveOrigin && !simulatorInspectMode && !discOnPlatter && !isEjecting && !simulatorAlbumFlipped && (
        <LooseDisc
          key={selectedAlbum.id}
          asset={assets[selectedAlbum.id]}
          origin={looseDiscOrigin}
          sleeveOrigin={sleeveOrigin}
          size={albumSize}
          onPlace={onPlaceDisc}
          onDraggingChange={onDraggingChange}
        />
      )}
    </group>
  )
}
