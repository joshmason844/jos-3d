// ===== detailed yard model (metres; x along racking from upright 0, y up, z out of the rack face) =====
const INFO = []; // every tappable thing: { obj, name, what, size, sure }
function tagIt(obj, name, what, size, sure = 'sure', anchor) { obj.userData.info = { name, what, size, sure }; obj.userData.anchor = anchor; INFO.push(obj); return obj; }
const canvasTex = (w, h, draw, rep = [1, 1]) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; return t; };
const noise = (x, w, h, base, amt, n = 9000) => { x.fillStyle = base; x.fillRect(0, 0, w, h); for (let i = 0; i < n; i++) { const v = (Math.random() - .5) * amt; x.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v)})`; x.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); } };
const STD = (c, r = .8, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...o });
// textures
const T = {
  concrete: canvasTex(512, 512, (x, w, h) => { noise(x, w, h, '#9a9c9c', .16, 26000); for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(60,60,55,${Math.random() * .12})`; x.beginPath(); x.ellipse(Math.random() * w, Math.random() * h, 10 + Math.random() * 60, 6 + Math.random() * 30, Math.random() * 3, 0, 7); x.fill(); } }, [8, 8]),
  cladding: canvasTex(256, 64, (x, w, h) => { x.fillStyle = '#272e35'; x.fillRect(0, 0, w, h); for (let i = 0; i < w; i += 32) { const g = x.createLinearGradient(i, 0, i + 32, 0); g.addColorStop(0, '#20262c'); g.addColorStop(.5, '#3a434c'); g.addColorStop(1, '#20262c'); x.fillStyle = g; x.fillRect(i + 4, 0, 14, h); } }, [40, 3]),
  roof: canvasTex(256, 64, (x, w, h) => { noise(x, w, h, '#8f8f88', .1, 3000); for (let i = 0; i < w; i += 16) { x.fillStyle = 'rgba(40,40,40,.35)'; x.fillRect(i, 0, 5, h); x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(i + 8, 0, 3, h); } }, [50, 4]),
  upright: canvasTex(32, 256, (x, w, h) => { x.fillStyle = '#c9ced2'; x.fillRect(0, 0, w, h); x.fillStyle = '#3b4148'; for (let y = 4; y < h; y += 14) { x.fillRect(9, y, 5, 8); x.fillRect(19, y, 5, 8); } }, [1, 12]),
  ribs: canvasTex(256, 128, (x, w, h) => { x.fillStyle = '#2a3038'; x.fillRect(0, 0, w, h); for (let i = 0; i < w; i += 9) { const g = x.createLinearGradient(i, 0, i + 9, 0); g.addColorStop(0, '#1b2026'); g.addColorStop(.5, '#8a96a3'); g.addColorStop(1, '#1b2026'); x.fillStyle = g; x.fillRect(i, 0, 9, h); } x.fillStyle = '#dfe3e7'; x.fillRect(0, 0, w, 5); x.fillRect(0, h - 5, w, 5); }, [2, 1]),
  pine: canvasTex(256, 256, (x, w, h) => { noise(x, w, h, '#c4823c', .08, 4000); for (let y = 0; y < h; y += 32) { x.fillStyle = 'rgba(90,50,20,.45)'; x.fillRect(0, y, w, 2); for (let k = 0; k < 6; k++) { x.strokeStyle = 'rgba(120,70,30,.25)'; x.beginPath(); x.moveTo(0, y + 6 + k * 4); x.bezierCurveTo(w * .3, y + 2 + k * 4, w * .6, y + 12 + k * 4, w, y + 6 + k * 4); x.stroke(); } } }),
  ply: canvasTex(256, 256, (x, w, h) => { noise(x, w, h, '#c7a27a', .1, 5000); for (let k = 0; k < 18; k++) { x.strokeStyle = 'rgba(140,100,60,.25)'; x.lineWidth = 3; x.beginPath(); const y = Math.random() * h; x.moveTo(0, y); x.bezierCurveTo(w * .3, y - 20, w * .6, y + 20, w, y); x.stroke(); } }),
  pallet: canvasTex(128, 64, (x, w, h) => noise(x, w, h, '#a8875c', .14, 1500)),
  card: canvasTex(512, 256, (x, w, h) => { noise(x, w, h, '#b5926a', .07, 3000); x.fillStyle = '#3a2a1c'; x.font = 'bold 34px Arial'; x.fillText('CANVAS TENT', 30, 70); x.font = '20px Arial'; x.fillText('5 M BELL · COTTON', 32, 100); x.fillStyle = '#eee'; x.fillRect(360, 150, 110, 70); x.fillStyle = '#e8e2d6'; x.fillRect(120, 0, 10, h); x.fillRect(360, 0, 10, h); }),
  khana: canvasTex(512, 64, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = '#c99358'; x.lineWidth = 7; for (let i = -64; i < w + 64; i += 34) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 64, h); x.stroke(); x.beginPath(); x.moveTo(i + 64, 0); x.lineTo(i, h); x.stroke(); } x.fillStyle = '#5a3a1e'; for (let i = 0; i < w; i += 34) x.fillRect(i + 30, h / 2 - 3, 6, 6); }, [1, 1]),
  label: canvasTex(128, 32, (x, w, h) => { x.fillStyle = '#f4d23c'; x.fillRect(0, 0, w, h); x.fillStyle = '#222'; x.font = 'bold 18px monospace'; x.fillText('1DD02' + Math.floor(Math.random() * 90 + 10), 8, 22); }),
};
const MAT = {
  orange: STD(0xd2531c, .5, { metalness: .35 }), upright: STD(0xffffff, .45, { metalness: .5, map: T.upright }), galv: STD(0xb8c0c8, .4, { metalness: .65 }),
  ribs: STD(0xffffff, .45, { map: T.ribs, metalness: .2 }), pine: STD(0xffffff, .7, { map: T.pine }), ply: STD(0xffffff, .8, { map: T.ply }), pallet: STD(0xffffff, .9, { map: T.pallet }),
  bluePallet: STD(0x1f4f8f, .6), card: STD(0xffffff, .9, { map: T.card }), cardPlain: STD(0xb08c62, .9), steelDark: STD(0x2b3036, .5, { metalness: .6 }),
  strapBlue: STD(0x2d6fd6, .6), strapRed: STD(0xd23a3a, .6), black: STD(0x15181c, .6), stainless: STD(0xd8dde2, .25, { metalness: .9 }),
  green: STD(0x3f6b3a, .6), jerry: STD(0x4b6b34, .55), hose: STD(0x7fb59a, .5), yellow: STD(0xe0b11c, .5), red: STD(0xc8352a, .45), tyre: STD(0x1b1b1b, .85),
  rim: STD(0x9aa0a6, .4, { metalness: .7 }), bench: STD(0x6e4a2e, .75), shs: STD(0x7a3d2c, .55, { metalness: .5 }), shs2: STD(0x5a4a8a, .5, { metalness: .5 }),
  labelM: new THREE.MeshBasicMaterial({ map: T.label }), bag: STD(0xe9e4da, .95), bagDark: STD(0x5e5f52, .95), white: STD(0xf0f0ec, .7),
  steelFrame: STD(0x3a5a46, .55, { metalness: .5 }), purlin: STD(0x8a6a44, .8), roof: STD(0xffffff, .9, { map: T.roof, side: THREE.DoubleSide }),
  clad: STD(0xffffff, .85, { map: T.cladding }), floor: STD(0xffffff, .95, { map: T.concrete }), cable: STD(0x111111, .6), lamp: STD(0xff9a1f, .4, { emissive: 0xff7a00, emissiveIntensity: .6 }),
};
const box = (w, h, d, m, x, y, z, ry = 0, p = modelSet) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y + h / 2, z); o.rotation.y = ry; o.castShadow = o.receiveShadow = true; p.add(o); return o; };
const cyl = (r1, r2, h, m, x, y, z, p = modelSet, seg = 16) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m); o.position.set(x, y + h / 2, z); o.castShadow = o.receiveShadow = true; p.add(o); return o; };
const grp = (x = 0, y = 0, z = 0, ry = 0, p = modelSet) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; p.add(g); return g; };
function pallet(p, x, y, z, w = 1.2, d = 1.0, m = MAT.pallet) { const g = grp(x, y, z, 0, p); for (let i = 0; i < 5; i++) box(w, .022, .1, m, 0, .122, -d / 2 + .05 + i * (d - .1) / 4, 0, g); for (const zz of [-d / 2 + .05, 0, d / 2 - .05]) box(w, .022, .1, m, 0, .1 - .022, zz, 0, g); for (const xx of [-w / 2 + .05, 0, w / 2 - .05]) for (const zz of [-d / 2 + .05, 0, d / 2 - .05]) box(.1, .078, .1, m, xx, 0, zz, 0, g); box(w, .022, d, m, 0, 0, 0, 0, g).scale.set(1, 1, 1); return g; }
const RD = 1.1; // rack depth

