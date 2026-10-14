// ===== Main hall: the big portal-frame shed, laid out from Josh's 20 walk-round photos (14 Oct 2026) =====
// Metres. x across the hall (0 = left wall when you walk in from the roller door), z along it (0 = door end), y up.
// Positions are a sketch from photos (no tape yet): every card says which photos show the thing.
const HALL = { W: 20, L: 39, eaves: 6.0, ridge: 7.7, bay: 6.5 };
const INFO = [];
function tag(obj, name, what, size, photos, sure = 'fairly sure') { obj.userData.info = { name, what, size, photos, sure }; INFO.push(obj); return obj; }
const tex = (w, h, draw, rep) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); } return t; };
const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(42);
const noise = (x, w, h, base, amt, n) => { x.fillStyle = base; x.fillRect(0, 0, w, h); for (let i = 0; i < n; i++) { const v = rnd() - .5; x.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) * amt})`; x.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 3, 2 + rnd() * 3); } };
const STD = (o) => new THREE.MeshStandardMaterial({ roughness: .8, ...o });
const M = {
  steel: STD({ color: 0x1e3a2c, roughness: .55, metalness: .3 }),           // the dark green portal frames
  timber: STD({ map: tex(256, 32, (x, w, h) => { noise(x, w, h, '#c79a5c', .18, 600); for (let i = 0; i < 6; i++) { x.strokeStyle = 'rgba(120,80,40,.3)'; x.beginPath(); x.moveTo(0, rnd() * h); x.lineTo(w, rnd() * h); x.stroke(); } }, [4, 1]) }),
  clad: STD({ map: tex(128, 256, (x, w, h) => { for (let i = 0; i < w; i += 16) { const g = x.createLinearGradient(i, 0, i + 16, 0); g.addColorStop(0, '#8d949a'); g.addColorStop(.5, '#c7ccd0'); g.addColorStop(1, '#8d949a'); x.fillStyle = g; x.fillRect(i, 0, 16, h); } }, [60, 4]), roughness: .6, metalness: .2, side: THREE.DoubleSide }),
  roof: STD({ map: tex(64, 128, (x, w, h) => { for (let i = 0; i < w; i += 8) { const g = x.createLinearGradient(i, 0, i + 8, 0); g.addColorStop(0, '#5e5852'); g.addColorStop(.5, '#a59d93'); g.addColorStop(1, '#5e5852'); x.fillStyle = g; x.fillRect(i, 0, 8, h); } }, [90, 8]), side: THREE.DoubleSide }),
  rooflight: new THREE.MeshBasicMaterial({ color: 0xe8f2ff, side: THREE.DoubleSide }),
  floor: STD({ map: tex(512, 512, (x, w, h) => { noise(x, w, h, '#a3a4a2', .12, 20000); x.strokeStyle = 'rgba(40,40,40,.25)'; x.lineWidth = 3; for (let i = 0; i < 26; i++) { x.beginPath(); let px = rnd() * w, py = rnd() * h; x.moveTo(px, py); for (let k = 0; k < 8; k++) { px += (rnd() - .5) * 120; py += 60; x.lineTo(px, py); } x.stroke(); } }, [6, 12]) }),
  pallet: STD({ color: 0xb08a5c }), osb: STD({ map: tex(256, 256, (x, w, h) => { noise(x, w, h, '#d6aa6a', .3, 5000); for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(${150 + rnd() * 60},${100 + rnd() * 40},50,.5)`; x.fillRect(rnd() * w, rnd() * h, 8 + rnd() * 20, 3 + rnd() * 6); } }, [2, 2]) }),
  ply: STD({ map: tex(256, 256, (x, w, h) => { noise(x, w, h, '#9a8466', .2, 3000); for (let i = 0; i < 40; i++) { x.strokeStyle = `rgba(70,55,40,${.15 + rnd() * .2})`; x.lineWidth = 2; x.beginPath(); x.ellipse(rnd() * w, rnd() * h, 20 + rnd() * 80, 6 + rnd() * 20, rnd(), 0, 7); x.stroke(); } }) }),
  purple: STD({ color: 0x5b4a9c, roughness: .5, metalness: .3 }), red: STD({ color: 0x7a2a26, roughness: .55, metalness: .3 }), green: STD({ color: 0x2f6e3a, roughness: .55, metalness: .3 }), lime: STD({ color: 0x6ad13d, roughness: .45, metalness: .2 }),
  yellow: STD({ color: 0xe0b324, roughness: .5, metalness: .3 }), orange: STD({ color: 0xe0601e, roughness: .5, metalness: .3 }), upright: STD({ color: 0x9aa0a6, metalness: .5, roughness: .4 }),
  alu: STD({ color: 0xc9cdd1, metalness: .7, roughness: .3 }), pole: STD({ color: 0xd8b98a }), white: STD({ color: 0xeeeeea }), black: STD({ color: 0x1d1f22 }),
};
// Green Yurts crate covers: coloured fabric, the round badge, the label in white
function coverTex(bg, ink, label, sub) {
  return tex(512, 512, (x, w, h) => { x.fillStyle = bg; x.fillRect(0, 0, w, h); noise(x, w, h, bg, .08, 1500);
    if (label) { x.fillStyle = ink; x.font = '600 44px Arial'; x.fillText(label, 26, 64); if (sub) { x.font = '500 28px Arial'; x.fillText(sub, 26, 102); } }
    const cx = w / 2 + (label ? 30 : 0), cy = h / 2 + 30, R = 150; x.strokeStyle = ink; x.fillStyle = ink;
    for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; x.beginPath(); x.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 9, 0, 7); x.fill(); }
    x.fillStyle = bg; x.beginPath(); x.arc(cx, cy, R - 4, 0, 7); x.fill(); x.lineWidth = 4; x.strokeStyle = ink; x.beginPath(); x.arc(cx, cy, R - 22, 0, 7); x.stroke();
    x.fillStyle = ink; x.font = 'italic bold 140px Georgia'; x.textAlign = 'center'; x.fillText('G', cx, cy + 48); x.font = 'italic 32px Georgia'; x.fillText('Green        Yurts', cx, cy + 10);
    x.font = '600 16px Arial'; x.fillText('KINGS OF GLAMPING · EST 2010', cx, cy - 92); x.textAlign = 'left'; });
}
function box(p, w, h, d, m, x, y, z, ry = 0) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y + h / 2, z); b.rotation.y = ry; b.castShadow = b.receiveShadow = true; p.add(b); return b; }
function cyl(p, r, len, m, x, y, z, axis = 'y', seg = 12) { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), m); c.position.set(x, y, z); if (axis === 'x') c.rotation.z = Math.PI / 2; if (axis === 'z') c.rotation.x = Math.PI / 2; c.castShadow = true; p.add(c); return c; }
function grp(x, z, ry = 0, y = 0) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; scene.add(g); return g; }
function pallet(p, w = 1.2, d = 1.0, y = 0) { box(p, w, .022, d, M.pallet, 0, y + .122, 0); for (const xx of [-w / 2 + .05, 0, w / 2 - .05]) box(p, .1, .1, d, M.pallet, xx, y + .022, 0); box(p, w, .022, d, M.pallet, 0, y, 0); return .144; }

