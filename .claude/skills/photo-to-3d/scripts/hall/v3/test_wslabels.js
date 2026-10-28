// Headless test (28 Oct 05:xx): the workshop's walls hide labels. From inside the workshop no label of an item outside it shows
// (except through the front window or the far-wall doorway); from the aisle outside no label of an item inside shows; labels in the
// same room still show. Phone size, labels both off (close-up mode) and on.
// usage: NODE_PATH=$(npm root -g) node test_wslabels.js hall3.html
const { chromium } = require('playwright'), path = require('path'), os = require('os');
const C = os.homedir() + '/.cache/jos3d/';
const page = process.argv[2] || 'hall3.html';
// [cam, target, camera inside the workshop?, labels on?, through a hole?]. The three bench close-ups are where the outside "Black flight case" label used to show (28 Oct 04:xx find): there at least one label must be hidden by the walls.
const CAMS = { wscase: [[4.92, 1.2, -7.72], [5.6, .99, -8.12], true, false], wstop: [[5.05, 1.75, -8.05], [5.62, .95, -8.1], true, false],
  wspost: [[4.95, 1.4, -7.05], [5.85, .93, -7.62], true, false], wsin: [[3.4, 2.05, -12.2], [3.1, 1.25, -5.2], true, true],
  yellowclose: [[9.4, 2.4, -6.2], [7.2, 1.6, -8.0], false, true], aisle: [[10, 1.7, -9], [4, 1.2, -9], false, true],
  doorway: [[5.4, 1.5, -15.5], [5.4, 1.0, -10], false, true, true] };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = []; let all = true; const out = [];
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on('pageerror', e => errs.push(e.message));
  await p.route(/cdn\.jsdelivr\.net/, r => { const m = r.request().url().match(/three@[^/]+\/(.*)$/); return m ? r.fulfill({ path: C + 'three-r180/' + m[1], contentType: 'text/javascript' }) : r.abort(); });
  await p.route(/fonts\./, r => r.abort());
  await p.goto('file://' + path.resolve(page), { waitUntil: 'commit' }); await p.waitForFunction(() => window.__ready, null, { timeout: 300000 });
  const side = await p.evaluate(() => window.__wsSide());
  const n = Object.values(side); out.push(`labels: ${n.filter(x => x === true).length} inside the workshop, ${n.filter(x => x === false).length} outside, ${n.filter(x => x === null).length} on a wall`);
  const vis = () => p.$$eval('#labels .lb', ls => ls.filter(l => l.style.display !== 'none' && l.offsetParent !== null).map(l => l.textContent));
  let on = false;
  for (const [k, [cam, tgt, inside, labelsOn, hole]] of Object.entries(CAMS)) {
    if (labelsOn !== on) { await p.evaluate(() => window.__labels()); on = labelsOn; }
    await p.evaluate(a => window.__cam(...a), [cam, tgt]); await p.waitForTimeout(1200);
    const ls = await vis(), hid = await p.evaluate(() => window.__wsHidden());
    const wrong = ls.filter(t => side[t] === !inside);   // a label from the other side of the wall
    const same = ls.filter(t => side[t] === inside);
    const ok = hole ? same.length + wrong.length >= 1 : wrong.length === 0 && (k.startsWith('ws') && !labelsOn ? hid >= 1 : same.length + ls.length >= 1);
    all = all && ok; out.push(`${ok ? 'PASS' : 'FAIL'} ${k} (${inside ? 'inside' : 'outside'}, labels ${labelsOn ? 'on' : 'off'}): ${ls.length} shown, ${hid} hidden by the walls, other-side shown [${wrong.join(' | ')}] · shown [${ls.join(' | ')}]`);
  }
  out.push('page errors: ' + JSON.stringify(errs)); if (errs.length) all = false;
  console.log(out.join('\n')); console.log(all ? 'RESULT PASS' : 'RESULT FAIL'); await b.close();
})();
