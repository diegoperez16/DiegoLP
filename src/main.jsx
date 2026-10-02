import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { MusicProvider } from './music/MusicProvider'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

// Momentum scrolling (Lenis). Anchors land under the fixed header; dialogs and the music drawer keep native scroll.
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) new Lenis({ autoRaf: true, anchors: { offset: -72 }, prevent: node => Boolean(node?.closest?.('dialog')) })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MusicProvider><App /></MusicProvider>
  </StrictMode>,
)
