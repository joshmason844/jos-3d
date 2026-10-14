// ===== Section 1: crown crates (14 ft crowns ×5), Bedouin Extra stack, lime stillage — fitted to photo 58 (3.7 px) =====
// Frame: x right along the crate fronts (0 = left edge of the 3-high crown stack), y up, z toward where the photo was taken; crown fronts at z = 0.
function section(ROOT) {
  const D = 1.0, W = 1.2, CH = 1.13, PH = .11, STEP = CH + PH;
  const crownMats = coverMats('c14', '#1d6658', '#eef0e6', '14FT CROWN × 5', { labelSize: 70 });
  const bedMats = coverMats('bed', '#1c1d20', '#e9e9e6', 'BEDOUIN EXTRA', { labelSize: 64 });
  const K14 = { w: W, d: D, h: CH, n: 5, D: 1.05, mats: crownMats };
  const crates = [];
  // ---- the 3-high stack in the middle of the photo; the top one sits slightly skewed ----
  { const g = grp(ROOT, W / 2, 0, -D / 2);
    for (let i = 0; i < 3; i++) { const c = crownCrate(g, K14, 0, i * STEP, 0, i === 2 ? -.06 : 0); crates.push(c); }
    tag(g, '14 ft crown crates (3 high)', 'Green covers "14FT CROWN × 5": each crate holds five 14 ft yurt crowns (the timber rings the roof poles slot into) on a pallet, with a clear pocket for the check sheet. Bottom one has a sheet in it. Press "look inside" to lift the covers.', `${W} × ${D} × ${(STEP).toFixed(2)} m each · stack ${(3 * STEP).toFixed(2)} m`, [5, 28, 58], 'sure'); }
  // ---- the 2-high stack to the left, with empty pallets and black cushion pads on top ----
  { const g = grp(ROOT, -W / 2 - .06, 0, -D / 2 - .05);
    for (let i = 0; i < 2; i++) crates.push(crownCrate(g, K14, 0, i * STEP, 0));
    const top = grp(g, 0, 2 * STEP, 0); let y = 0;
    for (let i = 0; i < 8; i++) { pallet(top, 1.2, .8, y, .2); y += .145; }
    tag(g, '14 ft crown crates (2 high) + pallets', 'Two more "14FT CROWN × 5" crates, with a stack of empty Euro pallets and black foam cushion pads on top.', '', [5, 58], 'sure'); }
  { const g = grp(ROOT, -1.25, 2 * STEP, -.6); for (let i = 0; i < 7; i++) { const b = box(g, 1.15, .15, .62, STD({ color: 0x24262a, roughness: .55 }), (rnd() - .5) * .05, i * .165, (rnd() - .5) * .04); b.geometry = new THREE.BoxGeometry(1.15, .15, .62, 4, 2, 2); }
    tag(g, 'Black cushion pads', 'Black vinyl-covered foam pads (bench or bed cushions) stacked flat beside the pallets.', '≈ 1.15 × 0.62 × 0.15 m', [5, 58], 'fairly sure'); }
  // ---- Bedouin Extra crates: wide black covers; ply "Bedouin Reception" crate with a round hole ----
  const bed = (p, x, y, z, w, h, d, ry = 0) => { const g = grp(p, x, y, z, ry); const ph = pallet(g, w, d); const c = coverMesh(w + .02, h, d + .02, bedMats); c.position.y = ph + h / 2; g.add(c); return g; };
  { const g = grp(ROOT, 0, 0, 0);
    bed(g, 2.85, 0, .33 - .6, 2.1, 1.04, 1.2);                       // bottom: wide one, sitting forward
    bed(g, 1.75, 1.24, -.6, 1.1, 1.04, 1.1);                          // narrow one behind, second level
    bed(g, 2.6, 2.5, -.65, 2.2, 1.1, 1.2);                            // top: wide one
    tag(g, 'Bedouin Extra crates', 'Black covers marked "BEDOUIN EXTRA" with dated check sheets in the pocket: spare kit for the Bedouin tents, stacked three high.', 'bottom ≈ 2.1 × 1.2 m', [5, 57, 58], 'sure'); }
  { const g = grp(ROOT, 3.0, 1.24, -.55);
    const ply = STD({ map: tex(512, 384, (x, w, h) => { const img = M.pallet.map.image; x.drawImage(img, 0, 0, w, h); x.fillStyle = 'rgba(210,190,160,.35)'; x.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { x.strokeStyle = `rgba(90,70,45,${.1 + rnd() * .15})`; x.beginPath(); x.ellipse(rnd() * w, rnd() * h, 30 + rnd() * 90, 6 + rnd() * 20, rnd() * .3, 0, 7); x.stroke(); }
      x.fillStyle = 'rgba(30,25,20,.7)'; x.font = 'bold 34px Arial'; x.fillText('BEDOUIN', 300, 120); x.fillText('RECEPTION', 290, 160); drawBadge(x, 160, 220, 110, 'rgba(30,25,20,.75)', 'rgba(0,0,0,0)'); x.fillStyle = '#0c0a08'; x.beginPath(); x.arc(70, 70, 34, 0, 7); x.fill(); }) });
    const ph = pallet(g, 1.6, 1.1); const b = box(g, 1.6, 1.02, 1.1, [ply, ply, M.pallet, M.pallet, ply, ply], 0, ph, 0);
    for (const sx of [-1, 1]) for (const yy of [.2, .85]) box(g, .05, .05, .02, M.steel, sx * .7, ph + yy, .56);
    tag(g, 'Ply crate: Bedouin Reception', 'Plywood crate stencilled "BEDOUIN RECEPTION" with the GY badge and a round hand-hole, sat on the Bedouin Extra crates.', '≈ 1.6 × 1.1 × 1.15 m', [57, 58, 59], 'sure'); }
  // ---- the new lime-green stillage on the floor in front ----
  { const g = grp(ROOT, .95, 0, .6, .23); const s = M.lime, w = 1.2, d = 1.0;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { box(g, .07, .9, .07, s, sx * (w / 2 - .035), .0, sz * (d / 2 - .035)); box(g, .14, .012, .14, s, sx * (w / 2 - .035), 0, sz * (d / 2 - .035)); box(g, .09, .18, .09, s, sx * (w / 2 - .035), 0, sz * (d / 2 - .035)); }
    for (const sz of [-1, 1]) box(g, w, .08, .07, s, 0, .1, sz * (d / 2 - .035));
    for (const sx of [-1, 1]) box(g, .07, .08, d, s, sx * (w / 2 - .035), .1, 0);
    for (const xx of [-.28, .28]) { box(g, .2, .06, d, s, xx, .1, 0); box(g, .16, .08, .08, M.black, xx, .02, d / 2 - .04); }
    tag(g, 'Lime stillage (empty, new)', 'Brand-new lime-green post pallet with removable corner posts and two fork pockets, standing empty in front of the crown crates.', '≈ 1.2 × 1.0 × 0.9 m', [5, 28, 58], 'sure'); }
  let lift = 0, liftWant = 0;
  return {
    home: [[.76, 1.42, 3.87], [.9, 1.5, -.3]], floor: 9,
    buttons: [{ label: 'look inside', fn: () => (liftWant = liftWant ? 0 : 1) }],
    tick: dt => { const was = lift; lift += (liftWant - lift) * Math.min(1, dt * 4); if (Math.abs(lift - was) < 1e-4) return false; crates.forEach((c, i) => c.userData.lift(Math.max(0, Math.min(1, lift * 1.6 - i * .1)))); return true; },
    photo: { n: 58, cam: __CAM1__ },
  };
}
