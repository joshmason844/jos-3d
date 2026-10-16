// Headless shots of the WW page (hall3.html): phone 390×844 + desktop 1200×800, same cameras every time.
// usage: NODE_PATH=$(npm root -g) node shoot.js hall3.html <out prefix> [views] [phone|desk]
//   views: comma list of names below (default: door,up,roofclose,far). Writes <prefix>-<size>-<view>.png and <prefix>-console.txt
// One browser, one page load per size, all views shot from it (a load is the slow part, ~30 s under SwiftShader).
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const C = process.env.HOME + '/.cache/jos3d/';
const [page, pre, only, sizeOnly] = [process.argv[2], process.argv[3] || 'shot', process.argv[4], process.argv[5]];
const sizes = [['phone', 390, 844], ['desk', 1200, 800]].filter(s => !sizeOnly || s[0] === sizeOnly);
const VIEWS = { // [[cam], [target], roof visible]. Keep the target BELOW the camera: OrbitControls' maxPolarAngle (.495π) lifts a camera that looks up to the target's height
  door: 'door',                                              // the page's own walk-in view
  far: 'far',
  top: 'top',
  up: [[10, 2.6, -6], [10, 2.5, -30], true],                 // mid-aisle, eye a bit high, looking down the hall: roof fills the top half
  roofclose: [[11, 5.4, -14], [17, 5.3, -21], true],         // up close under the right-hand slope: sheets, purlins, a roof light, a high-bay
  floorclose: [[11, 1.4, -6], [13, 0, -10], true],
};
const want = only ? only.split(',') : ['door', 'up', 'roofclose', 'far'];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = [], log = [];
  for (const [n, W, H] of sizes) {
    const p = await b.newPage({ viewport: { width: W, height: H } });
    p.on('pageerror', e => errs.push(n + ': ' + e.message));
    p.on('console', m => { log.push(n + ' ' + m.type() + ': ' + m.text()); if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errs.push(n + ': ' + m.text()); });
    await p.route(/cdn\.jsdelivr\.net/, r => { const m = r.request().url().match(/three@[^/]+\/(.*)$/); return m ? r.fulfill({ path: C + 'three-r180/' + m[1], contentType: 'text/javascript' }) : r.abort(); });
    await p.route(/fonts\./, r => r.abort());
    const t0 = Date.now();
    const died = new Promise((_, no) => p.on('pageerror', e => no(new Error(n + ' page error before ready: ' + e.message))));   // fail fast instead of a 300 s timeout
    await p.goto('file://' + path.resolve(page)); await Promise.race([p.waitForFunction(() => window.__ready, null, { timeout: 300000 }), died]);
    log.push(`${n}: ready in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    for (const v of want) {
      const V = VIEWS[v];
      if (typeof V === 'string') { await p.evaluate(k => window.__view(k), V); await p.waitForTimeout(1800); }
      else await p.evaluate(a => window.__cam(...a), V);
      await p.waitForTimeout(700);
      await p.screenshot({ path: `${pre}-${n}-${v}.png`, timeout: 300000 });
    }
    await p.close();
  }
  log.push('page errors: ' + JSON.stringify(errs));
  fs.writeFileSync(pre + '-console.txt', log.join('\n') + '\n');
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
