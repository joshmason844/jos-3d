import json, base64, io, re, sys
CREW = 'crew' in sys.argv  # warehouse-with-people variant (never the main Yard in 3D page)
from PIL import Image
from geo import R, C, c
im=Image.open('yard.jpg').convert('RGB'); buf=io.BytesIO(); im.save(buf,'JPEG',quality=84,optimize=True,progressive=True)
kit=open('/home/claude/off-season-reset/.claude/skills/3d-models/scripts/kit.js').read()
kit=kit.replace("import * as THREE from 'three';\n",'')
kit=kit.replace("import { buildForklift } from './forklift.js';\n",'')
fk=open('/home/claude/off-season-reset/.claude/skills/3d-models/scripts/forklift.js').read().replace("import * as THREE from 'three';\n",'')
tr=open('/home/claude/off-season-reset/.claude/skills/3d-models/scripts/trellis.js').read().replace("import * as THREE from 'three';\n",'')
pp=open('/home/claude/off-season-reset/.claude/skills/3d-models/scripts/people.js').read().replace("import * as THREE from 'three';\n",'') if CREW else ''
kit=fk+'\n'+tr+'\n'+pp+'\n'+kit
kit=kit[:kit.index('// --- export helpers')]            # browser-only export helpers aren't needed here
kit=re.sub(r'^export ','',kit,flags=re.M)
cam={'f':c['f'],'W':c['W'],'H':c['H'],'cam':[float(v) for v in C],'R':[[float(v) for v in row] for row in R]}
t=open('template.html').read().replace('__PHOTO__',base64.b64encode(buf.getvalue()).decode()).replace('__KIT__',kit).replace('__CAM__',json.dumps(cam)).replace('__MODEL__',open('model.js').read().replace('__BAKE__',open('bake.json').read()).replace('__KBAKE__',open('../khana/kbake.json').read()))
if CREW:
    t=t.replace('<title>Yard in 3D</title>','<title>Yard with People</title>').replace('forklift(modelSet);\n','forklift(modelSet);\n'+open('crew.js').read()+'\n',1).replace('ray.intersectObjects([modelSet], true)','ray.intersectObjects([modelSet, window.__crewG].filter(Boolean), true)').replace('<h1>Yard · bay 1</h1>','<h1>Yard · with people</h1>').replace('</style>','#cap{display:none!important}</style>',1).replace('<script type="importmap">','<script id="pd" type="text/plain">'+open('/tmp/claude-0/-home-claude/509c7276-1a72-5cda-9fd2-ae14680b7a05/scratchpad/ppl/sc/people_meshes.gz.b64').read()+'</script>\n<script type="importmap">',1)
open('yard-crew.html' if CREW else 'yard-3d.html','w').write(t); print('page', round(len(t)/1e6,2),'MB')
