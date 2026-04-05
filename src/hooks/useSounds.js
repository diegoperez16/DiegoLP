import { useRef, useCallback, useEffect } from 'react'

function getCtx(ref) {
  if (!ref.current) {
    ref.current = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (ref.current.state === 'suspended') ref.current.resume()
  return ref.current
}

export function useSounds() {
  const ctxRef = useRef(null)
  const crackleRef = useRef(null)

  // ── Cardboard slide ─────────────────────────────────────────────
  const playSlide = useCallback(() => {
    const ac = getCtx(ctxRef)
    const dur = 0.16
    const buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.8)
    }
    const src = ac.createBufferSource()
    src.buffer = buf
    const bpf = ac.createBiquadFilter()
    bpf.type = 'bandpass'
    bpf.frequency.value = 850
    bpf.Q.value = 1.5
    const g = ac.createGain()
    g.gain.value = 0.2
    src.connect(bpf).connect(g).connect(ac.destination)
    src.start()
  }, [])

  // ── Needle drop ─────────────────────────────────────────────────
  const playNeedleDrop = useCallback(() => {
    const ac = getCtx(ctxRef)
    const now = ac.currentTime

    // Percussive thud
    const osc = ac.createOscillator()
    const og = ac.createGain()
    osc.frequency.setValueAtTime(150, now)
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.08)
    og.gain.setValueAtTime(0.6, now)
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.14)
    osc.connect(og).connect(ac.destination)
    osc.start(now)
    osc.stop(now + 0.14)

    // Short noise burst layer
    const bufLen = Math.floor(ac.sampleRate * 0.07)
    const nb = ac.createBuffer(1, bufLen, ac.sampleRate)
    const nd = nb.getChannelData(0)
    for (let i = 0; i < bufLen; i++) nd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 2.5)
    const ns = ac.createBufferSource()
    ns.buffer = nb
    const ng = ac.createGain()
    ng.gain.value = 0.35
    ns.connect(ng).connect(ac.destination)
    ns.start(now)
  }, [])

  // ── Vinyl crackle (looping) ─────────────────────────────────────
  const startCrackle = useCallback(() => {
    if (crackleRef.current) return
    const ac = getCtx(ctxRef)
    const sr = ac.sampleRate
    // 2-second noise loop with sparse random pops
    const buf = ac.createBuffer(1, sr * 2, sr)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) {
      d[i] = Math.random() < 0.0018 ? (Math.random() * 2 - 1) * 0.75 : 0
    }
    const src = ac.createBufferSource()
    src.buffer = buf
    src.loop = true
    const hpf = ac.createBiquadFilter()
    hpf.type = 'highpass'
    hpf.frequency.value = 650
    const g = ac.createGain()
    g.gain.value = 0.13
    src.connect(hpf).connect(g).connect(ac.destination)
    src.start()
    crackleRef.current = { src }
  }, [])

  const stopCrackle = useCallback(() => {
    if (!crackleRef.current) return
    try { crackleRef.current.src.stop() } catch {}
    crackleRef.current = null
  }, [])

  useEffect(() => () => { stopCrackle() }, [stopCrackle])

  return { playSlide, playNeedleDrop, startCrackle, stopCrackle }
}
