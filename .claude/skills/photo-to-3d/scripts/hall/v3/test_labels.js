// Headless test of the close-up labels (24 Oct): with 'labels' off, a close-up shows the labels of what's near (at most 4),
// guessed items carry the orange NOT SURE chip, no two visible labels overlap; the walk-in view shows none; on a phone the title blurb folds away.
// usage: NODE_PATH=$(npm root -g) node test_labels.js hall3.html
const { chromium } = require('playwright'), path = require('path'), os = require('os');
const C = os.homedir() + '/.cache/jos3d/';
const page = process.argv[2] || 'hall3.html';
const CAMS = { wsvice: [[1.75, 1.55, -3.0], [.85, 1.0, -3.5]], wspeg: [[3.45, 1.62, -11.75], [3.35, 1.5, -12.9]], wssaw: [[3.75, 1.6, -7.45], [3.2, 1.15, -6.7]] };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const res = [], errs = []; let all = true;
  const vis = p => p.$$eval('#labels .lb', ls => ls.filter(l => l.style.display !== 'none' && l.offsetParent !== null).map(l => { const r = l.getBoundingClientRect(); return { t: l.textContent, ns: l.classList.contains('ns'), r: [r.left, r.top, r.right, r.bottom] }; }));
  const overlaps = ls => ls.some((a, i) => ls.some((q, j) => j > i && a.r[0] < q.r[2] && a.r[2] > q.r[0] && a.r[1] < q.r[3] && a.r[3] > q.r[1]));
  for (const [n, W, H] of [['phone', 390, 844], ['desk', 1200, 800]]) {
    const p = await b.newPage({ viewport: { width: W, height: H } });
    p.on('pageerror', e => errs.push(n + ': ' + e.message));
    await p.route(/cdn\.jsdelivr\.net/, r => { const m = r.request().url().match(/three@[^/]+\/(.*)$/); return m ? r.fulfill({ path: C + 'three-r180/' + m[1], contentType: 'text/javascript' }) : r.abort(); });
    await p.route(/fonts\./, r => r.abort());
    await p.goto('file://' + path.resolve(page), { waitUntil: 'commit' }); await p.waitForFunction(() => window.__ready, null, { timeout: 300000 });
    await p.waitForTimeout(1500); const d0 = await vis(p); const blurb0 = await p.$eval('.top .tag p', e => e.offsetParent !== null);
    let line = `${n}: walk-in labels ${d0.length}`; let ok = d0.length === 0 && blurb0;
    for (const [k, c] of Object.entries(CAMS)) { await p.evaluate(a => window.__cam(...a), c); await p.waitForTimeout(1500); const ls = await vis(p);
      const good = ls.length >= 1 && ls.length <= 4 && ls.some(l => l.ns) && !overlaps(ls); ok = ok && good;
      line += ` · ${k} ${ls.length} [${ls.map(l => l.t).join(' | ')}]${good ? '' : ' BAD'}`; }
    const blurb1 = await p.$eval('.top .tag p', e => e.offsetParent !== null); ok = ok && (n === 'phone' ? !blurb1 : blurb1);
    line += ` · blurb ${blurb0 ? 'shown' : 'hidden'} → ${blurb1 ? 'shown' : 'hidden'}`;
    await p.evaluate(() => { window.__labels(); window.__view('door'); }); await p.waitForTimeout(2500); const dl = await vis(p); ok = ok && dl.length > 0 && !overlaps(dl);
    line += ` · labels on at walk-in ${dl.length}, overlap ${overlaps(dl)}`;
    res.push((ok ? 'PASS ' : 'FAIL ') + line); all = all && ok; await p.close();
  }
  res.push('page errors: ' + JSON.stringify(errs)); if (errs.length) all = false;
  console.log(res.join('\n')); console.log(all ? 'RESULT PASS' : 'RESULT FAIL'); await b.close();
})();
