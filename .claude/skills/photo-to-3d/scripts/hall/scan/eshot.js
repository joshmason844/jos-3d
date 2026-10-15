const { chromium } = require('playwright'); const C = process.env.HOME + '/.cache/jos3d/';
const [q, W, H, views] = [process.argv[2], +process.argv[3], +process.argv[4], JSON.parse(process.argv[5])];
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: W, height: H } }); p.on('pageerror', e => console.log('ERR', e.message));
  await p.route(/cdn\.jsdelivr\.net/, r => { const m = r.request().url().match(/three@[^/]+\/(.*)$/); return r.fulfill({ path: C + 'three-r180/' + m[1], contentType: 'text/javascript' }); });
  await p.goto('http://localhost:8765/e.html?' + q); await p.waitForFunction(() => window.__ready, null, { timeout: 300000 });
  for (const [name, ...a] of views) { await p.evaluate(a => window.__set(...a), a); await p.screenshot({ path: name + '.png', timeout: 300000 }); }
  await b.close(); })();
