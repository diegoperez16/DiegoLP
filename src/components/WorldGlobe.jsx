import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import island from '../data/puertoRicoCoast.json'

/* The globe for "Who am I", laid out like Aceternity's 3D Globe demo: the Earth rises as a dome across the
   bottom of the card at a fixed zoom, turning slowly, with a photo-bubble marker on a thin line standing on
   Puerto Rico. NASA's Blue Marble texture (public domain, self-hosted) on a standard material with the topology
   bump map. The canvas is a layer the size of the whole card, so only the card ever clips the globe; the dome's
   placement comes from a projection offset, not from moving the canvas. Drag sideways to spin; the photo bubble
   opens /me.html. */

export const HOME = { lat: 18.2011, lon: -67.1397, label: 'Mayagüez, Puerto Rico' }
const ISLAND = { lat: 18.22, lon: -66.45 }
const RADIUS = 1
const FOV = 24   // narrow, so the marker (which leans toward the camera) is not blown up by perspective and stays inside the card
const INTRO_SECONDS = 3.2
const RIM = { up: 1.0, right: -0.06 }            // radians: the island sits near the top of the dome, just left of centre, in the gap between the copy and the seal
const CENTRE = { x: 0.04, y: 0.5 }                // globe centre as a fraction of the card from its middle: on the bottom edge
const TEXTURES = ['/images/earth/earth-blue-marble.jpg', '/images/earth/earth-topology.png']
const PHOTO = '/images/diego-bubble.jpg'

/* Lat/lng → position on a three.js SphereGeometry so the equirectangular texture lines up. */
function latLng(lat, lng, radius = RADIUS) {
  const phi = THREE.MathUtils.degToRad(90 - lat)
  const theta = THREE.MathUtils.degToRad(lng + 180)
  return new THREE.Vector3(-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta))
}

const ease = t => (t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 3))

function Earth() {
  const [map, bump] = useTexture(TEXTURES)
  useMemo(() => { map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 16; bump.anisotropy = 8 }, [map, bump])
  return (
    <mesh>
      <sphereGeometry args={[RADIUS, 96, 96]} />
      <meshStandardMaterial map={map} bumpMap={bump} bumpScale={0.05} roughness={0.7} metalness={0} />
    </mesh>
  )
}

function EarthFallback() {
  return <mesh><sphereGeometry args={[RADIUS, 48, 32]} /><meshStandardMaterial color="#10243f" roughness={0.9} /></mesh>
}

/* Puerto Rico's shoreline (Natural Earth 10m, public domain) traced just above the surface. */
function Coastline({ revealRef }) {
  const line = useRef()
  const geometry = useMemo(() => {
    const points = []
    for (let i = 0; i < island.coast.length; i += 2) points.push(latLng(island.coast[i] / 1000, island.coast[i + 1] / 1000, RADIUS * 1.004))
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [])
  useFrame(() => { if (line.current) line.current.material.opacity = 0.9 * revealRef.current })
  return <line ref={line} geometry={geometry}><lineBasicMaterial color="#e6ebf5" transparent opacity={0} depthWrite={false} /></line>
}

/* The marker: a red dot on the island, a thin line rising along the surface normal, and Diego's photo in a
   bubble on top. The bubble is a real link drawn over the scene (a native click and a reliable new tab beat a
   raycast against a small sprite); it grows out of the surface once the globe has turned to face home and
   hides while the island is round the back. */
function Marker({ revealRef, setHover, href }) {
  const line = useRef()
  const dot = useRef()
  const bubble = useRef()
  const surface = useMemo(() => latLng(ISLAND.lat, ISLAND.lon, RADIUS * 1.002), [])
  const normal = useMemo(() => surface.clone().normalize(), [surface])
  const HEIGHT = 0.24
  const top = useMemo(() => surface.clone().addScaledVector(normal, HEIGHT + 0.03), [surface, normal])
  const lineGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints([surface, surface.clone().addScaledVector(normal, HEIGHT)]), [surface, normal])
  const scratch = useMemo(() => ({ world: new THREE.Vector3(), toCamera: new THREE.Vector3() }), [])
  useFrame(({ camera }) => {
    if (!line.current) return
    scratch.world.copy(normal).transformDirection(line.current.parent.matrixWorld)
    scratch.toCamera.copy(camera.position).normalize()
    const facing = THREE.MathUtils.smoothstep(scratch.world.dot(scratch.toCamera), 0.05, 0.3)
    const reveal = revealRef.current * facing
    const grow = ease(revealRef.current)
    line.current.material.opacity = 0.85 * reveal
    line.current.geometry.setFromPoints([surface, surface.clone().addScaledVector(normal, HEIGHT * grow)])
    if (dot.current) dot.current.material.opacity = reveal
    if (bubble.current) {
      bubble.current.style.opacity = String(reveal)
      bubble.current.style.transform = `scale(${0.6 + 0.4 * grow})`
      bubble.current.style.pointerEvents = reveal > 0.5 ? 'auto' : 'none'
    }
  })
  return (
    <>
      <mesh ref={dot} position={surface}><sphereGeometry args={[0.007, 16, 12]} /><meshBasicMaterial color="#ff6a52" transparent opacity={0} /></mesh>
      <line ref={line} geometry={lineGeometry}><lineBasicMaterial color="#d9dce6" transparent opacity={0} depthWrite={false} /></line>
      <Html position={top} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <a ref={bubble} className="globe-bubble" href={href} target="_blank" rel="noopener" aria-label="Open the rest about Diego in a new tab" style={{ opacity: 0 }}
          onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
          /* The globe may still be easing to a stop, so the bubble can drift between press and release. Capturing the
             pointer on press keeps the release on the bubble, so the very first click counts. */
          onPointerDown={event => { try { event.currentTarget.setPointerCapture(event.pointerId) } catch { /* not supported */ } }}>
          <img src={PHOTO} alt="" draggable="false" />
        </a>
      </Html>
    </>
  )
}

