// Headless test of the folding area list (24 Oct): phone starts folded to one 'areas' button, opens on tap,
// folds again when an area is picked (and names it); desktop starts open and folds when an area is picked.
// usage: NODE_PATH=$(npm root -g) node test_areas.js hall3.html
const { chromium } = require('playwright'), path = require('path'), os = require('os');
const C = os.homedir() + '/.cache/jos3d/';
const page = process.argv[2] || 'hall3.html';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const res = [], errs = [];
  const shown = p => p.$$eval('#secs button', bs => bs.filter(x => x.offsetParent !== null).map(x => x.textContent));
  for (const [n, W, H] of [['phone', 390, 844], ['desk', 1200, 800]]) {
    const p = await b.newPage({ viewport: { width: W, height: H } });
    p.on('pageerror', e => errs.push(n + ': ' + e.message));
    await p.route(/cdn\.jsdelivr\.net/, r => { const m = r.request().url().match(/three@[^/]+\/(.*)$/); return m ? r.fulfill({ path: C + 'three-r180/' + m[1], contentType: 'text/javascript' }) : r.abort(); });
    await p.route(/fonts\./, r => r.abort());
    await p.goto('file://' + path.resolve(page), { waitUntil: 'commit' }); await p.waitForFunction(() => window.__ready, null, { timeout: 300000 });
    const s0 = await shown(p);
    if (n === 'phone') { await p.click('#secs .areas'); }
    const s1 = await shown(p);
    await p.click('#secs .zb >> nth=7');   // Workshop (inside)
    const s2 = await shown(p);
    await p.click('#vDoor');
    const s3 = await shown(p);
    const ok = n === 'phone'
      ? s0.length === 1 && s1.length === 9 && s2.length === 1 && /Workshop/.test(s2[0]) && s3.length === 1
      : s0.length === 9 && s2.length === 1 && /Workshop/.test(s2[0]) && s3.length === 9;
    res.push(`${n}: ${ok ? 'PASS' : 'FAIL'} start ${s0.length} · after tap ${s1.length} · in an area ${s2.length} "${s2[0]}" · back to walk in ${s3.length}`);
    await p.close();
  }
  res.push('page errors: ' + JSON.stringify(errs));
  console.log(res.join('\n')); await b.close();
})();
