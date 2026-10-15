import numpy as np, sys
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage
import matplotlib.cm as cm
F = np.load(sys.argv[1]); fa, fb, fc = [float(v) for v in sys.argv[2:5]]; out = sys.argv[5]; cut = 3.0; res = .025
y = F[:, 1] - (fa * F[:, 0] + fb * F[:, 2] + fc); x, z = F[:, 0], F[:, 2]
k = y < cut; x0, x1, z0, z1 = np.floor(x.min()) - 1, np.ceil(x.max()) + 1, np.floor(z.min()) - 1, np.ceil(z.max()) + 1
W, H = int((x1 - x0) / res), int((z1 - z0) / res)
hm = np.full((H, W), -9.0); ix = ((x[k] - x0) / res).astype(int); iz = ((z[k] - z0) / res).astype(int)
np.maximum.at(hm, (iz, ix), y[k])
m = hm > -9; idx = ndimage.distance_transform_edt(~m, return_distances=True, return_indices=True)
d, (ii, jj) = idx; hm2 = hm[ii, jj]; hm2[d > 3] = -9
np.savez(out + '.npz', hm=hm2, x0=x0, z0=z0, res=res)
v = np.clip(hm2 / 2.8, 0, 1); img = (cm.turbo(v * .9 + .05)[:, :, :3] * 255).astype(np.uint8)
g = np.clip(hm2, 0, None); img[(hm2 > -9) & (hm2 < .12)] = (205, 205, 200); img[hm2 <= -9] = (30, 30, 34)
im = Image.fromarray(img); dr = ImageDraw.Draw(im)
for gx in np.arange(x0, x1 + .01, 1):
    px = (gx - x0) / res; dr.line([(px, 0), (px, H)], fill=(90, 90, 90) if gx % 5 else (0, 0, 0), width=1)
    if gx % 2 == 0: dr.text((px + 2, 2), f'{gx:.0f}', fill=(255, 255, 255))
for gz in np.arange(z0, z1 + .01, 1):
    pz = (gz - z0) / res; dr.line([(0, pz), (W, pz)], fill=(90, 90, 90) if gz % 5 else (0, 0, 0), width=1)
    if gz % 2 == 0: dr.text((2, pz + 2), f'{gz:.0f}', fill=(255, 255, 255))
im.save(out + '.png'); print(W, H)
