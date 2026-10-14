---
name: 3d-models
description: Build real-size 3D models of Green Yurts kit (bell tents, emperors, yurts) or anything made of simple shapes, and export GLB for the web and USDZ for iPhone AR. Use when Josh wants a 3D model, a file to view in AR, or kit for the Grid, Eye or a site plan.
---
Real-size kit models built in code, exported as **GLB** (web, Grid, Eye, Blender) and **USDZ** (iPhone AR Quick Look).

Scripts: `.claude/skills/3d-models/scripts/` in the off-season-reset repo.
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
