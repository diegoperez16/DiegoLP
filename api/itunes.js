/* The iTunes Search API answers phone browsers with a redirect to a host that sends no CORS headers, so
   the drawer can't call it from a phone. This proxies the two calls it makes (search, album lookup) from
   our own origin, following the redirect server-side. Runs as a Vercel function; vite.config.js mounts it
   in dev. No key, no quota — which is why Apple stays the first stop before any YouTube search. */
function send(res, status, body) { res.statusCode = status; res.setHeader('content-type', 'application/json; charset=utf-8'); res.end(JSON.stringify(body)) }

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://local')
  const term = (url.searchParams.get('term') || '').trim()
  const lookup = url.searchParams.get('lookup') || ''
  let upstream
  if (/^\d{1,12}$/.test(lookup)) upstream = `https://itunes.apple.com/lookup?id=${lookup}&entity=song`
  else if (term && term.length <= 120) upstream = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=25`
  else return send(res, 400, { error: 'term or lookup required' })
  try {
    const answer = await fetch(upstream, { redirect: 'follow', headers: { accept: 'application/json', 'user-agent': 'Mozilla/5.0 (Macintosh) diegoperezgandarillas.com jukebox' } })
    const body = (await answer.text()).trim()   // Apple pads the JSON with blank lines
    if (!answer.ok || !body.startsWith('{')) return send(res, 502, { error: `iTunes answered ${answer.status}` })
    res.statusCode = 200
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.setHeader('cache-control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    res.end(body)
  } catch { send(res, 502, { error: 'iTunes unreachable' }) }
}
