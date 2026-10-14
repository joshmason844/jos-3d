"""Put the five detailed sections into the hall shell: python3 combine.py -> hall2.html"""
import re, json
kit = open('kit.js').read()
for f in ['trellis', 'forklift']:
    src = open(f'/home/claude/off-season-reset/.claude/skills/3d-models/scripts/{f}.js').read().replace("import * as THREE from 'three';\n", '')
    kit += '\n' + re.sub(r'^export ', '', src, flags=re.M)
# hall shell: take hall() from the old hall page (portal frames, roof, walls, door)
old = open('../hall.js').read()
shell = old[old.index('// ---------------- the shed ----------------'):old.index('// ---------------- kit ----------------')]
shell = shell.replace("tag(g, 'Main hall'", "g.userData.noPick = true; tag(g, 'Main hall'")
oldM = old[old.index('const M = {'):old.index('// Green Yurts crate covers')].replace('const M = {', 'const MH = {')
shell = shell.replace('M.', 'MH.')
# section placements in hall coordinates (x across, z in from the roller door), each section's own frame rotated about y
PLACE = {1: (1.3, 15.5, 1.5708), 2: (17.2, 26.0, -1.5708), 3: (1.4, 21.0, 1.5708), 4: (9.5, 30.0, 1.5708), 5: (12.45, 12.8, 0)}
secs = ''
for n in range(1, 6):
    src = open(f'sec{n}.js').read().replace('__CAM1__', 'null')
    src = re.sub(r'photo: \{ n: \d+, cam: null \}', 'photo: null', src)
    x, z, r = PLACE[n]
    secs += f"\nconst SEC{n} = (() => {{ {src}\n const G = new THREE.Group(); G.position.set({x}, 0, {z}); G.rotation.y = {r}; scene.add(G); const s = section(G); s.root = G; return s; }})();\n"
extras = open('extras.js').read()
t = open('hall2_template.html').read()
for a, b in [('__KIT__', kit), ('__MH__', oldM), ('__SHELL__', shell), ('__SECS__', secs), ('__EXTRAS__', extras), ('__THUMBS__', open('../thumbs.json').read())]:
    t = t.replace(a, b)
open('hall2.html', 'w').write(t); print('hall2', round(len(t) / 1e6, 2), 'MB')
