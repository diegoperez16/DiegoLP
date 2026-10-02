// Drive headless Chrome over CDP: load the section, find the bubble, inspect what's on top, click it for real.
const port = 9333
const sleep = ms => new Promise(r => setTimeout(r, ms))
async function json(path) { return (await fetch(`http://127.0.0.1:${port}${path}`)).json() }
let targets = []
for (let i = 0; i < 40 && !targets.length; i++) { try { targets = (await json('/json/list')).filter(t => t.type === 'page') } catch { await sleep(500) } }
const ws = new WebSocket(targets[0].webSocketDebuggerUrl)
await new Promise(r => ws.onopen = r)
let id = 0; const pending = new Map(); const events = []
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id) } else if (d.method) events.push(d) }
const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
const evaluate = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); return r.result?.result?.value ?? r.result?.exceptionDetails?.text }
await send('Runtime.enable'); await send('Page.enable'); await send('Target.setDiscoverTargets', { discover: true })
await send('Page.navigate', { url: 'http://localhost:5174/#about' })
await sleep(4000)
await evaluate(`document.querySelector('#about')?.scrollIntoView({ block: 'start' }); 'scrolled'`)
console.log('waiting for the intro…'); await sleep(9000)
console.log(await evaluate(`(() => { const b = document.querySelector('.globe-bubble'); if (!b) return 'NO BUBBLE'; const r = b.getBoundingClientRect(); const cs = getComputedStyle(b); const cx = r.left + r.width/2, cy = r.top + r.height/2; const stack = document.elementsFromPoint(cx, cy).slice(0, 6).map(e => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ').join('.') : '')); return JSON.stringify({ rect: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }, opacity: cs.opacity, pointerEvents: cs.pointerEvents, transform: cs.transform.slice(0, 40), stackAtCentre: stack, wrapperPointerEvents: getComputedStyle(b.parentElement).pointerEvents, wrapperOf: b.parentElement.tagName + '.' + b.parentElement.className }, null, 1) })()`))
// instrument, then click for real
await evaluate(`window.__log = []; window.open = (u) => { window.__log.push('window.open ' + u); return null }; document.addEventListener('click', e => window.__log.push('click on ' + e.target.tagName + '.' + e.target.className), true); document.addEventListener('pointerdown', e => window.__log.push('pointerdown on ' + e.target.tagName + '.' + e.target.className), true); document.addEventListener('pointerup', e => window.__log.push('pointerup on ' + e.target.tagName + '.' + e.target.className), true); 'instrumented'`)
const c = JSON.parse(await evaluate(`(() => { const r = document.querySelector('.globe-bubble').getBoundingClientRect(); return JSON.stringify({ x: r.left + r.width/2, y: r.top + r.height/2 }) })()`))
for (const attempt of [1, 2]) {
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: c.x, y: c.y }); await sleep(150)
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: c.x, y: c.y, button: 'left', clickCount: 1 }); await sleep(80)
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: c.x, y: c.y, button: 'left', clickCount: 1 }); await sleep(600)
  console.log(`after click ${attempt}:`, await evaluate(`JSON.stringify(window.__log)`))
  await evaluate(`window.__log = []`)
  const c2 = JSON.parse(await evaluate(`(() => { const r = document.querySelector('.globe-bubble').getBoundingClientRect(); return JSON.stringify({ x: r.left + r.width/2, y: r.top + r.height/2 }) })()`))
  console.log('bubble moved by', Math.round(c2.x - c.x), Math.round(c2.y - c.y)); c.x = c2.x; c.y = c2.y
}
console.log('new targets opened:', events.filter(e => e.method === 'Target.targetCreated' && e.params.targetInfo.type === 'page').map(e => e.params.targetInfo.url))
ws.close(); process.exit(0)
