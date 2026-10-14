# Bake photo textures onto model faces: each face = 4 world corners (TL, TR, BR, BL); rectify that patch of the photo.
import json, base64, io, numpy as np, cv2
from PIL import Image
from geo import proj, floor
im = cv2.imread('yard.jpg')
def lift(img, g=0.82):  # open up the dark racking a touch so it reads on a phone
    lut = np.array([((i / 255.0) ** g) * 255 for i in range(256)], np.uint8); return cv2.LUT(img, lut)
def rect(x0, x1, y0, y1, z): return [(x0, y1, z), (x1, y1, z), (x1, y0, z), (x0, y0, z)]
def vert(a, b, h): (ax, az), (bx, bz) = a, b; return [(ax, h, az), (bx, h, bz), (bx, 0, bz), (ax, 0, az)]
F = {}
Z = -0.03
for k, (x0, lv) in {'u0': (0, [1.64, 3.26, 4.88]), 'u1': (2.8, [1.64, 3.26])}.items():
    for i, h in enumerate(lv): F[f'{k}_{i}'] = rect(x0 + .08, x0 + 2.72, h + .14, h + 1.52, Z)
F['panels'] = rect(2.88, 5.52, 4.95, 6.25, Z); F['cubL'] = rect(-5.25, -3.45, 4.61, 6.91, Z); F['cubR'] = rect(-2.35, -.15, 4.51, 6.96, Z)
F['tents'] = rect(5.82, 8.18, 3.40, 4.47, Z); F['tables'] = rect(5.68, 8.32, 1.64, 3.20, Z)
F['fridges'] = rect(-2.72, -.08, 1.68, 3.02, Z); F['water'] = rect(-2.72, -.08, 3.06, 4.33, Z); F['sink'] = rect(-5.52, -2.88, 3.12, 4.44, Z)
F['bags'] = rect(-8.32, -5.68, 3.22, 6.0, Z)
F['khanaB'] = vert((1.28, 4.25), (3.67, 4.45), .95); F['khanaS'] = vert((-1.41, 2.59), (.5, 2.55), .71)
out = {}
for k, c in F.items():
    P = np.float32([proj(np.array(p, float)) for p in c]); W3 = np.array(c, float)
    wm, hm = np.linalg.norm(W3[1] - W3[0]), np.linalg.norm(W3[0] - W3[3]); s = min(400 / max(wm, hm), 300)
    w, h = max(32, int(wm * s)), max(32, int(hm * s))
    M = cv2.getPerspectiveTransform(P, np.float32([[0, 0], [w, 0], [w, h], [0, h]]))
    t = lift(cv2.warpPerspective(im, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE))
    ok, buf = cv2.imencode('.jpg', t, [cv2.IMWRITE_JPEG_QUALITY, 82]); out[k] = {'c': c, 'img': 'data:image/jpeg;base64,' + base64.b64encode(buf).decode()}
# floor: top-down from the photo, with the forklift/benches/khana masked out (they'd smear) and outside-the-photo transparent
X0, X1, Z0, Z1, S = -2.6, 9.6, 4.6, 10.4, 90
Wf, Hf = int((X1 - X0) * S), int((Z1 - Z0) * S)
xs, zs = np.meshgrid(X0 + (np.arange(Wf) + .5) / S, Z0 + (np.arange(Hf) + .5) / S)
Pw = np.stack([xs, np.zeros_like(xs), zs], -1).reshape(-1, 3); uv = proj(Pw).reshape(Hf, Wf, 2).astype(np.float32)
img = cv2.remap(im, uv[..., 0], uv[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
alpha = ((uv[..., 0] >= 0) & (uv[..., 0] < im.shape[1]) & (uv[..., 1] >= 0) & (uv[..., 1] < im.shape[0])).astype(np.uint8) * 255
for (cx, cz, hw, hd, ry, ht) in [(1.24, 7.15, .6, 1.4, .85, 2.2), (2.47, 3.75, 1.25, .65, -.08, 1.0), (-.45, 2.07, 1.0, .55, 0, .8), (5.11, 5.22, .45, .4, 0, 1.0), (6.75, 6.1, .7, 1.05, 0, 1.1)]:
    corners = []
    for sx in (-1, 1):
        for sz in (-1, 1):
            lx, lz = sx * hw, sz * hd; wx = cx + lx * np.cos(ry) + lz * np.sin(ry); wz = cz - lx * np.sin(ry) + lz * np.cos(ry)
            for y in (0, ht): corners.append(proj(np.array([wx, y, wz])))
    hull = cv2.convexHull(np.float32(corners))
    for j in range(Hf):  # mask floor texels whose pixel falls inside that object's silhouette
        pass
    m = np.zeros(im.shape[:2], np.uint8); cv2.fillConvexPoly(m, hull.astype(np.int32), 255)
    inside = cv2.remap(m, uv[..., 0], uv[..., 1], cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT, borderValue=0) > 0
    # keep the object's own footprint (that's genuinely under it) out too: the model draws it
    alpha[inside] = 0
alpha = cv2.GaussianBlur(alpha, (0, 0), 3)
rgba = np.dstack([cv2.cvtColor(lift(img, .9), cv2.COLOR_BGR2RGB), alpha])
b = io.BytesIO(); Image.fromarray(rgba).save(b, 'WEBP', quality=78)  # flip: texture v runs from z0 at the bottom
out['floor'] = {'rect': [X0, X1, Z0, Z1], 'img': 'data:image/webp;base64,' + base64.b64encode(b.getvalue()).decode()}
json.dump(out, open('bake.json', 'w'))
print({k: len(v['img']) // 1024 for k, v in out.items()}, 'KB; total', sum(len(v['img']) for v in out.values()) // 1024, 'KB')
cv2.imwrite('bake_floor_preview.jpg', cv2.cvtColor(rgba[..., :3], cv2.COLOR_RGB2BGR) * (rgba[..., 3:] > 128))
cv2.imwrite('bake_preview.jpg', np.hstack([cv2.resize(cv2.imdecode(np.frombuffer(base64.b64decode(out[k]['img'].split(',')[1]), np.uint8), 1), (220, 160)) for k in ('u0_0', 'u1_1', 'panels', 'cubR', 'tents', 'fridges', 'sink', 'khanaB')]))
