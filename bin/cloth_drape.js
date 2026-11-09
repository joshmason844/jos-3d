#!/usr/bin/env node
// Drape a sheet over boxes with a small position-based cloth solver, offline, so a page only loads the result (no solve on the phone).
// usage: node bin/cloth_drape.js <config.json> <out.b64>
//   optional pins: [[x0,x1,z0,z1,top,dome],…] hold those vertices still (needed when a heavy sheet hangs off a small hump)
//   optional slot: [xFrom,z0,z1,ramp] walls the sheet into a recess between neighbours (closes in over the first ramp of the steps)
//   config: { w, d, step, y0, x0, z0, boxes: [[x0,x1,y0,y1,z0,z1],…], steps, iters, stiff, bend, seed, floor }   metres, sheet flat at y0 with its corner at (x0, z0)
//   out: base64 of Int16 mm x,y,z per vertex, row by row (rows along z). nx/nz are printed, and first in the file as a 4-byte header.
// 3 Nov 01:xx (WW tarp): ~20 s for 8k vertices. Reuse it for any tarp, sheet or dust cover: real corners and pooled folds beat hand-made ones.
const fs = require('fs'); const C = JSON.parse(fs.readFileSync(process.argv[2])), out = process.argv[3];
const { w, d, step: h, y0, x0, z0, boxes, steps = 700, iters = 14, stiff = 1, bend = .35, seed = 11, floor = .006, pins = [], slot = null, smooth = 0, tie = null } = C;   // pins: [[x0,x1,z0,z1,top,dome],…] held still, domed down by `dome` at the region's edge. 4 Nov: a big sheet on a small hump slips off otherwise
const nx = Math.round(w / h) + 1, nz = Math.round(d / h) + 1, N = nx * nz; let sd = seed; const fr = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
const P = new Float64Array(N * 3), Q = new Float64Array(N * 3), id = (i, j) => j * nx + i;
for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = id(i, j) * 3; P[k] = x0 + i * h; P[k + 1] = y0 + .02 * Math.sin(i * .37 + 1) * Math.sin(j * .29) + fr() * .004; P[k + 2] = z0 + j * h; Q[k] = P[k]; Q[k + 1] = P[k + 1]; Q[k + 2] = P[k + 2]; }
const K = []; const add = (a, b, s) => { const dx = P[a * 3] - P[b * 3], dz = P[a * 3 + 2] - P[b * 3 + 2]; K.push([a, b, Math.hypot(dx, dz), s]); };
for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = id(i, j);
  if (i + 1 < nx) add(a, id(i + 1, j), stiff); if (j + 1 < nz) add(a, id(i, j + 1), stiff);
  if (i + 1 < nx && j + 1 < nz) { add(a, id(i + 1, j + 1), stiff * .5); add(id(i + 1, j), id(i, j + 1), stiff * .5); }
  if (i + 2 < nx) add(a, id(i + 2, j), bend); if (j + 2 < nz) add(a, id(i, j + 2), bend); }
const M = .014, dt = 1 / 90, G = 9.8 * dt * dt, DAMP = .985;
const PIN = []; for (const [a, b, c, e, t, dm = 0] of pins) { const mx = (a + b) / 2, mz = (c + e) / 2, hx = (b - a) / 2, hz = (e - c) / 2; for (let k = 0; k < N; k++) { const q = k * 3, x = P[q], z = P[q + 2]; if (x > a && x < b && z > c && z < e) { const y = t - dm * (((x - mx) / hx) ** 2 + ((z - mz) / hz) ** 2) / 2; PIN.push([q, x, y, z]); P[q + 1] = Q[q + 1] = y; } } }
// slot: [xFrom, z0, z1, ramp]: a recess between two neighbours. Vertices past xFrom are walled in to z0…z1, the walls closing in from the sheet's own edges over the first `ramp` of the steps, so a sheet that starts flat over the neighbours gets tucked in instead of being thrown out through them (5 Nov 23:xx, cream sheet)
let slotA = -1e9, slotB = 1e9;
// tie: [xFrom, yTie, band, xFace, from, to]: a cord or strap round a sheet's foot (9 Nov 00:xx, WW cream sheet). Past xFrom, vertices within `band` of yTie are pushed in to x ≤ xLim,
// xLim easing from the sheet's far edge down to xFace between fractions `from` and `to` of the steps, so a hem that hung off in mid-air is drawn onto the load and the spare cloth gathers.
let tieX = 1e9;
const collide = () => { for (let k = 0; k < N; k++) { const q = k * 3; let x = P[q], y = P[q + 1], z = P[q + 2];
    if (tie && x > tie[0] && Math.abs(y - tie[1]) < tie[2] && x > tieX) x = tieX;
    if (slot && x > slot[0]) { if (z < slotA) z = slotA; if (z > slotB) z = slotB; }
    if (y < floor) { y = floor; P[q] = x = x * .55 + Q[q] * .45; P[q + 2] = z = z * .55 + Q[q + 2] * .45; }   // the slab grips
    for (const [a, b, c, e, f, g] of boxes) { if (x > a - M && x < b + M && y > c - M && y < e + M && z > f - M && z < g + M) {
      const dx0 = x - (a - M), dx1 = b + M - x, dy0 = y - (c - M), dy1 = e + M - y, dz0 = z - (f - M), dz1 = g + M - z, m = Math.min(dx0, dx1, dy1, dz0, dz1, dy0);
      if (m === dy1) { y = e + M; x = x * .7 + Q[q] * .3; z = z * .7 + Q[q + 2] * .3; } else if (m === dx0) x = a - M; else if (m === dx1) x = b + M; else if (m === dz0) z = f - M; else if (m === dz1) z = g + M; else y = c - M; } }
    P[q] = x; P[q + 1] = y; P[q + 2] = z; }
  for (const [q, x, y, z] of PIN) { P[q] = x; P[q + 1] = y; P[q + 2] = z; } };
