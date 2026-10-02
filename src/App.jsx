import { Component, Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { projects, courseProjects, experience, research, programs, profile, skills } from './data/callingCard'
import { MusicStart, NowPlayingDock, PlaylistDrawer } from './components/music/MusicControls'
import { PhotoStrip } from './components/Photos'
import Icon from './components/Icon'
import './Portfolio.css'

const MusicTurntable = lazy(() => import('./components/music/MusicTurntable'))
const HighlandCrossing = lazy(() => import('./components/HighlandCrossing'))
const WorldGlobe = lazy(() => import('./components/WorldGlobe'))
const Story = lazy(() => import('./components/Story'))
const Arrow = () => <Icon name="arrow-up-right" />

class ExperienceBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? (this.props.fallback ?? <div className="experience-fallback"><p>This 3D scene couldn’t load on this device.</p></div>) : this.props.children }
}

/* Projects are tiles that open into a sheet. Where the browser supports view transitions, the tile itself
   grows into the sheet (one shared element, App Store style); elsewhere the sheet simply appears. */
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
function morph(update, after) {
  if (document.startViewTransition && !reduceMotion()) document.startViewTransition(() => flushSync(update)).finished.finally(() => after?.())
  else { update(); after?.() }
}

/* Apple's momentum projection: where a flick would come to rest (Designing Fluid Interfaces, WWDC 2018). */
const restingPoint = (velocity, rate = 0.998) => (velocity / 1000) * rate / (1 - rate)
/* Soft resistance past a boundary instead of a hard stop. */
const rubberband = (overshoot, dimension, constant = 0.55) => (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot))

/* The sheet can be dragged down by its picture: 1:1 tracking, rubber-band upward, and on release the finger's
   velocity decides — either it flies off (closing) or springs home carrying that velocity. Grabbing it mid-spring
   takes over from wherever it is. A sideways drag on the picture flips through the project's screenshots instead. */
