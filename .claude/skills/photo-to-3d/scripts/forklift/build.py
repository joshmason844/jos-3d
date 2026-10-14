import re, base64, io
from PIL import Image
import os as _os
ROOT = next(str(p) for p in __import__('pathlib').Path(__file__).resolve().parents if (p / '.claude' / 'skills').is_dir())   # repo root, wherever it's cloned
im = Image.open('../yard/yard.jpg').convert('RGB').crop((0, 600, 560, 1360)); b = io.BytesIO(); im.save(b, 'JPEG', quality=86)
fk = open(ROOT + '/.claude/skills/3d-models/scripts/forklift.js').read().replace("import * as THREE from 'three';\n", '')
fk = re.sub(r'^export ', '', fk, flags=re.M)
t = open('template.html').read().replace('__PHOTO__', base64.b64encode(b.getvalue()).decode()).replace('__FORKLIFT__', fk).replace('__CAM__', open('cam.json').read())
open('forklift.html', 'w').write(t); print('page', len(t) // 1024, 'KB')
# stamp the page with a 'code ↗' link to this source on GitHub
__import__('subprocess').run([__import__('sys').executable, ROOT + '/bin/link_code.py', 'forklift.html', '.claude/skills/photo-to-3d/scripts/forklift'], check=False)
