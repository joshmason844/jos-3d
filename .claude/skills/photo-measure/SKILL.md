---
name: photo-measure
description: Work out real sizes from a photo Josh sends (clothes, kit, furniture, bags, boards) using a bank card or A4 sheet in the shot, and send back the photo marked up with every measurement. Use when he asks how big something is from a picture.
---
Measure things from a photo using a flat reference of known size lying in the same plane.

Script: `.claude/skills/photo-measure/scripts/measure.py` in this repo (OpenCV + numpy, nothing to install). If it's missing, clone the repo. The core is `cv2.getPerspectiveTransform(ref_corners, ref_mm_rect)`, then `cv2.perspectiveTransform` on each pair of points and take the distance in mm (`--flat` uses `cv2.estimateAffine2D` instead).

## How Josh should take the photo
- Use **A4 paper** for anything bigger than a shoe. It's about 13× steadier than a bank card.
- A bank card is fine **if the phone is held straight down** (then use `--flat`).
- Lay the reference flat on the same surface, next to the thing and fully in shot. Lay the thing flat too (smooth clothes out).
- Get everything in frame, fairly close, with a plain darker background behind the white sheet.
- Big things or rooms: the iPhone **Measure** app (LiDAR on the 14 Pro Max) is quicker. He can screenshot the result.

## Steps
1. `measure.py detect IMG det.jpg` finds the card or A4 and gives its corners with sub-pixel accuracy. Look at det.jpg to check it outlined the right thing. If not, read the corners off the grid by hand (clockwise from top-left, long side first) and expect a wider ± figure.
2. `measure.py grid IMG grid.jpg` draws labelled pixel coordinates. View it, zooming into crops for edges, and read off the end points for each measurement.
3. `measure.py measure IMG out.jpg --ref x,y x,y x,y x,y --ref-mm a4|card|W,H --seg "chest:x1,y1:x2,y2" ... [--flat]`
   - It prints cm, a ± range (95%, includes reference and point-picking wobble) and a check that the reference re-measures to its true size.
4. Send out.jpg back to Josh **every time** (his rule: show photo evidence with the numbers), plus a short list: `chest 52 cm ±1`.

## Defaults that worked (Oct 2026 test, 4032×3024 photo)
- Angled shot, card, by-eye points: 0.3% off the truth, but ± was ~55 mm because a small card makes the angle maths shaky.
- Same shot with A4: ± ~4 mm. Straight-down shot with card and `--flat`: ± 2–5 mm, ~0.5% off.
- References: card 85.6 × 53.98 mm, A4 297 × 210, A5 210 × 148, £20 note 149 × 80.

## Traps
- Only things **on the same flat surface** as the reference measure right. Height off the table, depth into the scene, or curved surfaces (a body, a rolled bag) will be wrong. Say so.
- Auto-detect needs a bright, four-cornered reference. A dark card or a white background will fool it, so pick the corners by hand.
- Report the ± honestly. If it's more than ~3%, ask for a retake with A4 or straight down rather than guessing.
- Clothes measurements follow the usual flat-lay rules: chest is armpit to armpit, length is the highest shoulder point to the hem, sleeve is shoulder seam to cuff.

## Example
"Chest 52 cm ±0.5, length 72 cm ±0.6. Photo marked up below."
