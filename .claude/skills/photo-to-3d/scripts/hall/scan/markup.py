# Marked-up top view of the WW LiDAR scan in WW coordinates (heights only, no scan texture).
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import matplotlib.cm as cm
d = np.load('mainH.npz'); hm = d['hm']; x0, z0, res = float(d['x0']), float(d['z0']), float(d['res'])
OX, OZ = 10.0, -13.75               # WW = scan + (OX, OZ)
S = 40                              # px per metre
WX0, WX1, WZ0, WZ1 = -1.5, 21.5, -31.5, 2.5
W, H = int((WX1 - WX0) * S), int((WZ1 - WZ0) * S)
# resample height map into WW frame
gx = WX0 + (np.arange(W) + .5) / S; gz = WZ0 + (np.arange(H) + .5) / S
sx = ((gx - OX - x0) / res).astype(int); sz = ((gz - OZ - z0) / res).astype(int)
ok = (sx[None, :] >= 0) & (sx[None, :] < hm.shape[1]) & (sz[:, None] >= 0) & (sz[:, None] < hm.shape[0])
h = np.full((H, W), -9.0); h[ok] = hm[np.clip(sz, 0, hm.shape[0] - 1)[:, None].repeat(W, 1)[ok], np.clip(sx, 0, hm.shape[1] - 1)[None, :].repeat(H, 0)[ok]]
img = (cm.Greys(np.clip(h / 3.2, 0, 1) * .75 + .15)[:, :, :3] * 255).astype(np.uint8)
img[(h > -9) & (h < .12)] = (226, 224, 214); img[h <= -9] = (255, 255, 255)
hat = ((np.arange(H)[:, None] + np.arange(W)[None, :]) % 14 == 0); img[(h <= -9) & hat] = (205, 210, 225)
im = Image.fromarray(img); dr = ImageDraw.Draw(im)
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15); Fs = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
except: F = Fs = ImageFont.load_default()
P = lambda x, z: ((x - WX0) * S, (z - WZ0) * S)
for X in range(0, 21, 2): dr.line([P(X, WZ0), P(X, WZ1)], fill=(215, 215, 225)); dr.text((P(X, WZ0)[0] + 2, 2), f'x {X}', font=Fs, fill=(120, 120, 140))
for Z in range(-30, 1, 2): dr.line([P(WX0, Z), P(WX1, Z)], fill=(215, 215, 225)); dr.text((2, P(0, Z)[1] + 2), f'z {Z}', font=Fs, fill=(120, 120, 140))
dr.rectangle([P(0, -39), P(20, 0)], outline=(60, 60, 60), width=2)    # hall3 shell (z to -39, off the bottom)
G, O, B, R = (0, 150, 70), (235, 120, 0), (30, 90, 200), (200, 30, 60)
def dim(a, b, txt, col=G, off=(6, -18)):
    dr.line([P(*a), P(*b)], fill=col, width=3)
    for p in (a, b): x, y = P(*p); dr.ellipse([x - 4, y - 4, x + 4, y + 4], fill=col)
    m = P((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); dr.text((m[0] + off[0], m[1] + off[1]), txt, font=F, fill=col, stroke_width=3, stroke_fill=(255, 255, 255))
def boxw(x0_, z0_, x1_, z1_, txt, col, off=(4, 4)):
    dr.rectangle([P(x0_, z0_), P(x1_, z1_)], outline=col, width=3); dr.text((P(x0_, z0_)[0] + off[0], P(x0_, z0_)[1] + off[1]), txt, font=F, fill=col, stroke_width=3, stroke_fill=(255, 255, 255))
dim((0.0, -31.0), (19.95, -31.0), 'wall to wall 19.95 m (left wall seen at z −19…−14, right at z −14…0)', G, (-260, 4))
boxw(0.0, -13.0, 6.1, -2.45, 'workshop\n(under mezz)\n6.1 × 10.6 m', B, (8, 160))
boxw(6.1, -10.85, 7.2, -5.25, 'yellow racking\n2 bays × 2.8 m', O, (48, 30))
boxw(18.4, -14.2, 19.5, -0.35, 'orange racking\n5 bays × 2.77 m\nbeams 1.55 / 3.03', O, (-150, 330))
for zz in [-14.2, -11.43, -8.63, -5.9, -3.13, -0.35]: dr.line([P(18.2, zz), P(19.7, zz)], fill=R, width=3)
boxw(15.2, -1.75, 18.4, -0.65, 'orange rack (door wall)', O, (-30, -20))
boxw(13.6, -15.95, 18.5, -14.85, 'yellow rack, 2 bays', O, (4, -20))
boxw(13.2, -0.4, 15.1, 0.25, 'side door', B, (-5, 6))
dim((8.9, 0.0), (12.7, 0.0), 'roller door ≥ 3.8 m (left edge not reached)', R, (-150, 10))
dim((7.2, -6.5), (18.4, -6.5), 'aisle 11.2 m (rack front to rack front)', G, (-120, 6))
dim((13.0, -14.85), (13.0, -1.75), 'yard bay\n13.1 m deep', G, (8, -60))
boxw(6.1, -29.1, 10.0, -27.0, '14 ft crowns (2 high)', B, (4, -20))
boxw(6.4, -15.2, 7.1, -13.1, 'IBCs', B, (8, 0))
dr.text((8, H - 60), 'WW LiDAR scan (Polycam, 15 Oct) in the WW frame: door wall z = 0, left wall x = 0. Floor = beige, darker = taller, hatched = not scanned.\nScan turned 1.80°, floor levelled (fall 4 mm/m to the right). Green = measured distances, orange = racking runs, red ticks = uprights.', font=Fs, fill=(30, 30, 30))
im.save('/home/claude/jos-3d/docs/ww-scan-top.png', optimize=True); print(im.size)
