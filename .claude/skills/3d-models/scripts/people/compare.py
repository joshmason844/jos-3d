"""Before/after sheet: python3 compare.py <before-prefix> <after-prefix> out.png
Pairs every <before>-<shot>.png with <after>-<shot>.png, before on top."""
import glob, os, sys
from PIL import Image, ImageDraw
b, a, out = sys.argv[1:4]
names = sorted(os.path.basename(p)[len(os.path.basename(a)) + 1:-4] for p in glob.glob(a + '-*.png'))
names = [n for n in names if os.path.exists(f'{b}-{n}.png')]
W = 300; sheet = Image.new('RGB', (W * len(names), 2 * W + 24), (10, 14, 30)); d = ImageDraw.Draw(sheet)
for i, n in enumerate(names):
    sheet.paste(Image.open(f'{b}-{n}.png').resize((W, W)), (i * W, 24)); sheet.paste(Image.open(f'{a}-{n}.png').resize((W, W)), (i * W, 24 + W))
    d.text((i * W + 6, 6), n, fill=(220, 220, 220))
sheet.save(out); print('sheet', out, len(names), 'shots')
