#!/usr/bin/env python3
"""Multi-photo 3D (structure from motion) with OpenCV + SciPy, no GPU.

usage: python3 sfm.py <photo dir> <out dir> [--f35 26] [--fov-v DEG] [--max-side 1600] [--dense] [--a4]
  photos in capture order (a walk round or along something, ~10° apart, lots of overlap)
  --f35   35 mm-equivalent focal length if EXIF lacks it (iPhone main camera: 26)
  --fov-v vertical field of view in degrees (overrides focal; used for rendered test sets)
  --dense add a dense coloured cloud from neighbouring-pair stereo
  --a4    find an A4 sheet on the floor and scale the result to metres
writes: cameras.json, sparse.ply, dense.ply (with --dense), report.json
"""
import sys, os, glob, json, argparse, time
import numpy as np, cv2
from scipy.optimize import least_squares
from scipy.sparse import lil_matrix
from scipy.spatial import cKDTree

ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('out'); ap.add_argument('--f35', type=float, default=26.0)
ap.add_argument('--fov-v', type=float, default=0); ap.add_argument('--max-side', type=int, default=1600); ap.add_argument('--dense', action='store_true'); ap.add_argument('--a4', action='store_true')
A = ap.parse_args(); os.makedirs(A.out, exist_ok=True); T0 = time.time()
log = lambda *a: print(f'[{time.time() - T0:5.1f}s]', *a, flush=True)

# ---------- 1. load photos, guess the lens ----------
def exif_f35(path):
    try:
        from PIL import Image
        ex = Image.open(path).getexif().get_ifd(0x8769); v = ex.get(0xA405)
        return float(v) if v else None
    except Exception: return None
files = sorted(f for f in glob.glob(os.path.join(A.src, '*')) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')))
imgs, f35s = [], []
for f in files:
    im = cv2.imread(f); s = min(1.0, A.max_side / max(im.shape[:2])); imgs.append(cv2.resize(im, None, fx=s, fy=s, interpolation=cv2.INTER_AREA) if s < 1 else im); f35s.append(exif_f35(f))
H, W = imgs[0].shape[:2]; N = len(imgs)
if A.fov_v: f0 = (H / 2) / np.tan(np.radians(A.fov_v) / 2); lens = f'fov {A.fov_v:.1f}°'
else: f35 = next((x for x in f35s if x), A.f35); f0 = f35 * np.hypot(W, H) / 43.27; lens = f'{f35:.0f} mm equiv' + (' (EXIF)' if any(f35s) else ' (assumed)')
K = np.array([[f0, 0, W / 2], [0, f0, H / 2], [0, 0, 1]]); log(f'{N} photos {W}×{H}, focal {f0:.0f}px from {lens}')

# ---------- 2. features + matches with geometric checks ----------
sift = cv2.SIFT_create(nfeatures=7000, contrastThreshold=0.02)
clahe = cv2.createCLAHE(2.0, (8, 8))
KP, DS, COL = [], [], []
for im in imgs:
    k, d = sift.detectAndCompute(clahe.apply(cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)), None)
    KP.append(np.float32([p.pt for p in k])); DS.append(d)
    COL.append(np.array([im[int(min(H - 1, p[1])), int(min(W - 1, p[0]))][::-1] for p in KP[-1]], np.uint8))
log('features', [len(k) for k in KP][:6], '…')
bf = cv2.FlannBasedMatcher(dict(algorithm=1, trees=5), dict(checks=64))  # KD-tree: ~10× faster than brute force
win = min(N, 12)  # photos are taken in order, so match each with its next 8 (plus wrap-round for a full circle)
pairs = {}
todo = sorted({(min(i, (i + d) % N), max(i, (i + d) % N)) for i in range(N) for d in range(1, win + 1) if (i + d) % N != i})
for a, b in todo:
    m = bf.knnMatch(DS[a], DS[b], k=2); good = [p for p, q in (x for x in m if len(x) == 2) if p.distance < .75 * q.distance]
    if len(good) < 40: continue
    qi = np.array([g.queryIdx for g in good]); ti = np.array([g.trainIdx for g in good])
    E, mask = cv2.findEssentialMat(KP[a][qi], KP[b][ti], K, cv2.RANSAC, 0.999, 1.5)
    if E is None or mask.sum() < 30: continue
    inl = mask.ravel() > 0; pairs[(a, b)] = (qi[inl], ti[inl])
