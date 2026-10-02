import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { TurntableModel, PLATTER_CENTRE, PLATTER_TOP_Y } from '../TurntableModel'
import { StudioEnvironment } from '../StudioEnvironment'
import { useMusic } from '../../music/MusicProvider'
import Icon from '../Icon'
import './MusicTurntable.css'

const MODEL_URL = '/models/storybook-turntable.glb'

function useCoverTexture(url) {
  const [texture, setTexture] = useState(null)
  useEffect(() => {
    let active = true
    let owned = null
    setTexture(null)
    if (url) new THREE.TextureLoader().load(url, value => {
      if (!active) { value.dispose(); return }
      value.colorSpace = THREE.SRGBColorSpace
      value.anisotropy = 8
      owned = value
      setTexture(value)
    }, undefined, () => { if (active) setTexture(null) })
    return () => { active = false; owned?.dispose() }
  }, [url])
  return texture
}

function PictureDisc({ coverUrl, playing }) {
  const texture = useCoverTexture(coverUrl)
  const discRef = useRef(null)
  const speed = useRef(0)
  const grooves = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 512
    const context = canvas.getContext('2d')
    context.strokeStyle = 'rgba(150,140,135,0.28)'
    context.lineWidth = 0.8
    for (let radius = 75; radius < 253; radius += 3) {
      context.beginPath(); context.arc(256, 256, radius, 0, Math.PI * 2); context.stroke()
    }
    return new THREE.CanvasTexture(canvas)
  }, [])
  useEffect(() => () => grooves.dispose(), [grooves])
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    speed.current += ((playing ? 1.8 : 0) - speed.current) * Math.min(dt * 1.6, 1)
    if (discRef.current) discRef.current.rotation.y += speed.current * dt
  })
  return <group ref={discRef} position={[PLATTER_CENTRE[0], PLATTER_TOP_Y + 0.021, PLATTER_CENTRE[2]]}>
    <mesh castShadow receiveShadow><cylinderGeometry args={[1.42, 1.42, 0.036, 96]}/><meshStandardMaterial color="#171518" metalness={0.3} roughness={0.35}/></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.019, 0]} receiveShadow>
      <ringGeometry args={[0.045, 1.407, 128]}/><meshPhysicalMaterial color="#171518" roughness={0.32} metalness={0.18} clearcoat={0.6} clearcoatRoughness={0.3}/>
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.020, 0]}><ringGeometry args={[0.66, 1.407, 128]}/><meshBasicMaterial map={grooves} transparent depthWrite={false} opacity={0.32}/></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.021, 0]} receiveShadow><ringGeometry args={[0.045, 0.64, 96]}/><meshStandardMaterial key={texture?.uuid || 'label-placeholder'} map={texture} color={texture ? '#ffffff' : '#1c5b45'} roughness={0.58} metalness={0}/></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, 0]}><ringGeometry args={[0.045, 0.079, 48]}/><meshStandardMaterial color="#e1e5ec" metalness={0.8} roughness={0.25}/></mesh>
  </group>
}

function CameraFit() {
  const { camera, size, invalidate } = useThree()
  useEffect(() => {
    camera.zoom = Math.min(size.width / 6.1, size.height / 4.1)
    camera.lookAt(0, -0.12, 0.03)
    camera.updateProjectionMatrix()
    invalidate()
  }, [camera, size.width, size.height, invalidate])
  return null
}

function ReactiveLight({ levelRef, playing, reduced }) {
  const light = useRef(null)
  useFrame(() => { if (light.current) light.current.intensity = 12 + (playing && !reduced ? levelRef.current * 26 : 0) })
  return <pointLight ref={light} position={[-1.6, 2, 2]} color="#dfe6f5" intensity={12} distance={7}/>
}

