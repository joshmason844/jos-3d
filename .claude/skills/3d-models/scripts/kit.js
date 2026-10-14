// Green Yurts kit as real-size 3D models (metres, Y up, door facing +Z).
// One shape engine does them all: a ground outline (circle or stadium) whose wall rises
// straight, then a roof that runs in straight lines to a ridge (twin pole), a peak (single pole) or a crown ring (yurt).
import * as THREE from 'three';
import { buildForklift } from './forklift.js';

export const CANVAS = 0xe8dcc2, CANVAS_DARK = 0x9a8a6c, ROPE = 0xcfc4a8, WOOD = 0x8a5a32, STEEL = 0x8f979f;

// --- the catalogue (sizes from greenyurts.co.uk) ---
export const KIT = {
  bell5: { name: 'Bell tent 5 m', build: () => tent({ r: 2.5, a: 0, wall: 0.6, peak: 3.0 }) },
  bell4: { name: 'Bell tent 4 m', build: () => tent({ r: 2.0, a: 0, wall: 0.55, peak: 2.5 }) },
  emperor: { name: 'Emperor 6 × 4 m', build: () => tent({ r: 2.0, a: 1.0, wall: 0.6, peak: 3.0 }) },
  yurt16: { name: 'Yurt 16 ft', build: () => yurt({ d: 4.88 }) },
  yurt24: { name: 'Yurt 24 ft', build: () => yurt({ d: 7.3, wall: 1.7, crownH: 3.6 }) },
  forklift: { name: 'Forklift G15S', build: () => buildForklift() },
};

// --- tents: bell (a = 0) and emperor (a = half the ridge length) ---
export function tent({ r = 2.5, a = 0, wall = 0.6, peak = 3.0, ropes = true, color = CANVAS } = {}) {
  const g = new THREE.Group(); g.name = a ? 'emperor' : 'bell tent';
  const R = y => (y <= wall ? r : r * (peak - y) / (peak - wall)); // distance from the pole line at height y
  g.add(shell({ r, a, R, top: peak - 0.02, color }));
  g.add(door({ r, a, R, h: Math.min(1.8, peak * 0.62) }));
  g.add(ground({ r: r + 0.02, a, color: 0x3d4a3a }));
  for (const x of a ? [-a, a] : [0]) g.add(pole(x, 0, peak + 0.05, 0.025));
  if (a) g.add(bar(new THREE.Vector3(-a, peak - 0.04, 0), new THREE.Vector3(a, peak - 0.04, 0), 0.02, STEEL));
  if (ropes) g.add(guys({ r, a, wall, n: a ? 16 : 12 }));
  return g;
}

// --- yurt: lattice wall, rafters to a crown ring ---
export function yurt({ d = 4.88, wall = 1.6, crownH = 2.9, crownR = 0.45, color = 0xd9ccaf } = {}) {
  const r = d / 2, g = new THREE.Group(); g.name = 'yurt';
  const R = y => (y <= wall ? r : r - (r - crownR) * (y - wall) / (crownH - wall));
  g.add(shell({ r, a: 0, R, top: crownH, color }));
  const crown = new THREE.Mesh(new THREE.TorusGeometry(crownR, 0.06, 10, 40), mat(WOOD, 0.6)); crown.rotation.x = Math.PI / 2; crown.position.y = crownH; g.add(crown);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(crownR + 0.02, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xcfe3f0, 0.15, { transparent: true, opacity: 0.55 }));
  dome.scale.y = 0.35; dome.position.y = crownH; g.add(dome);
  const dw = 0.9, dh = 1.5; // painted wooden door in a frame
  const frame = new THREE.Mesh(new THREE.BoxGeometry(dw + 0.16, dh + 0.1, 0.12), mat(WOOD, 0.7)); frame.position.set(0, (dh + 0.1) / 2, r); g.add(frame);
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(dw, dh, 0.06), mat(0x2f6f8f, 0.5)); leaf.position.set(0, dh / 2, r + 0.05); g.add(leaf);
  g.add(ground({ r: r + 0.25, a: 0, color: 0x6b5236 })); // the deck
  return g;
}