function ProjectSheet({ project, onClose }) {
  const ref = useRef(null)
  const [shot, setShot] = useState(0)   // which picture is up: 0 is the cover, then the project's other screenshots
  const pictures = [{ src: project.image, thumb: project.image, alt: `${project.title} screenshot` }, ...project.shots.map(picture => ({ ...picture, thumb: picture.src.replace('.webp', '-thumb.webp') }))]
  const thumbs = useRef(null)
  const drag = useRef({ active: false, axis: null, startX: 0, startY: 0, origin: 0, y: 0, vy: 0, lastY: 0, lastT: 0, frame: 0 })
  useLayoutEffect(() => { ref.current?.showModal() }, [])
  // Keep the chosen thumbnail in sight, and have the next picture ready before it is asked for.
  useEffect(() => {
    const thumb = thumbs.current?.children[shot]
    thumb?.parentNode.scrollTo({ left: thumb.offsetLeft - thumb.parentNode.clientWidth / 2 + thumb.offsetWidth / 2, behavior: 'smooth' })
    if (pictures[shot + 1]) new Image().src = pictures[shot + 1].src
  }, [shot])
  function apply(y) {
    const node = ref.current
    if (!node) return
    node.style.transform = y ? `translateY(${y}px)` : ''
    node.style.setProperty('--dim', String(Math.max(0, 1 - y / (node.offsetHeight || 600))))
  }
  function down(event) {
    if (event.button && event.button !== 0) return
    const d = drag.current
    cancelAnimationFrame(d.frame)
    d.active = true; d.axis = null; d.startX = event.clientX; d.startY = event.clientY; d.origin = event.clientY - d.y; d.lastY = event.clientY; d.lastT = event.timeStamp; d.vy = 0
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  function move(event) {
    const d = drag.current
    if (!d.active) return
    // The first few pixels say what the gesture is: sideways flips through the screenshots, up and down moves the sheet.
    if (!d.axis) {
      const dx = Math.abs(event.clientX - d.startX), dy = Math.abs(event.clientY - d.startY)
      if (Math.max(dx, dy) < 8) return
      d.axis = dx > dy && pictures.length > 1 ? 'x' : 'y'
      d.origin = event.clientY - d.y; d.lastY = event.clientY; d.lastT = event.timeStamp
    }
    if (d.axis === 'x') return
    const raw = event.clientY - d.origin
    const dt = Math.max(1, event.timeStamp - d.lastT)
    d.vy = d.vy * 0.4 + ((event.clientY - d.lastY) / dt) * 1000 * 0.6   // smoothed px/s
    d.lastY = event.clientY; d.lastT = event.timeStamp
    d.y = raw < 0 ? rubberband(raw, 140) : raw
    apply(d.y)
  }
  function up(event) {
    const d = drag.current
    if (!d.active) return
    d.active = false
    if (d.axis === 'x') {
      const dx = event.clientX - d.startX
      if (event.type === 'pointerup' && Math.abs(dx) > 40) setShot(value => Math.min(pictures.length - 1, Math.max(0, value + (dx < 0 ? 1 : -1))))
      return
    }
    const height = ref.current?.offsetHeight || 600
    if (d.y + restingPoint(d.vy) > height * 0.35 || d.vy > 1100) { onClose(); return }
    let x = d.y, v = d.vy, last = performance.now()
    const stiffness = 260, damping = 2 * Math.sqrt(stiffness)   // critically damped: a settle, not a bounce
    const step = now => {
      const dt = Math.min(0.032, (now - last) / 1000); last = now
      v += (-stiffness * x - damping * v) * dt; x += v * dt
      if (Math.abs(x) < 0.5 && Math.abs(v) < 20) { d.y = 0; apply(0); return }
      d.y = x; apply(x); d.frame = requestAnimationFrame(step)
    }
    d.frame = requestAnimationFrame(step)
  }
  return <dialog ref={ref} className="sheet" style={{ viewTransitionName: `project-${project.id}`, viewTransitionClass: 'project' }} aria-labelledby={`sheet-${project.id}`} onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === ref.current) onClose() }}>
    <div className="sheet-inner">
      <div className="sheet-art" style={{ background: project.imageBackground }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <span className="sheet-grabber" aria-hidden="true" />
        <img key={shot} className={shot ? 'sheet-shot' : undefined} src={pictures[shot].src} alt={pictures[shot].alt} draggable="false" />
      </div>
      <button type="button" className="sheet-close" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button>
      {pictures.length > 1 && <div className="sheet-shots" ref={thumbs} role="group" aria-label={`${project.title} screenshots`}>
        {pictures.map((picture, index) => <button type="button" key={picture.src} className="sheet-thumb" style={{ background: project.imageBackground }} aria-pressed={index === shot} aria-label={`Screenshot ${index + 1} of ${pictures.length}: ${picture.alt}`} onClick={() => setShot(index)}><img src={picture.thumb} alt="" draggable="false" /></button>)}
      </div>}
      <div className="sheet-body">
        <h2 id={`sheet-${project.id}`}>{project.title}</h2>
        <p className="sheet-lead">{project.description}</p>
        <ul className="project-details">{project.details.map(detail => <li key={detail}>{detail}</li>)}</ul>
        <div className="tags">{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
        {project.href && <a className="sheet-link" href={project.href} target="_blank" rel="noreferrer">Open {project.title} <Arrow /></a>}
      </div>
    </div>
  </dialog>
}

function tiltMove(event) {
  if (event.pointerType !== 'mouse' || reduceMotion()) return
  const node = event.currentTarget, rect = node.getBoundingClientRect()
  const x = (event.clientX - rect.left) / rect.width - 0.5, y = (event.clientY - rect.top) / rect.height - 0.5
  node.style.setProperty('--ry', `${x * 6}deg`); node.style.setProperty('--rx', `${-y * 6}deg`)
  node.style.setProperty('--px', `${x * -12}px`); node.style.setProperty('--py', `${y * -12}px`)
}
function tiltLeave(event) { for (const name of ['--rx', '--ry', '--px', '--py']) event.currentTarget.style.removeProperty(name) }

function Projects() {
  const [open, setOpen] = useState(null)       // project id of the open sheet
  const [target, setTarget] = useState(null)   // the one tile that carries a view-transition-name — only it may morph; the rest dim with the page
  const trigger = useRef(null)
  function show(project, event) { trigger.current = event.currentTarget; flushSync(() => setTarget(project.id)); morph(() => setOpen(project.id)) }
  function hide() { morph(() => setOpen(null), () => setTarget(null)) }
  // Once the sheet is gone, focus returns to the tile that opened it (while it is open the page behind is inert).
  useEffect(() => { if (open === null) trigger.current?.focus({ preventScroll: true }) }, [open])
  const current = projects.find(project => project.id === open)
  return <section className="projects section" id="projects">
    <h2 data-reveal>Projects.</h2>
    <div className="project-grid">
      {projects.map(project => <button type="button" className="project" data-reveal key={project.id} onClick={event => show(project, event)} aria-haspopup="dialog"
        onPointerMove={tiltMove} onPointerLeave={tiltLeave} style={target === project.id && open !== project.id ? { viewTransitionName: `project-${project.id}`, viewTransitionClass: 'project' } : undefined}>
        <div className="project-art" style={{ background: project.imageBackground }}><img src={project.image} alt="" loading="lazy" /></div>
        <div className="project-scrim"><h3>{project.title}</h3><p>{project.description}</p></div>
        <span className="project-plus" aria-hidden="true"><Icon name="plus" size={18} /></span>
      </button>)}
    </div>
    {current && <ProjectSheet project={current} onClose={hide} />}
  </section>
}

const globeSeen = { current: false }
function AboutSection() {
  const ref = useRef(null)
  const inView = useInView(ref, '-10% 0px')
  if (inView) globeSeen.current = true
  return <section className="about" id="about" ref={ref}>
    {/* The globe is a layer across the whole card, so the only thing that ever clips it is the card itself. */}
    <ExperienceBoundary fallback={<div className="globe-stage" aria-hidden="true" />}>
      <Suspense fallback={<div className="globe-stage globe-stage--loading" aria-hidden="true" />}>
        {inView || globeSeen.current ? <WorldGlobe active={inView} meHref="/me.html" /> : <div className="globe-stage" aria-hidden="true" />}
      </Suspense>
    </ExperienceBoundary>
    <div className="about-grid">
      <div className="about-copy">
        <h2>Hi, I’m <em>Diego.</em></h2>
        <p>Born in San Juan, raised in Trujillo Alto, studying in Mayagüez. <img className="inline-flag" src="/images/pr-flag.svg" alt="Flag of Puerto Rico" /></p>
        <p>Off the clock: comics, books, movies, photography and music.</p>
      </div>
      <figure className="campus-seal"><img src="/images/uprm-seal-cream.png" alt="Seal of the University of Puerto Rico, Mayagüez campus" loading="lazy" /><figcaption>Recinto Universitario de Mayagüez</figcaption></figure>
    </div>
    <div className="globe-dome" aria-hidden="true" />
    <p className="globe-caption">Drag to spin <span aria-hidden="true">·</span> <a className="globe-caption__link" href="/me.html" target="_blank" rel="noopener">Off the clock <Icon name="arrow-up-right" size={12} /></a></p>
  </section>
}

function Points({ items }) { return <ul className="xp-points">{items.map(text => <li key={text}>{text}</li>)}</ul> }

/* One entry (a job, a research role, a program): when and where on the left, what he did on the right, its photos underneath. */
function Role({ job }) {
  return <article className="xp" data-reveal>
    <div className="xp-meta"><p className="xp-period">{job.period}</p>{job.place && <p>{job.place}</p>}</div>
    <div className="xp-body">
      <h3>{job.company}{job.current && <span className="xp-now"><i className="status-dot" aria-hidden="true" />Now</span>}</h3>
      {job.role && <p className="xp-role">{job.role}</p>}
      {job.note && <p className="xp-note">{job.note}</p>}
      {job.points && <Points items={job.points} />}
      {job.roles?.map(role => <div className="xp-sub" key={role.title}><h4>{role.title}{role.period && <span>{role.period}</span>}</h4><Points items={role.points} /></div>)}
      {job.tags && <div className="tags">{job.tags.map(tag => <span key={tag}>{tag}</span>)}</div>}
      {job.photos && <PhotoStrip set={job.photos} label={job.company} />}
    </div>
  </article>
}

/* Scroll progress through the pinned opening, written to a ref (for the 3D camera)
   and a CSS custom property (for the dawn overlay) — never to React state. */
function useScrollProgress(ref, progress) {
  useEffect(() => {
    const node = ref.current
    if (!node) return undefined
    let frame = 0
    function update() {
      frame = 0
      const rect = node.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0
      progress.current = p
      node.style.setProperty('--p', p.toFixed(4))
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => { window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); cancelAnimationFrame(frame) }
  }, [ref, progress])
}

/* Sections rise into view once. */
function useReveal() {
  useEffect(() => {
    const nodes = document.querySelectorAll('[data-reveal]')
    if (!('IntersectionObserver' in window)) { nodes.forEach(node => node.classList.add('is-in')); return undefined }
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('is-in'); observer.unobserve(entry.target) }
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' })
    nodes.forEach(node => observer.observe(node))
    return () => observer.disconnect()
  }, [])
}

