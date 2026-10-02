import { useEffect, useId, useRef, useState } from 'react'
import { useMusic } from '../../music/MusicProvider'
import { resolveYouTubeVideo, searchYouTube } from '../../utils/youtubeSearch'
import Icon from '../Icon'
import './MusicControls.css'

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const whole = Math.floor(seconds)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

function MusicIcon({ name, ...props }) {
  const paths = {
    play: <path d="m9 5 11 7-11 7Z" fill="currentColor" stroke="none" />,
    pause: <><path d="M8 5v14M16 5v14" strokeWidth="3.5" /></>,
    next: <><path d="m6 5 10 7-10 7Z" fill="currentColor" stroke="none" /><path d="M19 5v14" /></>,
    previous: <><path d="m18 5-10 7 10 7Z" fill="currentColor" stroke="none" /><path d="M5 5v14" /></>,
    queue: <><path d="M4 6h16M4 12h10M4 18h10" /><path d="m18 14 4 3-4 3Z" fill="currentColor" stroke="none" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    expand: <path d="m6 15 6-6 6 6" />,
    collapse: <path d="m6 9 6 6 6-6" />,
    volume: <><path d="M4 9h4l5-4v14l-5-4H4Z" /><path d="M17 8a7 7 0 0 1 0 8M20 5a11 11 0 0 1 0 14" /></>,
    muted: <><path d="M4 9h4l5-4v14l-5-4H4Z" /><path d="m17 9 5 6M17 15l5-6" /></>,
    repeat: <><path d="M5 7h12a3 3 0 0 1 3 3v2M19 17H7a3 3 0 0 1-3-3v-2M14 4l3 3-3 3M10 14l-3 3 3 3" /></>,
    record: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><path d="M6 12a6 6 0 0 1 6-6M18 12a6 6 0 0 1-6 6" /></>,
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    remove: <path d="m7 7 10 10M7 17 17 7" />,
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.record}</svg>
}

function PlayingBars({ playing = false }) {
  return <span className={`music-bars${playing ? ' music-bars--playing' : ''}`} aria-hidden="true"><i /><i /><i /><i /></span>
}

function RecordArtwork({ track, playing = false, className = '' }) {
  return <span className={`music-record ${playing ? 'music-record--playing' : ''} ${className}`} aria-hidden="true"><span className="music-record__surface">{track?.coverUrl ? <img className="music-record__label" src={track.coverUrl} alt="" /> : <span className="music-record__label music-record__label--empty" />}<span className="music-record__spindle" /></span></span>
}

function PlaybackError({ error, currentTrack, playTrack }) {
  if (!error) return null
  return <div className="music-error" role="alert"><p>{typeof error === 'string' ? error : 'This song couldn’t play. Give it another try.'}</p>{currentTrack ? <button type="button" onClick={() => playTrack(currentTrack)}>Try again <Icon name="refresh" size={14} /></button> : null}</div>
}

function useDeckControlsVisible() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined
    let intersectionObserver
    let mountObserver
    let controls

    function observeControls() {
      intersectionObserver?.disconnect()
      // The fixed header also covers part of the viewport. Wait until the
      // complete control row is clear of it before handing playback back.
      const headerBottom = Math.max(0, document.querySelector('.site-header')?.getBoundingClientRect().bottom || 0)
      intersectionObserver = new IntersectionObserver(([entry]) => {
        setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.999)
      }, { rootMargin: `-${Math.ceil(headerBottom)}px 0px 0px 0px`, threshold: [0, 0.999, 1] })
      intersectionObserver.observe(controls)
    }

    function findControls() {
      controls = document.querySelector('.music-deck-actions')
      if (!controls) return
      mountObserver?.disconnect()
      observeControls()
    }

    findControls()
    if (!controls) {
      // The turntable is lazy-loaded; stop watching the DOM once it mounts.
      mountObserver = new MutationObserver(findControls)
      mountObserver.observe(document.querySelector('.hero-turntable') || document.body, { childList: true, subtree: true })
    }
    const onResize = () => { if (controls?.isConnected) observeControls() }
    window.addEventListener('resize', onResize)
    return () => {
      intersectionObserver?.disconnect()
      mountObserver?.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return visible
}

