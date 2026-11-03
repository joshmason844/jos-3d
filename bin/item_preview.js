// Fast look at ONE new item from hall3.js without the whole WW: a plain grey room, the page's kind of light, just that block. ~20 s a view instead of ~8 min.
// Not for BEFORE/AFTER or review shots (no WW light, no GTAO): only for tuning shape and materials between full shoots.
// usage: NODE_PATH=$(npm root -g) node bin/item_preview.js "<text in the block's first line>" "<text in the next block's first line>" out.png "cx,cy,cz,tx,ty,tz" ["cx,…" …]
const { chromium } = require('playwright'), fs = require('fs'), path = require('path'), os = require('os');
const V3 = path.join(__dirname, '../.claude/skills/photo-to-3d/scripts/hall/v3'), C = os.homedir() + '/.cache/jos3d/';
const [a, b, out, ...cams] = process.argv.slice(2); let src = fs.readFileSync(V3 + '/hall3.js', 'utf8');
const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw 'block not found'; const s0 = src.lastIndexOf('\n', i) + 1, s1 = src.lastIndexOf('\n', j) + 1;
let block = src.slice(s0, s1); const b64 = V3 + '/drape_bench.b64'; if (fs.existsSync(b64)) block = block.replace('__DRAPE_BENCH__', fs.readFileSync(b64, 'utf8').trim());
const kit = fs.readFileSync(V3 + '/kit.js', 'utf8').split('\n').filter(l => /^function (box|cyl|grp)\(|^const STD/.test(l)).join('\n');
const html = `<!doctype html><body style="margin:0"><canvas id=c width=620 height=620></canvas><script type=importmap>{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/"}}</script>
<script type=module>import * as THREE from 'three'; import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
${kit}
const T = (o) => o, CT = null; const r = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true, preserveDrawingBuffer: true }); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05; r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x3a3a38); scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .35;
scene.add(new THREE.HemisphereLight(0xe8eef5, 0x5d5a52, 1.15)); const sun = new THREE.DirectionalLight(0xfff1de, 1.6); sun.position.set(26, 34, 18); sun.castShadow = true; sun.shadow.mapSize.setScalar(2048); Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 90 }); sun.target.position.set(13, 0, -6); scene.add(sun, sun.target); sun.shadow.bias = -.0004; sun.shadow.normalBias = .02;
const fl = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x8c8c88, roughness: .9 })); fl.rotation.x = -Math.PI / 2; fl.position.set(12, 0, -6); fl.receiveShadow = true; scene.add(fl);
const P = new THREE.Group(); scene.add(P);
${block}
const cam = new THREE.PerspectiveCamera(46, 1, .05, 80); window.shot = c => { cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], c[5]); r.render(scene, cam); return document.getElementById('c').toDataURL('image/png'); }; window.__ready = 1;</script>`;
(async () => { const f = path.join(os.tmpdir(), 'item_preview.html'); fs.writeFileSync(f, html);
  const br = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }), p = await br.newPage({ viewport: { width: 640, height: 640 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.route(/cdn\.jsdelivr\.net/, r => { const m = r.request().url().match(/three@[^/]+\/(.*)$/); return m ? r.fulfill({ path: C + 'three-r180/' + m[1], contentType: 'text/javascript' }) : r.abort(); });
  await p.goto('file://' + f); await p.waitForFunction(() => window.__ready, null, { timeout: 120000 }); let k = 0;
  for (const c of cams) { const d = await p.evaluate(c => window.shot(c), c.split(',').map(Number)); fs.writeFileSync(out.replace('.png', `-${k++}.png`), Buffer.from(d.split(',')[1], 'base64')); }
  if (errs.length) console.log(errs.slice(0, 5).join('\n')); await br.close(); })();
