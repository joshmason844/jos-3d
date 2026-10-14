#!/usr/bin/env node
// Studio renders of any GLB (or a kit model by name) with no GPU.
//   node render.mjs <file.glb|kit:bell5> <out-prefix> [--look jos|day|studio] [--size 1600x1000] [--angles 35,120,215] [--turntable 72] [--fps 24]
// Stills → <out>-<angle>.png.  --turntable N → N frames → <out>.mp4 (H.264, plays on iPhone) + <out>.gif preview.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { openPage, run } from '../../3d-models/scripts/harness.mjs';

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const [src, out] = args;
if (!src || !out) { console.log('usage: node render.mjs <file.glb|kit:bell5> <out-prefix> [--look jos|day|studio] [--size WxH] [--angles a,b] [--turntable N]'); process.exit(1); }
const look = opt('look', 'jos'), [W, H] = opt('size', '1600x1000').split('x').map(Number), turn = +opt('turntable', 0), fps = +opt('fps', 24);
const angles = opt('angles', '35,140,250').split(',').map(Number), elev = +opt('elev', 18);
const roots = {}; let url = src;
if (!src.startsWith('kit:')) { const dir = path.dirname(path.resolve(src)); roots.work = dir; url = 'work/' + path.basename(src); }
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });

const { page, close, errors } = await openPage({ roots, width: W, height: H, body: '<canvas id="c"></canvas>' });
await run(page, `
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { KIT } from 'kit/kit.js';
export default async () => {
  const W=${W},H=${H},LOOK=${JSON.stringify(look)};
  const r = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true, preserveDrawingBuffer: true });
  r.setSize(W, H); r.setPixelRatio(1); r.toneMapping = THREE.ACESFilmicToneMapping; r.outputColorSpace = THREE.SRGBColorSpace;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(), pm = new THREE.PMREMGenerator(r);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const SRC = ${JSON.stringify(url)};
  const obj = SRC.startsWith('kit:') ? KIT[SRC.slice(4)].build() : (await new GLTFLoader().loadAsync('/' + SRC)).scene;
  obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  // sit it on the ground, centred
  const box = new THREE.Box3().setFromObject(obj), c = box.getCenter(new THREE.Vector3()); obj.position.x -= c.x; obj.position.z -= c.z; obj.position.y -= box.min.y; scene.add(obj);
  const size = box.getSize(new THREE.Vector3()), rad = Math.max(size.x, size.z) * 0.5, hgt = size.y;
  const L = {
    jos:    { bg: 0x050b16, fog: [0x050b16, rad * 3, rad * 9], ground: 0x0b1424, env: 0.35, exp: 1.05, key: [0x9fc8ff, 1.6], rim: [0x16b4ff, 3.2], warm: [0xffb066, 6] },
    day:    { bg: 0xbfd8ee, fog: [0xbfd8ee, rad * 6, rad * 18], ground: 0x5f7f3e, env: 0.9, exp: 1.0, key: [0xfff1dc, 3.2], rim: [0xbfd8ff, 0.6], warm: null },
    studio: { bg: 0xe9edf2, fog: null, ground: 0xdfe4ea, env: 1.0, exp: 1.0, key: [0xffffff, 2.2], rim: [0xffffff, 0.8], warm: null },
  }[LOOK];
  scene.background = new THREE.Color(L.bg); if (L.fog) scene.fog = new THREE.Fog(...L.fog); scene.environmentIntensity = L.env; r.toneMappingExposure = L.exp;
  const g = new THREE.Mesh(new THREE.CircleGeometry(rad * 12, 96), new THREE.MeshStandardMaterial({ color: L.ground, roughness: 1 })); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
  const key = new THREE.DirectionalLight(L.key[0], L.key[1]); key.position.set(rad * 2.2, hgt * 3 + rad, rad * 1.6); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); const sc = key.shadow.camera; sc.left = sc.bottom = -rad * 2.2; sc.right = sc.top = rad * 2.2; sc.far = rad * 12; key.shadow.bias = -0.0004; key.shadow.radius = 4; scene.add(key);
  const rim = new THREE.DirectionalLight(L.rim[0], L.rim[1]); rim.position.set(-rad * 2, hgt * 1.5, -rad * 2.5); scene.add(rim);
  if (L.warm) obj.traverse(o => { if (o.isMesh && /canvas|door/.test(o.name)) { o.material = o.material.clone(); o.material.emissive = new THREE.Color(L.warm[0]); o.material.emissiveIntensity = /door/.test(o.name) ? 0.5 : 0.12; } }); // lamp-lit from inside
  const cam = new THREE.PerspectiveCamera(32, W / H, 0.05, rad * 40);
  window.__shot = (deg, el) => { const d = Math.max(rad / Math.tan(THREE.MathUtils.degToRad(16)) / Math.min(1, W / H) * 0.9, hgt * 2.4), a = THREE.MathUtils.degToRad(deg), e = THREE.MathUtils.degToRad(el);
    cam.position.set(Math.sin(a) * Math.cos(e) * d, Math.sin(e) * d + hgt * 0.35, Math.cos(a) * Math.cos(e) * d); cam.lookAt(0, hgt * 0.4, 0); r.render(scene, cam); return r.domElement.toDataURL('image/png'); };
};`);
const save = (dataUrl, f) => fs.writeFileSync(f, Buffer.from(dataUrl.split(',')[1], 'base64'));
for (const a of angles) { const f = `${out}-${a}.png`; save(await page.evaluate(([a, e]) => window.__shot(a, e), [a, elev]), f); console.log('still', f); }
if (turn) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'turn-'));
  for (let i = 0; i < turn; i++) save(await page.evaluate(([a, e]) => window.__shot(a, e), [360 * i / turn, elev]), path.join(tmp, `f${String(i).padStart(4, '0')}.png`));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(tmp, 'f%04d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-movflags', '+faststart', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', `${out}.mp4`]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(tmp, 'f%04d.png'), '-vf', 'scale=480:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse', `${out}.gif`]);
  fs.rmSync(tmp, { recursive: true }); console.log('turntable', `${out}.mp4`, `${out}.gif`);
}
if (errors.length) console.log('page errors:', errors);
await close();
