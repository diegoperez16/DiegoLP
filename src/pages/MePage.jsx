import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import lines from '../data/backgroundLines.json'
import Icon from '../components/Icon'
import './MePage.css'


/* /me.html — a page apart from the portfolio for the parts of Diego that are not necessarily professional.
   Opened from the photo bubble on the globe. Effects are plain-CSS/canvas ports of the components Diego
   picked: Aceternity's Background Lines and Cover (hyperspace on hover), Magic UI's Comic Text, and a
   static-image take on Aceternity's Link Preview. The aquarium is our own. Content is Diego's, trimmed. */

const POPCORNPAL_URL = 'https://popcornpal.net/profile/hopeismymight'   // Diego's PopcornPal profile

/* Aceternity Background Lines: 21 paths drawn as travelling dashes, staggered per path. */
function BackgroundLines() {
  return (
    <svg className="me-lines" viewBox={lines.viewBox} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {lines.paths.map((d, index) => (
        <path key={index} d={d} stroke={lines.colors[index % lines.colors.length]} strokeWidth="2.3" strokeLinecap="round" fill="none"
          style={{ animationDuration: `${9 + (index % 5) * 1.7}s`, animationDelay: `${(index * 0.9) % 7}s` }} />
      ))}
    </svg>
  )
}

/* Aceternity Cover, as hyperspace: at rest, faint beams drift across the word; on hover the stars streak
   past (a canvas of radial streaks), the beams race, and the word jitters as if the jump just hit. */
function Cover({ children }) {
  const [hovered, setHovered] = useState(false)
  const canvas = useRef(null)
  useEffect(() => {
    if (!hovered || !canvas.current) return undefined
    const element = canvas.current
    const ctx = element.getContext('2d')
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const box = element.getBoundingClientRect()
    element.width = box.width * dpr
    element.height = box.height * dpr
    const stars = Array.from({ length: 140 }, () => ({ angle: Math.random() * Math.PI * 2, radius: Math.random() * 0.5 + 0.02, speed: 0.6 + Math.random() * 1.6 }))
    let frame
    const draw = () => {
      const w = element.width, h = element.height, cx = w / 2, cy = h / 2
      ctx.clearRect(0, 0, w, h)
      ctx.lineCap = 'round'
      for (const star of stars) {
        const r0 = star.radius * w, r1 = r0 + (0.04 + star.radius * 0.35) * w
        ctx.strokeStyle = `rgba(255,255,255,${Math.min(1, 0.25 + star.radius * 1.4)})`
        ctx.lineWidth = dpr * (0.6 + star.radius * 1.6)
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(star.angle) * r0, cy + Math.sin(star.angle) * r0 * 0.45); ctx.lineTo(cx + Math.cos(star.angle) * r1, cy + Math.sin(star.angle) * r1 * 0.45); ctx.stroke()
        star.radius += star.speed * 0.012
        if (star.radius > 1.1) { star.radius = Math.random() * 0.05; star.angle = Math.random() * Math.PI * 2 }
      }
      frame = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(frame)
  }, [hovered])
  return (
    <span className={`me-cover${hovered ? ' me-cover--jump' : ''}`} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onTouchStart={() => setHovered(true)} onTouchEnd={() => setHovered(false)}>
      <canvas ref={canvas} className="me-cover__stars" aria-hidden="true" />
      {[0, 1, 2, 3, 4].map(index => <i key={index} className="me-cover__beam" style={{ top: `${18 + index * 16}%`, animationDelay: `${index * 0.35}s` }} aria-hidden="true" />)}
      <span className="me-cover__text">{children}</span>
      <i className="me-cover__dot me-cover__dot--tl" /><i className="me-cover__dot me-cover__dot--tr" /><i className="me-cover__dot me-cover__dot--bl" /><i className="me-cover__dot me-cover__dot--br" />
    </span>
  )
}

/* Magic UI Comic Text: Bangers, thick stroke, halftone fill, stacked hard shadows, a little skew. */
function ComicText({ children, size = 4.6 }) {
  return <div className="me-comic" style={{ fontSize: `${size}rem`, WebkitTextStroke: `${size * 0.35}px #000` }}>{children}</div>
}

/* Comic bursts. Tap anywhere in the heroes section and a word pops where you tapped, comic-lettered, then
   fades. The Spider-Man sticker always answers with THWIP. */
