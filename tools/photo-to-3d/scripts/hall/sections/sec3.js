// needs: trellis
// ===== Section 3: bell tent bag racks, 16 ft crown crates, door stillages — fitted to photo 53 (crown stack 3.3 px) =====
// Frame: x right (0 = left edge of the 4-high 16 ft crown column), y up, z toward the camera; crown fronts at z = 0.
function section(ROOT) {
  const crownMats = coverMats('c16', '#1d6658', '#eef0e6', '16FT CROWN × 5', { labelSize: 70 });
  const K16 = { w: 1.2, d: 1.0, h: 1.1, n: 5, D: 1.15, mats: crownMats };
  const crates = [];
  { const g = grp(ROOT, .6, 0, -.5); for (let i = 0; i < 4; i++) crates.push(crownCrate(g, K16, 0, i * 1.24, 0, i === 3 ? -.05 : 0));
    const g2 = grp(ROOT, 1.85, 0, -.2); for (let i = 0; i < 3; i++) crates.push(crownCrate(g2, K16, 0, i * 1.24, 0, .25));
    tag(g, '16 ft crown crates', 'Green covers "16FT CROWN × 5": five 16 ft yurt crowns per crate, stacked four high against the right wall, with a second column of three turned at an angle. Press "look inside".', '1.2 × 1.0 × 1.24 m each · stack ≈ 5 m', [4, 12, 21, 51, 52, 53], 'sure'); }
  // ---- bell tent bags: soft canvas sacks, drawstring neck, a luggage tag ----
  // four lumpy sack shapes: flat-ish bottom, slumped sides, a few creases, the neck pulled to one side
  const bagGeos = [0, 1, 2, 3].map(n => { const g = new THREE.SphereGeometry(.5, 24, 16), p = g.attributes.position, v = new THREE.Vector3(); const ph = [rnd() * 6, rnd() * 6, rnd() * 6, rnd() * 6];
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); let y = v.y;
      if (y < -.18) y = -.18 - (y + .18) * .35;                                 // squashed base
      const slump = 1 + .22 * Math.max(0, -y) ;                                 // spreads out at the bottom
      let r = 1 + .07 * Math.sin(v.x * 7 + ph[0]) * Math.sin(v.z * 6 + ph[1]) + .05 * Math.sin(v.y * 9 + v.x * 5 + ph[2]) + .03 * Math.sin(v.z * 15 + v.y * 13 + ph[3]);
      v.set(v.x * slump * r, y * r * (y > 0 ? .85 : 1), v.z * slump * r); v.x += .06 * Math.max(0, y) * Math.sin(ph[0]); p.setXYZ(i, v.x, v.y, v.z); }
    g.computeVertexNormals(); return g; });
  const canvasTex = (base) => tex(256, 256, (x, w, h) => { fabric(x, w, h, base); for (let i = 0; i < 14; i++) { x.strokeStyle = `rgba(0,0,0,${.06 + rnd() * .08})`; x.lineWidth = 2 + rnd() * 3; x.beginPath(); const y0 = rnd() * h; x.moveTo(0, y0); x.bezierCurveTo(w * .3, y0 + (rnd() - .5) * 60, w * .7, y0 + (rnd() - .5) * 60, w, y0 + (rnd() - .5) * 40); x.stroke(); } });
  const bagMat = {}; const mat = c => bagMat[c] || (bagMat[c] = STD({ map: canvasTex(c), roughness: .95 }));
  const tagMat = c => STD({ color: c, roughness: .5, side: THREE.DoubleSide, emissive: c, emissiveIntensity: .12 });
  function bag(p, x, y, z, w, h, d, col, tagCol, ry = 0) {
    const b = new THREE.Mesh(bagGeos[Math.floor(rnd() * 4)], mat(col)); b.scale.set(w, h, d); b.position.set(x, y + h * .5, z); b.rotation.y = ry; b.castShadow = b.receiveShadow = true; p.add(b);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(.03, .06, .1, 8), mat(col)); neck.position.set(x + (rnd() - .5) * w * .3, y + h * .95, z + d * .25); neck.rotation.x = .9; p.add(neck);
    if (tagCol) { const t = new THREE.Mesh(new THREE.PlaneGeometry(.055, .09), tagMat(tagCol)); t.position.set(x + (rnd() - .5) * w * .5, y + h * (.3 + rnd() * .4), z + d * .5 + .01); t.rotation.set((rnd() - .5) * .4, (rnd() - .5) * .4, (rnd() - .5) * .6); p.add(t);
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(.002, .002, .08, 4), STD({ color: 0xeeeeee })); cord.position.copy(t.position).add(new THREE.Vector3(0, .07, -.01)); p.add(cord); }
  }
  // green post-pallet racks, levels stacked by their cone posts
  function bagRack(name, what, photos, x, z, levels, step, cols, tagCol, w = 1.25, d = 1.05, sure = 'sure') {
    const g = grp(ROOT, x, 0, z);
    for (let lv = 0; lv < levels; lv++) { const s = grp(g, 0, lv * step, 0);
      for (const sx of [-1, 1]) { box(s, .06, .06, d, M.stillGreen, sx * (w / 2 - .03), .02, 0); for (const sz of [-1, 1]) { box(s, .055, step - .03, .055, M.stillGreen, sx * (w / 2 - .03), 0, sz * (d / 2 - .03)); const cone = new THREE.Mesh(new THREE.ConeGeometry(.05, .08, 8), M.stillGreen); cone.position.set(sx * (w / 2 - .03), step - .05, sz * (d / 2 - .03)); s.add(cone); } }
      for (const sz of [-1, 1]) box(s, w, .06, .06, M.stillGreen, 0, .02, sz * (d / 2 - .03));
      for (const xx of [-.3, .3]) box(s, .12, .04, d, M.stillGreen, xx, .02, 0);
      const n = 5 + Math.floor(rnd() * 3);
      for (let k = 0; k < n; k++) { const c = cols[Math.floor(rnd() * cols.length)]; const row = k < 3 ? 0 : 1; bag(s, -w / 2 + .22 + (k % 3) * ((w - .44) / 2) + (rnd() - .5) * .1, .06 + row * (step * .36), (rnd() - .5) * .3 + (row ? -.12 : .12), .46 + rnd() * .14, step * (.46 + rnd() * .1), .58 + rnd() * .14, c, tagCol, (rnd() - .5) * 1.2); } }
    return tag(g, name, what, `post pallets ${w} × ${d} m · ${levels} high (≈ ${(levels * step).toFixed(1)} m)`, photos, sure);
  }
  bagRack('Bell tent bags: green, lime tags', 'Green post pallets stacked seven high, crammed with dark green bell tent bags, each with a lime-green luggage tag (and a few beige inner bags).', [4, 32, 33, 51, 52, 53], -.95, 4.6, 7, .8, ['#3e5240', '#45594a', '#34463a', '#3a4c3d', '#c8b7a2'], '#9cff3a');
  bagRack('Bell tent bags: pale grey', 'Green post pallets of pale grey-green bags with no tags, five high.', [12, 51, 52, 53], -2.35, 4.4, 5, .82, ['#a9b2ad', '#b8c0bb', '#9ea7a2'], null, 1.25, 1.05, 'fairly sure');
  bagRack('Bell tent bags: beige, red tags', 'Green post pallets of beige and mustard canvas bags with red tags.', [4, 8, 18, 51, 52, 53], -3.75, 4.2, 6, .8, ['#d9bfa7', '#cdb08e', '#b38f5c', '#e3cbb6'], '#ff3b3b');
  // ---- door stillages: purple frames, folded trellis below, yurt door sets laid flat on top, cling-filmed ----
  const doorTex = tex(512, 900, (x, w, h) => { x.fillStyle = '#c4873f'; x.fillRect(0, 0, w, h); for (let i = 0; i < w; i += 64) { const g = x.createLinearGradient(i, 0, i + 64, 0); g.addColorStop(0, 'rgba(90,50,20,.45)'); g.addColorStop(.06, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(255,230,190,.06)'); x.fillStyle = g; x.fillRect(i, 0, 64, h); }
    for (let i = 0; i < 160; i++) { x.strokeStyle = `rgba(110,65,25,${.06 + rnd() * .12})`; x.beginPath(); const xx = rnd() * w; x.moveTo(xx, 0); x.bezierCurveTo(xx + (rnd() - .5) * 10, h * .3, xx + (rnd() - .5) * 10, h * .7, xx + (rnd() - .5) * 8, h); x.stroke(); }
    x.strokeStyle = '#7a4a1e'; x.lineWidth = 26; x.strokeRect(13, 13, w - 26, h - 26);
    x.fillStyle = '#141414'; for (const yy of [130, h - 130]) { x.fillRect(30, yy - 8, 300, 16); x.beginPath(); x.moveTo(330, yy - 8); x.lineTo(380, yy); x.lineTo(330, yy + 8); x.fill(); for (let k = 0; k < 4; k++) { x.fillStyle = '#555'; x.beginPath(); x.arc(70 + k * 70, yy, 4, 0, 7); x.fill(); x.fillStyle = '#141414'; } }
    x.fillRect(w - 70, h / 2 - 40, 14, 80); });
  const doorMat = STD({ map: doorTex, roughness: .7 });
  const filmMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .14, roughness: .12, side: THREE.DoubleSide, depthWrite: false });
  function doorStillage(p, x, y, z, ry, sections, doors) {
    const g = grp(p, x, y, z, ry), L = 2.3, D = 1.35;
    for (const sz of [-1, 1]) box(g, L, .07, .07, M.purple, 0, .05, sz * (D / 2 - .04));
    for (const sx of [-1, 1]) { box(g, .07, .07, D, M.purple, sx * (L / 2 - .04), .05, 0); for (const sz of [-1, 1]) { box(g, .07, .95, .07, M.purple, sx * (L / 2 - .04), 0, sz * (D / 2 - .04)); box(g, .14, .015, .14, M.purple, sx * (L / 2 - .04), 0, sz * (D / 2 - .04)); } }
    let top = .14;
    for (let k = 0; k < sections; k++) { const sec = trellisSection({ seed: 500 + k * 13 + Math.floor(x * 10), weathered: .3 }); sec.setOpen(sec.minOpen);
      const lay = new THREE.Group(); lay.rotation.x = -Math.PI / 2; const spin = new THREE.Group(); spin.rotation.z = -Math.PI / 2; lay.add(spin); spin.add(sec);
      sec.position.set(-sec.userData.cx, -sec.userData.height / 2 + sec.userData.end0, 0); const col = k % 2, row = Math.floor(k / 2);
      lay.position.set((rnd() - .5) * .06, .14 + row * .052, (col - .5) * (sec.userData.width + .04)); g.add(lay); top = .14 + (row + 1) * .052; }
    for (let k = 0; k < doors; k++) { const d = new THREE.Mesh(new THREE.BoxGeometry(2.0, .045, 1.15), [M.pallet, M.pallet, doorMat, M.pallet, M.pallet, M.pallet]); d.material[2] = doorMat; d.rotation.y = Math.PI / 2 * 0; d.position.set((rnd() - .5) * .04, top + .025 + k * .05, (rnd() - .5) * .04); d.castShadow = d.receiveShadow = true;
      d.geometry.attributes.uv.array.forEach((_, i, a) => {}); g.add(d); }
    top += doors * .05;
    const film = new THREE.Mesh(new THREE.BoxGeometry(L + .06, top + .06, D + .06), filmMat); film.position.y = (top + .06) / 2; g.add(film);
    return g;
  }
  { const g = grp(ROOT); doorStillage(g, 1.0, 0, 8.0, -.3, 4, 2); doorStillage(g, -1.25, 0, 8.4, .1, 4, 2);
    tag(g, 'Door stillages (16 ft doors)', 'Purple stillages of folded trellis with two 16 ft yurt door sets laid flat on top (pine boards in a frame, black strap hinges, a handle), cling-filmed: one complete yurt\'s walls and door per stillage.', 'stillages 2.32 × 1.35 m · ≈ 1.1 m high', [4, 22, 34, 35, 36, 51, 52, 53], 'sure'); }
  { const g = grp(ROOT); for (let i = 0; i < 3; i++) doorStillage(g, 2.6, i * 1.02, 6.2, -.45, i === 2 ? 4 : 6, i === 2 ? 1 : 0);
    tag(g, 'Trellis stillages (3 high, right)', 'Three purple trellis stillages stacked up on the right, cling-filmed, the top one with a door set on it.', '≈ 3.1 m tall', [22, 51, 52, 53], 'fairly sure'); }
  // walls
  { const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 7), STD({ map: tex(64, 256, (x, w, h) => { for (let i = 0; i < w; i += 8) { const g = x.createLinearGradient(i, 0, i + 8, 0); g.addColorStop(0, '#8d949a'); g.addColorStop(.5, '#c7ccd0'); g.addColorStop(1, '#8d949a'); x.fillStyle = g; x.fillRect(i, 0, 8, h); } }, [40, 1]) })); wall.position.set(-1, 3.5, -1.2); wall.userData.shell = true; ROOT.add(wall); }
  let lift = 0, liftWant = 0;
  return { home: [[.08, 1.65, 12.68], [-.5, 2, 3]], floor: 14,
    buttons: [{ label: 'look inside', fn: () => (liftWant = liftWant ? 0 : 1) }],
    tick: dt => { const was = lift; lift += (liftWant - lift) * Math.min(1, dt * 4); if (Math.abs(lift - was) < 1e-4) return false; crates.forEach((c, i) => c.userData.lift(Math.max(0, Math.min(1, lift * 1.6 - i * .06)))); return true; },
    photo: { n: 53, cam: __CAM1__ } };
}
