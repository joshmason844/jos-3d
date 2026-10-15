# Backlog

The scheduled improvement runs take the top unchecked item, do it, tick it, and add anything new they find at the bottom.
Runs alternate: one People item, then one Warehouse item (Main hall, sections, yard, trellis, forklift), so both keep moving. Every run also adds at least one new item it spotted, so the list never runs dry.

## Josh's requests (15 Oct; WW = the workshop warehouse) — do these FIRST, top one each run, before the score loop
- [ ] WW: line up Josh's LiDAR scan (15 Oct, Polycam, 20.0 × 31.8 × 5.5 m, textured GLB). It's in the PRIVATE repo joshmason844/off-season-reset at `scans/polycam-2026-10-15.glb` (read it from there; never copy it into this public repo or publish it). Josh: the yard bay (orange racking, planters, workbench end) is part of the WW, along its RIGHT side. Fit the scan into the WW frame (door at z = 0, x 0–20 m): level the floor (scan floor ≈ y −1.94), match the 20 m width, find which end is the door from the photos. Then measure from it: wall-to-wall, racking runs and bay widths, aisle widths, where the yard bay starts and ends. Write the numbers to `docs/ww-measurements.md` with a marked-up top view (the scan rendered from above with every measured line drawn on it) as evidence, and move anything in `hall/v3/hall3.js` that's out by more than 15 cm, NOT SURE tags off anything the scan confirms. Parts the scan didn't reach stay as they were.
- [ ] WW: bring the yard in (it sits along the WW's RIGHT side, per Josh, and the scan shows where). Merge the Yard in 3D model into the workshop warehouse page (`photo-to-3d/scripts/hall/v3`): reuse the yard's kit and builders from `photo-to-3d/scripts/model.js`, `trellis/`, `forklift/` (stillages, racking bays, crates, boxes, totes, jerry cans, forklift, the black ribbed planters strapped in pairs) in their measured positions, inside the warehouse's one coordinate frame. Don't rework or republish the Yard in 3D page itself. Uprights assumed 2.80 m apart until Josh's tape checks land; tag them NOT SURE. Split into steps if it won't fit one run.
- [ ] WW: the trellis in. Bring the trellis design (`photo-to-3d/scripts/trellis/` and `3d-models/scripts/trellis.js`: grained pine laths, rope knots, folded bundles on their stillages) into the WW wherever trellis is stored, at real size (16 ft yurt = 4 trellis sections, 14 ft = 3 per door, 5 doors per 14 ft stillage). Don't rework or republish the Trellis Stack page itself.
- [ ] WW: find every door and trellis stillage. Go through Josh's WW photos and videos (inputs via `photo-to-3d/scripts/fetch_inputs.py`) and the yard photos, and mark up every door stillage and trellis stillage you can see (marked-up photo as evidence for each, count per photo, orange NOT SURE on any you can't be sure of). Compare with what `hall/v3/hall3.js` already places (`trellisStillages`, the door stillages by the bell tent racks, the trellis stood on end by the door) and add the missing ones at their real spots. Then put the same models on all of them: the grained-lath trellis with rope knots (`3d-models/scripts/trellis.js`) on every trellis stillage, and a proper yurt door model on every door stillage (timber frame and panels, hinges, the door's real size) instead of the flat box. Purple stillage frames as in the photos.
- [ ] WW: yard planner. On the merged page: drag kit around on the floor (snaps, no overlaps), live aisle-width readouts between items, the forklift's turning circle drawn as you move it (and a red warning when an aisle is too tight for it), and a "wet canvas" mode to mark drying zones with area in m². Layout saves per device; a reset button. Works by touch on a phone. Prove it with a headless test that drags an item and reads the aisle width.

- [x] People: hair and beards finer (thinner locks, tighter blend, 2.6 mm mesh). 14 Oct
## Big upgrades (14 Oct) — each one is worth several small fixes
- [ ] People: proportion checker. Measure head:height, shoulder width, arm/leg lengths, eye line against standard adult proportions and fail the build if off.
- [ ] People: hair as hair cards (thin textured strips with alpha, layered like a game character) instead of solid blobs.
- [ ] People: skin material. MeshPhysicalMaterial with sheen and a little subsurface-style warmth; normal map for pores; ear and nose rims a touch redder in light.
- [ ] People: simple skeleton (hips, spine, neck, shoulders, elbows, wrists, knees) so poses can change: hands in pockets, carrying a pole, pointing.
- [ ] People: try a CC0 base body (MakeHuman's base mesh is CC0) as the starting shape, then sculpt details on top. Check licence before using anything.
- [ ] All pages: lighting rig. Image-based light from a generated warehouse/sky environment, AgX tone mapping, ambient occlusion on by default.
- [ ] All pages: procedural PBR materials (concrete, canvas weave, timber grain, galvanised steel) with normal + roughness maps.
- [ ] Warehouse: auto photo-match score. Render from each solved camera, compare with the photo (edges + SSIM), log the number, so "Truth" is measured not guessed.
- [ ] Warehouse: when Josh sends iPhone LiDAR scans (Polycam/Scaniverse), use them as the ground truth for sizes and layout.

## Queue
- [ ] People: beard still a bit spiky and sparse at the edges; hair needs strand-direction colour streaks and scalp shading at the parting.
- [ ] People: lips still look stuck on. Blend into the face, softer edges, colour fades out.
- [ ] People: reshoot the KDK tee hand close-up for a fair before/after.
- [ ] People: eyes. Wet-line, a little shadow from the upper lid, catch-light.
- [ ] People: clothes folds at elbows, waist and knees; tee hem and sleeve edges.
- [ ] Warehouse: Main hall v3 lighting. Warm high-bay pools, soft shadows under racking, roof-light shafts.
- [ ] Warehouse: Main hall v3 floor. Worn concrete with forklift tyre tracks, oil stains, painted aisle lines.
- [ ] Warehouse: Main hall v3 detail pass on the mezzanine stairs, handrails and sewing room.
- [ ] Warehouse: crate cover texture (fabric weave, straps, buckles).
- [ ] All pages: a phone-size check on every page; fix anything that overlaps. (Yard in 3D done 14 Oct: labels declutter; others still to do.)
- [ ] Skills: after each run, write what worked and what didn't into that skill's SKILL.md ("traps learned").
- [ ] Warehouse: racking. Beam clips, base plates, upright holes, load signs.
- [ ] Warehouse: Yard in 3D. Re-bake the photo textures at higher res; sharpen edges of the units.
- [ ] Warehouse: section pages. Re-fit each to its photo and log the match error before/after.
- [ ] Warehouse: walls and roof. Cladding panel seams, purlins, fire exit signs, the roller door mechanism.
- [x] Multi-photo test: page source into the repo (`multi-photo-3d/scripts/page`), stray clean-up, round points + eye-dome lighting, honest robust size with "not sure" tag, phone framing. 14 Oct
- [ ] Multi-photo test: close-ups break into a disc mosaic with gaps (orange canvas, beams). Densify (more SGBM pairs / smaller voxel) or proper splats, so joints and beam clips read.
- [x] Multi-photo test: floaters out. build.py now links points within 2.5× spacing, drops clumps under 1.5% of the cloud (354 clumps, 13k points) and crops to the big pieces' box + 40 cm. 14 Oct
- [ ] Multi-photo test: orange plume above the right bay is only trimmed, not gone (it touches the canvas so it survives the clump filter). Try a colour-and-height check against the bay top.
- [x] Multi-photo test: "cloud ≈ 10.3 × 8.9 m" depth is the floor scatter, not the bay. Measure the bay from its beams/uprights (or fit a box to the racking) and show that instead.
- [ ] Multi-photo test: left end of the rack is bent: top-left panel shears off and leans out, lower-left shelf block sags away from the uprights. Check camera poses at the start of the walk (drift) or re-run BA with more photos there.
- [x] Multi-photo test: orange canvas see-through up close. Disc cap (10 px) was the cause; now true world-size discs sized per point (4th-neighbour gap), two-pass surface splatting (dome depth, then gaussian-weighted colour blend), light colour denoise. 15 Oct
- [x] Multi-photo test: bay interiors were flat black-brown mush on a phone. build.py now does a local shadow lift (each point vs its ~35 cm neighbourhood brightness, dark areas lifted up to 3.5×, local detail boosted 1.35×, soft shoulder), shader lift eased so uprights don't blow out. 15 Oct
- [x] Yard in 3D: labels piled on each other, ran off the screen edges and under the title/buttons, and floated in the dark beyond the photo. Now: real box-vs-box overlap, biggest-and-nearest first, 7 max on a phone / 14 on desktop, kept clear of the title, hint and button bar, and in photo mode only things the phone saw. 14 Oct
- [ ] Yard in 3D: orbited photo view smears: forklift is a stretched billboard, ghost blue slab on the left wall, floor texture streaks off to the right. Better proxy shapes or fade the photo where the projection angle is steep.
- [x] Yard in 3D: model close-up, part 1. Ply crate now battened with screw heads, cardboard boxes have packing tape, fold line and shipping labels, storage totes have rim, ribs and hand slots, jerry cans have the X pressing, waist seam, three-bar handle and cap; trellis knots raised with a sheen so they read as knots, not holes. 15 Oct
- [ ] Yard in 3D: model close-up, part 2. Trellis bundle tops still read as wide planks; the black tote and fridges are flat dark blocks; bottles and lantern are bare cylinders.
- [x] Yard in 3D: model overview had a hard grey block (the off-screen workshop cabin's sun shadow) and a blown-out photo floor patch. Now: soft contact shadows baked from below (everything within 1.3 m of the floor, blurred), softer PCF sun shadows, cabin doesn't cast, photo floor patch lit, feathered and blended in at half strength, orange NOT SURE tag on guessed labels and card, concrete stains seeded. 15 Oct
- [ ] Multi-photo test: close-up silhouettes still look like strings of beads (beam and upright edges made of round splats, dark-coloured edge points). Try elliptical splats aligned to local surface (PCA normals) or trim edge splats.
- [ ] Multi-photo test: home view shows no contact with the floor grid: ragged bottom edge breaks into specks, no shadow. Add a soft contact shadow under the cloud footprint and clip specks under the bottom beam.
- [ ] Multi-photo test: title panel covers the top-left of the cloud in close-ups on phone; collapse it to one line after the first interaction.
- [x] Multi-photo test: close-up splats showed dark rims (coins). Not the EDL (tested off): the blend window was 1 disc-radius, so the cloud's depth noise let one disc win its whole footprint. Window now 4 radii, gap-fill no longer darkened ×0.9. 15 Oct
- [x] Multi-photo test: loose fragments off the rack plane: grey wing at the right end, dark slab top left, clusters bottom left. Likely what's stretching the 8.9 m depth readout. Plane-fit the rack face and drop or tag pieces far behind/in front of it.
- [ ] Multi-photo test: button bar sits straight on the busy cloud in close-ups (no backing strip), and on a phone the subtitle wraps "high" onto its own line. Give the bar a blurred strip and shorten the phone subtitle.
- [ ] Yard in 3D: help text top right ("tap anything to identify…") sits on the scene with no backing and crowds the CODE tab. Put it on a glass panel or hide it after the first tap.
- [ ] Yard in 3D: concrete texture is random per build (Math.random), so stains move between builds and before/after shots. Seed it.
- [ ] Yard in 3D: small white box floats on the back wall above the ply crate with no bracket (desk close-up). Mount it or check what it is.
- [ ] Multi-photo test: close-ups are now smooth but soft (smeared), with no new detail; beam and upright silhouettes still beady with soft dark halos against the gaps. Try a per-point sharpen at build time or elliptical (PCA-normal) splats so edges go crisp again.
- [x] Multi-photo test: phone home view leaves the cloud small in the upper middle above a big empty grid; frame the bay to fill the phone (fit width of the rack face, not the bounding sphere).
  - 15 Oct done: build.py `rack_box` fits the rack face (RANSAC + refine on x/z above 30 cm) and back beams; header now "rack ≈ 9.9 m · 1.2 deep · 6.0 high", green dimension lines + labels, home view from the camera side fitted to the rack (width) and floor (height), clear of the title and buttons. The "fragments" were the rack's back layer and the floor/forklift seen from behind.
- [x] Multi-photo test: rack and scanned floor don't meet: black gap between the floor patch (forklift, pallets) and the rack base, so the rack looks like it floats. 15 Oct done: page.html bakes a floor at load (scanned floor's own colour, footprint of every point dilated 0.6 m, gaps filled per row and column, feathered) with a contact shadow from every point under 1.6 m (weight e^(-y/0.4), blurred 16 cm).
- [ ] Multi-photo test: rack reads as a flat sheet up close despite being 1.2 m deep; uprights fuzzy dotted lines, no clips or crate edges.
  - 15 Oct split: black holes in the dark panels done. build.py `fill_face` finds empty 4 cm cells enclosed in the rack face (1,394 cells, 2.2 m²) and fills each with 4 points at the local face depth, coloured from the 12 nearest real points. Open bays and ragged ends aren't enclosed, so stay open. `--no-fill` to compare.
- [ ] Multi-photo test: phone home view crops the forklift and the right end of the floor; 6.0 m height line pokes above the rack top at the far end.
- [x] Yard in 3D: trellis stillages up close were a flat deck of planks with big dark dots. 15 Oct done: trellis.js laths now carry a pine texture (grain along the length, darkened rounded edges, the odd wood knot) and the cord knots are small and rope-coloured (6 mm, tan) instead of 12 mm dark blobs.
- [ ] Yard in 3D: trellis stillages still show no frame, posts or banding in the close view (the cradle is hidden under the bundle), and the folded slats visibly cut through each other where they cross. Model the stillage frame/banding so it shows, and lift crossing slats apart.
- [ ] Yard in 3D: jerry cans, the small white box and the white oval on the sack truck look like they hover (no shelf or contact under them in the close view). Check heights, add a shelf lip or contact.
- [ ] Yard in 3D: on a phone the "Mitre saw on a trestle" label sits under "Trellis stillages" and covers the stack; "not sure" items (timber poles) lose their label slot to neighbours, so the orange tag rarely shows. Group or nudge labels instead of dropping them.
- [ ] Yard in 3D: pallet loads are mostly flat black or dark panels and don't read as canvas or kit; contact shadows under racking feet and boxes still faint.
- [ ] Multi-photo test: the new filled floor still has a faint light halo where it fades into the black, and reads as a flat even slab next to the speckled scanned floor. Fade it into the background colour, not over it, and borrow the scanned floor's colour variation (sample colours into the floor texture) so the two blend.
- [ ] Multi-photo test: bottom-left orange upright hangs below the bottom beam and dips into the floor in close-ups; dark navy band along the rack base. Check those points against the floor plane (clip under y = 0, tag or trim the strand).
- [ ] Multi-photo test: foreground clutter (forklift, pallet, benches) is a mush of oversized dots in close-ups, sitting under the button bar; and on phone home the "9.9 m" label sits on the blue and tan items at the rack base. Nudge the label off busy points.
- [ ] Yard in 3D: upper racking bays (close view, top half) are flat dark ribbed panels with the photo smeared on; the "under-counter fridges" and upper-left stock have no depth. Give the bay contents simple 3D proxies.
- [ ] Yard in 3D: model-view concrete is covered in dark grey leopard-spot blotches that read as dirt/noise, and they out-shout the real contact shadows (forklift, sack truck). Fewer, fainter, larger-scale stains.
- [ ] Yard in 3D: the loose cable draws a hard black line across the left of the close view and its label points at nothing much. Thinner, grey, or lie it flat on the floor.
- [ ] Multi-photo test: rack base ends in a ragged fringe of drips over a dark gap; no feet meeting the floor, left-end debris "legs" hang in mid-air (desk close-up, left).
- [ ] Multi-photo test: rack ends (left orange stack, right-hand columns) break up into ragged fringes and floating chunks.
- [ ] Multi-photo test: phone close-up: title panel sits over the top beam, and the "1.2 m deep" / "6.0 m high" labels sit on the rack itself.
- [ ] Team: saved anchor images (one 4, one 6, one 8 example per page) for reviewers to calibrate against, so scores stop moving between reviewers.