for (let s = 0; s < steps; s++) {
  if (tie) { const t = Math.max(0, Math.min(1, (s / steps - tie[4]) / (tie[5] - tie[4]))); tieX = t <= 0 ? 1e9 : x0 + w + (tie[3] - x0 - w) * (t * t * (3 - 2 * t)); }
  if (slot) { const t = Math.min(1, s / (steps * (slot[3] || .3))); slotA = z0 + (slot[1] - z0) * t; slotB = z0 + (nz - 1) * h + (slot[2] - z0 - (nz - 1) * h) * t; }
  for (let q = 0; q < N * 3; q += 3) for (let a = 0; a < 3; a++) { const v = (P[q + a] - Q[q + a]) * DAMP; Q[q + a] = P[q + a]; P[q + a] += v - (a === 1 ? G : 0); }
  for (let it = 0; it < iters; it++) { for (const [a, b, L, sf] of K) { const p = a * 3, q = b * 3, dx = P[q] - P[p], dy = P[q + 1] - P[p + 1], dz = P[q + 2] - P[p + 2], l = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-9; if (sf < 1 && l < L * .6) { /* folds may bend */ } const c = (l - L) / l * .5 * sf; if (sf < 1 && sf <= bend && l > L) continue;
      P[p] += dx * c; P[p + 1] += dy * c; P[p + 2] += dz * c; P[q] -= dx * c; P[q + 1] -= dy * c; P[q + 2] -= dz * c; }
    collide(); }
}
// smooth: N Laplacian passes on the settled cloth, re-collided: a squeezed sheet folds along the grid in a 1-cell sawtooth that reads as stair-steps once the creases are darkened (5 Nov 23:xx)
for (let n = 0; n < smooth; n++) { const S = P.slice(); for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const q = id(i, j) * 3, a = id(Math.max(0, i - 1), j) * 3, b = id(Math.min(nx - 1, i + 1), j) * 3, c = id(i, Math.max(0, j - 1)) * 3, e = id(i, Math.min(nz - 1, j + 1)) * 3; for (let k = 0; k < 3; k++) P[q + k] = S[q + k] * .4 + (S[a + k] + S[b + k] + S[c + k] + S[e + k]) * .15; } for (let q = 0; q < N * 3; q++) Q[q] = P[q]; collide(); }
const buf = Buffer.alloc(4 + N * 6); buf.writeUInt16LE(nx, 0); buf.writeUInt16LE(nz, 2); for (let k = 0; k < N * 3; k++) buf.writeInt16LE(Math.round(P[k] * 1000), 4 + k * 2);
fs.writeFileSync(out, buf.toString('base64')); let lo = 9, hi = -9, xa = 99, xb = -99, za = 99, zb = -99; for (let k = 0; k < N; k++) { const x = P[k * 3], y = P[k * 3 + 1], z = P[k * 3 + 2]; lo = Math.min(lo, y); hi = Math.max(hi, y); xa = Math.min(xa, x); xb = Math.max(xb, x); za = Math.min(za, z); zb = Math.max(zb, z); }
console.log(`${nx} × ${nz} = ${N} verts, y ${lo.toFixed(3)}…${hi.toFixed(3)}, x ${xa.toFixed(2)}…${xb.toFixed(2)}, z ${za.toFixed(2)}…${zb.toFixed(2)}, ${buf.length} bytes`);
