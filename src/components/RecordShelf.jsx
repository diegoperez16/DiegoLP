import { useRef, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'
import './RecordShelf.css'

/* ── Album art SVGs with gritty textures ── */
function AlbumArt({ album, size = 110 }) {
  const id = `rs-${album.id}`
  const w = size, h = size, cx = size / 2, cy = size / 2
  const noiseId = `${id}-noise`
  const ringWearId = `${id}-wear`

  /* Shared defs reused across all patterns */
  const sharedDefs = (
    <>
      {/* feTurbulence cardboard grain */}
      <filter id={noiseId} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.72 0.68" numOctaves="4" seed={album.id.charCodeAt(0)} result="noise" />
        <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
        <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="blended" />
        <feComposite in="blended" in2="SourceGraphic" operator="in" />
      </filter>
      {/* Ring wear blur filter */}
      <filter id={ringWearId}>
        <feGaussianBlur stdDeviation="2.2" />
      </filter>
    </>
  )

  /* Artist name + ring wear + creases overlay (common to all) */
  function Overlay() {
    return (
      <>
        {/* Ring wear — blurred circle where vinyl pressed against cardboard */}
        <circle
          cx={cx} cy={cy} r={cx * 0.76}
          fill="none"
          stroke="rgba(0,0,0,0.55)"
          strokeWidth="7"
          filter={`url(#${ringWearId})`}
          style={{ mixBlendMode: 'multiply' }}
        />
        {/* Corner creases */}
        <line x1="0" y1="0" x2={w*0.09} y2={h*0.09} stroke="rgba(0,0,0,0.28)" strokeWidth="0.8" />
        <line x1={w} y1="0" x2={w*0.91} y2={h*0.09} stroke="rgba(0,0,0,0.28)" strokeWidth="0.8" />
        <line x1="0" y1={h} x2={w*0.09} y2={h*0.91} stroke="rgba(0,0,0,0.28)" strokeWidth="0.8" />
        <line x1={w} y1={h} x2={w*0.91} y2={h*0.91} stroke="rgba(0,0,0,0.28)" strokeWidth="0.8" />
        {/* Artist text — Georgia italic, bottom center */}
        <text
          x={cx} y={h * 0.91}
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontStyle="italic"
          fontSize={w * 0.082}
          fill="rgba(255,255,255,0.62)"
          style={{ letterSpacing: '0.02em' }}
        >
          DIEGO PÉREZ
        </text>
      </>
    )
  }

  const patterns = {
    about: (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <defs>
          {sharedDefs}
          <radialGradient id={`${id}-bg`} cx="45%" cy="40%" r="65%">
            <stop offset="0%" stopColor={album.accentColor} stopOpacity="0.85" />
            <stop offset="100%" stopColor={album.gradientA} />
          </radialGradient>
        </defs>
        <g filter={`url(#${noiseId})`}>
          <rect width={w} height={h} fill={`url(#${id}-bg)`} />
          {[0.82, 0.62, 0.42, 0.22].map((r, i) => (
            <circle key={i} cx={cx} cy={cy} r={r * cx} fill="none"
              stroke={album.accentColor} strokeWidth="0.8" strokeOpacity={0.18 + i * 0.07} />
          ))}
          <circle cx={cx} cy={cy} r={cx * 0.17} fill={album.accentColor} fillOpacity="0.55" />
          <circle cx={cx} cy={cy} r={cx * 0.07} fill={album.accentColor} />
        </g>
        <Overlay />
      </svg>
    ),

    education: (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <defs>
          {sharedDefs}
          <linearGradient id={`${id}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={album.gradientA} />
            <stop offset="100%" stopColor={album.gradientB} />
          </linearGradient>
        </defs>
        <g filter={`url(#${noiseId})`}>
          <rect width={w} height={h} fill={`url(#${id}-bg)`} />
          <polygon
            points={`${cx},${h*0.22} ${w*0.84},${h*0.39} ${cx},${h*0.56} ${w*0.16},${h*0.39}`}
            fill={album.accentColor} fillOpacity="0.5"
            stroke={album.accentColor} strokeWidth="0.7" strokeOpacity="0.5"
          />
          <rect x={w*0.72} y={h*0.39} width={w*0.035} height={h*0.2} fill={album.accentColor} fillOpacity="0.5" />
          <ellipse cx={w*0.738} cy={h*0.6} rx={w*0.055} ry={h*0.036} fill={album.accentColor} fillOpacity="0.5" />
          {[0.68, 0.74, 0.80].map((yf, i) => (
            <line key={i} x1={w*0.17} y1={h*yf} x2={w*0.6} y2={h*yf}
              stroke={album.accentColor} strokeWidth="1" strokeOpacity={0.22 + i * 0.07} />
          ))}
        </g>
        <Overlay />
      </svg>
    ),

    experience: (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <defs>
          {sharedDefs}
          <linearGradient id={`${id}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={album.gradientA} />
            <stop offset="100%" stopColor={album.gradientB} />
          </linearGradient>
        </defs>
        <g filter={`url(#${noiseId})`}>
          <rect width={w} height={h} fill={`url(#${id}-bg)`} />
          {[0,1,2,3,4].map(i => (
            <rect key={i}
              x={w * (0.12 + i * 0.17)} y={h * (0.85 - i * 0.12 - 0.17)}
              width={w * 0.12} height={h * (0.17 + i * 0.12)}
              fill={album.accentColor} fillOpacity={0.12 + i * 0.08} rx="2" />
          ))}
          <polyline
            points={`${w*0.12},${h*0.79} ${w*0.29},${h*0.65} ${w*0.46},${h*0.50} ${w*0.63},${h*0.40} ${w*0.80},${h*0.26} ${w*0.95},${h*0.16}`}
            fill="none" stroke={album.accentColor} strokeWidth="1.8" strokeOpacity="0.8" strokeLinecap="round" />
        </g>
        {/* Price sticker */}
        <circle cx={w*0.82} cy={h*0.18} r={w*0.11} fill="#f5e642" fillOpacity="0.92" />
        <text x={w*0.82} y={h*0.155} textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize={w*0.065} fill="#1a1200">$4.99</text>
        <text x={w*0.82} y={h*0.215} textAnchor="middle" fontFamily="Arial, sans-serif" fontSize={w*0.04} fill="#1a1200">USED</text>
        <Overlay />
      </svg>
    ),

    projects: (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <defs>
          {sharedDefs}
          <linearGradient id={`${id}-bg`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={album.gradientA} />
            <stop offset="100%" stopColor={album.gradientB} />
          </linearGradient>
        </defs>
        <g filter={`url(#${noiseId})`}>
          <rect width={w} height={h} fill={`url(#${id}-bg)`} />
          {[
            [w*0.1, h*0.1, w*0.35, h*0.35],
            [w*0.55, h*0.1, w*0.35, h*0.25],
            [w*0.1, h*0.55, w*0.25, h*0.35],
            [w*0.55, h*0.45, w*0.35, h*0.45],
          ].map(([x, y, bw, bh], i) => (
            <rect key={i} x={x} y={y} width={bw} height={bh}
              fill={album.accentColor} fillOpacity={0.07 + i * 0.04}
              stroke={album.accentColor} strokeWidth="0.9" strokeOpacity="0.3" rx="3" />
          ))}
          <line x1="0" y1="0" x2={w} y2={h} stroke={album.accentColor} strokeWidth="0.5" strokeOpacity="0.12" />
          <line x1={w} y1="0" x2="0" y2={h} stroke={album.accentColor} strokeWidth="0.5" strokeOpacity="0.12" />
        </g>
        {/* Parental Advisory sticker */}
        <rect x={w*0.06} y={h*0.06} width={w*0.38} height={h*0.18} fill="#f0f0f0" rx="2" />
        <text x={w*0.25} y={h*0.122} textAnchor="middle" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize={w*0.038} fill="#000">PARENTAL</text>
        <text x={w*0.25} y={h*0.187} textAnchor="middle" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize={w*0.038} fill="#000">ADVISORY</text>
        <Overlay />
      </svg>
    ),

    skills: (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <defs>
          {sharedDefs}
          <linearGradient id={`${id}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={album.gradientA} />
            <stop offset="100%" stopColor={album.gradientB} />
          </linearGradient>
        </defs>
        <g filter={`url(#${noiseId})`}>
          <rect width={w} height={h} fill={`url(#${id}-bg)`} />
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * Math.PI * 2 - Math.PI / 2
            const r = cx * 0.62
            const x = cx + Math.cos(a) * r
            const y = cy + Math.sin(a) * r
            return (
              <g key={i}>
                <line x1={cx} y1={cy} x2={x} y2={y} stroke={album.accentColor} strokeWidth="0.9" strokeOpacity="0.4" />
                <circle cx={x} cy={y} r={cx * 0.082} fill={album.accentColor} fillOpacity="0.6" />
              </g>
            )
          })}
          <polygon
            points={Array.from({ length: 6 }, (_, i) => {
              const a = (i / 6) * Math.PI * 2 - Math.PI / 2
              const r = cx * 0.62
              return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`
            }).join(' ')}
            fill={album.accentColor} fillOpacity="0.07"
            stroke={album.accentColor} strokeWidth="0.9" strokeOpacity="0.28"
          />
        </g>
        <Overlay />
      </svg>
    ),

    contact: (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <defs>
          {sharedDefs}
          <radialGradient id={`${id}-bg`} cx="32%" cy="32%" r="76%">
            <stop offset="0%" stopColor={album.gradientB} />
            <stop offset="100%" stopColor={album.gradientA} />
          </radialGradient>
        </defs>
        <g filter={`url(#${noiseId})`}>
          <rect width={w} height={h} fill={`url(#${id}-bg)`} />
          {[0.15, 0.27, 0.40].map((r, i) => (
            <circle key={i} cx={cx} cy={cy} r={r * w} fill="none"
              stroke={album.accentColor} strokeWidth="0.9" strokeOpacity={0.14 + i * 0.08}
              strokeDasharray="3 5" />
          ))}
          <path
            d={`M${cx},${h*0.17} L${w*0.82},${h*0.35} L${w*0.82},${h*0.68} L${cx},${h*0.83} L${w*0.18},${h*0.68} L${w*0.18},${h*0.35} Z`}
            fill="none" stroke={album.accentColor} strokeWidth="0.9" strokeOpacity="0.28" />
          <circle cx={cx} cy={cy} r={cx * 0.18} fill={album.accentColor} fillOpacity="0.65" />
        </g>
        <Overlay />
      </svg>
    ),
  }

  return patterns[album.id] || patterns.about
}

/* ── LP record item ── */
function LPRecord({ album, isSelected, isPlaying, onClick, onMouseEnter, elRef }) {
  return (
    <button
      ref={elRef}
      className={`shelf__record ${isSelected ? 'shelf__record--selected' : ''}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      aria-label={`Select ${album.title}`}
    >
      <div className="shelf__lp">
        <div
          className="shelf__disc"
          style={{ '--c': album.color, '--a': album.accentColor }}
        />
        <div className="shelf__sleeve">
          <AlbumArt album={album} size={110} />
          <div className="shelf__sleeve-gloss" />
          <div className="shelf__sleeve-edge" style={{ background: album.gradientA }} />
          {isSelected && isPlaying && (
            <div className="shelf__dot" style={{ background: album.accentColor }} />
          )}
        </div>
      </div>

      <div className="shelf__label">
        <span className="shelf__label-genre">{album.genre}</span>
        <span className="shelf__label-title">{album.title}</span>
      </div>
    </button>
  )
}

/* ── Shelf ── */
export function RecordShelf({ albums, selectedIndex, onSelect, isPlaying, onPlay, onEject }) {
  const refs = useRef([])

  /* Lift selected record */
  /* Lift selected record & manage disc/sleeve visibility */
  useEffect(() => {
    albums.forEach((_, i) => {
      const el = refs.current[i]
      if (!el) return
      
      const isSelected = i === selectedIndex
      const isPlayingSelected = isSelected && isPlaying

      // Main record wrapper flies away and collapses when playing
      if (isPlayingSelected) {
        gsap.to(el, {
          y: -120, // Fly up
          opacity: 0,
          scale: 0.8,
          width: 0,
          marginRight: -14, // Counteract the flex gap
          overflow: 'hidden',
          duration: 0.6,
          ease: 'power3.inOut',
          pointerEvents: 'none'
        })
      } else {
        gsap.to(el, {
          y: isSelected ? -18 : 0,
          opacity: 1,
          scale: isSelected ? 1.04 : 1,
          width: 136, 
          marginRight: 0,
          duration: 0.4,
          ease: 'power3.out',
          pointerEvents: 'auto',
          clearProps: isSelected ? 'overflow' : 'width,marginRight,overflow'
        })
      }

      // Disc slides out when selected (moves to turntable), standard stick-out when not
      const disc = el.querySelector('.shelf__disc')
      if (disc) {
        if (isSelected) {
          gsap.to(disc, {
            x: 60,
            opacity: 0,
            duration: 0.35,
            ease: 'power2.in',
            overwrite: 'auto'
          })
        } else {
          gsap.to(disc, {
            x: 0,
            opacity: 1,
            duration: 0.45,
            ease: 'power2.out',
            overwrite: 'auto',
            clearProps: 'x'
          })
        }
      }
    })
  }, [selectedIndex, albums, isPlaying])

  /* Crate digging: push apart on hover */
  const handleEnter = useCallback((hoveredIndex) => {
    albums.forEach((_, i) => {
      const el = refs.current[i]
      if (!el) return
      const dist = i - hoveredIndex
      const isSelected = i === selectedIndex
      const isPlayingSelected = isSelected && isPlaying

      if (isPlayingSelected) return // Ignore hovered updates for playing record

      if (dist === 0) {
        gsap.to(el, {
          y: isSelected ? -22 : -12,
          scale: isSelected ? 1.07 : 1.03,
          rotationZ: 0,
          duration: 0.35,
          ease: 'power2.out',
        })
      } else {
        const pushX = Math.sign(dist) * Math.min(Math.abs(dist) * 5, 20)
        const tiltZ = Math.sign(dist) * Math.min(Math.abs(dist) * 1.8, 6)
        gsap.to(el, {
          x: pushX,
          rotationZ: tiltZ,
          y: isSelected ? -18 : 0,
          scale: isSelected ? 1.04 : 1,
          duration: 0.35,
          ease: 'power2.out',
        })
      }
    })
  }, [albums, selectedIndex, isPlaying])

  const handleLeave = useCallback(() => {
    albums.forEach((_, i) => {
      const el = refs.current[i]
      if (!el) return
      if (i === selectedIndex && isPlaying) return // don't restore it

      gsap.to(el, {
        x: 0,
        rotationZ: 0,
        y: i === selectedIndex ? -18 : 0,
        scale: i === selectedIndex ? 1.04 : 1,
        duration: 0.55,
        ease: 'elastic.out(1, 0.6)',
      })
    })
  }, [albums, selectedIndex, isPlaying])

  const selected = selectedIndex !== null ? albums[selectedIndex] : null

  return (
    <div className="shelf">
      <div className="shelf__rail">
        <div className="shelf__wood" />
        <div className="shelf__records" onMouseLeave={handleLeave}>
          {albums.map((album, i) => (
            <LPRecord
              key={album.id}
              album={album}
              isSelected={i === selectedIndex}
              isPlaying={isPlaying}
              onClick={() => onSelect(i)}
              onMouseEnter={() => handleEnter(i)}
              elRef={el => { refs.current[i] = el }}
            />
          ))}
        </div>
      </div>

      <div className="shelf__controls">
        {selected ? (
          <>
            <div className="shelf__now">
              <span className="shelf__now-genre">{selected.genre}</span>
              <span className="shelf__now-name">{selected.title}</span>
              <span className="shelf__now-rpm">{selected.rpm} RPM · {selected.year}</span>
            </div>
            <button
              className={`shelf__btn ${isPlaying ? 'shelf__btn--ejecting' : ''}`}
              style={{ '--c': selected.color, '--a': selected.accentColor }}
              onClick={isPlaying ? onEject : onPlay}
            >
              {isPlaying ? <><EjectSVG /> Eject</> : <><PlaySVG /> Play</>}
            </button>
          </>
        ) : (
          <span className="shelf__hint">Pull a record from the shelf</span>
        )}
      </div>
    </div>
  )
}

function PlaySVG() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

function EjectSVG() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <polygon points="5 4 15 12 5 20 5 4" />
      <line x1="19" y1="5" x2="19" y2="19" />
    </svg>
  )
}