// ---------------- the shed ----------------
function hall() {
  const { W, L, eaves, ridge, bay } = HALL, g = new THREE.Group(); g.name = 'Hall'; scene.add(g);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(W, L), M.floor); fl.rotation.x = -Math.PI / 2; fl.position.set(W / 2, 0, L / 2); fl.receiveShadow = true; g.add(fl);
  // portal frames: columns, haunched rafters, a few braces
  for (let z = 0; z <= L + .01; z += bay) {
    for (const x of [0, W]) box(g, .3, eaves, .2, M.steel, x, 0, z);
    for (const s of [-1, 1]) { const len = Math.hypot(W / 2, ridge - eaves), r = box(g, len, .45, .2, M.steel, 0, 0, z);
      r.position.set(W / 2 + s * W / 4, (eaves + ridge) / 2 - .2, z); r.rotation.z = -s * Math.atan2(ridge - eaves, W / 2); }
    for (const s of [-1, 1]) { const b = box(g, 2.6, .12, .12, M.steel, 0, 0, z); b.position.set(W / 2 + s * 2.4, ridge - 1.2, z); b.rotation.z = s * .8; }
  }
  // roof: two slopes of sheet with timber purlins and a row of roof lights each side
  const slope = Math.hypot(W / 2, ridge - eaves), ang = Math.atan2(ridge - eaves, W / 2);
  for (const s of [-1, 1]) { const h = new THREE.Group(); h.position.set(W / 2 + s * W / 4, (eaves + ridge) / 2 + .25, L / 2); h.rotation.z = -s * ang; g.add(h);
    const r = new THREE.Mesh(new THREE.PlaneGeometry(slope, L), M.roof); r.rotation.x = Math.PI / 2; r.receiveShadow = true; h.add(r);
    for (let k = 0; k < 7; k++) box(h, .07, .2, L, M.timber, -slope / 2 + (k + .5) / 7 * slope, -.23, 0);
    for (let z = 3; z < L; z += 9) { const rl = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.4), M.rooflight); rl.rotation.x = Math.PI / 2; rl.position.set(s * -1.2, -.01, z - L / 2); h.add(rl); } }
  // walls: grey cladding inside, timber posts and girts
  const side = (x, rotY) => { const w = new THREE.Mesh(new THREE.PlaneGeometry(L, eaves), M.clad); w.position.set(x, eaves / 2, L / 2); w.rotation.y = rotY; w.receiveShadow = true; g.add(w);
    for (let yy = 1.2; yy < eaves; yy += 1.15) box(g, .07, .15, L, M.timber, x + (x ? -.08 : .08), yy, L / 2); };
  side(0, Math.PI / 2); side(W, -Math.PI / 2);
  const gable = new THREE.Shape([[0, 0], [W, 0], [W, eaves], [W / 2, ridge], [0, eaves]].map(p => new THREE.Vector2(...p)));
  const end = new THREE.Mesh(new THREE.ShapeGeometry(gable), M.clad); end.position.z = L; end.rotation.y = Math.PI; end.position.x = W; g.add(end);
  for (let xx = 1.6; xx < W; xx += 3.4) box(g, .15, eaves + (ridge - eaves) * (1 - Math.abs(xx - W / 2) / (W / 2)) - .3, .07, M.timber, xx, 0, L - .08);
  for (let yy = 1.2; yy < eaves; yy += 1.15) box(g, W, .15, .07, M.timber, W / 2, yy, L - .12);
  // door end: cladding with the open roller door in the middle (bright yard beyond)
  const dw = 4.6, dh = 4.8, dx = 9.6;
  const door = new THREE.Shape([[0, 0], [dx - dw / 2, 0], [dx - dw / 2, dh], [dx + dw / 2, dh], [dx + dw / 2, 0], [W, 0], [W, eaves], [W / 2, ridge], [0, eaves]].map(p => new THREE.Vector2(...p)));
  const dEnd = new THREE.Mesh(new THREE.ShapeGeometry(door), M.clad); g.add(dEnd);
  const outside = new THREE.Mesh(new THREE.PlaneGeometry(dw * 3, dh * 2), new THREE.MeshBasicMaterial({ color: 0xf2f6f8 })); outside.position.set(dx, dh, -2.5); g.add(outside);
  const bldg = box(g, dw * 3, 4.2, .2, STD({ color: 0x3c7a4c }), dx, 0, -2.2);
  box(g, dw + .3, .55, .5, STD({ color: 0x9aa0a6, metalness: .6 }), dx, dh, .2);       // rolled-up door drum
  // lights
  for (let z = 5; z < L; z += 9) { const l = cyl(g, .25, .12, M.white, W / 2 - 3, ridge - .9, z); const glow = new THREE.Mesh(new THREE.CircleGeometry(.22, 20), new THREE.MeshBasicMaterial({ color: 0xffffff })); glow.rotation.x = Math.PI / 2; glow.position.set(W / 2 - 3, ridge - .97, z); g.add(glow); }
  tag(g, 'Main hall', 'Steel portal-frame shed: dark green frames and rafters, timber purlins and wall girts, grey cladding, roof lights, one big roller door at the yard end. Sizes are my estimate from the photos: tape it and I will rescale.', `≈ ${W} m wide × ${L} m long · eaves ≈ ${eaves} m`, [1, 2, 16, 17, 19], 'not sure');
  return g;
}

