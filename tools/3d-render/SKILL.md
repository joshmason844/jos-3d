---
name: 3d-render
description: Render studio stills and turntable videos (MP4 and GIF) of any 3D model or kit with no GPU, in J·OS night, daylight field or studio looks. Use when Josh wants a picture or video of a 3D model for a post, mix cover, the Grid or a pitch.
---
Stills and turntables of any GLB or kit model, rendered headless.

Script: `.claude/skills/3d-render/scripts/render.mjs` (uses `../../3d-models/scripts/harness.mjs`, Three.js r180, ffmpeg).
```
node render.mjs <file.glb|kit:bell5> <out-prefix> [--look jos|day|studio] [--size 1600x1000] [--angles 35,140,250] [--elev 18] [--turntable 72] [--fps 24]
```
- Stills → `<out>-<angle>.png`. `--turntable N` → `<out>.mp4` (H.264, yuv420p, faststart, so it plays on iPhone and Instagram) and a 480 px `<out>.gif`.
- Looks: **jos** (night void, blue rim light, lamp-lit canvas glow through the door), **day** (sunny field, sky fog), **studio** (light grey sweep for product shots).
- Sizes: 1080x1350 Instagram portrait, 1080x1080 square, 1920x1080 video, 3000x3000 mix cover.

## Steps
1. Get a model: `3d-models` export, a scan GLB, or `kit:<key>`.
2. Render one still first and look at it. Fix framing (`--elev`, `--angles`) before a turntable.
3. Turntable: 48 frames at 960x600 took ~40 s here. 72–96 frames for a smooth 3–4 s loop.
4. Send with SendUserFile (the mp4, plus the best still).

## Defaults that worked
ACES Filmic, sRGB output, RoomEnvironment PMREM (environmentIntensity 0.35 night / 0.9 day), one 2048 shadow-mapped key light + rim light, PCFSoft shadows, 32° lens, camera distance fitted to the model's footprint.

## Traps
- Software WebGL is slow: keep turntables ≤ 1080p and ≤ 96 frames, or render stills only.
- Emissive "lamp glow" washes canvas out over ~0.15. Keep canvas at 0.12 and the door at 0.5.
- Big scans: shrink them first (3d-scans `--max-splats`). Splat turntables need the scan page instead (Spark sorts per view).
