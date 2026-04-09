import { useRef, useState, useEffect } from 'react'
import CardSwap, { Card } from './CardSwap'
import { portfolioContent } from '../data/portfolio'
import './RecordShelf.css'

const TABLE_LAYOUT = {
  desktop: {
    about: { x: '18%', y: '24%', rotate: -16 },
    education: { x: '80%', y: '25%', rotate: 12 },
    experience: { x: '12%', y: '52%', rotate: -9 },
    projects: { x: '82%', y: '54%', rotate: 11 },
    skills: { x: '28%', y: '74%', rotate: -12 },
    contact: { x: '68%', y: '76%', rotate: 10 },
  },
  compact: {
    about: { x: '24%', y: '24%', rotate: -10 },
    education: { x: '76%', y: '25%', rotate: 8 },
    experience: { x: '18%', y: '46%', rotate: -6 },
    projects: { x: '80%', y: '48%', rotate: 7 },
    skills: { x: '28%', y: '70%', rotate: -8 },
    contact: { x: '72%', y: '72%', rotate: 7 },
  },
}

const DEFAULT_DRAG_STATE = { x: 0, y: 0, active: false, overDropZone: false }

function getDropZoneMetrics(rect) {
  const compact = rect.width < 900

  return {
    x: rect.width * 0.5,
    y: rect.height * (compact ? 0.46 : 0.54),
    radius: Math.min(rect.width, rect.height) * (compact ? 0.17 : 0.13),
  }
}

function isPointerOverDropZone(point, rect) {
  const zone = getDropZoneMetrics(rect)
  return Math.hypot(point.x - zone.x, point.y - zone.y) <= zone.radius
}

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

