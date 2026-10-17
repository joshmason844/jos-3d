// Bounding boxes of every tagged item on the built WW page, to check the model against the LiDAR heightmap.
// usage: NODE_PATH=$(npm root -g) node bin/ww_boxes.js hall3.html [x0 x1 z0 z1]   -> name, x/y/z min, x/y/z max (m)
// Loads at phone size with no shots (~30 s under SwiftShader). Needs window.__boxes (template.html, 17 Oct).
const { chromium } = require('playwright'); const path = require('path');
const C = process.env.HOME + '/.cache/jos3d/'; const [page, ...f] = process.argv.slice(2); const [x0, x1, z0, z1] = f.map(Number);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 600, height: 400 } });
  await p.route(/cdn\.jsdelivr\.net/, r => { const m = r.request().url().match(/three@[^/]+\/(.*)$/); return m ? r.fulfill({ path: C + 'three-r180/' + m[1], contentType: 'text/javascript' }) : r.abort(); });
  await p.route(/fonts\./, r => r.abort());
  await p.goto('file://' + path.resolve(page), { waitUntil: 'commit' }); await p.waitForFunction(() => window.__ready, null, { timeout: 300000 });
  const B = await p.evaluate(() => window.__boxes());
  for (const [n, ax, ay, az, bx, by, bz] of B) if (f.length < 4 || (bx > x0 && ax < x1 && bz > z0 && az < z1))
    console.log(`${n.padEnd(40)} x ${ax.toFixed(2)}…${bx.toFixed(2)}  z ${az.toFixed(2)}…${bz.toFixed(2)}  top ${by.toFixed(2)}`);
  await b.close();
})();