// ---------- building: concrete floor, clad back wall, steel portal frames, timber purlins, corrugated roof ----------
{ const f = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), MAT.floor); f.rotation.x = -Math.PI / 2; f.position.set(1.5, 0, 9.5); f.receiveShadow = true; modelSet.add(f); tagIt(f, 'Concrete floor', 'Power-floated slab. The clear patch in front of the racking is about 5.5 × 4.5 m.', '≈ 5.5 × 4.5 m clear');
  const w = new THREE.Mesh(new THREE.PlaneGeometry(26, 7.2), MAT.clad); w.position.set(1.5, 3.6, -1.3); w.receiveShadow = true; modelSet.add(w); tagIt(w, 'Back wall', 'Dark profiled steel cladding on the portal frame.', 'eaves ≈ 6.9 m');
  const pitch = THREE.MathUtils.degToRad(8), roof = new THREE.Group(); roof.position.set(0, 6.9, -1.3); roof.rotation.x = -pitch; modelSet.add(roof);
  const rs = new THREE.Mesh(new THREE.PlaneGeometry(26, 16), MAT.roof); rs.rotation.x = Math.PI / 2; rs.position.set(1.5, .32, 8); roof.add(rs); tagIt(rs, 'Roof sheets', 'Corrugated fibre-cement sheets. Older sheds often used asbestos cement: don\'t drill or cut them.', '≈ 8° pitch', 'fairly sure');
  for (let zz = .6; zz < 16; zz += 1.5) box(26, .1, .15, MAT.purlin, 1.5, .1, zz, 0, roof);
  for (const xx of [-6.2, 0.3, 6.8]) { box(.22, .42, 16, MAT.steelFrame, xx, -.32, 8, 0, roof); box(.22, 6.9, .3, MAT.steelFrame, xx, 0, -1.15); }
  tagIt(roof.children[roof.children.length - 1], 'Portal frame', 'Green-painted steel rafters and columns with timber purlins across them.', 'bays ≈ 6.5 m'); }