export function MusicStart({ className = '' }) {
  const { currentTrack, isPlaying, status, drawerOpen, setDrawerOpen } = useMusic()
  return <button type="button" className={`music-start ${className}`} onClick={() => setDrawerOpen(true)} aria-haspopup="dialog" aria-expanded={drawerOpen} aria-label={currentTrack ? `Open playlist. ${isPlaying ? 'Playing' : 'Selected'}: ${currentTrack.title}` : 'Open playlist'}>
    <span className="music-start__icon">{currentTrack ? <PlayingBars playing={isPlaying} /> : <MusicIcon name="record" />}</span>
    <span className="music-start__copy"><span className="music-start__label">{currentTrack ? status === 'loading' ? 'LOADING' : isPlaying ? 'PLAYING' : 'PAUSED' : 'PLAYLIST'}</span><span className="music-start__title">{currentTrack?.title || 'Pick a song'}</span></span>
    <span className="music-start__arrow" aria-hidden="true"><Icon name="arrow-up-right" /></span>
  </button>
}

export function NowPlayingDock() {
  const { currentTrack, status, isPlaying, position, duration, volume, muted, repeat, error, drawerOpen, setDrawerOpen, playTrack, toggle, next, previous, seek, setVolume, setMuted, setRepeat, stop } = useMusic()
  const [expanded, setExpanded] = useState(false)
  const deckControlsVisible = useDeckControlsVisible()
  const detailsId = useId()
  const seekId = useId()
  const volumeId = useId()
  if (!currentTrack) return null
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0
  const safePosition = Math.min(Math.max(Number.isFinite(position) ? position : 0, 0), safeDuration)
  const progress = safeDuration > 0 ? safePosition / safeDuration * 100 : 0
  const actualVolume = Math.min(1, Math.max(0, Number.isFinite(volume) ? volume : 1))
  const playbackRequested = isPlaying || status === 'loading'
  const statusLabel = status === 'loading' ? 'Cueing up' : status === 'error' ? 'Playback interrupted' : isPlaying ? 'Now playing' : 'On pause'

  // While a YouTube pick plays, the dock stays on screen: YouTube's terms want the player visible.
  return <section className={`music-dock${expanded ? ' music-dock--expanded' : ''}`} hidden={deckControlsVisible && !expanded} role="region" aria-label="Now playing music player">
    <div className="music-dock__heading"><span className="music-dock__status"><PlayingBars playing={isPlaying} />{statusLabel}</span><div className="music-dock__tools"><button type="button" className="music-queue-button" onClick={() => setDrawerOpen(true)} aria-haspopup="dialog" aria-expanded={drawerOpen}><MusicIcon name="queue" />Playlist</button><button type="button" className="music-icon-button music-details-button" onClick={() => setExpanded(value => !value)} aria-label={expanded ? 'Collapse player controls' : 'Expand player controls'} aria-expanded={expanded} aria-controls={detailsId} title={expanded ? 'Collapse player controls' : 'More player controls'}><MusicIcon name={expanded ? 'collapse' : 'expand'} /></button><button type="button" className="music-icon-button music-dock__close" onClick={stop} aria-label="Stop the music and hide the player" title="Stop and hide"><Icon name="close" size={16} /></button></div></div>
    <div className="music-dock__main">
      {/* The YouTube player lives here for the whole session (an iframe reloads if moved); it stands in for the record while a pick plays. */}
      <RecordArtwork track={currentTrack} playing={isPlaying} /><div className="music-dock__track"><span className="music-dock__title" title={currentTrack.title}>{currentTrack.title}</span><span className="music-dock__artist" title={currentTrack.artist}>{currentTrack.artist}</span></div><div className="music-transport"><button type="button" className="music-icon-button music-transport__skip" onClick={previous} aria-label="Previous song" title="Previous song"><MusicIcon name="previous" /></button><button type="button" className="music-icon-button music-transport__play" onClick={toggle} aria-label={playbackRequested ? 'Pause music' : 'Play music'} title={playbackRequested ? 'Pause' : 'Play'} aria-busy={status === 'loading'}><MusicIcon name={playbackRequested ? 'pause' : 'play'} /></button><button type="button" className="music-icon-button music-transport__skip" onClick={next} aria-label="Next song" title="Next song"><MusicIcon name="next" /></button></div></div>
    <div className="music-dock__progress-line" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
    <div className="music-dock__details" id={detailsId} hidden={!expanded}>
      <div className="music-seek"><label className="music-sr-only" htmlFor={seekId}>Song position</label><input id={seekId} className="music-range" type="range" min="0" max={safeDuration || 1} step="0.1" value={safePosition} disabled={!safeDuration} onChange={event => seek(Number(event.target.value))} aria-valuetext={`${formatTime(safePosition)} of ${formatTime(safeDuration)}`} style={{ '--music-range-fill': `${progress}%` }} /><div className="music-seek__times" aria-hidden="true"><span>{formatTime(safePosition)}</span><span>{safeDuration ? formatTime(safeDuration) : '—:—'}</span></div></div>
      <div className="music-dock__settings"><div className="music-volume"><button type="button" className="music-icon-button" onClick={() => setMuted(!muted)} aria-label={muted ? 'Unmute music' : 'Mute music'} title={muted ? 'Unmute' : 'Mute'} aria-pressed={muted}><MusicIcon name={muted || actualVolume === 0 ? 'muted' : 'volume'} /></button><label className="music-sr-only" htmlFor={volumeId}>Music volume</label><input id={volumeId} className="music-range" type="range" min="0" max="1" step="0.01" value={actualVolume} onChange={event => { setVolume(Number(event.target.value)); if (muted) setMuted(false) }} aria-valuetext={`${Math.round(actualVolume * 100)} percent`} style={{ '--music-range-fill': `${actualVolume * 100}%` }} /></div><button type="button" className="music-repeat" onClick={() => setRepeat(!repeat)} aria-pressed={repeat} aria-label={repeat ? 'Turn off playlist repeat' : 'Repeat playlist'}><MusicIcon name="repeat" /><span>Repeat{repeat ? ' on' : ''}</span></button></div>
    </div>
    <PlaybackError error={error} currentTrack={currentTrack} playTrack={playTrack} />
    <span className="music-sr-only" role="status">{currentTrack.title} by {currentTrack.artist}</span>
  </section>
}

