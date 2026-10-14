import json, numpy as np, sys
out = sys.argv[1] if len(sys.argv) > 1 else 'out'
T = json.load(open('shots/truth.json')); C = json.load(open(f'{out}/cameras.json'))
names = sorted(C['cams']); idx = [int(n.split('img')[-1][:2]) for n in names]
est = np.array([C['cams'][n]['centre_raw'] for n in names]); tru = np.array([np.array(T[i]['mw'])[12:15] for i in idx])
def umeyama(X, Y, with_scale=True):  # Y ≈ s R X + t
    mx, my = X.mean(0), Y.mean(0); Xc, Yc = X - mx, Y - my; U, S, Vt = np.linalg.svd(Yc.T @ Xc / len(X)); D = np.eye(3); D[2, 2] = np.sign(np.linalg.det(U @ Vt))
    R = U @ D @ Vt; s = (S * np.diag(D)).sum() / Xc.var(0).sum() if with_scale else 1.0; return s, R, my - s * R @ mx
s, R, t = umeyama(est, tru, True); err = np.linalg.norm((s * (R @ est.T)).T + t - tru, axis=1)
print(f'shape check (best scale): camera positions RMS {np.sqrt((err**2).mean())*100:.1f} cm, max {err.max()*100:.1f} cm over a {np.ptp(tru,0).max():.1f} m walk')
if abs(C['scale'] - 1) > 1e-9:
    s2, R2, t2 = umeyama(est, tru, False); err2 = np.linalg.norm((R2 @ est.T).T + t2 - tru, axis=1)
    print(f'A4 scale vs true scale: {(1/s - 1)*-100:+.2f}% → rigid-only RMS {np.sqrt((err2**2).mean())*100:.1f} cm')
json.dump({'s': s, 'R': R.tolist(), 't': t.tolist()}, open(f'{out}/to_truth.json', 'w'))