// ---------------- kit ----------------
const covers = {};
function cover(key, bg, ink, label, sub) { return covers[key] || (covers[key] = [STD({ map: coverTex(bg, ink, label, sub), roughness: .85 }), STD({ map: coverTex(bg, ink, null), roughness: .85 })]); }
// one crate: pallet + fabric cover. Faces: +z front with the label, sides with the badge
function crate(p, [cfront, cside], x, y, z, w = 1.2, h = .95, d = 1.0, top = null) {
  const g = new THREE.Group(); g.position.set(x, y, z); p.add(g); const ph = pallet(g, w, d);
  const mats = [cside, cside, cside, cside, cfront, cside];
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats); b.position.y = ph + h / 2; b.castShadow = b.receiveShadow = true; g.add(b); return ph + h;
}
function crateStack(name, what, photos, x, z, cols, kind, ry = 0, sure = 'sure', size = '') {
  const g = grp(x, z, ry); const W = kind.w || 1.2, D = kind.d || 1.0;
  for (const [cx, cz, n] of cols) { let y = 0; for (let i = 0; i < n; i++) y += crate(g, kind.mat, cx * (W + .05), y, cz * (D + .05), W, kind.h || .95, D) + .01; }
  return tag(g, name, what, size || `${kind.w || 1.2} × ${kind.d || 1.0} m crates on pallets`, photos, sure);
}
function plyCrate(p, x, y, z, w, h, d, hole) {
  const g = new THREE.Group(); g.position.set(x, y, z); p.add(g); const ph = pallet(g, w, d);
  const logo = STD({ map: tex(512, 512, (c, W, H) => { const img = M.ply.map.image; c.drawImage(img, 0, 0, W, H); c.strokeStyle = '#2a2622'; c.fillStyle = '#2a2622'; c.lineWidth = 6; c.beginPath(); c.arc(W / 2, H / 2, 120, 0, 7); c.stroke(); c.font = 'italic bold 120px Georgia'; c.textAlign = 'center'; c.fillText('G', W / 2, H / 2 + 42); if (hole) { c.fillStyle = '#111'; c.beginPath(); c.arc(W * .8, H * .25, 40, 0, 7); c.fill(); } }) });
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [logo, logo, M.ply, M.ply, logo, logo]); b.position.y = ph + h / 2; b.castShadow = b.receiveShadow = true; g.add(b);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, .05, .04, .02, M.alu, sx * (w / 2 - .1), ph + h - .1, sz * (d / 2 + .01));
  return g;
}
// post pallet (stillage): base frame + four posts; contents drawn by the caller
function stillage(p, mat, x, y, z, w = 2.3, d = 1.35, post = 1.0) {
  const g = new THREE.Group(); g.position.set(x, y, z); p.add(g);
  for (const sz of [-1, 1]) box(g, w, .08, .08, mat, 0, .06, sz * (d / 2 - .04));
  for (const sx of [-1, 1]) box(g, .08, .08, d, mat, sx * (w / 2 - .04), .06, 0);
  for (const xx of [-.4, .4]) box(g, .1, .1, d, mat, xx, .0, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { box(g, .07, post, .07, mat, sx * (w / 2 - .04), .06, sz * (d / 2 - .04)); box(g, .12, .02, .12, mat, sx * (w / 2 - .04), 0, sz * (d / 2 - .04)); }
  return g;
}
const slatTex = tex(256, 128, (x, w, h) => { x.fillStyle = '#3a2c1f'; x.fillRect(0, 0, w, h); for (let i = 0; i < 9; i++) { const y = i * 14 + 3; x.fillStyle = ['#b7854d', '#9c7346', '#c49a62', '#8a6a48'][i % 4]; x.fillRect(0, y, w, 10); for (let k = 0; k < 10; k++) { x.fillStyle = '#111'; x.fillRect(k * 26 + (i % 2) * 13, y + 3, 4, 4); } } });
const trellisMat = STD({ map: slatTex }); slatTex.wrapS = slatTex.wrapT = THREE.RepeatWrapping; slatTex.repeat.set(3, 1);
const doorTex = tex(512, 320, (x, w, h) => { noise(x, w, h, '#c98a3a', .15, 2000); for (let i = 0; i < w; i += 46) { x.fillStyle = 'rgba(90,50,20,.55)'; x.fillRect(i, 0, 3, h); } x.strokeStyle = '#8a5a26'; x.lineWidth = 16; x.strokeRect(8, 8, w - 16, h - 16); x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); x.stroke();
  x.fillStyle = '#151515'; for (const yy of [70, 250]) for (const s of [-1, 1]) { x.fillRect(w / 2 + s * 20 - (s > 0 ? 0 : 150), yy - 6, 150, 12); x.beginPath(); x.arc(w / 2 + s * 170, yy, 8, 0, 7); x.fill(); } x.fillRect(w / 2 - 34, h / 2 - 20, 10, 40); x.fillRect(w / 2 + 24, h / 2 - 20, 10, 40); });
