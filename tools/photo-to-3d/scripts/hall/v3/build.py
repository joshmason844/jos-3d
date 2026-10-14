import re
kit = open('kit.js').read()
for f in ['trellis', 'forklift']:
    src = open(f'/home/claude/off-season-reset/.claude/skills/3d-models/scripts/{f}.js').read().replace("import * as THREE from 'three';\n", '')
    kit += '\n' + re.sub(r'^export ', '', src, flags=re.M)
t = open('template.html').read().replace('__KIT__', kit).replace('__HALL3__', open('hall3.js').read())
open('hall3.html', 'w').write(t); print('hall3', round(len(t) / 1e6, 2), 'MB')
