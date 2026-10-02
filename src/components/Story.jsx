import { useRef, useState } from 'react'

/* One sentence each — the visitor, then Claude — until the story is MAX_LINES long. The page sends
   the whole story every turn; api/story.js holds the key and the rules. */
const MAX_LINES = 12   // mirrored in api/story.js

export default function Story() {
  const [lines, setLines] = useState([])         // { who: 'you' | 'claude', text }
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState('idle')   // idle | writing | offline | error
  const [note, setNote] = useState('')
  const input = useRef(null)
  const finished = lines.length >= MAX_LINES
  const writing = status === 'writing'

  async function send(story) {
    setStatus('writing'); setNote('')
    try {
      const response = await fetch('/api/story', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ lines: story }) })
      if (response.status === 503) { setStatus('offline'); return }
      const data = await response.json().catch(() => ({}))
      if (!response.ok) { setNote(data.error || 'That line didn’t go through.'); setStatus('error'); return }
      if (data.line) setLines([...story, { who: 'claude', text: data.line }])
      else { setLines(story.slice(0, -1)); setDraft(story.at(-1).text); setNote(data.note) }   // Claude passed: hand the line back
      setStatus('idle')
    } catch { setNote('That line didn’t go through.'); setStatus('error') }
    finally { input.current?.focus() }
  }
  function submit(event) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || writing) return
    const story = [...lines, { who: 'you', text }]
    setLines(story); setDraft('')
    send(story)
  }
  function reset() { setLines([]); setDraft(''); setNote(''); setStatus('idle'); input.current?.focus() }

  return (
    <div className="story-card">
      <p className="story-text" aria-live="polite">
        {lines.length === 0 && <span className="story-placeholder">Once upon a time…</span>}
        {lines.map((line, index) => <span key={index} className={`story-line story-line--${line.who}`}>{line.text} </span>)}
        {writing && <span className="story-typing" role="status" aria-label="Claude is writing"><i /><i /><i /></span>}
      </p>
      {lines.length > 0 && <p className="story-legend" aria-hidden="true"><span className="story-legend__you">You</span><span className="story-legend__claude">Claude</span></p>}
      {finished
        ? <p className="story-end">The end. <button type="button" onClick={reset}>Write another</button></p>
        : status === 'offline'
          ? <p className="story-note">Claude isn’t connected right now.</p>
          : <form className="story-form" onSubmit={submit}>
              <label className="music-sr-only" htmlFor="story-input">Your sentence</label>
              <input id="story-input" name="sentence" ref={input} value={draft} onChange={event => setDraft(event.target.value)} maxLength={240} autoComplete="off" disabled={writing}
                placeholder={lines.length ? 'Your turn…' : 'Start with one sentence…'} />
              <button type="submit" className="story-send" disabled={!draft.trim() || writing} aria-label="Add my line">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
              </button>
            </form>}
      {note && <p className="story-note" role="status">{note}{status === 'error' && <> <button type="button" onClick={() => send(lines)}>Try again</button></>}</p>}
      <p className="story-foot"><span>{lines.length} / {MAX_LINES} sentences</span>{lines.length > 0 && !finished && <button type="button" onClick={reset}>Start over</button>}</p>
    </div>
  )
}