const doorMat = STD({ map: doorTex, roughness: .7 });
function trellisLoad(g, layers, doorsOnTop) {
  let y = .14; for (let i = 0; i < layers; i++) { box(g, 2.25, .1, .62, trellisMat, 0, y, -.33); box(g, 2.25, .1, .62, trellisMat, 0, y, .33); y += .105; }
  if (doorsOnTop) { for (let i = 0; i < doorsOnTop; i++) { box(g, 2.1, .06, 1.25, doorMat, 0, y, 0); y += .065; } const wrap = new THREE.Mesh(new THREE.BoxGeometry(2.3, y, 1.38), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .16, roughness: .1, transmission: .3 })); wrap.position.y = y / 2; g.add(wrap); }
  return y;
}
function stillageStack(name, what, photos, x, z, levels, ry = 0, sure = 'sure') {
  const g = grp(x, z, ry); let y = 0;
  for (const lv of levels) { const s = stillage(g, M.purple, 0, y, 0, 2.3, 1.35, .95); const top = trellisLoad(s, lv.layers || 4, lv.doors || 0); y += Math.max(1.0, top + .05); }
  return tag(g, name, what, `stillages 2.32 × 1.35 m · ${levels.length} high`, photos, sure);
}
function bag(p, x, y, z, w, h, d, col, tagCol) {
  const b = new THREE.Mesh(new THREE.SphereGeometry(.5, 14, 10), STD({ color: col, roughness: .9 })); b.scale.set(w, h, d); b.position.set(x, y + h / 2, z); b.castShadow = true; p.add(b);
  if (tagCol) { const t = new THREE.Mesh(new THREE.PlaneGeometry(.05, .08), new THREE.MeshBasicMaterial({ color: tagCol, side: THREE.DoubleSide })); t.position.set(x + (rnd() - .5) * w * .5, y + h * .55, z + d / 2 + .01); p.add(t); }
}
function postRack(name, what, photos, x, z, mat, levels, fill, ry = 0, w = 1.6, d = 1.1, h = 1.05, sure = 'sure') {
  const g = grp(x, z, ry);
  for (let i = 0; i < levels; i++) { const s = stillage(g, mat, 0, i * h, 0, w, d, h - .02); box(s, w, .02, d, mat, 0, h - .1, 0).material = mat; fill(s, i); }
  return tag(g, name, what, `post pallets ${w} × ${d} m · ${levels} high (≈ ${(levels * h).toFixed(1)} m)`, photos, sure);
}
const bagsFill = (cols, tagCol) => (s) => { for (let k = 0; k < 6; k++) bag(s, -.55 + (k % 3) * .55 + (rnd() - .5) * .1, .12 + Math.floor(k / 3) * .42, (rnd() - .5) * .3, .55, .42, .8, cols[Math.floor(rnd() * cols.length)], tagCol); };
const polesFill = (s, i) => { for (let k = 0; k < 14; k++) { const alu = rnd() < .6; cyl(s, alu ? .025 : .035, alu ? 3.6 : 4.4, alu ? M.alu : M.pole, -.4 + rnd() * .8, .2 + (k % 3) * .07 + rnd() * .05, (rnd() - .5) * .9, 'x', 8); } if (i % 2) bag(s, 0, .35, .1, 1.3, .35, .9, 0xe8e4dc); };
function crown(p, x, y, z, D = 1.0) { const g = new THREE.Group(); g.position.set(x, y, z); p.add(g); const r = new THREE.Mesh(new THREE.TorusGeometry(D / 2, .05, 8, 32), M.pole); r.rotation.x = Math.PI / 2; r.position.y = .12; g.add(r); const r2 = r.clone(); r2.scale.setScalar(.82); r2.position.y = .22; g.add(r2); for (let i = 0; i < 4; i++) { const sp = box(g, D, .05, .05, M.pole, 0, .2, 0); sp.rotation.y = i * Math.PI / 4; } return g; }
function ibc(p, x, y, z) { const g = new THREE.Group(); g.position.set(x, y, z); p.add(g); pallet(g, 1.2, 1.0); const t = box(g, 1.1, .95, .95, STD({ color: 0xe8e6dc, roughness: .4, transparent: true, opacity: .92 }), 0, .15, 0); const cage = new THREE.Mesh(new THREE.BoxGeometry(1.16, .98, 1.0, 6, 5, 5), new THREE.MeshStandardMaterial({ color: 0x9a9fa3, wireframe: true, metalness: .6 })); cage.position.y = .15 + .49; g.add(cage); return 1.14; }
function rack(name, what, photos, x, z, bays, beams, mat, depth = 1.1, bayW = 2.7, ry = 0, fillFn) {
  const g = grp(x, z, ry), H = beams[beams.length - 1] + 1.4;
  for (let b = 0; b <= bays; b++) for (const zz of [-depth / 2, depth / 2]) { box(g, .08, H, .08, M.upright, b * bayW, 0, zz); }
  for (let b = 0; b < bays; b++) for (const yy of beams) for (const zz of [-depth / 2, depth / 2]) { const bm = box(g, bayW, .11, .05, mat, b * bayW + bayW / 2, yy, zz); if (fillFn && zz < 0) fillFn(g, b * bayW + bayW / 2, yy + .11, b, yy); }
  return tag(g, name, what, `${bays} bays × ${bayW} m · beams at ${beams.map(v => v.toFixed(1)).join(' / ')} m`, photos, 'fairly sure');
}
function flightCase(p, x, y, z, w = .78, h = .55, d = .6) { const b = box(p, w, h, d, M.ply, x, y, z); for (const s of [-1, 1]) box(p, .12, .04, .02, M.alu, x + s * w * .25, y + h * .7, z + d / 2 + .01); return b; }