const BURST_WORDS = ['BAM!', 'POW!', 'WHAM!', 'ZAP!', 'KRAK!', 'BOOM!']
function useBursts() {
  const [bursts, setBursts] = useState([])
  const counter = useRef(0)
  const burst = (event, word) => {
    const box = event.currentTarget.getBoundingClientRect()
    const id = ++counter.current
    const text = word || BURST_WORDS[id % BURST_WORDS.length]
    const rotate = Math.round((Math.random() - 0.5) * 28)
    setBursts(list => [...list, { id, x: event.clientX - box.left, y: event.clientY - box.top, text, rotate }])
    setTimeout(() => setBursts(list => list.filter(item => item.id !== id)), 1100)
  }
  const layer = <div className="me-bursts" aria-hidden="true">{bursts.map(item => (
    <span key={item.id} className="me-burst" style={{ left: item.x, top: item.y, '--rotate': `${item.rotate}deg` }}>
      <svg className="me-burst__star" viewBox="0 0 100 100"><polygon points="50,2 61,32 94,26 72,50 94,74 61,68 50,98 39,68 6,74 28,50 6,26 39,32" /></svg>
      <ComicText size={2.4}>{item.text}</ComicText>
    </span>
  ))}</div>
  return { burst, layer }
}

/* Aceternity's Draggable Card, ported: prints scattered over a board, each draggable with a little 3D tilt
   toward the pointer while held, a nudge of inertia on release, and the last one touched on top. */
function DraggablePile({ items, note }) {
  const board = useRef(null)
  const zRef = useRef(10)
  const [cards, setCards] = useState(() => items.map(item => ({ ...item, dx: 0, dy: 0, z: 1, tiltX: 0, tiltY: 0, held: false })))
  const drag = useRef(null)
  const update = (id, patch) => setCards(list => list.map(card => (card.id === id ? { ...card, ...patch } : card)))

  const onDown = (event, card) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { id: card.id, startX: event.clientX, startY: event.clientY, fromX: card.dx, fromY: card.dy, lastX: event.clientX, lastY: event.clientY, lastT: performance.now(), vx: 0, vy: 0 }
    update(card.id, { z: ++zRef.current, held: true })
  }
  const onMove = event => {
    const d = drag.current
    if (!d) return
    const now = performance.now(), dt = Math.max(1, now - d.lastT)
    d.vx = (event.clientX - d.lastX) / dt; d.vy = (event.clientY - d.lastY) / dt
    d.lastX = event.clientX; d.lastY = event.clientY; d.lastT = now
    const box = event.currentTarget.getBoundingClientRect()
    const tiltY = ((event.clientX - (box.left + box.width / 2)) / box.width) * 18
    const tiltX = -((event.clientY - (box.top + box.height / 2)) / box.height) * 18
    update(d.id, { dx: d.fromX + event.clientX - d.startX, dy: d.fromY + event.clientY - d.startY, tiltX, tiltY })
  }
  const onUp = event => {
    const d = drag.current
    if (!d) return
    drag.current = null
    const throwX = Math.max(-160, Math.min(160, d.vx * 220)), throwY = Math.max(-160, Math.min(160, d.vy * 220))
    setCards(list => list.map(card => (card.id === d.id ? { ...card, dx: card.dx + throwX, dy: card.dy + throwY, tiltX: 0, tiltY: 0, held: false } : card)))
    void event
  }
  // The browser took the gesture for a page scroll (a vertical swipe on a phone): put the print back, no throw.
  const onCancel = () => {
    const d = drag.current
    if (!d) return
    drag.current = null
    update(d.id, { dx: d.fromX, dy: d.fromY, tiltX: 0, tiltY: 0, held: false })
  }

  return (
    <div ref={board} className="me-board">
      {note ? <p className="me-board__note" aria-hidden="true">{note}</p> : null}
      {cards.map(card => (
        <div key={card.id} className={`me-card${card.held ? ' me-card--held' : ''}`}
          style={{ top: card.top, left: card.left, zIndex: card.z, '--rotate': `${card.rotate}deg`, '--dx': `${card.dx}px`, '--dy': `${card.dy}px`, '--tx': `${card.tiltX}deg`, '--ty': `${card.tiltY}deg`, width: card.width }}
          onPointerDown={event => onDown(event, card)} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onCancel}>
          <img src={card.src} alt={card.alt} draggable="false" loading="lazy" />
          <span className="me-card__glare" aria-hidden="true" />
        </div>
      ))}
    </div>
  )
}