function Spectrum({ active, visible, binsRef, reduced }) {
  const bars = useRef([])
  useEffect(() => {
    let frame = 0
    function update() {
      bars.current.forEach((bar, index) => {
        if (bar) bar.style.transform = `scaleY(${active && !reduced ? 0.1 + binsRef.current[index * 2 + 1] / 255 * 0.9 : 0.12})`
      })
      if (active && visible && !reduced && !document.hidden) frame = requestAnimationFrame(update)
    }
    update()
    const visibility = () => { cancelAnimationFrame(frame); update() }
    document.addEventListener('visibilitychange', visibility)
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', visibility) }
  }, [active, visible, binsRef, reduced])
  return <span className="deck-spectrum" aria-hidden="true">{Array.from({ length: 20 }, (_, index) => <i key={index} ref={node => { bars.current[index] = node }}/>)}</span>
}

export default function MusicTurntable() {
  const music = useMusic()
  const wrapper = useRef(null)
  const [visible, setVisible] = useState(true)
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const displayedTrack = music.currentTrack || music.playlist[0]
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(media.matches)
    media.addEventListener('change', update)
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '80px' })
    if (wrapper.current) observer.observe(wrapper.current)
    return () => { media.removeEventListener('change', update); observer.disconnect() }
  }, [])
  const fallback = <img className="music-deck-fallback" src="/images/storybook-turntable.png" alt="A rounded emerald and white turntable with silver details"/>
  return <div className="music-deck" ref={wrapper}>
    {/* YouTube picks play here, in place of the turntable. The host div never moves: the iframe is created in it once. */}
    <div ref={music.screenRef} className="music-deck-video" hidden={!music.youtubeActive} />
    <div className="music-deck-scene" role="img" hidden={music.youtubeActive} aria-label={`Turntable ${music.isPlaying ? 'playing' : 'ready for'} ${displayedTrack?.title || 'your playlist'}. Album artwork appears on the record.`}>
      <Suspense fallback={fallback}>
        <Canvas orthographic shadows camera={{ position: [4.8, 4.45, 6.5], zoom: 90, near: 0.1, far: 45 }} dpr={[1, 1.5]} frameloop={visible ? 'always' : 'never'} gl={{ antialias: true, alpha: true }} fallback={fallback}>
          <CameraFit/>
          <Suspense fallback={null}><StudioEnvironment intensity={0.7}/></Suspense>
          <ambientLight intensity={0.7}/>
          <directionalLight position={[2, 7, 5]} intensity={2.5} color="#ffffff" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0005}/>
          <directionalLight position={[-4, 3, -3]} intensity={1.2} color="#dce6ee"/>
          <ReactiveLight levelRef={music.levelRef} playing={music.isPlaying} reduced={reduced}/>
          <TurntableModel modelUrl={MODEL_URL} isPlaying={music.isPlaying} motionEnabled={!reduced} discOnPlatter={Boolean(displayedTrack)} onNeedleDrop={music.toggle} onNeedleLift={music.toggle} showHint={false} playProgress={music.duration > 0 ? music.position / music.duration : 0}/>
          <PictureDisc coverUrl={displayedTrack?.coverUrl} playing={music.isPlaying && !reduced}/>
          <ContactShadows position={[0, -0.667, 0]} scale={9} opacity={0.36} blur={2.6} far={1.6} frames={1}/>
        </Canvas>
      </Suspense>
    </div>
    <div className="music-deck-meta"><div><p>{displayedTrack?.title}</p><small>{displayedTrack?.artist}</small></div><Spectrum active={music.isPlaying} visible={visible} reduced={reduced} binsRef={music.binsRef}/></div>
    <div className="music-deck-actions"><button className="music-deck-play" onClick={music.toggle} aria-label={music.isPlaying ? 'Pause playlist' : 'Play playlist'}><Icon name={music.isPlaying ? 'pause' : 'play'} size={15} />{music.status === 'loading' ? 'Loading…' : music.isPlaying ? 'Pause' : 'Press play'}</button><button className="music-deck-browse" onClick={() => music.setDrawerOpen(true)}>Choose a record <Icon name="arrow-up-right" size={14} /></button></div>
  </div>
}
