# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Recruiters, hiring managers, and engineers evaluating Diego Pérez for full-time software engineering roles (he graduates in May 2027), usually arriving from a LinkedIn profile, a résumé link, or the QR code printed on his résumé, which means on a phone, with a few minutes to spare. Secondary: professors, collaborators, and friends who want the person behind the résumé.

## Product Purpose

A one-page personal portfolio (plus an off-the-clock `/me.html` page) that shows Diego's work, research, teaching, and experience — and lets a visitor linger with a record player and a story they write with Claude, one sentence at a time. Success is a visitor who understands what Diego has done in under a minute, believes it, and comes away with a sense of who he is.

## Positioning

Real Blender-modeled 3D scenes (night train, turntable, globe) woven into an editorial page — not a template with a hero image. Everything on it was built by Diego; nothing is stock.

## Operating Context

Vite + React 18 SPA with react-three-fiber / drei / three and Lenis. Single page with hash sections (`#opening`, `#start`, `#about`, `#projects`, `#experience`, `#research`, `#programs`, `#skills`, `#story`, `#contact`); `/me.html` is a second Vite entry. Blender 5.2 models in `public/models`, driven from React by node name; Blender scripts in `scripts/blender`. Music is self-hosted FLAC in `public/music` with an optional YouTube path for visitor picks. Deployed as static files.

## Capabilities and Constraints

- Content lives in `src/data/callingCard.js` (profile, projects and their screenshots, course projects, experience, research, programs, skills). It follows his Fall 2026 résumé first, then the 2023–2025 ones for everything the one-page version dropped; the page has no length limit, so nothing true is cut for space. Project screenshots live in `public/images/projects/<id>/` as `NN.webp` with `NN-thumb.webp` beside each, made by `scripts/photos/export_project_shots.py`. Photos live in `public/images/xp/<set>/`, listed in `src/data/photos.json`, both written by `scripts/photos/export_experience.py` from `~/Pictures/Portfolio`.
- Every 3D scene has a static fallback and an error boundary; the page must read fully without WebGL.
- Must work on phones, and a touch must never trap the page: every drag surface (globe, photo board on `/me.html`, photo strips) lets a vertical swipe scroll. Re-test with synthesized touch after touching any of them.
- Two 3D canvases are visible near the top on load (train, turntable); keep the rest lazy and in-view only.
- No mascot / clay character. No "dp" monogram. No hash-route sub-worlds for the listening room.

## Brand Commitments

- Name: *Diego Pérez* serif wordmark. Palette (since 2026-10-02, at Diego's request: "close to Harry Potter", but blues and greens): paper, midnight blue, emerald, and a mint accent (`--accent: #86e2b4`, Diego's pick: "I love mint"); tokens at the top of `src/Portfolio.css`, and the same value in `src/pages/MePage.css`. No yellow or gold anywhere — he asked for it gone, on the record player too, which wears emerald, white, brushed silver and navy with white and green lights that do not follow the accent. The wine of the earlier version is retired. DM Serif Display for display; the system sans for text (SF on Apple devices, DM Sans elsewhere); Space Mono only in the music player's timings.
- Voice: Diego's own words, short and concrete. No AI filler, no taglines, no sentence that repeats one already on the page, no invented claims — especially about ROCS research (see `src/data/callingCard.js` comments).
- Reference feel: susanarojas.com (editorial), reactbits.dev (playful components), joshwcomeau.com (crafted whimsy).

## Evidence on Hand

- Projects: PopcornPal (live at popcornpal.net), Draw Your Wand, theTransporter, SDShift — descriptions and 17 extra screenshots in `callingCard.js`. Every claim was checked against the project's source; theTransporter's `/` filter is not claimed because it does not accept typing yet.
- Experience: L3Harris (2025 intern; 2026 intern in Image Science, part-time since), CodePath Tech Fellow (Tech Exchange and CIIC3015), Evertec, MCS Healthcare (three sub-projects). Research and leadership: ROCS (he wants it here, not under Experience), PandaHat research, Team MADE counselor, Advanced Programming lab mentor. Programs: Google Tech Exchange, Great Minds in STEM 2025 and 2026. Education: coursework and the two CIIC 4010 course projects (Spooky Quest, Fractals).
- Research: ROCS full-stack (OAuth redesign, Docker and AWS deployment, bug management, PRISM/IAP presentations, interviewing). The name is spelled out because his own title slide, in a photo he chose, shows it; findings are still never described.
- Assets: `public/models/*.glb`, `public/images` (headshot bubble, PR flag, UPRM seal, 48 experience photos in `xp/`, project screenshots in `projects/`), `public/music/*.flac`, `public/resume.pdf` (his résumé without the phone number).
- Absent: testimonials, metrics beyond those stated in experience entries, photos of the CodePath roles, photos for an island gallery (the placeholder gallery was removed).

## Product Principles

1. Show, don't claim — the 3D work *is* the proof of craft.
2. Every sentence earns its place; cut before adding.
3. Playfulness is a layer on top of a clear, scannable résumé, never a substitute for it.
4. Mobile is a first-class visitor, not a fallback.
5. Nothing on the page is fabricated.