export function PlaylistDrawer() {
  const { playlist, currentTrack, isPlaying, status, error, drawerOpen, setDrawerOpen, playTrack, toggle } = useMusic()
  const dialogRef = useRef(null)
  const titleId = useId()
  const featuredTrack = currentTrack || playlist[0]
  const totalDuration = playlist.reduce((total, track) => total + (Number.isFinite(track.durationSeconds) ? track.durationSeconds : 0), 0)

  useEffect(() => {
    if (!drawerOpen) return undefined
    const dialog = dialogRef.current
    if (!dialog) return undefined
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    if (!dialog.open) dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus?.({ preventScroll: true })
    }
  }, [drawerOpen])

  return <dialog ref={dialogRef} className="music-drawer" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); setDrawerOpen(false) }} onClick={event => { if (event.target === dialogRef.current) setDrawerOpen(false) }}>
    <div className="music-drawer__inner">
      <header className="music-drawer__top"><span className="music-eyebrow">PLAYLIST</span><button type="button" className="music-icon-button music-drawer__close" onClick={() => setDrawerOpen(false)} aria-label="Close playlist" autoFocus><MusicIcon name="close" /></button></header>
      <div className="music-drawer__intro"><h2 id={titleId}>Pick a <em>song.</em></h2></div>
      <div className="music-playlist-cover"><div className="music-playlist-cover__sleeve">{featuredTrack?.coverUrl ? <img src={featuredTrack.coverUrl} alt={`${featuredTrack.album || featuredTrack.title} album artwork`} /> : <span aria-hidden="true">♫</span>}</div><RecordArtwork track={featuredTrack} playing={isPlaying} className="music-playlist-cover__record" /></div>
      <div className="music-playlist-heading"><div><h3>The playlist</h3><span>{playlist.length} {playlist.length === 1 ? 'song' : 'songs'}{totalDuration > 0 ? ` · ${Math.round(totalDuration / 60)} minutes` : ''}</span></div>{currentTrack ? <span className="music-playlist-heading__status"><PlayingBars playing={isPlaying} /><span>{status === 'loading' ? 'Cueing up' : isPlaying ? 'Playing' : 'Paused'}</span></span> : null}</div>
      <ol className="music-playlist" aria-label="Choose a song">{playlist.map((track, index) => {
        const active = track.id === currentTrack?.id
        const playbackRequested = active && (isPlaying || status === 'loading')
        return <li key={track.id}><button type="button" className={`music-track${active ? ' music-track--active' : ''}`} onClick={() => active && status !== 'error' ? toggle() : playTrack(track)} aria-label={`${playbackRequested ? 'Pause' : 'Play'} ${track.title} by ${track.artist}`} aria-current={active ? 'true' : undefined} aria-busy={active && status === 'loading'}><span className="music-track__number" aria-hidden="true">{active ? <PlayingBars playing={isPlaying} /> : String(index + 1).padStart(2, '0')}</span><span className="music-track__cover">{track.coverUrl ? <img src={track.coverUrl} alt="" loading="lazy" /> : <MusicIcon name="record" />}<span className="music-track__action"><MusicIcon name={playbackRequested ? 'pause' : 'play'} /></span></span><span className="music-track__text"><span className="music-track__title">{track.title}</span><span className="music-track__artist">{track.artist}</span></span><span className="music-track__duration">{Number.isFinite(track.durationSeconds) && track.durationSeconds > 0 ? formatTime(track.durationSeconds) : '—:—'}</span></button></li>
      })}</ol>
      {playlist.length === 0 ? <p className="music-drawer__empty">No songs yet.</p> : null}
      <YourPicks />
      <SongSearch />
      <PlaybackError error={error} currentTrack={currentTrack} playTrack={playTrack} />
      <footer className="music-drawer__footer"><button type="button" onClick={() => setDrawerOpen(false)}>Back to the page <Icon name="arrow-up-right" size={14} /></button></footer>
    </div>
  </dialog>
}


