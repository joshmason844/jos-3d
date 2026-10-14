#!/usr/bin/env python3
"""Build the multi-photo test page (one self-contained HTML, point cloud embedded).
usage: python3 build.py [dense.ply] [out.html] [--title T] [--sub S]
Defaults: work/yard-test/dense.ply → work/yard-test/multiphoto.html
dense.ply comes from sfm.py (photos → cameras → dense cloud). If you only have the published page,
pull the cloud back out with:  python3 extract_ply.py <page.html> work/yard-test/dense.ply"""
import argparse, base64, html, os, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = next(p for p in HERE.parents if (p / '.claude' / 'skills').is_dir())
ap = argparse.ArgumentParser()
ap.add_argument('src', nargs='?', default=str(ROOT / 'work/yard-test/dense.ply'))
ap.add_argument('out', nargs='?', default=str(ROOT / 'work/yard-test/multiphoto.html'))
ap.add_argument('--title', default='Yard · multi-photo test'); ap.add_argument('--sub', default='24 photos')
ap.add_argument('--keep-strays', action='store_true', help='skip the clean-up (to compare)')
a = ap.parse_args()


def clean(raw):
    """Drop stray points so the cloud (and the size readout) is honest:
    - lone points: mean distance to their 8 nearest neighbours more than 3× the median
    - under the floor: sfm.py levels the floor to y = 0, so anything below -12 cm is noise
    Returns the new PLY bytes, the median point spacing (m, sizes the discs on the page) and how many went."""
    import numpy as np
    from scipy.spatial import cKDTree
    h = raw.index(b'end_header\n') + len(b'end_header\n')
    pts = np.frombuffer(raw[h:], dtype=[('p', '<f4', 3), ('c', 'u1', 3)])
    d, _ = cKDTree(pts['p']).query(pts['p'], k=9, workers=-1); gap = d[:, 1:].mean(1); med = float(np.median(gap))
    keep = np.ones(len(pts), bool) if a.keep_strays else (gap < 3 * med) & (pts['p'][:, 1] > -0.12)
    out = pts[keep]
    head = raw[:h].decode().replace(f'element vertex {len(pts)}', f'element vertex {len(out)}')
    return head.encode() + out.tobytes(), med, int((~keep).sum())


data = open(a.src, 'rb').read()
if b'red' not in data[:600]: sys.exit('expected a plain xyz + rgb point cloud PLY (sfm.py dense.ply)')
data, spacing, strays = clean(data)
safe = lambda s: html.escape(s).replace("'", '&#39;').replace('`', '')
t = (HERE / 'page.html').read_text()
for k, v in {'__TITLE__': safe(a.title), '__SUB__': safe(a.sub), '__FILENAME__': os.path.basename(a.src),
             '__KIND__': 'points', '__FLIP__': 'false', '__SPACING__': f'{spacing:.4f}', '__STRAYS__': f'{strays:,}', '__B64__': base64.b64encode(data).decode()}.items():
    t = t.replace(k, v)
Path(a.out).parent.mkdir(parents=True, exist_ok=True); Path(a.out).write_text(t)
print(f'{a.out}: {len(data) / 1e6:.1f} MB cloud, page {os.path.getsize(a.out) / 1e6:.1f} MB')
subprocess.run([sys.executable, str(ROOT / 'bin/link_code.py'), a.out, '.claude/skills/multi-photo-3d/scripts/page'], check=False)
