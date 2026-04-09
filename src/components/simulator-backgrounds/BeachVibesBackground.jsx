import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment, Sky } from '@react-three/drei'
import * as THREE from 'three'

const OCEAN_WIDTH = 920
const OCEAN_DEPTH = 440
const OCEAN_NEAR_EDGE_Z = -12
const OCEAN_CENTER_Z = OCEAN_NEAR_EDGE_Z - OCEAN_DEPTH / 2
const OCEAN_SURFACE_Y = -2.78
const SHORELINE_Y = -2.66

function buildFoamTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 128
  const ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const band = ctx.createLinearGradient(0, 0, 0, canvas.height)
  band.addColorStop(0, 'rgba(255,255,255,0)')
  band.addColorStop(0.22, 'rgba(255,255,255,0.14)')
  band.addColorStop(0.45, 'rgba(255,255,255,0.92)')
  band.addColorStop(0.62, 'rgba(255,255,255,0.42)')
  band.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = band
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (let i = 0; i < 220; i += 1) {
    const x = Math.random() * canvas.width
    const width = 22 + Math.random() * 90
    const y = canvas.height * (0.34 + Math.random() * 0.24)
    const alpha = 0.025 + Math.random() * 0.07

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.bezierCurveTo(
      x + width * 0.2,
      y - 4 - Math.random() * 10,
      x + width * 0.8,
      y + 4 + Math.random() * 10,
      x + width,
      y + (Math.random() - 0.5) * 10,
    )
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`
    ctx.lineWidth = 1.1 + Math.random() * 2.8
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.repeat.set(2.4, 1)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function buildGlowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(256, 256, 24, 256, 256, 256)

  gradient.addColorStop(0, 'rgba(255,250,218,0.96)')
  gradient.addColorStop(0.24, 'rgba(255,216,148,0.78)')
  gradient.addColorStop(0.52, 'rgba(255,164,108,0.34)')
  gradient.addColorStop(1, 'rgba(255,164,108,0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function AnimatedOcean({ isPlaying }) {
  const materialRef = useRef()

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(OCEAN_WIDTH, OCEAN_DEPTH, 180, 84),
    [],
  )

  const basePositions = useMemo(
    () => Float32Array.from(geometry.attributes.position.array),
    [geometry],
  )

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((state) => {
    const time = state.clock.elapsedTime
    const positions = geometry.attributes.position.array
    const travelSpeed = isPlaying ? 2.35 : 1.75

    for (let i = 0; i < positions.length; i += 3) {
      const x = basePositions[i]
      const y = basePositions[i + 1]
      const shoreDistance = (y + OCEAN_DEPTH * 0.5) / OCEAN_DEPTH
      const deepWater = THREE.MathUtils.smoothstep(shoreDistance, 0.2, 0.98)
      const shoulder = Math.exp(-Math.pow(shoreDistance - 0.22, 2) / 0.01)

      const rollingSet = Math.sin(
        shoreDistance * 17 + time * travelSpeed + Math.sin(x * 0.012 + time * 0.12) * 0.8,
      )
      const secondarySet = Math.sin(shoreDistance * 31 + time * (travelSpeed * 1.55) + x * 0.018)
      const crossChop = Math.cos(x * 0.05 - time * 0.75 + shoreDistance * 5.5)
      const breaker = Math.sin(shoreDistance * 46 + time * (travelSpeed * 2.05) + x * 0.014) * shoulder

      positions[i + 2] = (
        rollingSet * (0.08 + deepWater * 0.2) +
        secondarySet * (0.03 + deepWater * 0.06) +
        crossChop * (0.015 + deepWater * 0.02) +
        breaker * 0.15
      )
    }

    geometry.attributes.position.needsUpdate = true
    geometry.computeVertexNormals()

    if (materialRef.current) {
      const targetEmissive = isPlaying ? 0.22 : 0.16
      materialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        materialRef.current.emissiveIntensity,
        targetEmissive,
        0.06,
      )
    }
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, OCEAN_SURFACE_Y, OCEAN_CENTER_Z]} receiveShadow>
      <primitive object={geometry} attach="geometry" />
      <meshPhysicalMaterial
        ref={materialRef}
        color="#1180a2"
        roughness={0.14}
        metalness={0.08}
        clearcoat={1}
        clearcoatRoughness={0.2}
        reflectivity={0.4}
        envMapIntensity={0.5}
        emissive="#5db2c0"
        emissiveIntensity={0.16}
      />
    </mesh>
  )
}

function FoamBreak({ offset, foamTexture, isPlaying }) {
  const meshRef = useRef()

  const geometry = useMemo(() => new THREE.PlaneGeometry(520, 18, 96, 1), [])
  const basePositions = useMemo(
    () => Float32Array.from(geometry.attributes.position.array),
    [geometry],
  )

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((state) => {
    const time = state.clock.elapsedTime
    const progress = (time * (isPlaying ? 0.072 : 0.054) + offset) % 1
    const positions = geometry.attributes.position.array

    for (let i = 0; i < positions.length; i += 3) {
      const x = basePositions[i]
      const y = basePositions[i + 1]
      const bandFalloff = 1 - Math.abs(y) / 9
      const ripple = Math.sin(x * 0.046 + time * 3.2 + offset * 11) * 0.16
      const flutter = Math.sin(x * 0.02 - time * 1.1 + progress * 7) * 0.07
      positions[i + 2] = (ripple + flutter) * bandFalloff
    }

    geometry.attributes.position.needsUpdate = true

    if (!meshRef.current) return

    meshRef.current.position.z = THREE.MathUtils.lerp(-312, -58, progress)
    meshRef.current.position.x = Math.sin(progress * Math.PI * 2 + offset * 9) * 16
    meshRef.current.position.y = OCEAN_SURFACE_Y + 0.1 + progress * 0.08
    meshRef.current.scale.x = THREE.MathUtils.lerp(0.62, 1.16, progress)
    meshRef.current.scale.y = THREE.MathUtils.lerp(0.86, 1.14, progress)
    meshRef.current.material.opacity = Math.pow(Math.sin(progress * Math.PI), 1.35) * (isPlaying ? 0.34 : 0.26)
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
      <primitive object={geometry} attach="geometry" />
      <meshBasicMaterial
        map={foamTexture}
        color="#ffffff"
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  )
}

function FoamBreakers({ isPlaying }) {
  const foamTexture = useMemo(buildFoamTexture, [])

  useEffect(() => () => foamTexture.dispose(), [foamTexture])

  return (
    <>
      {[0.04, 0.22, 0.4, 0.61, 0.82].map((offset) => (
        <FoamBreak key={offset} offset={offset} foamTexture={foamTexture} isPlaying={isPlaying} />
      ))}
    </>
  )
}

function ShallowWaterTint() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, OCEAN_SURFACE_Y + 0.04, -58]} renderOrder={2}>
      <planeGeometry args={[920, 132]} />
      <meshBasicMaterial
        color="#74d3d8"
        transparent
        opacity={0.42}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}

function SunGlow() {
  const glowTexture = useMemo(buildGlowTexture, [])

  useEffect(() => () => glowTexture.dispose(), [glowTexture])

  return (
    <>
      <mesh position={[6, 26, -365]} renderOrder={1}>
        <planeGeometry args={[170, 170]} />
        <meshBasicMaterial
          map={glowTexture}
          transparent
          opacity={0.9}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 10, -300]} renderOrder={1}>
        <planeGeometry args={[500, 96]} />
        <meshBasicMaterial color="#ffbf7e" transparent opacity={0.13} depthWrite={false} toneMapped={false} />
      </mesh>
    </>
  )
}

function Shoreline() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, SHORELINE_Y, 8]} receiveShadow>
        <planeGeometry args={[840, 34]} />
        <meshStandardMaterial color="#b89570" roughness={0.34} metalness={0.04} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, SHORELINE_Y - 0.02, 132]} receiveShadow>
        <planeGeometry args={[900, 220]} />
        <meshStandardMaterial color="#d6b289" roughness={0.96} metalness={0.01} />
      </mesh>
    </>
  )
}

function DistantHeadland() {
  const ridge = useMemo(
    () => [
      [-210, 7, -332, 88, 18, '#7990a0'],
      [-118, 10, -342, 72, 22, '#73889b'],
      [98, 8, -336, 82, 20, '#7b8fa1'],
      [198, 6, -328, 96, 16, '#8195a7'],
    ],
    [],
  )

  return (
    <group>
      {ridge.map(([x, y, z, width, height, color]) => (
        <mesh key={`${x}-${z}`} position={[x, y, z]} scale={[width, height, 14]}>
          <sphereGeometry args={[1, 18, 12]} />
          <meshStandardMaterial color={color} roughness={0.95} metalness={0} transparent opacity={0.55} />
        </mesh>
      ))}
    </group>
  )
}

export function BeachVibesBackground({ isPlaying = false }) {
  return (
    <>
      <color attach="background" args={['#74c3db']} />
      <fog attach="fog" args={['#c6ddd9', 42, 320]} />
      <Environment preset="sunset" environmentIntensity={0.28} />

      <Sky
        distance={450000}
        sunPosition={[3.5, 1.2, -10]}
        turbidity={5.8}
        rayleigh={1.1}
        mieCoefficient={0.006}
        mieDirectionalG={0.82}
      />

      <SunGlow />
      <DistantHeadland />
      <AnimatedOcean isPlaying={isPlaying} />
      <ShallowWaterTint />
      <FoamBreakers isPlaying={isPlaying} />
      <Shoreline />
    </>
  )
}
