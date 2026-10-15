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
ap.add_argument('--min-clump', type=float, default=0.015, help='smallest clump kept, as a share of the cloud')
ap.add_argument('--prior-strays', type=int, default=0, help='strays already removed before (when rebuilding from a cloud pulled out of the published page: 14287)')
ap.add_argument('--keep-strays', action='store_true', help='skip the clean-up (to compare)')
a = ap.parse_args()


def clean(raw):
    """Drop stray points so the cloud (and the size readout) is honest:
    - lone points: mean distance to their 8 nearest neighbours more than 3× the median
    - under the floor: sfm.py levels the floor to y = 0, so anything below -12 cm is noise
    - floaters: link points closer than 2.5× the median spacing; any clump that isn't joined to a big piece
      (under MIN_CLUMP of the cloud) is a mismatch hanging in the air, so it goes
    - far scatter: crop to the box of the big pieces (0.5–99.5 percentile) plus a 40 cm margin
    Returns the new PLY bytes, the median point spacing (m, sizes the discs on the page) and how many went."""
    import numpy as np
    from scipy.sparse import coo_matrix
    from scipy.sparse.csgraph import connected_components
    from scipy.spatial import cKDTree
    h = raw.index(b'end_header\n') + len(b'end_header\n')
    pts = np.frombuffer(raw[h:], dtype=[('p', '<f4', 3), ('c', 'u1', 3)])
    P = pts['p'].astype(np.float64); tree = cKDTree(P)
    d, _ = tree.query(P, k=9, workers=-1); gap = d[:, 1:].mean(1); med = float(np.median(gap))
    keep = np.ones(len(pts), bool)
    if not a.keep_strays:
        keep = (gap < 3 * med) & (P[:, 1] > -0.12)
        idx = np.flatnonzero(keep); Q = P[idx]
        pr = cKDTree(Q).query_pairs(2.5 * med, output_type='ndarray')
        _, lab = connected_components(coo_matrix((np.ones(len(pr)), (pr[:, 0], pr[:, 1])), shape=(len(Q), len(Q))), directed=False)
        size = np.bincount(lab); big = size[lab] >= a.min_clump * len(Q)
        lo, hi = np.percentile(Q[big], 0.5, 0) - 0.4, np.percentile(Q[big], 99.5, 0) + 0.4
        inbox = np.all((Q >= lo) & (Q <= hi), 1)
        keep[idx[~(big & inbox)]] = False
        print(f'clean: {len(pts) - len(idx):,} lone/under-floor, {(~big).sum():,} in {int((size < a.min_clump * len(Q)).sum()):,} floating clumps, '
              f'{(big & ~inbox).sum():,} outside the box')
    out = pts[keep]
    # per-point disc size: distance to each point's 4th nearest neighbour, as a multiple of the median (0.6–2×),
    # so thin patches (canvas) get bigger discs that close up and dense patches stay sharp. The 4th neighbour (not the
    # mean of 8) keeps points on an edge from ballooning, since half their neighbourhood is empty air
    dk, _ = cKDTree(P[keep]).query(P[keep], k=5, workers=-1)
    local = np.clip(dk[:, 4] / med, 0.6, 2.0)
    gaps = np.round(local * 64).astype(np.uint8).tobytes()
    # calm the colour speckle (each point's colour comes from one photo pair, so neighbours disagree): half its own colour,
    # half the median of its 4 nearest neighbours. Median, not mean, so beam and canvas edges stay crisp
    out = out.copy(); nb = out['c'][_[:, 1:5]].astype(np.float32)
    out['c'] = np.clip(0.5 * out['c'] + 0.5 * np.median(nb, 1), 0, 255).round().astype(np.uint8)
    head = raw[:h].decode().replace(f'element vertex {len(pts)}', f'element vertex {len(out)}')
    return head.encode() + out.tobytes(), med, int((~keep).sum()), gaps


data = open(a.src, 'rb').read()
if b'red' not in data[:600]: sys.exit('expected a plain xyz + rgb point cloud PLY (sfm.py dense.ply)')
data, spacing, strays, gaps = clean(data)
safe = lambda s: html.escape(s).replace("'", '&#39;').replace('`', '')
t = (HERE / 'page.html').read_text()
for k, v in {'__TITLE__': safe(a.title), '__SUB__': safe(a.sub), '__FILENAME__': os.path.basename(a.src),
             '__KIND__': 'points', '__FLIP__': 'false', '__SPACING__': f'{spacing:.4f}', '__STRAYS__': f'{strays + a.prior_strays:,}', '__B64__': base64.b64encode(data).decode(), '__GAPS__': base64.b64encode(gaps).decode()}.items():
    t = t.replace(k, v)
Path(a.out).parent.mkdir(parents=True, exist_ok=True); Path(a.out).write_text(t)
print(f'{a.out}: {len(data) / 1e6:.1f} MB cloud, page {os.path.getsize(a.out) / 1e6:.1f} MB')
subprocess.run([sys.executable, str(ROOT / 'bin/link_code.py'), a.out, '.claude/skills/multi-photo-3d/scripts/page'], check=False)