/* Songs the visitor added themselves: they sit after Diego's playlist in the queue. */
function YourPicks() {
  const { picks, playlist, currentTrack, isPlaying, status, playTrack, toggle, removePick } = useMusic()
  if (!picks.length) return null
  return <>
    <div className="music-playlist-heading music-playlist-heading--picks"><div><h3>Your picks.</h3><span>{picks.length} {picks.length === 1 ? 'song' : 'songs'} · remembered in this browser</span></div></div>
    <ol className="music-playlist" aria-label="Your picks">{picks.map((track, index) => {
      const active = track.id === currentTrack?.id
      const playbackRequested = active && (isPlaying || status === 'loading')
      return <li key={track.id} className="music-pick">
        <button type="button" className={`music-track${active ? ' music-track--active' : ''}`} onClick={() => active && status !== 'error' ? toggle() : playTrack(track)} aria-label={`${playbackRequested ? 'Pause' : 'Play'} ${track.title} by ${track.artist}`} aria-current={active ? 'true' : undefined} aria-busy={active && status === 'loading'}>
          <span className="music-track__number" aria-hidden="true">{active ? <PlayingBars playing={isPlaying} /> : String(playlist.length + index + 1).padStart(2, '0')}</span>
          <span className="music-track__cover">{track.coverUrl ? <img src={track.coverUrl} alt="" loading="lazy" /> : <MusicIcon name="record" />}<span className="music-track__action"><MusicIcon name={playbackRequested ? 'pause' : 'play'} /></span></span>
          <span className="music-track__text"><span className="music-track__title">{track.title}</span><span className="music-track__artist">{track.artist}{track.youtubeId ? '' : ' · 30s preview'}</span></span>
          <span className="music-track__duration">{Number.isFinite(track.durationSeconds) && track.durationSeconds > 0 ? formatTime(track.durationSeconds) : '—:—'}</span>
        </button>
        <button type="button" className="music-icon-button music-pick__remove" onClick={() => removePick(track.id)} aria-label={`Remove ${track.title} from your picks`} title="Remove"><MusicIcon name="remove" /></button>
      </li>
    })}</ol>
  </>
}

/* Search any song (iTunes catalogue for titles and artwork), then play the whole thing through
   YouTube when a Data API key is configured, or its 30-second preview when it is not. */
