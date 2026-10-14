"""Rebuild the Yard page's git-ignored inputs (yard.jpg, bake.json, cam.json, ../khana/kbake.json) from the published page.
The photo and bakes aren't in the public repo (photos stay private), so a fresh clone can't run build.py without them.
usage: save the live page with the Artifact tool (action "read" on the Yard in 3D URL in docs/pages.md), then
       python3 fetch_inputs.py <saved page.html>"""
import sys, re, json, base64, os
import numpy as np
from scipy.optimize import least_squares
h = open(sys.argv[1]).read()
open('yard.jpg', 'wb').write(base64.b64decode(re.search(r'<script id="photo" type="text/plain">([A-Za-z0-9+/=\s]+)</script>', h).group(1)))
i = h.index('const BAKE = ') + 13; obj, n = json.JSONDecoder().raw_decode(h[i:]); open('bake.json', 'w').write(h[i:i + n])
os.makedirs('../khana', exist_ok=True); os.path.exists('../khana/kbake.json') or open('../khana/kbake.json', 'w').write('{}')
c = json.loads(re.search(r'const CAM = (\{.*?\});', h).group(1)); R0 = np.array(c['R'])
def rot(y, p, r):
    cy, sy, cp, sp, cr, sr = np.cos(y), np.sin(y), np.cos(p), np.sin(p), np.cos(r), np.sin(r)
    return np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]]) @ np.array([[1, 0, 0], [0, cp, -sp], [0, sp, cp]]) @ np.array([[cr, -sr, 0], [sr, cr, 0], [0, 0, 1]])
x = least_squares(lambda p: (rot(*p) - R0).ravel(), [0.3, -0.07, 0]).x   # same yaw·pitch·roll order as geo.py
json.dump({'yaw': x[0], 'pitch': x[1], 'roll': x[2], 'cam': c['cam'], 'f': c['f'], 'W': c['W'], 'H': c['H']}, open('cam.json', 'w'), indent=1)
print('yard.jpg, bake.json (%d faces), cam.json written' % len(obj))
