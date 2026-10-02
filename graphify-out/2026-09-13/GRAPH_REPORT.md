# Graph Report - Portfolio  (2026-09-13)

## Corpus Check
- 43 files · ~475,724 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 319 nodes · 483 edges · 20 communities (16 shown, 4 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `769da074`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- MusicTurntable.jsx
- create_hogwarts.py
- MusicControls.jsx
- MePage.jsx
- App.jsx
- package.json
- dots.mjs
- WorldGlobe.jsx
- create_studio.py
- Piano
- cdp-click.mjs
- cutout.swift
- export_web.py
- prepare_music.py
- Builder
- Blender scenes
- Diego clay avatar
- geo/README.md
- photos/README.md
- Product

## God Nodes (most connected - your core abstractions)
1. `react` - 18 edges
2. `Builder` - 16 edges
3. `Piano()` - 10 edges
4. `Product` - 10 edges
5. `SongSearch()` - 9 edges
6. `useMusic()` - 9 edges
7. `@react-three/fiber` - 7 edges
8. `three` - 7 edges
9. `resolveYouTubeVideo()` - 7 edges
10. `join_groups()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `pick()` --calls--> `resolveYouTubeVideo()`  [EXTRACTED]
  src/components/music/MusicControls.jsx → src/utils/youtubeSearch.js
- `MusicTurntable()` --calls--> `useMusic()`  [EXTRACTED]
  src/components/music/MusicTurntable.jsx → src/music/MusicProvider.jsx
- `Piano()` --calls--> `useAudioEngine()`  [EXTRACTED]
  src/components/Piano.jsx → src/hooks/useAudioEngine.js
- `MusicStart()` --calls--> `useMusic()`  [EXTRACTED]
  src/components/music/MusicControls.jsx → src/music/MusicProvider.jsx
- `NowPlayingDock()` --calls--> `useMusic()`  [EXTRACTED]
  src/components/music/MusicControls.jsx → src/music/MusicProvider.jsx

## Import Cycles
- None detected.

## Communities (20 total, 4 thin omitted)

### Community 0 - "MusicTurntable.jsx"
Cohesion: 0.07
Nodes (29): @react-three/drei, @react-three/fiber, three, HighlandCrossing, MusicTurntable, CASTLE, Crossing(), FUNNEL (+21 more)

### Community 1 - "create_hogwarts.py"
Cohesion: 0.10
Nodes (32): area_light(), camera(), collection(), export_glb(), join_groups(), material(), Shared modelling helpers for Diego's original Blender scenes. Imported by…, Start from an empty file even when Blender opened a default scene. (+24 more)

### Community 2 - "MusicControls.jsx"
Cohesion: 0.11
Nodes (26): formatTime(), MusicStart(), NowPlayingDock(), PlaylistDrawer(), SongSearch(), findOnYouTube(), pick(), useDeckControlsVisible() (+18 more)

### Community 3 - "MePage.jsx"
Cohesion: 0.22
Nodes (3): BURST_WORDS, MePage(), useBursts()

### Community 4 - "App.jsx"
Cohesion: 0.08
Nodes (28): react, AboutSection(), App(), ExperienceBoundary, globeSeen, IslandGallery, morph(), Projects() (+20 more)

### Community 5 - "package.json"
Cohesion: 0.07
Nodes (30): handler(), hits, limited(), readJson(), send(), dependencies, @anthropic-ai/sdk, gsap (+22 more)

### Community 8 - "dots.mjs"
Cohesion: 0.14
Nodes (15): coarse, [coarsePath, finePath, outPath, coarseStepArg, fineStepArg, islandStepArg], coarseStep, coast, fine, fineStep, grid(), home (+7 more)

### Community 9 - "WorldGlobe.jsx"
Cohesion: 0.18
Nodes (13): WorldGlobe, CENTRE, Coastline(), ease(), Flag(), Globe(), HOME, ISLAND (+5 more)

### Community 11 - "create_studio.py"
Cohesion: 0.23
Nodes (8): book(), cube(), cylinder(), finish(), group(), move_to(), Build Diego's original curiosity-studio objects with Blender 5.2. Run from the…, sphere()

### Community 12 - "Piano"
Cohesion: 0.17
Nodes (8): Piano, CHORDS, createVoice(), KEYS, Piano(), isTyping(), keydown(), useAudioEngine()

### Community 14 - "cdp-click.mjs"
Cohesion: 0.27
Nodes (8): c, evaluate(), events, json(), pending, send(), targets, ws

### Community 15 - "cutout.swift"
Cohesion: 0.40
Nodes (4): AppKit, CoreImage, Foundation, Vision

### Community 20 - "Builder"
Cohesion: 0.21
Nodes (3): Builder, Place `count` copies around a circle. factory(index, x, y, z, angle)., Primitive factory bound to one target collection.

### Community 21 - "Blender scenes"
Cohesion: 0.50
Nodes (3): Blender scenes, Building, How the web runtime drives the models

### Community 22 - "Diego clay avatar"
Cohesion: 0.50
Nodes (3): Diego clay avatar, Final background prompt, Original generation prompt

### Community 25 - "Product"
Cohesion: 0.18
Nodes (10): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Principles (+2 more)

## Knowledge Gaps
- **75 isolated node(s):** `hits`, `name`, `private`, `version`, `type` (+70 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 147 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App.jsx` to `MusicTurntable.jsx`, `MusicControls.jsx`, `MePage.jsx`, `package.json`, `WorldGlobe.jsx`, `Piano`?**
  _High betweenness centrality (0.163) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Piano()` (e.g. with `keydown()` and `keyup()`) actually correct?**
  _`Piano()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `hits`, `name`, `private` to the rest of the system?**
  _75 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `MusicTurntable.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07195121951219512 - nodes in this community are weakly interconnected._
- **Should `create_hogwarts.py` be split into smaller, more focused modules?**
  _Cohesion score 0.09672830725462304 - nodes in this community are weakly interconnected._
- **Should `MusicControls.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10634920634920635 - nodes in this community are weakly interconnected._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07560975609756097 - nodes in this community are weakly interconnected._