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
