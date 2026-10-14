import re
import os as _os
ROOT = next(str(p) for p in __import__('pathlib').Path(__file__).resolve().parents if (p / '.claude' / 'skills').is_dir())   # repo root, wherever it's cloned
pp = open(ROOT + '/.claude/skills/3d-models/scripts/people.js').read().replace("import * as THREE from 'three';\n", '')
pp = re.sub(r'^export ', '', pp, flags=re.M)
data = open(ROOT + '/work/people_meshes.gz.b64').read()
t = open('template.html').read().replace('__PEOPLE__', pp).replace('__DATA__', data)
open('people.html', 'w').write(t); print('page', round(len(t) / 1e6, 2), 'MB')
# stamp the page with a 'code ↗' link to this source on GitHub
__import__('subprocess').run([__import__('sys').executable, ROOT + '/bin/link_code.py', 'people.html', '.claude/skills/3d-models/scripts/people'], check=False)
