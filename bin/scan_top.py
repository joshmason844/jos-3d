#!/usr/bin/env python3
"""Top-down HEIGHTMAP of part of a Polycam GLB in the WW frame, plus a printed grid of heights, to read stacks and piles.
Heights only (no scan texture), so the PNG is a measurement drawing; still keep raw output in work/ unless marked up.
usage: python3 bin/scan_top.py <scan.glb> <out.png> x0 x1 z0 z1 [--ppm 40] [--cell 0.5] [--ymax 5.5] [--q 95]
  --cell: size of the printed grid cells (m); each cell prints the --q percentile of surface heights in it (dm, '.' = < 0.2 m).
  Image: dark = low, bright = high, 1 m grid lines, labels every metre. ~10 s.
"""
import sys, os
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(__file__))
from scan_colours import load, to_ww

a = sys.argv; x0, x1, z0, z1 = map(float, a[3:7]); opt = dict(zip(a[7::2], a[8::2]))
ppm = float(opt.get('--ppm', 40)); cell = float(opt.get('--cell', 0.5)); ymax = float(opt.get('--ymax', 5.5)); q = float(opt.get('--q', 95))
pts = []
for P, UV, F, im in load(a[1]):
  V = to_ww(P, 1.8); T = V[F]; c = T.mean(1)
  k = (c[:, 0] > x0) & (c[:, 0] < x1) & (c[:, 2] > z0) & (c[:, 2] < z1) & (c[:, 1] < ymax) & (c[:, 1] > -0.3)
  if not k.any(): continue
  T = T[k]; area = np.linalg.norm(np.cross(T[:, 1] - T[:, 0], T[:, 2] - T[:, 0]), axis=1) / 2
  n = np.clip((area * ppm * ppm * 2).astype(int), 1, 200); idx = np.repeat(np.arange(len(T)), n)
  r = np.random.default_rng(1).random((len(idx), 2)); f = r.sum(1) > 1; r[f] = 1 - r[f]
  pts.append(T[idx, 0] + r[:, :1] * (T[idx, 1] - T[idx, 0]) + r[:, 1:] * (T[idx, 2] - T[idx, 0]))
p = np.concatenate(pts)
W, H = int((x1 - x0) * ppm) + 1, int((z1 - z0) * ppm) + 1
u = ((p[:, 0] - x0) * ppm).astype(int).clip(0, W - 1); v = ((z1 - p[:, 2]) * ppm).astype(int).clip(0, H - 1)   # top of image = z1 (door side)
hm = np.zeros((H, W)); np.maximum.at(hm, (v, u), p[:, 1])
g = (np.clip(hm / ymax, 0, 1) * 235 + 20).astype(np.uint8)
img = Image.fromarray(np.stack([g, g, g], 2)); d = ImageDraw.Draw(img)
for X in range(int(np.ceil(x0)), int(x1) + 1):
  d.line([((X - x0) * ppm, 0), ((X - x0) * ppm, H)], fill=(60, 140, 255)); d.text(((X - x0) * ppm + 2, 2), f'x{X}', fill=(255, 210, 0))
for Z in range(int(np.ceil(z0)), int(z1) + 1):
  d.line([(0, (z1 - Z) * ppm), (W, (z1 - Z) * ppm)], fill=(60, 140, 255)); d.text((2, (z1 - Z) * ppm + 2), f'z{Z}', fill=(255, 210, 0))
img.save(a[2])
# printed grid: rows = z (door side first), cols = x
nx, nz = int(np.ceil((x1 - x0) / cell)), int(np.ceil((z1 - z0) / cell))
ci = ((p[:, 0] - x0) / cell).astype(int).clip(0, nx - 1); cj = ((z1 - p[:, 2]) / cell).astype(int).clip(0, nz - 1)
print('heights (dm), rows z from', z1, 'down by', cell, '; cols x from', x0, 'by', cell)
print('       ' + ''.join(f'{x0 + i * cell:>5.1f}' for i in range(nx)))
for j in range(nz):
  row = []
  for i in range(nx):
    s = p[(ci == i) & (cj == j), 1]
    row.append('    .' if len(s) == 0 or np.percentile(s, q) < 0.2 else f'{np.percentile(s, q) * 10:5.0f}')
  print(f'{z1 - j * cell:6.1f} ' + ''.join(row))
