// Load a built WW page once (headless, SwiftShader, local three r180) and evaluate expressions in it; with --shot, screenshot after each (P0.png, P1.png...).
// usage: NODE_PATH=$(npm root -g) node bin/ww_probe.js page.html [--shot] "expr" ["expr" ...]   e.g. "window.__topShadow" (bench-top shadow sheets: [x0,z0,x1,z1,y,hits])
// 27 Oct 23:xx: one load answers a "why is X invisible?" question in ~4 min instead of a build + full shoot per guess.
const { chromium } = require('playwright'); const path = require('path'); const C = process.env.HOME + '/.cache/jos3d/';
const args = process.argv.slice(3), shot = args[0] === '--shot', exprs = shot ? args.slice(1) : args;
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route(/cdn\.jsdelivr\.net/, r => { const m = r.request().url().match(/three@[^/]+\/(.*)$/); return m ? r.fulfill({ path: C + 'three-r180/' + m[1], contentType: 'text/javascript' }) : r.abort(); });
  await p.route(/fonts\./, r => r.abort());
  await p.goto('file://' + path.resolve(process.argv[2]), { waitUntil: 'commit' }); await p.waitForFunction(() => window.__ready, null, { timeout: 300000 });
  for (const [i, ex] of exprs.entries()) { console.log(JSON.stringify(await p.evaluate(ex))); if (shot) { await p.waitForTimeout(1500); await p.screenshot({ path: 'P' + i + '.png', timeout: 900000 }); } }
  console.log('page errors', JSON.stringify(errs)); await b.close(); })();