/* Aceternity Link Preview, static: hover the link, a card with the page's picture rises and tilts with the pointer. */
function LinkPreview({ href, image, label, children }) {
  const [open, setOpen] = useState(false)
  const [tilt, setTilt] = useState(0)
  const [missing, setMissing] = useState(false)
  const disabled = !href
  const move = event => { const box = event.currentTarget.getBoundingClientRect(); setTilt(((event.clientX - box.left) / box.width - 0.5) * 24) }
  return (
    <span className="me-preview" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onMouseMove={move}>
      {disabled
        ? <span className="me-preview__link me-preview__link--soon">{children}</span>
        : <a className="me-preview__link" href={href} target="_blank" rel="noreferrer">{children}</a>}
      <span className={`me-preview__card${open ? ' me-preview__card--open' : ''}`} style={{ '--tilt': `${tilt}px` }} aria-hidden="true">
        {!missing && image ? <img src={image} alt="" onError={() => setMissing(true)} /> : <span className="me-preview__placeholder"><b>PopcornPal</b><small>{label}</small></span>}
      </span>
    </span>
  )
}

/* The tank: bubbles rise on a canvas; a few fish silhouettes cross on CSS animations. */
function Aquarium() {
  const canvas = useRef(null)
  useEffect(() => {
    const element = canvas.current
    if (!element) return undefined
    const ctx = element.getContext('2d')
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    let bubbles = []
    let frame
    const resize = () => { const box = element.getBoundingClientRect(); element.width = box.width * dpr; element.height = box.height * dpr; bubbles = Array.from({ length: Math.round(box.width / 26) }, () => spawn(true)) }
    const spawn = anywhere => ({ x: Math.random(), y: anywhere ? Math.random() : 1.05, r: 1.5 + Math.random() * 4, v: 0.0009 + Math.random() * 0.0016, wobble: Math.random() * Math.PI * 2 })
    const draw = () => {
      const w = element.width, h = element.height
      ctx.clearRect(0, 0, w, h)
      for (const b of bubbles) {
        b.y -= b.v; b.wobble += 0.03
        const x = (b.x + Math.sin(b.wobble) * 0.004) * w, y = b.y * h
        ctx.beginPath(); ctx.arc(x, y, b.r * dpr, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(190,225,240,0.55)'; ctx.lineWidth = dpr; ctx.stroke()
        ctx.beginPath(); ctx.arc(x - b.r * dpr * 0.35, y - b.r * dpr * 0.35, b.r * dpr * 0.25, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill()
        if (b.y < -0.05) Object.assign(b, spawn(false))
      }
      frame = requestAnimationFrame(draw)
    }
    resize(); draw()
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize) }
  }, [])
  const fish = [
    { top: '28%', duration: 38, delay: 0, size: 54, flip: false },
    { top: '58%', duration: 52, delay: -18, size: 38, flip: true },
    { top: '72%', duration: 44, delay: -30, size: 30, flip: false },
    { top: '40%', duration: 61, delay: -7, size: 24, flip: true },
  ]
  return (
    <div className="me-tank" aria-hidden="true">
      <canvas ref={canvas} className="me-tank__bubbles" />
      {fish.map((f, index) => (
        <svg key={index} className={`me-fish${f.flip ? ' me-fish--flip' : ''}`} viewBox="0 0 64 32" width={f.size} style={{ top: f.top, animationDuration: `${f.duration}s`, animationDelay: `${f.delay}s` }}>
          <path d="M4 16c10-12 26-14 40-6l12-8-4 14 4 14-12-8c-14 8-30 6-40-6z" fill="currentColor" />
          <circle cx="16" cy="14" r="2" fill="#0b1020" />
        </svg>
      ))}
      <div className="me-tank__weed me-tank__weed--a" /><div className="me-tank__weed me-tank__weed--b" /><div className="me-tank__weed me-tank__weed--c" />
    </div>
  )
}

