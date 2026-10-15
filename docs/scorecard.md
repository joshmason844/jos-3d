# 3D scorecard

One row per build, so each run gets measurably better.

| Date   | Build                         | Photo match      | Named / not sure | Taped checks | Fix carried forward                                   |
|--------|-------------------------------|------------------|------------------|--------------|-------------------------------------------------------|
| 14 Oct | Yard bay, one photo           | racking fit 4 px | 21 / 3           | none yet     | identify crops before modelling                       |
| 14 Oct | Khana cradles 11–15, 4 photos | skins aligned    | 29 / 3           | none yet     | rebuild single objects from square-on photos          |
| 14 Oct | Forklift G15S                 | 6 px (5 points)  | 9 parts          | n/a          | overlay + landmark fit check; drop misread landmarks  |
| 14 Oct | Trellis stack, slat by slat   | 7.3 px (20 pts)  | 5 cradles, 600 slats, 2,900 knots | none yet | build the mechanism (folding lattice), sRGB colours |
| 14 Oct | Trellis: 4 per 16 ft yurt     | 7.3 px (unchanged) | 5 stillages, 20 sections | Josh: halves | his count beats my guess: 2 × 13-slat sections side by side per layer |
| 14 Oct | Two people from video (test)  | heights vs guard: 1.88 ±0.08 m, 1.80 assumed | 2 people, 5 parts each | none | close-up render check (face, hem, feet) before publishing; add non-photo things after the depth pass |
| 14 Oct | People v2: sculpted meshes   | close-ups vs video frames | 2 people, 7 parts each | none | SDF sculpt + marching cubes beats stacked primitives: one skin, carved face, grown hair, mesh each surface separately |
| 14 Oct | Main hall, 39 photos + video  | none (no camera solve yet) | 40 items / 2 not sure | none | read every label off the photos first; evidence photos on every card |
| 14 Oct | Hall in 5 photo-fitted sections | 3.3 / 3.7 / 4.8 / 5.4 / 7.0 px | 60 photos, ~45 items | none | one camera per section from crate corners (1.2 × 1.0 × 1.24 m) + height prior; photo skin + 50/50 match slider; merge by placing each section frame in the hall |
| 14 Oct | Hall v3: full remodel, one plan | no photo overlay (by request) | ~55 items, 1 not sure | none | single coordinate frame, fronts face the aisle; merge static meshes per item (3,404 → 282 draw calls); GTAO + door spill + LED lights |

## 2026-10-14 · People: faces + hands pass
- Hands: fingers no longer fused (wider spacing, thinner), knuckles, joints, fingertip pads, painted nails; fingers curl towards the palm (was backwards); thumb rebuilt as 3 bones lying along the index; relaxed hand turned palm-in so the thumb points forward.
- Faces: ears rebuilt (thin plate, rim, bowl, lobe, tragus) instead of a cup; lips with cupid's bow, philtrum, tucked corners; fuller upper lid fold, lash line and crease paint; brows as fine hair strokes; nasolabial shading.
- Neck seam gone (head mesh now runs down under the collar).
- Still weak: hair and beard read as lumpy clumps; lips still a bit stuck-on.

## 2026-10-14 · People: hair + beard pass
- Hair: more, thinner locks (r 4.6–5.2 mm), tighter smooth-union so each lock reads; hair mesh 3.1 → 2.6 mm. Beard: 1,200 thinner clumps lying flatter, mesh 2.7 → 2.2 mm.
- Better: no more cauliflower top, beard less blobby. Still weak: beard edges spiky, no colour streaks along the hair, build time up to ~9 min.

## 2026-10-14 · Starting scores (Claude, first honest pass)
- People in 3D: Shape 6 · Detail 5 · Surface 5 · Light 7 · Truth 6 · Works 9 = 6.3
- Main hall v3: Shape 7 · Detail 6 · Surface 5 · Light 6 · Truth 6 · Works 8 = 6.3

## 2026-10-14 · Tools: people build speed
- Full build of both people 9 min → 40 s (×13): x-sorted culling in eval_groups, narrow-band grid evaluation, both people in parallel. Same meshes (sign agreement 100%, max error near surface 2e-8).
- New: `--only` partial rebuilds (~25 s), `--fast` preview (~18 s), `people/iterate.sh` one-command loop with shots and a before/after sheet.