log('verified pairs', len(pairs))

# ---------- 3. tracks (union-find over matched keypoints) ----------
parent = {}
def find(a):
    while parent.get(a, a) != a: parent[a] = parent.get(parent[a], parent[a]); a = parent[a]
    return a
for (i, j), (qi, ti) in pairs.items():
    for a, b in zip(qi, ti):
        ra, rb = find((i, int(a))), find((j, int(b)))
        if ra != rb: parent[ra] = rb
groups = {}
for node in list(parent.keys()):
    groups.setdefault(find(node), []).append(node)
tracks = []
for g in groups.values():
    ims = [n[0] for n in g]
    if len(g) >= 2 and len(set(ims)) == len(ims): tracks.append(dict(g))  # one keypoint per image
obs_of = [dict() for _ in range(N)]  # image -> {kp: track}
for t, tr in enumerate(tracks):
    for i, k in tr.items(): obs_of[i][k] = t
log('tracks', len(tracks), 'mean length', round(np.mean([len(t) for t in tracks]), 1))

# ---------- 4. initial pair: lots of matches, but real parallax (not a pure rotation) ----------
cands = []
for (i, j), (qi, ti) in pairs.items():
    if len(qi) < 60: continue
    Hm, hm = cv2.findHomography(KP[i][qi], KP[j][ti], cv2.RANSAC, 3.0)
    ratio = hm.sum() / len(qi) if hm is not None else 1
    if ratio < .9: cands.append((len(qi) * (1 - ratio), i, j))
cands.sort(reverse=True)
def try_init(i, j):  # how many well-conditioned points would this pair give?
    qi, ti = pairs[(i, j)]
    E, _ = cv2.findEssentialMat(KP[i][qi], KP[j][ti], K, cv2.RANSAC, .999, 1.5)
    if E is None or E.shape != (3, 3): return 0, None
    _, R, t, m = cv2.recoverPose(E, KP[i][qi], KP[j][ti], K)
    P1 = K @ np.hstack([np.eye(3), np.zeros((3, 1))]); P2 = K @ np.hstack([R, t])
    X = cv2.triangulatePoints(P1, P2, KP[i][qi].T.astype(float), KP[j][ti].T.astype(float)); X = (X[:3] / X[3]).T
    C2 = (-R.T @ t).ravel(); a = X / np.linalg.norm(X, axis=1, keepdims=True); b = X - C2; b /= np.linalg.norm(b, axis=1, keepdims=True)
    ang = np.degrees(np.arccos(np.clip((a * b).sum(1), -1, 1))); z2 = (X @ R.T + t.ravel())[:, 2]
    return int(((ang > 2) & (X[:, 2] > 0) & (z2 > 0)).sum()), (R, t)
scored = sorted(((try_init(i, j)[0], i, j) for _, i, j in cands[:25]), reverse=True)
_, i0, j0 = scored[0]; R, t = try_init(i0, j0)[1]
cams = {i0: (np.zeros(3), np.zeros(3)), j0: (cv2.Rodrigues(R)[0].ravel(), t.ravel())}
log('initial pair', i0, j0, 'good points', scored[0][0])
P3 = {}  # track -> xyz