function useInView(ref, margin = '0px') {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node || !('IntersectionObserver' in window)) { setInView(true); return undefined }
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: margin })
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref, margin])
  return inView
}

const turntableFallback = <div className="music-scene-fallback"><img src="/images/storybook-turntable.png" alt="A rounded emerald and white record player with silver details"/><MusicStart/></div>

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [overScene, setOverScene] = useState(true)
  const [scenePaused, setScenePaused] = useState(false)
  const openingRef = useRef(null)
  const progress = useRef(0)
  useScrollProgress(openingRef, progress)
  useReveal()
  const openingInView = useInView(openingRef)

  useEffect(() => {
    const onScroll = () => setOverScene(window.scrollY < window.innerHeight * 1.35)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  // The browser's own chrome (Safari's toolbar, the Android status bar) takes the colour of what is under it.
  useEffect(() => { document.querySelector('meta[name="theme-color"]')?.setAttribute('content', overScene ? '#060b18' : '#f3f4f0') }, [overScene])
  useEffect(() => { const close = () => setMenuOpen(false); window.addEventListener('hashchange', close); return () => window.removeEventListener('hashchange', close) }, [])
  // Deep links (#about, #projects…) arrive before React has rendered the sections; scroll once we have.
  useEffect(() => {
    const target = window.location.hash
    if (!target || target === '#opening') return undefined
    let cancelled = false
    const stop = () => { cancelled = true }
    const jump = () => { if (cancelled) return; try { document.querySelector(target)?.scrollIntoView({ behavior: 'instant', block: 'start' }) } catch { /* unusual hash */ } }
    const timers = [0, 400, 1000, 2000].map(delay => setTimeout(jump, delay))
    for (const type of ['wheel', 'touchstart', 'keydown']) window.addEventListener(type, stop, { passive: true, once: true })
    return () => { timers.forEach(clearTimeout); for (const type of ['wheel', 'touchstart', 'keydown']) window.removeEventListener(type, stop) }
  }, [])

  const nav = [['#about', 'About'], ['#projects', 'Projects'], ['#experience', 'Experience'], ['#music', 'Music'], ['#story', 'Story']]

  return <div id="home" className="portfolio">
    <a className="skip-link" href="#main">Skip to content</a>
    <header className={`site-header${overScene ? ' site-header--over' : ''}${menuOpen ? ' site-header--menu' : ''}`}>
      <a href="#opening" className="wordmark" aria-label="Diego Pérez, back to the top">Diego <em>Pérez</em></a>
      <nav className={menuOpen ? 'main-nav main-nav--open' : 'main-nav'} id="main-nav" aria-label="Main navigation">
        {nav.map(([href, label]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
        <a href={profile.resume} target="_blank" rel="noreferrer" className="main-nav__resume">Résumé <Arrow /></a>
      </nav>
      <a className="header-contact" href="#contact">Contact me <Icon name="arrow-down" /></a>
      <button type="button" className="mobile-menu" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="main-nav" onClick={() => setMenuOpen(value => !value)}>{menuOpen ? 'Close' : 'Menu'} <Icon name={menuOpen ? 'close' : 'plus'} size={18} /></button>
    </header>

    <main id="main">
      <section className="opening" id="opening" ref={openingRef} aria-label="Introduction">
        <div className="opening-sticky">
          <ExperienceBoundary fallback={<div className="opening-scene opening-scene--still" />}><Suspense fallback={<div className="opening-scene" />}><HighlandCrossing progress={progress} active={openingInView && !scenePaused} /></Suspense></ExperienceBoundary>
          <div className="opening-copy">
            <h1>Get to know <em>me.</em></h1>
            <p className="opening-description">I’m Diego, a software engineering senior at UPR Mayagüez. I work at L3Harris, do full-stack research at ROCS, and teach with CodePath.</p>
            {profile.showSeeking && <a className="opening-status" href="#contact"><span className="status-dot" aria-hidden="true"/>{profile.seeking}</a>}
            <a href="#start" className="opening-cue" aria-label="Scroll down"><span aria-hidden="true"/></a>
          </div>
          <button type="button" className="opening-pause" onClick={() => setScenePaused(value => !value)} aria-pressed={scenePaused} aria-label={scenePaused ? 'Play the scene' : 'Pause the scene'}><Icon name={scenePaused ? 'play' : 'pause'} size={14} /></button>
          <div className="dawn" aria-hidden="true"/>
        </div>
      </section>

      {/* The overview: what's happening now, the record player, and a door into every section. */}
      <section className="bento" id="start" aria-label="Overview">
        <div className="tile tile--now" data-reveal>
          <p className="tile-label"><span className="status-dot" aria-hidden="true"/> Now</p>
          <ul className="now-list">
            <li>Software engineering at <b>L3Harris</b></li>
            <li>Full-stack research at <b>ROCS</b></li>
            <li>Tech Fellow with <b>CodePath</b></li>
          </ul>
          <p className="tile-foot">B.S. Software Engineering · UPR Mayagüez · May 2027</p>
        </div>
        <div className="tile tile--music" id="music" data-reveal>
          <p className="tile-label">Music</p>
          <ExperienceBoundary fallback={turntableFallback}><Suspense fallback={turntableFallback}><MusicTurntable/></Suspense></ExperienceBoundary>
        </div>
        <a className="tile tile--about" href="#about" data-reveal><span className="tile-title">About me</span><span className="tile-sub">Mayagüez, Puerto Rico</span><span className="tile-badge" aria-hidden="true"><Icon name="arrow-down" /></span></a>
        <a className="tile" href="#projects" data-reveal><span className="tile-title">Projects</span><span className="tile-sub">{projects.map(project => project.title).join(' · ')}</span><span className="tile-badge" aria-hidden="true"><Icon name="arrow-down" /></span></a>
        <a className="tile" href="#experience" data-reveal><span className="tile-title">Experience</span><span className="tile-sub">L3Harris · CodePath · Evertec · MCS</span><span className="tile-badge" aria-hidden="true"><Icon name="arrow-down" /></span></a>
        <a className="tile tile--story" href="#story" data-reveal><span className="tile-title">Write a story</span><span className="tile-sub">One sentence at a time, with Claude</span><span className="tile-badge" aria-hidden="true"><Icon name="arrow-down" /></span></a>
        <a className="tile tile--me" href="/me.html" target="_blank" rel="noopener" data-reveal><span className="tile-title">Off the clock</span><span className="tile-sub">Family, faith, Spider-Man, aquariums</span><span className="tile-badge" aria-hidden="true"><Icon name="arrow-up-right" /></span></a>
        <a className="tile tile--hello" href={`mailto:${profile.email}`} data-reveal><span className="tile-title">Say hello</span><span className="tile-sub">{profile.email.replace('@', '\u200b@')}</span><span className="tile-badge" aria-hidden="true"><Icon name="arrow-up-right" /></span></a>
      </section>

      <AboutSection/>

      <Projects/>

      <section className="experience section" id="experience">
        <h2 data-reveal>Experience.</h2>
        <div className="xp-list">{experience.map(job => <Role key={job.id} job={job} />)}</div>
      </section>

      <section className="section" id="research">
        <h2 data-reveal>Research <em>&amp;</em> leadership.</h2>
        <div className="xp-list">{research.map(job => <Role key={job.id} job={job} />)}</div>
      </section>

      <section className="section" id="programs">
        <h2 data-reveal>Programs <em>&amp;</em> conferences.</h2>
        <div className="xp-list">{programs.map(job => <Role key={job.id} job={job} />)}</div>
      </section>

      <section className="toolkit section" id="skills">
        <h2 data-reveal>Education <em>&amp;</em> skills.</h2>
        <div className="toolkit-grid" data-reveal>
          <div>
            <div className="school">
              <img src="/images/uprm-seal.png" alt="" loading="lazy" />
              <div>
                <h3>{profile.education.institution}</h3>
                <p>{profile.education.qualification}</p>
                <p className="school-meta">{profile.education.period} · {profile.education.detail}</p>
              </div>
            </div>
            <dl className="school-more">
              <div><dt>Coursework</dt><dd>{profile.education.coursework.join(', ')}</dd></div>
              {courseProjects.map(item => <div key={item.title}><dt>{item.title} <span>{item.course}</span></dt><dd>{item.text}</dd></div>)}
            </dl>
          </div>
          <dl className="skills">{skills.map(group => <div key={group.group}><dt>{group.group}</dt><dd>{group.items.map(item => <span key={item}>{item}</span>)}</dd></div>)}</dl>
        </div>
      </section>

      <section className="story section" id="story">
        <div data-reveal><h2>Write a story <em>with me.</em></h2><p className="section-lead">One sentence each, you and Claude, 12 at most.</p></div>
        <div data-reveal><Suspense fallback={null}><Story /></Suspense></div>
      </section>

      <section className="contact section" id="contact" data-reveal>
        <h2>Get in <em>touch.</em></h2>
        {profile.showSeeking && <p className="contact-lead">{profile.seeking}.</p>}
        <div className="contact-cards">
          <a className="contact-card contact-card--email" href={`mailto:${profile.email}`}><span>Email</span><b>{profile.email}</b></a>
          <a className="contact-card contact-card--linkedin" href={profile.linkedin} target="_blank" rel="noreferrer"><span>LinkedIn</span><b>diego-ganda <Arrow/></b></a>
          <a className="contact-card contact-card--github" href={profile.github} target="_blank" rel="noreferrer"><span>GitHub</span><b>diegoperez16 <Arrow/></b></a>
          <a className="contact-card contact-card--resume" href={profile.resume} target="_blank" rel="noreferrer"><span>Résumé</span><b>PDF <Arrow/></b></a>
        </div>
      </section>
    </main>
    <NowPlayingDock/>
    <PlaylistDrawer/>
    <footer className="site-footer"><span>© {new Date().getFullYear()} Diego Pérez · {profile.location} · Modeled in Blender, built with React and Three.js</span><a href="#opening">Back to top <Icon name="arrow-up" size={14} /></a></footer>
  </div>
}
