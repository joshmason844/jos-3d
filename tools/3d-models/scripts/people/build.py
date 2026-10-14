import re
pp = open('/home/claude/off-season-reset/.claude/skills/3d-models/scripts/people.js').read().replace("import * as THREE from 'three';\n", '')
pp = re.sub(r'^export ', '', pp, flags=re.M)
data = open('/tmp/claude-0/-home-claude/509c7276-1a72-5cda-9fd2-ae14680b7a05/scratchpad/ppl/sc/people_meshes.gz.b64').read()
t = open('template.html').read().replace('__PEOPLE__', pp).replace('__DATA__', data)
open('people.html', 'w').write(t); print('page', round(len(t) / 1e6, 2), 'MB')
