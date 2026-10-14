import re, base64, io
from PIL import Image
im = Image.open('../khana/front.jpg').convert('RGB').crop((60, 470, 1940, 1330)); b = io.BytesIO(); im.save(b, 'JPEG', quality=84)
tr = open('/home/claude/off-season-reset/.claude/skills/3d-models/scripts/trellis.js').read().replace("import * as THREE from 'three';\n", '')
tr = re.sub(r'^export ', '', tr, flags=re.M)
t = open('template.html').read().replace('__PHOTO__', base64.b64encode(b.getvalue()).decode()).replace('__TRELLIS__', tr).replace('__CAM__', open('cam.json').read())
open('trellis.html', 'w').write(t); print('page', len(t) // 1024, 'KB')