// ---------- pallet racking: perforated uprights, braced frames, orange beams with location labels ----------
const BAYS = [ // x0, beam levels
  { x: -5.6, lv: [1.69, 3.12, 4.47] }, { x: -2.8, lv: [1.68, 3.06, 4.37] }, { x: 0, lv: [1.64, 3.26, 4.88] }, { x: 2.8, lv: [0.95, 1.64, 3.26, 4.88] }, { x: 5.6, lv: [0.95, 1.64, 3.26, 4.88] }];
const rack = grp(); tagIt(rack, 'Pallet racking', 'Adjustable beam racking: galvanised perforated uprights, orange box beams, yellow location labels. Five bays here.', '6.1 m high · 2.7 m beams · 1.1 m deep');
for (const x of [-5.6, -2.8, 0, 2.8, 5.6, 8.4]) { const fr = grp(x, 0, 0, 0, rack);
  for (const z of [-RD, 0]) { box(.08, 6.09, .07, MAT.upright, 0, 0, z - .035, 0, fr); box(.16, .01, .14, MAT.galv, 0, 0, z - .035, 0, fr); }
  for (let y = .3, k = 0; y < 5.8; y += .9, k++) { const a = new THREE.Vector3(0, y, -RD + .03), b = new THREE.Vector3(0, y + .9, -.03); const l = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, a.distanceTo(b), 6), MAT.galv); l.position.copy(a).add(b).multiplyScalar(.5); l.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), (k % 2 ? a.clone().sub(b) : b.clone().sub(a)).normalize()); if (k % 2) l.position.z = -RD / 2; fr.add(l); } }
for (const b of BAYS) for (const h of b.lv) for (const z of [-RD, 0]) { box(2.72, .11, .05, MAT.orange, b.x + 1.4, h - .11, z - .025, 0, rack);
  if (z === 0) for (const lx of [.5, 1.4, 2.3]) { const l = new THREE.Mesh(new THREE.PlaneGeometry(.12, .03), MAT.labelM); l.position.set(b.x + lx, h - .06, .003); rack.add(l); } }
// yellow shelving further left, full of bagged canvas
{ const ys = grp(-8.4, 0, 0); for (const x of [0, 2.8]) for (const z of [-RD, 0]) box(.08, 5.5, .07, STD(0x9aa0a6, .5), x, 0, z); for (const h of [1.6, 3.22, 4.88]) { for (const z of [-RD, 0]) box(2.72, .1, .06, STD(0xd8b21c, .5), 1.4, h - .1, z, 0, ys); pallet(ys, .75, h, -.55); pallet(ys, 2.05, h, -.55);
    for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.CapsuleGeometry(.22, .7, 4, 10), i % 3 ? MAT.bag : MAT.bagDark); s.rotation.z = Math.PI / 2; s.position.set(.45 + (i % 3) * .8, h + .36 + Math.floor(i / 3) * .42, -.55 + (i % 2 ? .2 : -.2)); s.castShadow = true; ys.add(s); } }
  tagIt(ys, 'Bagged canvas', 'Yellow shelving full of white and green bags on pallets: looks like packed tent canvas and covers.', '3 levels, ~10 bags each', 'fairly sure'); }

