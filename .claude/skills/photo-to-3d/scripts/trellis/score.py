# How close does the render look to the photo? colour difference + structure (edge) match inside the stack area
import cv2, numpy as np, sys
c = cv2.imread(sys.argv[1] if len(sys.argv) > 1 else 'f-canvas.png'); h, w = c.shape[:2]
ph = cv2.resize(cv2.imread('../khana/front.jpg')[470:1330, 60:1940], (w, h))
m = np.zeros((h, w), np.uint8); cv2.rectangle(m, (int(w * .04), int(h * .08)), (int(w * .96), int(h * .9)), 255, -1); m[np.abs(c.astype(int) - [22, 11, 5]).sum(2) < 12] = 0  # stack region, model pixels only
lab = lambda im: cv2.cvtColor(im, cv2.COLOR_BGR2LAB).astype(float)
de = np.linalg.norm(lab(c) - lab(ph), axis=2)[m > 0].mean()
e1 = cv2.Canny(cv2.GaussianBlur(cv2.cvtColor(c, cv2.COLOR_BGR2GRAY), (5, 5), 0), 40, 120); e2 = cv2.Canny(cv2.GaussianBlur(cv2.cvtColor(ph, cv2.COLOR_BGR2GRAY), (5, 5), 0), 40, 120)
d2 = cv2.distanceTransform(255 - e2, cv2.DIST_L2, 3); near = (d2[(e1 > 0) & (m > 0)] < 4).mean()
print(f'colour difference {de:.1f} (lower better) · model edges on a photo edge {near*100:.0f}% (higher better)')
