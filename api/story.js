import Anthropic from '@anthropic-ai/sdk'

/* "Write a story with me": the visitor and Claude alternate single sentences until the story is
   MAX_LINES long. Runs as a Vercel function in production and behind vite.config.js's middleware in
   dev, so it only uses Node's plain req/res. Needs ANTHROPIC_API_KEY; without it the section says so. */
const MAX_LINES = 12      // mirrored in src/components/Story.jsx
const MAX_CHARS = 240
const SYSTEM = `You are co-writing a very short story with a visitor to Diego Pérez's portfolio. You take turns: the visitor writes one sentence, then you write exactly one sentence that continues the story.
Rules: reply with a single sentence of at most 30 words and nothing else — no quotes, labels, commentary or questions to the visitor. Match the visitor's language and tone. Be vivid, playful and a little surprising. Keep it suitable for all ages: if the visitor's line is crude, violent or hateful, steer the story somewhere gentle instead of refusing.`

const hits = new Map()   // ponytail: per-instance in-memory rate limit; move to Vercel WAF or KV if it is ever abused
function limited(ip) {
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter(time => now - time < 600_000)
  recent.push(now)
  hits.set(ip, recent)
  return recent.length > 40
}

async function readJson(req) {
  if (req.body !== undefined) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  let raw = ''
  for await (const chunk of req) { raw += chunk; if (raw.length > 8000) throw new Error('body too long') }
  return JSON.parse(raw || '{}')
}
function send(res, status, body) { res.statusCode = status; res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(body)) }

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' })
  if (!process.env.ANTHROPIC_API_KEY) return send(res, 503, { error: 'The co-writer is not connected yet.' })
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || '?'
  if (limited(ip)) return send(res, 429, { error: 'Too many lines at once — give it a minute.' })
  let lines
  try { ({ lines } = await readJson(req)) } catch { return send(res, 400, { error: 'Bad request' }) }
  const valid = Array.isArray(lines) && lines.length > 0 && lines.length < MAX_LINES && lines.length % 2 === 1
    && lines.every((line, index) => line && typeof line.text === 'string' && line.text.trim() && line.text.length <= MAX_CHARS && line.who === (index % 2 ? 'claude' : 'you'))
  if (!valid) return send(res, 400, { error: 'Bad request' })

  const closing = lines.length + 1 >= MAX_LINES
  try {
    const response = await new Anthropic().messages.create({
      model: 'claude-opus-5',
      max_tokens: 300,
      output_config: { effort: 'low' },
      system: SYSTEM + (closing ? '\nThis is the final sentence of the story: bring it to a satisfying close.' : ''),
      messages: lines.map(line => ({ role: line.who === 'claude' ? 'assistant' : 'user', content: line.text })),
    })
    if (response.stop_reason === 'refusal') return send(res, 200, { line: null, note: 'Claude passed on that one — try a different line.' })
    const text = response.content.filter(block => block.type === 'text').map(block => block.text).join(' ').replace(/\s+/g, ' ').trim()
    if (!text) throw new Error('empty reply')
    send(res, 200, { line: text })
  } catch (error) {
    console.error('story:', error?.status, error?.message)
    if (error?.status === 401) return send(res, 503, { error: 'The co-writer is not connected yet.' })   // a bad key is the same as no key
    send(res, error?.status === 429 ? 429 : 502, { error: 'The co-writer is out of ink for a moment. Try again.' })
  }
}
