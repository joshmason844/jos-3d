// People at real height, sculpted from Josh's yard videos (sculpt/build_people.py makes the meshes).
// One smooth skin with a carved face, hair and beard grown as clumps, clothes as shells with folds.
// Not face scans, and never names: each person is labelled by what they wear. Metres, Y up, facing +Z, feet on y = 0.
import * as THREE from 'three';

const PART = { skin: 'Skin', tee: 'T-shirt', trousers: 'Trousers', shoe: 'Trainers', sole: 'Trainers', hair: 'Hair', beard: 'Beard', brow: 'Hair' };
const ROUGH = { skin: .55, tee: .92, trousers: .88, shoe: .6, sole: .8, hair: .6, beard: .75, brow: .7 };
const SHEEN = { tee: .15, trousers: .25, hair: .35, beard: .3 };

function b64(s, T) { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new T(u.buffer); }

function geometryFrom(m) {
  const q = b64(m.pos, Uint16Array), n = b64(m.nrm, Int8Array), c = b64(m.col, Uint8Array), idx = b64(m.idx, m.idx32 ? Uint32Array : Uint16Array);
  const pos = new Float32Array(q.length); for (let i = 0; i < q.length; i++) { const k = i % 3; pos[i] = m.lo[k] + q[i] / 65535 * (m.hi[k] - m.lo[k]); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(n, 3, true));
  const lin = new Float32Array(c.length); for (let i = 0; i < c.length; i++) { const v = c[i] / 255; lin[i] = v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); } // baked colours are sRGB
  g.setAttribute('color', new THREE.BufferAttribute(lin, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}

function irisTex(rgb) { // 2:1 canvas so the iris stays round on the sphere; centre faces +Z after rotateY(-90°)
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#efe9e1'; x.fillRect(0, 0, 256, 128);
  const [r, gg, b] = rgb, g = x.createRadialGradient(128, 64, 4, 128, 64, 21);
  g.addColorStop(0, `rgb(${r * .55 | 0},${gg * .55 | 0},${b * .55 | 0})`); g.addColorStop(.75, `rgb(${r},${gg},${b})`); g.addColorStop(1, `rgb(${r * .4 | 0},${gg * .4 | 0},${b * .4 | 0})`);
  x.fillStyle = g; x.beginPath(); x.arc(128, 64, 21, 0, 7); x.fill();
  for (let i = 0; i < 36; i++) { const a = i / 36 * 6.283; x.strokeStyle = `rgba(255,255,255,${.06 + Math.random() * .08})`; x.beginPath(); x.moveTo(128 + Math.cos(a) * 8, 64 + Math.sin(a) * 8); x.lineTo(128 + Math.cos(a) * 20, 64 + Math.sin(a) * 20); x.stroke(); }
  x.fillStyle = '#080808'; x.beginPath(); x.arc(128, 64, 7.5, 0, 7); x.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function logoTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#5d6b62'; x.textAlign = 'center'; x.font = 'italic bold 66px Georgia'; x.fillText('K', 84, 86); x.font = 'bold 44px Georgia'; x.fillText('D', 128, 84); x.font = 'italic bold 66px Georgia'; x.fillText('K', 172, 86);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function buildPerson(d) {
  const root = new THREE.Group(); root.name = d.label; const parts = {};
  const part = name => parts[name] || (parts[name] = Object.assign(new THREE.Group(), { name }), root.add(parts[name]), parts[name]);
  const mats = {}; for (const k of Object.keys(PART)) mats[k] = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: ROUGH[k], sheen: SHEEN[k] || 0, sheenRoughness: .8, sheenColor: new THREE.Color(0xffffff) });
  for (const m of d.meshes) { const g = geometryFrom(m);
    for (const gr of m.groups) { const sub = new THREE.BufferGeometry(); for (const a of ['position', 'normal', 'color']) sub.setAttribute(a, g.getAttribute(a)); // shared buffers, own index
      sub.setIndex(new THREE.BufferAttribute(g.index.array.subarray(gr.start, gr.start + gr.count), 1)); const mesh = new THREE.Mesh(sub, mats[gr.label]);
      mesh.userData.label = gr.label; mesh.castShadow = mesh.receiveShadow = true; part(PART[gr.label]).add(mesh); } }
  // eyes: glossy balls with a painted iris, looking straight ahead
  const eyeMat = new THREE.MeshPhysicalMaterial({ map: irisTex(d.iris), roughness: .2, clearcoat: 1, clearcoatRoughness: .04 });
  for (const e of d.eyes) { const geo = new THREE.SphereGeometry(e.r, 32, 20); geo.rotateY(-Math.PI / 2); const s = new THREE.Mesh(geo, eyeMat); s.position.fromArray(e.c); part('Eyes').add(s); }
  // drawstring cords hanging below the tee hem
  if (d.cords && d.cords.length) { const cm = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: .7 });
    for (const pts of d.cords) { const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), 16, .0028, 6), cm); tube.castShadow = true; part('Trousers').add(tube); } }
  // chest logo: find the tee surface on the left chest and stick a decal on it
  if (d.logo && parts['T-shirt']) { root.updateMatrixWorld(true); const k = d.height / 1.8;
    const hit = new THREE.Raycaster(new THREE.Vector3(.085 * k, 1.335 * k, .6), new THREE.Vector3(0, 0, -1)).intersectObject(parts['T-shirt'], true)[0];
    if (hit) { const lm = new THREE.MeshStandardMaterial({ map: logoTex(), transparent: true, roughness: .9, polygonOffset: true, polygonOffsetFactor: -4 });
      const p = new THREE.Mesh(new THREE.PlaneGeometry(.07, .035), lm); const nW = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
      p.position.copy(hit.point).addScaledVector(nW, .002); p.lookAt(hit.point.clone().add(nW)); parts['T-shirt'].add(p); } }
  root.userData.parts = parts; root.userData.height = d.height;
  return root;
}

// the meshes ship gzipped + base64 inside the page; unpack with the browser's own gzip
export async function loadPeople(b64) {
  const bin = Uint8Array.from(atob(b64.trim()), c => c.charCodeAt(0));
  const text = await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  return JSON.parse(text);
}
