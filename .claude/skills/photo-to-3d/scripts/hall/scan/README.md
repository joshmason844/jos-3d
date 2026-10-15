# Lining a LiDAR scan up with the WW (15 Oct 2026)
Scans stay in the private off-season-reset repo; run these on a local copy, never commit scan files or scan-textured images here.
1. `python3 walls.py <scan.glb> <turn deg> faces.npy` – faces turned to the walls, prints the floor level (fit the plane properly, see the scorecard).
2. `python3 hmap.py faces.npy <a> <b> <c> mainH` – height map with a 1 m grid (floor plane y = a·x + b·z + c).
3. `python3 markup.py` – the marked-up top view in the WW frame (edit the measured boxes and lines in it).
4. Elevations: serve this folder plus the glb over http (`python3 -m http.server 8765`), then `NODE_PATH=$(npm root -g) node eshot.js "f=scan.glb&rot=<rad>&fy=<-floor y>" W H '[["name",[eye],[target],[l,r,t,b],[[nx,ny,nz,c]]]]'` (orthographic, 1 cm/px if W = metres × 100).
