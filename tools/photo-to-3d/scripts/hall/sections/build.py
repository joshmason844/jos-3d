import sys, re, json
# python3 build.py sec1 "Title" "H1" "blurb"
key, title, h1, blurb = sys.argv[1:5]
import base64, io, os
from PIL import Image
n = int(re.search(r"photo: \{ n: (\d+)", open(key + '.js').read()).group(1)) if 'photo:' in open(key + '.js').read() else None
photo, cam = '', 'null'
if n:
    im = Image.open(f'../ph/{n:02d}.jpg').convert('RGB'); b = io.BytesIO(); im.save(b, 'JPEG', quality=82); photo = base64.b64encode(b.getvalue()).decode()
    cam = open(f'../s{key[3:]}/cam.json').read()
t = open('template.html').read()
kit = open('kit.js').read()
if '// needs: trellis' in open(key + '.js').read():
    tr = open('/home/claude/off-season-reset/.claude/skills/3d-models/scripts/trellis.js').read().replace("import * as THREE from 'three';\n", '')
    kit += '\n' + re.sub(r'^export ', '', tr, flags=re.M)
if '// needs: forklift' in open(key + '.js').read():
    fk = open('/home/claude/off-season-reset/.claude/skills/3d-models/scripts/forklift.js').read().replace("import * as THREE from 'three';\n", '')
    kit += '\n' + re.sub(r'^export ', '', fk, flags=re.M)
for a, b in [('__TITLE__', title), ('__H1__', h1), ('__BLURB__', blurb), ('__KIT__', kit), ('__SECTION__', open(key + '.js').read()), ('__THUMBS__', open('../thumbs.json').read()), ('__PHOTO__', photo), ('__CAM1__', cam)]:
    t = t.replace(a, b)
open(key + '.html', 'w').write(t); print(key, round(len(t) / 1e6, 2), 'MB')