## 2026-10-14 · Multi-photo test: solid points, strays out
- Source now in the repo: `multi-photo-3d/scripts/page` (build.py, page.html, shoot.js, extract_ply.py). Cloud pulled back out of the published page.
- Build drops 6,803 stray points (lone points + below the floor). Page draws round discs sized in metres, eye-dome lighting for edges and depth, gaps filled from neighbours, grid properly hidden behind the cloud, colours lifted.
- Size readout uses the 1st–99th percentile box with an orange "not sure" tag; home view fits the whole cloud on a phone.
- Still weak: close-ups turn to a disc mosaic; floaters (clusters, not single points); depth figure is floor scatter, not the bay.
- Reviewer (fresh eyes, same cameras): BEFORE 3.7 → AFTER 4.8. The 5.5 start was a self-score, so the honest baseline was lower.
- Score: Shape 5 · Detail 3 · Surface 4.5 · Light 4.5 · Truth 5 · Works 7 = 4.8

## 2026-10-14 · Multi-photo test: floaters out
- build.py clean-up now also drops floating clumps: points within 2.5× the median spacing are linked, any clump under 1.5% of the cloud goes (354 clumps, 13,218 points), then a crop to the big pieces' box + 40 cm (1,119 more). Runs in ~2 s.
- Better: grey clumps top-left, the dark trail under the right end and the specks under the rack are gone; outline reads as a rack. Cloud size readout 10.3 → 9.9 m.
- Still weak: left end of the rack bent (pose drift?), orange canvas see-through up close, bay interiors dark mush on a phone, orange plume only trimmed.
- Reviewer (fresh eyes, same cameras): BEFORE 4.0 → AFTER 4.2. A different reviewer scored the last run 4.8, so the scale moves between reviewers; this run's BEFORE/AFTER pair is the fair comparison.
- Score: Shape 5 · Detail 2 · Surface 3 · Light 3 · Truth 5 · Works 7 = 4.2

## 2026-10-14 · Yard in 3D: labels you can read
- Labels rebuilt: measured widths and a real overlap test (was a fixed 70 × 22 px box, so long labels sat on each other), priority to big, near things with a bonus for ones already showing so they don't flicker, 7 max on a phone / 14 on desktop, kept clear of the title, hint and button bar, and in photo mode only labels for things inside the photo. Hint moved below the "code ↗" tab.
- Speed-ups: `fetch_inputs.py` recreates the private inputs (photo, bakes, camera) from the published page so a fresh clone can build; `shoot.js` takes the four before/after views on phone and desktop in ~50 s.
- Still weak: photo view smears when orbited (forklift billboard, floor streaks); trellis bundles and crates are plain blocks up close; flat grey shadow decal on the model floor; no "not sure" tags visible.
- Reviewer (fresh eyes, same cameras): BEFORE 5.0 → AFTER 5.3. The 6.0 start was a self-score.
- Score: Shape 5 · Detail 4 · Surface 5 · Light 5 · Truth 6 · Works 7 = 5.3

## 2026-10-15 · Multi-photo test: surfaces close up
- The black gaps up close came from a 10 px cap on disc size, not thin data. Now discs are true world size (cap 40 px × dpr), each sized by its own 4th-neighbour gap (build.py, embedded as one byte a point).
- Two-pass surface splatting: a depth pass draws each disc as a little dome, then a colour pass blends every disc within one radius of that surface with a gaussian weight, so overlaps merge instead of stacking like coins. Colour speckle halved with a 4-neighbour median. Eye-dome outline made thinner and lighter (halos round splats).
- `--prior-strays` keeps the strays count honest when rebuilding from the published page.
- Better: orange canvas solid, bay backs closed, no pinholes. Still weak: beam and upright edges read as beads, no detail gained (clips, joints), bays near-black on a phone, warped left end and strays unchanged.
- Reviewer (fresh eyes, 3 rounds, all "better, only just"): BEFORE 4.8 → AFTER 5.0.
- Score: Shape 5 · Detail 3 · Surface 5 · Light 4 · Truth 6 · Works 7 = 5.0