// ---------- what's on the racking ----------
// black ribbed units, strapped in pairs on pallets: bay 0 (three levels), bay 2.8 (two levels)
const ribbedAll = grp(); tagIt(ribbedAll, 'Black ribbed units ×10', 'Ten black ribbed boxes with silver trim, strapped in pairs (blue ratchet straps) on pallets. I can\'t tell what they are from the photo; tell me and I\'ll label them.', '≈ 1.2 × 1.4 × 1.0 m each', 'not sure');
for (const [x0, lvs] of [[0, [1.64, 3.26, 4.88]], [2.8, [1.64, 3.26]]]) for (const h of lvs) { pallet(ribbedAll, x0 + 1.4, h, -.55, 2.5, 1.0, MAT.bluePallet);
  for (const dx of [.72, 2.08]) box(1.24, 1.38, 1.0, MAT.ribs, x0 + dx, h + .14, -.55, 0, ribbedAll);
  box(.05, 1.42, .01, MAT.strapBlue, x0 + 1.4, h + .14, -.04, 0, ribbedAll); box(.05, .02, 1.02, MAT.strapBlue, x0 + 1.4, h + 1.54, -.55, 0, ribbedAll); }
// ply panels strapped on the top of bay 2.8, with a yurt crown behind
{ const g = grp(4.2, 4.88, -.55); pallet(g, 0, 0, 0, 2.4, 1.0, MAT.bluePallet);
  const pan = (y, tilt) => { const p = grp(0, y, .1, 0, g); p.rotation.x = tilt; box(2.6, .62, .05, MAT.ply, 0, 0, 0, 0, p); for (const xx of [-1.27, -.42, .42, 1.27]) box(.06, .62, .07, MAT.pine, xx, 0, .02, 0, p); for (const yy of [0, .56]) box(2.6, .06, .07, MAT.pine, 0, yy, .02, 0, p); return p; };
  pan(.14, -.08); pan(.8, -.18); box(2.65, .04, .02, MAT.strapRed, 0, 1.02, .24, 0, g); box(.12, .06, .05, MAT.strapBlue, -.5, 1.0, .25, 0, g);
  tagIt(g, 'Plywood crate panels', 'Batten-framed ply panels (crate sides or decking) leaning on a blue plastic pallet, held with red ratchet straps.', '≈ 2.6 × 0.6 m each');
  const crown = new THREE.Mesh(new THREE.TorusGeometry(.55, .07, 8, 36), MAT.pine); crown.position.set(1.0, 1.55, -.45); crown.rotation.x = Math.PI / 2.4; crown.castShadow = true; g.add(crown);
  for (let i = 0; i < 12; i++) { const hole = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .16, 6), MAT.black); const a = i / 12 * Math.PI * 2; hole.position.set(Math.cos(a) * .55, 0, Math.sin(a) * .55); hole.rotation.x = Math.PI / 2; crown.add(hole); }
  tagIt(crown, 'Yurt crown', 'The round timber crown (toono) that the roof poles slot into. Stored behind the ply panels.', '≈ 1.1 m across', 'fairly sure'); }
// yurt doors, stacked upright on pallets on top of the two left bays (Josh: "the timber is doors")
for (const [x, w, h, d] of [[-4.35, 1.8, 2.3, 1.0], [-1.25, 2.2, 2.45, 1.05]]) { const lv = x < -2.8 ? 4.47 : 4.37; const g = grp(x, lv, -.55); pallet(g, 0, 0, 0, w, d);
  box(w, h, d, MAT.pine, 0, .14, 0, 0, g); box(w * .45, h * .8, .02, STD(0xa9692c, .7), w * .2, .3, d / 2 + .01, 0, g);
  tagIt(g, 'Yurt doors (stacked)', 'Yurt door sets stored together on a pallet: pine boards in a timber frame with black strap hinges, the kind that fits the 16 ft yurts. Shown as one block here; a proper door model comes from your 16 ft door photo.', `stack ≈ ${w} × ${h} m`, 'sure'); }
{ const g = grp(-3.15, 4.47, -.4); box(.32, .3, .45, MAT.white, 0, .14, 0, 0, g); box(.32, .3, .45, MAT.white, 0, .45, 0, 0, g); box(.35, .55, .5, MAT.black, .4, .14, 0, 0, g); tagIt(g, 'Tote bags and a crate', 'White carry bags and a black stacking crate next to the doors.', 'small'); }
// bay −5.6: stainless sink on a stand
{ const g = grp(-4.3, 3.12, -.55); for (const [dx, dz] of [[-.5, -.3], [.5, -.3], [-.5, .3], [.5, .3]]) box(.04, .95, .04, MAT.steelDark, dx, 0, dz, 0, g); box(1.1, .03, .7, MAT.steelDark, 0, .95, 0, 0, g); box(.45, .2, .35, MAT.stainless, 0, .75, .1, 0, g); cyl(.02, .02, .25, MAT.white, 0, .5, .15, g);
  tagIt(g, 'Hand-wash sink', 'Stainless basin on a steel stand: a portable hand-wash station for site.', '≈ 1.1 × 0.7 m', 'sure'); pallet(modelSet, -4.3, 1.69, -.55, 2.5); }
