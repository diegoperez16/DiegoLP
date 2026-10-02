# Graph Report - Portfolio  (2026-10-02)

## Corpus Check
- 45 files · ~967,409 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 26 file(s) not represented in the graph (top: (none) 8, .css 6, .flac 5)

## Summary
- 348 nodes · 619 edges · 18 communities (16 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 8 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `769da074`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- MusicTurntable.jsx
- create_hogwarts.py
- Icon
- react
- App.jsx
- package.json
- HighlandCrossing.jsx
- dots.mjs
- WorldGlobe.jsx
- Story
- create_studio.py
- cdp-click.mjs
- cutout.swift
- Builder
- Diego clay avatar
- geo/README.md
- photos/README.md
- Product

## God Nodes (most connected - your core abstractions)
1. `Icon()` - 20 edges
2. `Builder` - 16 edges
3. `App()` - 16 edges
4. `react` - 15 edges
5. `PlaylistDrawer()` - 12 edges
6. `SongSearch()` - 12 edges
7. `NowPlayingDock()` - 11 edges
8. `Product` - 10 edges
9. `Globe()` - 9 edges
10. `MusicTurntable()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Blender scenes` --references--> `in_bore()`  [INFERRED]
  scripts/blender/README.md → scripts/blender/create_hogwarts.py
- `Blender scenes` --references--> `carve()`  [INFERRED]
  scripts/blender/README.md → scripts/blender/create_hogwarts.py
- `Arrow()` --calls--> `Icon()`  [EXTRACTED]
  src/App.jsx → src/components/Icon.jsx
- `ProjectSheet()` --calls--> `Icon()`  [EXTRACTED]
  src/App.jsx → src/components/Icon.jsx
- `Projects()` --calls--> `Icon()`  [EXTRACTED]
  src/App.jsx → src/components/Icon.jsx

## Import Cycles
- None detected.

## Communities (18 total, 2 thin omitted)

### Community 0 - "MusicTurntable.jsx"
Cohesion: 0.15
Nodes (18): @react-three/drei, CameraFit(), MusicTurntable(), PictureDisc(), ReactiveLight(), Spectrum(), useCoverTexture(), StudioEnvironment() (+10 more)

### Community 1 - "create_hogwarts.py"
Cohesion: 0.08
Nodes (41): bmesh, bpy, math, mathutils, area_light(), camera(), collection(), export_glb() (+33 more)

### Community 2 - "Icon"
Cohesion: 0.17
Nodes (23): FILLED, Icon(), PATHS, formatTime(), MusicIcon(), MusicStart(), NowPlayingDock(), PlaybackError() (+15 more)

### Community 3 - "react"
Cohesion: 0.11
Nodes (28): lenis, react, react-dom, pick(), src_data_backgroundlines, src_data_music, loadApi(), useYouTubePlayer() (+20 more)

### Community 4 - "App.jsx"
Cohesion: 0.09
Nodes (35): AboutSection(), App(), Arrow(), ExperienceBoundary, globeSeen, morph(), MusicTurntable, Points() (+27 more)

### Community 5 - "package.json"
Cohesion: 0.06
Nodes (38): handler(), send(), handler(), hits, limited(), readJson(), send(), dependencies (+30 more)

### Community 6 - "HighlandCrossing.jsx"
Cohesion: 0.25
Nodes (10): HighlandCrossing, CASTLE, Crossing(), FUNNEL, haloTexture(), HighlandCrossing(), MOON, SHOT (+2 more)

### Community 8 - "dots.mjs"
Cohesion: 0.13
Nodes (16): ref_node_fs, coarse, [coarsePath, finePath, outPath, coarseStepArg, fineStepArg, islandStepArg], coarseStep, coast, fine, fineStep, grid() (+8 more)

### Community 9 - "WorldGlobe.jsx"
Cohesion: 0.23
Nodes (15): CENTRE, Coastline(), Earth(), EarthFallback(), ease(), Flag(), Globe(), HOME (+7 more)

### Community 10 - "Story"
Cohesion: 0.67
Nodes (3): Story(), send(), submit()

### Community 11 - "create_studio.py"
Cohesion: 0.09
Nodes (21): Image, json, Path, pathlib, pil, book(), cube(), cylinder() (+13 more)

### Community 14 - "cdp-click.mjs"
Cohesion: 0.22
Nodes (8): c, evaluate(), events, json(), pending, send(), targets, ws

### Community 15 - "cutout.swift"
Cohesion: 0.40
Nodes (4): AppKit, CoreImage, Foundation, Vision

### Community 20 - "Builder"
Cohesion: 0.21
Nodes (3): Builder, Place `count` copies around a circle. factory(index, x, y, z, angle)., Primitive factory bound to one target collection.

### Community 22 - "Diego clay avatar"
Cohesion: 0.50
Nodes (3): Diego clay avatar, Final background prompt, Original generation prompt

### Community 25 - "Product"
Cohesion: 0.18
Nodes (10): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Principles (+2 more)

## Knowledge Gaps
- **75 isolated node(s):** `hits`, `name`, `private`, `version`, `type` (+70 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 136 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `MusicTurntable.jsx`, `Icon`, `App.jsx`, `package.json`, `HighlandCrossing.jsx`, `WorldGlobe.jsx`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Why does `Icon()` connect `Icon` to `MusicTurntable.jsx`, `react`, `App.jsx`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `hits`, `name`, `private` to the rest of the system?**
  _75 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `MusicTurntable.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14624505928853754 - nodes in this community are weakly interconnected._
- **Should `create_hogwarts.py` be split into smaller, more focused modules?**
  _Cohesion score 0.07653061224489796 - nodes in this community are weakly interconnected._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.1051693404634581 - nodes in this community are weakly interconnected._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08710801393728224 - nodes in this community are weakly interconnected._