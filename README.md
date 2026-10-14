# jos-3d

Josh's 3D imaging toolkit for Green Yurts kit and spaces. It turns phone photos, videos and scans into measured 3D pages, and builds the kit itself (yurts, bell tents, trellis, crates, stillages, the forklift) at real size. Everything runs without a GPU: Python for the maths, Three.js in the browser for the models, and headless Chromium for testing and rendering.

**Public repo** (Josh's choice, 14 Oct 2026). No keys, tokens, crew names or photos of people go in here.

## What's in it

| Skill                           | What it does                                                                                                                                                                                                                                                      |
|---------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `.claude/skills/photo-measure`  | Real sizes from one photo using a bank card or A4 sheet in shot. Sends back the photo marked up, with a ± from a Monte Carlo spread.                                                                                                                              |
| `.claude/skills/photo-to-3d`    | One photo of a space → solved camera → measured photo plus a 3D page (photo projected onto rebuilt geometry). Also holds the yard, forklift, trellis and the **main hall** builds (sections fitted to photos, photo skin + 50/50 match, and the v3 full remodel). |
| `.claude/skills/multi-photo-3d` | Polycam-style photogrammetry from a set of photos: SIFT matching, camera poses, triangulation, bundle adjustment, dense points, levelled floor, A4 scale.                                                                                                         |
| `.claude/skills/3d-scans`       | Turns iPhone scans (Scaniverse or Polycam splats and meshes, any GLB or PLY) into a page you can spin, flip and measure.                                                                                                                                          |
| `.claude/skills/3d-models`      | The kit library: bell tents, emperor, 16 and 24 ft yurts, the Doosan G15S forklift, trellis as a real folding mechanism, people (sculpted SDF meshes, labelled by clothes). Exports GLB and USDZ for iPhone AR. `scripts/harness.mjs` is the headless test bench. |
| `.claude/skills/3d-render`      | Studio stills and turntables (MP4 and GIF) in J·OS night, daylight field or studio looks.                                                                                                                                                                         |

It's a Claude Code project: open the folder in Claude Code and use `/hall`, `/measure`, `/photo-3d`, `/scan`, `/render` or `/people` (see `CLAUDE.md`). Each skill has a `SKILL.md` that explains when to use it, the steps, and the traps learned so far. `docs/scorecard.md` logs every build (photo-match error, items named, what was wrong) so each run gets better.

## Setup

```bash
./setup.sh          # Three.js r180 + Spark into ~/.cache/jos3d, Python libs (Windows: run in Git Bash)
npm i               # Playwright for headless tests
```

Pages load Three.js from jsdelivr. Tests route those requests to the local cache, so they work offline.

## Pages and their code

Every 3D page has a "code ↗" tab that opens its source folder here; builds add it automatically via `bin/link_code.py`. The full map is in `docs/pages.md`.

## Kit facts baked in (from Josh)

- A 16 ft yurt is 4 trellis sections on one stillage, plus a door set.
- A 14 ft yurt is 3 trellis sections per door.
- The red and blue racks are **pole stillages**.
- The timber blocks on top of the racking are yurt doors.
- The white crates hold safari tents.
- The mezzanine and workshop are on the left as you walk in, about 8 × 4 m.
