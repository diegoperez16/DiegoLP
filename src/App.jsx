import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { Scene } from './components/Scene'
import { RecordShelf } from './components/RecordShelf'
import { ContentPanel } from './components/ContentPanel'
import { albums } from './data/portfolio'
import { useSounds } from './hooks/useSounds'
import './App.css'

export default function App() {
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [rpm, setRpm] = useState(33)

  const audioRef = useRef(null)
  const playTimeoutRef = useRef(null)
  const headerRef = useRef()
  const shelfRef = useRef()
  const { playSlide, playNeedleDrop, startCrackle, stopCrackle } = useSounds()

  const currentAlbum = selectedIndex !== null ? albums[selectedIndex] : null

  useEffect(() => {
    gsap.fromTo(headerRef.current,
      { opacity: 0, y: -12 },
      { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }
    )
    gsap.fromTo(shelfRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.3 }
    )
  }, [])

  function handleSelect(index) {
    if (index === selectedIndex) {
      if (!isPlaying) setSelectedIndex(null)
      return
    }
    setSelectedIndex(index)
    playSlide()
    if (isPlaying) {
      setPanelOpen(false)
      setTimeout(() => setPanelOpen(true), 280)
    }
  }

  function handlePlay() {
    if (selectedIndex === null) return
    setIsPlaying(true)
    setPanelOpen(true)
    playNeedleDrop()
    startCrackle()

    if (audioRef.current) {
      const albumId = albums[selectedIndex].id
      audioRef.current.src = `/music/${albumId}.mp3`
      
      clearTimeout(playTimeoutRef.current)
      playTimeoutRef.current = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch(e => console.log('Audio playback failed or file missing:', e))
        }
      }, 600)
    }
  }

  function handleEject() {
    setIsPlaying(false)
    setPanelOpen(false)
    stopCrackle()
    
    clearTimeout(playTimeoutRef.current)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }

  function handleRpmToggle(val) {
    setRpm(val)
  }

  return (
    <div
      className="app"
      style={{ '--scene-glow': currentAlbum ? `${currentAlbum.color}20` : 'transparent' }}
    >
      <div className="app__glow" />
      <audio ref={audioRef} />

      <header className="app__header" ref={headerRef}>
        <span className="app__header-name">Diego Pérez</span>
        <span className="app__header-sub">Portfolio · {new Date().getFullYear()}</span>
      </header>

      <div className="app__canvas">
        <Scene
          currentAlbum={currentAlbum}
          isPlaying={isPlaying}
          rpm={rpm}
          onRpmToggle={handleRpmToggle}
        />

        <div className={`app__status ${isPlaying ? 'app__status--on' : ''}`}>
          {isPlaying && currentAlbum ? (
            <>
              <span className="app__status-dot" style={{ background: currentAlbum.accentColor }} />
              {currentAlbum.title} · {rpm} RPM
            </>
          ) : (
            'Pull a record from the shelf'
          )}
        </div>

        <ContentPanel album={currentAlbum} isOpen={panelOpen} onClose={handleEject} />
      </div>

      <div className="app__shelf" ref={shelfRef}>
        <RecordShelf
          albums={albums}
          selectedIndex={selectedIndex}
          isPlaying={isPlaying}
          onSelect={handleSelect}
          onPlay={handlePlay}
          onEject={handleEject}
        />
      </div>
    </div>
  )
}