def proj_mat(i): r, t = cams[i]; return K @ np.hstack([cv2.Rodrigues(r)[0], t.reshape(3, 1)])
def centre(i): r, t = cams[i]; return -cv2.Rodrigues(r)[0].T @ t
def triangulate_new(min_angle=2.0, max_err=3.0):
    added = 0
    for t, tr in enumerate(tracks):
        if t in P3: continue
        reg = [i for i in tr if i in cams]
        if len(reg) < 2: continue
        best_pair, best_ang = None, 0
        for a in range(len(reg)):  # widest-baseline pair of views
            for b in range(a + 1, len(reg)):
                ca, cb = centre(reg[a]), centre(reg[b]); best_pair = best_pair or (reg[a], reg[b])
                d = np.linalg.norm(ca - cb)
                if d > best_ang: best_ang, best_pair = d, (reg[a], reg[b])
        a, b = best_pair
        X = cv2.triangulatePoints(proj_mat(a), proj_mat(b), KP[a][tr[a]].reshape(2, 1).astype(float), KP[b][tr[b]].reshape(2, 1).astype(float)); X = (X[:3] / X[3]).ravel()
        ok = True
        for i in reg:
            r, tt = cams[i]; Xc = cv2.Rodrigues(r)[0] @ X + tt
            if Xc[2] <= 0: ok = False; break
            u = K @ Xc; u = u[:2] / u[2]
            if np.linalg.norm(u - KP[i][tr[i]]) > max_err: ok = False; break
        ra, rb = X - centre(a), X - centre(b)
        ang = np.degrees(np.arccos(np.clip(ra @ rb / (np.linalg.norm(ra) * np.linalg.norm(rb)), -1, 1)))
        if ok and ang >= min_angle: P3[t] = X; added += 1
    return added

# ---------- 5. bundle adjustment: all cameras, points and the focal length together ----------
def bundle(rounds=1):
    global K
    for _ in range(rounds):
        ci = sorted(cams); cidx = {c: k for k, c in enumerate(ci)}; pi = sorted(P3); pidx = {p: k for k, p in enumerate(pi)}
        O = [(cidx[i], pidx[t], *KP[i][k]) for t in pi for i, k in tracks[t].items() if i in cams]
        O = np.array(O); oc, op, ou = O[:, 0].astype(int), O[:, 1].astype(int), O[:, 2:]
        x0 = np.hstack([np.hstack([np.r_[cams[c][0], cams[c][1]] for c in ci]), np.hstack([P3[p] for p in pi]), [K[0, 0]]])
        nc, npnt = len(ci), len(pi)
        def res(x):
            C = x[:nc * 6].reshape(nc, 6); Pp = x[nc * 6:nc * 6 + npnt * 3].reshape(npnt, 3); f = x[-1]
            r = C[oc, :3]; th = np.linalg.norm(r, axis=1, keepdims=True); k = np.where(th > 1e-12, r / np.maximum(th, 1e-12), 0)
            X = Pp[op]; ct, st = np.cos(th), np.sin(th)
            Xr = X * ct + np.cross(k, X) * st + k * (np.sum(k * X, 1, keepdims=True)) * (1 - ct) + C[oc, 3:]
            uv = f * Xr[:, :2] / Xr[:, 2:3] + K[:2, 2]
            return (uv - ou).ravel()
        S = lil_matrix((len(O) * 2, len(x0)), dtype=int); ar = np.arange(len(O))
        for s in range(6): S[2 * ar, oc * 6 + s] = 1; S[2 * ar + 1, oc * 6 + s] = 1
        for s in range(3): S[2 * ar, nc * 6 + op * 3 + s] = 1; S[2 * ar + 1, nc * 6 + op * 3 + s] = 1
        S[:, -1] = 1
        for s in range(6): S[:, cidx[ci[0]] * 6 + s] = 0  # hold the first camera still (gauge)
        r = least_squares(res, x0, jac_sparsity=S, x_scale='jac', loss='huber', f_scale=2.0, method='trf', max_nfev=60, verbose=0)
        x = r.x; C = x[:nc * 6].reshape(nc, 6)
        for c in ci: cams[c] = (C[cidx[c], :3], C[cidx[c], 3:])
        Pp = x[nc * 6:nc * 6 + npnt * 3].reshape(npnt, 3)
        for p in pi: P3[p] = Pp[pidx[p]]
        K = K.copy(); K[0, 0] = K[1, 1] = x[-1]
        e = np.abs(res(x)).reshape(-1, 2).max(1)
        bad = set(op[e > 4.0]); [P3.pop(pi[b], None) for b in bad]  # drop points that still don't fit
        return float(np.sqrt(np.mean(res(x) ** 2))), len(bad)

