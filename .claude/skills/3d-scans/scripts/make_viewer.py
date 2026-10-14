#!/usr/bin/env python3
"""Turn a scan or model into one self-contained J·OS viewer page (model embedded, so it publishes as a single artifact).
usage: python3 make_viewer.py <in.glb|in.ply|in.spz|in.splat> <out.html> [--title T] [--sub S] [--flip|--no-flip] [--max-splats N]
- .glb  → mesh (Polycam/Scaniverse mesh export, kit models, Blender)
- .ply/.spz/.splat/.ksplat → Gaussian splat via Spark (Scaniverse "splat" export)
Splats default to flipped (most capture apps write them upside-down for three.js); the page has a flip button anyway.
--max-splats thins a big standard 3DGS .ply so the page stays small (keeps the most opaque splats)."""
import sys, os, base64, argparse, html
import numpy as np
ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('out'); ap.add_argument('--title', default=''); ap.add_argument('--sub', default='')
ap.add_argument('--flip', dest='flip', action='store_true', default=None); ap.add_argument('--no-flip', dest='flip', action='store_false'); ap.add_argument('--max-splats', type=int, default=0)
a = ap.parse_args()
ext = os.path.splitext(a.src)[1].lower(); kind = 'mesh' if ext in ('.glb',) else 'splat'
if ext == '.ply':
    head = open(a.src, 'rb').read(2000); head = head[:head.find(b'end_header')].decode('latin1')
    if 'f_dc_0' not in head and 'red' in head: kind = 'points'  # plain xyz + colour: a point cloud (e.g. from photo-3d)
if ext == '.gltf': sys.exit('Pack .gltf (+ .bin + textures) into one .glb first')
data = open(a.src, 'rb').read()

def thin_ply(raw, keep):
    head_end = raw.index(b'end_header\n') + len(b'end_header\n'); head = raw[:head_end].decode()
    if 'binary_little_endian' not in head: return raw, None
    props = [l.split()[-1] for l in head.splitlines() if l.startswith('property float')]
    if len(props) != sum(1 for l in head.splitlines() if l.startswith('property')): return raw, None  # only plain float layouts
    n = int([l for l in head.splitlines() if l.startswith('element vertex')][0].split()[-1])
    if n <= keep: return raw, n
    arr = np.frombuffer(raw[head_end:head_end + n * 4 * len(props)], '<f4').reshape(n, len(props))
    order = np.argsort(-arr[:, props.index('opacity')]) if 'opacity' in props else np.random.default_rng(1).permutation(n)
    arr = arr[np.sort(order[:keep])]
    return head.replace(f'element vertex {n}', f'element vertex {keep}').encode() + arr.astype('<f4').tobytes(), keep

note = ''
if kind == 'splat' and ext == '.ply' and a.max_splats:
    data, n = thin_ply(data, a.max_splats); note = f' (thinned to {n})' if n else ''
mb = len(data) / 1e6
if mb > 11: print(f'warning: {mb:.1f} MB embedded — over ~11 MB the page passes the 16 MB artifact limit. Use --max-splats or export SPZ.')
flip = (kind == 'splat') if a.flip is None else a.flip
title = a.title or os.path.splitext(os.path.basename(a.src))[0].replace('_', ' ')
t = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'viewer.html')).read()
safe = lambda s: html.escape(s).replace("'", '&#39;').replace('`', '')
for k, v in {'__TITLE__': safe(title), '__SUB__': safe(a.sub), '__FILENAME__': safe(os.path.basename(a.src)), '__KIND__': kind,
             '__FLIP__': 'true' if flip else 'false', '__B64__': base64.b64encode(data).decode()}.items():
    t = t.replace(k, v)
open(a.out, 'w').write(t)
print(f'{a.out}: {kind}, {mb:.1f} MB model{note}, page {os.path.getsize(a.out) / 1e6:.1f} MB, flip={flip}')
# stamp the page with a 'code ↗' link to this source on GitHub
__import__('subprocess').run([__import__('sys').executable, next(str(p) for p in __import__('pathlib').Path(__file__).resolve().parents if (p / '.claude' / 'skills').is_dir()) + '/bin/link_code.py', a.out, '.claude/skills/3d-scans'], check=False)