// bay −2.8: fridges on level 1, hose and stainless units on level 2
{ const g = grp(-1.4, 1.68, -.55); pallet(g, 0, 0, 0, 2.5); box(.6, .85, .6, MAT.black, -.55, .14, 0, 0, g); box(.6, .85, .6, MAT.black, .25, .14, 0, 0, g); box(.02, .8, .58, MAT.stainless, .56, .16, 0, 0, g);
  tagIt(g, 'Under-counter fridges', 'Two black catering fridges (one with a steel side), the kind used in a site kitchen or bar.', '≈ 0.6 × 0.85 m', 'fairly sure');
  const h = grp(-1.2, 3.06, -.55); pallet(h, 0, 0, 0, 2.5); box(.55, .5, .45, MAT.stainless, -.75, .14, 0, 0, h); box(.5, .45, .45, MAT.stainless, .1, .14, 0, 0, h); box(.5, .45, .3, MAT.ply, .7, .14, .1, 0, h);
  for (let i = 0; i < 4; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(.32 - i * .03, .025, 6, 30), MAT.hose); t.position.set(.25, .5 + i * .02, .1); t.rotation.y = .3; t.rotation.x = .2; h.add(t); }
  tagIt(h, 'Water kit', 'A coiled green water hose with stainless units, probably the water supply and hand-wash kit.', 'hose ≈ 25 m coil', 'fairly sure'); }
// bay 0 ground: wooden crate, boxes, a pole
{ const g = grp(.7, 0, -.5); box(.9, .6, .6, MAT.ply, 0, 0, 0, 0, g); const disc = new THREE.Mesh(new THREE.CircleGeometry(.12, 20), MAT.white); disc.position.set(.25, .35, .301); g.add(disc); box(.7, .3, .5, MAT.cardPlain, 1.0, 0, 0, 0, g); box(.5, .25, .4, MAT.cardPlain, 1.6, 0, 0, 0, g);
  const pole = cyl(.015, .015, 1.6, MAT.pine, .45, 0, .35, g); pole.rotation.z = .08;
  tagIt(g, 'Crates and boxes', 'A ply crate with a round logo, cardboard boxes, and a broom pole leaning on the beam.', 'crate ≈ 0.9 × 0.6 m'); }
// bays 2.8 + 5.6 low shelf (0.95 m): jerry cans, lantern, bottles; storage boxes underneath
{ const g = grp(3.0, .95, -.45); for (let i = 0; i < 3; i++) { box(.17, .45, .35, MAT.jerry, -.6 + i * .25, 0, 0, 0, g); box(.06, .05, .2, MAT.jerry, -.6 + i * .25, .45, 0, 0, g); }
  box(.12, .3, .12, MAT.black, .2, 0, 0, 0, g); cyl(.05, .05, .25, MAT.yellow, .4, 0, .05, g); cyl(.09, .09, .3, MAT.black, .65, 0, 0, g); cyl(.06, .06, .22, STD(0x3aa66a, .5), .95, 0, .05, g); box(.22, .3, .18, MAT.white, 1.3, 0, 0, 0, g);
  const lamp = cyl(.06, .06, .18, MAT.white, -1.05, 0, .1, g); tagIt(g, 'Jerry cans and fluids', 'Green jerry cans (fuel or water), a lantern, oil and spray bottles on the low shelf.', 'jerry cans ≈ 20 L');
  const u = grp(3.4, 0, -.5); box(.6, .4, .45, STD(0x2c6db5, .6), 0, 0, 0, 0, u); box(.6, .4, .45, MAT.black, 0, .42, 0, 0, u); box(.65, .55, .5, MAT.cardPlain, .75, 0, 0, 0, u); box(.6, .25, .45, STD(0x2c3a46, .6), -.75, 0, 0, 0, u);
  tagIt(u, 'Storage boxes', 'Blue and black stacking boxes and a cardboard box under the shelf.', '≈ 0.6 × 0.4 m'); }
// bay 5.6, level 3.26: boxed canvas tents on a blue pallet
{ const g = grp(7.0, 3.26, -.55); pallet(g, 0, 0, 0, 2.4, 1.0, MAT.bluePallet); for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) box(1.15, .26, .95, MAT.card, -.6 + c * 1.18, .14 + r * .265, 0, 0, g);
  box(.02, 1.07, .97, MAT.white, -.6, .14, 0, 0, g); box(.02, 1.07, .97, MAT.white, .58, .14, 0, 0, g);
  tagIt(g, 'Boxed canvas tents', 'Eight cardboard boxes printed "CANVAS TENT" on a blue pallet, strapped: looks like new bell-tent stock.', '8 boxes ≈ 1.15 × 0.26 m', 'sure'); }
