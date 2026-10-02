import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import playlist from '../data/music.json'
import { useYouTubePlayer } from '../hooks/useYouTubePlayer'
import { forgetYouTubeVideo, youtubeEnabled } from '../utils/youtubeSearch'

const MusicContext = createContext(null)
const SETTINGS_KEY = 'diego-music-preferences-v1'
const PICKS_KEY = 'diego-music-picks-v1'
const MAX_PICKS = 20
function readPicks() {
  try {
    const value = JSON.parse(localStorage.getItem(PICKS_KEY))
    return Array.isArray(value) ? value.filter(track => track && track.id && (track.audio || track.youtubeId)).slice(0, MAX_PICKS) : []
  } catch { return [] }
}
function readPreferences() {
  try {
    const value = JSON.parse(localStorage.getItem(SETTINGS_KEY))
    return { volume: Number.isFinite(value?.volume) ? Math.max(0, Math.min(1, value.volume)) : 0.65, muted: value?.muted === true }
  } catch { return { volume: 0.65, muted: false } }
}

// The audio element belongs to the application, never to a scene or a dialog.
// Two backends sit behind one set of controls: the <audio> element for Diego's own files
// (and 30-second previews), and a small YouTube player for songs visitors pick themselves
// (`track.youtubeId`). The dock, drawer and turntable never need to know which is playing.
export function MusicProvider({ children }) {
  const audioRef = useRef(null)
  const currentRef = useRef(null)
  const requestRef = useRef(0)
  const intentRef = useRef('paused')
  const repeatRef = useRef(false)
  const queueRef = useRef(playlist)
  const levelRef = useRef(0)
  const binsRef = useRef(new Uint8Array(64))
  const [currentTrack, setCurrentTrack] = useState(null)
  const [status, setStatus] = useState('idle')
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [preferences, setPreferences] = useState(readPreferences)
  const [repeat, setRepeatState] = useState(false)
  const [error, setError] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [picks, setPicks] = useState(readPicks)
  const screenRef = useRef(null)   // the dock renders the YouTube player's host; the iframe must never move in the DOM
  const isPlaying = status === 'playing'
  const queue = useMemo(() => [...playlist, ...picks], [picks])
  queueRef.current = queue
  const viaYouTube = track => Boolean(track?.youtubeId)

  // Advance the queue when a song finishes, whichever backend played it.
  const advance = useCallback(() => {
    const list = queueRef.current
    const index = list.findIndex(track => track.id === currentRef.current?.id)
    if (index < list.length - 1) playTrackRef.current(list[index + 1])
    else if (repeatRef.current && list.length) playTrackRef.current(list[0])
    else { intentRef.current = 'paused'; setStatus('paused') }
  }, [])
  const playTrackRef = useRef(() => {})

  const youtube = useYouTubePlayer(screenRef, {
    onStateChange: state => {
      if (!viaYouTube(currentRef.current)) return
      const YT = window.YT?.PlayerState
      if (!YT) return
      if (state === YT.PLAYING) { intentRef.current = 'playing'; setStatus('playing'); setError(''); setDuration(youtube.getDuration()) }
      else if (state === YT.PAUSED && intentRef.current !== 'loading') { intentRef.current = 'paused'; setStatus('paused') }
      else if (state === YT.BUFFERING && intentRef.current !== 'paused') setStatus('loading')
      else if (state === YT.CUED && intentRef.current === 'loading') { intentRef.current = 'paused'; setStatus('paused') }
      else if (state === YT.ENDED) { if (intentRef.current === 'playing') advance() }
    },
    onError: () => {
      const track = currentRef.current
      if (!viaYouTube(track)) return
      forgetYouTubeVideo(track)
      intentRef.current = 'paused'
      setStatus('error')
      setError('YouTube won’t play this one here. Try another song.')
    },
  })

  const resume = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !currentRef.current) return
    if (viaYouTube(currentRef.current)) {
      ++requestRef.current
      intentRef.current = 'playing'
      setError('')
      setStatus('loading')
      youtube.play()
      return
    }
    const request = ++requestRef.current
    intentRef.current = 'playing'
    setError('')
    setStatus('loading')
    // Call play within the visitor's gesture, without awaiting other work.
    void audio.play().then(() => {
      if (request === requestRef.current && intentRef.current === 'playing' && !audio.paused) setStatus('playing')
    }).catch(failure => {
      if (request !== requestRef.current || failure.name === 'AbortError') return
      intentRef.current = 'paused'
      setStatus('error')
      setError(failure.name === 'NotAllowedError' ? 'Tap play to allow music in this browser.' : 'This track couldn’t play. Try again or choose another song.')
    })
  }, [youtube])

  const pause = useCallback(() => {
    ++requestRef.current
    intentRef.current = 'paused'
    audioRef.current?.pause()
    youtube.pause()
    if (currentRef.current) setStatus('paused')
  }, [youtube])

  const playTrack = useCallback(track => {
    if (!track || !audioRef.current) return
    const audio = audioRef.current
    if (viaYouTube(track)) {
      ++requestRef.current
      audio.pause()
      intentRef.current = 'loading'
      currentRef.current = track
      setCurrentTrack(track)
      setDuration(track.durationSeconds || 0)
      setPosition(0)
      setError('')
      setStatus('loading')
      // loadVideoById starts playback itself; the state handler flips us to 'playing'.
      void youtube.load(track.youtubeId).then(loaded => {
        if (!loaded && currentRef.current?.id === track.id) { intentRef.current = 'paused'; setStatus('error'); setError('The YouTube player couldn’t start. Try again.') }
        // Phones only start media inside a tap, and the lookup before this point has spent that tap. If nothing is
        // playing after a moment, settle into "paused" so the dock's play button (a fresh tap) can start it.
        const coarse = window.matchMedia('(pointer: coarse)').matches
        setTimeout(() => {
          if (currentRef.current?.id !== track.id || intentRef.current !== 'loading') return
          intentRef.current = 'paused'; setStatus('paused')
          if (coarse) {
            setError('Tap the video up by the record player to start it — phones only play YouTube from a tap on the player itself.')
            document.getElementById('music')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, coarse ? 1200 : 2500)
      })
      return
    }
    if (!track.audio) return
    youtube.stop()
    if (currentRef.current?.id !== track.id || audio.error) {
      ++requestRef.current
      intentRef.current = 'loading'
      audio.pause()
      currentRef.current = track
      setCurrentTrack(track)
      setDuration(track.durationSeconds || 0)
      setPosition(0)
      audio.src = track.audio
      audio.load()
    }
    resume()
  }, [resume, youtube])
  playTrackRef.current = playTrack

  const toggle = useCallback(() => {
    if (!currentRef.current) playTrack(queueRef.current[0])
    else if (intentRef.current === 'playing') pause()
    else resume()
  }, [pause, playTrack, resume])

  const seek = useCallback(seconds => {
    const audio = audioRef.current
    if (!audio || !currentRef.current || !Number.isFinite(seconds)) return
    if (viaYouTube(currentRef.current)) {
      const length = youtube.getDuration() || currentRef.current.durationSeconds || 0
      const target = Math.max(0, length > 0 ? Math.min(length, seconds) : seconds)
      youtube.seek(target)
      setPosition(target)
      return
    }
    const length = Number.isFinite(audio.duration) ? audio.duration : currentRef.current.durationSeconds
    if (!(length > 0)) return
    const target = Math.max(0, Math.min(length, seconds))
    try { audio.currentTime = target; setPosition(target) } catch { /* Metadata may still be loading. */ }
  }, [youtube])

  const next = useCallback(() => {
    const queue = queueRef.current
    if (!queue.length) return
    const index = queue.findIndex(track => track.id === currentRef.current?.id)
    playTrack(queue[(index + 1) % queue.length])
  }, [playTrack])

  const previous = useCallback(() => {
    if ((audioRef.current?.currentTime || 0) > 3) { seek(0); return }
    const queue = queueRef.current
    if (!queue.length) return
    const index = queue.findIndex(track => track.id === currentRef.current?.id)
    playTrack(queue[(index - 1 + queue.length) % queue.length])
  }, [playTrack, seek])

  const onEnded = useCallback(() => {
    if (!audioRef.current?.ended || intentRef.current !== 'playing') return
    advance()
  }, [advance])

  // Songs visitors choose themselves. They join the queue after Diego's playlist and are
  // remembered in this browser so a returning visitor finds their picks again.
  const addPick = useCallback(track => {
    setPicks(previous => [track, ...previous.filter(item => item.id !== track.id)].slice(0, MAX_PICKS))
  }, [])
  const removePick = useCallback(id => setPicks(previous => previous.filter(item => item.id !== id)), [])
  useEffect(() => {
    try { localStorage.setItem(PICKS_KEY, JSON.stringify(picks)) } catch { /* Playback works without storage. */ }
  }, [picks])

  // Opening the drawer is the moment to fetch the YouTube API, so a pick can start inside its click.
  useEffect(() => { if (drawerOpen && youtubeEnabled) void youtube.warm() }, [drawerOpen, youtube])

  // The YouTube player has no timeupdate event: poll while it is the active backend.
  const youtubeActive = viaYouTube(currentTrack)
  useEffect(() => {
    if (!youtubeActive || !isPlaying) return undefined
    const tick = () => { setPosition(youtube.getTime()); const length = youtube.getDuration(); if (length > 0) setDuration(length) }
    tick()
    const interval = setInterval(tick, 500)
    return () => clearInterval(interval)
  }, [youtubeActive, isPlaying, youtube])

  const setVolume = useCallback(volume => {
    if (!Number.isFinite(volume)) return
    setPreferences(previous => ({ ...previous, volume: Math.max(0, Math.min(1, volume)) }))
  }, [])
  const setMuted = useCallback(muted => setPreferences(previous => ({ ...previous, muted: Boolean(muted) })), [])
  const setRepeat = useCallback(value => { repeatRef.current = Boolean(value); setRepeatState(Boolean(value)) }, [])
  const clearError = useCallback(() => setError(''), [])
  /* The X on the dock: stop whatever is playing and take the player off the page. */
  const stop = useCallback(() => {
    ++requestRef.current
    intentRef.current = 'paused'
    currentRef.current = null
    const audio = audioRef.current
    if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load() }
    youtube.stop()
    setCurrentTrack(null); setStatus('idle'); setPosition(0); setDuration(0); setError('')
  }, [youtube])

  useEffect(() => {
    const audio = audioRef.current
    audio.volume = preferences.volume
    audio.muted = preferences.muted
    youtube.setVolume(preferences.volume)
    youtube.setMuted(preferences.muted)
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(preferences)) } catch { /* Playback works without storage. */ }
  }, [preferences, youtube])

  useEffect(() => {
    let frame = 0
    const sample = () => {
      if (!isPlaying || document.hidden) { levelRef.current = 0; return }
      // The <audio> element plays natively (routing it through Web Audio buzzed in some browsers and iOS mutes
      // Web Audio with the silent switch), so the deck breathes to a gentle synthetic pulse for every source.
      const t = performance.now() / 1000
      for (let index = 0; index < binsRef.current.length; index++) {
        binsRef.current[index] = Math.max(0, Math.min(255, 70 + 70 * Math.sin(t * 2.6 + index * .55) + 45 * Math.sin(t * 6.1 - index * .21)))
      }
      levelRef.current += ((.32 + .18 * Math.sin(t * 2.3) + .1 * Math.sin(t * 7.1)) - levelRef.current) * 0.2
      frame = requestAnimationFrame(sample)
    }
    const visibility = () => { cancelAnimationFrame(frame); if (!document.hidden && isPlaying) frame = requestAnimationFrame(sample) }
    if (isPlaying) frame = requestAnimationFrame(sample)
    else { levelRef.current = 0; binsRef.current.fill(0) }
    document.addEventListener('visibilitychange', visibility)
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', visibility) }
  }, [isPlaying])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return undefined
    const handlers = { play: resume, pause, nexttrack: next, previoustrack: previous, seekto: event => seek(event.seekTime) }
    for (const [action, handler] of Object.entries(handlers)) {
      try { navigator.mediaSession.setActionHandler(action, handler) } catch { /* Unsupported action. */ }
    }
    return () => { for (const action of Object.keys(handlers)) { try { navigator.mediaSession.setActionHandler(action, null) } catch { /* Unsupported action. */ } } }
  }, [resume, pause, next, previous, seek])

  useEffect(() => {
    if (!currentTrack || !('mediaSession' in navigator)) return
    if ('MediaMetadata' in window) navigator.mediaSession.metadata = new window.MediaMetadata({
      title: currentTrack.title, artist: currentTrack.artist, album: currentTrack.album,
      artwork: currentTrack.coverUrl ? [{ src: new URL(currentTrack.coverUrl, location.href).href, sizes: '600x600', type: 'image/jpeg' }] : [],
    })
  }, [currentTrack])

  useEffect(() => {
    if (!currentTrack || !('mediaSession' in navigator)) return
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
    if (duration > 0 && navigator.mediaSession.setPositionState) {
      try { navigator.mediaSession.setPositionState({ duration, playbackRate: 1, position: Math.min(duration, Math.max(0, position)) }) } catch { /* Unsupported media session values. */ }
    }
  }, [currentTrack, isPlaying, duration, position])

  useEffect(() => {
    const audio = audioRef.current
    return () => {
      ++requestRef.current
      intentRef.current = 'paused'
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      }
  }, [])

  return <MusicContext.Provider value={{ playlist, queue, picks, addPick, removePick, youtubeEnabled, youtubeActive, screenRef, currentTrack, status, isPlaying, position, duration, volume: preferences.volume, muted: preferences.muted, repeat, error, drawerOpen, setDrawerOpen, playTrack, toggle, next, previous, seek, setVolume, setMuted, setRepeat, clearError, stop, levelRef, binsRef }}>
    {children}
    <audio ref={audioRef} className="site-audio" preload="none" aria-label="Portfolio music playback"
      onPlaying={() => { if (intentRef.current === 'playing') setStatus('playing') }}
      onPause={event => {
        const audio = event.currentTarget
        if (currentRef.current && audio.paused && !audio.ended && !audio.error && intentRef.current !== 'loading') {
          ++requestRef.current
          intentRef.current = 'paused'
          setStatus('paused')
        }
      }}
      onWaiting={() => { if (intentRef.current === 'playing') setStatus('loading') }}
      onTimeUpdate={event => setPosition(event.currentTarget.currentTime || 0)}
      onLoadedMetadata={event => { if (Number.isFinite(event.currentTarget.duration)) setDuration(event.currentTarget.duration) }}
      onDurationChange={event => { if (Number.isFinite(event.currentTarget.duration)) setDuration(event.currentTarget.duration) }}
      onEnded={onEnded}
      onError={event => { if (currentRef.current && event.currentTarget.error) { intentRef.current = 'paused'; setStatus('error'); setError('This track is unavailable. Try another song from the playlist.') } }}
    />
  </MusicContext.Provider>
}

export function useMusic() {
  const value = useContext(MusicContext)
  if (!value) throw new Error('Music controls must be inside MusicProvider')
  return value
}
