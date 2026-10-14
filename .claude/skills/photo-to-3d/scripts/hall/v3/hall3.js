// ===== Main hall v3: one clean model, everything in its place (metres) =====
// Frame: the roller door is at z = 0 and the hall runs to z = -39. x runs 0 (left wall as you walk in) to 20 (right wall). y up.
// Front of every stack faces the aisle. Built from Josh's 60 photos and 2 walk-round videos; sizes from crates (1.2 × 1.0 m), stillages (2.32 × 1.35 m) and the forklift (2.16 m guard).
const HW = 20, HL = 39, EAVE = 6.0, RIDGE = 7.7, BAY = 6.5, DOOR = { x0: 6.85, x1: 12.35, h: 5.5 };
const LEFT = Math.PI / 2, RIGHT = -Math.PI / 2, FAR = 0;   // ry that turns a stack's front to face the aisle from the left wall / right wall / far wall
const ZONES = [];                                          // { name, items: [groups] } for the zone buttons
let ZONE = null; const zone = name => { ZONE = { name, items: [] }; ZONES.push(ZONE); };
const T = (obj, name, what, size, sure = 'sure') => { tag(obj, name, what, size, [], sure); if (ZONE) ZONE.items.push(obj); return obj; };

// ---------------- materials ----------------
const MX = {
  steel: STD({ color: 0x1f3a2b, roughness: .5, metalness: .35 }),
  timber: STD({ map: grain('#c99c5f', '120,80,40', 256, 32, 1), roughness: .75 }),
  clad: STD({ map: tex(64, 256, (x, w, h) => { for (let i = 0; i < w; i += 16) { const g = x.createLinearGradient(i, 0, i + 16, 0); g.addColorStop(0, '#7f878d'); g.addColorStop(.18, '#c3c8cc'); g.addColorStop(.5, '#a9afb4'); g.addColorStop(.82, '#cfd3d6'); g.addColorStop(1, '#7f878d'); x.fillStyle = g; x.fillRect(i, 0, 16, h); } }, [120, 1]), roughness: .55, metalness: .25, side: THREE.DoubleSide }),
  roof: STD({ map: tex(64, 128, (x, w, h) => { for (let i = 0; i < w; i += 16) { const g = x.createLinearGradient(i, 0, i + 16, 0); g.addColorStop(0, '#4c4640'); g.addColorStop(.5, '#8d857b'); g.addColorStop(1, '#4c4640'); x.fillStyle = g; x.fillRect(i, 0, 16, h); } speckle(x, w, h, 'rgba(0,0,0,0)', .1, 300); }, [160, 4]), side: THREE.DoubleSide, roughness: .7 }),
  rooflight: new THREE.MeshStandardMaterial({ color: 0xdfe9f2, emissive: 0xcfe2f5, emissiveIntensity: .9, side: THREE.DoubleSide, transparent: true, opacity: .92 }),
  floor: STD({ map: tex(1024, 1024, (x, w, h) => { speckle(x, w, h, '#9b9a94', .06, 50000);
      for (let i = 0; i < 60; i++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 1); x.save(); x.translate(rnd() * w, rnd() * h); x.scale(40 + rnd() * 140, 20 + rnd() * 70); g.addColorStop(0, `rgba(70,66,60,${.05 + rnd() * .06})`); g.addColorStop(1, 'rgba(70,66,60,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 1, 0, 7); x.fill(); x.restore(); }
      for (let i = 0; i < 18; i++) { x.strokeStyle = `rgba(35,33,30,${.04 + rnd() * .05})`; x.lineWidth = 5 + rnd() * 5; x.beginPath(); let px = rnd() * w; x.moveTo(px, 0); for (let k = 1; k <= 12; k++) x.lineTo(px += (rnd() - .5) * 50, k * h / 12); x.stroke(); }
      x.strokeStyle = 'rgba(30,30,30,.22)'; x.lineWidth = 1.5; for (let i = 0; i < 6; i++) { x.beginPath(); let px = rnd() * w, py = rnd() * h; x.moveTo(px, py); for (let k = 0; k < 6; k++) x.lineTo(px += (rnd() - .5) * 50, py += (rnd() - .5) * 50); x.stroke(); } }, [6, 12]), roughness: .9 }),
  joint: new THREE.MeshBasicMaterial({ color: 0x55534f }),
  osb: STD({ map: tex(256, 256, (x, w, h) => { speckle(x, w, h, '#d6a96a', .3, 5000); for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(${150 + rnd() * 60},${100 + rnd() * 40},50,.5)`; x.fillRect(rnd() * w, rnd() * h, 8 + rnd() * 20, 3 + rnd() * 6); } }, [2, 1]) }),
  ply: STD({ map: tex(512, 384, (x, w, h) => { x.fillStyle = '#cdb08a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 50; i++) { x.strokeStyle = `rgba(90,70,45,${.08 + rnd() * .14})`; x.lineWidth = 2; x.beginPath(); x.ellipse(rnd() * w, rnd() * h, 30 + rnd() * 120, 6 + rnd() * 20, rnd() * .3, 0, 7); x.stroke(); } x.fillStyle = 'rgba(90,80,70,.25)'; x.fillRect(0, 0, w, h); }) }),
  alu: STD({ color: 0xc9cdd1, metalness: .75, roughness: .32 }), white: STD({ color: 0xeceae4, roughness: .9 }), black: STD({ color: 0x1c1e21, roughness: .5 }),
  orange: STD({ color: 0xe0601e, roughness: .5, metalness: .3 }), upright: STD({ color: 0x2c3a6a, roughness: .5, metalness: .4 }), yellow: STD({ color: 0xe3b11c, roughness: .5, metalness: .3 }),
  jute: STD({ map: tex(256, 256, (x, w, h) => { x.fillStyle = '#b8945e'; x.fillRect(0, 0, w, h); for (let i = 0; i < h; i += 6) { x.fillStyle = `rgba(90,60,30,${.2 + rnd() * .2})`; x.fillRect(0, i, w, 2); } for (let i = 0; i < w; i += 6) { x.fillStyle = `rgba(255,235,190,${.08 + rnd() * .1})`; x.fillRect(i, 0, 2, h); } for (let i = 0; i < h; i += 40) { x.fillStyle = 'rgba(60,40,20,.35)'; x.fillRect(0, i, w, 5); } }, [2, 2]), roughness: 1 }),
  film: new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .13, roughness: .1, side: THREE.DoubleSide, depthWrite: false }),
};
const doorTex = tex(512, 900, (x, w, h) => { x.fillStyle = '#c4873f'; x.fillRect(0, 0, w, h); for (let i = 0; i < w; i += 64) { const g = x.createLinearGradient(i, 0, i + 64, 0); g.addColorStop(0, 'rgba(90,50,20,.45)'); g.addColorStop(.06, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(255,230,190,.06)'); x.fillStyle = g; x.fillRect(i, 0, 64, h); }
  for (let i = 0; i < 160; i++) { x.strokeStyle = `rgba(110,65,25,${.06 + rnd() * .12})`; x.beginPath(); const xx = rnd() * w; x.moveTo(xx, 0); x.bezierCurveTo(xx + (rnd() - .5) * 10, h * .3, xx + (rnd() - .5) * 10, h * .7, xx + (rnd() - .5) * 8, h); x.stroke(); }
  x.strokeStyle = '#7a4a1e'; x.lineWidth = 26; x.strokeRect(13, 13, w - 26, h - 26); x.fillStyle = '#141414'; for (const yy of [130, h - 130]) { x.fillRect(30, yy - 8, 300, 16); x.beginPath(); x.moveTo(330, yy - 8); x.lineTo(380, yy); x.lineTo(330, yy + 8); x.fill(); } x.fillRect(w - 70, h / 2 - 40, 14, 80); });
const DOORMAT = STD({ map: doorTex, roughness: .7 });

// ---------------- the shed ----------------
function shed() {
  const g = grp(scene); g.name = 'Shed'; const roofG = grp(g); roofG.name = 'Roof';
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(HW, HL), MX.floor); fl.rotation.x = -Math.PI / 2; fl.position.set(HW / 2, 0, -HL / 2); fl.receiveShadow = true; g.add(fl);
  for (let z = -BAY; z > -HL; z -= BAY) { const j = new THREE.Mesh(new THREE.PlaneGeometry(HW, .012), MX.joint); j.rotation.x = -Math.PI / 2; j.position.set(HW / 2, .002, z); g.add(j); }
  const j2 = new THREE.Mesh(new THREE.PlaneGeometry(.012, HL), MX.joint); j2.rotation.x = -Math.PI / 2; j2.position.set(HW / 2, .002, -HL / 2); g.add(j2);
  const ang = Math.atan2(RIDGE - EAVE, HW / 2), slope = Math.hypot(HW / 2, RIDGE - EAVE);
  for (let z = 0; z >= -HL - .01; z -= BAY) {   // portal frames: columns, haunched rafters, knee and apex braces
    for (const x of [.15, HW - .15]) { box(g, .3, EAVE, .2, MX.steel, x, 0, z); box(g, .5, .02, .4, MX.steel, x, 0, z); }
    for (const s of [-1, 1]) { const r = box(roofG, slope, .42, .2, MX.steel, 0, 0, z); r.position.set(HW / 2 + s * HW / 4, (EAVE + RIDGE) / 2 - .18, z); r.rotation.z = -s * ang;
      const hn = box(roofG, 1.6, .5, .2, MX.steel, 0, 0, z); hn.position.set(s < 0 ? .9 : HW - .9, EAVE - .35, z); hn.rotation.z = -s * ang;
      const br = box(roofG, 3.2, .1, .1, MX.steel, 0, 0, z); br.position.set(HW / 2 + s * 2.3, RIDGE - 1.5, z); br.rotation.z = s * .72; } }
  for (const s of [-1, 1]) { const h = grp(roofG, HW / 2 + s * HW / 4, (EAVE + RIDGE) / 2 + .24, -HL / 2); h.rotation.z = -s * ang;
    const r = new THREE.Mesh(new THREE.PlaneGeometry(slope, HL), MX.roof); r.rotation.x = Math.PI / 2; r.receiveShadow = true; h.add(r);
    for (let k = 0; k < 7; k++) box(h, .07, .2, HL, MX.timber, -slope / 2 + (k + .5) / 7 * slope, -.22, 0);
    for (let z = -4; z > -HL; z -= 8.5) { const rl = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.6), MX.rooflight); rl.rotation.x = Math.PI / 2; rl.position.set(s * -1.4, -.012, z + HL / 2); h.add(rl); } }
  // side walls: cladding with timber posts and four girts (as in the photos)
  for (const [x, ry] of [[0, Math.PI / 2], [HW, -Math.PI / 2]]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(HL, EAVE), MX.clad); w.position.set(x, EAVE / 2, -HL / 2); w.rotation.y = ry; w.receiveShadow = true; g.add(w);
    for (let yy = 1.15; yy < EAVE; yy += 1.2) box(g, .07, .14, HL, MX.timber, x + (x ? -.06 : .06), yy, -HL / 2);
    for (let z = -BAY / 2; z > -HL; z -= BAY) box(g, .12, EAVE, .07, MX.timber, x + (x ? -.08 : .08), 0, z); }
  const gable = pts => new THREE.Shape(pts.map(p => new THREE.Vector2(...p)));
  const farW = new THREE.Mesh(new THREE.ShapeGeometry(gable([[0, 0], [HW, 0], [HW, EAVE], [HW / 2, RIDGE], [0, EAVE]])), MX.clad); farW.position.set(0, 0, -HL); g.add(farW);
  for (let xx = 1.7; xx < HW; xx += 3.3) box(g, .14, EAVE + (RIDGE - EAVE) * (1 - Math.abs(xx - HW / 2) / (HW / 2)) - .25, .07, MX.timber, xx, 0, -HL + .07);
  for (let yy = 1.15; yy < EAVE; yy += 1.2) box(g, HW, .14, .07, MX.timber, HW / 2, yy, -HL + .1);
  const front = new THREE.Mesh(new THREE.ShapeGeometry(gable([[0, 0], [DOOR.x0, 0], [DOOR.x0, DOOR.h], [DOOR.x1, DOOR.h], [DOOR.x1, 0], [HW, 0], [HW, EAVE], [HW / 2, RIDGE], [0, EAVE]])), MX.clad); g.add(front);
  box(g, DOOR.x1 - DOOR.x0 + .5, .55, .55, MX.alu, (DOOR.x0 + DOOR.x1) / 2, DOOR.h, .1);   // rolled-up door drum
  for (const x of [DOOR.x0, DOOR.x1]) { box(g, .14, DOOR.h, .1, MX.alu, x, 0, .05); }
  // outside: the yard, the green shed opposite, a tree, a second forklift
  const yard = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), STD({ color: 0xb5b3ab })); yard.rotation.x = -Math.PI / 2; yard.position.set(HW / 2, -.002, 15); g.add(yard);
  const opp = new THREE.Mesh(new THREE.ShapeGeometry(gable([[-14, 0], [14, 0], [14, 5], [0, 6.6], [-14, 5]])), STD({ map: tex(64, 256, (x, w, h) => { for (let i = 0; i < w; i += 8) { const gg = x.createLinearGradient(i, 0, i + 8, 0); gg.addColorStop(0, '#2c6539'); gg.addColorStop(.5, '#4f8a5a'); gg.addColorStop(1, '#2c6539'); x.fillStyle = gg; x.fillRect(i, 0, 8, h); } }, [50, 1]), side: THREE.DoubleSide })); opp.position.set(HW / 2 + 1, 0, 18); opp.rotation.y = Math.PI; g.add(opp);
  box(g, 28, 1.7, .2, STD({ color: 0xece8e0 }), HW / 2 + 1, 0, 17.9);
  const tree = new THREE.Mesh(new THREE.IcosahedronGeometry(1.8, 1), STD({ color: 0x6f9a3a, flatShading: true })); tree.position.set(3.5, 3.4, 9); g.add(tree); cyl(g, .15, 2.6, STD({ color: 0x5a4632 }), 3.5, 1.3, 9);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(120, 50), new THREE.MeshBasicMaterial({ color: 0xeef3f6 })); sky.position.set(HW / 2, 10, 40); sky.rotation.y = Math.PI; g.add(sky);
  // LED high-bay lights down the middle
  for (let z = -5; z > -HL; z -= 8.5) { cyl(roofG, .28, .14, MX.black, HW / 2, RIDGE - .75, z, 'y', 20); const d = new THREE.Mesh(new THREE.CircleGeometry(.24, 24), new THREE.MeshBasicMaterial({ color: 0xffffff })); d.rotation.x = Math.PI / 2; d.position.set(HW / 2, RIDGE - .83, z); roofG.add(d); }
  T(g, 'The hall', 'Steel portal-frame shed: dark green frames every 6.5 m with braced, haunched rafters, timber purlins and wall girts, grey cladding, roof lights and LED high-bays, one big roller door onto the yard.', `≈ ${HW} × ${HL} m · eaves ${EAVE} m · ridge ${RIDGE} m (estimate)`, 'fairly sure').userData.noPick = true;
  return { g, roofG };
}

// ---------------- builders ----------------
const crownKind = (ft, n, D, label) => ({ w: 1.2, d: 1.0, h: 1.1, n, D, mats: coverMats('c' + ft, '#1d6658', '#eef0e6', label, { labelSize: 70 }) });
const K12 = crownKind(12, 12, .9, '12FT CROWN × 12'), K14 = crownKind(14, 5, 1.05, '14FT CROWN × 5'), K16 = crownKind(16, 5, 1.15, '16FT CROWN × 5');
const CRATES = [];
const ONTOP = [];   // things sitting on a crate stack: they ride up with the level under them when the stack opens
function crownStack(p, K, x, z, ry, cols) { const g = grp(p, x, 0, z, ry); cols.forEach(([cx, n]) => { for (let i = 0; i < n; i++) { const c = crownCrate(g, K, cx * 1.32, i * 1.24, 0, 0); c.userData.level = i; CRATES.push(c); } }); return g; }
function onTop(o, level, h = 1.1) { ONTOP.push({ o, y0: o.position.y, level, h }); return o; }
function plainStack(p, mats, x, z, ry, cols, w = 1.2, h = 1.04, d = 1.0) { const g = grp(p, x, 0, z, ry); cols.forEach(([cx, n]) => { for (let i = 0; i < n; i++) { const pg = grp(g, cx * (w + .05), i * (h + .2), 0); pallet(pg, w, d); const c = coverMesh(w + .02, h, d + .02, mats); c.position.y = .144 + h / 2; pg.add(c); } }); return g; }
const canvasMats = (ft, range, bg = '#8c2a2b', label = `${ft}ft CANVAS`) => { const key = 'cv' + label + range; return _coverMats[key] || (_coverMats[key] = (() => {
  const front = STD({ map: tex(1024, 680, (x, w, h) => { fabric(x, w, h, bg); x.fillStyle = '#f2e8e2'; x.font = '500 62px Arial'; x.fillText(label, 40, 92); if (range) { x.font = '500 54px Arial'; x.fillText(range, 40, 156); } x.fillStyle = 'rgba(235,235,235,.45)'; x.fillRect(46, 200, 150, 90); drawBadge(x, w / 2 + 70, h / 2 + 10, 210, '#f2e8e2', bg); x.fillStyle = 'rgba(0,0,0,.6)'; for (const nx of [150, 420, 600, 870]) x.fillRect(nx, h - 50, 70, 50); }), roughness: .85 });
  const side = STD({ map: tex(512, 340, (x, w, h) => { fabric(x, w, h, bg); drawBadge(x, w / 2, h / 2, 120, '#f2e8e2', bg); }), roughness: .85 }); return [side, side, side, side, front, side]; })()); };
function canvasStack(p, ft, x, z, ry, cols, bg, label) { const g = grp(p, x, 0, z, ry); let r = 0; cols.forEach(([cx, n, ranges]) => { for (let i = 0; i < n; i++) { const pg = grp(g, cx * 1.25, i * .84, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(pg, .07, .05, .07, M.red, sx * .55, 0, sz * .45);
  const c = coverMesh(1.2, .78, 1.0, canvasMats(ft, ranges ? ranges[i] : null, bg, label)); c.position.y = .05 + .39; pg.add(c); } }); return g; }
// trellis loads: folded sections laid two side by side, with optional doors on top
function trellisLoad(s, sets, perSet, doorsEach, seed) { let y = .14; for (let set = 0; set < sets; set++) {
    for (let k = 0; k < perSet; k++) { const sec = trellisSection({ seed: seed + set * 7 + k, weathered: .3 }); sec.setOpen(sec.minOpen);
      const lay = new THREE.Group(); lay.rotation.x = -Math.PI / 2; const spin = new THREE.Group(); spin.rotation.z = -Math.PI / 2; lay.add(spin); spin.add(sec);
      sec.position.set(-sec.userData.cx, -sec.userData.height / 2 + sec.userData.end0, 0); const row = Math.floor(k / 2), col = k % 2, alone = k === perSet - 1 && perSet % 2;
      lay.position.set((rnd() - .5) * .06, y + row * .052, alone ? (rnd() - .5) * .2 : (col - .5) * (sec.userData.width + .04)); s.add(lay); }
    y += Math.ceil(perSet / 2) * .052;
    for (let d = 0; d < doorsEach; d++) { const dm = new THREE.Mesh(new THREE.BoxGeometry(1.98, .045, 1.1), [M.pallet, M.pallet, DOORMAT, M.pallet, M.pallet, M.pallet]); dm.position.set((rnd() - .5) * .05, y + .022, (rnd() - .5) * .06); dm.castShadow = dm.receiveShadow = true; s.add(dm); y += .05; } }
  return y; }
function stillageFrame(s, mat, L = 2.3, D = 1.35, post = .95) {
  for (const sz of [-1, 1]) box(s, L, .07, .07, mat, 0, .05, sz * (D / 2 - .04));
  for (const sx of [-1, 1]) { box(s, .07, .07, D, mat, sx * (L / 2 - .04), .05, 0); for (const sz of [-1, 1]) { box(s, .07, post, .07, mat, sx * (L / 2 - .04), 0, sz * (D / 2 - .04)); box(s, .14, .015, .14, mat, sx * (L / 2 - .04), 0, sz * (D / 2 - .04)); const c = new THREE.Mesh(new THREE.ConeGeometry(.05, .08, 8), mat); c.position.set(sx * (L / 2 - .04), post - .02, sz * (D / 2 - .04)); s.add(c); } }
  for (const xx of [-.4, .4]) box(s, .1, .1, D, mat, xx, 0, 0); }
function trellisStillages(p, x, z, ry, levels) { const g = grp(p, x, 0, z, ry); let y = 0;
  levels.forEach((lv, i) => { const s = grp(g, 0, y, 0); stillageFrame(s, M.purple); const top = trellisLoad(s, lv.sets, lv.per, lv.doors, 100 + i * 31 + Math.floor(x * 7 + z));
    if (lv.film !== false) { const f = new THREE.Mesh(new THREE.BoxGeometry(2.36, top + .04, 1.41), MX.film); f.position.y = (top + .04) / 2; f.userData.keep = true; s.add(f); }
    y += 1.0; }); return g; }
// bags
const bagGeos = [0, 1, 2, 3].map(() => { const g = new THREE.SphereGeometry(.5, 22, 14), p = g.attributes.position, v = new THREE.Vector3(); const ph = [rnd() * 6, rnd() * 6, rnd() * 6, rnd() * 6];
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); let y = v.y; if (y < -.18) y = -.18 - (y + .18) * .35; const sl = 1 + .22 * Math.max(0, -y);
    const r = 1 + .07 * Math.sin(v.x * 7 + ph[0]) * Math.sin(v.z * 6 + ph[1]) + .05 * Math.sin(v.y * 9 + v.x * 5 + ph[2]) + .03 * Math.sin(v.z * 15 + v.y * 13 + ph[3]);
    v.set(v.x * sl * r, y * r * (y > 0 ? .85 : 1), v.z * sl * r); p.setXYZ(i, v.x, v.y, v.z); } g.computeVertexNormals(); return g; });
const _bm = {}; const bagMat = c => _bm[c] || (_bm[c] = STD({ map: tex(256, 256, (x, w, h) => { fabric(x, w, h, c); for (let i = 0; i < 14; i++) { x.strokeStyle = `rgba(0,0,0,${.06 + rnd() * .08})`; x.lineWidth = 2 + rnd() * 3; x.beginPath(); const y0 = rnd() * h; x.moveTo(0, y0); x.bezierCurveTo(w * .3, y0 + (rnd() - .5) * 60, w * .7, y0 + (rnd() - .5) * 60, w, y0 + (rnd() - .5) * 40); x.stroke(); } }), roughness: .95 }));
const _tm = {}; const tagMat = c => _tm[c] || (_tm[c] = STD({ color: c, roughness: .5, side: THREE.DoubleSide, emissive: c, emissiveIntensity: .12 }));
function bag(p, x, y, z, w, h, d, col, tagCol, ry = 0) { const b = new THREE.Mesh(bagGeos[Math.floor(rnd() * 4)], bagMat(col)); b.scale.set(w, h, d); b.position.set(x, y + h * .5, z); b.rotation.y = ry; b.castShadow = b.receiveShadow = true; p.add(b);
  if (tagCol) { const t = new THREE.Mesh(new THREE.PlaneGeometry(.055, .09), tagMat(tagCol)); t.position.set(x + (rnd() - .5) * w * .5, y + h * (.3 + rnd() * .4), z + d * .5 + .01); t.rotation.set((rnd() - .5) * .4, (rnd() - .5) * .4, (rnd() - .5) * .6); p.add(t); } }
function bagRack(p, x, z, ry, levels, step, cols, tagCol, mat = M.stillGreen, w = 1.25, d = 1.05) { const g = grp(p, x, 0, z, ry);
  for (let lv = 0; lv < levels; lv++) { const s = grp(g, 0, lv * step, 0);
    for (const sx of [-1, 1]) { box(s, .06, .06, d, mat, sx * (w / 2 - .03), .02, 0); for (const sz of [-1, 1]) { box(s, .055, step - .03, .055, mat, sx * (w / 2 - .03), 0, sz * (d / 2 - .03)); const c = new THREE.Mesh(new THREE.ConeGeometry(.05, .08, 8), mat); c.position.set(sx * (w / 2 - .03), step - .05, sz * (d / 2 - .03)); s.add(c); } }
    for (const sz of [-1, 1]) box(s, w, .06, .06, mat, 0, .02, sz * (d / 2 - .03)); for (const xx of [-.3, .3]) box(s, .12, .04, d, mat, xx, .02, 0);
    const n = 5 + Math.floor(rnd() * 3); for (let k = 0; k < n; k++) { const c = cols[Math.floor(rnd() * cols.length)], row = k < 3 ? 0 : 1; bag(s, -w / 2 + .22 + (k % 3) * ((w - .44) / 2) + (rnd() - .5) * .1, .06 + row * step * .36, (rnd() - .5) * .3 + (row ? -.12 : .12), .46 + rnd() * .14, step * (.46 + rnd() * .1), .58 + rnd() * .14, c, tagCol, (rnd() - .5) * 1.2); } }
  return g; }
// pole stillages
const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), v4 = new THREE.Vector3(), s4 = new THREE.Vector3(), c4 = new THREE.Color();
const hollowGeo = r => { const s = new THREE.Shape(); s.absarc(0, 0, r, 0, Math.PI * 2); const h = new THREE.Path(); h.absarc(0, 0, r * .82, 0, Math.PI * 2, true); s.holes.push(h); const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false, curveSegments: 12 }); g.translate(0, 0, -.5); return g; };
function tubes(p, n, x0, x1, y0, rows, len, r, mat, o = {}) { const geo = o.hollow ? hollowGeo(r) : (() => { const g = new THREE.CylinderGeometry(r, r, 1, 10); g.rotateX(Math.PI / 2); return g; })();
  const im = new THREE.InstancedMesh(geo, mat, n), per = Math.ceil(n / rows);
  for (let i = 0; i < n; i++) { const row = Math.floor(i / per), k = i % per; e4.set((rnd() - .5) * (o.tilt || .03), (rnd() - .5) * (o.yaw || .04), 0); q4.setFromEuler(e4);
    v4.set(x0 + (k + .5) / per * (x1 - x0) + (rnd() - .5) * r, y0 + r + row * r * 1.9, (o.z || 0) + (rnd() - .5) * (o.zj || .3)); s4.set(1, 1, len * (.85 + rnd() * .3)); m4.compose(v4, q4, s4); im.setMatrixAt(i, m4);
    if (o.tint) { const t = .85 + rnd() * .3; im.setColorAt(i, c4.setRGB(t, t * .93, t * .8)); } }
  im.castShadow = im.receiveShadow = true; p.add(im); return im; }
function rolls(p, n, x0, x1, y0, len, r, z = 0) { for (let i = 0; i < n; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 18), MX.jute); c.rotation.x = Math.PI / 2; c.position.set(x0 + (i + .5) / n * (x1 - x0), y0 + r, z + (rnd() - .5) * .3); c.castShadow = c.receiveShadow = true; p.add(c); } }
function lump(p, x, y, z, w, h, d, mat) { const g = new THREE.BoxGeometry(w, h, d, 6, 4, 6), pp = g.attributes.position; for (let i = 0; i < pp.count; i++) if (pp.getY(i) > 0) pp.setY(i, pp.getY(i) + (rnd() - .5) * h * .3); g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); m.position.set(x, y + h / 2, z); m.castShadow = m.receiveShadow = true; p.add(m); return m; }
function blackCrate(p, x, y, z, w = .75, h = .36, d = .55, ry = 0, label) { const g = grp(p, x, y, z, ry); const lid = label ? STD({ map: tex(256, 128, (c, W, H) => { c.fillStyle = '#1d1f22'; c.fillRect(0, 0, W, H); c.fillStyle = '#eee'; c.font = 'italic 26px Comic Sans MS, cursive'; c.fillText(label, 20, 60); }) }) : MX.black;
  box(g, w, h, d, [MX.black, MX.black, MX.black, MX.black, lid, MX.black], 0, 0, 0); box(g, w + .03, .04, d + .03, MX.black, 0, h - .02, 0); return g; }
function poleLevel(p, y, h, mat, W = 1.05, D = 2.4, mesh = false) { const s = grp(p, 0, y, 0);
  for (const sx of [-1, 1]) { box(s, .06, .07, D, mat, sx * (W / 2 - .03), 0, 0); for (const sz of [-1, 1]) { box(s, .06, h - .02, .06, mat, sx * (W / 2 - .03), 0, sz * (D / 2 - .03)); const c = new THREE.Mesh(new THREE.ConeGeometry(.06, .1, 8), mat); c.position.set(sx * (W / 2 - .03), h - .05, sz * (D / 2 - .03)); s.add(c); } }
  for (const sz of [-1, 1]) box(s, W, .07, .06, mat, 0, 0, sz * (D / 2 - .03)); box(s, W - .1, .015, D - .1, STD({ color: 0x4e1f1b, metalness: .4 }), 0, .06, 0);
  if (mesh) { const mm = new THREE.MeshStandardMaterial({ map: tex(256, 256, (x, w, hh) => { x.strokeStyle = '#6a2420'; x.lineWidth = 2; for (let i = 0; i < w; i += 12) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, hh); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); } }), transparent: true, alphaTest: .5, side: THREE.DoubleSide });
    for (const sz of [-1, 1]) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(W, h - .1), mm); pl.position.set(0, h / 2, sz * D / 2); s.add(pl); } for (const sx of [-1, 1]) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(D, h - .1), mm); pl.rotation.y = Math.PI / 2; pl.position.set(sx * W / 2, h / 2, 0); s.add(pl); } }
  return s; }
const RAFTER = STD({ map: grain('#d9bb8c', '140,100,55', 256, 32, 1) });
function poleStillage(p, x, z, ry, levels, fills, mat = M.red, W = 1.05, D = 2.6) { const g = grp(p, x, 0, z, ry); let y = 0;
  levels.forEach((h, i) => { const s = poleLevel(g, y, h, mat, W, D, fills[i] === 'cage'); fill(s, fills[i], h, W, D); y += h; }); return g; }
function fill(s, kind, h, W, D) {
  if (kind === 'rafters') tubes(s, 36, -W / 2 + .08, W / 2 - .08, .08, 3, D + .3, .024, RAFTER, { tint: true, zj: .15 });
  // yurt roof poles by size: length ≈ (radius − crown radius) ÷ cos(roof pitch ≈ 32°) + 0.1 m at the ends
  else if (kind === 'r16') tubes(s, 36, -W / 2 + .08, W / 2 - .08, .08, 3, 2.3, .026, RAFTER, { tint: true, zj: .15 });
  else if (kind === 'r14') tubes(s, 38, -W / 2 + .08, W / 2 - .08, .08, 3, 2.0, .024, RAFTER, { tint: true, zj: .15 });
  else if (kind === 'r12') tubes(s, 40, -W / 2 + .08, W / 2 - .08, .08, 3, 1.7, .022, RAFTER, { tint: true, zj: .15 });
  else if (kind === 'poles') tubes(s, 20, -W / 2 + .1, W / 2 - .1, .08, 2, D + 1.2, .06, RAFTER, { tint: true, zj: .4 });
  else if (kind === 'alu') { tubes(s, 16, -W / 2 + .08, W / 2 - .08, .08, 2, D + .4, .032, MX.alu, { hollow: true, z: .2, tilt: .06 }); if (rnd() < .5) lump(s, 0, .25, -.4, W - .2, .25, 1.0, MX.white); }
  else if (kind === 'coir') { rolls(s, 3, -W / 2 + .05, W / 2 - .05, .08, 1.4, .16); lump(s, 0, .4, .2, W - .2, .3, 1.4, MX.jute); }
  else if (kind === 'cage') { lump(s, 0, .08, 0, W - .15, h * .6, D - .2, MX.white); }
  else if (kind === 'crates') { blackCrate(s, 0, .08, .4); blackCrate(s, 0, .08, -.5); lump(s, 0, .45, 0, W - .2, .25, 1.6, MX.jute); }
  else if (kind === 'timber') { for (let k = 0; k < 18; k++) box(s, .09, .05, D + .5, MX.timber, -W / 2 + .1 + (k % 6) * ((W - .2) / 5), .08 + Math.floor(k / 6) * .055, (rnd() - .5) * .2); } }
function racking(p, x, z, ry, bays, beams, bw = 2.7, dep = 1.1, beamMat = MX.orange, fillFn) { const g = grp(p, x, 0, z, ry), H = beams[beams.length - 1] + 1.2;
  for (let b = 0; b <= bays; b++) for (const zz of [-dep / 2, dep / 2]) { box(g, .08, H, .08, MX.upright, b * bw, 0, zz); for (let yy = .4; yy < H; yy += .9) { const br = box(g, .03, .03, dep, MX.upright, b * bw, yy, 0); } }
  for (let b = 0; b < bays; b++) for (const yy of beams) { for (const zz of [-dep / 2, dep / 2]) box(g, bw, .12, .05, beamMat, b * bw + bw / 2, yy, zz); if (fillFn) fillFn(g, b * bw + bw / 2, yy + .12, b, yy); }
  return g; }
function rackFill(g, cx, y) { for (let k = 0; k < 3; k++) { const x = cx - .85 + k * .85, kind = rnd();
  if (kind < .3) { box(g, .62, .4, .78, STD({ color: 0xe9eef0, transparent: true, opacity: .75, roughness: .2 }), x, y, 0); box(g, .66, .04, .82, STD({ color: 0xd5dde1 }), x, y + .4, 0); }
  else if (kind < .6) box(g, .7, .45 + rnd() * .15, .8, STD({ map: tex(128, 128, (c, w, h) => { c.fillStyle = '#b48a58'; c.fillRect(0, 0, w, h); c.fillStyle = '#8a6a40'; c.fillRect(0, h / 2 - 4, w, 8); }) }), x, y, 0);
  else if (kind < .85) { box(g, .78, .55, .6, MX.ply, x, y, 0); for (const s of [-1, 1]) box(g, .1, .04, .02, MX.alu, x + s * .2, y + .4, .31); }
  else box(g, .75, .5, .75, STD({ color: 0x2c5fa0, roughness: .5 }), x, y, 0); } }

// ---------------- the layout ----------------
function layout() {
  const P = scene;
  // ===== door end, left: workshop under the mezzanine, racking with the mezzanine store over it, IBCs =====
  zone('Door end · left');
  { const g = grp(P); const MW = 4.0, ML = 8.0;   // Josh: on the left as you walk in, about 8 m along the wall × 4 m deep
    box(g, MW, .22, ML, MX.steel, MW / 2, 3.0, -ML / 2 - .1); for (const [x, z] of [[.3, -.3], [MW - .1, -.3], [MW - .1, -ML / 2], [MW - .1, -ML], [.3, -ML]]) box(g, .14, 3.0, .14, MX.steel, x, 0, z);
    box(g, MW, 3.0, .05, MX.osb, MW / 2, 0, -.15); box(g, .05, 3.0, ML - .2, MX.osb, MW, 0, -ML / 2 - .1);   // workshop walls
    box(g, .04, .9, 1.6, STD({ color: 0x8aa0ad, metalness: .4, roughness: .1 }), MW + .04, 1.2, -2.6); box(g, .04, .9, 1.6, STD({ color: 0x8aa0ad, metalness: .4, roughness: .1 }), MW + .04, 1.2, -6.0);
    box(g, .06, 2.0, .9, MX.osb, MW + .04, 0, -4.3);                                                         // door
    box(g, MW, 2.4, .05, MX.osb, MW / 2, 3.22, -.15); box(g, .05, .62, ML - .2, MX.osb, MW, 3.22, -ML / 2 - .1); box(g, .05, .5, ML - .2, MX.osb, MW, 5.12, -ML / 2 - .1);   // sewing room walls, open in the middle so you can see in
    for (const [dy, h] of [[3.84, .06], [5.1, .06]]) box(g, .1, h, 2.7, MX.timber, MW + .03, dy, -4.0); for (const dz of [-5.32, -2.68]) box(g, .1, 1.3, .06, MX.timber, MW + .03, 3.84, dz);   // open front onto the aisle
    // the sewing room up top (Josh): long cutting tables, industrial machines, rolls of canvas, strip lights
    { const sw = grp(g, 0, 3.22, 0), TOP = STD({ color: 0xe9e6dc, roughness: .6 }), LEG = STD({ color: 0x5b5f63, metalness: .5, roughness: .4 });
      for (const [x, z, L] of [[1.3, -2.4, 3.2], [1.3, -6.0, 2.4]]) { box(sw, 1.2, .04, L, TOP, x, .86, z); for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(sw, .05, .86, .05, LEG, x + sx * .55, 0, z + sz * (L / 2 - .1)); }
      for (let i = 0; i < 2; i++) { const t = new THREE.Mesh(new THREE.BoxGeometry(1.2, .02, 2.2), STD({ color: [0xcbb998, 0x3f5a46][i], roughness: .95 })); t.position.set(1.3, .91 + i * .02, -2.4 + i * .3); t.rotation.y = (rnd() - .5) * .1; t.castShadow = true; sw.add(t); }   // canvas laid out on the cutting table
      for (const z of [-4.4, -5.0]) { box(sw, .55, .74, 1.1, STD({ color: 0x3c3f44, roughness: .5 }), 3.1, 0, z); box(sw, .55, .04, 1.1, TOP, 3.1, .74, z);
        const mc = grp(sw, 3.1, .78, z); box(mc, .18, .1, .45, STD({ color: 0x2b4a7a, roughness: .35, metalness: .2 }), 0, 0, 0); box(mc, .12, .26, .1, STD({ color: 0x2b4a7a, roughness: .35, metalness: .2 }), 0, .1, -.17); box(mc, .12, .1, .4, STD({ color: 0x2b4a7a, roughness: .35, metalness: .2 }), 0, .32, -.02); cyl(mc, .008, .14, M.steel, 0, .22, .17); }
      for (let i = 0; i < 6; i++) { const c = cyl(sw, .12, 1.5, STD({ color: [0xd8cdb4, 0x3f5a46, 0xcbb998, 0xece8df][i % 4], roughness: .95 }), .45, .12 + Math.floor(i / 3) * .24, -6.6 - (i % 3) * .26, 'x', 16); }   // canvas rolls
      for (let i = 0; i < 3; i++) bag(sw, 2.9, 0, -6.8 - i * .45, .45, .34, .55, '#3e5240', '#9cff3a');
      for (const z of [-2, -4, -6]) { box(sw, .12, .04, 1.4, STD({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: .8 }), 1.6, 2.3, z); } }
    for (let i = 0; i < 3; i++) box(g, 1.1, .2, .9, MX.ply, 1.2, 3.22 + i * .21, -6.4);
    T(g, 'Workshop + sewing room', 'On the left as you walk in: a boxed-in workshop under a steel mezzanine (OSB walls, windows and a door onto the aisle, bench and tool wall inside). Up on the mezzanine is the sewing room: long cutting tables with canvas laid out, industrial sewing machines, rolls of canvas and a few bags waiting for repair.', '≈ 8 × 4 m (Josh) · deck ≈ 3 m up', 'sure'); }
  { const r = racking(P, .65, -8.6, LEFT, 2, [.15, 1.35, 2.55, 3.75], 2.7, 1.1, MX.yellow, rackFill);
    const lad = grp(P, 1.4, 0, -8.2); lad.rotation.z = -.1; for (const s of [-1, 1]) box(lad, .08, 4.4, .05, MX.yellow, 0, 0, s * .22); for (let i = 0; i < 13; i++) box(lad, .05, .04, .44, MX.alu, 0, .3 + i * .32, 0);
    T(r, 'Yellow racking: flight cases + tubs', 'Pallet racking with yellow beams along the left wall: ply flight cases with latches, clear storage tubs, boxes and blue crates; a yellow fibreglass ladder at the end.', '2 bays × 2.7 m · beams at 1.35 / 2.55 / 3.75 m', 'fairly sure'); }
  { const g = grp(P, 2.6, 0, -13.4, LEFT); let y = 0; for (let i = 0; i < 3; i++) { pallet(g, 1.2, 1.0, y); box(g, 1.1, .95, .95, STD({ color: 0xe8e6dc, roughness: .35, transparent: true, opacity: .9 }), 0, y + .15, 0); const cage = new THREE.Mesh(new THREE.BoxGeometry(1.16, .98, 1.0, 6, 5, 5), new THREE.MeshStandardMaterial({ color: 0x9a9fa3, wireframe: true, metalness: .6 })); cage.position.y = y + .64; g.add(cage); y += 1.16; }
    T(g, 'IBC water tanks', 'Caged 1,000 litre IBC tanks, three high, just past the yellow racking.', '1.2 × 1.0 × 1.15 m each'); }
  // ===== door end, right: orange racking, black crate tower, trellis leaning, low floor-panel stack =====
  zone('Door end · right');
  { const r = racking(P, 19.35, -9.1, RIGHT, 3, [1.2, 2.3, 3.3], 2.7, 1.1, MX.orange, rackFill);
    T(r, 'Orange racking', 'Pallet racking with orange beams on the right of the door: boxes, ply crates, flight cases.', '3 bays × 2.7 m', 'fairly sure'); }
  { const g = plainStack(P, coverMats('bedx', '#1c1d20', '#e9e9e6', null, { window: false }), 16.6, -2.0, RIGHT, [[0, 3]], 1.2, 1.1, 1.0); g.scale.setScalar(1);
    const film = new THREE.Mesh(new THREE.BoxGeometry(1.3, 3.95, 1.1), MX.film); film.position.y = 1.97; film.userData.keep = true; g.add(film);
    T(g, 'Black crate tower', 'Three black Green Yurts crates stacked and cling-filmed together beside the door, with a flight case on wheels and a stack of trays next to it.', '≈ 3.9 m tall', 'fairly sure'); }
  { const g = grp(P, 14.6, 0, -1.6, -.3); for (let i = 0; i < 6; i++) { const s = trellisSection({ seed: 700 + i, weathered: .4 }); s.setOpen(s.minOpen); const h = grp(g, 0, 0, i * .1); h.rotation.x = -.3; h.add(s); s.position.set(-s.userData.cx, s.userData.end0, 0); }
    T(g, 'Trellis stood on end', 'Folded trellis sections stood up and leaning, next to the doorway.', '≈ 2.5 m tall'); }
  { const g = grp(P, 13.0, 0, -3.8, .05); for (let i = 0; i < 9; i++) { box(g, 1.95, .04, 1.1, STD({ map: grain(['#5a3a26', '#6a4430', '#4e3322'][i % 3], '30,20,10') }), (rnd() - .5) * .08, i * .048, 0); box(g, 1.8, .01, .06, M.pallet, 0, i * .048 + .04, .4); }
    T(g, 'Floor panels (low stack)', 'A short stack of dark hardwood-faced yurt floor panels by the aisle.', '≈ 2.0 × 1.1 m'); }
  // ===== the aisle: forklift and a loose bag =====
  zone('Aisle');
  { const f = buildForklift(); f.position.set(9.6, 0, -6.5); f.rotation.y = Math.PI; f.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); P.add(f);
    T(f, 'Forklift: Doosan G15S', 'The gas forklift (FTD 8548): DAEWOO on the mast, Calor bottle on the back, orange beacon.', '1.07 m wide · 2.16 m to the guard'); }
  { const g = grp(P, 11.2, 0, -9.4); bag(g, 0, 0, 0, 1.1, .4, .6, '#dcdcd6', null, .4); T(g, 'Canvas kit bag', 'A white canvas kit bag left on the floor.', ''); }
  // ===== right wall going in: ovens, Bedouin Extra, crown crates =====
  zone('Ovens · Bedouin · crowns');
  { const g = plainStack(P, coverMats('oven', '#1c1d20', '#e9e9e6', 'OVEN', { labelSize: 70 }), 19.3, -8.4, RIGHT, [[0, 3]]); T(g, 'Oven crates', 'Black covers marked "OVEN", three high: the wood-fired pizza ovens.', '≈ 1.2 × 1.0 × 1.25 m each'); }
  { const bm = coverMats('bed', '#1c1d20', '#e9e9e6', 'BEDOUIN EXTRA', { labelSize: 64 }); const g = grp(P, 19.1, 0, -11.8, RIGHT);
    const bed = (x, y, z, w, h, d) => { const pg = grp(g, x, y, z); pallet(pg, w, d); const c = coverMesh(w + .02, h, d + .02, bm); c.position.y = .144 + h / 2; pg.add(c); };
    bed(0, 0, 0, 2.1, 1.04, 1.2); bed(-.5, 1.24, -.05, 1.1, 1.04, 1.1); bed(.1, 2.5, 0, 2.2, 1.1, 1.2);
    const rc = grp(g, .75, 1.24, .05); pallet(rc, 1.0, 1.1); const ply = STD({ map: tex(512, 384, (x, w, h) => { x.drawImage(MX.ply.map.image, 0, 0, w, h); x.fillStyle = 'rgba(30,25,20,.75)'; x.font = 'bold 34px Arial'; x.fillText('BEDOUIN', 300, 120); x.fillText('RECEPTION', 290, 160); drawBadge(x, 160, 220, 110, 'rgba(30,25,20,.75)', 'rgba(0,0,0,0)'); x.fillStyle = '#0c0a08'; x.beginPath(); x.arc(70, 70, 34, 0, 7); x.fill(); }) });
    box(rc, 1.0, 1.0, 1.1, [ply, ply, MX.ply, MX.ply, ply, ply], 0, .144, 0);
    T(g, 'Bedouin Extra crates', 'Black covers marked "BEDOUIN EXTRA" with dated check sheets in the pocket (spare kit for the Bedouin tents), three high, with the ply "BEDOUIN RECEPTION" crate (round hand-hole) on the middle level.', 'bottom ≈ 2.1 × 1.2 m'); }
  { const g = grp(P, 17.2, 0, -12.6, -.2); for (const dx of [0, 1.5]) { const s = grp(g, dx, 0, 0); const w = 1.2, d = 1.0; for (const sx of [-1, 1]) for (const sz of [-1, 1]) { box(s, .07, .9, .07, M.lime, sx * (w / 2 - .035), 0, sz * (d / 2 - .035)); box(s, .09, .18, .09, M.lime, sx * (w / 2 - .035), 0, sz * (d / 2 - .035)); } for (const sz of [-1, 1]) box(s, w, .08, .07, M.lime, 0, .1, sz * (d / 2 - .035)); for (const sx of [-1, 1]) box(s, .07, .08, d, M.lime, sx * (w / 2 - .035), .1, 0); for (const xx of [-.28, .28]) box(s, .2, .06, d, M.lime, xx, .1, 0); }
    T(g, 'Lime stillages (new, empty)', 'Brand-new lime-green post pallets with removable posts, standing empty.', '≈ 1.2 × 1.0 × 0.9 m'); }
  { const g = crownStack(P, K14, 19.1, -14.6, RIGHT, [[0, 3], [1, 2], [2, 2]]); /* 7: 5 counted in photo 5 + 2 more (Josh) */ const top = onTop(grp(g, 1.32, 2.48, 0), 2); for (let i = 0; i < 8; i++) pallet(top, 1.2, .8, i * .145, .2); const cu = onTop(grp(g, 2.64, 2.48, 0), 2); for (let i = 0; i < 6; i++) box(cu, 1.15, .15, .62, STD({ color: 0x24262a, roughness: .55 }), 0, i * .165, 0);
    T(g, '14 ft crown crates', 'Green covers "14FT CROWN × 5": five 14 ft yurt crowns per crate, seven crates (up to three high), with a stack of empty pallets and black cushion pads beside them.', '1.2 × 1.0 × 1.24 m each'); }
  { const g = crownStack(P, K16, 19.1, -18.6, RIGHT, [[0, 4], [1, 3]]);   // 7 counted (photo 51)
    const cage = onTop(grp(g, 1.32, 3.72, 0), 3); poleLevel(cage, 0, 1.0, M.red, 1.2, 1.0, true); for (let k = 0; k < 4; k++) blackCrate(cage, -.27 + (k % 2) * .54, .1 + Math.floor(k / 2) * .37, -.2, .5, .34, .38);
    T(g, '16 ft crown crates', 'Green covers "16FT CROWN × 5", stacked up to four high (about 5 m), with a red mesh cage of black crates on top of the middle column.', '1.2 × 1.0 × 1.24 m each'); }
  { const g = grp(P, 16.2, 0, -19.6, -.25); for (let i = 0; i < 3; i++) { const c = crown(g, 1.0, i * .14, .5, 0); c.rotation.x = Math.PI / 2; }
    T(g, 'Spare crowns (on edge)', 'Loose yurt crowns stood on edge against the crown crates.', '≈ 1.0 m across'); }
  { const g = canvasStack(P, 0, 17.0, -22.0, RIGHT, [[0, 2, ['', '']]], '#1f3f9a', '5 × TIPI CANVAS'); T(g, 'Tipi canvas crates', 'Blue covers marked "5 × TIPI CANVAS": five tipi canvases per crate, two high.', '≈ 1.2 × 1.0 m'); }
  { const g = canvasStack(P, 12, 17.0, -23.4, RIGHT, [[0, 1, ['10–18']]], '#1f3f9a'); T(g, '12 ft canvas crate', 'Blue cover marked "12ft CANVAS 10–18".', '≈ 1.2 × 1.0 m'); }
  // ===== right wall, far half: the bell tent bag racks, with the door stillages in front =====
  zone('Bag racks · door stillages');
  { const g = grp(P); const cols = [['#3e5240', '#45594a', '#34463a', '#e6dccb'], ['#a9b2ad', '#b8c0bb', '#9ea7a2'], ['#e6dccb', '#d9cbb3', '#3e5240'], ['#e6dccb', '#3e5240']];
    [[-24.6, 6, 0, '#9cff3a'], [-25.9, 6, 0, '#9cff3a'], [-27.2, 5, 1, null], [-28.5, 5, 2, '#ff3b3b'], [-29.8, 4, 2, '#ff3b3b'], [-31.1, 5, 3, '#9cff3a']].forEach(([z, lv, c, t]) => bagRack(g, 19.3, z, RIGHT, lv, .8, cols[c], t));
    [[-24.6, 5], [-25.9, 4], [-27.2, 5]].forEach(([z, lv]) => bagRack(g, 18.05, z, RIGHT, lv, .8, cols[(z * 3 | 0) % 2 ? 0 : 2], '#9cff3a'));
    T(g, 'Tent bag racks', 'Green post pallets four to six high, two deep against the right wall. Dark green bags are Emperor tents (emps); grey and beige bags are bell tents; pink bags: not known yet. Tags show condition: lime-green = good, red = bad.', 'post pallets 1.25 × 1.05 m · 0.8 m a level'); }
  { const g = grp(P); [[14.6, -25.0, .05, [{ sets: 1, per: 4, doors: 2 }]], [14.4, -27.2, -.04, [{ sets: 1, per: 4, doors: 2 }]], [14.7, -29.4, .02, [{ sets: 1, per: 4, doors: 2 }, { sets: 1, per: 4, doors: 1 }, { sets: 1, per: 4, doors: 1 }]], [11.9, -26.0, .08, [{ sets: 1, per: 4, doors: 2 }]]]
      .forEach(([x, z, ry, lv]) => trellisStillages(g, x, z, Math.PI / 2 + ry, lv));
    T(g, '16 ft trellis + door stillages', 'Purple stillages, one 16 ft yurt each: 4 trellis sections folded and laid two side by side, with the door set (pine boards, black strap hinges) laid flat on top, cling-filmed. One stack is three high.', 'stillages 2.32 × 1.35 m'); }
  // ===== left wall, middle: trellis wall stack, blue pole stillages, 14 ft canvas + 14 ft trellis/door stillages =====
  zone('14 ft kit · left wall');
  { const g = trellisStillages(P, .8, -15.2, LEFT, [{ sets: 1, per: 4, doors: 0 }, { sets: 1, per: 4, doors: 0 }, { sets: 1, per: 4, doors: 0 }]); T(g, 'Trellis stillages (wall stack)', 'Purple stillages of folded trellis, three high against the left wall.', '≈ 3 m tall'); }
  { const g = poleStillage(P, .75, -18.6, LEFT, [.5, .5, .5, .5, .5, .5, .5, .5, .5], Array(9).fill('r14'), M.blue, 1.15, 2.2); T(g, 'Pole stillages (blue): 14 ft', 'Blue pole stillages stacked nine high (about 4.5 m): the 14 ft yurt roof poles, strapped in bundles.', 'poles ≈ 2.0 m (worked out from the yurt size) · 0.5 m a level'); }
  { const g = grp(P, .8, 0, -21.6, LEFT); const cv = canvasStack(g, 14, 0, 0, 0, [[0, 1, ['13–17']]]); const cage = grp(g, 0, .84, 0); poleLevel(cage, 0, .76, M.red, 1.2, 1.0, true); lump(cage, 0, .08, 0, 1.0, .55, .85, MX.white);
    const up = canvasStack(g, 14, -.15, -.45, 0, [[0, 3, ['28–32', '18–22', '8–12']]]); up.position.y = 1.6;
    T(g, '14 ft canvas crates', 'Red covers marked "14ft CANVAS" with number ranges (13–17, 28–32, 18–22, 8–12…): 14 ft yurt canvases, five to a crate, numbered so a set goes out together; a red mesh cage of bulk bags between them.', '≈ 1.2 × 1.0 × 0.84 m each'); }
  { const g = trellisStillages(P, 3.4, -21.9, LEFT + .03, [{ sets: 5, per: 3, doors: 1 }, { sets: 5, per: 3, doors: 1 }, { sets: 5, per: 3, doors: 1 }]);   // Josh: 5 doors per stillage, 3 trellis each
    T(g, '14 ft trellis + door stillages', 'Purple stillages three high next to the 14 ft canvas. A 14 ft yurt is 3 trellis sections per door, and each stillage holds 5 doors with their trellis: 15 sections, the folded trellis laid two side by side with each door flat on its set, cling-filmed.', 'stillages 2.32 × 1.35 m · 5 yurts each · ≈ 3.1 m tall'); }
  { const g = poleStillage(P, .75, -25.4, LEFT, [.5, .5, .5, .5, .5, .5], ['r16', 'r16', 'r16', 'r12', 'r12', 'r12'], M.red, 1.15, 2.4); T(g, 'Pole stillages (red): 16 ft + 12 ft', 'Red pole stillages six high along the left wall: the 16 ft and 12 ft yurt roof poles, strapped in bundles.', 'poles ≈ 2.3 m (16 ft) and 1.7 m (12 ft), worked out from the yurt sizes'); }
  { const g = crownStack(P, K12, 7.2, -15.6, Math.PI, [[0, 1], [1, 1]]); const top = crownCrate(g, K12, .66, 1.24, 0); top.userData.level = 1; CRATES.push(top);   // 3 here + 1 by the door = 4 counted (photo 11)
    const byDoor = crownStack(P, K12, 6.3, -2.6, Math.PI / 2, [[0, 1]]); T(byDoor, '12 ft crown crate (by the door)', 'A single "12FT CROWN × 12" crate near the roller door.', '1.2 × 1.0 × 1.24 m');
    T(g, '12 ft crown crates', 'Green covers "12FT CROWN × 12": twelve 12 ft yurt crowns per crate, out in the middle of the hall.', '1.2 × 1.0 × 1.24 m each'); }
  { const g = plainStack(P, coverMats('white', '#efeee9', '#161616', null, { window: false }), 4.4, -15.6, Math.PI, [[0, 2], [1, 2]], 1.2, 1.04, 1.0); T(g, 'Safari tent crates', 'White covers with the black Green Yurts badge, two high: the safari tents (Josh).', '≈ 1.2 × 1.0 × 1.2 m each'); }
  { const g = grp(P, 4.6, 0, -12.6); pallet(g, 2.2, 1.15); box(g, 2.2, 1.05, 1.15, [MX.ply, MX.ply, MX.ply, MX.ply, STD({ map: tex(512, 256, (x, w, h) => { x.drawImage(MX.ply.map.image, 0, 0, w, h); drawBadge(x, w / 2, h / 2, 100, 'rgba(30,25,20,.8)', 'rgba(0,0,0,0)'); }) }), MX.ply], 0, .144, 0); bag(g, .3, 1.2, 0, 1.0, .18, .4, '#3fae86');
    T(g, 'Plywood crate (GY badge)', 'Big ply crate with clips and the Green Yurts badge burnt on, a rolled green canvas on top.', '≈ 2.2 × 1.15 × 1.2 m'); }
  { const g = grp(P, 2.9, 0, -11.0); for (let i = 0; i < 14; i++) box(g, 1.25, .06, .85, STD({ map: tex(128, 128, (x, w, h) => { x.fillStyle = '#d9dbd9'; x.fillRect(0, 0, w, h); x.strokeStyle = '#4b4f52'; x.lineWidth = 3; for (let k = -w; k < w * 2; k += 18) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + h, h); x.moveTo(k + h, 0); x.lineTo(k, h); x.stroke(); } }) }), (rnd() - .5) * .05, .144 + i * .06, 0); pallet(g, 1.2, 1.0);
    T(g, 'Rugs (folded, strapped)', 'Grey and white diamond-pattern yurt floor rugs folded flat on a pallet.', '≈ 1.25 × 0.85 m'); }
  { const g = grp(P, 7.3, 0, -19.8, .1); for (const s of [0, 1]) for (let i = 0; i < 20; i++) { box(g, 1.95 - rnd() * .2, .035, 1.15 - rnd() * .15, STD({ map: grain(['#5a3a26', '#6a4430', '#4e3322'][i % 3], '30,20,10') }), s * 1.3 - .65 + (rnd() - .5) * .08, i * .048, (rnd() - .5) * .08); }
    T(g, 'Floor panels', 'Yurt floor sections: dark hardwood-faced panels with battens underneath, about twenty high, strapped.', '≈ 2.0 × 1.2 m'); }
  // ===== far end: pole stillage towers, red canvas, timber =====
  zone('Far end · poles + canvas');
  { const g = poleStillage(P, 8.4, -31.2, 0, [1.7, .5, 1.0, 1.13], ['poles', 'alu', 'cage', 'alu']); const s = grp(g, 0, 4.33, 0); tubes(s, 22, -.55, .55, .02, 2, 4.2, .07, RAFTER, { tint: true });
    blackCrate(g, 0, 1.0, .9, .75, .38, .5, .1); for (const xx of [-.15, .2]) { cyl(g, .075, 3.2, RAFTER, xx, .09, 1.6, 'z', 14); const pl = cyl(g, .13, .01, MX.alu, xx, .09, 3.2, 'z', 20); }
    T(g, 'Pole stillage tower', 'Red post pallets four high: round timber roof poles on top (about 4 m), aluminium tubes with snap hooks, a mesh-sided level of folded coir and jute rugs, and centre poles with steel base plates on the bottom.', '1.05 × 2.6 m · ≈ 4.5 m to the top poles'); }
  { const g = poleStillage(P, 6.0, -31.6, 0, [.95, 1.0, 1.05, 1.2], ['cage', 'alu', 'crates', 'coir']); const ply = box(g, .45, .4, .02, STD({ map: tex(128, 128, (x, w, h) => { x.fillStyle = '#c6a273'; x.fillRect(0, 0, w, h); x.fillStyle = '#2a2420'; x.font = 'bold 44px Arial'; x.fillText('6×6', 22, 80); }) }), -.2, .3, 1.31);
    T(g, 'Pole stillages: 6×6 marquee + tubes', 'Four red post pallets: a mesh cage with white canvas and a ply board marked "6×6" (the 6 × 6 m marquee kit), aluminium tubes, black crates, jute and coir matting rolls.', '≈ 4.2 m'); }
  { const g = poleStillage(P, 10.8, -32.0, 0, [1.0, 1.05, 1.05, 1.1], ['coir', 'alu', 'crates', 'alu']); blackCrate(g, 0, 2.15, .7, .75, .32, .55, .4, 'Double Bedouin');
    T(g, 'Pole stillages: Double Bedouin', 'A third red stack: a black crate marked "Double Bedouin + extra bedouin bits", aluminium tubes sticking out at an angle, coir rolls.', '≈ 4.2 m'); }
  { const g = grp(P, 12.2, 0, -29.6, -.15); const n = 80, im = new THREE.InstancedMesh(new THREE.BoxGeometry(.035, .035, 1), RAFTER, n);
    for (let i = 0; i < n; i++) { e4.set(.1 + (rnd() - .5) * .04, (rnd() - .5) * .05, 0); q4.setFromEuler(e4); v4.set(-.3 + (i % 16) * .04, .02 + Math.floor(i / 16) * .036 + (i % 16) * .012, 0); s4.set(1, 1, 1 + rnd() * .2); m4.compose(v4, q4, s4); im.setMatrixAt(i, m4); }
    im.castShadow = true; g.add(im); for (let i = 0; i < 16; i++) box(g, .036, .036, .05, STD({ color: 0xd23a3a }), -.3 + i * .04, .02 + i * .012, -.55);
    T(g, 'Tent stakes', 'A strapped bundle of square timber stakes with red-painted tips.', '≈ 1.0–1.2 m'); }
  { const g = grp(P, 3.6, 0, -29.3); for (let i = 0; i < 4; i++) { tubes(g, 8, -.6, .6, i * .07, 1, 2.6, .035, MX.alu, { hollow: true, yaw: .5, tilt: .05 }); } blackCrate(g, .4, 0, 1.2, .78, .36, .58, -.2); blackCrate(g, -.6, 0, 1.0, .78, .36, .58, .3);
    T(g, 'Loose tubes + black crates', 'Aluminium tubes and black lidded crates on the floor at the foot of the pole stacks.', ''); }
  { const g = canvasStack(P, 16, 4.5, -36.6, FAR, [[0, 5, ['11–15', '41–45', '16–20', '1–5', '21–25']], [1, 4, ['36–40', '', '', '']]]);   // 9 counted (photo 39)
    const g2 = canvasStack(P, 16, .75, -33.8, LEFT, [[0, 5, ['', '', '', '', '']]]);   // 5 counted (photo 2)
    T(g, '16 ft canvas crates', 'Red covers marked "16ft CANVAS" with number ranges on the front: the 16 ft yurt canvases, five to a crate, stacked four or five high in the far-left corner.', '≈ 1.2 × 1.0 × 0.84 m each'); T(g2, '16 ft canvas crates (wall)', 'More "16ft CANVAS" crates along the left wall at the far end.', ''); }
  { const g = poleStillage(P, 13.4, -35.0, 0, [1.05, 1.05, 1.05, 1.05, 1.05], ['poles', 'timber', 'alu', 'coir', 'timber']); T(g, 'Pole tower (far end)', 'Red post pallets five high in the middle of the end wall: long timber poles sticking out both ends, aluminium tubes, canvas and jute bags.', '≈ 5.3 m'); }
  { const g = grp(P, 9.0, 0, -37.9); stillageFrame(g, M.purple, 3.0, .7, .3); for (let i = 0; i < 16; i++) box(g, .09, .05, 3.2, MX.timber, -.4 + (i % 4) * .25, .1 + Math.floor(i / 4) * .055, 0).rotation.y = Math.PI / 2;
    T(g, 'Timber lengths', 'Planed timber lengths in a low stillage against the end wall.', '≈ 3.2 m long'); }
  { const g = grp(P, 9.9, 0, -33.8); box(g, 1.2, .14, .8, STD({ color: 0xc0567a }), 0, 0, 0); T(g, 'Pink plastic pallet', 'A pink plastic pallet left on the floor.', '1.2 × 0.8 m'); }
  { const g = poleStillage(P, 17.6, -35.6, 0, [1.1, 1.1, 1.1, 1.1], ['alu', 'coir', 'alu', 'crates']); T(g, 'Red racks: poles + coir (far right)', 'Red post pallets with aluminium poles, rolled coir and jute matting, white canvas bags and black boxes.', '≈ 4.4 m'); }
  { const g = grp(P, 19.4, 0, -37.0); for (let i = 0; i < 26; i++) box(g, .1, .05, 3.6, MX.timber, (rnd() - .5) * .3, i * .05, 0); T(g, 'Timber stack (wall)', 'Planed timber stacked on battens against the far right wall.', '≈ 3.6 m long'); }
}

// ---------------- bake: merge each item's static meshes by material (far fewer draw calls) ----------------
function bake(root) {
  const merge = THREE_ADDONS.mergeGeometries; let before = 0, after = 0;
  for (const item of INFO) { if (item.userData.noPick) continue; const buckets = new Map(), kill = []; item.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(item.matrixWorld).invert();
    item.traverse(o => { if (o === item) return; if (o.userData.keep || o.userData.lift) { o.traverse(c => { c.userData._skip = true; }); return; } });
    item.traverse(o => { if (!o.isMesh || o.isInstancedMesh || o.userData._skip || Array.isArray(o.material) || o.material.wireframe || o.material.transparent) return; before++;
      const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
      for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k); if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
      (buckets.get(o.material) || buckets.set(o.material, []).get(o.material)).push(geo); kill.push(o); });
    for (const o of kill) o.parent.remove(o);
    for (const [mat, geos] of buckets) { const g = merge(geos, false); if (!g) continue; const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; item.add(m); after++; } }
  return [before, after];
}