// bay 5.6, level 1.64: café furniture
{ const g = grp(7.0, 1.64, -.55); for (let i = 0; i < 3; i++) { cyl(.02, .02, .7, MAT.steelDark, -.8 + i * .5, 0, .1, g); cyl(.2, .2, .03, MAT.steelDark, -.8 + i * .5, .7, .1, g); }
  const tbl = cyl(.45, .45, .04, MAT.black, .6, .7, 0, g); cyl(.03, .03, .7, MAT.steelDark, .6, 0, 0, g);
  tagIt(g, 'Tables and stools', 'Dark round tables and bar stools: event furniture.', 'tables ≈ 0.9 m across', 'fairly sure'); }

// ---------- floor items ----------
// yurt lattice walls (trellis): stacked layers of real lattice
function khanaStack(x, z, len, layers, ry, name) { const g = grp(x, 0, z, ry); box(len, .1, .9, MAT.pallet, 0, 0, 0, 0, g);
  const latM = new THREE.MeshStandardMaterial({ map: T.khana.clone(), transparent: true, alphaTest: .4, side: THREE.DoubleSide, roughness: .8 }); latM.map.repeat.set(len / 1.6, 1); latM.map.needsUpdate = true;
  for (let i = 0; i < layers; i++) { const y = .12 + i * .072, j = (Math.random() - .5) * .08;
    const top = new THREE.Mesh(new THREE.PlaneGeometry(len, .85), latM); top.rotation.x = -Math.PI / 2; top.position.set(j, y + .035, (Math.random() - .5) * .05); top.castShadow = top.receiveShadow = true; g.add(top);
    box(len + .05, .045, .05, MAT.pine, j, y, -.42, 0, g); box(len + .05, .045, .05, MAT.pine, j, y, .42, 0, g); }
  for (let i = 0; i < 9; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(.004, .004, layers * .072 + .3, 4), MAT.cable); s.position.set(-len / 2 + .15 + i * (len - .3) / 8, .1 + layers * .036, .46); g.add(s); }
  return tagIt(g, name, 'Folded yurt trellis sections: criss-cross timber slats tied with cord at every crossing, stacked flat. These open out to form the yurt wall.', `${len} m long · ${(layers * .072 + .12).toFixed(2)} m high · ${layers} sections`, 'sure'); }
{ const ts = buildTrellisStack(); ts.position.set(2.47, 0, 3.68); ts.rotation.y = -Math.atan2(.2, 2.39); ts.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); modelSet.add(ts);
  tagIt(ts, 'Trellis stillages 11–15', 'Five numbered timber stillages (11 at the bottom to 15 at the top, right ends marked 16ft), one 16 ft yurt each: 4 folded trellis sections, two side by side on each of two layers. Each section is two layers of 45 × 18 mm slats crossing, a cord knot at every crossing. Built slat by slat from your photos; open one up on the Trellis Stack page.', 'stillages 2.32 × 1.35 m · a level every 0.20 m · 0.99 m tall', 'sure'); }
khanaStack(-.45, 2.07, 1.9, 8, 0, 'Trellis: second stack');

