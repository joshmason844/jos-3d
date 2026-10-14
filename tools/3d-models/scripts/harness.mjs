// Headless 3D harness: serves Three.js (+ Spark) locally, opens Chromium with software WebGL,
// and hands back a page whose import map resolves "three", "three/addons/" and "@sparkjsdev/spark".
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// Playwright is installed globally (not resolvable by ESM imports), so load it the CommonJS way
function loadPlaywright() { for (const p of ['playwright', '/opt/npm-tools/node_modules/playwright']) { try { return require(p); } catch (_) {} } throw new Error('Playwright not found: npm i -g playwright'); }
const { chromium } = loadPlaywright();

export const THREE_REV = 'r180';
const CACHE = process.env.JOS3D_CACHE || path.join(os.homedir(), '.cache', 'jos3d');
export const THREE_DIR = path.join(CACHE, 'three-' + THREE_REV);
export const SPARK_DIR = path.join(CACHE, 'spark');
const HERE = path.dirname(new URL(import.meta.url).pathname);

const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.html': 'text/html',
  '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.ply': 'application/octet-stream', '.spz': 'application/octet-stream',
  '.splat': 'application/octet-stream', '.png': 'image/png', '.jpg': 'image/jpeg', '.hdr': 'application/octet-stream', '.wasm': 'application/wasm' };

// npm and the CDNs are often unreachable from the workspace; plain git to GitHub works, so fetch from there once.
export function ensureLibs({ spark = false } = {}) {
  fs.mkdirSync(CACHE, { recursive: true });
  if (!fs.existsSync(path.join(THREE_DIR, 'build', 'three.module.js'))) {
    execSync(`git clone -q -c advice.detachedHead=false --depth 1 --branch ${THREE_REV} --filter=blob:none --sparse https://github.com/mrdoob/three.js "${THREE_DIR}" && cd "${THREE_DIR}" && git sparse-checkout set build examples/jsm`, { stdio: 'inherit' });
  }
  if (spark && !fs.existsSync(path.join(SPARK_DIR, 'dist', 'spark.module.js'))) {
    execSync(`git clone -q --depth 1 --filter=blob:none --sparse https://github.com/sparkjsdev/spark "${SPARK_DIR}" && cd "${SPARK_DIR}" && git sparse-checkout set dist`, { stdio: 'inherit' });
  }
}

// roots: { prefix: dir } extra folders to serve (e.g. { work: '/path/to/files' })
export async function openPage({ roots = {}, width = 1280, height = 720, spark = false, body = '' } = {}) {
  ensureLibs({ spark });
  const map = { three: THREE_DIR, spark: SPARK_DIR, kit: HERE, ...roots };
  const page_html = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#050b16;overflow:hidden}</style>
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/","@sparkjsdev/spark":"/spark/dist/spark.module.js","kit/":"/kit/","work/":"/work/"}}</script>${body}`;
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (u === '/' || u === '/index.html') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(page_html); }
    const [, pre, ...rest] = u.split('/');
    const base = map[pre]; if (!base) { res.writeHead(404); return res.end(); }
    const f = path.join(base, ...rest);
    if (!f.startsWith(base) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`http://127.0.0.1:${port}/index.html`);
  const close = async () => { await browser.close(); server.close(); };
  return { page, close, errors, port };
}

// run a module snippet inside the page; it can import three, addons and /kit/*.js and must return JSON-able data
export async function run(page, code) {
  return page.evaluate(async (src) => {
    const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
    const mod = await import(url);
    return mod.default ? await mod.default() : null;
  }, code);
}