/* Diego's flag (public/images/pr-flag.svg), planted on the island beside the marker: a thin pole and a small
   cloth that ripples in the vertex positions every frame, freest at its far edge. */
function Flag({ revealRef }) {
  const group = useRef()
  const [texture, setTexture] = useState(null)
  useEffect(() => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 600; canvas.height = 400
      canvas.getContext('2d').drawImage(image, 0, 0, 600, 400)
      const made = new THREE.CanvasTexture(canvas)
      made.colorSpace = THREE.SRGBColorSpace
      made.anisotropy = 4
      setTexture(made)
    }
    image.src = '/images/pr-flag.svg'
  }, [])
  const base = useMemo(() => latLng(ISLAND.lat, ISLAND.lon + 0.9, RADIUS * 1.002), [])   // a little east of the marker's dot
  const quaternion = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), base.clone().normalize()), [base])
  const WIDTH = 0.078, HEIGHT = 0.052, POLE = 0.11
  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(WIDTH, HEIGHT, 28, 12)
    plane.translate(WIDTH / 2, POLE - HEIGHT / 2, 0)   // hoist at the pole, cloth to +x
    return plane
  }, [])
  const rest = useMemo(() => geometry.attributes.position.array.slice(), [geometry])
  useFrame(({ clock }) => {
    if (!group.current) return
    group.current.scale.setScalar(Math.max(0.0001, ease(revealRef.current)))
    const positions = geometry.attributes.position
    const t = clock.elapsedTime
    for (let i = 0; i < positions.count; i++) {
      const x = rest[i * 3], y = rest[i * 3 + 1]
      const along = x / WIDTH
      positions.array[i * 3 + 2] = Math.sin(along * 6.5 - t * 4.2 + y * 8) * 0.006 * along + Math.sin(along * 3.1 - t * 2.7) * 0.003 * along
    }
    positions.needsUpdate = true
    geometry.computeVertexNormals()
  })
  return (
    <group ref={group} position={base} quaternion={quaternion}>
      <mesh position={[0, POLE / 2, 0]}><cylinderGeometry args={[0.0016, 0.0022, POLE, 8]} /><meshStandardMaterial color="#dfe2e8" roughness={0.5} metalness={0.4} /></mesh>
      <mesh position={[0, POLE + 0.004, 0]}><sphereGeometry args={[0.004, 12, 8]} /><meshStandardMaterial color="#dfe2e8" roughness={0.4} metalness={0.6} /></mesh>
      <mesh geometry={geometry} renderOrder={2}>
        {texture ? <meshStandardMaterial key="flag" map={texture} side={THREE.DoubleSide} roughness={0.85} /> : <meshStandardMaterial key="plain" color="#ce0000" side={THREE.DoubleSide} />}
      </mesh>
    </group>
  )
}