function AlbumBackface({ album }) {
  const content = portfolioContent[album.id]

  if (!content) return null

  return (
    <div
      className="shelf__table-back"
      style={{
        '--c': album.color,
        '--a': album.accentColor,
        '--ga': album.gradientA,
        '--gb': album.gradientB,
      }}
    >
      <div className="shelf__table-back-header">
        <div>
          <span className="shelf__table-back-genre">{album.genre}</span>
          <h3 className="shelf__table-back-title">{content.heading}</h3>
          <p className="shelf__table-back-meta">{album.title} · {album.rpm} RPM · {album.year}</p>
        </div>
      </div>

      {content.body && <p className="shelf__table-back-body">{content.body}</p>}

      <div className="shelf__table-back-tracks">
        {content.tracks.map((track, i) => {
          const hasLink = Boolean(track.link && track.link !== '#')
          const isExternal = hasLink && /^https?:\/\//.test(track.link)

          return (
            <div key={`${album.id}-${i}`} className="shelf__table-back-track">
              <span className="shelf__table-back-track-n">{track.number}</span>
              <div className="shelf__table-back-track-main">
                {hasLink ? (
                  <a
                    href={track.link}
                    className="shelf__table-back-track-title shelf__table-back-track-title--link"
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noreferrer' : undefined}
                    onClick={e => e.stopPropagation()}
                  >
                    {track.title}
                  </a>
                ) : (
                  <span className="shelf__table-back-track-title">{track.title}</span>
                )}
                {track.detail && (
                  <p className="shelf__table-back-track-detail">{track.detail}</p>
                )}
              </div>
              <span className="shelf__table-back-track-dur">{track.duration}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SimulatorAlbum({
  album,
  albumSize,
  isSelected,
  isPlaying,
  discOnPlatter,
  isEjecting,
  isFlipped,
  layout,
  surfaceRef,
  onSelect,
  onFlipToggle,
  onPutAway,
  onPlace,
  onDropHoverChange,
}) {
  const [dragState, setDragState] = useState(DEFAULT_DRAG_STATE)

  const canGrabDisc = isSelected && !discOnPlatter && !isEjecting && !isFlipped
  const showReadyBadge = canGrabDisc && !dragState.active

  useEffect(() => {
    if (!canGrabDisc) {
      setDragState(DEFAULT_DRAG_STATE)
      onDropHoverChange?.(false)
    }
  }, [canGrabDisc, onDropHoverChange])

  useEffect(() => {
    return () => { document.body.style.cursor = '' }
  }, [])

  function updateDropState(clientX, clientY, nextOffset) {
    const rect = surfaceRef.current?.getBoundingClientRect()
    const offset = nextOffset || { x: 0, y: 0 }

    if (!rect) {
      const fallbackState = { ...offset, active: true, overDropZone: false }
      setDragState(fallbackState)
      onDropHoverChange?.(false)
      return false
    }

    const point = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
    const overDropZone = isPointerOverDropZone(point, rect)
    const nextState = { ...offset, active: true, overDropZone }

    setDragState(nextState)
    onDropHoverChange?.(overDropZone)

    return overDropZone
  }

  function handleDiscPointerDown(event) {
    if (!canGrabDisc) return

    event.stopPropagation()
    event.preventDefault()
    document.body.style.cursor = 'grabbing'

    const startX = event.clientX ?? 0
    const startY = event.clientY ?? 0

    updateDropState(startX, startY, { x: 0, y: 0 })

    function onPointerMove(moveEvent) {
      if (moveEvent.cancelable) moveEvent.preventDefault()

      const clientX = moveEvent.clientX ?? 0
      const clientY = moveEvent.clientY ?? 0

      updateDropState(clientX, clientY, {
        x: clientX - startX,
        y: clientY - startY,
      })
    }

    function finishDrag(endEvent) {
      const clientX = endEvent.clientX ?? startX
      const clientY = endEvent.clientY ?? startY
      const rect = surfaceRef.current?.getBoundingClientRect()
      const shouldPlace = rect
        ? isPointerOverDropZone({ x: clientX - rect.left, y: clientY - rect.top }, rect)
        : false

      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      document.body.style.cursor = ''
      onDropHoverChange?.(false)
      setDragState(DEFAULT_DRAG_STATE)

      if (shouldPlace) onPlace?.()
    }

    function onPointerUp(endEvent) {
      finishDrag(endEvent)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: false })
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
  }

  const discStyle = {
    '--c': album.color,
    '--a': album.accentColor,
    width: albumSize * 0.84,
    height: albumSize * 0.84,
    transform: dragState.active
      ? `translate(calc(34% + ${dragState.x}px), calc(-50% + ${dragState.y}px)) rotate(${dragState.x * 0.08 + dragState.y * 0.03}deg) scale(1.02)`
      : 'translate(34%, -50%) rotate(-8deg)',
  }

  return (
    <div
      className={`shelf__table-album ${isSelected ? 'shelf__table-album--selected' : ''}`}
      style={{
        left: layout.x,
        top: layout.y,
        '--album-rotate': `${isSelected ? 0 : layout.rotate}deg`,
        '--album-size': `${albumSize}px`,
      }}
    >
      {isSelected && (
        <div className="shelf__table-album-actions" onClick={e => e.stopPropagation()}>
          <button className="shelf__table-action" onClick={onFlipToggle}>
            <FlipSVG /> {isFlipped ? 'Front' : 'Back'}
          </button>
          {!discOnPlatter && !isEjecting && (
            <button className="shelf__table-action shelf__table-action--muted" onClick={onPutAway}>
              <PutAwaySVG /> Put Away
            </button>
          )}
        </div>
      )}

      <div
        className={`shelf__table-card-shell ${isSelected ? 'shelf__table-card-shell--selected' : ''} ${isFlipped ? 'shelf__table-card-shell--flipped' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => { if (!isSelected) onSelect?.() }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return
          event.preventDefault()
          if (!isSelected) onSelect?.()
        }}
      >
        {canGrabDisc && (
          <div
            className={`shelf__table-disc ${dragState.active ? 'shelf__table-disc--dragging' : ''} ${dragState.overDropZone ? 'shelf__table-disc--armed' : ''}`}
            style={discStyle}
            onPointerDown={handleDiscPointerDown}
          />
        )}

        <div className="shelf__table-face shelf__table-face--front">
          <div className="shelf__table-sleeve">
            <AlbumArt album={album} size={albumSize} />
            <div className="shelf__sleeve-gloss" />
            <div className="shelf__sleeve-edge" style={{ background: album.gradientA }} />

            {isSelected && discOnPlatter && (
              <div className="shelf__table-empty-ring" />
            )}

            <div className="shelf__table-front-copy">
              <span className="shelf__table-front-genre">{album.genre}</span>
              <span className="shelf__table-front-title">{album.title}</span>
            </div>

            {showReadyBadge && (
              <div className="shelf__table-ready-badge">
                Pull record
              </div>
            )}

            {isSelected && discOnPlatter && isPlaying && (
              <div className="shelf__table-status-pill">
                <span className="shelf__table-status-dot shelf__table-status-dot--live" />
                Playing
              </div>
            )}

            {isSelected && discOnPlatter && !isPlaying && (
              <div className="shelf__table-status-pill shelf__table-status-pill--idle">
                Cued
              </div>
            )}
          </div>
        </div>

        <div className="shelf__table-face shelf__table-face--back">
          <AlbumBackface album={album} />
        </div>
      </div>
    </div>
  )
}

/* ── LP record item ── */
function LPRecord({ album, isSelected, isPlaying, discOnPlatter, isEjecting, onPlace }) {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const isReadyToGrab = isSelected && !discOnPlatter && !isEjecting

  useEffect(() => {
    if (!isReadyToGrab) {
      setDragOffset({ x: 0, y: 0 })
      setIsDragging(false)
    }
  }, [isReadyToGrab])

  function handlePointerDown(e) {
    if (!isReadyToGrab) return
    e.stopPropagation()
    if (e.target.setPointerCapture) e.target.setPointerCapture(e.pointerId)
    setIsDragging(true)

    const startX = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    const startY = e.clientY ?? e.touches?.[0]?.clientY ?? 0

    function onPointerMove(ev) {
      const x = ev.clientX ?? ev.touches?.[0]?.clientX ?? 0
      const y = ev.clientY ?? ev.touches?.[0]?.clientY ?? 0
      setDragOffset({ x: x - startX, y: y - startY })
    }

    function onPointerUp(ev) {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('touchmove', onPointerMove)
      window.removeEventListener('touchend', onPointerUp)
      setIsDragging(false)

      const y = ev.clientY ?? ev.changedTouches?.[0]?.clientY ?? startY
      // If dragged upwards by at least 70px towards the turntable, place it
      if (y - startY < -70) {
        onPlace?.()
      }
      setDragOffset({ x: 0, y: 0 })
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('touchmove', onPointerMove, { passive: false })
    window.addEventListener('touchend', onPointerUp)
  }

  return (
    <div className="shelf__lp" style={{ width: 150, height: 150 }}>
      {/* Draggable Disc */}
      <div
        className="shelf__disc"
        onPointerDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        style={{
          width: 150, height: 150,
          left: 0, top: 0, transformOrigin: 'center center',
          '--c': album.color,
          '--a': album.accentColor,
          transform: isReadyToGrab
            ? `translate(${75 + dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.y * 0.15}deg) scale(0.95)`
            : (isSelected ? 'scale(0)' : 'scale(0.95)'),
          opacity: (isSelected && discOnPlatter) ? 0 : 1,
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s',
          cursor: isReadyToGrab ? (isDragging ? 'grabbing' : 'grab') : 'default',
          zIndex: 0,
          touchAction: 'none'
        }}
      />
      <div className="shelf__sleeve" style={{ width: 150, height: 150, borderRadius: 5, position: 'relative', zIndex: 1 }}>
        <AlbumArt album={album} size={150} />
        <div className="shelf__sleeve-gloss" />
        <div className="shelf__sleeve-edge" style={{ background: album.gradientA }} />
        {/* Dot: pulsing when playing, static when disc is on platter but paused */}
        {isSelected && discOnPlatter && isPlaying && (
          <div className="shelf__dot" style={{ background: album.accentColor }} />
        )}
        {isSelected && discOnPlatter && !isPlaying && (
          <div className="shelf__dot" style={{ background: album.accentColor, animation: 'none', opacity: 0.4 }} />
        )}
      </div>
      <div className="shelf__lp-name">{album.title}</div>
    </div>
  )
}

function SimulatorRecordShelf({
  albums,
  selectedIndex,
  discOnPlatter,
  isEjecting,
  isPlaying,
  simulatorAlbumFlipped = false,
  simulatorInspectMode = false,
  onSelect,
  onEject,
  onFlipToggle,
  onInspect,
  onInspectClose,
}) {
  const selected = selectedIndex !== null ? albums[selectedIndex] : null
  const selectedContent = selected ? portfolioContent[selected.id] : null
  const isShowingBack = selectedIndex !== null && simulatorAlbumFlipped

  let helperText = 'Pick a sleeve from the table — drag the record onto the platter or hit Inspect.'
  if (selected && simulatorInspectMode && !isShowingBack) {
    helperText = 'Drag the sleeve to rotate it. Hit Back when done.'
  } else if (selected && simulatorInspectMode && isShowingBack) {
    helperText = 'Drag to rotate. Turn Around to flip back.'
  } else if (selected && !discOnPlatter && !isShowingBack) {
    helperText = 'Drag the record out of the sleeve and drop it onto the platter.'
  } else if (selected && !discOnPlatter && isShowingBack) {
    helperText = 'Flip it back to the cover side when you are ready to grab the record.'
  } else if (discOnPlatter && !isPlaying) {
    helperText = 'The record is cued. Click the tonearm to start it.'
  } else if (discOnPlatter && isPlaying) {
    helperText = 'Now spinning. Eject when you want to swap albums.'
  }

  return (
    <div className="shelf shelf--simulator">
      <div className="shelf__tabletop">
        <div className="shelf__table-hud">
          {selected ? (
            <>
              <div className="shelf__table-hud-copy">
                <span className="shelf__table-hud-genre">{selected.genre}</span>
                <span className="shelf__table-hud-title">
                  {isShowingBack && selectedContent ? selectedContent.heading : selected.title}
                </span>
                <span className="shelf__table-hud-note">{helperText}</span>
              </div>

              <div className="shelf__table-hud-actions">
                {simulatorInspectMode ? (
                  <button
                    className="shelf__btn shelf__btn--table-muted"
                    style={{ '--c': selected.color, '--a': selected.accentColor }}
                    onClick={onInspectClose}
                  >
                    <PutAwaySVG /> Back
                  </button>
                ) : (
                  <button
                    className="shelf__btn shelf__btn--table"
                    style={{ '--c': selected.color, '--a': selected.accentColor }}
                    onClick={onInspect}
                  >
                    <InspectSVG /> Inspect
                  </button>
                )}

                <button
                  className="shelf__btn shelf__btn--table"
                  style={{ '--c': selected.color, '--a': selected.accentColor }}
                  onClick={onFlipToggle}
                >
                  <FlipSVG /> {isShowingBack ? 'Show Cover' : 'Turn Around'}
                </button>

                {discOnPlatter ? (
                  <button
                    className="shelf__btn shelf__btn--ejecting"
                    style={{ '--c': selected.color, '--a': selected.accentColor }}
                    onClick={onEject}
                    disabled={isEjecting}
                  >
                    <EjectSVG /> Eject
                  </button>
                ) : (
                  <button
                    className="shelf__btn shelf__btn--table-muted"
                    style={{ '--c': selected.color, '--a': selected.accentColor }}
                    onClick={() => onSelect(selectedIndex)}
                  >
                    <PutAwaySVG /> Put Away
                  </button>
                )}
              </div>
            </>
          ) : (
            <span className="shelf__table-hud-note shelf__table-hud-note--idle">
              The albums live on the desk as 3D sleeves. Click one — you can inspect it up close or slide the record straight onto the platter.
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Shelf using CardSwap ── */
function ClassicRecordShelf({ albums, selectedIndex, discOnPlatter, isEjecting, isPlaying, onSelect, onPlace, onEject, onPlay }) {
  const selected = selectedIndex !== null ? albums[selectedIndex] : null
  const swapRef  = useRef(null)

  return (
    <div className="shelf">
      <div className="shelf__rail">
        <CardSwap
          ref={swapRef}
          width={150}
          height={150}
          cardDistance={40}
          verticalDistance={30}
          delay={4000}
          pauseOnHover={false}
          isPaused={true}
          onCardClick={(i) => onSelect(i)}
          skewAmount={6}
        >
          {albums.map((album, i) => (
            <Card key={album.id}>
              <LPRecord
                album={album}
                isSelected={i === selectedIndex}
                isPlaying={isPlaying}
                discOnPlatter={discOnPlatter}
                isEjecting={isEjecting}
                onPlace={onPlace}
              />
            </Card>
          ))}
        </CardSwap>
      </div>

      <div className="shelf__controls">
        <div className="shelf__nav">
          <button className="shelf__nav-btn" onClick={() => swapRef.current?.prev()} aria-label="Previous">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button className="shelf__nav-btn" onClick={() => swapRef.current?.next()} aria-label="Next">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {selected ? (
          <>
            <div className="shelf__now">
              <span className="shelf__now-genre">{selected.genre}</span>
              <span className="shelf__now-name">{selected.title}</span>
              <span className="shelf__now-rpm">{selected.rpm} RPM · {selected.year}</span>
            </div>

            <div className="shelf__btn-group">
              {!isPlaying && (
                <button
                  className="shelf__btn shelf__btn--play"
                  style={{ '--c': selected.color, '--a': selected.accentColor }}
                  onClick={onPlay}
                  disabled={isEjecting}
                >
                  <PlaySVG /> Play
                </button>
              )}
              <button
                className="shelf__btn shelf__btn--ejecting"
                style={{ '--c': selected.color, '--a': selected.accentColor }}
                onClick={onEject}
                disabled={isEjecting}
              >
                <EjectSVG /> Eject
              </button>
            </div>
          </>
        ) : (
          <span className="shelf__hint">← Browse · click to select</span>
        )}
      </div>
    </div>
  )
}

export function RecordShelf(props) {
  if (props.simulatorMode) {
    return <SimulatorRecordShelf {...props} />
  }

  return <ClassicRecordShelf {...props} />
}

function PlaySVG() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

function FlipSVG() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a7 7 0 0 1 12-4" />
      <path d="M21 12a7 7 0 0 1-12 4" />
      <polyline points="15 3 15 8 20 8" />
      <polyline points="9 21 9 16 4 16" />
    </svg>
  )
}

function PutAwaySVG() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
      <path d="M9 12h6" />
      <path d="M7 4h10l2 4H5l2-4Z" />
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

function InspectSVG() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
