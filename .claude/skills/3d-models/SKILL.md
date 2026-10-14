---
name: 3d-models
description: Build real-size 3D models of Green Yurts kit (bell tents, emperors, yurts) or anything made of simple shapes, and export GLB for the web and USDZ for iPhone AR. Use when Josh wants a 3D model, a file to view in AR, or kit for the Grid, Eye or a site plan.
---
Real-size kit models built in code, exported as **GLB** (web, Grid, Eye, Blender) and **USDZ** (iPhone AR Quick Look).

Scripts: `.claude/skills/3d-models/scripts/` in this repo.
- `kit.js`: the models (metres, Y up, door facing +Z). `KIT` has `bell5`, `bell4`, `emperor`, `yurt16`, `yurt24`. One shape engine (`tent()`) makes single-pole and twin-pole tents from a ground outline, wall height and peak; `yurt()` does lattice wall + crown.
- `export.mjs`: `node export.mjs <key|all|a,b> <outdir>` writes `<key>.glb` and `<key>.usdz`, prints size and triangles, and reloads each GLB to prove it opens.
- `harness.mjs`: headless Chromium (software WebGL) with an import map for `three`, `three/addons/`, `@sparkjsdev/spark`, `kit/`, `work/`. Shared by 3d-render and 3d-scans.

## Steps
1. Add or tweak a builder in `kit.js` (keep real sizes: bell 5 m = r 2.5, wall 0.6, peak 3.0; emperor = r 2.0 + ridge 2.0; yurt 16 ft = 4.88 m).
2. `node export.mjs <key> out/`. Check the printed size matches the real kit.
3. Show it: `3d-render` for stills/video, `3d-scans/make_viewer.py out/<key>.glb page.html` for a spin-and-measure page, or SendUserFile the `.usdz`. On the iPhone, tapping a .usdz in Files or Messages opens AR Quick Look, so he can stand the tent in the room at full size.

## Defaults that worked (Oct 2026)
- Three.js **r180** (Spark needs ≥ 0.180). ~11k triangles per tent, GLB ~260 KB, USDZ ~750 KB.
- Canvas `MeshStandardMaterial` roughness 0.92, DoubleSide; door as its own mesh 12 mm proud of the canvas (USDZ ignores vertex colours, so use separate meshes for colour patches).
- `USDZExporter.parseAsync(obj, { quickLookCompatible: true })`, `GLTFExporter.parseAsync(obj, { binary: true })`.

## Traps
- npm, the CDNs, Hugging Face and blender.org are blocked from the workspace. `harness.mjs` fetches Three.js and Spark with sparse `git clone` from GitHub into `~/.cache/jos3d` (that works). Playwright is global: load it with `createRequire`, not `import`.
- Footprint sizes include guy ropes (+1.15 m each side). Quote canvas size and footprint separately.
- Thin lines don't survive USDZ. Make ropes and poles as thin cylinders.
- A web page can't hand a .usdz to AR Quick Look from an artifact (needs `rel="ar"` and a `model/vnd.usdz+zip` server). Send the file instead.

## Ideas it unlocks
Site layouts in the Eye with real tents, a kit chip on the Grid that spins, AR "will it fit in the garden" checks, Basecamp Obelisk mock-ups.

## People: fast iteration loop (14 Oct 2026)
One command does rebuild → page → close-ups → before/after sheet against the last run:
`.claude/skills/3d-models/scripts/people/iterate.sh <tag> [--only head,hair,beard] [--fast] [--shots face,hand] [grey|kdk]`
- Full build of both people: ~40 s (was ~9 min). Both build in parallel; `--only` rebuilds just those meshes (ids: body, head, hand, tee, trousers, shoe, sole, hair, beard) and reuses the rest (~25 s); `--fast` is a coarse preview (~18 s) for trying ideas, never for shipping.
- Shots land in `work/shots/<tag>-*.png`; the sheet is `work/shots/<last>-vs-<tag>.png` (before on top).
- Why it's fast: `Field.eval_groups` sorts points by x once and binary-searches each part's box (the old full scan of ~3,000 parts was half the time); `eval_grid` evaluates a 3x coarser grid first and only re-evaluates points near the surface (identical mesh, checked).

## Traps learned
- People: hair reads as lumps when locks are fat and the smooth-union k is big; thin locks + k ≤ 4 mm + a mesh step under the lock radius fixes it. A NaN in any colour mask turns the whole skin black: clip before sqrt.
- Speed: profile before optimising (python3 -m cProfile). The slow bit was culling, not the maths.