## 2026-10-15 · Multi-photo test: bays out of the dark
- build.py: local shadow lift. Each point gets the mean brightness of its ~35 cm neighbourhood (1-in-8 sample, k=64), dark neighbourhoods lifted towards mid-grey (up to 3.5×), each point's difference from its neighbourhood boosted 1.35× so edges inside the bays separate; hue kept, soft shoulder so bright things don't clip. Median brightness 0.17 → 0.29. Shader lift eased (pow .6 → .7) so white uprights don't blow out.
- `--no-denoise` for rebuilds from the published page (its cloud already had the colour median, doing it twice smeared it); `--no-tone` to compare.
- Better: bay backs, inner uprights and lower-shelf contents now readable on a phone. Still weak: close-ups are dabs with dark rims, loose fragments off the rack plane (right-end wing, top-left slab), button bar has no backing on busy close-ups.
- Reviewer (fresh eyes, same cameras): BEFORE 4.5 → AFTER 5.2.
- Score: Shape 5 · Detail 4 · Surface 4 · Light 5 · Truth 6 · Works 7 = 5.2

## 2026-10-15 · Yard in 3D: close-up detail on the small kit
- model.js: new builders `cardBox` (packing tape over the flaps and down both ends, fold line, shipping label, edge-darkened cardboard), `plyCrate` (ply panels inset in a pine batten frame, screw heads), `tote` (tapered body, rim lip, front ribs, hand slots), `jerryCan` (X pressing, waist seam, three-bar handle, spout and cap). The plain cubes in bays 0 and 2.8 now use them.
- trellis.js: knots raised and given a sheen (was flush black dots that read as drilled holes).
- Better: crates, boxes, totes and cans read as what they are up close; knots read as knots. Still weak: photo view smears when orbited, flat floor patch and hard shadow block in the model overview, help text has no backing, trellis tops read as planks.
- Reviewer (fresh eyes, same cameras): BEFORE 5.8 → AFTER 6.2. A new reviewer: last run's reviewer had this page at 5.3, so the scale moved; this run's pair is the fair comparison.
- Score: Shape 6 · Detail 6 · Surface 6 · Light 6 · Truth 6 · Works 7 = 6.2

