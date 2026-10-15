---
name: multi-photo-3d
description: Build a measured 3D point cloud from a set of ordinary photos (Polycam-style photogrammetry, no GPU): matches features, works out where every photo was taken, triangulates, bundle-adjusts, densifies, levels the floor and scales from an A4 sheet. Use when Josh sends several photos of the same thing, or says "process my capture" from the Yard in 3D page.
---
Photos → camera positions → sparse + dense coloured point cloud in metres → a spin-and-measure page.

Scripts: `.claude/skills/multi-photo-3d/scripts/` in this repo (OpenCV 5 + SciPy, both already here).
```
python3 sfm.py <photo dir> <out dir> --dense --a4 [--f35 26] [--max-side 1600]
python3 ../../3d-scans/scripts/make_viewer.py <out>/dense.ply page.html --title "…" --sub "N photos"
```
Writes `cameras.json` (every photo's position, in metres), `sparse.ply`, `dense.ply` (xyz + colour, levelled: floor at y = 0, up = +y), `dense.splat`, `report.json`. Set `SFM_RESUME=1` to reuse the sparse result while tweaking the dense step.

## Pipeline (what each stage does)
1. Lens from EXIF `FocalLengthIn35mmFilm` (iPhone main camera = 26 mm) → focal in px = f35 × image diagonal / 43.27. Refined in bundle adjustment.
2. SIFT (7000 per photo, CLAHE first) → FLANN matching with each photo's next 12 (they're taken in order) → essential-matrix RANSAC.
3. Tracks by union-find; first pair = most matches with real parallax (homography inlier ratio < 0.8).
4. Add photos one at a time with PnP RANSAC, triangulate new tracks from the widest-baseline pair (≥ 2° angle, ≤ 3 px error), sparse bundle adjustment (SciPy `least_squares`, Huber, shared focal) every 3 photos.
5. Dense: neighbouring pairs (i, i+1 and i, i+2) rectified → SGBM → back into the world, then thinned to a voxel grid (≤ 300k points).
6. Level: RANSAC floor plane facing the cameras' up direction, with almost nothing below it.
7. Scale: small bright quads in every photo; the one whose centre triangulates consistently across views is the A4. Its corners go onto the local plane and the long side becomes 0.297 m.

## Proven on a test set (14 Oct 2026)
24 rendered photos of the yard model along a 9 m walk, true cameras known (`shoot_test_set.js` + `shoot_hook.js`, `evaluate.py`):
- all 24 placed, 9k sparse / 300k dense points, reprojection 0.4 px, ~4.5 min
- camera positions within **3.8 cm** RMS (0.4%). A4 scale within **0.7%**. Beam spacing 1.60 m vs 1.62 m true
- known bias: floor placed ~7 cm high (heights read low by a constant). Distances between things are the reliable number.

## How Josh should shoot (tell him)
30–40 photos walking slowly round or along the thing, a step (~10°) between shots, about 60% overlap, same height, no zooming, no portrait mode. Put an A4 sheet flat on the floor so it's in at least 3 shots. Matte, textured stuff works. Plain concrete, glass and shiny steel won't fill in.

## Capture page hookup
The Yard in 3D page (https://claude.ai/artifact/CvKCoKtAY8vRyvdWMbXVyW) saves photo sets: `ArtifactData list captures` → docs `{name, photos: [asset ids], status}`. For a `ready` one: `Artifact read` with `url` + `paths: [ids]` to fetch the photos into one folder, run `sfm.py`, build the page with `make_viewer.py`, publish it, then `ArtifactData update` the capture with `{status: 'done', result: '<artifact url>'}`. The capture list then shows "open 3D →".

## Real-world test: Josh's yard video (14 Oct 2026)
The upload came through at 480×360, 21 s, mostly turning on the spot. 3 fps: 34/63 frames placed. 6 fps upscaled: worse (the chain breaks at every turn). Just the walking stretch: 40/68 placed, but noisy and not reliably levelled. Lesson: a shrunk, panning video isn't enough. Ask for photos (or the original-size video, shared as a file), and walk sideways rather than turn. The starting pair is now picked by actually triangulating the top 25 candidates (the old parallax score picked a pair that gave 0 points).

## The page (multi-photo test)
`scripts/page/build.py [dense.ply] [out.html]` (default work/yard-test/) builds it: cleans strays, embeds the cloud, stamps the code link. `extract_ply.py` pulls the cloud out of a published page; `shoot.js <page> <prefix>` takes phone + desktop, home + close shots (~25 s).

## Traps
- Show reconstructions as **points** (`make_viewer.py` picks this for plain xyz/rgb PLY). Plain points have no size as splats, and headless Chromium can't render Spark reliably, so splat output can't be checked here.
- Matching every photo against every other is slow (276 pairs ≈ 4.5 min of brute force). FLANN plus a window of 12 is much faster.
- Pure rotation (standing still and turning) gives no depth. You have to walk.
- Re-encoding HEIC in the browser drops EXIF, so the focal falls back to 26 mm and gets refined in bundle adjustment.

## Traps learned
- 14 Oct: eye-dome lighting makes a point cloud read as surfaces. Keep it gentle: ignore depth steps under ~0.07 (log2) or every disc gets a dark outline (bubble wrap), floor the shade at ~0.45, and cap disc size (10 px) so close-ups don't balloon. A full-screen pass needs depthTest on with AlwaysDepth to write gl_FragDepth, or the grid shows through.
- 14 Oct: floaters are clumps, not lone points, so a k-NN distance test misses them. Connected components on a radius graph (2.5× median spacing, SciPy `query_pairs` + `connected_components`) and dropping pieces under 1.5% of the cloud clears them in ~2 s for 290k points. Anything touching a real surface (the orange plume) survives, so it needs a separate check. Shortcut: if work/ is empty, `Artifact read` the page and `extract_ply.py` the cloud back out; build + shoot is then under 30 s.
- 15 Oct: check the shader caps before blaming the data. Holes up close were a 10 px point-size cap; the cloud was dense enough. Bigger hard discs just swap holes for coins: blend them (depth pass with dome-shaped discs, then additive colour × gaussian weight into a HalfFloat target, divide by weight in the screen pass). Keep the eye-dome outline light (floor 0.6) or every splat edge gets a dark halo. Size per point from the 4th neighbour, not the mean of 8, or edge points balloon.
- 15 Oct: dark bays are a tone problem, not a data problem. A local shadow lift at build time (point vs its ~35 cm neighbourhood mean, gain (0.42/local)^0.65 capped 3.5×, detail ×1.35, soft shoulder) beats a global gamma: bright canvas stays put, bays open up. Ease the shader's own lift when you add it or uprights blow out. Rebuilding from the published page: pass `--no-denoise` (already medianed) and `--prior-strays` = the live page's count.
- 15 Oct: coin-shaped splats with dark rims came from a blend window of 1 disc-radius: depth noise in the cloud is bigger than that, so the front disc won its whole footprint. A window of 4 radii (`BLEND`) fixes it; check by switching EDL off first (it wasn't EDL). Fading low-weight pixels to the background draws dark crescents, don't. Rebuilding from the published page now needs `--no-tone` as well (the live cloud already has the lift). Speed-up: `work/one.js`-style single desk close-up crop (~15 s) for trying shader values via sed on the built HTML before touching source.
