import re, json
fk = open('/home/claude/off-season-reset/.claude/skills/3d-models/scripts/forklift.js').read().replace("import * as THREE from 'three';\n", '')
fk = re.sub(r'^export ', '', fk, flags=re.M)
t = open('template.html').read().replace('__FORKLIFT__', fk).replace('__HALL__', open('hall.js').read()).replace('__THUMBS__', open('thumbs.json').read())
open('hall.html', 'w').write(t); print('page', round(len(t) / 1e6, 2), 'MB')
