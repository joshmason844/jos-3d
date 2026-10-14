import re, base64, io
from PIL import Image
im = Image.open('../yard/yard.jpg').convert('RGB').crop((0, 600, 560, 1360)); b = io.BytesIO(); im.save(b, 'JPEG', quality=86)
fk = open('/home/claude/off-season-reset/.claude/skills/3d-models/scripts/forklift.js').read().replace("import * as THREE from 'three';\n", '')
fk = re.sub(r'^export ', '', fk, flags=re.M)
t = open('template.html').read().replace('__PHOTO__', base64.b64encode(b.getvalue()).decode()).replace('__FORKLIFT__', fk).replace('__CAM__', open('cam.json').read())
open('forklift.html', 'w').write(t); print('page', len(t) // 1024, 'KB')
