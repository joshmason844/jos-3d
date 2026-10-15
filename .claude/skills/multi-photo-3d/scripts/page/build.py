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
ap.add_argument('--no-denoise', action='store_true', help='skip the colour median (the cloud in the published page already had it)')
ap.add_argument('--no-tone', action='store_true', help='skip the local shadow lift (to compare)')
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
    out = out.copy()
    if not a.no_denoise:
        nb = out['c'][_[:, 1:5]].astype(np.float32)
        out['c'] = np.clip(0.5 * out['c'] + 0.5 * np.median(nb, 1), 0, 255).round().astype(np.uint8)
    if not a.no_tone: out['c'] = tone(out['p'].astype(np.float64), out['c'])
    head = raw[:h].decode().replace(f'element vertex {len(pts)}', f'element vertex {len(out)}')
    return head.encode() + out.tobytes(), med, int((~keep).sum()), gaps


def tone(P, C):
    """Local shadow lift (a 3D version of what a phone does to a dark photo): the racking bays came out of the photos
    near-black, so on a phone they read as mush. Each point gets the mean brightness of its neighbourhood (~35 cm, from a
    1-in-8 sample so it's fast), dark neighbourhoods are lifted towards mid-grey, and each point's difference from its
    neighbourhood is boosted a little so crate edges, boxes and slats inside the bays separate. Hue is kept (RGB scaled
    together), bright things (orange canvas, the yellow forklift) barely move."""
    import numpy as np
    from scipy.spatial import cKDTree
    c = C.astype(np.float32) / 255; L = c @ np.float32([.2126, .7152, .0722]) + 1e-4
    rng = np.random.default_rng(1); s = rng.choice(len(P), max(len(P) // 8, 1), replace=False)
    _, i = cKDTree(P[s]).query(P, k=64, workers=-1); Lloc = L[s][i].mean(1)
    gain = np.clip((0.42 / np.maximum(Lloc, 0.03)) ** 0.65, 1.0, 3.5)
    Lnew = Lloc * gain + (L - Lloc) * gain * 1.35          # lift the neighbourhood, boost local detail a bit more
    Lnew = Lnew / (1 + np.maximum(Lnew - 0.75, 0) * 2.0)  # soft shoulder so nothing clips to white
    c = c * (np.maximum(Lnew, 0.01) / L)[:, None]
    print(f'tone: median brightness {np.median(L):.2f} → {np.median(Lnew):.2f}, {np.mean(gain > 1.5) * 100:.0f}% of points lifted 1.5×+')
    return np.clip(c * 255, 0, 255).round().astype(np.uint8)


def rack_box(raw):
    """Measure the racking, not the cloud. The cloud's box is stretched by the floor in front of the rack (the 9 m "depth"
    was floor), so: fit a vertical plane to everything above 30 cm (RANSAC on x/z, then a least-squares refine) = the rack
    face. Points 0.5–2 m behind it are the back beams; front-to-back = the gap between the two layers' medians.
    Length is the 1st–99th percentile along the face, height the 99th percentile above the floor (y = 0).
    Returns a dict for the page (face origin, along and depth directions on the floor, ends, depth, height) or None."""
    import json
    import numpy as np
    h = raw.index(b'end_header\n') + len(b'end_header\n')
    P = np.frombuffer(raw[h:], dtype=[('p', '<f4', 3), ('c', 'u1', 3)])['p'].astype(np.float64)
    up = P[P[:, 1] > 0.3]
    if len(up) < 1000: return None
    xz = up[:, [0, 2]]; rng = np.random.default_rng(0); best = 0
    for _ in range(500):
        p0, p1 = xz[rng.choice(len(xz), 2, replace=False)]; v = p1 - p0
        if np.linalg.norm(v) < 1: continue
        n = np.array([-v[1], v[0]]) / np.linalg.norm(v); k = int((np.abs((xz - p0) @ n) < 0.12).sum())
        if k > best: best, bn, bp = k, n, p0
    if best < 0.3 * len(xz): return None  # no clear face: leave the page on the plain cloud box
    q = xz[np.abs((xz - bp) @ bn) < 0.12]; o = q.mean(0)
    _, _, vt = np.linalg.svd(q - o, full_matrices=False); t, n = vt[0], vt[1]
    d = (xz - o) @ n
    back = (d > 0.5) & (d < 2.0); front = np.abs(d) < 0.3
    if back.sum() < ((d < -0.5) & (d > -2.0)).sum(): n, d = -n, -d; back = (d > 0.5) & (d < 2.0)  # depth points away from the cameras
    depth = float(np.median(d[back]) - np.median(d[front])) if back.sum() > 0.03 * front.sum() else None
    s = front | back; tt = (xz - o) @ t
    t0, t1 = np.percentile(tt[s], [1, 99]); H = float(np.percentile(up[s, 1], 99))
    if t[0] < 0: t, t0, t1 = -t, -t1, -t0  # left to right along +x, so labels read the same way each build
    r = dict(o=[round(float(o[0]), 3), round(float(o[1]), 3)], t=[round(float(t[0]), 4), round(float(t[1]), 4)], n=[round(float(n[0]), 4), round(float(n[1]), 4)],
             t0=round(float(t0), 3), t1=round(float(t1), 3), f=round(float(np.median(d[front])), 3), depth=None if depth is None else round(depth, 3), h=round(H, 3))
    print(f'rack: {t1 - t0:.2f} m long × {depth if depth is None else round(depth, 2)} m deep × {H:.2f} m high (face holds {best / len(xz) * 100:.0f}% of the points above 30 cm)')
    return json.dumps(r, separators=(',', ':'))


data = open(a.src, 'rb').read()
if b'red' not in data[:600]: sys.exit('expected a plain xyz + rgb point cloud PLY (sfm.py dense.ply)')
data, spacing, strays, gaps = clean(data)
rack = rack_box(data)
safe = lambda s: html.escape(s).replace("'", '&#39;').replace('`', '')
t = (HERE / 'page.html').read_text()
for k, v in {'__TITLE__': safe(a.title), '__SUB__': safe(a.sub), '__FILENAME__': os.path.basename(a.src),
             '__KIND__': 'points', '__FLIP__': 'false', '__SPACING__': f'{spacing:.4f}', '__STRAYS__': f'{strays + a.prior_strays:,}', '__B64__': base64.b64encode(data).decode(), '__GAPS__': base64.b64encode(gaps).decode(),
             '__RACK__': html.escape(rack or '', quote=True)}.items():
    t = t.replace(k, v)
Path(a.out).parent.mkdir(parents=True, exist_ok=True); Path(a.out).write_text(t)
print(f'{a.out}: {len(data) / 1e6:.1f} MB cloud, page {os.path.getsize(a.out) / 1e6:.1f} MB')
subprocess.run([sys.executable, str(ROOT / 'bin/link_code.py'), a.out, '.claude/skills/multi-photo-3d/scripts/page'], check=False)
