import { useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { portfolioContent } from '../data/portfolio'
import './ContentPanel.css'

export function ContentPanel({ album, isOpen, onClose }) {
  const backdropRef = useRef()
  const cardRef = useRef()
  const [openTrack, setOpenTrack] = useState(null)

  // Reset expanded tracks when album changes
  useEffect(() => { setOpenTrack(null) }, [album?.id])

  useEffect(() => {
    if (backdropRef.current) gsap.set(backdropRef.current, { opacity: 0, pointerEvents: 'none' })
    if (cardRef.current)     gsap.set(cardRef.current,     { y: 40, opacity: 0, scale: 0.95 })
  }, [])

  useEffect(() => {
    if (!backdropRef.current || !cardRef.current) return
    if (isOpen) {
      gsap.to(backdropRef.current, { opacity: 1, pointerEvents: 'auto', duration: 0.35, ease: 'power2.out' })
      gsap.to(cardRef.current,     { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.4)', delay: 0.05 })
    } else {
      gsap.to(backdropRef.current, { opacity: 0, pointerEvents: 'none', duration: 0.3, ease: 'power2.in' })
      gsap.to(cardRef.current,     { y: 20, opacity: 0, scale: 0.96, duration: 0.28, ease: 'power2.in' })
    }
  }, [isOpen])

  const content = album ? portfolioContent[album.id] : null

  function toggleTrack(i) {
    setOpenTrack(prev => prev === i ? null : i)
  }

  return (
    <div ref={backdropRef} className="cp-backdrop" onClick={onClose}>
      <div
        ref={cardRef}
        className="cp-card"
        style={album ? { 
          '--accent': album.accentColor, 
          '--album-color': album.color,
          '--gradientA': album.gradientA,
          '--gradientB': album.gradientB
        } : {}}
        onClick={e => e.stopPropagation()}
      >
        <div className="cp-ring-texture" />
        {album && content && (
          <>

            <div className="cp-header">
              <div>
                <span className="cp-genre">{album.genre}</span>
                <h2 className="cp-title">{content.heading}</h2>
                <p className="cp-meta">{album.title} · {album.rpm} RPM · {album.year}</p>
              </div>
              <button className="cp-close" onClick={onClose} aria-label="Eject">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {content.body && <p className="cp-body">{content.body}</p>}

            <div className="cp-tracks">
              {content.tracks.map((track, i) => {
                const isExpandable = Boolean(track.detail)
                const isOpen = openTrack === i

                return (
                  <div key={i}>
                    {/* Track row */}
                    <div
                      className={`cp-track ${isExpandable ? 'cp-track--expandable' : ''} ${isOpen ? 'cp-track--open' : ''}`}
                      style={{ animationDelay: `${i * 0.055 + 0.1}s` }}
                      onClick={() => isExpandable && toggleTrack(i)}
                    >
                      <span className="cp-track-n">{track.number}</span>
                      <div className="cp-track-info">
                        <span className="cp-track-title">{track.title}</span>
                      </div>
                      <span className="cp-track-dur">{track.duration}</span>
                      {isExpandable && (
                        <span className="cp-track-chevron" aria-hidden="true">
                          {isOpen ? '∧' : '∨'}
                        </span>
                      )}
                      {track.link && track.link !== '#' && (
                        <a
                          href={track.link}
                          className="cp-track-link"
                          target="_blank"
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                        >↗</a>
                      )}
                    </div>

                    {/* Expanded detail */}
                    {isExpandable && (
                      <div className={`cp-track-expand ${isOpen ? 'cp-track-expand--open' : ''}`}>
                        <p className="cp-track-expand-text">{track.detail}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {/* SoundCloud player moved out */}

            <div className="cp-footer">
              <div className="cp-footer-left">
                <span className="cp-dot" style={{ background: album.accentColor }} />
                <span>Stereo · 33⅓ RPM · LP</span>
              </div>
              <div className="cp-barcode">
                <span>|| ||||| || ||| || |||</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