function Globe({ active, meHref, setHover, onIntroDone, hovering, stacked }) {
  const globe = useRef()
  const key = useRef()
  const fill = useRef()
  const controls = useRef()
  const revealRef = useRef(0)
  const startRef = useRef(null)
  const doneRef = useRef(false)
  const lightOffset = useMemo(() => ({ key: new THREE.Vector3(2.6, 2.2, 0.8), fill: new THREE.Vector3(-3, 1, -4) }), [])
  // OrbitControls writes touch-action: none onto its element every time it connects, which froze page scrolling
  // anywhere on the card on phones. Portfolio.css pins .globe-stage and everything in it to pan-y instead.
  // Spin about Y to bring the island's meridian to the front, tilt about X so it sits near the top of the dome.
  const home = useMemo(() => latLng(ISLAND.lat, ISLAND.lon), [])
  const finalY = -Math.atan2(home.x, home.z) + RIM.right
  const finalX = THREE.MathUtils.degToRad(ISLAND.lat) - RIM.up

  useFrame(state => {
    if (!globe.current) return
    const { width, height } = state.size
    // Fixed zoom: the globe's radius is 45% of the card's width, and its centre sits on the card's bottom edge.
    // Phones get a bigger globe (radius ≈ 75% of the card width) so the island and the flag stay legible.
    const wanted = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * (width / height) * (stacked ? 1.5 : 0.9)
    const distance = Math.max(1.35, 1 / Math.sin(Math.atan(wanted)))
    state.camera.setViewOffset(width, height, -CENTRE.x * width, -CENTRE.y * height, width, height)
    if (key.current) key.current.position.copy(state.camera.localToWorld(lightOffset.key.clone()))
    if (fill.current) fill.current.position.copy(state.camera.localToWorld(lightOffset.fill.clone()))
    if (controls.current) { controls.current.minDistance = distance; controls.current.maxDistance = distance; controls.current.autoRotate = doneRef.current && !hovering.current; controls.current.enableDamping = !hovering.current }
    if (startRef.current === null && active) startRef.current = state.clock.elapsedTime
    const since = startRef.current === null ? 0 : state.clock.elapsedTime - startRef.current
    if (doneRef.current) return
    const p = ease(since / INTRO_SECONDS)
    globe.current.rotation.set(finalX, finalY - (1 - p) * 1.6, 0)
    revealRef.current = Math.min(1, Math.max(0, (since - INTRO_SECONDS * 0.75) / (INTRO_SECONDS * 0.4)))
    state.camera.position.set(0, 0, distance)
    state.camera.lookAt(0, 0, 0)
    if (since > INTRO_SECONDS * 1.2) { doneRef.current = true; revealRef.current = 1; onIntroDone() }
  })

  return (
    <>
      <ambientLight intensity={1.15} />
      <hemisphereLight args={['#dfe9ff', '#1a1208', 0.5]} />
      <directionalLight ref={key} position={[5, 2, 5]} intensity={2.6} color="#fff4e6" />
      <directionalLight ref={fill} position={[-3, 1, -2]} intensity={0.8} color="#88ccff" />
      <group ref={globe}>
        <Suspense fallback={<EarthFallback />}><Earth /></Suspense>
        <Coastline revealRef={revealRef} />
        <Marker revealRef={revealRef} setHover={setHover} href={meHref} />
        <Flag revealRef={revealRef} />
      </group>
      {/* Slow turn; drag to spin or tilt (orbiting never moves the dome's silhouette, only what faces you). */}
      <OrbitControls ref={controls} enablePan={false} enableZoom={false} enableDamping dampingFactor={0.08} rotateSpeed={0.35} autoRotateSpeed={0.35} minPolarAngle={0.2} maxPolarAngle={Math.PI - 0.2} target={[0, 0, 0]} />
    </>
  )
}

export default function WorldGlobe({ active = true, meHref = '/me.html' }) {
  const [started, setStarted] = useState(false)
  const [introDone, setIntroDone] = useState(false)
  const [hover, setHover] = useState(false)
  const hovering = useRef(false)
  const [stacked, setStacked] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 950px)').matches)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 950px)')
    const update = () => setStacked(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  useEffect(() => { if (active) setStarted(true) }, [active])
  return (
    <div className={`globe-stage${introDone ? ' globe-stage--live' : ''}`} style={{ cursor: hover ? 'pointer' : introDone ? 'grab' : 'default' }}
      onPointerEnter={() => { hovering.current = true }} onPointerLeave={() => { hovering.current = false }}>
      <Canvas frameloop={active ? 'always' : 'never'} camera={{ position: [0, 0, 3], fov: FOV, near: 0.05, far: 50 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }} style={{ touchAction: 'pan-y' }}>
        <Globe active={started} meHref={meHref} setHover={setHover} onIntroDone={() => setIntroDone(true)} hovering={hovering} stacked={stacked} />
      </Canvas>
    </div>
  )
}
