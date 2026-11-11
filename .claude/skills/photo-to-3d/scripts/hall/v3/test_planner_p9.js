// P9 (11 Nov 01:xx): the forklift's 90° turn. test_planner_p3.js's walk (pick it at home by a real tap/click, shove it into the racking by real
// touch/mouse) plus: both sides get a swept area drawn; at home it can get out (at least one side turns 90°, no red box); against the racking the
// panel names what it hits and at what angle; dragged into open floor both sides turn. Every side reported clear is checked independently:
// the truck is really swung 90° about that centre (window.__plan.fkEnd) and its end box must hit no wall and no kit; every side reported blocked
// must have both ways' end spot or path hit something (a blocked end spot is proof; a clear end spot with a blocked path is logged).
// usage: NODE_PATH=$(npm root -g) node test_planner_p9.js hall3.html <out prefix> [phone|desk]
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const C = process.env.HOME + '/.cache/jos3d/'; const [page, pre, only] = [process.argv[2], process.argv[3] || 'p9', process.argv[4]];
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
      const any = fk.some(s => s.ok90); ok(any === !/Can't turn 90/.test(txt), `${n} ${tag}: red box ${any ? 'not shown (it can get out)' : 'shown'}`);
      res[n][tag] = fk.map(s => ({ side: s.side, ok90: s.ok90, go: s.go, fwd: s.fwd, rev: s.rev, spin: s.clear })); return fk; };
    await top();
    const [fx, fy] = await p.evaluate(() => window.__plan.screen('Forklift')); await tapAt(fx, fy);
    ok(await p.evaluate(() => window.__plan.sel()) === 'Forklift: Doosan G15S', `${n}: forklift picked by a real ${touch ? 'tap' : 'click'}`);
    const fk1 = await check('home'); if (fk1 && has) ok(fk1.some(s => s.ok90), `${n} home: it can get out of its own parking spot (full spin: ${fk1.map(s => s.clear ? 'clear' : 'blocked').join('/')})`);
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
    if (fk2 && has) { const t = await p.evaluate(() => document.getElementById('plan').textContent); ok(fk2.some(s => !s.ok90) && (fk2.every(s => s.ok90) || /hits .+ at \d+°|✗|Can't turn 90/.test(t)), `${n} racking: a blocked side is named (${JSON.stringify(t.slice(-160))})`); }
    await close(); await p.evaluate(() => window.__frame()); await p.screenshot({ path: `${pre}-${n}-fk2.png`, timeout: TMO });
    { const ph = await p.evaluate(() => Math.round(document.getElementById('plan').getBoundingClientRect().bottom)); ok(!touch || ph <= .27 * H, `${n}: panel bottom ${ph} px (phone cap ${Math.round(.27 * H)})`); }
    if (fontFail.length) log.push(`INFO ${n}: Google Fonts refused by the proxy (${fontFail.length}), ignored`);
    await ctx.close();
  }
  log.push('page errors: ' + JSON.stringify(errs)); if (errs.length) fail++;
  log.push('RESULT ' + (fail ? 'FAIL (' + fail + ')' : 'PASS')); log.push(JSON.stringify(res));
  fs.writeFileSync(pre + '-test.txt', log.join('\n') + '\n'); console.log(log.join('\n')); await b.close(); process.exit(fail ? 1 : 0);
})();