// ---------- more of the yard, from the video (positions approximate: the video turns more than it walks) ----------
{ const PUR = STD(0x5b3fa0, .5, { metalness: .4 });
  for (const [x, z, ry] of [[-3.2, 3.4, .3], [-4.6, 5.2, -.2]]) { const g = grp(x, 0, z, ry); box(1.2, .12, 1.0, PUR, 0, .1, 0, 0, g); for (const [dx, dz] of [[-.57, -.47], [.57, -.47], [-.57, .47], [.57, .47]]) box(.06, 1.0, .06, PUR, dx, .1, dz, 0, g); for (const dz of [-.5, .5]) box(1.2, .05, .05, PUR, 0, 0, dz, 0, g);
    tagIt(g, 'Purple post pallet (stillage)', 'Steel post pallet with removable corner posts, painted purple, for stacking long kit like trellis and poles.', '≈ 1.2 × 1.0 m', 'fairly sure'); }
  const keg = grp(-2.3, 0, 4.4); cyl(.2, .2, .6, MAT.stainless, 0, 0, 0, keg); for (const y of [.08, .52]) { const r = new THREE.Mesh(new THREE.TorusGeometry(.2, .015, 6, 24), MAT.stainless); r.rotation.x = Math.PI / 2; r.position.y = y; keg.add(r); }
  tagIt(keg, 'Steel keg', 'A stainless beer keg on the floor by the racking: bar kit.', '≈ 50 L', 'sure');
  const al = grp(-5.0, 0, -.3); for (let i = 0; i < 8; i++) box(2.0, .04, .5, STD(0xaab2ba, .4, { metalness: .7 }), 0, i * .045, 0, 0, al);
  tagIt(al, 'Aluminium frames', 'A stack of grey aluminium frames or staging panels at floor level on the left of the racking.', '≈ 2 m long', 'fairly sure');
  const st = grp(9.6, 0, 3.0, -.3); box(.06, 1.2, .06, STD(0x2c7fd6, .5), -.2, 0, 0, 0, st); box(.06, 1.2, .06, STD(0x2c7fd6, .5), .2, 0, 0, 0, st); box(.46, .03, .3, STD(0x2c7fd6, .5), 0, 0, .15, 0, st); for (const x of [-.25, .25]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .07, 16), MAT.tyre); w.rotation.z = Math.PI / 2; w.position.set(x, .13, -.05); st.add(w); }
  tagIt(st, 'Sack truck', 'Blue sack truck parked by the racking.', '≈ 1.2 m tall', 'sure');
  const bb = grp(9.4, 0, 1.6); const bag = new THREE.Mesh(new THREE.SphereGeometry(.45, 16, 10), MAT.bag); bag.scale.set(1.2, .5, 1); bag.position.y = .22; bb.add(bag); tagIt(bb, 'Bulk bag', 'An empty white builder\'s bulk bag (FIBC) slumped on the floor.', '≈ 0.9 m', 'sure');
  const cage = grp(8.6, 0, -.5); box(1.2, .9, 1.0, STD(0xdfe3e6, .6, { transparent: true, opacity: .55 }), 0, .15, 0, 0, cage); pallet(cage, 0, 0, 0, 1.2, 1.0); tagIt(cage, 'IBC cage', 'White plastic bin in a cage on a pallet: an IBC or collapsible pallet box.', '≈ 1.2 × 1.0 m', 'fairly sure');
  // the workshop cabin opposite the racking (from the back photo and the start of the video)
  const ws = grp(3.5, 0, 16.5, Math.PI); const OSB = canvasTex(256, 256, (c, w, h) => { noise(c, w, h, '#c9a36b', .25, 9000); }, [3, 2]);
  box(6.0, 3.0, 3.0, STD(0xffffff, .9, { map: OSB }), 0, 0, 0, 0, ws); for (const x of [-1.3, 0]) box(1.1, .35, .02, STD(0xdfe9ef, .2, { metalness: .2 }), x, 2.3, 1.51, 0, ws);
  box(1.0, 2.1, .02, STD(0x3a2a1c, .7), 1.8, 0, 1.51, 0, ws);
  const bins = grp(-4.6, .4, 1.6, 0, ws); for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) box(.22, .16, .2, [STD(0x2a5bd6, .5), STD(0xc8352a, .5), STD(0x2b3036, .5)][(r + c) % 3], c * .25 - .6, r * .2, 0, 0, bins);
  tagIt(ws, 'Workshop cabin', 'OSB-clad office and workshop cabin opposite the racking, with windows, a whiteboard inside and a wall of blue, red and grey parts bins beside it. Position is approximate (from the back photo and video).', '≈ 6 × 3 m', 'fairly sure');
  tagIt(bins, 'Parts bins', 'Wall of louvre panel parts bins (blue, red, grey) for fixings and small parts.', '≈ 1.6 m wide', 'sure'); }

// a bundle of timber poles under the trestle
{ const g = grp(5.25, 0, 2.95, -.85); for (let i = 0; i < 14; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1.6, 6), MAT.bench); p.rotation.z = Math.PI / 2; p.position.set(0, .03 + Math.floor(i / 7) * .05, -.18 + (i % 7) * .055); p.castShadow = true; g.add(p); }
  tagIt(g, 'Timber poles', 'A bundle of dark timber poles on the floor: could be yurt roof poles.', '≈ 1.6 m long', 'not sure'); }
