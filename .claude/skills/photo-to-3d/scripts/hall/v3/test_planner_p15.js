// P15 (11 Nov 07:xx): P14 plus the side letters: the red box must say WHICH side got how far ('racking (R 9°, L 12°)' or 'R: racking 9° · L: workshop 60°'), each letter matching the tag's side.
// usage: NODE_PATH=$(npm root -g) node test_planner_p15.js hall3.html <out prefix> [phone|desk]
// P14 (11 Nov 06:xx): P13 plus the red box: when neither side makes 90° the box must name what stops each side and how far it got, in the
// tags' own word, worked out here from fk() ('racking 3°/5°'); folded on a phone it must stay one line. (Open, as on desk, the two 'hits …' lines above already name it, so only the folded box is checked.) Desk run prints 'no cap on desk'.
// usage: NODE_PATH=$(npm root -g) node test_planner_p14.js hall3.html <out prefix> [phone|desk]
// P13 (11 Nov 05:xx): P12 plus the tags' words: a side that only makes 90° one way says so ('right ✓ rev' / '✓ fwd'), a blocked side names
// what stops it in one short word that comes from the panel's own 'hits …' name ('left ✗ racking'), and the folded phone line says the same.
// P12 (11 Nov 04:xx): P11 plus the hit mark: every side that can't make 90° must show a red ✕ on screen at the spot its swing first touches,
// that spot must lie on (within 0.2 m of) the footprint of the very thing the panel says it hits, and the swept tint must be cut out under the
// truck's own starting footprint (alpha 0 at its middle); a side that makes it shows no ✕ and keeps its tint.
// usage: NODE_PATH=$(npm root -g) node test_planner_p12.js hall3.html <out prefix> [phone|desk]
// P11 (11 Nov 03:xx): P10 plus the fan-out: when a tag had to move off its end spot it must carry a leader that starts on that end spot and
// ends on the tag's edge; a tag more than 140 px away is allowed only with a leader; and when the two tags both had to move (blocked both ways
// against the racking) they must sit on opposite sides of the truck's outline, not stacked one under the other.
// usage: NODE_PATH=$(npm root -g) node test_planner_p11.js hall3.html <out prefix> [phone|desk]
// P10 (11 Nov 02:xx): P9 plus the R / L tags on the two sweeps: each picked-forklift view must show two tags whose words and ✓/✗ match the
// panel's sides, none on the truck's outline, on each other or on a gap label, each within 140 px of its own end spot (it only slides if boxed in).
// usage: NODE_PATH=$(npm root -g) node test_planner_p10.js hall3.html <out prefix> [phone|desk]
// P9 (11 Nov 01:xx): the forklift's 90° turn. test_planner_p3.js's walk (pick it at home by a real tap/click, shove it into the racking by real
// touch/mouse) plus: both sides get a swept area drawn; at home it can get out (at least one side turns 90°, no red box); against the racking the
// panel names what it hits and at what angle; dragged into open floor both sides turn. Every side reported clear is checked independently:
// the truck is really swung 90° about that centre (window.__plan.fkEnd) and its end box must hit no wall and no kit; every side reported blocked
// must have both ways' end spot or path hit something (a blocked end spot is proof; a clear end spot with a blocked path is logged).
// usage: NODE_PATH=$(npm root -g) node test_planner_p9.js hall3.html <out prefix> [phone|desk]
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const C = process.env.HOME + '/.cache/jos3d/'; const [page, pre, only] = [process.argv[2], process.argv[3] || 'p15', process.argv[4]];
const TMO = +process.env.SHOT_TIMEOUT || 300000;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = [], log = [], res = {}; let fail = 0; const ok = (c, m) => { log.push((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
  for (const [n, W, H, touch] of [['phone', 390, 844, true], ['desk', 1200, 800, false]].filter(s => !only || s[0] === only)) {
    const ctx = await b.newContext({ viewport: { width: W, height: H }, hasTouch: touch, isMobile: touch }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(n + ': ' + e.message)); const fontFail = []; p.on('requestfailed', r => { if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) fontFail.push(r.url()); });
    p.on('console', m => { if (m.type() === 'error' && !(fontFail.length && /ERR_TUNNEL_CONNECTION_FAILED/.test(m.text()))) errs.push(n + ': ' + m.text()); });   // the egress proxy refuses Google Fonts here (11 Nov): not the page's fault, logged as INFO
    await p.route(/cdn\.jsdelivr\.net/, r => { const m = r.request().url().match(/three@[^/]+\/(.*)$/); return m ? r.fulfill({ path: C + 'three-r180/' + m[1], contentType: 'text/javascript' }) : r.abort(); });
    await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ body: '', contentType: 'text/css' }));   // the egress proxy refuses Google Fonts: a refused tunnel shows up as a console error (11 Nov); the page falls back to its own font stack
    await p.goto('file://' + path.resolve(page), { waitUntil: 'commit' }); await p.waitForFunction(() => window.__ready, null, { timeout: 300000 });
    await p.evaluate(() => { window.__hq(false); window.__loop(false); try { localStorage.clear(); } catch (e) { } });
    const tapAt = async (x, y) => { if (touch) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); await p.waitForTimeout(300); };
    const tapSel = async s => { const r = await p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; }, s); if (r) await tapAt(...r); return !!r; };
    await tapSel('#plan-b'); res[n] = {};
    const has = await p.evaluate(() => typeof window.__plan.fkEnd === 'function');
    const close = async () => { const f = await p.evaluate(() => window.__plan.rect('Forklift')), cx = (f[0] + f[1]) / 2, cz = (f[2] + f[3]) / 2, h = W / H < .8 ? 17 : 12;
      await p.evaluate(([cx, cz, h]) => window.__cam([cx, h, cz + 2.2], [cx, 0, cz - .3], false), [cx, cz, h]); return f; };
    const top = () => p.evaluate(() => window.__cam(...(innerWidth / innerHeight < .8 ? [[10, 38, -18.79], [10, 0, -18.8]] : [[10, 40, -19.49], [10, 0, -19.5]]), false));
    const check = async tag => { const fk = await p.evaluate(() => window.__plan.fk()), vis = await p.evaluate(() => window.__plan.fkRings()), txt = await p.evaluate(() => document.getElementById('plan').textContent);
      if (!fk) { ok(false, `${n} ${tag}: nothing picked`); return null; }
      ok(fk.length === 2 && vis.every(Boolean), `${n} ${tag}: two swept areas drawn ${JSON.stringify(fk.map(s => [s.side, !s.fwd ? 'full spin ' + (s.clear ? 'clear' : 'blocked: ' + s.what) : s.go || ('✗ ' + (s.fwd.deg >= s.rev.deg ? s.fwd : s.rev).what + ' ' + Math.max(s.fwd.deg, s.rev.deg) + '°')]))}`);
      if (!has) return fk;
      for (const [i, s] of fk.entries()) { const sc = i ? 1 : -1;   // fk()[0] is the centre on the truck's own −x side
        for (const [dir, w] of [[1, s.fwd], [-1, s.rev]]) { const e = await p.evaluate(([sc, dir]) => window.__plan.fkEnd(sc, dir), [sc, dir]);
          if (w.ok) ok(!e.wall && !e.hits.length, `${n} ${tag}: ${s.side} ${dir > 0 ? 'forwards' : 'reversing'} said clear; swung 90° for real its end spot hits ${e.wall ? 'the wall' : JSON.stringify(e.hits)}`);
          else log.push(`INFO ${n} ${tag}: ${s.side} ${dir > 0 ? 'forwards' : 'reversing'} blocked at ${w.deg}° by ${w.what}; end spot for real hits ${e.wall ? 'the wall ' : ''}${JSON.stringify(e.hits)}`); } }
      { const tg = await p.evaluate(() => window.__plan.fkTags ? window.__plan.fkTags() : null), all = await p.evaluate(() => window.__plan.tags ? window.__plan.tags() : []), ring = await p.evaluate(() => window.__plan.ring ? window.__plan.ring() : null);
        const ov = (a, b) => a[0] < b[1] - 1 && b[0] < a[1] - 1 && a[2] < b[3] - 1 && b[2] < a[3] - 1;
        if (!tg || tg.some(x => !x)) ok(false, `${n} ${tag}: R/L tags on both sweeps (${JSON.stringify(tg)})`);
        else { ok(tg.every((x, i) => x.text.startsWith(fk[i].side + (fk[i].ok90 ? ' ✓' : ' ✗'))), `${n} ${tag}: tags say ${JSON.stringify(tg.map(x => x.text))}, panel sides ${JSON.stringify(fk.map(s => s.side + (s.ok90 ? ' ok' : ' blocked')))}`);
          for (const [i, s] of fk.entries()) { const x = tg[i].text, w = s.fwd.deg >= s.rev.deg ? s.fwd : s.rev;   // P13: the words, worked out here from fk() on its own
            if (s.ok90) ok(s.go === 'reversing' ? / ✓ rev$/.test(x) : s.go === 'forwards' ? / ✓ fwd$/.test(x) : / ✓$/.test(x), `${n} ${tag}: ${s.side} goes ${s.go}, tag says '${x}'`);
            else { const word = x.split('✗ ')[1] || ''; ok(word.length > 1 && word.length <= 11 && (w.what || 'the wall').toLowerCase().includes(word), `${n} ${tag}: ${s.side} blocked by ${w.what}, tag says '${x}' (one short word from that name)`); }
            ok(x.length <= 18, `${n} ${tag}: tag '${x}' short (${x.length} chars)`); }
          if (touch) { const fl = await p.evaluate(() => document.querySelector('#plan .fk1')?.textContent || null); if (fl) ok(tg.every(t => fl.includes(t.text)), `${n} ${tag}: folded line '${fl}' says the same as the tags ${JSON.stringify(tg.map(t => t.text))}`); else log.push(`INFO ${n} ${tag}: no folded turning line (the red box stands in: both ways blocked)`); }
          const d = tg.map(x => Math.round(Math.hypot((x.box[0] + x.box[1]) / 2 - x.end[0], (x.box[2] + x.box[3]) / 2 - x.end[1])));
          ok(d.every((v, i) => v <= 140 || tg[i].lead), `${n} ${tag}: each tag within 140 px of its own end spot or led back to it (${d.join(', ')} px; leaders ${tg.map(x => x.lead ? 'yes' : 'no').join('/')})`);
          const moved = tg.map((x, i) => Math.abs((x.box[0] + x.box[1]) / 2 - x.end[0]) > (x.box[1] - x.box[0]) / 2 + 4 || Math.abs((x.box[2] + x.box[3]) / 2 - x.end[1]) > (x.box[3] - x.box[2]) / 2 + 4);
          ok(tg.every((x, i) => !moved[i] ? true : !!x.lead && Math.hypot(x.lead[0] - x.end[0], x.lead[1] - x.end[1]) < 2 && x.lead[2] >= x.box[0] - 2 && x.lead[2] <= x.box[1] + 2 && x.lead[3] >= x.box[2] - 2 && x.lead[3] <= x.box[3] + 2),
            `${n} ${tag}: every moved tag has a leader from its end spot to its edge (moved ${moved.join('/')})`);
          if (ring && moved.every(Boolean)) { const rc = [(ring[0] + ring[1]) / 2, (ring[2] + ring[3]) / 2], v = tg.map(x => [(x.box[0] + x.box[1]) / 2 - rc[0], (x.box[2] + x.box[3]) / 2 - rc[1]]);
            ok(v[0][0] * v[1][0] + v[0][1] * v[1][1] < 0, `${n} ${tag}: both tags moved, so they fan out to opposite sides of the truck (${JSON.stringify(v.map(q => q.map(Math.round)))})`); }
          const others = all.filter(a => !tg.some(x => x.text === a[0] && Math.abs(x.box[0] - a[1]) < .5)).map(a => [a[1], a[2], a[3], a[4]]);
          ok(!ov(tg[0].box, tg[1].box) && tg.every(x => !(ring && ov(x.box, ring)) && !others.some(o => ov(x.box, o))), `${n} ${tag}: tags clear of the truck's outline, each other and the gap labels`); } }
      { const hx = await p.evaluate(() => window.__plan.fkHits ? window.__plan.fkHits() : null);
        if (!hx) ok(false, `${n} ${tag}: no fkHits hook`);
        else for (const [i, s] of fk.entries()) { const h = hx[i], cut = await p.evaluate(i => window.__plan.fkCut(i), i);
          if (s.ok90) { ok(!h, `${n} ${tag}: ${s.side} makes 90°, no ✕ (${JSON.stringify(h)})`); ok(cut > 0, `${n} ${tag}: ${s.side} clear sweep keeps its tint under the truck (alpha ${cut})`); continue; }
          const w = s.fwd.deg >= s.rev.deg ? s.fwd : s.rev;
          ok(!!h && !h.off && h.px[0] > 0 && h.px[0] < W && h.px[1] > 0 && h.px[1] < H, `${n} ${tag}: ${s.side} blocked by ${w.what}: red ✕ on screen ${JSON.stringify(h)}`);
          if (h && h.hit) { const r = w.what === 'the wall' ? null : await p.evaluate(nm => window.__plan.rectAny(nm), w.what);
            const d = r ? Math.hypot(Math.max(r[0] - h.hit[0], 0, h.hit[0] - r[1]), Math.max(r[2] - h.hit[1], 0, h.hit[1] - r[3])) : 0;
            ok(d <= .2, `${n} ${tag}: ${s.side} ✕ at ${JSON.stringify(h.hit)} is on ${w.what}${r ? ' ' + JSON.stringify(r.map(v => +v.toFixed(2))) : ''} (${d.toFixed(3)} m off)`); }
          ok(cut === 0, `${n} ${tag}: ${s.side} blocked, tint cut out under the truck (alpha ${cut})`); }
        const tg = await p.evaluate(() => window.__plan.fkTags()), all = await p.evaluate(() => window.__plan.tags());
        if (hx) for (const h of hx.filter(h => h && h.px)) ok(!all.some(a => h.px[0] > a[1] - 8 && h.px[0] < a[2] + 8 && h.px[1] > a[3] - 8 && h.px[1] < a[4] + 8), `${n} ${tag}: ✕ at ${h.px.map(Math.round)} not under a tag or gap label`); }
      const any = fk.some(s => s.ok90); ok(any === !/Can't turn/.test(txt), `${n} ${tag}: red box ${any ? 'not shown (it can get out)' : 'shown'}`);
      if (!any && touch) { const wb = await p.evaluate(() => { const e = document.querySelector('#plan .warn'); if (!e) return null; const r = e.getBoundingClientRect(), lh = parseFloat(getComputedStyle(e).lineHeight) || parseFloat(getComputedStyle(e).fontSize) * 1.25; return { t: e.textContent, h: r.height, lh }; });
        if (!wb) ok(false, `${n} ${tag}: red box element`); else {
          for (const s of fk) { const w = s.fwd.deg >= s.rev.deg ? s.fwd : s.rev, nm = (w.what || 'the wall').toLowerCase().replace(/\s*\(.*?\)/g, '');
            const words = wb.t.replace(/^Can't turn: /, '').replace(/\. Move it\.$|\.$/, '').split(' · ').map(x => x.trim()).filter(Boolean);   // P15: one part per hit, each must carry the side letter, the hit word and its angle
            ok(words.some(x => { const m = x.match(/^(?:(R|L|far|door): )?(.+?) (?:\((R|L|far|door) (\d+)°, (R|L|far|door) (\d+)°\)|(\d+)°)$/); if (!m) return false; const K = { right: 'R', left: 'L', 'far side': 'far', 'door side': 'door' }[s.side]; const deg = m[1] ? (m[1] === K && m[7]) : (m[3] === K ? m[4] : m[5] === K ? m[6] : null); return nm.includes(m[2].trim().toLowerCase()) && deg === String(w.deg); }), `${n} ${tag}: red box '${wb.t}' names ${s.side}'s hit (${w.what} at ${w.deg}°)`); }
          if (touch) ok(wb.h <= wb.lh * 1.5, `${n} ${tag}: folded red box on one line (${Math.round(wb.h)} px, line ${Math.round(wb.lh)} px)`); } }
      res[n][tag] = fk.map(s => ({ side: s.side, ok90: s.ok90, go: s.go, fwd: s.fwd, rev: s.rev, spin: s.clear })); return fk; };
    await top();
    const [fx, fy] = await p.evaluate(() => window.__plan.screen('Forklift')); await tapAt(fx, fy);
    ok(await p.evaluate(() => window.__plan.sel()) === 'Forklift: Doosan G15S', `${n}: forklift picked by a real ${touch ? 'tap' : 'click'}`);
    const fk1 = await check('home'); if (fk1 && has) ok(fk1.some(s => s.ok90), `${n} home: it can get out of its own parking spot (full spin: ${fk1.map(s => s.clear ? 'clear' : 'blocked').join('/')})`);
    await p.evaluate(() => window.__frame()); await p.screenshot({ path: `${pre}-${n}-fk0.png`, timeout: TMO });   // the plan camera itself (where the 01:xx find was seen)
    await close(); await p.evaluate(() => window.__frame()); await p.screenshot({ path: `${pre}-${n}-fk1.png`, timeout: TMO });
    if (n === 'desk' || has) { await p.evaluate(() => { document.querySelector('#plan button[data-a=more]')?.click(); }); await p.waitForTimeout(200); await p.evaluate(() => window.__frame()); await p.screenshot({ path: `${pre}-${n}-fk1more.png`, timeout: TMO }); await p.evaluate(() => { document.querySelector('#plan button[data-a=more]')?.click(); }); }
    const drag = async (dxm, dzm) => { await top(); const mpp = await p.evaluate(() => { const h = innerWidth / innerHeight < .8 ? 38 : 40; return (2 * h * Math.tan((innerWidth / innerHeight < .8 ? 70 : 55) * Math.PI / 360)) / innerHeight; });
      const [sx, sy] = await p.evaluate(() => window.__plan.screen('Forklift')), dx = dxm / mpp, dy = dzm / mpp, steps = 10;
      if (touch) { const cdp = await ctx.newCDPSession(p); const t = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
        await t('touchStart', sx, sy); for (let i = 1; i <= steps; i++) { await t('touchMove', sx + dx * i / steps, sy + dy * i / steps); await p.waitForTimeout(50); } await t('touchEnd'); }
      else { await p.mouse.move(sx, sy); await p.mouse.down(); for (let i = 1; i <= steps; i++) { await p.mouse.move(sx + dx * i / steps, sy + dy * i / steps); await p.waitForTimeout(50); } await p.mouse.up(); }
      await p.waitForTimeout(400); };
    const goTo = async (x, z) => { const f = await p.evaluate(() => window.__plan.rect('Forklift')); await drag(x - (f[0] + f[1]) / 2, z - (f[2] + f[3]) / 2); };   // drag its middle to (x, z) by real input
    const home = await p.evaluate(() => window.__plan.rect('Forklift')), hx = (home[0] + home[1]) / 2, hz = (home[2] + home[3]) / 2;
    await goTo(11, -19.5); const fk3 = await check('open floor');   // the open patch mid-hall (x 9-13, z -18…-21: 2.6 m+ clear of everything, probe 11 Nov)
    if (fk3 && has) ok(fk3.every(s => s.ok90), `${n} open floor: both sides turn 90° (${JSON.stringify(await p.evaluate(() => window.__plan.rect('Forklift')))})`);
    await close(); await p.evaluate(() => window.__frame()); await p.screenshot({ path: `${pre}-${n}-fk3.png`, timeout: TMO });
    await goTo(hx, hz); await drag(-8, 0); const fk2 = await check('against the racking');
    if (fk2 && has) { const t = await p.evaluate(() => document.getElementById('plan').textContent); ok(fk2.some(s => !s.ok90) && (fk2.every(s => s.ok90) || /hits .+ at \d+°|✗|Can't turn/.test(t)), `${n} racking: a blocked side is named (${JSON.stringify(t.slice(-160))})`); }
    await close(); await p.evaluate(() => window.__frame()); await p.screenshot({ path: `${pre}-${n}-fk2.png`, timeout: TMO });
    { const ph = await p.evaluate(() => Math.round(document.getElementById('plan').getBoundingClientRect().bottom)); ok(!touch || ph <= .27 * H, `${n}: panel bottom ${ph} px (${touch ? 'phone cap ' + Math.round(.27 * H) : 'no cap on desk'})`); }
    if (fontFail.length) log.push(`INFO ${n}: Google Fonts refused by the proxy (${fontFail.length}), ignored`);
    await ctx.close();
  }
  log.push('page errors: ' + JSON.stringify(errs)); if (errs.length) fail++;
  log.push('RESULT ' + (fail ? 'FAIL (' + fail + ')' : 'PASS')); log.push(JSON.stringify(res));
  fs.writeFileSync(pre + '-test.txt', log.join('\n') + '\n'); console.log(log.join('\n')); await b.close(); process.exit(fail ? 1 : 0);
})();
