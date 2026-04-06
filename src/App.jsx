import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { Scene } from './components/Scene'
import { RecordShelf } from './components/RecordShelf'
import { ContentPanel } from './components/ContentPanel'
import { Jukebox } from './components/Jukebox'
import { albums } from './data/portfolio'
import { useSounds } from './hooks/useSounds'
import './App.css'

function MusicWidget() {
  const [open, setOpen] = useState(false)
  // Use a static color (e.g. the default purple 7c3aed) so the iframe src never changes and never interrupts audio when navigating!
  const src = `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/soundcloud%253Aplaylists%253A2217627596&color=%237c3aed&auto_play=false&hide_related=false&show_comments=false&show_user=false&show_reposts=false&show_teaser=false`

  return (
    <div className={`music-widget ${open ? 'music-widget--open' : ''}`}>
      <button className="music-widget__toggle" onClick={() => setOpen(!open)} aria-label="Toggle Music Player">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
        <span>My Playlist</span>
      </button>
      <div className="music-widget__panel">
        <iframe 
          width="100%" 
          height="450" 
          scrolling="no" 
          frameBorder="no" 
          allow="autoplay" 
          src={src}
          style={{ borderRadius: '8px' }}
        />
      </div>
    </div>
  )
}

export default function App() {
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [rpm, setRpm] = useState(33)
  const [jukeboxOpen, setJukeboxOpen] = useState(false)
  const [jukeboxTrack, setJukeboxTrack] = useState(null)

  const headerRef = useRef()
  const shelfRef = useRef()
  const audioPreviewRef = useRef(null)
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

  // Triggered when a shelf album is selected
  function handleSelectShelfAlbum(idx) {
    if (idx === selectedIndex) {
      if (!isPlaying) setSelectedIndex(null) // Unselect if they click it again while idle
      return
    }
    setSelectedIndex(idx)
    playSlide()
    
    // If ANY music is playing (either jukebox or album), open info panel immediately so they can read.
    // If silence, just lift the record in the shelf and wait for them to hit Play.
    if (isPlaying || jukeboxTrack) {
      setPanelOpen(true)
    } else {
      setPanelOpen(false)
    }
  }

  // Triggered when "Play" is clicked ON the shelf's control strip
  function handlePlayShelfAlbum() {
    if (selectedIndex === null) return
    setJukeboxTrack(null)
    if (audioPreviewRef.current) audioPreviewRef.current.pause()
    setIsPlaying(true)
    setPanelOpen(true) // Show the info panel now that they hit Play
    playNeedleDrop()
    startCrackle()
  }

  // Triggered when ContentPanel X is clicked
  function handleClosePanel() {
    setPanelOpen(false)
    // Note: We don't unselect the album or stop the turntable! 
    // They can just watch the record spin without the info blocking their view.
  }

  // Triggered when "Eject" is clicked on the shelf strip
  function handleEjectShelfAlbum() {
    // If the shelf album was actually on the turntable, stop the turntable
    if (isPlaying && !jukeboxTrack) {
      setIsPlaying(false)
      stopCrackle()
    }
    setPanelOpen(false)
    // We intentionally don't clear selectedIndex so the record gently drops back into its lifted slot on the shelf.
  }

  function handleJukeboxPlay(track) {
    // Keep setSelectedIndex intact so they can keep reading info!
    setJukeboxTrack(track)
    setIsPlaying(true)
    playNeedleDrop()
    startCrackle()
    if (audioPreviewRef.current) {
      audioPreviewRef.current.src = track.previewUrl
      audioPreviewRef.current.play()
    }
  }

  function handleJukeboxEject() {
    setJukeboxTrack(null)
    if (audioPreviewRef.current) audioPreviewRef.current.pause()
    // If no album was actively selected to fall back on, stop the motor
    if (selectedIndex === null) {
      setIsPlaying(false)
      stopCrackle()
    }
  }

  function toggleJukeboxPlay() {
    if (isPlaying) {
      if (audioPreviewRef.current) audioPreviewRef.current.pause()
      setIsPlaying(false)
      stopCrackle()
    } else {
      if (audioPreviewRef.current) audioPreviewRef.current.play()
      setIsPlaying(true)
      startCrackle()
    }
  }

  function handleRpmToggle(val) {
    setRpm(val)
  }

  return (
    <div
      className="app"
      style={{ '--scene-glow': currentAlbum ? `${currentAlbum.color}20` : (jukeboxTrack ? '#ffffff10' : 'transparent') }}
    >
      <div className="app__glow" />
      <audio ref={audioPreviewRef} onEnded={handleJukeboxEject} />

      <header className="app__header" ref={headerRef}>
        <span className="app__header-name">Diego Pérez</span>
        <span className="app__header-sub">Portfolio · {new Date().getFullYear()}</span>
      </header>

      <div className="app__top-left-controls">
        <MusicWidget />
      </div>

      <div className="app__top-center">
        {!jukeboxTrack ? (
          <button className="jukebox-toggle-btn" onClick={() => setJukeboxOpen(!jukeboxOpen)} aria-label="Toggle Jukebox Mode">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>Jukebox Mode</span>
          </button>
        ) : (
          <div className="jukebox-mini-controls">
            <span className="jukebox-np-title">{jukeboxTrack.title}</span>
            <div className="jukebox-actions">
              <button className="jukebox-btn" onClick={toggleJukeboxPlay}>
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button className="jukebox-btn jukebox-btn--eject" onClick={handleJukeboxEject}>
                Eject
              </button>
            </div>
          </div>
        )}
      </div>

      {jukeboxOpen && <Jukebox onSelectTrack={handleJukeboxPlay} onClose={() => setJukeboxOpen(false)} />}

      <div className="app__canvas">
        <Scene
          currentAlbum={currentAlbum}
          jukeboxTrack={jukeboxTrack}
          isPlaying={isPlaying}
          rpm={rpm}
          onRpmToggle={handleRpmToggle}
        />
      </div>

      <ContentPanel
        album={currentAlbum}
        isOpen={panelOpen}
        onClose={handleClosePanel}
      />

      <div className="app__shelf" ref={shelfRef}>
        <RecordShelf
          albums={albums}
          selectedIndex={selectedIndex}
          isPlaying={isPlaying && currentAlbum && !jukeboxTrack}
          onSelect={handleSelectShelfAlbum}
          onPlay={handlePlayShelfAlbum}
          onEject={handleEjectShelfAlbum}
        />
      </div>
    </div>
  )
}