## 2026-10-15 · Multi-photo test: splats blend instead of stacking like coins
- page.html: the colour pass now blends every disc whose front is within 4 disc-radii of the nearest surface (was 1). At 1 radius the cloud's own depth noise let one disc win its whole footprint, so close-ups read as coins with dark rims. Gap fill no longer darkens neighbours ×0.9 (drew seams). Tested the eye-dome pass off first: not the cause.
- Tried and dropped: fading low-weight pixels into the background for softer silhouettes; it drew dark crescents inside surfaces.
- Better: close-up panels, beams and canvas read as continuous surfaces, no coin outlines. Still weak: soft/smeared with no new detail, beady silhouettes and dark halos along uprights, holes and loose chunks unchanged, phone home view leaves the cloud small.
- Reviewer (fresh eyes, same cameras): BEFORE 4.8 → AFTER 5.0. Home views unchanged; gain is close-up only. (A different reviewer had the last run at 5.2, so the scale moved again; this run's pair is the fair comparison.)
- Score: Shape 5 · Detail 3 · Surface 4 · Light 4 · Truth 6 · Works 8 = 5.0

## 2026-10-15 · Multi-photo test: the rack measured, seen from the front
- build.py `rack_box`: RANSAC vertical plane on everything above 30 cm (70% of those points sit on it), refined; back beams found 1.15 m behind. Header now gives the rack (9.9 m long · 1.2 deep · 6.0 high) instead of the cloud box (9.8 × 9.0 m, the 9 m was floor). Green dimension lines with labels on the floor and up the far end.
- Home view now looks from the camera side and fits the rack's corners to the width (phone) and rack + floor to the height, between the title panel and buttons. The forklift, pallets and benches in front were there all along, hidden behind the rack from the old angle.
- Still weak: gap between the floor patch and rack base (looks floating), close-ups still soft with holes, phone crops the forklift, height line pokes past the rack top.
- Reviewer (fresh eyes, same cameras): BEFORE 4.7 → AFTER 5.5.
- Score: Shape 6 · Detail 4 · Surface 5 · Light 5 · Truth 6 · Works 7 = 5.5

## 2026-10-15 · Yard in 3D: soft contact shadows, floor patch blended in
- The "hard shadow block" on the model floor was the off-screen workshop cabin's sun shadow: cabin no longer casts. Sun shadows switched to PCF with radius 5 (PCFSoft ignores radius), so edges soften.
- New contact shadows (template.html `bakeContact`): an ortho camera at the floor looks up, draws everything within 1.3 m as darkness fading with height, two blur passes, laid on the floor (×0.8). Baked once, and again when the bell tent toggles. Mirror trap: a camera looking up flips x.
- Photo floor patch was a bright unlit sticker: now lit (Lambert, takes shadows), edges feathered from its own alpha (canvas blur), half strength over the slab.
- Guessed items get an orange NOT SURE tag on their label and card. Concrete and label textures seeded (stains don't move between builds).
- Still weak: trellis stillages are planks with dots up close, small kit seems to hover on the back wall, phone labels crowd round the stillages and the NOT SURE tag rarely wins a slot, pallet loads read as dark panels.
- Reviewer round 1 (5.8 → 6.2) flagged a brown smudge from the patch and the workbench label lost to the NOT SURE bonus; both fixed. Round 2, new reviewer, same cameras: BEFORE 5.2 → AFTER 5.5 (scale moved again; the pair is the fair comparison).
- Score: Shape 6 · Detail 5 · Surface 5 · Light 6 · Truth 5 · Works 6 = 5.5

## 2026-10-15 · Multi-photo test: a floor to stand on
- page.html bakes a floor at load: footprint of every point (dilated 0.6 m, then filled across each row and column so the 2.2 m strip between the scanned floor and the rack closes), feathered, in the scanned floor's own colour with a little seeded grain; contact shadow from every point under 1.6 m (weight e^(-y/0.4), blurred 16 cm). Sits just under the scanned floor, over the grid; hidden when flipped.
- Better: rack, forklift and benches stand on one floor with soft shadow under the rack, no longer hanging over a black gap.
- Round 1 reviewer flagged the slab as a different colour with a glowing edge; floor brought to 0.93 of the scanned colour, edge darkened as it fades and tightened. Rounds 2 and 3 still saw a faint halo.
- Still weak: floor reads as a flat slab next to the speckled scanned floor, faint halo at the fade, left upright strand dips into the floor, holes in the shelf faces, foreground clutter a mush up close.
- Reviewer (fresh eyes, round 3, same cameras): BEFORE 5.2 → AFTER 5.5.
- Score: Shape 6 · Detail 4 · Surface 5 · Light 5 · Truth 6 · Works 7 = 5.5

## 2026-10-15 · Yard in 3D: trellis laths that read as laths
- 3d-models/scripts/trellis.js: every lath gets a shared pine texture (grain streaks along the length, both long edges darkened as if rounded, a few wood knots); cord knots shrunk from 12 mm dark ovals to 6 mm rope-tan bumps. Tried opening the folded bundle wider for gaps between laths: it pushed slats into each other, so reverted; the dark lath edges do that job.
- Better: the stillage stack in the close view reads as bundled timber laths, not planks drilled with holes. Overviews unchanged.
- Still weak: no stillage frame or banding visible, crossing slats cut through each other, upper racking bays are flat photo panels, blotchy floor, hint text unreadable over the racking, cable line across the close view.
- Reviewer (fresh eyes, round 2, same cameras): BEFORE 5.8 → AFTER 6.0 (round 1 had 5.5 → 5.7).
- Score: Shape 6 · Detail 5 · Surface 6 · Light 6 · Truth 6 · Works 7 = 6.0

## 2026-10-15 · Multi-photo test: holes in the rack face filled
- build.py `fill_face`: the front layer (within 30 cm of the fitted rack face) laid on a 4 cm grid along the face × height; empty cells enclosed by covered ones (after a one-cell closing) are holes the stereo matcher missed on the dark panels. 1,394 cells (2.2 m²) get 4 points each at the local face depth, coloured by an inverse-distance mean of the 12 nearest real points. Open bays and the ragged ends aren't enclosed, so they stay open. `--no-fill` to compare.
- Better: no see-through black notches in the dark panels up close. Still weak: rack base a ragged fringe over a dark gap, bays dark smears with no crates or joints, rack ends break into chunks, foreground fat splats, floor a flat slab with a glowing edge, phone close-up labels on the rack.
- Reviewer (fresh eyes, same cameras): BEFORE 5.2 → AFTER 5.3. Close-up only; "better, only just".
- Score: Shape 5 · Detail 4 · Surface 5 · Light 5 · Truth 6 · Works 7 = 5.3
