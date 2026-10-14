"""Mesh a Person's distance field region by region, label, shade (vertex AO) and pack for the browser."""
import base64, json, time
import numpy as np
from skimage.measure import marching_cubes
from sdf import f32


def eval_grid(fn, lo, hi, h, chunk=600_000):
    xs, ys, zs = (np.arange(lo[i], hi[i] + h * .5, h, dtype=f32) for i in range(3))
    vol = np.empty((len(xs), len(ys), len(zs)), f32)
    per = max(1, chunk // (len(ys) * len(zs)))
    for i in range(0, len(xs), per):
        X, Y, Z = np.meshgrid(xs[i:i + per], ys, zs, indexing='ij')
        P = np.stack([X.ravel(), Y.ravel(), Z.ravel()], 1)
        vol[i:i + per] = fn(P).reshape(X.shape)
    return vol, (xs[0], ys[0], zs[0])


def region(dist, lo, hi, h, keep=None):
    """Marching cubes of dist(P) over a box. keep(P) -> distance-like mask (<0 keeps) clips the region."""
    t = time.time()
    fn = (lambda P: np.maximum(dist(P), keep(P))) if keep else dist
    vol, o = eval_grid(fn, np.asarray(lo, f32), np.asarray(hi, f32), h)
    if vol.min() > 0 or vol.max() < 0:
        return np.zeros((0, 3), f32), np.zeros((0, 3), np.int64)
    v, f, _, _ = marching_cubes(vol, 0.0, spacing=(h, h, h))
    v = (v + np.asarray(o, f32)).astype(f32)
    print(f'  region {np.round(lo, 2)}..{np.round(hi, 2)} @{h * 1000:.1f}mm: {len(v)} verts {len(f)} tris {time.time() - t:.1f}s')
    return v, f.astype(np.int64)


def grad(fn, P, e=.0008):
    g = np.zeros_like(P)
    for i in range(3):
        d = np.zeros(3, f32); d[i] = e
        g[:, i] = fn(P + d) - fn(P - d)
    return g / np.maximum(np.linalg.norm(g, axis=1, keepdims=True), 1e-9)


def ao(fn, P, N, step=.012, n=4):
    occ = np.zeros(len(P), f32)
    for i in range(1, n + 1):
        hh = step * i
        occ += (hh - fn(P + N * hh)) / (2 ** i)
    return np.clip(1 - 1.3 * occ / step, .5, 1)


def pack(v, f, n, c, labels, order, scale=1.0):
    """Quantise and base64 a mesh; triangles sorted into one group per label."""
    v = v * scale
    tl = labels[f]                                         # (T,3) vertex labels per tri
    tri_lab = np.array([np.bincount(r, minlength=len(order)).argmax() for r in tl]) if len(f) < 0 else _mode3(tl)
    srt = np.argsort(tri_lab, kind='stable'); f = f[srt]; tri_lab = tri_lab[srt]
    groups = []
    for li, name in enumerate(order):
        idx = np.nonzero(tri_lab == li)[0]
        if len(idx): groups.append(dict(label=name, start=int(idx[0]) * 3, count=int(len(idx)) * 3))
    lo, hi = v.min(0), v.max(0); q = np.round((v - lo) / (hi - lo) * 65535).astype(np.uint16)
    b64 = lambda a: base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()
    idx = f.astype(np.uint32 if len(v) > 65535 else np.uint16)
    return dict(lo=lo.tolist(), hi=hi.tolist(), pos=b64(q), nrm=b64(np.round(n * 127).astype(np.int8)), col=b64(c.astype(np.uint8)),
                idx=b64(idx), idx32=bool(len(v) > 65535), groups=groups, nv=int(len(v)), nt=int(len(f)))


def _mode3(tl):
    a, b, c = tl[:, 0], tl[:, 1], tl[:, 2]
    return np.where(a == b, a, np.where(a == c, a, np.where(b == c, b, a)))


def adjacency(nv, f):
    import scipy.sparse as sp
    i = np.concatenate([f[:, 0], f[:, 1], f[:, 2], f[:, 1], f[:, 2], f[:, 0]])
    j = np.concatenate([f[:, 1], f[:, 2], f[:, 0], f[:, 0], f[:, 1], f[:, 2]])
    A = sp.coo_matrix((np.ones(len(i), f32), (i, j)), shape=(nv, nv)).tocsr()
    A.data[:] = 1
    deg = np.asarray(A.sum(1)).ravel()
    return A, np.maximum(deg, 1)


def taubin(v, f, iters=6, lam=.5, mu=-.53):
    """Smooth away marching-cubes stair steps without shrinking the shape."""
    A, deg = adjacency(len(v), f)
    for _ in range(iters):
        for k in (lam, mu):
            v = v + k * (A @ v / deg[:, None] - v)
    return v.astype(f32)


def smooth_scalar(x, f, iters=4):
    A, deg = adjacency(len(x), f)
    for _ in range(iters):
        x = .5 * x + .5 * (A @ x) / deg
    return x
