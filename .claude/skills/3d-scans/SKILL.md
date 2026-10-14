---
name: 3d-scans
description: Turn Josh's iPhone 3D scans (Scaniverse or Polycam Gaussian splats or meshes) or any GLB into a J·OS-style page he can spin, flip and measure in metres, published as one artifact. Use when he sends a scan, a .spz/.ply/.glb file, or asks how to scan something.
---
Scans and models → one self-contained viewer page (model embedded) with spin, flip, reset and tap-two-points measuring.

Scripts: `.claude/skills/3d-scans/scripts/`
- `make_viewer.py <in.glb|.ply|.spz|.splat> <out.html> [--title] [--sub] [--flip|--no-flip] [--max-splats N]`
- `viewer.html`: the template (Three.js 0.180 + Spark 2.3.1 from jsdelivr, J·OS look, phone first).
- `fake_splat.py out.ply`: a synthetic bell-tent splat for testing without a real scan.

## How Josh should scan (iPhone 14 Pro Max has LiDAR)
- **Scaniverse** (free, on-device, unlimited splats): Splat mode for things that need to look real (a pitched tent, a site corner); Mesh mode for things to measure or use in 3D. Export **SPZ** for splats (small) or **GLB/OBJ** for meshes. Share the file into the chat.
- **Polycam** free tier exports GLTF/GLB only (more formats need Pro).
- Walk slowly round the object 2–3 times at different heights, even light, no harsh sun. LiDAR range is a few metres; outdoors and glass fall back to photogrammetry.
- Whole fields or buildings are too big for a phone. Use ground-intel (LiDAR DTM) or a drone.

## Steps
1. Run `make_viewer.py`. Splats default to flipped (capture apps write them upside-down for three.js); check the page and use `--no-flip` if needed.
2. Keep the page under ~16 MB: models over ~11 MB need `--max-splats` (standard 3DGS .ply only; keeps the most opaque splats) or an SPZ export.
3. Test headless (route jsdelivr to `~/.cache/jos3d`, as in the harness) and screenshot. Then publish with the Artifact tool and say what it shows.
4. Measuring is metric for LiDAR scans. Photogrammetry-only scans can be unscaled; check one known length first.

## Traps
- Spark needs Three.js ≥ 0.180, so pin `three@0.180.0` next to `@sparkjsdev/spark@2.3.1`.
- `SplatMesh({ fileBytes, fileName })` loads embedded bytes; `.splat`/`.ksplat` need the fileName for type detection.
- Splat scans include the floor and background: thin and crop before publishing if it's huge.
- Image-to-3D AI (Meshy, Tripo, TRELLIS 2, Hunyuan3D) can make a GLB from one photo. Those sites are the route (Hugging Face is blocked here); bring the GLB back and this viewer shows it.
