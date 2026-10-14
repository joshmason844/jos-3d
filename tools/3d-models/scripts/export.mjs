#!/usr/bin/env node
// node export.mjs <model|all> <outdir>   → <model>.glb (web, Grid, Blender) + <model>.usdz (iPhone AR Quick Look)
// Models live in kit.js (KIT). Prints size in metres and triangle count, and re-loads each GLB to prove it opens.
import fs from 'node:fs';
import path from 'node:path';
import { openPage, run } from './harness.mjs';

const [, , which = 'all', out = 'out3d'] = process.argv;
fs.mkdirSync(out, { recursive: true });
const { page, close, errors } = await openPage();
const res = await run(page, `
import * as THREE from 'three';
import { KIT, toGLB, toUSDZ, b64, measure } from 'kit/kit.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
export default async () => {
  const keys = ${JSON.stringify(which)} === 'all' ? Object.keys(KIT) : ${JSON.stringify(which)}.split(',');
  const out = {};
  for (const k of keys) {
    const obj = KIT[k].build(); obj.updateMatrixWorld(true);
    const glb = await toGLB(obj), usdz = await toUSDZ(obj);
    const back = await new GLTFLoader().parseAsync(glb, '');      // round-trip check
    out[k] = { name: KIT[k].name, size: measure(obj), reloaded: measure(back.scene), glb: b64(glb), usdz: b64(usdz) };
  }
  return out;
};`);
for (const [k, v] of Object.entries(res)) {
  fs.writeFileSync(path.join(out, k + '.glb'), Buffer.from(v.glb, 'base64'));
  fs.writeFileSync(path.join(out, k + '.usdz'), Buffer.from(v.usdz, 'base64'));
  const kb = f => (fs.statSync(path.join(out, k + f)).size / 1024).toFixed(0) + ' KB';
  console.log(`${k.padEnd(8)} ${v.name.padEnd(16)} ${v.size.w} × ${v.size.d} m, ${v.size.h} m high · ${v.size.tris} tris · glb ${kb('.glb')} (reloads ${v.reloaded.w}×${v.reloaded.d}) · usdz ${kb('.usdz')}`);
}
if (errors.length) console.log('page errors:', errors);
await close();
