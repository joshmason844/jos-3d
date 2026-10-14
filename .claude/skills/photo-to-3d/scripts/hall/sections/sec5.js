// needs: forklift
// ===== Section 5: the door end — roller door, racking, mezzanine, 12 ft crown crate, forklift — fitted to photo 9 (7 px) =====
// Frame: x right (0 = left edge of the 12 ft crown crate), y up, z toward the camera (i.e. back into the hall); crate front at z = 0, roller door at z = -12.8.
const SECRATE = [];
function section(ROOT) {
  const ZD = -12.8, DOORL = -6.2, DOORR = .5, DOORH = 5.6;
  const CLAD = STD({ map: tex(64, 256, (x, w, h) => { for (let i = 0; i < w; i += 8) { const g = x.createLinearGradient(i, 0, i + 8, 0); g.addColorStop(0, '#79828a'); g.addColorStop(.5, '#b9bfc4'); g.addColorStop(1, '#79828a'); x.fillStyle = g; x.fillRect(i, 0, 8, h); } }, [60, 1]), roughness: .6, metalness: .2, side: THREE.DoubleSide });
  const STEEL = STD({ color: 0x24402f, roughness: .55, metalness: .3 }), TIMBER = STD({ map: grain('#c79a5c', '120,80,40') });
  const YEL = STD({ color: 0xe3b11c, roughness: .5, metalness: .3 }), ORA = STD({ color: 0xe0601e, roughness: .5, metalness: .3 }), UP = STD({ color: 0x2c3a6a, roughness: .5, metalness: .4 }), UPG = STD({ color: 0x9aa0a6, metalness: .5, roughness: .4 });
  const OSB = STD({ map: tex(256, 256, (x, w, h) => { speckle(x, w, h, '#d8ab6c', .3, 5000); for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(${150 + rnd() * 60},${100 + rnd() * 40},50,.5)`; x.fillRect(rnd() * w, rnd() * h, 8 + rnd() * 20, 3 + rnd() * 6); } }, [3, 2]) });
  // ---- the end wall with the roller door, the yard and the green shed opposite ----
  { const g = grp(ROOT); g.userData.shell = true; const X0 = -8, X1 = 4.6, EAVE = 6, RIDGE = 7.6, mid = (X0 + X1) / 2;
    const sh = new THREE.Shape([[X0, 0], [DOORL, 0], [DOORL, DOORH], [DOORR, DOORH], [DOORR, 0], [X1, 0], [X1, EAVE], [mid, RIDGE], [X0, EAVE]].map(p => new THREE.Vector2(...p)));
    const wall = new THREE.Mesh(new THREE.ShapeGeometry(sh), CLAD); wall.position.z = ZD; g.add(wall);
    box(g, DOORR - DOORL + .4, .5, .55, UPG, (DOORL + DOORR) / 2, DOORH, ZD + .3); for (const x of [DOORL, DOORR]) box(g, .2, DOORH, .2, STEEL, x, 0, ZD + .12);
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshBasicMaterial({ color: 0xf4f7f8 })); sky.position.set(mid, 8, ZD - 18); g.add(sky);
    const yard = new THREE.Mesh(new THREE.PlaneGeometry(40, 18), STD({ color: 0xb3b2ab })); yard.rotation.x = -Math.PI / 2; yard.position.set(mid, .002, ZD - 9); g.add(yard);
    const shed = new THREE.Shape([[-10, 0], [10, 0], [10, 5], [0, 6.5], [-10, 5]].map(p => new THREE.Vector2(...p)));
    const sm = new THREE.Mesh(new THREE.ShapeGeometry(shed), STD({ map: tex(64, 256, (x, w, h) => { for (let i = 0; i < w; i += 8) { const gg = x.createLinearGradient(i, 0, i + 8, 0); gg.addColorStop(0, '#2f6a3e'); gg.addColorStop(.5, '#4f8a5a'); gg.addColorStop(1, '#2f6a3e'); x.fillStyle = gg; x.fillRect(i, 0, 8, h); } }, [40, 1]) })); sm.position.set(mid + 1, 0, ZD - 16); g.add(sm);
    box(g, 22, 1.6, .2, STD({ color: 0xece8e0 }), mid + 1, 0, ZD - 15.8);
    const tree = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 1), STD({ color: 0x6f9a3a, flatShading: true })); tree.position.set(DOORL - .2, 3.2, ZD - 6); g.add(tree);
    // portal frame inside, with the X bracing, and timber purlins
    const fz = ZD + 5.5; for (const x of [X0, X1]) box(g, .3, EAVE, .2, STEEL, x, 0, fz);
    for (const s of [-1, 1]) { const len = Math.hypot((X1 - X0) / 2, RIDGE - EAVE), r = box(g, len, .45, .2, STEEL, 0, 0, fz); r.position.set(mid + s * (X1 - X0) / 4, (EAVE + RIDGE) / 2 - .2, fz); r.rotation.z = -s * Math.atan2(RIDGE - EAVE, (X1 - X0) / 2);
      const b = box(g, 3.2, .1, .1, STEEL, 0, 0, fz); b.position.set(mid + s * 2.2, RIDGE - 1.6, fz); b.rotation.z = s * .75; }
    for (let k = 0; k < 8; k++) for (const s of [-1, 1]) { const t = (k + .5) / 8, px = mid + s * (1 - t) * (X1 - X0) / 2, py = EAVE + t * (RIDGE - EAVE); box(g, .07, .18, 20, TIMBER, px, py + .1, ZD + 6); }
    for (const s of [-1, 1]) { const h = new THREE.Group(); h.position.set(mid + s * (X1 - X0) / 4, (EAVE + RIDGE) / 2 + .32, ZD + 6); h.rotation.z = -s * Math.atan2(RIDGE - EAVE, (X1 - X0) / 2); g.add(h); const r = new THREE.Mesh(new THREE.PlaneGeometry(Math.hypot((X1 - X0) / 2, RIDGE - EAVE), 20), STD({ color: 0x6b6058, side: THREE.DoubleSide })); r.rotation.x = Math.PI / 2; h.add(r); }
    const lamp = new THREE.Mesh(new THREE.CircleGeometry(.25, 20), new THREE.MeshBasicMaterial({ color: 0xffffff })); lamp.rotation.x = Math.PI / 2; lamp.position.set(mid, RIDGE - .5, ZD + 9); g.add(lamp);
    tag(g, 'Roller door end', 'The yard end of the hall: a big roller door (rolled up, drum at the top), the dark green portal frame with X-bracing, timber purlins, and the green shed across the yard.', `door ≈ ${(DOORR - DOORL).toFixed(1)} m wide × ${DOORH} m high (estimate)`, [1, 9, 59, 60], 'fairly sure'); }
  // ---- forklift out by the door, coming in ----
  { const f = buildForklift(); f.position.set(-2.35, 0, -5.4); f.rotation.y = 0; f.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); ROOT.add(f);
    tag(f, 'Forklift FTD 8548', 'The Doosan G15S gas forklift, facing in from the roller door (a second, orange forklift is out in the yard).', '1.07 m wide · 2.16 m guard', [9, 59, 60], 'sure');
    const f2 = grp(ROOT, .6, 0, ZD - 4); box(f2, 1.0, 1.1, 1.8, ORA, 0, .25, 0); box(f2, .9, .06, .9, STD({ color: 0x222222 }), 0, 2.1, -.2); for (const sx of [-1, 1]) box(f2, .06, 1.9, .06, STD({ color: 0x222222 }), sx * .42, .3, .2); }
  // ---- the 12 ft crown crate on the right of the aisle ----
  { const K12 = { w: 1.2, d: 1.0, h: 1.1, n: 12, D: .9, mats: coverMats('c12', '#1d6658', '#eef0e6', '12FT CROWN × 12', { labelSize: 70 }) }; const c = crownCrate(ROOT, K12, .6, 0, -.5); SECRATE.push(c);
    tag(c, '12 ft crown crate', 'Green cover "12FT CROWN × 12": twelve 12 ft yurt crowns on one pallet, near the door.', '1.2 × 1.0 × 1.24 m', [3, 9, 10, 60], 'sure'); }
  // ---- right: yellow-beam racking full of crates, tubs and boxes, with the OSB mezzanine above and a yellow ladder ----
  { const g = grp(ROOT, 2.4, 0, -1.2); const bays = 4, bw = 2.7, dep = 1.1, beams = [.15, 1.4, 2.6, 3.7];
    for (let b = 0; b <= bays; b++) for (const xx of [0, dep]) box(g, .08, 4.6, .08, UP, xx, 0, -b * bw);
    for (let b = 0; b < bays; b++) for (const yy of beams) { for (const xx of [0, dep]) box(g, .05, .12, bw, ORA, xx, yy, -b * bw - bw / 2);
      if (yy < 3.6) for (let k = 0; k < 3; k++) { const kind = rnd(); const z = -b * bw - .45 - k * .88, y = yy + .12;
        if (kind < .35) { box(g, .62, .42, .78, STD({ color: 0xe9eef0, transparent: true, opacity: .7, roughness: .2 }), dep / 2, y, z); box(g, .66, .04, .82, STD({ color: 0xdfe5e8 }), dep / 2, y + .42, z); }
        else if (kind < .7) { box(g, .7, .5, .8, STD({ map: tex(128, 128, (x, w, h) => { x.fillStyle = '#b48a58'; x.fillRect(0, 0, w, h); x.fillStyle = '#8a6a40'; x.fillRect(0, h / 2 - 4, w, 8); x.fillStyle = '#333'; x.font = '14px Arial'; x.fillText('FRAGILE', 30, 30); }) }), dep / 2, y, z); }
        else { box(g, .78, .55, .6, M.pallet, dep / 2, y, z); for (const sz of [-1, 1]) box(g, .05, .05, .02, UPG, dep / 2 - .2 * sz, y + .4, z + .31); } } }
    // mezzanine: OSB box on the racking top with a window
    box(g, dep + 1.6, .2, 9, UPG, dep / 2 + .6, 4.6, -4.5); const osb = box(g, .05, 2.6, 9, OSB, -.05, 4.8, -4.5); box(g, dep + 1.6, 2.6, .05, OSB, dep / 2 + .6, 4.8, -.02);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.0, .8), STD({ color: 0x8fa3b0, metalness: .4, roughness: .1 })); win.position.set(-.08, 6.0, -1.0); win.rotation.y = -Math.PI / 2; g.add(win);
    // yellow fibreglass ladder leaning on the racking
    const lad = grp(g, -.95, 0, -.4); lad.rotation.z = .12; for (const s of [-1, 1]) box(lad, .08, 4.4, .05, YEL, 0, 0, s * .22); for (let i = 0; i < 13; i++) box(lad, .05, .04, .44, UPG, 0, .3 + i * .32, 0); for (const s of [-1, 1]) box(lad, .1, .08, .08, STD({ color: 0xc0392b }), 0, 0, s * .22);
    tag(g, 'Racking + mezzanine store', 'Pallet racking with orange beams (blue uprights) on the right of the door: clear plastic tubs, cardboard boxes, ply flight cases, with an OSB-boarded mezzanine store on top and a yellow fibreglass ladder leaning on the end.', `${bays} bays · ≈ 4.6 m to the mezzanine floor`, [6, 7, 9, 11, 60], 'fairly sure'); }
  // ---- left: racking, lattice gate, leaning trellis and timber, the Bedouin crate tower, a bag on the floor ----
  { const g = grp(ROOT, -6.4, 0, -1.0); const bays = 3, bw = 2.7, dep = 1.1;
    for (let b = 0; b <= bays; b++) for (const xx of [0, dep]) box(g, .08, 3.4, .08, UP, xx, 0, -b * bw);
    for (let b = 0; b < bays; b++) for (const yy of [1.2, 2.3, 3.3]) { for (const xx of [0, dep]) box(g, .05, .11, bw, ORA, xx, yy, -b * bw - bw / 2); for (let k = 0; k < 2; k++) box(g, .9, .5 + rnd() * .3, 1.0, k % 2 ? M.pallet : STD({ color: 0xb48a58 }), dep / 2, yy + .12, -b * bw - .8 - k * 1.2); }
    tag(g, 'Left racking', 'Orange-beam racking along the left wall by the door: boxes, ply crates and a folding lattice gate in front.', '', [9, 13, 60], 'fairly sure');
    const lean = grp(ROOT, -3.6, 0, 1.3, .3); for (let i = 0; i < 6; i++) { const t = box(lean, .7, 2.6, .04, STD({ map: tex(64, 256, (x, w, h) => { x.fillStyle = '#3a2c1f'; x.fillRect(0, 0, w, h); x.strokeStyle = '#b07a46'; x.lineWidth = 6; for (let k = -h; k < h; k += 26) { x.beginPath(); x.moveTo(0, k); x.lineTo(w, k + w); x.moveTo(0, k + w); x.lineTo(w, k); x.stroke(); } }), transparent: true }), i * .14, 0, 0); t.rotation.x = -.35; }
    tag(lean, 'Trellis leaning (left)', 'Folded trellis sections stood on end against the left side, next to a low pile of timber offcuts.', '', [9, 10], 'sure');
    const pile = grp(ROOT, -2.4, 0, -.6, .05); for (let i = 0; i < 9; i++) box(pile, 1.9, .045, 1.0 - rnd() * .2, STD({ color: [0x5a3a26, 0x6a4430, 0x4e3322][i % 3] }), (rnd() - .5) * .1, i * .05, 0);
    tag(pile, 'Floor panels (low stack)', 'A short stack of dark hardwood-faced floor panels on the floor by the aisle.', '≈ 1.9 × 1.0 m', [9, 59, 60], 'fairly sure');
    const bm = coverMats('bed', '#1c1d20', '#e9e9e6', 'BEDOUIN EXTRA', { labelSize: 64 }); const tw = grp(ROOT, -6.0, 0, 2.6, .1); for (let i = 0; i < 3; i++) { pallet(tw, 1.2, 1.0, i * 1.26); const c = coverMesh(1.22, 1.1, 1.02, bm); c.position.y = i * 1.26 + .144 + .55; tw.add(c); }
    tag(tw, 'Black crate tower (Bedouin)', 'Three black-covered Green Yurts crates stacked three high, cling-filmed together on the left of the door.', '≈ 3.8 m tall', [9, 59, 60], 'fairly sure');
    const bag = grp(ROOT, -1.66, 0, 4.9); const b = new THREE.Mesh(new THREE.SphereGeometry(.5, 16, 10), STD({ color: 0xdcdcd6, roughness: .95 })); b.scale.set(1.1, .45, .6); b.position.y = .2; b.castShadow = true; bag.add(b);
    tag(bag, 'Canvas bag (on the floor)', 'A white canvas kit bag left on the floor.', '', [9, 60], 'sure'); }
  let lift = 0, liftWant = 0;
  return { home: [[-.33, 1.51, 7.3], [-1.5, 1.8, -6]], floor: 22,
    buttons: [{ label: 'look inside', fn: () => (liftWant = liftWant ? 0 : 1) }],
    tick: dt => { const was = lift; lift += (liftWant - lift) * Math.min(1, dt * 4); if (Math.abs(lift - was) < 1e-4) return false; SECRATE.forEach(c => c.userData.lift(lift)); return true; },
    photo: { n: 9, cam: __CAM1__ } };
}