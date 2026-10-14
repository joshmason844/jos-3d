#!/usr/bin/env python3
"""Write a test Gaussian-splat .ply (standard 3DGS layout) of a 5 m bell tent, so viewers can be tested without a real scan.
usage: python3 fake_splat.py out.ply [count]"""
import sys, numpy as np
out = sys.argv[1]; n = int(sys.argv[2]) if len(sys.argv) > 2 else 120000
rng = np.random.default_rng(7)
r, wall, peak = 2.5, 0.6, 3.0
# area-weighted split between wall band, cone roof and grass
wall_a, roof_a, grass_a = 2*np.pi*r*wall, np.pi*r*np.hypot(r, peak-wall), np.pi*6**2*0.25
k = rng.choice(3, n, p=np.array([wall_a, roof_a, grass_a])/(wall_a+roof_a+grass_a))
t = rng.uniform(0, 2*np.pi, n); pts = np.zeros((n, 3)); col = np.zeros((n, 3))
w = k == 0; pts[w] = np.c_[r*np.cos(t[w]), rng.uniform(0, wall, w.sum()), r*np.sin(t[w])]
f = k == 1; s = np.sqrt(rng.uniform(0, 1, f.sum())); rr = r*s; pts[f] = np.c_[rr*np.cos(t[f]), peak-(peak-wall)*s, rr*np.sin(t[f])]
g = k == 2; gr = np.sqrt(rng.uniform((r+0.05)**2, 6**2, g.sum())); pts[g] = np.c_[gr*np.cos(t[g]), rng.normal(0, .01, g.sum()), gr*np.sin(t[g])]
col[~g] = [0.91, 0.86, 0.76]; col[g] = [0.33, 0.47, 0.22]
door = (~g) & (np.abs(np.arctan2(pts[:, 2], pts[:, 0]) - np.pi/2) < 0.22*(1-pts[:, 1]/1.9)) & (pts[:, 1] < 1.8)
col[door] = [0.55, 0.47, 0.36]
col = np.clip(col + rng.normal(0, .03, col.shape), 0, 1)
pts[:, 1] *= -1  # real 3DGS/Scaniverse PLYs are y-down: mimic that so the viewer's flip gets tested
sc = np.full((n, 3), np.log(0.025)); op = np.full(n, 3.0)  # logit opacity ≈ 0.95
q = np.tile([1, 0, 0, 0], (n, 1)).astype(np.float32)
fields = ['x', 'y', 'z', 'nx', 'ny', 'nz', 'f_dc_0', 'f_dc_1', 'f_dc_2', 'opacity', 'scale_0', 'scale_1', 'scale_2', 'rot_0', 'rot_1', 'rot_2', 'rot_3']
data = np.c_[pts, np.zeros((n, 3)), (col-0.5)/0.28209479, op, sc, q].astype('<f4')
with open(out, 'wb') as fh:
    fh.write(('ply\nformat binary_little_endian 1.0\nelement vertex %d\n' % n + ''.join('property float %s\n' % p for p in fields) + 'end_header\n').encode())
    fh.write(data.tobytes())
print(out, n, 'splats', round(data.nbytes/1e6, 1), 'MB')