import pickle
if os.environ.get('SFM_RESUME') and os.path.exists(os.path.join(A.out, 'state.pkl')):
    cams, P3, K, rms = pickle.load(open(os.path.join(A.out, 'state.pkl'), 'rb')); log('resumed sparse state')
else:
  n_new = triangulate_new(); log('initial points', n_new)
  rms, dropped = bundle(); log(f'BA rms {rms:.2f}px')
  # ---------- 6. add the other photos one by one (PnP), triangulate, adjust ----------
  since = 0
  while len(cams) < N:
      cand = []
      for i in range(N):
          if i in cams: continue
          o = [(k, t) for k, t in obs_of[i].items() if t in P3]
          cand.append((len(o), i, o))
      cand.sort(reverse=True)
      if not cand or cand[0][0] < 12: break
      _, i, o = cand[0]
      pts3 = np.array([P3[t] for _, t in o]); pts2 = np.array([KP[i][k] for k, _ in o])
      ok, rv, tv, inl = cv2.solvePnPRansac(pts3, pts2, K, None, iterationsCount=2000, reprojectionError=4.0, confidence=.999, flags=cv2.SOLVEPNP_EPNP)
      if not ok or inl is None or len(inl) < 12:
          obs_of[i] = {}; log('could not place photo', i); continue
      rv, tv = cv2.solvePnPRefineLM(pts3[inl.ravel()], pts2[inl.ravel()], K, None, rv, tv)
      cams[i] = (rv.ravel(), tv.ravel()); added = triangulate_new(); since += 1
      if since >= 3 or len(cams) == N: rms, dropped = bundle(); since = 0; log(f'placed {len(cams)}/{N} (+{added} pts) BA rms {rms:.2f}px, f {K[0,0]:.0f}')
  rms, _ = bundle(); rms, _ = bundle(); import pickle; pickle.dump((cams, P3, K, rms), open(os.path.join(A.out, 'state.pkl'), 'wb')); log(f'final: {len(cams)}/{N} photos, {len(P3)} points, rms {rms:.2f}px, focal {K[0,0]:.0f}px')

# ---------- 7. dense: neighbouring pairs → rectified stereo → depth ----------
def colours(t):
    i, k = next(iter(tracks[t].items())); return COL[i][k]
