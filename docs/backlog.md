# Backlog

The scheduled improvement runs take the top unchecked item, do it, tick it, and add anything new they find at the bottom.
Runs alternate: one People item, then one Warehouse item (Main hall, sections, yard, trellis, forklift), so both keep moving. Every run also adds at least one new item it spotted, so the list never runs dry.

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
- [ ] Multi-photo test: rack and scanned floor don't meet: black gap between the floor patch (forklift, pallets) and the rack base, so the rack looks like it floats. Fill or bridge the floor under the bottom beam, or a contact shadow along the base.
- [ ] Multi-photo test: rack reads as a flat sheet up close despite being 1.2 m deep; black holes in the dark panels, uprights fuzzy dotted lines, no clips or crate edges.
- [ ] Multi-photo test: phone home view crops the forklift and the right end of the floor; 6.0 m height line pokes above the rack top at the far end.
- [ ] Yard in 3D: trellis stillages up close are a flat deck of planks with big dark dots; no frame, posts or banding. Model the stillage frame and shrink the knots.
- [ ] Yard in 3D: jerry cans, the small white box and the white oval on the sack truck look like they hover (no shelf or contact under them in the close view). Check heights, add a shelf lip or contact.
- [ ] Yard in 3D: on a phone the "Mitre saw on a trestle" label sits under "Trellis stillages" and covers the stack; "not sure" items (timber poles) lose their label slot to neighbours, so the orange tag rarely shows. Group or nudge labels instead of dropping them.
- [ ] Yard in 3D: pallet loads are mostly flat black or dark panels and don't read as canvas or kit; contact shadows under racking feet and boxes still faint.
