// Headless shots of the multi-photo page: phone 390×844 + desktop 1200×800, home view and a close-up.
// usage: NODE_PATH=$(npm root -g) node shoot.js <page.html> <out prefix>
const { chromium } = require('playwright'); const path = require('path');
const C = process.env.HOME + '/.cache/jos3d/';
const [page, pre] = [process.argv[2], process.argv[3] || 'shot'];
const views = [['phone', 390, 844], ['desk', 1200, 800]];
// close-up: stop spin, move halfway to the target from the home view
const CLOSE = `(()=>{const c=window.__cam,t=window.__ctl;t.autoRotate=false;c.position.lerp(t.target,0.55);t.update();})()`;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = [];
  for (const [n, W, H] of views) {
    const p = await b.newPage({ viewport: { width: W, height: H } });
    p.on('pageerror', e => errs.push(n + ': ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errs.push(n + ': ' + m.text()); });
    await p.route(/cdn\.jsdelivr\.net/, r => { const m = r.request().url().match(/three@[^/]+\/(.*)$/); return m ? r.fulfill({ path: C + 'three-r180/' + m[1], contentType: 'text/javascript' }) : r.abort(); });
    await p.route(/fonts\./, r => r.abort());
    await p.goto('file://' + path.resolve(page)); await p.waitForFunction(() => window.__ready, null, { timeout: 300000 });
    await p.evaluate(() => { window.__ctl.autoRotate = false; }); await p.waitForTimeout(1500);
    await p.screenshot({ path: `${pre}-${n}-home.png`, timeout: 300000 });
    await p.evaluate(CLOSE); await p.waitForTimeout(1500);
    await p.screenshot({ path: `${pre}-${n}-close.png`, timeout: 300000 });
    await p.close();
  }
  console.log('errors', errs); await b.close();
})();
