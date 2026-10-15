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
- [ ] Multi-photo test: "cloud ≈ 10.3 × 8.9 m" depth is the floor scatter, not the bay. Measure the bay from its beams/uprights (or fit a box to the racking) and show that instead.
- [ ] Multi-photo test: left end of the rack is bent: top-left panel shears off and leans out, lower-left shelf block sags away from the uprights. Check camera poses at the start of the walk (drift) or re-run BA with more photos there.
- [x] Multi-photo test: orange canvas see-through up close. Disc cap (10 px) was the cause; now true world-size discs sized per point (4th-neighbour gap), two-pass surface splatting (dome depth, then gaussian-weighted colour blend), light colour denoise. 15 Oct
- [ ] Multi-photo test: bay interiors are flat black-brown mush on a phone, no crates or edges readable. Lift shadows / local contrast in the bays, or brighten colours from the source photos.
- [x] Yard in 3D: labels piled on each other, ran off the screen edges and under the title/buttons, and floated in the dark beyond the photo. Now: real box-vs-box overlap, biggest-and-nearest first, 7 max on a phone / 14 on desktop, kept clear of the title, hint and button bar, and in photo mode only things the phone saw. 14 Oct
- [ ] Yard in 3D: orbited photo view smears: forklift is a stretched billboard, ghost blue slab on the left wall, floor texture streaks off to the right. Better proxy shapes or fade the photo where the projection angle is steep.
- [ ] Yard in 3D: model close-up. Trellis stillage bundles are flat orange blocks with black dot holes (knots read as holes), no straps or separate slats; crates and boxes are plain untextured cubes.
- [ ] Yard in 3D: model overview has a big flat grey shadow decal under the forklift and workbench; swap for soft contact shadows. Several guessed items (e.g. yurt crown vs plywood crate panels) have no orange "not sure" tag on screen.
- [ ] Multi-photo test: close-up silhouettes still look like strings of beads (beam and upright edges made of round splats, dark-coloured edge points). Try elliptical splats aligned to local surface (PCA normals) or trim edge splats.
- [ ] Multi-photo test: home view shows no contact with the floor grid: ragged bottom edge breaks into specks, no shadow. Add a soft contact shadow under the cloud footprint and clip specks under the bottom beam.
- [ ] Multi-photo test: title panel covers the top-left of the cloud in close-ups on phone; collapse it to one line after the first interaction.
