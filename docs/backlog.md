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
- [ ] Warehouse: trellis lattice joints and rivets visible close up.
- [ ] Warehouse: forklift tyres, mast chains, seat detail.
- [ ] All pages: a phone-size check on every page; fix anything that overlaps.
- [ ] Skills: after each run, write what worked and what didn't into that skill's SKILL.md ("traps learned").
- [ ] Warehouse: racking. Beam clips, base plates, upright holes, load signs.
- [ ] Warehouse: Yard in 3D. Re-bake the photo textures at higher res; sharpen edges of the units.
- [ ] Warehouse: section pages. Re-fit each to its photo and log the match error before/after.
- [ ] Warehouse: walls and roof. Cladding panel seams, purlins, fire exit signs, the roller door mechanism.
