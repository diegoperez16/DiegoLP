/* Find the YouTube video for a song so the jukebox can play the whole track instead of the
   30-second iTunes preview. Needs a YouTube Data API v3 key in VITE_YOUTUBE_API_KEY (see
   .env.example). Without a key the jukebox silently keeps playing previews.

   Quota: a search costs 100 of the free 10 000 daily units, so about 100 fresh lookups a
   day. Results are cached in localStorage per iTunes track id, so repeat plays cost nothing. */

const KEY = import.meta.env.VITE_YOUTUBE_API_KEY
const CACHE_KEY = 'jukebox.youtube.v1'

export const youtubeEnabled = Boolean(KEY)

function readCache() {
  try { return JSON.parse(window.localStorage.getItem(CACHE_KEY)) || {} } catch { return {} }
}

function writeCache(cache) {
  try { window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache)) } catch { /* private mode etc. */ }
}

/* Prefer uploads that are plainly the song itself over live takes, covers and reaction videos. */
function score(item, track) {
  const title = (item.snippet?.title || '').toLowerCase()
  const channel = (item.snippet?.channelTitle || '').toLowerCase()
  const artist = (track.artist || '').toLowerCase()
  let points = 0
  if (title.includes(track.title.toLowerCase())) points += 3
  if (artist && (title.includes(artist) || channel.includes(artist))) points += 2
  if (/official (audio|video|music video)|lyric|topic|vevo/.test(title + ' ' + channel)) points += 2
  if (/live|cover|reaction|karaoke|remix|sped up|slowed|nightcore|tutorial/.test(title)) points -= 3
  return points
}

export async function resolveYouTubeVideo(track) {
  if (!KEY) return null
  const cache = readCache()
  const cacheKey = String(track.id)
  if (cacheKey in cache) return cache[cacheKey]

  const params = new URLSearchParams({
    part: 'snippet', type: 'video', videoCategoryId: '10', videoEmbeddable: 'true', videoSyndicated: 'true',
    maxResults: '5', q: `${track.title} ${track.artist}`, key: KEY,
  })
  const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`)
  if (!response.ok) throw new Error(`YouTube search failed (${response.status})`)
  const data = await response.json()
  const best = [...(data.items || [])].sort((a, b) => score(b, track) - score(a, track))[0]
  const videoId = best?.id?.videoId || null
  cache[cacheKey] = videoId
  writeCache(cache)
  return videoId
}

/* Remember that a video refused to play here (embedding disabled, removed) so we do not retry it. */
export function forgetYouTubeVideo(track) {
  const cache = readCache()
  cache[String(track.id)] = null
  writeCache(cache)
}

/* Direct search when the iTunes catalogue doesn't have what the visitor typed. Costs 100 quota units per
   query like resolveYouTubeVideo does, so the UI only offers it after an iTunes search has run. */
export async function searchYouTube(query) {
  if (!KEY) return []
  const params = new URLSearchParams({
    part: 'snippet', type: 'video', videoCategoryId: '10', videoEmbeddable: 'true', videoSyndicated: 'true',
    maxResults: '8', q: query, key: KEY,
  })
  const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`)
  if (!response.ok) throw new Error(`YouTube search failed (${response.status})`)
  const data = await response.json()
  return (data.items || []).filter(item => item.id?.videoId).map(item => ({
    videoId: item.id.videoId,
    title: (item.snippet.title || '').replace(/\s*[\(\[][^\)\]]*(official|video|audio|lyric|visualizer|hd|4k)[^\)\]]*[\)\]]/gi, '').trim(),
    channel: (item.snippet.channelTitle || '').replace(/\s*-\s*Topic$/i, '').replace(/VEVO$/i, '').trim(),
    thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || '',
  }))
}
