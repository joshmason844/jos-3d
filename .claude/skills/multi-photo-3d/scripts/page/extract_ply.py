#!/usr/bin/env python3
"""Pull the embedded point cloud back out of a published multi-photo page (after an Artifact read).
usage: python3 extract_ply.py <page.html> <out.ply>"""
import base64, re, sys
t = open(sys.argv[1], encoding='utf-8').read()
m = re.search(r'<script id="model"[^>]*>(.*?)</script>', t, re.S)
if not m: sys.exit('no embedded model in that page')
d = base64.b64decode(m.group(1).strip()); open(sys.argv[2], 'wb').write(d)
print(sys.argv[2], f'{len(d) / 1e6:.1f} MB')
