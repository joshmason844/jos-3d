#!/usr/bin/env python3
"""Orthographic elevation of part of a Polycam GLB in the WW frame, to read what sits on each shelf. PRIVATE OUTPUT:
write it into work/ (git-ignored) and never commit or publish it: it's the scan's own texture.
usage: python3 bin/scan_elevation.py <scan.glb> <out.png> x0 x1 y0 y1 z0 z1 --look +x|-x|+z|-z [--ppm 80] [--grid 2.77,-14.2]
  --look: the direction the viewer faces (+x = standing in the aisle looking at the right wall).
  --ppm: pixels per metre. --grid step,origin draws thin lines every step metres along the horizontal axis (bay lines),
  plus a line every metre up the side (heights), so bays and levels can be read straight off the picture.
Splats ~4 samples per pixel of face area, colour from the texture, nearest-wins depth. Pure numpy + Pillow, ~20 s.
"""
import sys, os
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(__file__))
from scan_colours import load, to_ww

a = sys.argv; box = list(map(float, a[3:9])); opt = dict(zip(a[9::2], a[10::2]))
look = opt.get('--look', '+x'); ppm = float(opt.get('--ppm', 80))
ax = {'+x': (2, 1, 0, -1), '-x': (2, 1, 0, 1), '+z': (0, 1, 2, 1), '-z': (0, 1, 2, -1)}[look]   # (horiz axis, up, depth axis, horiz sign)
hi, up, di, hs = ax
lo_h, hi_h = (box[0], box[1]) if hi == 0 else (box[4], box[5]); lo_v, hi_v = box[2], box[3]
W, H = int((hi_h - lo_h) * ppm) + 1, int((hi_v - lo_v) * ppm) + 1
img = np.full((H, W, 3), 245, np.uint8); dep = np.full((H, W), np.inf)
near = 1 if look[0] == '+' else -1   # +x: smaller x is nearer the viewer
rng = np.random.default_rng(1)
for P, UV, F, im in load(a[1]):
  V = to_ww(P, 1.8); T = V[F]; c = T.mean(1)
  k = (c[:, 0] > box[0]) & (c[:, 0] < box[1]) & (c[:, 1] > box[2]) & (c[:, 1] < box[3]) & (c[:, 2] > box[4]) & (c[:, 2] < box[5])
  if not k.any(): continue
  T = T[k]; U = UV[F[k]]; area = np.linalg.norm(np.cross(T[:, 1] - T[:, 0], T[:, 2] - T[:, 0]), axis=1) / 2
  n = np.clip((area * ppm * ppm * 4).astype(int), 1, 400); idx = np.repeat(np.arange(len(T)), n)
  r1, r2 = rng.random(len(idx)), rng.random(len(idx)); f = r1 + r2 > 1; r1[f], r2[f] = 1 - r1[f], 1 - r2[f]
  w = np.stack([1 - r1 - r2, r1, r2], 1)
  p = (T[idx] * w[:, :, None]).sum(1); uv = (U[idx] * w[:, :, None]).sum(1)
  h, wd = im.shape[:2]; col = im[np.clip(((1 - uv[:, 1]) * h).astype(int), 0, h - 1), np.clip((uv[:, 0] * wd).astype(int), 0, wd - 1)]
  hx = (p[:, hi] - lo_h) if hs > 0 else (hi_h - p[:, hi]); px = (hx * ppm).astype(int); py = ((hi_v - p[:, up]) * ppm).astype(int)
  d = p[:, di] * near; ok = (px >= 0) & (px < W) & (py >= 0) & (py < H)
  px, py, d, col = px[ok], py[ok], d[ok], col[ok]
  o = np.lexsort((-d, py * W + px))   # last of each pixel = nearest
  lin = (py * W + px)[o]; last = np.r_[lin[1:] != lin[:-1], True]; sel = o[last]
  better = d[sel] < dep.ravel()[lin[last]]; sel = sel[better]; L = (py * W + px)[sel]
  dep.ravel()[L] = d[sel]; img.reshape(-1, 3)[L] = col[sel]
out = Image.fromarray(img); dr = ImageDraw.Draw(out)
if '--grid' in opt:
  step, org = map(float, opt['--grid'].split(','))
  t = org
  while t > lo_h - step: t -= step
  while t <= hi_h + 1e-6:
    if t >= lo_h:
      x = ((t - lo_h) if hs > 0 else (hi_h - t)) * ppm; dr.line([(x, 0), (x, H)], fill=(0, 200, 255), width=1); dr.text((x + 2, 2), f'{t:.2f}', fill=(0, 120, 200))
    t += step
  for yv in np.arange(np.ceil(lo_v), hi_v, 1.0):
    y = (hi_v - yv) * ppm; dr.line([(0, y), (12, y)], fill=(255, 0, 120), width=2); dr.text((14, y - 6), f'{yv:.0f} m', fill=(255, 0, 120))
out.save(a[2]); print(a[2], W, 'x', H)
