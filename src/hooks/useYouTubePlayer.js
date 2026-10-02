import { useCallback, useEffect, useMemo, useRef } from 'react'

/* One YouTube IFrame player for the listening room's jukebox. The API script is fetched
   on demand (only when someone opens the jukebox), the player is created once inside the
   host element and reused for every track, and the same hook drives play/pause/stop so
   the jukebox controls do not care whether a track is a YouTube video or an <audio> preview.
   The player stays visible (a small screen under the now-playing pill): YouTube's terms
   require the embedded player to be shown, not hidden. */

let apiPromise = null

function loadApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (!apiPromise) {
    apiPromise = new Promise(resolve => {
      const previous = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        previous?.()
        resolve(window.YT)
      }
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      document.head.appendChild(script)
    })
  }
  return apiPromise
}

export function useYouTubePlayer(hostRef, handlers) {
  const playerRef = useRef(null)
  const creatingRef = useRef(null)
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => () => {
    const player = playerRef.current
    playerRef.current = null
    creatingRef.current = null
    try { player?.destroy?.() } catch { /* the iframe may already be gone */ }
  }, [])

  /* Create (or return) the player. Call this when the jukebox opens so that, by the time a
     track is picked, loading the video is synchronous and still inside the click's activation. */
  const warm = useCallback(() => {
    if (playerRef.current) return Promise.resolve(playerRef.current)
    if (creatingRef.current) return creatingRef.current
    creatingRef.current = (async () => {
      const YT = await loadApi()
      // The host may mount a frame or two after the track is chosen (the dock appears with the first track).
      let host = hostRef.current
      for (let tries = 0; !host && tries < 120; tries++) {
        await new Promise(resolve => requestAnimationFrame(resolve))
        host = hostRef.current
      }
      if (!host) { creatingRef.current = null; return null }
      const mount = document.createElement('div')
      host.replaceChildren(mount)
      return new Promise(resolve => {
        const player = new YT.Player(mount, {
          width: '100%',
          height: '100%',
          playerVars: { controls: 0, disablekb: 1, playsinline: 1, rel: 0, modestbranding: 1, origin: window.location.origin },
          events: {
            onReady: () => { playerRef.current = player; resolve(player) },
            onStateChange: event => {
              if (event.data === YT.PlayerState.ENDED) handlersRef.current?.onEnded?.()
              handlersRef.current?.onStateChange?.(event.data)
            },
            onError: event => handlersRef.current?.onError?.(event.data),
          },
        })
      })
    })()
    return creatingRef.current
  }, [hostRef])

  const load = useCallback(async videoId => {
    const player = await warm()
    if (!player || !playerRef.current) return false
    player.loadVideoById(videoId)
    return true
  }, [warm])

  const play = useCallback(() => playerRef.current?.playVideo?.(), [])
  const pause = useCallback(() => playerRef.current?.pauseVideo?.(), [])
  const stop = useCallback(() => playerRef.current?.stopVideo?.(), [])
  const seek = useCallback(seconds => playerRef.current?.seekTo?.(seconds, true), [])
  const getTime = useCallback(() => playerRef.current?.getCurrentTime?.() ?? 0, [])
  const getDuration = useCallback(() => playerRef.current?.getDuration?.() ?? 0, [])
  const setVolume = useCallback(volume => playerRef.current?.setVolume?.(Math.round(Math.max(0, Math.min(1, volume)) * 100)), [])
  const setMuted = useCallback(muted => (muted ? playerRef.current?.mute?.() : playerRef.current?.unMute?.()), [])

  return useMemo(() => ({ warm, load, play, pause, stop, seek, getTime, getDuration, setVolume, setMuted }),
    [warm, load, play, pause, stop, seek, getTime, getDuration, setVolume, setMuted])
}
