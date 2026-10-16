import re
import os as _os
ROOT = next(str(p) for p in __import__('pathlib').Path(__file__).resolve().parents if (p / '.claude' / 'skills').is_dir())   # repo root, wherever it's cloned
kit = open('kit.js').read()
for f in ['trellis', 'forklift']:
    src = open(ROOT + f'/.claude/skills/3d-models/scripts/{f}.js').read().replace("import * as THREE from 'three';\n", '')
    kit += '\n' + re.sub(r'^export ', '', src, flags=re.M)
t = open('template.html').read().replace('__KIT__', kit).replace('__HALL3__', open('hall3.js').read())
t = t.replace('new THREE.CanvasTexture(', 'new CT(').replace('return new CT(c, ...a)', 'return new THREE.CanvasTexture(c, ...a)')   # every canvas texture goes through CT (phone budget, see template)
open('hall3.html', 'w').write(t); print('hall3', round(len(t) / 1e6, 2), 'MB')
# stamp the page with a 'code ↗' link to this source on GitHub
__import__('subprocess').run([__import__('sys').executable, ROOT + '/bin/link_code.py', 'hall3.html', '.claude/skills/photo-to-3d/scripts/hall/v3'], check=False)