export default function MePage() {
  // The sections render after the browser has already tried to honour a #hash, so scroll once they exist.
  useEffect(() => {
    const target = window.location.hash
    if (!target) return undefined
    const frame = requestAnimationFrame(() => { try { document.querySelector(target)?.scrollIntoView({ behavior: 'instant', block: 'start' }) } catch { /* odd hash */ } })
    return () => cancelAnimationFrame(frame)
  }, [])
  const { burst, layer: burstLayer } = useBursts()
  return (
    <main className="me">
      <header className="me-hero">
        <BackgroundLines />
        <a className="me-back" href="/"><Icon name="arrow-left" size={14} /> Back to the portfolio</a>
        <div className="me-hero__layout me-hero__layout--solo">
          <div className="me-hero__copy">
            <p className="me-eyebrow">DIEGO, OFF THE CLOCK</p>
            <h1>The parts that don’t fit on a <Cover>résumé.</Cover></h1>
            <p className="me-lede"><span className="me-fine">Hover</span><span className="me-coarse">Press and hold</span> the last word.</p>
          </div>

        </div>
      </header>

      <section className="me-section me-origins" id="origins">
        <div className="me-two">
          <div>
            <p className="me-eyebrow">01 / ORIGINS</p>
            <h2>First child of an architect<br />and a teacher.</h2>
            <p>Born in San Juan, Puerto Rico <img className="me-flag" src="/images/pr-flag.svg" alt="" />, raised in a town called Trujillo Alto, where I’ve lived most of my life. I have a brother who I love dearly.</p>
          </div>
          <figure className="me-taped">
            <img src="/images/me/family.jpg" alt="Diego with his parents and his brother, dressed up for Christmas" loading="lazy" />
            <figcaption>The four of us. At Christmas, naturally.</figcaption>
          </figure>
        </div>
      </section>

      <section className="me-section me-heroes" id="heroes" onClick={event => burst(event)}>
        {burstLayer}
        <p className="me-eyebrow">02 / FAITH &amp; HEROES <span className="me-hint">· tap anywhere in here</span></p>
        <div className="me-heroes__grid">
          <div>
            <h2>Christian since I was a kid.<br />Superhero fan for about as long.</h2>
            <p>My first obsession was Spider-Man. Something about the character always felt warm to me, and as an adult I can see why: he’s relatable. A hero who struggles financially, like I have, who tries to fulfill his responsibilities no matter what, and who always keeps his hopes up.</p>
            <p className="me-pull">Hopeful. That’s who I’ve been trying to be.</p>
          </div>
          <div className="me-heroes__stack">
            <figure className="me-taped me-taped--small">
              <img src="/images/me/young-spidey.jpg" alt="Diego as a small child, grinning next to a Spider-Man figure at a photo studio" loading="lazy" />
              <figcaption>Exhibit A. Since birth, more or less.</figcaption>
            </figure>
            <button type="button" className="me-sticker me-sticker--spidey" onClick={event => { event.stopPropagation(); burst(event, 'THWIP!') }} aria-label="Diego in a Spider-Man mask. Tap for a thwip.">
              <img src="/images/me/spidey-mask.png" alt="" />
            </button>
          </div>
        </div>
      </section>

      <section className="me-section me-stories" id="stories">
        <p className="me-eyebrow">03 / STORIES</p>
        <h2>Living another life<br />through other lenses.</h2>
        <p>That obsession grew into a love of stories. Comics first, then books. From <em>Don Quijote</em> to <em>Percy Jackson</em>, I’ve never shied away from trying on another life. That’s what books are for.</p>
        <p>Comics, art and writing led me to movies, and movies sparked photography and music.</p>
        <DraggablePile note="Drag them around." items={[
          { id: 'booth', src: '/images/me/photo-booth.jpg', alt: 'A red London phone box at night, a passer-by blurred by the long exposure', top: '3%', left: '2%', rotate: -6, width: 150 },
          { id: 'portrait', src: '/images/me/portrait.jpg', alt: 'A mother and her son, laughing, in warm light', top: '34%', left: '8%', rotate: 5, width: 160 },
          { id: 'atat', src: '/images/me/atat.jpg', alt: 'Two AT-AT walkers looming inside a dark hangar', top: '62%', left: '2%', rotate: -4, width: 170 },
          { id: 'dog', src: '/images/me/dog.jpg', alt: 'A dog looking at the camera, in black and white', top: '2%', left: '20%', rotate: -3, width: 200 },
          { id: 'slinky', src: '/images/me/slinky.jpg', alt: 'The Slinky Dog coaster against a bright sky', top: '30%', left: '26%', rotate: 7, width: 140 },
          { id: 'mando', src: '/images/me/mando.jpg', alt: 'A Mandalorian costume, helmet and armour, among trees', top: '58%', left: '20%', rotate: -8, width: 150 },
          { id: 'book', src: '/images/me/book.jpg', alt: 'An open book, mid-chapter, read in a waiting room', top: '6%', left: '38%', rotate: 5, width: 150 },
          { id: 'comic', src: '/images/me/comic.jpg', alt: 'An issue of The Amazing Spider-Man held up in a car', top: '30%', left: '42%', rotate: -6, width: 140 },
          { id: 'xmen', src: '/images/me/xmen.jpg', alt: 'An X-Men 92 comic with Storm on the cover', top: '58%', left: '36%', rotate: 4, width: 130 },
          { id: 'stack', src: '/images/me/comics-stack.jpg', alt: 'A handful of comics fanned out, Spider-Man on top', top: '68%', left: '48%', rotate: -5, width: 150 },
          { id: 'records', src: '/images/me/records.jpg', alt: 'Rows of records in a shop', top: '2%', left: '56%', rotate: 4, width: 220 },
          { id: 'falcon', src: '/images/me/falcon.jpg', alt: 'The cockpit of the Millennium Falcon, lit red and blue', top: '32%', left: '58%', rotate: -7, width: 160 },
          { id: 'arcade', src: '/images/me/arcade.jpg', alt: 'A Marvel arcade cabinet glowing in the dark', top: '60%', left: '62%', rotate: 6, width: 150 },
          { id: 'crew', src: '/images/me/spidey-crew.jpg', alt: 'Four friends in Spider-Man masks and shirts outside a cinema', top: '10%', left: '76%', rotate: -7, width: 210 },
          { id: 'marvel', src: '/images/me/marvel-screen.jpg', alt: 'The Marvel Studios logo on a cinema screen before the movie', top: '40%', left: '78%', rotate: 5, width: 180 },
          { id: 'gryffindor', src: '/images/me/gryffindor.jpg', alt: 'Diego in a Gryffindor scarf and robe, school-photo style', top: '64%', left: '76%', rotate: -4, width: 140 },
          { id: 'express', src: '/images/me/hogwarts-express.jpg', alt: 'The Hogwarts Express sign at platform nine and three-quarters', top: '72%', left: '88%', rotate: 7, width: 150 },
        ]} />
        <p className="me-popcorn">
          The movies and shows I keep going back to live on{' '}
          <LinkPreview href={POPCORNPAL_URL} image="/images/popcornpal-preview.jpg" label={POPCORNPAL_URL ? 'My profile' : 'Top ten, coming soon'}>PopcornPal</LinkPreview>
          {POPCORNPAL_URL ? '. Go see the top ten.' : ', where my top ten is on its way.'}
        </p>
      </section>

      <section className="me-section me-boinas" id="boinas">
        <div className="me-two me-two--reverse">
          <div>
            <p className="me-eyebrow">04 / BOINAS</p>
            <h2>My grandfather wore them.<br />It took me until this year.</h2>
            <p>I love boinas. My grandfather used to wear them, and I never mustered up the courage to try one unironically until this year. Now I love them. Kangols especially.</p>
            <p className="me-aside">I also love adding pictures to slides without backgrounds. I’ve been teased for it. No regrets.</p>
          </div>
          <figure className="me-sticker me-sticker--kangol">
            <img src="/images/me/kangol.png" alt="Diego in a black Kangol, background removed" loading="lazy" />
            <figcaption>Background removed, as is tradition.</figcaption>
          </figure>
        </div>
      </section>

      <section className="me-section me-aquarium" id="tank">
        <p className="me-eyebrow">05 / THE TANK</p>
        <h2>Aquariums. I love them.<br />That’s the whole note.</h2>
        <Aquarium />
      </section>

      <footer className="me-footer">
        <a href="/">Back to the portfolio <Icon name="arrow-up-right" size={14} /></a>
      </footer>
    </main>
  )
}