// steel trestle with the mitre saw
{ const g = grp(5.11, 0, 5.22); for (const [dx, dz] of [[-.33, -.25], [.33, -.25], [-.33, .25], [.33, .25]]) box(.04, .93, .04, STD(0x8a2f22, .6), dx, 0, dz, 0, g); box(.6, .03, .5, MAT.steelDark, 0, .35, 0, 0, g); box(.76, .05, .6, STD(0xa9a59a, .6), 0, .93, 0, 0, g);
  const saw = grp(-.05, .98, -.05, 0, g); box(.45, .06, .35, MAT.steelDark, 0, 0, 0, 0, saw); const blade = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .03, 28), MAT.galv); blade.rotation.z = Math.PI / 2; blade.position.set(.02, .28, 0); saw.add(blade);
  const guard = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .07, 28, 1, false, 0, Math.PI * 1.2), STD(0xbfc3c6, .5)); guard.rotation.z = Math.PI / 2; guard.position.set(.02, .3, 0); saw.add(guard); box(.12, .12, .14, STD(0xe36a12, .5), -.08, .38, -.08, 0, saw); box(.06, .25, .06, MAT.steelDark, -.15, .05, -.12, 0, saw);
  for (let i = 0; i < 6; i++) box(.05, .05, .5, MAT.shs, .28, .06 + i * .051, .05 + (i % 2) * .01, 0, g).position.y = .98 + i * .051 + .025;
  cyl(.06, .06, .2, MAT.white, -.25, .98, .15, g); box(.06, .04, .06, MAT.yellow, .25, .98, .2, 0, g);
  tagIt(g, 'Mitre saw on a trestle', 'A sliding mitre (chop) saw on a steel trestle with square steel tube offcuts, a tape measure and kitchen roll: someone\'s been cutting box section.', 'bench top 0.98 m', 'sure'); }
// big timber bench on castors with box-section stock
{ const g = grp(6.75, 0, 6.1); for (const [dx, dz] of [[-.58, -.92], [.58, -.92], [-.58, .92], [.58, .92]]) { box(.09, .92, .09, MAT.bench, dx, .08, dz, 0, g); cyl(.05, .05, .08, MAT.steelDark, dx, 0, dz, g); }
  box(1.3, .07, 2.0, MAT.ply, 0, 1.0, 0, 0, g); box(1.2, .04, 1.8, MAT.bench, 0, .35, 0, 0, g);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6 - r; c++) box(.05, .05, 1.0, c % 2 ? MAT.shs2 : MAT.shs, -.3 + c * .055 + r * .027, 1.07 + r * .05, -.35, 0, g);
  cyl(.045, .05, .3, MAT.black, .35, 1.07, .2, g); const prof = new THREE.Shape(); prof.moveTo(0, 0); prof.bezierCurveTo(.2, .3, .4, -.1, .6, .2); prof.lineTo(.6, .45); prof.bezierCurveTo(.4, .3, .2, .6, 0, .4); prof.closePath();
  const cut = new THREE.Mesh(new THREE.ExtrudeGeometry(prof, { depth: .018, bevelEnabled: false }), MAT.ply); cut.position.set(-.67, .35, .3); cut.rotation.y = Math.PI / 2; g.add(cut);
  tagIt(g, 'Workbench', 'Heavy timber bench on castors with a ply top, a stack of square steel tube (box section), a bottle and curved ply cut-outs (templates).', '1.3 × 2.0 m · top 1.07 m', 'sure'); }
// a loose cable across the floor
{ const c = new THREE.CatmullRomCurve3([[5.0, .01, 10.3], [5.24, .01, 9.99], [5.49, .01, 9.54], [5.73, .01, 9.88], [6.0, .01, 10.4]].map(p => new THREE.Vector3(...p)));
  const m = new THREE.Mesh(new THREE.TubeGeometry(c, 40, .006, 6), MAT.cable); modelSet.add(m); tagIt(m, 'Loose cable', 'A black cable lying across the floor: trip hazard, worth coiling up.', '≈ 1.5 m'); }

// ---------- forklift: Doosan G15S LPG counterbalance, rear to the camera ----------
function forklift(p) { // the detailed G15S from the 3d-models skill (forklift.js), placed where the photo fit put it (6 px mean error)
  const g = buildForklift(); g.position.set(1.2067, 0, 7.1719); g.rotation.y = .8633; g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); p.add(g);
  return tagIt(g, 'Forklift: Doosan G15S', 'LPG counterbalance forklift (reg FTD 8548) with an 18 kg Calor bottle on the back, orange beacon and round mirror. Its 2.16 m guard height scales this whole model. Full detailed model: Forklift G15S page.', '1.07 m wide · 2.16 m to the guard · 1.5 t', 'sure'); }
forklift(modelSet);

// ---------- photo-baked surfaces: the real look of each face, cut from the photo and squared up ----------
{ const BAKE = __BAKE__, L = new THREE.TextureLoader();
  for (const [k, v] of Object.entries(BAKE)) { const t = L.load(v.img); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    if (k === 'khanaB') continue; // replaced by the photo-skinned cradle stack
    if (k === 'floor') { const [x0, x1, z0, z1] = v.rect; const f = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false, depthWrite: false }));
      f.rotation.x = -Math.PI / 2; f.position.set((x0 + x1) / 2, .004, (z0 + z1) / 2); f.raycast = () => {}; f.renderOrder = 1; modelSet.add(f); continue; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v.c.flat(), 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 0], 2)); g.setIndex([0, 3, 1, 1, 3, 2]); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: t, toneMapped: false, side: THREE.DoubleSide })); m.raycast = () => {}; modelSet.add(m); } }
