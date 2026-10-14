"""Signed-distance building blocks for sculpting smooth organic shapes (people, kit) with numpy.
Every function takes P: (N, 3) float32 points and returns (N,) distances (negative inside)."""
import numpy as np

f32 = np.float32


def V(*a):
    return np.array(a, dtype=f32)


def norm(v):
    v = np.asarray(v, dtype=f32)
    return v / np.linalg.norm(v)


def sphere(P, c, r):
    return np.linalg.norm(P - c, axis=1) - r


def ellipsoid(P, c, r, R=None):
    """Ellipsoid with radii r (3,), optional rotation R (3x3, columns = local axes in world)."""
    q = P - c
    if R is not None:
        q = q @ R
    k0 = np.linalg.norm(q / r, axis=1)
    k1 = np.linalg.norm(q / (r * r), axis=1)
    return k0 * (k0 - 1.0) / np.maximum(k1, 1e-9)


def cone(P, a, b, ra, rb):
    """Round cone (capsule with a radius at each end), the workhorse for limbs."""
    a = np.asarray(a, f32); b = np.asarray(b, f32)
    ba = b - a; l2 = float(ba @ ba); rr = ra - rb; a2 = l2 - rr * rr; il2 = 1.0 / l2
    pa = P - a; y = pa @ ba; z = y - l2
    x = pa * l2 - y[:, None] * ba; x2 = (x * x).sum(1); y2 = y * y * l2; z2 = z * z * l2
    k = np.sign(rr) * rr * rr * x2
    d = np.where(np.sign(z) * a2 * z2 > k, np.sqrt(x2 + z2) * il2 - rb,
        np.where(np.sign(y) * a2 * y2 < k, np.sqrt(x2 + y2) * il2 - ra,
                 (np.sqrt(x2 * a2 * il2) + y * rr) * il2 - ra))
    return d.astype(f32)


def capsule(P, a, b, r):
    return cone(P, a, b, r, r)


def rbox(P, c, half, r, R=None):
    q = P - c
    if R is not None:
        q = q @ R
    q = np.abs(q) - (np.asarray(half, f32) - r)
    return np.linalg.norm(np.maximum(q, 0), axis=1) + np.minimum(q.max(1), 0) - r


def torus(P, c, R_major, r_minor, Rm=None):
    q = P - c
    if Rm is not None:
        q = q @ Rm
    xz = np.sqrt(q[:, 0] ** 2 + q[:, 2] ** 2) - R_major
    return np.sqrt(xz * xz + q[:, 1] ** 2) - r_minor


def smin(a, b, k):
    if k <= 0:
        return np.minimum(a, b)
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b + (a - b) * h - k * h * (1 - h)


def smax(a, b, k):
    return -smin(-a, -b, k)


def frame(fwd, up):
    """Rotation whose columns are (side, up, fwd) built from a forward and a rough up vector."""
    f = norm(fwd); s = np.cross(norm(up), f); s /= np.linalg.norm(s); u = np.cross(f, s)
    return np.stack([s, u, f], 1).astype(f32)


class Waves:
    """Cheap smooth 3D noise: a sum of random plane waves. scale = wavelength in metres."""
    def __init__(self, seed, n=10, scale=.05, aniso=(1, 1, 1)):
        g = np.random.default_rng(seed)
        d = g.normal(size=(n, 3)) * np.asarray(aniso, f32); d /= np.linalg.norm(d, axis=1, keepdims=True)
        self.k = (d * (2 * np.pi / scale) * g.uniform(.6, 1.4, (n, 1))).astype(f32)
        self.ph = g.uniform(0, 2 * np.pi, n).astype(f32)
        self.n = n

    def __call__(self, P):
        return (np.sin(P @ self.k.T + self.ph).sum(1) / np.sqrt(self.n)).astype(f32)


class Field:
    """Accumulates labelled solids. Each part: (label, fn, bbox) where fn(P) -> distance.
    A part only evaluates inside its bounding box (plus margin), which keeps hundreds of hair clumps fast."""
    def __init__(self):
        self.parts = []

    def add(self, label, fn, lo, hi, k=0.0, group=None, sub=False):
        """sub=True carves the part out of its group (smooth by k) instead of adding it."""
        self.parts.append(dict(label=label, fn=fn, lo=np.asarray(lo, f32), hi=np.asarray(hi, f32), k=k, group=group or label, sub=sub))

    def eval_groups(self, P, margin=.03, only=None):
        """Distance of each group (smooth union of its parts). Returns dict group -> (N,)."""
        out = {}
        plo, phi = P.min(0), P.max(0)
        for pt in self.parts:
            if only is not None and pt['group'] not in only:
                continue
            mg0 = margin + pt['k']
            if pt['group'] in out and (np.any(pt['lo'] - mg0 > phi) or np.any(pt['hi'] + mg0 < plo)):
                continue
            g = pt['group']
            d = out.get(g)
            if d is None:
                d = np.full(len(P), 1e3, f32); out[g] = d
            mg = margin + pt['k']; m = np.all((P >= pt['lo'] - mg) & (P <= pt['hi'] + mg), axis=1)
            if not m.any():
                continue
            idx = np.nonzero(m)[0]
            dd = pt['fn'](P[idx])
            if pt['sub']:
                d[idx] = smax(d[idx], -dd, pt['k']) if pt['k'] > 0 else np.maximum(d[idx], -dd)
            else:
                d[idx] = smin(d[idx], dd, pt['k']) if pt['k'] > 0 else np.minimum(d[idx], dd)
        return out
