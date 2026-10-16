#!/usr/bin/env python3
"""Sample colours from a Polycam GLB inside a box in the WW frame. Prints numbers only (nothing from the scan is saved).
usage: python3 bin/scan_colours.py <scan.glb> x0 x1 y0 y1 z0 z1 [--hue lo,hi] [--sat min] [--rot deg]
  WW frame (docs/ww-measurements.md): turn about y, floor at scan y -1.509, WW x = scan x + 10.0, z = scan z - 13.75.
  --hue keeps only texels with hue in [lo,hi] degrees (e.g. 5,40 for orange paint), --sat drops greys.
Pure numpy + Pillow (trimesh isn't installable here). Reads the scan where it is; never copy a scan into this repo.
"""
import sys, json, struct, io, colorsys
import numpy as np
from PIL import Image

def load(path):
  f = open(path, 'rb').read(); L = struct.unpack('<I', f[12:16])[0]; j = json.loads(f[20:20 + L]); B = f[20 + L + 8:]
  def acc(i):
    a = j['accessors'][i]; bv = j['bufferViews'][a['bufferView']]; dt = {5123: np.uint16, 5125: np.uint32, 5126: np.float32}[a['componentType']]
    n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3}[a['type']]; o = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    return np.frombuffer(B, dt, a['count'] * n, o).reshape(-1, n) if n > 1 else np.frombuffer(B, dt, a['count'], o)
  out = []
  for m in j['meshes']:
    for pr in m['primitives']:
      img = j['images'][j['textures'][j['materials'][pr['material']]['pbrMetallicRoughness']['baseColorTexture']['index']]['source']]
      bv = j['bufferViews'][img['bufferView']]; im = np.asarray(Image.open(io.BytesIO(B[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']])).convert('RGB'))
      out.append((acc(pr['attributes']['POSITION']).astype(np.float64), acc(pr['attributes']['TEXCOORD_0']), acc(pr['indices']).reshape(-1, 3), im))
  return out

def to_ww(p, rot):
  t = np.radians(rot); c, s = np.cos(t), np.sin(t); x = c * p[:, 0] + s * p[:, 2]; z = -s * p[:, 0] + c * p[:, 2]
  return np.stack([x + 10.0, p[:, 1] + 1.509, z - 13.75], 1)

if __name__ == '__main__':
  a = sys.argv; box = list(map(float, a[2:8])); opt = dict(zip(a[8::2], a[9::2]))
  hue = list(map(float, opt['--hue'].split(','))) if '--hue' in opt else None; smin = float(opt.get('--sat', 0)); rot = float(opt.get('--rot', 1.8))
  cols = []
  for P, UV, F, im in load(a[1]):
    W = to_ww(P, rot); cen = W[F].mean(1)
    k = (cen[:, 0] > box[0]) & (cen[:, 0] < box[1]) & (cen[:, 1] > box[2]) & (cen[:, 1] < box[3]) & (cen[:, 2] > box[4]) & (cen[:, 2] < box[5])
    if not k.any(): continue
    uv = UV[F[k]].mean(1); h, w = im.shape[:2]
    px = im[np.clip(((1 - uv[:, 1]) * h).astype(int), 0, h - 1), np.clip((uv[:, 0] * w).astype(int), 0, w - 1)]
    cols.append(px)
  if not cols: print('no faces in box'); sys.exit()
  c = np.concatenate(cols).astype(float)
  hs = np.array([colorsys.rgb_to_hsv(*(v / 255)) for v in c])
  keep = hs[:, 1] >= smin
  if hue: keep &= ((hs[:, 0] * 360 >= hue[0]) & (hs[:, 0] * 360 <= hue[1]))
  c = c[keep]
  if not len(c): print('no texels pass the filter'); sys.exit()
  q = np.percentile(c, [10, 50, 90], 0).round().astype(int)
  print(f'faces {len(c)} of {keep.size} · p10 {tuple(q[0])} · median {tuple(q[1])} · p90 {tuple(q[2])} · hex #{q[1][0]:02x}{q[1][1]:02x}{q[1][2]:02x}')
