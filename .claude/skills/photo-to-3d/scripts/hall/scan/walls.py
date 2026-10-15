import numpy as np, sys
from glb import load
j, b, acc = load(sys.argv[1]); rot = np.radians(float(sys.argv[2]))
F = []
for m in j['meshes']:
    for p in m['primitives']:
        v = acc(p['attributes']['POSITION']).astype(np.float64); idx = acc(p['indices']).reshape(-1, 3).astype(np.int64)
        a, bb, c = v[idx[:, 0]], v[idx[:, 1]], v[idx[:, 2]]; n = np.cross(bb - a, c - a); ar = np.linalg.norm(n, axis=1) / 2; n /= np.maximum(2 * ar[:, None], 1e-12)
        F.append(np.c_[(a + bb + c) / 3, n, ar])
F = np.vstack(F); cc, ss = np.cos(-rot), np.sin(-rot)
def R(x, z): return x * cc - z * ss, x * ss + z * cc
F[:, 0], F[:, 2] = R(F[:, 0], F[:, 2]); F[:, 3], F[:, 5] = R(F[:, 3], F[:, 5])
np.save(sys.argv[3], F)
up = F[:, 4] > .95; h, e = np.histogram(F[up, 1], bins=400, range=(-3, 1), weights=F[up, 6]); fl = e[np.argmax(h)] + .005
print('floor y', round(fl, 3), 'up-area', round(h.max(), 1))
