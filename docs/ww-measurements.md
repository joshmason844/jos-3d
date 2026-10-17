# WW measurements from Josh's LiDAR scan (15 Oct 2026)

Source: Polycam scans in the private off-season-reset repo (`scans/polycam-2026-10-15.glb`, `…-workshop.glb`). Scans stay private; only the numbers and the marked-up top view (heights only, no scan texture) live here.
Evidence: [`ww-scan-top.png`](ww-scan-top.png) — the scan seen from above in the WW frame, every measured line drawn on it.

## Fitting the scan into the WW frame
| Step               | Number                                                              | How                                                         |
|--------------------|---------------------------------------------------------------------|-------------------------------------------------------------|
| Turn               | 1.80° about the vertical                                            | Area-weighted wall-normal directions (4θ circular mean)     |
| Floor              | scan y = −1.509 m (not −1.94: that's the lowest noise point)        | Plane fit to up-facing faces, 203 m², rms 1.7 cm             |
| Floor fall         | 4 mm per metre towards the right wall (≈ 8 cm across the hall)      | Same plane fit; along the hall it's flat (0.3 mm/m)         |
| Shift              | WW x = scan x + 10.0 · WW z = scan z − 13.75                         | Left wall plane → x 0, door wall (racking back) → z 0       |
| Which end is the door | the +z end of the scan                                           | Workshop on the left, orange racking on the right, the floor runs out through an opening in that wall |

## Measured
| What                                   | Scan says                                          | hall3.js had                         | Moved? |
|----------------------------------------|----------------------------------------------------|--------------------------------------|--------|
| Wall to wall                           | 19.95 m (±5 cm)                                    | 20.0 m                               | no (5 cm) |
| Workshop under the mezzanine (inside)  | 10.58 × 5.31 m, ceiling ≈ 3.8 m (its own scan)     | 8 × 4 m, deck at 3.0 m               | yes (footprint 15 Oct; ceiling 3.8 m 17 Oct, sewing room raised 0.8 m with it) |
| Workshop in the hall                   | x 0–6.1, z −2.45 to −13.0 (±0.3 m)                 | x 0–4, z −0.15 to −8.1               | yes    |
| Yellow racking (left)                  | on the workshop's outside wall, front x 7.2, z −5.25 to −10.85, 2 bays × 2.8 m | left wall x 0.1–1.2, z −8.6 to −14, 2 × 2.7 | yes |
| IBC tanks                              | x 6.4–7.1, z −13.1 to −15.2                        | x 2.6, z −13.4                       | yes    |
| Orange racking, right wall (yard bay)  | front x 18.4, wall 19.95; uprights z −14.2, −11.43, −8.63, −5.9, −3.13, −0.35 → 5 bays × 2.77 m (±5 cm); beams 1.55 and 3.03 m | 3 bays × 2.7 m, z −17.2 to −9.1, beams 1.2/2.3/3.3 | yes |
| Orange racking, door wall              | 1 bay × 2.9 m, x 15.2–18.1, front z −1.75; beams 2.15 / 3.05 m | not drawn                       | added  |
| Yellow racking across the back of the yard bay | x 13.6–18.5, front z −14.85, 2 bays ≈ 2.45 m, beams ≈ 1.35 / 3.0 m | not drawn                   | added  |
| Side door (OSB-lined)                  | x 13.2–15.1 in the door wall                       | not drawn                            | drawn 17 Oct (opening cut, OSB-lined, frame, pair of doors; head ≈ 2.2 m from a down-facing face in the scan) |
| Roller door                            | open from x ≈ 8.9 to 12.7 at least; left edge not reached | x 6.85–12.35                  | no (left edge unknown) |
| Yard bay                               | x 13 to 18.4 (rack front), z −1.75 to −14.85: 13.1 m deep, open to the aisle on its left | —            | —      |
| Main aisle by the door                 | 11.2 m, yellow rack front (x 7.2) to orange rack front (x 18.4) | —                         | —      |
| Floor panels (door end)                | a 2.0 × 0.9 m pile, 1.15 m tall, x 13.0–15.0, z −3.0 to −3.9 | x 13.0, z −3.8, 0.43 m tall  | yes (24 panels, 1.15 m, 17 Oct) |
| Left-side stacks (z −18…−26)          | three cling-filmed piles across the hall at x 3.7–6.6: z −18.3…−20.0 ≈ 3.5–3.8 m, z −21.6…−22.9 ≈ 2.6–3.9 m, z −22.9…−24.6 ≈ 1.25 m; wall band front x 1.4 (z −15.5…−19.4), x 2.6 (z −19.5…−25) | one 3-high stillage stack along the wall at x 2.7–4.1; pole stillages and canvas through the wall (to x −0.6); floor panels on open floor at x 7.3 | yes (17 Oct: 4/3/1-high piles, wall items back to x ≥ 0.1, floor panels removed; `docs/ww-left-stacks-top.png`. Reverted 17 Oct 04:xx after review, back in 17 Oct 05:xx with real stretch-wrap) |
| Left wall band (z −13…−28)            | front faces reach the scan's 5 m top: x ≈ 1.4 at z −13…−19.4 (blue upright seen at z ≈ −14.2, beam gaps at ≈ 2.2–2.45 and ≈ 4.4 m), x ≈ 2.6 at z −19.5…−25 (underside of the upper stock at ≈ 2.45 m), x ≈ 1.0 at z −25…−28; in front: a 2.0–2.8 m dark block with a striped bundle at x 1.6–3.4, z −16.5…−18.2, ≈ 1 m bags at z −18.5…−19.3, a pale smooth block 2.1 m tall at x 1.5–2.6, z −25.1…−28.3 | trellis wall stack only (z −13.9…−16.5), open wall z −16.5…−19.4; red pole stillages at z −24.8…−26.0 | partly (17 Oct 03:xx: one racking bay z −16.65…−19.4 front x 1.4, beams 2.3 / 4.35, stocked; sheeted dark pile + bags in front; pale sheeted block 3.25 × 1.15 × 2.1 m; red pole stillages moved to z −23.3…−24.5. `bin/scan_top.py` heightmap) |
| 14 ft crown crates                     | mid-hall, x 6.1–10.0, z ≈ −27 to −29, fronts to the door ("14FT CROWN 5" readable) | right wall, z −14.6 | yes |

## Moved because the scan shows something else there (spot itself not scanned: orange NOT SURE)
- Oven crates, Bedouin Extra, lime stillages: drawn on the right wall at z −8 to −13, where the scan shows the yard bay racking. Moved past the yard bay (z −17 to −21).
- Black crate tower: drawn where the door-wall racking is; moved to x 12.3, z −2.6 (a black object the LiDAR can't see sits about there).
- Rugs and the big ply crate: drawn inside the measured workshop; moved into the aisle.

## Not reached by the scan (left as they were)
The right half beyond z −16.7, the far end beyond z −30, the mezzanine top and the roof. Uprights in the yard bay are now measured (2.77 m), so the 2.80 m guess can lose its NOT SURE tag when the yard is merged in.

## Workshop inside (17 Oct, from Josh's workshop scan; evidence `docs/ww-workshop-top.png`, heights only)

Fit: scan floor y −1.445, ceiling 3.83 m over the back, walls square to the scan's axes (0.17°). WW x = scan z + 3.45, WW z = −scan x − 7.9. The scan's +z wall is the aisle wall and its far end has the way out at the aisle corner: the main hall scan shows the same gap in the far wall at x 5.2–6.0 (its top reads 2.8 m there against 4.4–5 m along the rest). Checked against the main scan's view in through the front (heights within the workshop footprint): this way round fits 0.54 m mean height difference, the mirror way 0.76 m.

| Item                     | Where (WW x, z)                       | Height (scan)              | Built as                                   |
|--------------------------|---------------------------------------|----------------------------|--------------------------------------------|
| Inside walls             | x 0.45–5.95, z −2.45 to −12.95        | ceiling 3.8 m (back), 3.0 m soffit over z −2.45…−6.1 | OSB lining, ply soffit on two beams |
| Way out                  | far wall, x ≈ 4.95–5.85               | opening ≈ 2.05 m           | doorway, leaf propped out                  |
| Front window (aisle)     | z −2.9 to −5.3                        | 1.2–2.6 m (reads as glass) | 2.4 × 1.4 m window; old aisle door removed (the bench runs under it) |
| Front bench              | x 0.5–5.9, z −2.47…−3.09              | top 1.0–1.1, shelf ≈ 2.0 at x 0.75–2.0 | bench + shelf unit over its left end |
| Vice bench (left, front) | x 0.47–1.17, z −3.1…−5.7              | 0.9–1.3                    | bench with cupboards, vice; yellow banner above (1.3–2.4 m) |
| Centre table             | x 2.5–3.9, z −4.45…−5.8               | 1.0–1.1, open under        | table, boxes under                         |
| Saw bench                | x 2.65–4.15, z −6.43…−6.98            | 1.0–1.1                    | bench with mitre saw                       |
| Long aisle bench         | x 5.31–5.93, z −2.8…−12.4             | 0.9–1.1; stock to 1.7 / 2.6 over z −9…−12.7 | bench with cupboards, shelves over the far half |
| Tall shelving (left)     | x 0.95–1.95, z −6.05…−9.35            | 2.0–2.5                    | 5-level slotted-angle shelving             |
| Low unit                 | x 0.85–1.75, z −9.4…−10.2             | 1.2–1.5                    | 3-level shelving                           |
| Tool wall bench          | x 1.8–4.7, z −12.28…−12.93            | 1.2–1.3, to 2.5 at the wall | bench, pegboard, shelf                    |
| Drawer stack             | x 1.1–1.8, z −12.35…−12.85            | ≈ 1.4–1.8                  | roll cabinet                               |
| Floor items              | (4.25, −11.2), (3.25, −8.45), (2.4, −9.5), (1.97, −9.95) | 0.65, 0.7, ≈0.35, ≈0.3 | compressor, offcuts bin, two buckets |
| Low cupboard             | x 0.5–1.3, z −11.65…−12.25            | 1.0–1.1                    | cupboard                                   |
| Red on the far wall      | x ≈ 0.8, 1.3 m                         |                            | fire extinguisher                          |
