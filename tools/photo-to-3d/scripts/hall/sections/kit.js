// ===== hall kit: detailed builders shared by every hall section (metres, y up) =====
const INFO = [];
function tag(obj, name, what, size, photos, sure = 'fairly sure') { obj.userData.info = { name, what, size, photos: photos || [], sure }; INFO.push(obj); return obj; }
let _seed = 7; const rnd = () => (_seed = (_seed * 16807) % 2147483647) / 2147483647; const rr = (a, b) => a + (b - a) * rnd();
const tex = (w, h, draw, rep) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); } return t; };
const speckle = (x, w, h, base, amt, n) => { x.fillStyle = base; x.fillRect(0, 0, w, h); for (let i = 0; i < n; i++) { const v = rnd() - .5; x.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) * amt})`; x.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1 + rnd() * 3); } };
const STD = o => new THREE.MeshStandardMaterial({ roughness: .8, ...o });
function grain(base, dark, w = 256, h = 64, knots = 2) { return tex(w, h, (x, W, H) => { x.fillStyle = base; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 30; i++) { x.strokeStyle = `rgba(${dark},${.08 + rnd() * .18})`; x.lineWidth = .6 + rnd() * 1.6; x.beginPath(); let y = rnd() * H; x.moveTo(0, y); for (let k = 1; k <= 8; k++) x.lineTo(k * W / 8, y += (rnd() - .5) * 3); x.stroke(); }
  for (let i = 0; i < knots; i++) { const kx = rnd() * W, ky = rnd() * H; for (let r = 5; r > 0; r--) { x.strokeStyle = `rgba(${dark},${.25})`; x.beginPath(); x.ellipse(kx, ky, r * 1.8, r * .8, 0, 0, 7); x.stroke(); } } }); }
const M = {
  floor: STD({ map: tex(512, 512, (x, w, h) => { speckle(x, w, h, '#a8a9a6', .1, 18000); x.strokeStyle = 'rgba(45,45,45,.18)'; x.lineWidth = 3; for (let i = 0; i < 22; i++) { x.beginPath(); let px = rnd() * w, py = rnd() * h; x.moveTo(px, py); for (let k = 0; k < 8; k++) { px += (rnd() - .5) * 120; py += 60; x.lineTo(px, py); } x.stroke(); } }, [8, 8]) }),
  pallet: STD({ map: grain('#c39b67', '110,75,40'), roughness: .9 }), palletDark: STD({ map: grain('#a07c52', '80,55,30'), roughness: .9 }),
  pole: STD({ map: grain('#d9bb8c', '140,100,55', 256, 32, 1) }), crownWood: STD({ map: grain('#d7b47e', '130,90,45', 256, 32, 0), roughness: .6 }),
  black: STD({ color: 0x1b1d20, roughness: .6 }), steel: STD({ color: 0x8d9398, metalness: .7, roughness: .35 }),
  lime: STD({ color: 0x6bd33a, roughness: .45, metalness: .25 }), stillGreen: STD({ color: 0x2f6a3e, roughness: .5, metalness: .3 }),
  purple: STD({ color: 0x584a98, roughness: .5, metalness: .3 }), red: STD({ color: 0x74302a, roughness: .5, metalness: .3 }), blue: STD({ color: 0x2c4fa0, roughness: .5, metalness: .3 }),
};
function box(p, w, h, d, m, x, y, z, ry = 0) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y + h / 2, z); b.rotation.y = ry; b.castShadow = b.receiveShadow = true; p.add(b); return b; }
function cyl(p, r, len, m, x, y, z, axis = 'y', seg = 12) { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), m); c.position.set(x, y, z); if (axis === 'x') c.rotation.z = Math.PI / 2; if (axis === 'z') c.rotation.x = Math.PI / 2; c.castShadow = c.receiveShadow = true; p.add(c); return c; }
function grp(p, x = 0, y = 0, z = 0, ry = 0) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; p.add(g); return g; }

// ---- Euro-style pallet: 5 top boards, 3 stringer boards, 9 blocks, 3 bottom boards. Returns its height (0.144) ----
function pallet(p, w = 1.2, d = 1.0, y = 0, worn = .5) {
  const g = grp(p, 0, y, 0); const m = () => rnd() < worn ? M.palletDark : M.pallet;
  for (const xx of [-1, 0, 1]) box(g, .1, .022, d, m(), xx * (w / 2 - .05), 0, 0);
  for (const xx of [-1, 0, 1]) for (const zz of [-1, 0, 1]) box(g, .1, .078, zz ? .1 : .145, m(), xx * (w / 2 - .05), .022, zz * (d / 2 - .05));
  for (const zz of [-1, 0, 1]) box(g, w, .022, .1, m(), 0, .1, zz * (d / 2 - .05));
  for (let i = 0; i < 5; i++) box(g, .1 + (i % 4 ? 0 : .045), .022, d, m(), -w / 2 + .072 + i * (w - .144) / 4, .122, 0).rotation.y = (rnd() - .5) * .01;
  return .144;
}

// ---- the Green Yurts badge, drawn onto a canvas ----
function drawBadge(x, cx, cy, R, ink, bg) {
  x.save(); x.fillStyle = ink; const n = 56;
  x.beginPath(); for (let i = 0; i <= n * 2; i++) { const a = i / (n * 2) * Math.PI * 2, r = i % 2 ? R : R * .94; x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } x.fill();
  x.fillStyle = bg; x.beginPath(); x.arc(cx, cy, R * .9, 0, 7); x.fill();
  x.strokeStyle = ink; x.lineWidth = R * .02; x.setLineDash([R * .02, R * .03]); x.beginPath(); x.arc(cx, cy, R * .85, 0, 7); x.stroke(); x.beginPath(); x.arc(cx, cy, R * .64, 0, 7); x.stroke(); x.setLineDash([]);
  x.fillStyle = ink; x.textAlign = 'center'; x.textBaseline = 'middle';
  const arcText = (txt, r, start, sz, flip) => { x.font = `600 ${sz}px Arial`; const step = (sz * .62) / r; const tot = step * txt.length; let a = start - (flip ? -tot / 2 : tot / 2);
    for (const ch of txt) { x.save(); x.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r); x.rotate(a + (flip ? -Math.PI / 2 : Math.PI / 2)); x.fillText(ch, 0, 0); x.restore(); a += flip ? -step : step; } };
  arcText('KINGS OF GLAMPING · EST 2010', R * .745, -Math.PI / 2, R * .085, false);
  arcText('WWW.GREENYURTS.CO.UK', R * .745, Math.PI / 2, R * .07, true);
  x.font = `italic ${R * .15}px Georgia`; x.fillText('Green', cx - R * .38, cy + R * .02); x.fillText('Yurts', cx + R * .38, cy + R * .1);
  x.font = `bold ${R * .62}px Georgia`; x.fillText('G', cx, cy + R * .04); x.lineWidth = R * .03; x.strokeStyle = bg; x.strokeText('G', cx, cy + R * .04);
  x.restore();
}
// ---- crate cover textures: front (label, check-sheet window, badge, eyelets), side (badge), top (plain, seams) ----
function fabric(x, w, h, base) { speckle(x, w, h, base, .07, w * h / 120); for (let i = 0; i < 18; i++) { const g = x.createLinearGradient(0, 0, w, 0); const p = rnd(); g.addColorStop(Math.max(0, p - .05), 'rgba(0,0,0,0)'); g.addColorStop(p, `rgba(0,0,0,${.05 + rnd() * .06})`); g.addColorStop(Math.min(1, p + .05), 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, h * rnd() * .3, w, h); } }
function coverFace(bg, ink, o = {}) {
  return tex(1024, 1024, (x, w, h) => { fabric(x, w, h, bg);
    if (o.label) { x.fillStyle = ink; x.font = `500 ${o.labelSize || 74}px Arial`; x.textAlign = 'left'; x.fillText(o.label, 40, 104); if (o.sub) { x.font = '500 54px Arial'; x.fillText(o.sub, 40, 170); } }
    if (o.window) { const wx = 46, wy = o.sub ? 200 : 140; x.fillStyle = 'rgba(235,240,240,.55)'; x.fillRect(wx, wy, 250, 170); x.fillStyle = '#f6f4ee'; x.fillRect(wx + 18, wy + 14, 214, 142); x.fillStyle = '#555'; x.font = '18px Arial';
      for (let i = 0; i < 6; i++) { x.fillRect(wx + 30, wy + 34 + i * 20, 80 + rnd() * 100, 3); } x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 3; x.strokeRect(wx, wy, 250, 170); }
    if (o.check) { x.fillStyle = '#fbfbf7'; x.fillRect(o.check[0], o.check[1], 220, 150); x.fillStyle = '#333'; for (let i = 0; i < 5; i++) x.fillRect(o.check[0] + 16, o.check[1] + 22 + i * 24, 70 + rnd() * 110, 4); }
    drawBadge(x, w / 2 + (o.badgeDx || 40), h / 2 + (o.badgeDy || 70), o.badgeR || 300, ink, bg);
    x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, h - 36, w, 36); // hem
    for (const ex of [40, w - 40]) { x.fillStyle = '#c9ccce'; x.beginPath(); x.arc(ex, h - 70, 14, 0, 7); x.fill(); x.fillStyle = '#222'; x.beginPath(); x.arc(ex, h - 70, 7, 0, 7); x.fill(); }
  });
}
// a fabric cover shell: subdivided box with a sagging top, slight bulge, wrinkles and a flared hem
function coverMesh(w, h, d, mats, seed = 1) {
  const g = new THREE.BoxGeometry(w, h, d, 16, 14, 14), p = g.attributes.position, v = new THREE.Vector3();
  const ph = [rnd() * 6, rnd() * 6, rnd() * 6];
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const tx = v.x / (w / 2), tz = v.z / (d / 2), ty = (v.y + h / 2) / h;
    const edge = Math.max(Math.abs(tx), Math.abs(tz)), inner = 1 - edge;
    if (v.y > h / 2 - 1e-4) v.y -= .025 * Math.max(0, 1 - tx * tx) * Math.max(0, 1 - tz * tz);           // top sags between the frame edges
    const bulge = .012 * Math.sin(ty * Math.PI) * (1 - Math.min(1, Math.abs(tx) > .98 || Math.abs(tz) > .98 ? Math.max(Math.abs(tx) > .98 ? Math.abs(tz) : 0, Math.abs(tz) > .98 ? Math.abs(tx) : 0) ** 6 : 0));
    const wr = .006 * Math.sin(v.x * 23 + ph[0] + v.y * 9) * Math.sin(v.z * 19 + ph[1]) + .004 * Math.sin(v.y * 31 + ph[2] + v.x * 7);
    if (Math.abs(tx) > .98) v.x += Math.sign(tx) * (bulge + wr); if (Math.abs(tz) > .98) v.z += Math.sign(tz) * (bulge + wr);
    if (ty < .06) { const f = (.06 - ty) / .06 * .018; if (Math.abs(tx) > .98) v.x += Math.sign(tx) * f; if (Math.abs(tz) > .98) v.z += Math.sign(tz) * f; }
    p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mats); m.castShadow = m.receiveShadow = true; return m;
}
const _coverMats = {};
function coverMats(key, bg, ink, label, opts = {}) {
  if (_coverMats[key]) return _coverMats[key];
  const front = STD({ map: coverFace(bg, ink, { label, window: opts.window !== false, sub: opts.sub, labelSize: opts.labelSize }), roughness: .82 });
  const side = STD({ map: coverFace(bg, ink, { label: opts.sideLabel ? label : null, badgeDx: 0, badgeDy: 40 }), roughness: .82 });
  const top = STD({ map: tex(256, 256, (x, w, h) => { fabric(x, w, h, bg); x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(0, h / 2 - 2, w, 4); }), roughness: .82 });
  return _coverMats[key] = [side, side, top, top, front, side];
}

// ---- a yurt crown: two rings (the outer drilled for the rafters) joined by bent cross-arches ----
function crown(p, D = 1.0, x = 0, y = 0, z = 0) {
  const g = grp(p, x, y, z), R = D / 2, ringH = .11;
  const holes = tex(1024, 64, (c, w, h) => { const img = M.crownWood.map.image; c.drawImage(img, 0, 0, w, h); const n = Math.round(D * 40); for (let i = 0; i < n; i++) { const cx = (i + .5) / n * w; c.fillStyle = '#2a1a0c'; c.beginPath(); c.ellipse(cx, h / 2, 7, 13, 0, 0, 7); c.fill(); } });
  holes.wrapS = THREE.RepeatWrapping;
  const band = (r, hh, mat) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, hh, 48, 1, true), mat); m.castShadow = m.receiveShadow = true; m.material.side = THREE.DoubleSide; return m; };
  const outer = band(R, ringH, STD({ map: holes, roughness: .6 })); outer.position.y = ringH / 2; g.add(outer);
  const inner = band(R - .045, ringH, M.crownWood); inner.position.y = ringH / 2; g.add(inner);
  for (const yy of [0, ringH]) { const cap = new THREE.Mesh(new THREE.RingGeometry(R - .045, R, 48), M.crownWood); cap.rotation.x = -Math.PI / 2; cap.position.y = yy + .0005; g.add(cap); }
  for (let k = 0; k < 2; k++) for (const off of [-.035, .035]) { // two pairs of bent arches crossing at the top
    const a = k * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a), ox = -sa * off, oz = ca * off;
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(ca * (R - .03) + ox, ringH * .6, sa * (R - .03) + oz), new THREE.Vector3(ox, ringH + R * .62, oz), new THREE.Vector3(-ca * (R - .03) + ox, ringH * .6, -sa * (R - .03) + oz));
    const t = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, .014, 6), M.crownWood); t.castShadow = true; g.add(t); }
  g.userData.h = ringH + R * .32; return g;
}

// ---- a crown crate: pallet, timber collar inside, crowns stacked, fabric cover over it all. g.userData.lift(t) raises the cover ----
function crownCrate(p, kind, x = 0, y = 0, z = 0, ry = 0) {
  const g = grp(p, x, y, z, ry), K = kind; const ph = pallet(g, K.w, K.d);
  const inside = grp(g, 0, ph, 0); inside.visible = false;
  for (let i = 0; i < K.n; i++) crown(inside, K.D, (rnd() - .5) * .04, i * .13 + .01, (rnd() - .5) * .04);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(inside, .05, K.h - .04, .05, M.pallet, sx * (K.w / 2 - .04), 0, sz * (K.d / 2 - .04));
  const cover = coverMesh(K.w + .02, K.h, K.d + .02, K.mats); cover.position.y = ph + K.h / 2; g.add(cover);
  g.userData.lift = t => { cover.position.y = ph + K.h / 2 + t * (K.h + .25); inside.visible = t > .02; cover.material.forEach(m => { m.transparent = t > .02; m.opacity = 1 - t * .55; }); };
  g.userData.height = ph + K.h; return g;
}
