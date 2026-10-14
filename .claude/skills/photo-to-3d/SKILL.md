---
name: photo-to-3d
description: Turn one ordinary photo of a space (the yard, a site, a room, a marquee) into real measurements and a 3D page: solve the camera from things of known size, mark sizes on the photo, project the photo onto rebuilt geometry so it can be orbited, and drop kit in at real scale. Use when Josh sends a photo of a place and asks what fits, how big it is, or to see it in 3D.
---
One photo → solved camera → measured photo + "Photo 3D" page (the photo projected onto rebuilt geometry), a clean model, and kit placed at real size.

Worked example: the Green Yurts yard bay (14 Oct 2026). Scripts in `.claude/skills/photo-to-3d/scripts/` (repo), set up for that photo; copy and edit for a new one.
- `solve.py`: least-squares camera solve (yaw, pitch, roll, position) plus unknown heights, from pixel points on a structure with a known repeat (racking bays at 2.8 m) and one known height (Doosan G15S guard 2.16 m). Writes `cam.json`.
- `geo.py`: helpers on the solved camera: `floor(u,v)` → floor point, `on_z(u,v,z)` → point on a wall plane, `up_from(u,v,foot)` → height above a floor point, `proj(X)` → pixel.
- `annotate.py`: draws the solved structure and the sizes on the photo (green lines must sit on the real edges: that's the visual check).
- `model.js`: the detailed scene. Every object goes through `tagIt(obj, name, what, size, sure)`, which feeds the tap-to-identify card and the floating labels. `sure` is 'sure' / 'fairly sure' / 'not sure' and the card says so honestly.
- `bake.py`: cuts each flat face (unit fronts, crates, cubicles, khana sides) and the floor out of the photo, squares them up with the solved camera, and pastes them onto the model as textures. Objects that would smear onto the floor are masked out. The biggest realism win for the least work.
- `template.html` + `build.py`: the page. Photo as a projected texture (`uPV` = the solved camera's view-projection), a depth pass from that camera so surfaces it couldn't see go dim, proxy boxes for things standing on the floor, a clean model mode, a kit toggle (inlines `3d-models/scripts/kit.js`), and tap-to-measure.

## Steps
1. Find references in the photo: a repeating structure (pallet racking 2.7 m beams / 2.8 m pitch, Euro pallets 1.2 × 0.8 m, bell tents 5 m, doors ~2.0 m, blocks 440 × 215 mm) and one known height (a vehicle spec, a door, a person ~1.75 m). Look specs up; don't guess.
2. Grid the photo (`photo-measure/scripts/measure.py grid`), zoom strips of the key edges, read pixel points.
3. Assume the iPhone 1× lens (26 mm equiv → focal ≈ 0.75 × image height in px, centre principal point) unless EXIF says otherwise.
4. Solve. Check: RMS fit (aim < 5 px), camera height 1.3–1.7 m for a handheld phone, and at least one **independent** check that wasn't fitted (here: a spare upright landed at −2.78 m vs −2.8, and the forklift width at 1.11 m vs 1.07 spec). If a check fails, a "guessed" observation is wrong: drop it and use a real reference.
5. Back-project the objects, draw the measured photo, build the page, test headless (route jsdelivr to `~/.cache/jos3d`), publish, send the marked-up photo.

## Identify, then build
- Crop the photo into regions at 2× and go through each one before modelling: name every item, rate how sure you are, and ask Josh about the unknowns rather than guessing.
- Detail that reads: proper pallets, perforated uprights with bracing, beam labels, straps, canvas textures (ribs, pine, ply, cardboard with print, lattice with alpha). Very dark objects need lifted textures or they vanish.
- UI: the measure readout and info card sit in a top stack under the title, never at the bottom, where the button bar wraps on phones.

## Upgrading one object from close-up photos
When Josh sends square-on photos of one thing (front, back, both ends), read its proportions off them against something already measured (the khana: slats 2.4 m from the yard solve → cradles 2.1 × 1.35 m, 0.99 m high), rebuild it properly (cradles 11–15, bundles, cord) and skin each side with the rectified photo (`khana_bake.py`). Things seen only in a turning video go in at rough positions, marked as approximate in their cards.

## Rebuilding one machine in detail (the forklift, 14 Oct 2026)
- Gather every view of it across all photos, look up the spec (G15S: 1.07 m wide, guard 2.16 m, 2.16 m to fork face, forks 1.07 m), and model it as named parts (`3d-models/scripts/forklift.js`), each with a plain description for the tap card.
- Check it against the photo: render from the solved camera with `setViewOffset` cropped to the object, blend it over the photo crop, and fit its position and turn (x, z, ry) to 5 or more clear landmarks. Drop any landmark that won't fit (it was read wrong). Forklift: 6 px mean error.
- `scripts/forklift/` has the page: parts list, lift forks, and a match-photo slider.

## Model how the thing works, not just how it looks (the trellis, 14 Oct 2026)
- One photo of a trellis opened out showed what the bundles really are: two layers of slats crossing, a cord knot at every crossing. `3d-models/scripts/trellis.js` builds a section as that mechanism (node (u, v) = s·(sinθ·(u − v), cosθ·(u + v)); front slats constant v, back slats constant u, clipped at the design opening so the edge slats are shorter). Fold it to the angle where neighbouring slats touch and you get the cradle bundle. The 1.27 m width, the knots in diagonal lines and the 2.5 m slats all fall out of the maths, so it matches every photo at once.
- Solve each object's own camera (`trellis/solve_front.py`: PnP on the cradle corner blocks, scale anchored to the floor + stack height, a small sideways shift per cradle). Watch for the mirror solution (camera behind, y flipped): start the rotation at π about x and bound sizes.
- Instance colours: `color.setRGB(r, g, b, THREE.SRGBColorSpace)`. Without it, sRGB-picked browns render washed-out cream.
- Josh's word: **trellis** (not khana) in every label.
- His count wins: a 16 ft yurt is **4 trellis** on one **stillage** (two 13-slat sections side by side on each of two layers). The pine blocks on the top racking are **yurt doors**.

## People from video (test, 14 Oct 2026)
- v2 (sculpted): `3d-models/scripts/sculpt/` (`sdf.py` shapes, `person.py` body + face + hair clumps + clothes, `build_people.py` meshes each surface with marching cubes, Taubin-smooths, bakes colour + AO, gzips into the page; `people.js` `loadPeople` + `buildPerson`). Mesh skin, tee, trousers, hair, beard separately or the hems smear. A full beard needs a solid base layer under the clumps. ~3 min per person.
- `3d-models/scripts/people.js`: stylised people at real height (`CREW` specs: height, build, hair style, beard, clothes, pose). Height from a known object in the same frame (forklift guard 2.16 m). Not face scans, and never names: label them by what they wear.
- Render close-ups before publishing (face, tee hem, feet) next to the video frames: the first pass had the beard over the eyes, thighs through the hem and shoes like sandals on boards.
- Separate pages only: `3d-models/scripts/people/` (each person alone) and `build.py crew` (yard with people, `crew.js`). Josh: **people never go in the main Yard in 3D page.** In the scene, add them after the photo depth pass (`queueMicrotask`) or the photo shows dark holes behind them.

## Page features worth keeping
- **Checks** panel: my numbers next to boxes for his tape readings (green within 5%), plus copy-to-clipboard so he can paste the results back for a re-solve.
- **Capture** (Polycam-style): `capabilities: {assets: {}, db: {}}`. Photos upload as assets; a `captures/<id>` doc holds `{name, photos: [asset ids], status: capturing|ready|done}`. Originals keep their EXIF (lens) unless HEIC or over 19 MB, then they're re-encoded to JPEG. Read with ArtifactData `list captures`, fetch photos with Artifact `read` + `path: <asset id>`.

## Get better every run (Josh's standing ask)
After each build, before replying:
1. Score it and add a row to the scorecard in `docs/learning-log.md`: photo-match error (px), things named / how many "not sure", sizes he's taped vs mine, what he said was wrong.
2. Compare with the last row. If a number got worse, say so and why.
3. Turn the biggest fix into a change in the scripts or this file (not just a note), and tell him in one line what improved.

## Traps
- Hidden contact points (racking feet behind stock) wreck the scale: my first solve said the camera was 1.0 m high and the forklift 1.5 m. Use visible references.
- Floor points far from the camera are touchy: 10 px ≈ 0.4 m at 7 m. Treat object orientation from floor points as rough.
- Projective texturing ghosts onto surfaces the camera couldn't see. Needs a depth pass from the photo camera, and that pass must use `scene.overrideMaterial`, or the shader reads the depth texture it's writing to (a silent feedback loop, nothing hides).
- Sizes are about ±5% from one photo. Say so. A LiDAR scan (3d-scans) or a measured A4/tape reference beats it.

## A whole building from a walk-round (main hall, 14 Oct 2026)
- `scripts/hall/`: read every crate label off the photos first (12/14/16 ft crowns, 14/16 ft canvas, tipi canvas, Oven, Bedouin Extra), then lay out stacks with `crateStack` / `stillageStack` / `postRack`. Every card carries the photo numbers that show it, with thumbnails. Positions are a sketch until a camera solve or tape.

## Section by section, then merge (main hall v2, 14 Oct 2026)
- `scripts/hall/sections/`: split a big space into sections, one sharp photo each (pick by gradient variance; skip blurry ones). Solve that photo's camera from a known object in it (crown crates 1.2 × 1.0 m, 1.24 m a level), with a soft camera-height prior (1.5 m) when the points are all on one plane; free unknown heights as extra parameters.
- Every section page has **photo skin** (the photo projected onto the model, with a depth check so hidden faces stay model-coloured) and **match photo** (camera where the phone was, model-to-photo slider starting at 50/50): Josh's idea, and the fastest way to get real detail.
- `kit.js` holds the shared detail builders (Euro pallets, fabric crate covers with the GY badge and check-sheet pocket, crowns with drilled rings, crown crates that lift their covers). `combine.py` drops each section into the hall shell at its place and rotation, removes each section's own walls (`userData.shell`), and adds the kit between sections (`extras.js`).
- Josh's facts: a 16 ft yurt = 4 trellis + a double door; a 14 ft yurt = 3 trellis per door, 5 doors (with their trellis) per 14 ft stillage; green bags = Emperors, grey/beige = bells, lime tag good / red bad; white crates = safaris; "6×6" = 6 × 6 m marquee; the red/blue racks are **pole stillages**; the timber on top is doors.

## Whole remodel in one plan (main hall v3, 14 Oct 2026)
- `scripts/hall/v3/`: one frame for the whole building (door at z = 0, hall to z = -39, x across), every stack built with the shared builders and turned so its front faces the aisle (`LEFT`, `RIGHT`, `FAR`). Zones drive the fly-to buttons.
- Render properly: `bake()` merges each item's static meshes by material (keep animated covers and film with `userData.keep`), GTAO post pass (HQ toggle, off by default on phones), daylight spot from the door plus warm point lights under the high-bays, soft fog.
- Watch: a racking row runs along its local +x, so on the right wall (ry −90°) it heads toward the door: start it at the far end.

## Traps learned
- Yard page inputs (yard.jpg, bake.json, cam.json) aren't in the public repo: run `scripts/fetch_inputs.py <saved live page>` first (save it with the Artifact tool's read). Then `node scripts/shoot.js yard-3d.html <prefix>` for phone + desktop shots of photo / orbit / model / close (14 Oct).
- Floating labels need real box overlap (measure offsetWidth once, re-measure on fonts.ready) and keep-out zones for the title and button bar; a fixed small overlap box lets long labels stack. In photo mode, drop labels outside the photo camera's frustum or they float in the void (14 Oct).