// ---------- pieces ----------
function outline(r, a, n) { // closed ground outline: right arc, top straight, left arc, bottom straight
  const pts = [], arc = (cx, t0, t1, k) => { for (let i = 0; i < k; i++) { const t = t0 + (t1 - t0) * i / k; pts.push([cx + r * Math.cos(t), r * Math.sin(t)]); } };
  const k = a ? Math.round(n * 0.3) : n, s = a ? Math.round(n * 0.2) : 0;
  arc(a, -Math.PI / 2, Math.PI / 2, a ? k : n / 2 | 0);
  for (let i = 0; i < s; i++) pts.push([a - 2 * a * i / s, r]);
  arc(-a, Math.PI / 2, Math.PI * 1.5, a ? k : n - (n / 2 | 0));
  for (let i = 0; i < s; i++) pts.push([-a + 2 * a * i / s, -r]);
  return pts;
}
function shell({ r, a, R, top, color }) {
  const ol = outline(r, a, 128), rows = 40, pos = [], idx = [];
  for (let j = 0; j <= rows; j++) {
    const y = top * j / rows, k = R(y) / r;
    for (const [ox, oz] of ol) { const cx = Math.max(-a, Math.min(a, ox)); pos.push(cx + (ox - cx) * k, y, oz * k); }
  }
  const n = ol.length;
  for (let j = 0; j < rows; j++) for (let i = 0; i < n; i++) {
    const p = j * n + i, q = j * n + (i + 1) % n, p2 = p + n, q2 = q + n; idx.push(p, p2, q, q, p2, q2);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat(color, 0.92, { side: THREE.DoubleSide })); m.name = 'canvas'; m.castShadow = m.receiveShadow = true; return m;
}
function door({ r, a, R, h }) { // a darker door panel lying just proud of the canvas on the +Z side
  const cols = 12, rows = 18, pos = [], idx = [];
  for (let j = 0; j <= rows; j++) {
    const y = h * j / rows, hw = 0.5 * (1 - (y / (h * 1.05)) ** 1.4);
    for (let i = 0; i <= cols; i++) { const x = -hw + 2 * hw * i / cols, dx = Math.max(0, Math.abs(x) - a), rr = R(y) + 0.012; pos.push(x, y, Math.sqrt(Math.max(0, rr * rr - dx * dx))); }
  }
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const p = j * (cols + 1) + i, q = p + 1, p2 = p + cols + 1, q2 = p2 + 1; idx.push(p, p2, q, q, p2, q2); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat(CANVAS_DARK, 0.95, { side: THREE.DoubleSide })); m.name = 'door'; return m;
}
function ground({ r, a, color }) {
  const s = new THREE.Shape(); outline(r, a, 96).forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z)));
  const m = new THREE.Mesh(new THREE.ShapeGeometry(s), mat(color, 0.95)); m.rotation.x = -Math.PI / 2; m.position.y = 0.004; m.name = 'groundsheet'; m.receiveShadow = true; return m;
}
function guys({ r, a, wall, n }) {
  const g = new THREE.Group(); g.name = 'guy ropes';
  outline(r, a, n).forEach(([ox, oz]) => {
    const cx = Math.max(-a, Math.min(a, ox)), dx = ox - cx, l = Math.hypot(dx, oz) || 1, ux = dx / l, uz = oz / l;
    const from = new THREE.Vector3(ox, wall, oz), to = new THREE.Vector3(ox + ux * 1.15, 0, oz + uz * 1.15);
    g.add(bar(from, to, 0.006, ROPE));
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.004, 0.12, 6), mat(STEEL, 0.4)); peg.position.copy(to).setY(0.04); g.add(peg);
  });
  return g;
}
function pole(x, z, h, rad, tilt) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, h, 10), mat(tilt ? STEEL : WOOD, 0.5)); m.position.set(x, h / 2, z); m.name = 'pole'; return m; }
function bar(a, b, rad, color) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, a.distanceTo(b), 6), mat(color, 0.8));
  m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); return m;
}
function mat(color, rough = 0.8, extra = {}) { return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: color === STEEL ? 0.6 : 0, ...extra }); }

// --- export helpers (run in the browser) ---
export async function toGLB(obj) { const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js'); return new GLTFExporter().parseAsync(obj, { binary: true }); }
export async function toUSDZ(obj) { const { USDZExporter } = await import('three/addons/exporters/USDZExporter.js'); return new USDZExporter().parseAsync(obj, { quickLookCompatible: true }); }
export function b64(buf) { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
export function measure(obj) { const b = new THREE.Box3().setFromObject(obj), s = b.getSize(new THREE.Vector3()); let tris = 0; obj.traverse(o => { if (o.isMesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; }); return { w: +s.x.toFixed(2), h: +s.y.toFixed(2), d: +s.z.toFixed(2), tris: Math.round(tris) }; }