dense_pts, dense_col = [], []
if A.dense:
    reg = sorted(cams); P = np.array(list(P3.values())); med_d = np.median([np.linalg.norm(P - centre(i), axis=1).mean() for i in reg])
    def rect(a, b):
        Ra, ta = cv2.Rodrigues(cams[a][0])[0], cams[a][1]; Rb, tb = cv2.Rodrigues(cams[b][0])[0], cams[b][1]
        Rr = Rb @ Ra.T; tr = tb - Rr @ ta
        return Ra, ta, cv2.stereoRectify(K, np.zeros(5), K, np.zeros(5), (W, H), Rr, tr.reshape(3, 1).astype(np.float64), alpha=0)
    pairs_d = [(a, b) for a, b in zip(reg, reg[1:])] + [(a, b) for a, b in zip(reg, reg[2:])]
    for a, b in pairs_d:
        Ra, ta, (R1, R2, Pa, Pb, Q, _, _) = rect(a, b)
        if abs(Pb[1, 3]) > abs(Pb[0, 3]): continue          # mostly vertical move: skip
        if Pb[0, 3] > 0: a, b = b, a; Ra, ta, (R1, R2, Pa, Pb, Q, _, _) = rect(a, b)  # keep 'a' as the left camera
        m1 = cv2.initUndistortRectifyMap(K, None, R1, Pa, (W, H), cv2.CV_32FC1); m2 = cv2.initUndistortRectifyMap(K, None, R2, Pb, (W, H), cv2.CV_32FC1)
        ia = cv2.remap(imgs[a], *m1, cv2.INTER_LINEAR); ib = cv2.remap(imgs[b], *m2, cv2.INTER_LINEAR)
        nd = 16 * 12; sg = cv2.StereoSGBM_create(minDisparity=0, numDisparities=nd, blockSize=5, P1=8 * 3 * 25, P2=32 * 3 * 25, uniquenessRatio=12, speckleWindowSize=120, speckleRange=2, disp12MaxDiff=1, mode=cv2.STEREO_SGBM_MODE_SGBM_3WAY)
        d = sg.compute(cv2.cvtColor(ia, cv2.COLOR_BGR2GRAY), cv2.cvtColor(ib, cv2.COLOR_BGR2GRAY)).astype(np.float32) / 16
        xyz = cv2.reprojectImageTo3D(d, Q); good = (d > 1) & np.isfinite(xyz).all(2) & (ia.sum(2) > 0)
        X = xyz[good]; c = ia[good][:, ::-1]
        Xw = (Ra.T @ (R1.T @ X.T) - Ra.T @ ta.reshape(3, 1)).T     # rectified-left → camera → world
        dist = np.linalg.norm(Xw - centre(a), axis=1); keep = (dist > .05 * med_d) & (dist < 3 * med_d)
        dense_pts.append(Xw[keep][::4]); dense_col.append(c[keep][::4])
    if dense_pts:
        D = np.vstack(dense_pts); DC = np.vstack(dense_col)
        tree = cKDTree(D); dd, _ = tree.query(D, k=8); m = dd[:, -1] < np.percentile(dd[:, -1], 85)  # drop lonely points
        D, DC = D[m], DC[m]
        # agree with the sparse cloud: drop dense points far from any sparse point
        dd2, _ = cKDTree(P).query(D); m = dd2 < np.percentile(dd2, 90); D, DC = D[m], DC[m]
        vox = .0012 * (np.percentile(P, 95, 0) - np.percentile(P, 5, 0)).max(); key = np.floor(D / vox).astype(np.int64); _, first = np.unique(key, axis=0, return_index=True)
        D, DC = D[first], DC[first]
        if len(D) > 300000: sel = np.random.default_rng(0).choice(len(D), 300000, replace=False); D, DC = D[sel], DC[sel]
        log('dense points', len(D))

