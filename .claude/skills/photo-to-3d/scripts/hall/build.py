import re, json
import os as _os
ROOT = next(str(p) for p in __import__('pathlib').Path(__file__).resolve().parents if (p / '.claude' / 'skills').is_dir())   # repo root, wherever it's cloned
fk = open(ROOT + '/.claude/skills/3d-models/scripts/forklift.js').read().replace("import * as THREE from 'three';\n", '')
fk = re.sub(r'^export ', '', fk, flags=re.M)
t = open('template.html').read().replace('__FORKLIFT__', fk).replace('__HALL__', open('hall.js').read()).replace('__THUMBS__', open('thumbs.json').read())
open('hall.html', 'w').write(t); print('page', round(len(t) / 1e6, 2), 'MB')
# stamp the page with a 'code ↗' link to this source on GitHub
__import__('subprocess').run([__import__('sys').executable, ROOT + '/bin/link_code.py', 'hall.html', '.claude/skills/photo-to-3d/scripts/hall'], check=False)
