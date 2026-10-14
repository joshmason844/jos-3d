#!/usr/bin/env python3
"""Measure things in a photo using a flat reference of known size in the same plane.

  grid    IMG OUT                      draw a labelled pixel grid so points can be read off
  detect  IMG [OUT]                    find the reference rectangle (card / A4) automatically
  measure IMG OUT --ref x,y x,y x,y x,y --ref-mm W,H  --seg "label:x1,y1:x2,y2" ...

Reference corners go clockwise from top-left. Measured points must lie on the
same flat surface as the reference (floor, table, wall), or the numbers are off.
"""
import argparse, json, sys
import cv2
import numpy as np

REFS = {"card": (85.6, 53.98), "a4": (297.0, 210.0), "a5": (210.0, 148.0), "note20": (149.0, 80.0)}
PX_ERR = 3.0   # how far off a hand-picked point can be, in pixels
REF_ERR = 0.7  # how far off an auto-found card corner can be, in pixels (use ~2 if picked by hand)


def main():
  ap = argparse.ArgumentParser()
  sub = ap.add_subparsers(dest="cmd", required=True)
  g = sub.add_parser("grid"); g.add_argument("img"); g.add_argument("out"); g.add_argument("--step", type=int, default=0)
  d = sub.add_parser("detect"); d.add_argument("img"); d.add_argument("out", nargs="?")
  m = sub.add_parser("measure"); m.add_argument("img"); m.add_argument("out")
  m.add_argument("--ref", nargs=4, required=True); m.add_argument("--ref-mm", required=True)
  m.add_argument("--seg", action="append", default=[])
  m.add_argument("--flat", action="store_true", help="photo taken straight down: skip perspective, much steadier with a small card")
  a = ap.parse_args()
  img = cv2.imread(a.img)
  if img is None:
    sys.exit(f"can't read {a.img}")
  if a.cmd == "grid":
    cv2.imwrite(a.out, draw_grid(img, a.step))
  elif a.cmd == "detect":
    quad = detect_ref(img)
    print(json.dumps({"corners": None if quad is None else [[round(float(v), 1) for v in p] for p in quad]}))
    if a.out and quad is not None:
      cv2.polylines(img, [quad.astype(np.int32)], True, (0, 255, 255), max(2, img.shape[1] // 400))
      cv2.imwrite(a.out, img)
  else:
    ref = np.array([[float(v) for v in p.split(",")] for p in a.ref], np.float32)
    w, h = REFS.get(a.ref_mm.lower()) or tuple(float(v) for v in a.ref_mm.split(","))
    res = measure(img, ref, (w, h), [parse_seg(s) for s in a.seg], a.flat)
    cv2.imwrite(a.out, res.pop("image"))
    print(json.dumps(res, indent=1))


def measure(img, ref, ref_mm, segs, flat=False):
  w, h = ref_mm
  dst = np.array([[0, 0], [w, 0], [w, h], [0, h]], np.float32)
  H = fit(ref, dst, flat)
  out = img.copy()
  s = max(1.0, img.shape[1] / 1200)
  cv2.polylines(out, [ref.astype(np.int32)], True, (0, 255, 255), int(2 * s))
  label(out, f"ref {w:g}x{h:g} mm", ref[0], (0, 255, 255), s)
  rows = []
  for name, p1, p2 in segs:
    mm = plane_dist(H, p1, p2)
    err = spread(ref, dst, p1, p2, flat)
    rows.append({"label": name, "mm": round(mm, 1), "cm": round(mm / 10, 1), "plus_minus_mm": round(err, 1)})
    cv2.line(out, tuple(map(int, p1)), tuple(map(int, p2)), (60, 200, 255), int(3 * s))
    for p in (p1, p2):
      cv2.circle(out, tuple(map(int, p)), int(6 * s), (255, 255, 255), -1)
    mid = ((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2)
    label(out, f"{name} {mm / 10:.1f} cm", mid, (60, 200, 255), s)
  return {"image": out, "ref_mm": [w, h], "mode": "flat" if flat else "angled", "segments": rows,
          "check": f"ref sides re-measured: {plane_dist(H, ref[0], ref[1]):.1f} x {plane_dist(H, ref[1], ref[2]):.1f} mm"}


def plane_dist(H, p1, p2):
  pts = cv2.perspectiveTransform(np.array([[p1, p2]], np.float32), H)[0]
  return float(np.linalg.norm(pts[0] - pts[1]))


def fit(ref, dst, flat):
  if not flat:
    return cv2.getPerspectiveTransform(ref, dst)
  A, _ = cv2.estimateAffine2D(ref, dst)
  return np.vstack([A, [0, 0, 1]])


def spread(ref, dst, p1, p2, flat=False, n=400):
  """95% range of the answer if card corners wobble by REF_ERR px and line ends by PX_ERR px."""
  rng = np.random.default_rng(1); vals = []
  for _ in range(n):
    Hj = fit(np.float32(ref + rng.normal(0, REF_ERR, ref.shape)), dst, flat)
    vals.append(plane_dist(Hj, np.add(p1, rng.normal(0, PX_ERR / 2, 2)), np.add(p2, rng.normal(0, PX_ERR / 2, 2))))
  lo, hi = np.percentile(vals, [2.5, 97.5])
  return (hi - lo) / 2


def detect_ref(img):
  """Largest bright, convex four-sided shape: works for A4 paper and most cards on a darker surface."""
  g = cv2.GaussianBlur(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), (5, 5), 0)
  best, area_best = None, img.shape[0] * img.shape[1] * 0.002
  for edges in (cv2.Canny(g, 40, 120), cv2.threshold(g, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]):
    edges = cv2.dilate(edges, np.ones((3, 3), np.uint8))
    cs, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    for c in cs:
      a = cv2.contourArea(c)
      if a < area_best or a > img.shape[0] * img.shape[1] * 0.9:
        continue
      q = cv2.approxPolyDP(c, 0.02 * cv2.arcLength(c, True), True)
      if len(q) == 4 and cv2.isContourConvex(q) and brightness(g, q) > 160:
        best, area_best = q.reshape(4, 2).astype(np.float32), a
  return None if best is None else refine(img, order(best))


def refine(img, q):
  """Fit a straight line to each edge (sub-pixel) and take the corners where they cross."""
  g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
  gx, gy = cv2.Sobel(g, cv2.CV_32F, 1, 0), cv2.Sobel(g, cv2.CV_32F, 0, 1)
  lines = []
  for i in range(4):
    a, b = q[i], q[(i + 1) % 4]
    d = b - a; n = np.array([-d[1], d[0]]) / np.linalg.norm(d)
    pts = []
    for t in np.linspace(0.12, 0.88, 40):
      base = a + d * t
      offs = np.arange(-6, 6.5, 0.5)
      samp = [base + n * o for o in offs]
      mag = [abs(bilinear(gx, p) * n[0] + bilinear(gy, p) * n[1]) for p in samp]
      k = int(np.argmax(mag))
      if 0 < k < len(mag) - 1:
        den = mag[k - 1] - 2 * mag[k] + mag[k + 1]
        k = k + (0.5 * (mag[k - 1] - mag[k + 1]) / den if den else 0) * 1.0
      pts.append(base + n * (offs[0] + k * 0.5))
    vx, vy, x0, y0 = cv2.fitLine(np.float32(pts), cv2.DIST_HUBER, 0, 0.01, 0.01).ravel()
    lines.append((np.array([x0, y0]), np.array([vx, vy])))
  out = []
  for i in range(4):
    (p1, v1), (p2, v2) = lines[i - 1], lines[i]
    A = np.array([v1, -v2]).T
    try:
      t = np.linalg.solve(A, p2 - p1); out.append(p1 + v1 * t[0])
    except np.linalg.LinAlgError:
      out.append(q[i])
  out = np.float32(out)
  return out if np.abs(out - q).max() < 8 else q


def bilinear(a, p):
  x, y = p; x0, y0 = int(x), int(y)
  if not (0 <= x0 < a.shape[1] - 1 and 0 <= y0 < a.shape[0] - 1):
    return 0.0
  fx, fy = x - x0, y - y0
  return float(a[y0, x0] * (1 - fx) * (1 - fy) + a[y0, x0 + 1] * fx * (1 - fy) + a[y0 + 1, x0] * (1 - fx) * fy + a[y0 + 1, x0 + 1] * fx * fy)


def brightness(g, q):
  mask = np.zeros(g.shape, np.uint8)
  cv2.fillPoly(mask, [q.reshape(-1, 2).astype(np.int32)], 255)
  return cv2.mean(g, mask)[0]


def order(q):
  """Clockwise from top-left, long side first (so --ref-mm card / a4 lines up)."""
  c = q.mean(0)
  q = q[np.argsort(np.arctan2(q[:, 1] - c[1], q[:, 0] - c[0]))]
  q = np.roll(q, -int(np.argmin(q.sum(1))), 0)
  if np.linalg.norm(q[1] - q[0]) < np.linalg.norm(q[3] - q[0]):
    q = np.roll(q, -1, 0)
  return q


def draw_grid(img, step):
  out = img.copy(); h, w = img.shape[:2]
  step = step or max(50, int(round(max(w, h) / 14 / 50) * 50))
  s = max(0.5, w / 2000)
  for x in range(0, w, step):
    cv2.line(out, (x, 0), (x, h), (0, 255, 0), 1)
    cv2.putText(out, str(x), (x + 2, int(18 * s * 2)), cv2.FONT_HERSHEY_SIMPLEX, s, (0, 255, 0), max(1, int(2 * s)))
  for y in range(0, h, step):
    cv2.line(out, (0, y), (w, y), (0, 255, 0), 1)
    cv2.putText(out, str(y), (2, y - 3), cv2.FONT_HERSHEY_SIMPLEX, s, (0, 255, 0), max(1, int(2 * s)))
  return out


def label(img, text, at, col, s):
  x, y = int(at[0]), int(at[1])
  (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.8 * s, int(2 * s))
  cv2.rectangle(img, (x + 6, y - th - 10), (x + tw + 14, y + 4), (20, 10, 0), -1)
  cv2.putText(img, text, (x + 10, y - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.8 * s, col, int(2 * s))


def parse_seg(s):
  name, a, b = s.split(":")
  return name, tuple(float(v) for v in a.split(",")), tuple(float(v) for v in b.split(","))


if __name__ == "__main__":
  main()
