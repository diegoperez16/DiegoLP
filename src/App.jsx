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
  const [simulatorMode, setSimulatorMode]       = useState(false)
  const [selectedIndex, setSelectedIndex]       = useState(null)
  const [discOnPlatter, setDiscOnPlatter]       = useState(false)
  const [isEjecting, setIsEjecting]             = useState(false)
  const [isPlaying, setIsPlaying]               = useState(false)
  const [panelOpen, setPanelOpen]               = useState(false)
  const [rpm, setRpm]                           = useState(33)
  const [jukeboxOpen, setJukeboxOpen]           = useState(false)
  const [jukeboxTrack, setJukeboxTrack]         = useState(null)

  const headerRef = useRef()
  const shelfRef  = useRef()
  const audioPreviewRef = useRef(null)
  const { playSlide, playDiscLand, playNeedleDrop, playNeedleLift, startCrackle, stopCrackle } = useSounds()

  const currentAlbum = selectedIndex !== null ? albums[selectedIndex] : null

  useEffect(() => {
    gsap.fromTo(headerRef.current, { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' })
    gsap.fromTo(shelfRef.current,  { opacity: 0, y: 20  }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.3 })
  }, [])

  // Reset all state when switching modes
  function handleModeToggle() {
    setIsPlaying(false)
    setDiscOnPlatter(false)
    setIsEjecting(false)
    setSelectedIndex(null)
    setPanelOpen(false)
    setJukeboxOpen(false)
    setJukeboxTrack(null)
    stopCrackle()
    if (audioPreviewRef.current) audioPreviewRef.current.pause()
    setSimulatorMode(m => !m)
  }

  // ── Select an album from the shelf ──────────────────────────────
  function handleSelectShelfAlbum(idx) {
    if (simulatorMode) {
      // Simulator: don't switch while disc is committed
      if (discOnPlatter || isEjecting) return
      if (idx === selectedIndex) { setSelectedIndex(null); return }
      setSelectedIndex(idx)
      playSlide()
      setPanelOpen(false)
    } else {
      // Classic: selecting ejects current disc first (if any), auto-places new disc
      if (isEjecting) return
      if (discOnPlatter) {
        // Already have a disc — eject it and return; user can click again to select new
        handleEjectDisc()
        return
      }
      if (idx === selectedIndex) { setSelectedIndex(null); return }
      setSelectedIndex(idx)
      setDiscOnPlatter(true)
      playSlide()
      playDiscLand()
      setPanelOpen(false)
    }
  }

  // ── Place selected disc onto the turntable platter (simulator only) ─
  function handlePlaceOnTurntable() {
    if (selectedIndex === null || discOnPlatter) return
    setDiscOnPlatter(true)
    playDiscLand()
  }

  // ── Play (classic mode) ──────────────────────────────────────────
  function handlePlay() {
    if (!discOnPlatter || isEjecting) return
    setIsPlaying(true)
    setPanelOpen(true)
    playNeedleDrop()
    startCrackle()
  }

  // ── Drop needle (simulator: tonearm click in 3D) ──────────────────
  function handleNeedleDrop() {
    if (!discOnPlatter || isEjecting || jukeboxTrack) return
    setIsPlaying(true)
    setPanelOpen(true)
    playNeedleDrop()
    startCrackle()
  }

  // ── Lift needle (simulator: tonearm click in 3D) ──────────────────
  function handleNeedleLift() {
    if (jukeboxTrack) return
    setIsPlaying(false)
    stopCrackle()
    playNeedleLift()
  }

  // ── Eject the disc ────────────────────────────────────────────────
  function handleEjectDisc() {
    if (isEjecting) return
    setIsPlaying(false)
    setIsEjecting(true)
    stopCrackle()
    setPanelOpen(false)
    setTimeout(() => {
      setDiscOnPlatter(false)
      setIsEjecting(false)
      setSelectedIndex(null)
    }, 900)
  }

  function handleClosePanel() {
    setPanelOpen(false)
  }

  // ── Jukebox (simulator only) ──────────────────────────────────────
  function handleJukeboxPlay(track) {
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

  function handleRpmToggle(val) { setRpm(val) }

  const showVinyl = discOnPlatter || isEjecting || !!jukeboxTrack

  // Classic mode: no default purple glow, use album color or transparent
  const sceneGlow = currentAlbum
    ? `${currentAlbum.color}20`
    : (jukeboxTrack ? '#ffffff10' : (simulatorMode ? '#7c3aed20' : 'transparent'))

  return (
    <div className="app" style={{ '--scene-glow': sceneGlow }}>
      <div className="app__glow" />
      <audio ref={audioPreviewRef} onEnded={handleJukeboxEject} />

      <header className="app__header" ref={headerRef}>
        <span className="app__header-name">Diego Pérez</span>
        <span className="app__header-sub">Portfolio · {new Date().getFullYear()}</span>
      </header>

      {/* Mode toggle + music widget */}
      <div className="app__top-left-controls">
        <button
          className={`mode-toggle-btn ${simulatorMode ? 'mode-toggle-btn--active' : ''}`}
          onClick={handleModeToggle}
          aria-label="Toggle Simulator Mode"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="2" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="2" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="22" y2="12" />
          </svg>
          <span>{simulatorMode ? 'Exit Simulator' : 'Simulator Mode'}</span>
        </button>
        <MusicWidget />
      </div>

      {/* Jukebox controls */}
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

      {jukeboxOpen && (
        <Jukebox onSelectTrack={handleJukeboxPlay} onClose={() => setJukeboxOpen(false)} />
      )}

      {/* Shooting stars (simulator only) */}
      {simulatorMode && (
        <>
          <div className="shooting-star" data-s="1" />
          <div className="shooting-star" data-s="2" />
          <div className="shooting-star" data-s="3" />
          <div className="shooting-star" data-s="4" />
        </>
      )}

      <div className="app__canvas">
        <Scene
          simulatorMode={simulatorMode}
          currentAlbum={currentAlbum}
          jukeboxTrack={jukeboxTrack}
          isPlaying={isPlaying}
          rpm={rpm}
          onRpmToggle={handleRpmToggle}
          discOnPlatter={discOnPlatter}
          isEjecting={isEjecting}
          showVinyl={showVinyl}
          onNeedleDrop={simulatorMode ? handleNeedleDrop : undefined}
          onNeedleLift={simulatorMode ? handleNeedleLift : undefined}
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
          discOnPlatter={discOnPlatter}
          isEjecting={isEjecting}
          isPlaying={isPlaying && !jukeboxTrack}
          simulatorMode={simulatorMode}
          onSelect={handleSelectShelfAlbum}
          onPlace={handlePlaceOnTurntable}
          onPlay={handlePlay}
          onEject={handleEjectDisc}
        />
      </div>
    </div>
  )
}
