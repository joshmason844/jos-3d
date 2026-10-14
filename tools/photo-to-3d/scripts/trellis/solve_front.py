import numpy as np, cv2, json
from scipy.optimize import least_squares
W, H = 2016, 1512; f = 26 * np.hypot(W, H) / 43.27; K = np.array([[f, 0, W / 2], [0, f, H / 2], [0, 0, 1]])
# cradle end-block corners read off the fine grid (levels bottom→top: 11,12,13,14,15). left = front-left block outer edge, right = front-right outer edge
L_top = [(361, 1179), (349, 1066), (349, 960), (324, 841), (306, 719)]; L_bot = [(361, 1219), (349, 1122), (349, 1013), (324, 907), (306, 791)]
R_top = [(1657, 1126), (1666, 1029), (1682, 938), (1712, 829), (1701, 710)]; R_bot = [(1657, 1201), (1666, 1094), (1682, 991), (1712, 894), (1701, 782)]
obs = np.array(L_top + L_bot + R_top + R_bot, float)
STACK = 0.99; BUNDLE = .07; D = 1.35
def model(q):
    Lh, p, hb = q[6:9]; t0 = STACK - BUNDLE - 4 * p; pts = []
    for side in (-1, 1):
        for which in ('top', 'bot'):
            for k in range(5):
                y = t0 + k * p - (0 if which == 'top' else hb); pts.append((side * Lh + q[9 + k], y, D / 2 + q[14 + k]))
    return np.array(pts)
def res(q):
    Lh, p, hb = q[6:9]; floor_gap = (STACK - BUNDLE - 4 * p - hb) - .02  # lowest block sits on the floor
    uv, _ = cv2.projectPoints(model(q), q[:3], q[3:6], K, None); return np.r_[[floor_gap * 2000], (uv.reshape(-1, 2) - obs).ravel(), q[9:14] * 40, q[14:19] * 25, [q[9:14].sum() * 200]]  # small offsets preferred; mean shift belongs to the camera
R0 = cv2.Rodrigues(np.array([np.pi + .25, 0, 0]))[0]; C0 = np.array([0, 1.4, D / 2 + 3.0]); t0 = -R0 @ C0
q0 = np.r_[cv2.Rodrigues(R0)[0].ravel(), t0, [1.03, .19, .09], np.zeros(10)]
lo = np.r_[[-np.inf] * 6, [.8, .1, .03], [-.12] * 5, [-1e-6] * 5]; hi = np.r_[[np.inf] * 6, [1.3, .3, .2], [.12] * 5, [1e-6] * 5]
r = least_squares(res, q0, loss='huber', f_scale=4, bounds=(lo, hi))
e = np.abs(r.fun[1:41]).reshape(-1, 2); Lh, p, hb = r.x[6:9]
Rm = cv2.Rodrigues(r.x[:3])[0]; C = -Rm.T @ r.x[3:6]
print(f'fit mean {np.linalg.norm(e,axis=1).mean():.1f} px, max {np.linalg.norm(e,axis=1).max():.1f} px')
print('per-cradle shift along (cm, 11→15):', (r.x[9:14] * 100).round(1), ' in/out (cm):', (r.x[14:19] * 100).round(1))
print(f'cradle length {2*Lh:.3f} m, level pitch {p:.3f} m, end block height {hb:.3f} m, camera at {C.round(2)} (height {C[1]:.2f} m, {C[2]-D/2:.2f} m from the front face)')
json.dump({'rvec': r.x[:3].tolist(), 'tvec': r.x[3:6].tolist(), 'f': f, 'W': W, 'H': H, 'L': 2 * Lh, 'pitch': p, 'block': hb, 'D': D, 'stack': STACK, 'bundle': BUNDLE, 'dx': r.x[9:14].tolist(), 'dz': r.x[14:19].tolist()}, open('front_cam.json', 'w'))
