import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { Scene } from './components/Scene'
import { RecordShelf } from './components/RecordShelf'
import { ContentPanel } from './components/ContentPanel'
import { Jukebox } from './components/Jukebox'
import { albums } from './data/portfolio'
import {
  DEFAULT_SIMULATOR_BACKGROUND_ID,
  SIMULATOR_BACKGROUNDS,
  SIMULATOR_BACKGROUND_STORAGE_KEY,
  getSimulatorBackgroundById,
  isValidSimulatorBackgroundId,
} from './data/simulatorBackgrounds'
import { useSounds } from './hooks/useSounds'
import './App.css'

const CLASSIC_SHELL_THEME = {
  appBackground: 'radial-gradient(ellipse at bottom, #161129 0%, #050508 100%)',
  ambientOverlay: [
    'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.02) 0%, transparent 40%)',
    'radial-gradient(circle at 10% 90%, rgba(255, 255, 255, 0.015) 0%, transparent 30%)',
    'radial-gradient(circle at 90% 10%, rgba(255, 255, 255, 0.02) 0%, transparent 40%)',
  ].join(', '),
  sceneGlow: 'transparent',
  orbColor: 'transparent',
}

function getStoredSimulatorBackgroundId() {
  if (typeof window === 'undefined') return DEFAULT_SIMULATOR_BACKGROUND_ID

  try {
    const storedId = window.localStorage.getItem(SIMULATOR_BACKGROUND_STORAGE_KEY)
    return isValidSimulatorBackgroundId(storedId)
      ? storedId
      : DEFAULT_SIMULATOR_BACKGROUND_ID
  } catch {
    return DEFAULT_SIMULATOR_BACKGROUND_ID
  }
}

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
  const [simulatorBackgroundId, setSimulatorBackgroundId] = useState(getStoredSimulatorBackgroundId)
  const [selectedIndex, setSelectedIndex]       = useState(null)
  const [discOnPlatter, setDiscOnPlatter]       = useState(false)
  const [isEjecting, setIsEjecting]             = useState(false)
  const [isPlaying, setIsPlaying]               = useState(false)
  const [panelOpen, setPanelOpen]               = useState(false)
  const [rpm, setRpm]                           = useState(33)
  const [simulatorAlbumFlipped, setSimulatorAlbumFlipped] = useState(false)
  const [simulatorInspectMode, setSimulatorInspectMode]   = useState(false)
  const [jukeboxOpen, setJukeboxOpen]           = useState(false)
  const [jukeboxTrack, setJukeboxTrack]         = useState(null)

  const headerRef = useRef()
  const shelfRef  = useRef()
  const audioPreviewRef = useRef(null)
  const swapTimeoutRef1 = useRef(null)
  const swapTimeoutRef2 = useRef(null)
  const { playSlide, playDiscLand, playNeedleDrop, playNeedleLift, startCrackle, stopCrackle } = useSounds()

  const currentAlbum = selectedIndex !== null ? albums[selectedIndex] : null
  const simulatorBackground = getSimulatorBackgroundById(simulatorBackgroundId)
  const shellTheme = simulatorMode ? simulatorBackground.shellTheme : CLASSIC_SHELL_THEME

  useEffect(() => {
    gsap.fromTo(headerRef.current, { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' })
    gsap.fromTo(shelfRef.current,  { opacity: 0, y: 20  }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.3 })
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(SIMULATOR_BACKGROUND_STORAGE_KEY, simulatorBackgroundId)
    } catch {
      // Ignore storage errors and continue with the in-memory selection.
    }
  }, [simulatorBackgroundId])

  // Reset all state when switching modes
  function handleModeToggle() {
    clearTimeout(swapTimeoutRef1.current)
    clearTimeout(swapTimeoutRef2.current)
    setIsPlaying(false)
    setDiscOnPlatter(false)
    setIsEjecting(false)
    setSelectedIndex(null)
    setSimulatorAlbumFlipped(false)
    setSimulatorInspectMode(false)
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
      if (idx === selectedIndex) {
        setSelectedIndex(null)
        setSimulatorAlbumFlipped(false)
        setSimulatorInspectMode(false)
        return
      }
      setSelectedIndex(idx)
      setSimulatorAlbumFlipped(false)
      setSimulatorInspectMode(false)
      playSlide()
      setPanelOpen(false)
    } else {
      // Classic: selecting ejects current disc first (if any), auto-places new disc
      if (isEjecting) return
      if (discOnPlatter) {
        if (idx === selectedIndex) {
          // Already have THIS disc — eject it
          handleEjectDisc()
        } else {
          // Swap: Eject current, then place the new one
          setIsPlaying(false)
          setIsEjecting(true)
          stopCrackle()
          setPanelOpen(false)
          swapTimeoutRef1.current = setTimeout(() => {
            setDiscOnPlatter(false)
            setIsEjecting(false)
            
            // Queue next disc on next tick to avoid React batching collision
            swapTimeoutRef2.current = setTimeout(() => {
              // Ensure we are still in Classic mode before proceeding
              setSelectedIndex((prev) => {
                setDiscOnPlatter(true)
                playSlide()
                playDiscLand()
                return idx
              })
            }, 50)
          }, 900)
        }
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
    if (selectedIndex === null || discOnPlatter || simulatorAlbumFlipped) return
    setDiscOnPlatter(true)
    playDiscLand()
  }

  function handleSimulatorFlipToggle() {
    if (!simulatorMode || selectedIndex === null || isEjecting) return
    setSimulatorAlbumFlipped(value => !value)
  }

  function handleSimulatorInspectClose() {
    if (!simulatorMode) return
    setSimulatorInspectMode(false)
  }

  function handleSimulatorInspectOpen() {
    if (!simulatorMode || selectedIndex === null) return
    setSimulatorInspectMode(true)
  }

  function handleSimulatorSceneAlbumPress(idx) {
    if (!simulatorMode) return
    if (isEjecting) return

    if (idx === selectedIndex) {
      // Toggle inspect on the selected album — allowed even while disc is spinning
      setSimulatorInspectMode(prev => !prev)
      return
    }

    // Can't swap to a different album while disc is committed
    if (discOnPlatter) return

    handleSelectShelfAlbum(idx)
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
    setPanelOpen(false)
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
      if (!simulatorMode) {
        setSelectedIndex(null)
      } else {
        setSimulatorAlbumFlipped(false)
        setSimulatorInspectMode(false)
      }
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
    : (jukeboxTrack ? '#ffffff10' : (simulatorMode ? simulatorBackground.shellTheme.sceneGlow : 'transparent'))

  return (
    <div
      className="app"
      style={{
        '--app-background': shellTheme.appBackground,
        '--app-ambient-overlay': shellTheme.ambientOverlay,
        '--scene-glow': sceneGlow,
        '--scene-color': shellTheme.orbColor,
      }}
    >
      <div className="app__glow" />
      <audio ref={audioPreviewRef} onEnded={handleJukeboxEject} />

      <header className="app__header" ref={headerRef}>
        <span className="app__header-name">Diego Pérez</span>
        <span className="app__header-sub">Portfolio · {new Date().getFullYear()}</span>
      </header>

      {/* Mode toggle + music widget */}
      <div className="app__top-left-controls">
        <div className="app__simulator-controls">
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

          {simulatorMode && (
            <div className="simulator-background-picker">
              <label className="simulator-background-picker__label" htmlFor="simulator-background-select">
                Simulator Background
              </label>
              <select
                id="simulator-background-select"
                className="simulator-background-picker__select"
                value={simulatorBackgroundId}
                onChange={(event) => setSimulatorBackgroundId(event.target.value)}
              >
                {SIMULATOR_BACKGROUNDS.map((background) => (
                  <option key={background.id} value={background.id}>
                    {background.label}
                  </option>
                ))}
              </select>
              <p className="simulator-background-picker__description">
                {simulatorBackground.description}
              </p>
            </div>
          )}
        </div>
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
      {simulatorMode && simulatorBackground.showShootingStars && (
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
          simulatorBackground={simulatorBackground}
          albums={albums}
          currentAlbum={currentAlbum}
          selectedIndex={selectedIndex}
          simulatorAlbumFlipped={simulatorAlbumFlipped}
          simulatorInspectMode={simulatorInspectMode}
          jukeboxTrack={jukeboxTrack}
          isPlaying={isPlaying}
          rpm={rpm}
          onRpmToggle={handleRpmToggle}
          discOnPlatter={discOnPlatter}
          isEjecting={isEjecting}
          showVinyl={showVinyl}
          onSelectAlbum={simulatorMode ? handleSimulatorSceneAlbumPress : undefined}
          onPlaceDisc={simulatorMode ? handlePlaceOnTurntable : undefined}
          onNeedleDrop={simulatorMode ? handleNeedleDrop : undefined}
          onNeedleLift={simulatorMode ? handleNeedleLift : undefined}
        />
      </div>

      <ContentPanel
        album={currentAlbum}
        isOpen={!simulatorMode && panelOpen}
        onClose={handleClosePanel}
      />

      <div className={`app__shelf ${simulatorMode ? 'app__shelf--simulator' : ''}`} ref={shelfRef}>
        <RecordShelf
          albums={albums}
          selectedIndex={selectedIndex}
          discOnPlatter={discOnPlatter}
          isEjecting={isEjecting}
          isPlaying={isPlaying && !jukeboxTrack}
          simulatorMode={simulatorMode}
          simulatorAlbumFlipped={simulatorAlbumFlipped}
          simulatorInspectMode={simulatorInspectMode}
          onSelect={handleSelectShelfAlbum}
          onPlace={handlePlaceOnTurntable}
          onPlay={handlePlay}
          onEject={handleEjectDisc}
          onFlipToggle={handleSimulatorFlipToggle}
          onInspect={handleSimulatorInspectOpen}
          onInspectClose={handleSimulatorInspectClose}
        />
      </div>
    </div>
  )
}