# ---------- 8. scale: an A4 sheet on the floor ----------
scale, scale_note = 1.0, 'unscaled (relative units)'
if A.a4:
    def find_a4(im):  # small bright four-sided shapes; the floor-plane check below decides which is really A4
        g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY); out = []
        thr = max(170, np.percentile(g, 99.3)); b = (g >= thr).astype(np.uint8) * 255
        b = cv2.morphologyEx(b, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
        for c in cv2.findContours(b, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]:
            a = cv2.contourArea(c)
            if a < 60 or a > .05 * g.size: continue
            q = cv2.approxPolyDP(c, .04 * cv2.arcLength(c, True), True)
            if len(q) == 4 and cv2.isContourConvex(q) and a / cv2.contourArea(cv2.convexHull(c)) > .85: out.append(cv2.cornerSubPix(g, q.reshape(4, 1, 2).astype(np.float32), (3, 3), (-1, -1), (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, .01)).reshape(4, 2))
        return out
    det = {i: find_a4(imgs[i]) for i in sorted(cams)}
    # the sheet is the candidate whose centre triangulates consistently across views
    best = None
    for i0_, qs in det.items():
        for q0 in qs:
            rays = []
            for i, qs2 in det.items():
                Rm = cv2.Rodrigues(cams[i][0])[0]; C = centre(i)
                for q in qs2:
                    d = Rm.T @ np.linalg.inv(K) @ np.r_[q.mean(0), 1]; rays.append((i, C, d / np.linalg.norm(d)))
            if len(rays) < 2: continue
            # least-squares point closest to all rays from the seed's best matches
            def closest(rs):
                Aa = np.zeros((3, 3)); bb = np.zeros(3)
                for _, C, d in rs: Pm = np.eye(3) - np.outer(d, d); Aa += Pm; bb += Pm @ C
                return np.linalg.lstsq(Aa, bb, rcond=None)[0]
            Rm0 = cv2.Rodrigues(cams[i0_][0])[0]; d0 = Rm0.T @ np.linalg.inv(K) @ np.r_[q0.mean(0), 1]; d0 /= np.linalg.norm(d0); C0 = centre(i0_)
            P = np.array(list(P3.values())); scene = np.ptp(P, 0).max()
            # candidate depths along the seed ray: pick the one most other rays pass near
            ts = np.linspace(.02, 2.0, 400) * scene; bestt = (0, None)
            for t in ts:
                X = C0 + t * d0; near = [r for r in rays if np.linalg.norm(np.cross(X - r[1], r[2])) < .004 * scene]
                if len({r[0] for r in near}) > bestt[0]: bestt = (len({r[0] for r in near}), near)
            if bestt[1] and (best is None or bestt[0] > best[0]): best = (bestt[0], closest(bestt[1]), bestt[1])
    longs = []
    if best and best[0] >= 2:
        _, Xc, used = best; P = np.array(list(P3.values())); nn = P[np.argsort(np.linalg.norm(P - Xc, axis=1))[:150]]
        U, Sv, Vt = np.linalg.svd(nn - nn.mean(0)); n = Vt[2]; p0 = nn.mean(0)
        for i, C, d in used:
            Rm = cv2.Rodrigues(cams[i][0])[0]; q = min(det[i], key=lambda q: np.linalg.norm(np.cross(Xc - C, Rm.T @ np.linalg.inv(K) @ np.r_[q.mean(0), 1]) ))
            pts = []
            for u, v in q:
                dd = Rm.T @ np.linalg.inv(K) @ np.array([u, v, 1.0]); tt = ((p0 - C) @ n) / (dd @ n); pts.append(C + tt * dd)
            pts = np.array(pts); e = [np.linalg.norm(pts[k] - pts[(k + 1) % 4]) for k in range(4)]
            L, S_ = (e[0] + e[2]) / 2, (e[1] + e[3]) / 2
            if L < S_: L, S_ = S_, L
            if .6 < S_ / L < .82: longs.append(L)
    if longs:
        scale = 0.297 / np.median(longs); scale_note = f'A4 sheet seen in {len(longs)} photos (spread {np.std(longs) / np.mean(longs) * 100:.1f}%)'
log('scale', round(scale, 4), scale_note)

# ---------- 9. level it: floor flat at y = 0, up = +y (three.js), metres ----------
Pall = np.array(list(P3.values())); ups = np.array([-cv2.Rodrigues(cams[i][0])[0].T @ np.array([0, 1.0, 0]) for i in cams]); up0 = ups.mean(0); up0 /= np.linalg.norm(up0)
rng = np.random.default_rng(1); bestf = None; tol = .006 * (np.percentile(Pall, 95, 0) - np.percentile(Pall, 5, 0)).max()
for _ in range(1500):
    sm = Pall[rng.choice(len(Pall), 3, replace=False)]; n = np.cross(sm[1] - sm[0], sm[2] - sm[0]); nn = np.linalg.norm(n)
    if nn < 1e-12: continue
    n /= nn; n = n if n @ up0 > 0 else -n
    if n @ up0 < .85: continue                          # floor must face roughly the way the cameras' up does
    below = ((Pall - sm[0]) @ n < -3 * tol).mean()        # and almost nothing should sit under it
    inl = (np.abs((Pall - sm[0]) @ n) < tol).sum()
    if below < .03 and (bestf is None or inl > bestf[0]): bestf = (inl, n, sm[0])
if bestf:
    _, nf, pf = bestf; fl = Pall[np.abs((Pall - pf) @ nf) < tol]; U_, S_, Vt_ = np.linalg.svd(fl - fl.mean(0)); nf2 = Vt_[2] * np.sign(Vt_[2] @ nf); pf = fl.mean(0)
    ycol = nf2; zc = np.mean([cv2.Rodrigues(cams[i][0])[0].T @ np.array([0, 0, -1.0]) for i in cams], 0)  # average viewing direction → −z
    zc = -(zc - (zc @ ycol) * ycol); zc /= np.linalg.norm(zc); xcol = np.cross(ycol, zc)
    LEV = np.vstack([xcol, ycol, zc]); ORG = pf; level_note = f'floor found ({len(fl)} points)'
else:
    LEV = np.diag([1, -1, -1.0]); ORG = np.zeros(3); level_note = 'no floor found: left as shot'
lev = lambda X: (LEV @ (np.asarray(X) - ORG).T).T
log('level', level_note)

# ---------- 10. write out ----------
def write_ply(path, X, C):
    with open(path, 'wb') as fh:
        fh.write(f'ply\nformat binary_little_endian 1.0\nelement vertex {len(X)}\nproperty float x\nproperty float y\nproperty float z\nproperty uchar red\nproperty uchar green\nproperty uchar blue\nend_header\n'.encode())
        rec = np.zeros(len(X), dtype=[('x', '<f4'), ('y', '<f4'), ('z', '<f4'), ('r', 'u1'), ('g', 'u1'), ('b', 'u1')])
        rec['x'], rec['y'], rec['z'] = (lev(X) * scale).T; rec['r'], rec['g'], rec['b'] = C.T; fh.write(rec.tobytes())
pts = np.array([P3[t] for t in P3]); cols = np.array([colours(t) for t in P3])
write_ply(os.path.join(A.out, 'sparse.ply'), pts, cols)
if A.dense and dense_pts:
    write_ply(os.path.join(A.out, 'dense.ply'), D, DC)
    # .splat (antimatter15 layout, 32 bytes each): what the 3d-scans viewer draws. Plain xyz/rgb points have no size, so they don't show.
    rec = np.zeros(len(D), dtype=[('p', '<f4', 3), ('s', '<f4', 3), ('c', 'u1', 4), ('q', 'u1', 4)])
    rec['p'] = lev(D) * scale; rec['s'] = vox * scale * .7; rec['c'][:, :3] = DC; rec['c'][:, 3] = 235; rec['q'] = [255, 128, 128, 128]
    rec.tofile(os.path.join(A.out, 'dense.splat'))
json.dump({'K': K.tolist(), 'scale': scale, 'cams': {files[i]: {'rvec': cams[i][0].tolist(), 'tvec': (cams[i][1] * scale).tolist(), 'centre': (lev(centre(i)) * scale).tolist(), 'centre_raw': (centre(i) * scale).tolist()} for i in sorted(cams)}}, open(os.path.join(A.out, 'cameras.json'), 'w'), indent=1)
rep = {'photos': N, 'placed': len(cams), 'points': len(P3), 'dense_points': int(len(D)) if A.dense and dense_pts else 0, 'reproj_rms_px': round(rms, 2), 'focal_px': round(float(K[0, 0]), 1), 'scale': scale_note, 'level': level_note, 'seconds': round(time.time() - T0)}
json.dump(rep, open(os.path.join(A.out, 'report.json'), 'w'), indent=1); log(rep)