function SongSearch() {
  const { addPick, playTrack, youtubeEnabled, setDrawerOpen } = useMusic()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [resolving, setResolving] = useState(null)
  const [message, setMessage] = useState('')
  const [album, setAlbum] = useState(null)          // { name, artist, tracks } when the query names an album
  const [videos, setVideos] = useState(null)        // direct YouTube results, only on request
  const [videoBusy, setVideoBusy] = useState(false)
  const [lastQuery, setLastQuery] = useState('')
  const inputId = useId()
  const requestRef = useRef(0)
  const plain = value => (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()

  async function search(event) {
    event.preventDefault()
    const term = query.trim()
    if (!term) return
    const request = ++requestRef.current
    setSearching(true)
    setMessage('')
    try {
      setVideos(null)
      setAlbum(null)
      setLastQuery(term)
      const response = await fetch(`/api/itunes?term=${encodeURIComponent(term)}`)   // our proxy: phones can't reach iTunes directly (see api/itunes.js)
      const data = await response.json()
      if (request !== requestRef.current) return
      const wanted = plain(term)
      // Songs by an artist named in the query come first; the rest keep iTunes' order.
      const found = [...(data.results || [])].sort((a, b) => Number(wanted.includes(plain(b.artistName))) - Number(wanted.includes(plain(a.artistName))))
      setResults(found.slice(0, 12))
      if (!found.length) {
        if (youtubeEnabled) { void findOnYouTube(term); return }   // straight to YouTube, no extra tap
        setMessage('Nothing turned up. Try the artist and the title together.')
      }
      // If the query names an album (typing "debí tirar más fotos" should show every song on it, not only the ones
      // whose titles happen to match), fetch that album's full track list too.
      const byAlbum = new Map()
      for (const track of found) {
        const name = plain(track.collectionName)
        if (name.length > 3 && (wanted.includes(name) || name.includes(wanted))) byAlbum.set(track.collectionId, (byAlbum.get(track.collectionId) || 0) + 1)
      }
      const best = [...byAlbum.entries()].sort((a, b) => b[1] - a[1])[0]
      if (best) {
        const lookup = await fetch(`/api/itunes?lookup=${best[0]}`)
        const listing = await lookup.json()
        if (request !== requestRef.current) return
        const collection = (listing.results || []).find(item => item.wrapperType === 'collection')
        const tracks = (listing.results || []).filter(item => item.wrapperType === 'track' && item.previewUrl)
        if (collection && tracks.length) setAlbum({ name: collection.collectionName, artist: collection.artistName, tracks })
      }
    } catch {
      if (request !== requestRef.current) return
      // iTunes is flaky from some networks (phones especially); YouTube can answer the same query.
      if (youtubeEnabled) void findOnYouTube(term)
      else setMessage('The search didn’t go through. Check your connection and try again.')
    } finally {
      if (request === requestRef.current) setSearching(false)
    }
  }

  async function pickVideo(video) {
    const track = { id: `yt-${video.videoId}`, title: video.title, artist: video.channel, album: 'YouTube', coverUrl: video.thumbnail, youtubeId: video.videoId, durationSeconds: 0 }
    addPick(track)
    playTrack(track)
    setResults([]); setAlbum(null); setVideos(null); setQuery('')
    setDrawerOpen(false)
  }

  async function findOnYouTube(term = lastQuery) {
    if (videoBusy || !term) return
    setVideoBusy(true)
    setMessage('')
    try { setVideos(await searchYouTube(term)) } catch { setMessage('YouTube search didn’t go through. It may be out of quota for today.') }
    setVideoBusy(false)
  }

  async function pick(result) {
    if (resolving) return
    const base = {
      id: `pick-${result.trackId}`,
      title: result.trackName,
      artist: result.artistName,
      album: result.collectionName,
      coverUrl: (result.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
    }
    let youtubeId = null
    if (youtubeEnabled) {
      setResolving(result.trackId)
      try { youtubeId = await resolveYouTubeVideo({ id: result.trackId, title: result.trackName, artist: result.artistName }) } catch { youtubeId = null }
      setResolving(null)
    }
    const track = youtubeId
      ? { ...base, youtubeId, durationSeconds: Number.isFinite(result.trackTimeMillis) ? result.trackTimeMillis / 1000 : 0 }
      : { ...base, audio: result.previewUrl, durationSeconds: 30 }
    if (!track.youtubeId && !track.audio) { setMessage('That song has no playable version here. Try another.'); return }
    addPick(track)
    playTrack(track)
    setResults([]); setAlbum(null); setVideos(null)
    setQuery('')
    if (track.youtubeId) setDrawerOpen(false)   // the video plays in the dock, so get out of its way
  }

  const renderResult = (result, index) => {
    const busy = resolving === result.trackId
    return <li key={result.trackId}><button type="button" className="music-track" onClick={() => pick(result)} disabled={resolving !== null && !busy} aria-busy={busy} aria-label={`Play ${result.trackName} by ${result.artistName}`}>
      <span className="music-track__number" aria-hidden="true">{index !== undefined ? String(index).padStart(2, '0') : <MusicIcon name="play" />}</span>
      <span className="music-track__cover">{result.artworkUrl100 ? <img src={result.artworkUrl100} alt="" loading="lazy" /> : <MusicIcon name="record" />}</span>
      <span className="music-track__text"><span className="music-track__title">{result.trackName}</span><span className="music-track__artist">{busy ? 'Finding the full track…' : result.artistName}</span></span>
      <span className="music-track__duration">{Number.isFinite(result.trackTimeMillis) ? formatTime(result.trackTimeMillis / 1000) : '—:—'}</span>
    </button></li>
  }

  return <section className="music-search" aria-labelledby={`${inputId}-heading`}>
    <div className="music-playlist-heading"><div><h3 id={`${inputId}-heading`}>Or choose your own.</h3><span>{youtubeEnabled ? 'Any song. Full length, through YouTube.' : 'Any song, as a 30-second preview.'}</span></div></div>
    <form className="music-search__form" onSubmit={search} role="search">
      <label className="music-sr-only" htmlFor={inputId}>Search for a song</label>
      <MusicIcon name="search" className="music-search__icon" />
      <input id={inputId} className="music-search__input" type="search" placeholder="Song or artist…" value={query} onChange={event => setQuery(event.target.value)} autoComplete="off" spellCheck="false" />
      <button type="submit" className="music-search__submit" disabled={searching || !query.trim()}>{searching ? 'Searching…' : 'Find it'}</button>
    </form>
    {message ? <p className="music-search__message" role="status">{message}</p> : null}
    {results.length ? <ol className="music-playlist music-search__results" aria-label="Search results">{results.map(result => renderResult(result))}</ol> : null}
    {album ? <>
      <div className="music-playlist-heading music-playlist-heading--album"><div><h3>From the album <em>{album.name}</em></h3><span>{album.artist} · {album.tracks.length} songs</span></div></div>
      <ol className="music-playlist music-search__results" aria-label={`Songs on ${album.name}`}>{album.tracks.map(track => renderResult(track, track.trackNumber))}</ol>
    </> : null}
    {youtubeEnabled && lastQuery && !videos ? <button type="button" className="music-search__youtube" onClick={findOnYouTube} disabled={videoBusy}>{videoBusy ? 'Searching YouTube…' : <>Not here? Search YouTube for “{lastQuery}” <Icon name="arrow-up-right" size={14} /></>}</button> : null}
    {videos ? <>
      <div className="music-playlist-heading music-playlist-heading--album"><div><h3>On YouTube</h3><span>{videos.length ? 'Full videos, played right here.' : 'Nothing embeddable came back.'}</span></div></div>
      <ol className="music-playlist music-search__results" aria-label="YouTube results">{videos.map(video => <li key={video.videoId}><button type="button" className="music-track" onClick={() => pickVideo(video)} aria-label={`Play ${video.title} from ${video.channel}`}>
        <span className="music-track__number" aria-hidden="true"><MusicIcon name="play" /></span>
        <span className="music-track__cover music-track__cover--wide">{video.thumbnail ? <img src={video.thumbnail} alt="" loading="lazy" /> : <MusicIcon name="record" />}</span>
        <span className="music-track__text"><span className="music-track__title">{video.title}</span><span className="music-track__artist">{video.channel}</span></span>
        <span className="music-track__duration">—:—</span>
      </button></li>)}</ol>
    </> : null}
  </section>
}
