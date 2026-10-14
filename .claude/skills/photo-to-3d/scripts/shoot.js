// Headless shots of the Yard in 3D page: phone 390×844 + desktop 1200×800.
// usage: NODE_PATH=$(npm root -g) node shoot.js <page.html> <out prefix> [views]   views: photo,orbit,model,close (default all)
const { chromium } = require('playwright'); const path = require('path');
const C = process.env.HOME + '/.cache/jos3d/';
const [page, pre, only] = [process.argv[2], process.argv[3] || 'shot', process.argv[4]];
const sizes = [['phone', 390, 844], ['desk', 1200, 800]];
const VIEWS = { // [mode, tent, pose [[cam],[target]] or null]
  photo: ['photo', false, null],
  orbit: ['photo', false, [[1.5, 2.6, 13.5], [2.2, 1.6, 2.0]]],
  model: ['model', false, null],
  close: ['model', false, [[3.6, 1.7, 4.6], [2.4, 1.2, 1.0]]],
};
const want = only ? only.split(',') : Object.keys(VIEWS);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = [];
  for (const [n, W, H] of sizes) {
    const p = await b.newPage({ viewport: { width: W, height: H } });
    p.on('pageerror', e => errs.push(n + ': ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errs.push(n + ': ' + m.text()); });
    await p.route(/cdn\.jsdelivr\.net/, r => { const m = r.request().url().match(/three@[^/]+\/(.*)$/); return m ? r.fulfill({ path: C + 'three-r180/' + m[1], contentType: 'text/javascript' }) : r.abort(); });
    await p.route(/fonts\./, r => r.abort());
    await p.goto('file://' + path.resolve(page)); await p.waitForFunction(() => window.__ready, null, { timeout: 300000 });
    for (const v of want) {
      await p.evaluate(a => window.__set(...a), VIEWS[v]); await p.waitForTimeout(2500);
      await p.screenshot({ path: `${pre}-${n}-${v}.png`, timeout: 300000 });
    }
    await p.close();
  }
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