function layout() {
  const X = HALL.W;
  // ---- door end, left: mezzanine office, yellow racking with flight cases, bin racking
  { const g = grp(0, 0); box(g, 5.6, 3.0, .08, M.osb, 2.8, 3.1, 5.6); box(g, .08, 3.0, 5.6, M.osb, 5.6, 3.1, 2.8); box(g, 5.6, .2, 5.6, M.steel, 2.8, 2.9, 2.8);
    const hole = box(g, 2.4, 1.3, .1, M.black, 2.4, 3.7, 5.66); for (let i = 0; i < 4; i++) bag(g, 1.4 + i * .5, 3.15, 4.9, .5, .38, .6, 0x3e5a3c, 0x9cff3a);
    tag(g, 'Mezzanine store (OSB)', 'Boxed-in mezzanine above the racking by the roller door: OSB walls, an opening with bell tent bags on green post pallets inside, flight cases on the racking beside it.', '≈ 5.6 × 5.6 m · floor ≈ 3 m up', [7, 11], 'fairly sure'); }
  rack('Yellow pallet racking: flight cases', 'Pallet racking with yellow beams and grey uprights. Ply flight cases with latches and handles (marked PM), clear storage boxes, blue crates; a grey plastic pallet box of cables and a dark timber chest on the floor; ladders at the end.', [6, 9], .8, 11.0, 2, [1.25, 2.6], M.yellow, 1.1, 2.6, Math.PI / 2,
    (g, x, y, b, yy) => { for (let k = 0; k < 3; k++) flightCase(g, x - .8 + k * .8, y, 0); });
  { const g = grp(1.8, 12.6); let y = 0; for (let i = 0; i < 3; i++) y += ibc(g, 0, y, 0); tag(g, 'IBC water tanks (stacked)', 'Caged 1,000 L IBC tanks, three high against the wall.', '1.2 × 1.0 × 1.15 m each', [3], 'sure'); }
  { const g = grp(1.0, 15.2, Math.PI / 2); let y = 0; for (let i = 0; i < 3; i++) { const s = stillage(g, M.purple, 0, y, 0, 2.3, 1.35, .95); trellisLoad(s, 4, 0); y += 1.0; } tag(g, 'Trellis stillages (wall stack)', 'Purple stillages of folded trellis stacked three high along the left wall.', 'stillages 2.32 × 1.35 m', [3, 20], 'fairly sure'); }
  crateStack('12 ft crown crate', 'Green crate cover "12FT CROWN × 12" with a check sheet on the front (dated 10/9/26, notes "1 missing").', [3, 9, 10], 4.6, 6.6, [[0, 0, 1]], { mat: cover('c12', '#1f6b5c', '#f2efe6', '12FT CROWN × 12') }, 0, 'sure', '≈ 1.2 × 1.0 × 1.1 m');
  { const g = grp(3.0, 11.9); for (let i = 0; i < 14; i++) { const r = box(g, 1.25, .06, .85, STD({ map: tex(128, 128, (x, w, h) => { x.fillStyle = '#d9dbd9'; x.fillRect(0, 0, w, h); x.strokeStyle = '#4b4f52'; x.lineWidth = 3; for (let k = -w; k < w * 2; k += 18) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + h, h); x.moveTo(k + h, 0); x.lineTo(k, h); x.stroke(); } }) }), 0, i * .06, 0); r.rotation.y = (rnd() - .5) * .1; }
    tag(g, 'Rugs (folded, strapped)', 'Grey and white diamond-pattern rugs folded flat and strapped in a pile: yurt floor rugs.', '≈ 1.25 × 0.85 m · 14 deep', [3, 10, 19], 'fairly sure'); }
  { const g = grp(4.7, 13.4); plyCrate(g, 0, 0, 0, 2.2, 1.05, 1.15); bag(g, .3, 1.2, 0, 1.0, .18, .4, 0x3fae86); tag(g, 'Plywood crate (GY logo)', 'Big ply crate with clips and the Green Yurts badge burnt on; a rolled green canvas on top.', '≈ 2.2 × 1.15 × 1.2 m', [1, 3, 16, 19], 'sure'); }
  { const g = grp(3.4, 15.9); box(g, 3.0, .05, 1.3, M.red, 0, 1.2, 0); for (const sx of [-1.45, 1.45]) for (const sz of [-.6, .6]) box(g, .06, 2.4, .06, M.red, sx, 0, sz); tag(g, 'Bare post-pallet frame', 'A red frame rack holding a pallet of rugs and a red pallet on top, next to the white crates.', '', [3, 19], 'fairly sure'); }
  crateStack('White crates (bell tent canvases?)', 'White covers with the black Green Yurts badge, two high on pallets. The label side was out of shot: tell me what is in these.', [1, 3, 11, 16, 19], 4.0, 16.3, [[0, 0, 2], [1.05, 0, 2]], { mat: cover('w', '#f1f0ec', '#151515', null), h: 1.05 }, 0, 'not sure');
  crateStack('12 ft crowns: green crates', 'Green covers "12FT CROWN × 12": crates of twelve 12 ft yurt crowns each, two high.', [1, 11, 16, 19], 7.0, 16.2, [[0, 0, 2], [0, 1.05, 2]], { mat: cover('c12', '#1f6b5c', '#f2efe6', '12FT CROWN × 12') }, Math.PI / 2, 'sure', '≈ 1.2 × 1.0 × 1.1 m each');
  { const g = grp(7.2, 19.6, .1); for (const s of [0, 1]) { let y = 0; for (let i = 0; i < 20; i++) { box(g, 2.0 - rnd() * .3, .04, 1.2 - rnd() * .2, STD({ color: [0x5a3a26, 0x6a4430, 0x4e3322][i % 3] }), s * 1.3 - .65 + (rnd() - .5) * .1, y, (rnd() - .5) * .1); y += .045; } }
    tag(g, 'Floor panels (stacked)', 'Dark hardwood-faced floor panels with battens underneath, stacked on pallets and strapped: yurt floor sections.', '≈ 2.0 × 1.2 m · ~20 high', [1, 11, 16, 19], 'fairly sure'); }
  // red canvas crates, three groups, four or five high, with timber racks between and behind
  const redC = cover('r16', '#8f2a2c', '#f4ece6', '16ft CANVAS', 'yurt canvas');
  crateStack('16 ft canvas crates (red)', 'Red covers marked "16ft CANVAS" with number ranges on the front (11–15, 41–45, 16–20, 1–5, 36–40, 21–25): yurt canvases, stacked four or five high.', [1, 2, 15, 17, 19, 25, 39], 6.3, 23.4, [[0, 0, 5], [1, 0, 4], [0, 1, 4], [1, 1, 3]], { mat: redC, h: .82 }, Math.PI / 2, 'sure', '≈ 1.2 × 1.0 × 0.95 m each');
  crateStack('16 ft canvas crates (red, far corner)', 'More red "16ft CANVAS" crates in the far-left corner, five high.', [2, 15], 4.2, 32.2, [[0, 0, 5], [1, 0, 5], [0, 1, 4], [1, 1, 5]], { mat: redC, h: .82 }, 0, 'sure');
  postRack('Timber racks (red post pallets)', 'Red post pallets stacked five high along the left wall, loaded with long timber: yurt rafters/roof poles and boards.', [2, 15], 1.0, 27.5, M.red, 5, (s) => { for (let k = 0; k < 18; k++) box(s, 3.0, .05, .09, M.timber, (rnd() - .5) * .2, .12 + (k % 4) * .05, -.45 + Math.floor(k / 4) * .2); }, Math.PI / 2, 1.6, 1.0, 1.05, 'fairly sure');
  stillageStack('Trellis stillages (far left)', 'Purple stillages of folded trellis, four high.', [15], 2.6, 36.5, [{}, {}, {}, {}], 0);
  // ---- door end, right: Oven and Bedouin crates, trellis leaning, cushions
  const blk = (lab) => cover('k' + lab, '#1b1c1e', '#e9e9e6', lab);
  crateStack('Oven crates', 'Black covers marked "OVEN", three high on pallets: the wood-fired ovens.', [10], 17.6, 7.0, [[0, 0, 3]], { mat: blk('OVEN'), h: 1.05 }, -Math.PI / 2, 'sure', '≈ 1.2 × 1.0 × 1.2 m each');
  { const g = grp(15.6, 8.2); const s0 = stillage(g, M.purple, 0, 0, 0); trellisLoad(s0, 6, 0); for (let i = 0; i < 3; i++) { const t = box(g, .7, 2.4, .1, trellisMat, -.6 + i * .6, 0, -1.1); t.rotation.x = -.18; }
    tag(g, 'Trellis leaning + stillage', 'Trellis sections stood up leaning on the Oven crates, and a stillage of trellis on the floor in front with a purple post lying on top.', '', [9, 10], 'sure'); }
  crateStack('Bedouin Extra crates', 'Black covers marked "BEDOUIN EXTRA" with dated check sheets: Bedouin tent kit.', [5], 18.6, 11.0, [[0, 0, 3], [0, 1.05, 2]], { mat: blk('BEDOUIN EXTRA'), h: 1.05 }, -Math.PI / 2, 'sure', '≈ 1.2 × 1.0 × 1.2 m each');
  { const g = grp(18.6, 13.4, -Math.PI / 2); plyCrate(g, 0, 0, 0, 1.2, 1.05, 1.1, true); plyCrate(g, 0, 1.2, 0, 1.2, 1.05, 1.1); tag(g, 'Ply crate with round hole', 'Plywood crate with a round hole in the top corner (looks stencilled "BEDOUIN RECEPTION"), with another ply crate.', '', [5], 'not sure'); }
  crateStack('14 ft crowns: green crates', 'Green covers "14FT CROWN × 5": five 14 ft yurt crowns per crate, stacked three high.', [5, 12], 18.4, 15.6, [[0, 0, 3], [0, 1.05, 3], [1.05, 0, 2]], { mat: cover('c14', '#1f6b5c', '#f2efe6', '14FT CROWN × 5') }, -Math.PI / 2, 'sure', '≈ 1.2 × 1.0 × 1.1 m each');
  { const g = grp(15.4, 12.2, .3); stillage(g, M.lime, 0, 0, 0, 1.25, 1.0, 1.0); stillage(g, M.lime, 1.6, 0, .4, 1.25, 1.0, 1.0); tag(g, 'Lime-green stillages (empty)', 'Bright lime post pallets standing empty: new-looking, ready to load.', '≈ 1.25 × 1.0 m', [5, 12], 'sure'); }
  { const g = grp(16.2, 10.6); for (let i = 0; i < 6; i++) box(g, 1.2, .16, .6, STD({ color: 0x23262b }), 0, .14 + i * .17, 0); pallet(g); tag(g, 'Black cushions on pallets', 'Dark grey/black foam cushions or mattress pads stacked on pallets beside the crown crates.', '≈ 1.2 × 0.6 m', [5], 'fairly sure'); }
  // ---- right side, middle: 16 ft crowns, blue canvas crate, bulk bags, bag racks, door stillages
  crateStack('16 ft crowns: green crates', 'Green covers "16FT CROWN × 5", stacked up to three high.', [4, 12], 18.4, 19.4, [[0, 0, 3], [1.05, 0, 3], [0, 1.05, 2], [1.05, 1.05, 1]], { mat: cover('c16', '#1f6b5c', '#f2efe6', '16FT CROWN × 5') }, -Math.PI / 2, 'sure', '≈ 1.2 × 1.0 × 1.1 m each');
  crateStack('12 ft canvas crate (blue)', 'Blue cover marked "12ft CANVAS" with a number range (looks like 10–18).', [11, 12], 15.3, 18.0, [[0, 0, 1]], { mat: cover('b12', '#1f3f9a', '#f2f2f2', '12ft CANVAS', '10–18') }, -Math.PI / 2, 'sure');
  { const g = grp(15.6, 16.2); crown(g, 0, 1.2, 0, 1.0); crown(g, .2, 1.45, .1, .9); box(g, 1.2, 1.1, 1.0, STD({ color: 0x202224 }), 0, 0, 0); tag(g, 'Yurt crowns (loose)', 'Spare yurt crowns, the slotted timber rings, sat on top of black crates.', '≈ 0.9–1.0 m across', [12, 20], 'sure'); }
  { const g = grp(14.0, 19.6); for (let i = 0; i < 3; i++) { const s = stillage(g, M.green, 0, 0, i * 1.25 - 1.25, 1.2, 1.1, .9); bag(s, 0, .12, 0, 1.0, .75, .9, 0xeceae2); }
    tag(g, 'Bulk bags on green stillages', 'White builders\' bulk bags (FIBC) and canvas bags strapped on green post pallets.', '≈ 1.2 × 1.1 m', [1, 12, 19], 'fairly sure'); }
  postRack('Bell tent bags: green, lime tags', 'Green post-pallet racks stacked six high, full of dark green bell tent bags each with a lime-green tag.', [4, 12, 20, 32, 33, 34], 18.7, 23.6, M.green, 6, bagsFill([0x3d4f3a, 0x46583f, 0x34452f], 0x9cff3a), -Math.PI / 2, 1.6, 1.1, .95, 'sure');
  postRack('Bell tent bags: grey', 'Green post-pallet racks of pale grey bags.', [4], 18.7, 25.4, M.green, 4, bagsFill([0xb7bbb9, 0xa9aeac], null), -Math.PI / 2, 1.6, 1.1, .95, 'fairly sure');
  postRack('Bell tent bags: pink/beige, red tags', 'Green racks of beige and pink canvas bags with red tags, four high.', [4, 8, 18], 18.7, 27.2, M.green, 4, bagsFill([0xd8b8a6, 0xc9a58e, 0xb79a7e], 0xff3b3b), -Math.PI / 2, 1.6, 1.1, .95, 'sure');
  postRack('Canvas bags: pink, lime tags', 'Green racks of pink canvas bags with lime tags (the stack behind the red racks).', [8, 18], 18.7, 29.0, M.green, 5, bagsFill([0xe2c2b2, 0xd6b29e], 0x9cff3a), -Math.PI / 2, 1.6, 1.1, .95, 'fairly sure');
  stillageStack('Door stillages: 16 ft doors', 'Purple stillages of folded trellis with yurt door sets laid flat on top and cling-filmed: pine boards, black strap hinges.', [4, 22, 34, 35, 36], 15.0, 23.4, [{ layers: 5, doors: 3 }], Math.PI / 2);
  stillageStack('Door stillages (second)', 'Another stillage of trellis with door sets on top, cling-filmed.', [4], 15.0, 26.0, [{ layers: 6, doors: 2 }], Math.PI / 2);
  stillageStack('Trellis stillages (three high)', 'Purple stillages stacked three high, trellis with door sets on top.', [20, 11], 14.4, 29.5, [{ layers: 4, doors: 1 }, { layers: 4, doors: 1 }, { layers: 4, doors: 1 }], Math.PI / 2);
  // ---- far end: the pole tower, door stillages, pink pallet, timber
  postRack('Pole tower (red post pallets)', 'Red post pallets stacked five high in the middle of the end wall: aluminium tubes, long timber poles sticking out both ends, canvas and jute bags, black boxes, a crown on top.', [1, 2, 16, 17, 19, 24, 26], 10.6, 36.6, M.red, 5, polesFill, 0, 2.4, 1.2, 1.15, 'sure');
  { const g = grp(10.0, 33.6); box(g, 1.2, .14, .8, STD({ color: 0xc0567a }), 0, 0, 0); tag(g, 'Pink plastic pallet', 'A pink plastic pallet left on the floor.', '1.2 × 0.8 m', [1, 2], 'sure'); }
  stillageStack('Door stillage by the pole tower', 'Purple stillage with yurt doors on top and a ratchet strap with a big ring hook, next to bulk bags.', [1, 2, 16, 17], 13.2, 35.0, [{ layers: 4, doors: 3 }], 0);
  { const g = grp(7.6, 38.2); for (let i = 0; i < 16; i++) box(g, 3.2, .05, .12, M.timber, (rnd() - .5) * .2, (i % 4) * .05, -.4 + Math.floor(i / 4) * .14); stillage(g, M.purple, 0, 0, 0, 3.0, .7, .3); tag(g, 'Timber lengths on the floor', 'Planed timber lengths in a low stillage against the end wall.', '≈ 3.2 m long', [1, 2], 'fairly sure'); }
  // ---- far right corner: red racks of poles and coir, timber against the wall
  postRack('Red racks: aluminium poles + coir', 'Red post pallets with aluminium poles, rolled coir/jute matting, white canvas bags, black boxes and a mesh cage marked "6×6" (a 6 × 6 m stretch or marquee kit?).', [8, 18], 17.0, 34.8, M.red, 4, polesFill, 0, 2.2, 1.2, 1.1, 'sure');
  { const g = grp(19.3, 36.8); for (let i = 0; i < 26; i++) box(g, .1, .05, 3.6, M.timber, (rnd() - .5) * .3, i * .05, 0); tag(g, 'Timber stack against the wall', 'Planed timber stacked on battens against the far right wall.', '≈ 3.6 m long', [18], 'fairly sure'); }

  // ---- added from the second batch of photos and the walk-round video ----
  crateStack('Tipi canvas crates (blue)', 'Blue covers marked "5 × TIPI CANVAS": five tipi canvases per crate, two high, next to the 16 ft crowns.', [29, 31, 34], 16.2, 21.4, [[0, 0, 2]], { mat: cover('tipi', '#1f3f9a', '#f2f2f2', '5 × TIPI CANVAS') }, -Math.PI / 2, 'sure', '≈ 1.2 × 1.0 × 1.1 m each');
  crateStack('14 ft canvas crates (red)', 'Red covers marked "14ft CANVAS" with ranges 8–12, 13–17, 18–22, 28–32: 14 ft yurt canvases, stacked against the far wall.', [27], 2.4, 22.0, [[0, 0, 4], [1, 0, 1]], { mat: cover('r14', '#8f2a2c', '#f4ece6', '14ft CANVAS', 'yurt canvas'), h: .82 }, Math.PI / 2, 'sure', '≈ 1.2 × 1.0 × 0.95 m each');
  postRack('Rafter racks (blue post pallets)', 'Blue post pallets stacked six high, full of yurt roof rafters strapped in bundles.', [27], 1.0, 19.0, STD({ color: 0x2c4fa0, roughness: .5, metalness: .3 }), 6, (s) => { for (let k = 0; k < 16; k++) box(s, 2.6, .045, .07, M.timber, (rnd() - .5) * .2, .12 + (k % 4) * .05, -.45 + Math.floor(k / 4) * .22); }, Math.PI / 2, 1.6, 1.0, .9, 'sure');
  { const g = grp(17.4, 18.0); for (let lv = 0; lv < 2; lv++) { const s = stillage(g, M.red, 0, 2.3 + lv * 1.05, 0, 1.2, 1.0, 1.0); box(s, 1.1, .9, .9, STD({ color: 0xd9822e, roughness: .9, transparent: true, opacity: .55 }), 0, .1, 0); for (let k = 0; k < 4; k++) box(s, .5, .25, .38, M.black, -.27 + (k % 2) * .54, .12 + Math.floor(k / 2) * .27, -.2); }
    tag(g, 'Orange mesh cages (black crates)', 'Red post pallets with orange mesh sides, holding black stacking crates and baskets, two high on top of the crown crates.', '≈ 1.2 × 1.0 m', [28, 29, 31], 'fairly sure'); }
  { const g = grp(18.6, 17.0); for (let i = 0; i < 8; i++) pallet(g, 1.2, .8, 2.3 + i * .15); for (let i = 0; i < 6; i++) box(g, 1.0, .14, .55, STD({ color: 0x2a2c30 }), .1, 2.3 + i * .15, -.9);
    for (let k = 0; k < 8; k++) cyl(g, .045, 3.2, M.pole, -.4 + (k % 4) * .2, 2.4 + Math.floor(k / 4) * .12, -.3, 'x', 10);
    tag(g, 'Pallets, cushions and roof poles (top)', 'Up on top of the crown crates: a stack of empty pallets, black cushion pads, and round timber roof poles laid across.', '', [28, 31], 'fairly sure'); }
  { const g = grp(15.0, 15.2, .2); for (let i = 0; i < 4; i++) { const c = crown(g, 0, 0, 0, 1.0); c.rotation.x = Math.PI / 2; c.position.set(i * .12, .5, 0); } tag(g, 'Crowns stood on edge', 'Spare yurt crowns (the slotted rings) stood on edge against the crown crates.', '≈ 1.0 m across', [28, 31, 38], 'sure'); }
  { const g = grp(2.8, 3.0); box(g, 2.4, .9, .7, M.timber, 0, 0, -1.6); box(g, 2.6, .05, .75, M.osb, 0, .9, -1.6); const wall = box(g, 4.4, 2.0, .04, STD({ map: tex(256, 128, (x, w, h) => { x.drawImage(M.osb.map.image, 0, 0, w, h); x.fillStyle = '#222'; for (let i = 0; i < 26; i++) x.fillRect(10 + i * 9, 30 + (i % 5) * 14, 4, 18 + (i % 3) * 6); }) }), 0, 1.0, -2.05);
    box(g, .6, 1.0, .5, STD({ color: 0xe3b81f }), 1.7, 0, -1.6); box(g, .5, .9, .5, M.black, -1.8, 0, -1.4); for (let i = 0; i < 5; i++) box(g, 1.6, .03, .4, M.timber, -.4, 2.2 + i * .14, -1.9);
    tag(g, 'Workshop under the mezzanine', 'Boxed-in workshop under the mezzanine: long timber bench, OSB tool wall with hand tools hanging, a yellow COSHH cabinet, a wheelie bin, shelves of timber offcuts, strip lights. Seen in your walk-round video (frame shown).', '≈ 5 × 5 m', [40], 'fairly sure'); }
  // forklift near the door
  { const f = buildForklift(); f.position.set(12.4, 0, 4.2); f.rotation.y = Math.PI * .85; f.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); scene.add(f);
    tag(f, 'Forklift FTD 8548', 'The Doosan/Daewoo G15S gas forklift (same one as the yard page): black mast with DAEWOO on it, Calor bottle on the back.', '1.07 m wide · 2.16 m guard', [7, 9, 10], 'sure'); }
}
