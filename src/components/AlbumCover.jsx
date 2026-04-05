import './AlbumCover.css'

// Abstract geometric patterns per album genre
function AlbumArt({ album }) {
  const patterns = {
    about: (
      <svg viewBox="0 0 200 200" className="album-art-svg">
        <defs>
          <radialGradient id="ag0" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor={album.accentColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={album.gradientA} stopOpacity="1" />
          </radialGradient>
        </defs>
        <rect width="200" height="200" fill={`url(#ag0)`} />
        {[0.9, 0.7, 0.5, 0.3].map((r, i) => (
          <circle key={i} cx="100" cy="100" r={r * 90} fill="none" stroke={album.accentColor} strokeWidth="0.5" strokeOpacity={0.3 + i * 0.1} />
        ))}
        <circle cx="100" cy="100" r="28" fill={album.accentColor} fillOpacity="0.15" />
        <circle cx="100" cy="100" r="14" fill={album.accentColor} fillOpacity="0.35" />
        <circle cx="100" cy="100" r="5" fill={album.accentColor} />
      </svg>
    ),
    education: (
      <svg viewBox="0 0 200 200" className="album-art-svg">
        <defs>
          <linearGradient id="ag-edu" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={album.gradientA} />
            <stop offset="100%" stopColor={album.gradientB} />
          </linearGradient>
        </defs>
        <rect width="200" height="200" fill="url(#ag-edu)" />
        {/* Mortarboard */}
        <polygon points="100,44 166,74 100,104 34,74" fill={album.accentColor} fillOpacity="0.5" stroke={album.accentColor} strokeWidth="1" strokeOpacity="0.5" />
        <rect x="137" y="74" width="5" height="36" fill={album.accentColor} fillOpacity="0.5" />
        <ellipse cx="139.5" cy="112" rx="10" ry="6" fill={album.accentColor} fillOpacity="0.5" />
        {/* Book */}
        {[130, 144, 158].map((y, i) => (
          <line key={i} x1="34" y1={y} x2="116" y2={y} stroke={album.accentColor} strokeWidth="1.5" strokeOpacity={0.2 + i * 0.08} />
        ))}
        <rect x="32" y="120" width="86" height="46" fill="none" stroke={album.accentColor} strokeWidth="1.2" strokeOpacity="0.3" rx="3" />
      </svg>
    ),
    experience: (
      <svg viewBox="0 0 200 200" className="album-art-svg">
        <defs>
          <linearGradient id="ag1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={album.gradientA} />
            <stop offset="100%" stopColor={album.gradientB} />
          </linearGradient>
        </defs>
        <rect width="200" height="200" fill={`url(#ag1)`} />
        {[20, 40, 60, 80, 100, 120, 140, 160, 180].map((x, i) => (
          <line key={i} x1={x} y1="0" x2={x} y2="200" stroke={album.accentColor} strokeWidth="0.4" strokeOpacity="0.25" />
        ))}
        {[30, 60, 90, 120, 150].map((h, i) => (
          <rect key={i} x={20 + i * 34} y={200 - h} width="22" height={h} fill={album.accentColor} fillOpacity={0.15 + i * 0.1} rx="2" />
        ))}
        <polyline points="20,160 54,140 88,100 122,80 156,55 190,35" fill="none" stroke={album.accentColor} strokeWidth="2" strokeOpacity="0.7" />
      </svg>
    ),
    projects: (
      <svg viewBox="0 0 200 200" className="album-art-svg">
        <defs>
          <linearGradient id="ag2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={album.gradientA} />
            <stop offset="100%" stopColor={album.gradientB} />
          </linearGradient>
        </defs>
        <rect width="200" height="200" fill={`url(#ag2)`} />
        {[[30,30,80,80],[120,30,60,60],[80,120,90,50],[30,140,60,40]].map(([x,y,w,h],i) => (
          <rect key={i} x={x} y={y} width={w} height={h} fill="none" stroke={album.accentColor} strokeWidth="1.5" strokeOpacity={0.3 + i*0.1} rx="4" />
        ))}
        <rect x="60" y="60" width="80" height="80" fill={album.accentColor} fillOpacity="0.12" rx="6" />
        <line x1="0" y1="0" x2="200" y2="200" stroke={album.accentColor} strokeWidth="0.5" strokeOpacity="0.15" />
        <line x1="200" y1="0" x2="0" y2="200" stroke={album.accentColor} strokeWidth="0.5" strokeOpacity="0.15" />
      </svg>
    ),
    skills: (
      <svg viewBox="0 0 200 200" className="album-art-svg">
        <defs>
          <linearGradient id="ag3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={album.gradientA} />
            <stop offset="100%" stopColor={album.gradientB} />
          </linearGradient>
        </defs>
        <rect width="200" height="200" fill={`url(#ag3)`} />
        {[0,1,2,3,4,5].map(i => {
          const angle = (i / 6) * Math.PI * 2 - Math.PI / 2
          const x = 100 + Math.cos(angle) * 65
          const y = 100 + Math.sin(angle) * 65
          return <line key={i} x1="100" y1="100" x2={x} y2={y} stroke={album.accentColor} strokeWidth="1" strokeOpacity="0.5" />
        })}
        {[0,1,2,3,4,5].map(i => {
          const angle = (i / 6) * Math.PI * 2 - Math.PI / 2
          const x = 100 + Math.cos(angle) * 65
          const y = 100 + Math.sin(angle) * 65
          return <circle key={i} cx={x} cy={y} r="7" fill={album.accentColor} fillOpacity="0.6" />
        })}
        <polygon
          points={[0,1,2,3,4,5].map(i => {
            const angle = (i / 6) * Math.PI * 2 - Math.PI / 2
            return `${100 + Math.cos(angle) * 65},${100 + Math.sin(angle) * 65}`
          }).join(' ')}
          fill={album.accentColor}
          fillOpacity="0.08"
          stroke={album.accentColor}
          strokeWidth="1"
          strokeOpacity="0.3"
        />
      </svg>
    ),
    contact: (
      <svg viewBox="0 0 200 200" className="album-art-svg">
        <defs>
          <radialGradient id="ag4" cx="30%" cy="30%" r="80%">
            <stop offset="0%" stopColor={album.gradientB} />
            <stop offset="100%" stopColor={album.gradientA} />
          </radialGradient>
        </defs>
        <rect width="200" height="200" fill={`url(#ag4)`} />
        {[30,50,70,90].map((r,i) => (
          <circle key={i} cx="100" cy="100" r={r} fill="none" stroke={album.accentColor} strokeWidth="1" strokeOpacity={0.2 + i*0.08} strokeDasharray="4 6" />
        ))}
        <path d="M100 40 L160 80 L160 140 L100 170 L40 140 L40 80 Z" fill="none" stroke={album.accentColor} strokeWidth="1" strokeOpacity="0.35" />
        <circle cx="100" cy="100" r="16" fill={album.accentColor} fillOpacity="0.7" />
      </svg>
    ),
  }

  return patterns[album.id] || patterns.about
}

export function AlbumCover({ album, isSelected }) {
  return (
    <div className={`album-cover ${isSelected ? 'album-cover--selected' : ''}`}>
      {/* Album artwork */}
      <div className="album-cover__art">
        <AlbumArt album={album} />
        {/* Sheen overlay */}
        <div className="album-cover__sheen" />
      </div>

      {/* Label info */}
      <div className="album-cover__info">
        <span className="album-cover__genre">{album.genre}</span>
        <h3 className="album-cover__title">{album.title}</h3>
        <p className="album-cover__artist">{album.artist}</p>
        <span className="album-cover__year">{album.rpm} RPM · {album.year}</span>
      </div>

      {/* Vinyl peek */}
      <div className="cs-vinyl-peek" />
    </div>
  )
}
