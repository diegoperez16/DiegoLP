import { useState } from 'react'
import './Jukebox.css'

export function Jukebox({ onSelectTrack, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  async function handleSearch(e) {
    if (e.key === 'Enter' && query.trim()) {
      setLoading(true)
      try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=12`)
        const data = await res.json()
        setResults(data.results || [])
      } catch (err) {
        console.error('Failed to fetch from iTunes', err)
      }
      setLoading(false)
    }
  }

  return (
    <div className="jukebox-overlay">
      <div className="jukebox-panel">
        <div className="jukebox-header">
          <h3>Jukebox Mode</h3>
          <button className="jukebox-close" onClick={onClose} aria-label="Close Jukebox">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <input 
          type="text" 
          placeholder="Search for any song... (Press Enter)" 
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleSearch}
          autoFocus
          className="jukebox-input"
        />
        {loading && <div className="jukebox-loading">Digging through the crates...</div>}
        <div className="jukebox-results">
          {results.map((t) => {
            // Replace the 100x100 thumbnail with a high resolution 600x600 for the picture disc
            const highResCover = t.artworkUrl100.replace('100x100bb', '600x600bb')
            return (
              <button 
                key={t.trackId} 
                className="jukebox-track"
                onClick={() => onSelectTrack({
                  id: t.trackId,
                  title: t.trackName,
                  artist: t.artistName,
                  coverUrl: highResCover,
                  previewUrl: t.previewUrl,
                  color: '#ffffff'
                })}
              >
                <img src={t.artworkUrl100} alt="" className="jukebox-thumb" />
                <div className="jukebox-info">
                  <div className="jukebox-title">{t.trackName}</div>
                  <div className="jukebox-artist">{t.artistName}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
