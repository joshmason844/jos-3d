// Headless test of the yard's tap cards in the WW (2 Nov, Y3a): every yard card name below opens its card (name, NOT SURE),
// the card's object sits in the yard bay (x > 13), and a close-up of the door-end bay shows its labels without overlaps.
// usage: NODE_PATH=$(npm root -g) node test_yardcards.js hall3.html
const { chromium } = require('playwright'), path = require('path'), os = require('os');
const C = os.homedir() + '/.cache/jos3d/';
const page = process.argv[2] || 'hall3.html';
const NAMES = ['Jerry cans', 'Jerry can', 'Storage boxes', 'Cardboard boxes', 'Sack truck', 'Loose cable', 'Ply crate (yard bay floor)', 'Steel kegs', 'Tent cartons and leaning panels', 'Folded canvas (yard bay floor)'];
const CAM = [[15.6, 1.45, -0.4], [18.3, .45, -1.5]];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const res = [], errs = []; let all = true;
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on('pageerror', e => errs.push(e.message));
  await p.route(/cdn\.jsdelivr\.net/, r => { const m = r.request().url().match(/three@[^/]+\/(.*)$/); return m ? r.fulfill({ path: C + 'three-r180/' + m[1], contentType: 'text/javascript' }) : r.abort(); });
  await p.route(/fonts\./, r => r.abort());
  await p.goto('file://' + path.resolve(page), { waitUntil: 'commit' }); await p.waitForFunction(() => window.__ready, null, { timeout: 300000 });
  const counts = await p.evaluate(() => { const c = {}; for (const d of document.querySelectorAll('#labels .lb')) c[d.textContent] = (c[d.textContent] || 0) + 1; return c; });
  for (const n of NAMES) {
    const r = await p.evaluate(n => { const els = [...document.querySelectorAll('#labels .lb')].filter(d => d.textContent === n); if (!els.length) return null; els[0].click();
      const card = document.getElementById('card'); return { shown: !card.hidden, text: document.getElementById('cName').textContent + ' | ' + document.getElementById('cMeta').textContent + ' | ' + document.getElementById('cWhat').textContent.slice(0, 90) }; }, n);
    const ok = !!r && r.shown && r.text.startsWith(n) ; all = all && ok;
    res.push(`${ok ? 'PASS' : 'FAIL'} ${n} ×${counts[n] || 0}: ${r ? r.text : 'no label'}`);
  }
  await p.evaluate(() => window.__pick('\u0000none')); await p.evaluate(a => window.__cam(...a), CAM); await p.waitForTimeout(1500);
  const ls = await p.$$eval('#labels .lb', ls => ls.filter(l => l.style.display !== 'none' && l.offsetParent !== null).map(l => { const r = l.getBoundingClientRect(); return { t: l.textContent, r: [r.left, r.top, r.right, r.bottom] }; }));
  const ov = ls.some((a, i) => ls.some((q, j) => j > i && a.r[0] < q.r[2] && a.r[2] > q.r[0] && a.r[1] < q.r[3] && a.r[3] > q.r[1]));
  res.push(`${ov ? 'FAIL' : 'PASS'} door-end bay close-up labels ${ls.length} [${ls.map(l => l.t).join(' | ')}], overlap ${ov}`); all = all && !ov;
  res.push('page errors: ' + JSON.stringify(errs)); if (errs.length) all = false;
  console.log(res.join('\n')); console.log(all ? 'RESULT PASS' : 'RESULT FAIL'); await b.close();
})();
