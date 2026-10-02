import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import photoSets from '../data/photos.json'
import Icon from './Icon'

/* A filmstrip of photos at their own proportions. It scrolls sideways with the browser's native scrolling, so a
   vertical swipe that starts on it still scrolls the page; a tap opens the set full-screen. */
export function PhotoStrip({ set, label }) {
  const photos = photoSets[set]
  const track = useRef(null)
  const opener = useRef(null)
  const [open, setOpen] = useState(null)          // index of the photo shown full-screen
  const [edges, setEdges] = useState('')          // which sides have more to scroll to: '', 'start', 'end', 'start end'
  useEffect(() => {
    const node = track.current
    if (!node) return undefined
    const update = () => {
      const start = node.scrollLeft > 4, end = node.scrollLeft + node.clientWidth < node.scrollWidth - 4
      setEdges([start && 'start', end && 'end'].filter(Boolean).join(' '))
    }
    update()
    node.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => { node.removeEventListener('scroll', update); observer.disconnect() }
  }, [])
  useEffect(() => { if (open === null) opener.current?.focus({ preventScroll: true }) }, [open])
  if (!photos?.length) return null
  const page = direction => track.current?.scrollBy({ left: direction * track.current.clientWidth * 0.8, behavior: 'smooth' })
  return <div className="strip" data-more={edges}>
    <ul className="strip-track" ref={track} aria-label={`${label}, ${photos.length} photos`}>
      {photos.map((photo, index) => <li key={photo.src}>
        <button type="button" className={`strip-photo${photo.cutout ? ' strip-photo--cutout' : ''}`} style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
          onClick={event => { opener.current = event.currentTarget; setOpen(index) }} aria-label={`${photo.alt}. Open photo ${index + 1} of ${photos.length}`}>
          <img src={photo.thumb} alt="" width={photo.width} height={photo.height} loading="lazy" decoding="async" draggable="false" />
        </button>
      </li>)}
    </ul>
    <button type="button" className="strip-arrow strip-arrow--prev" onClick={() => page(-1)} hidden={!edges.includes('start')} aria-label="Earlier photos" tabIndex={-1}><Icon name="arrow-left" size={18} /></button>
    <button type="button" className="strip-arrow strip-arrow--next" onClick={() => page(1)} hidden={!edges.includes('end')} aria-label="More photos" tabIndex={-1}><Icon name="arrow-right" size={18} /></button>
    {open !== null && <Lightbox photos={photos} start={open} label={label} onClose={() => setOpen(null)} />}
  </div>
}

/* The set, full-screen: one photo per page of a sideways scroller that snaps, so swiping works the way it does in
   Photos without any gesture code. Arrow keys and the side buttons page it; Escape, the close button, or a tap
   outside the picture closes it. */
function Lightbox({ photos, start, label, onClose }) {
  const dialog = useRef(null)
  const track = useRef(null)
  const [index, setIndex] = useState(start)
  useLayoutEffect(() => {
    dialog.current.showModal()
    track.current.scrollTo({ left: start * track.current.clientWidth, behavior: 'instant' })
  }, [start])
  const follow = () => { const node = track.current; if (node?.clientWidth) setIndex(Math.min(photos.length - 1, Math.max(0, Math.round(node.scrollLeft / node.clientWidth)))) }
  const go = delta => track.current.scrollTo({ left: (index + delta) * track.current.clientWidth, behavior: 'smooth' })
  function keys(event) {
    if (event.key === 'ArrowRight') { event.preventDefault(); go(1) }
    if (event.key === 'ArrowLeft') { event.preventDefault(); go(-1) }
  }
  return <dialog ref={dialog} className="lightbox" aria-label={`${label} photos`} onCancel={event => { event.preventDefault(); onClose() }} onKeyDown={keys}>
    <div className="lightbox-track" ref={track} onScroll={follow}>
      {photos.map((photo, i) => <figure key={photo.src} className="lightbox-slide" onClick={event => { if (event.target === event.currentTarget) onClose() }}>
        <img className={photo.cutout ? 'lightbox-cutout' : undefined} src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading={Math.abs(i - start) <= 1 ? 'eager' : 'lazy'} decoding="async" draggable="false" />
      </figure>)}
    </div>
    <p className="lightbox-count" aria-live="polite" aria-label={`Photo ${index + 1} of ${photos.length}`}>{index + 1} / {photos.length}</p>
    <button type="button" className="lightbox-button lightbox-close" onClick={onClose} aria-label="Close photos"><Icon name="close" size={20} /></button>
    {index > 0 && <button type="button" className="lightbox-button lightbox-prev" onClick={() => go(-1)} aria-label="Previous photo"><Icon name="arrow-left" size={20} /></button>}
    {index < photos.length - 1 && <button type="button" className="lightbox-button lightbox-next" onClick={() => go(1)} aria-label="Next photo"><Icon name="arrow-right" size={20} /></button>}
  </dialog>
}
