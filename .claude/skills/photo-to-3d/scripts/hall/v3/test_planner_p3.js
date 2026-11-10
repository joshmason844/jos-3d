// Headless test of yard planner P3 (10 Nov 02:xx): tap the forklift in plan mode (real tap / click) and check its two turning circles are drawn
// and judged right; drag it hard left against the racking (real touch / mouse) and check the circles follow it, go red and the panel warns.
// Every circle's 'room' is re-measured here from the page's footprints (window.__boxes) and the walls, not taken on trust.
// Also shoots close-ups for before/after (on a build without P3 the fk checks are skipped and it just shoots).
// usage: NODE_PATH=$(npm root -g) node test_planner_p3.js hall3.html <out prefix> [phone|desk]
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const C = process.env.HOME + '/.cache/jos3d/'; const [page, pre, only] = [process.argv[2], process.argv[3] || 'p3', process.argv[4]];
const TMO = +process.env.SHOT_TIMEOUT || 300000, R = 1.977, IN = [.08, 19.92, -39.0, -.08];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = [], log = [], res = {}; let fail = 0; const ok = (c, m) => { log.push((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
  for (const [n, W, H, touch] of [['phone', 390, 844, true], ['desk', 1200, 800, false]].filter(s => !only || s[0] === only)) {
    const ctx = await b.newContext({ viewport: { width: W, height: H }, hasTouch: touch, isMobile: touch }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(n + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(n + ': ' + m.text()); });
    await p.route(/cdn\.jsdelivr\.net/, r => { const m = r.request().url().match(/three@[^/]+\/(.*)$/); return m ? r.fulfill({ path: C + 'three-r180/' + m[1], contentType: 'text/javascript' }) : r.abort(); });
    await p.route(/fonts\./, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await p.goto('file://' + path.resolve(page), { waitUntil: 'commit' }); await p.waitForFunction(() => window.__ready, null, { timeout: 300000 });
    await p.evaluate(() => { window.__hq(false); window.__loop(false); try { localStorage.clear(); } catch (e) { } });
    const tapAt = async (x, y) => { if (touch) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); await p.waitForTimeout(300); };
    const tapSel = async s => { const r = await p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; }, s); if (r) await tapAt(...r); return !!r; };
    await tapSel('#plan-b');
    const has = await p.evaluate(() => typeof window.__plan.fk === 'function');
    const close = async () => { const f = await p.evaluate(() => window.__plan.rect('Forklift')), cx = (f[0] + f[1]) / 2, cz = (f[2] + f[3]) / 2, h = W / H < .8 ? 17 : 12;
      await p.evaluate(([cx, cz, h]) => window.__cam([cx, h, cz + 2.2], [cx, 0, cz - .3], false), [cx, cz, h]); return f; };
    const check = async (tag) => { if (!has) return null; const fk = await p.evaluate(() => window.__plan.fk()), vis = await p.evaluate(() => window.__plan.fkRings()), f = await p.evaluate(() => window.__plan.rect('Forklift'));
      const boxes = await p.evaluate(() => window.__boxes());   // [name, x0, y0, z0, x1, y1, z1]
      const hit = (a, q) => a[0] < q[1] - .015 && a[1] > q[0] + .015 && a[2] < q[3] - .015 && a[3] > q[2] + .015;
      const obs = boxes.filter(bx => bx[0] !== 'The hall' && !bx[0].startsWith('Forklift') && bx[5] >= .05).map(bx => [bx[1], bx[4], bx[3], bx[6], bx[0]]).filter(q => !hit(f, q));
      if (!fk) { ok(false, `${n} ${tag}: nothing picked (sel ${await p.evaluate(() => window.__plan.sel())})`); return null; }
      ok(fk.length === 2 && vis.every(Boolean), `${n} ${tag}: two turning circles drawn (${JSON.stringify(fk && fk.map(s => [s.side, s.c, s.room, s.what]))})`);
      for (const s of fk) { const [x, z] = s.c; let room = Math.min(x - IN[0], IN[1] - x, z - IN[2], IN[3] - z);
        for (const q of obs) room = Math.min(room, Math.hypot(Math.max(q[0] - x, 0, x - q[1]), Math.max(q[2] - z, 0, z - q[3])));
        ok(Math.abs(room - s.room) < .03 && s.clear === (s.room >= R), `${n} ${tag}: ${s.side} circle room ${s.room} m, re-measured ${room.toFixed(2)} m → ${s.clear ? 'clear' : 'blocked'}`);
        const mid = [(f[0] + f[1]) / 2, (f[2] + f[3]) / 2], d = Math.hypot(x - mid[0], z - mid[1]); ok(d > .5 && d < 1.3, `${n} ${tag}: ${s.side} centre ${d.toFixed(2)} m from the forklift's middle (by the drive axle)`); }
      return fk; };
    const top = () => p.evaluate(() => window.__cam(...(innerWidth / innerHeight < .8 ? [[10, 38, -18.79], [10, 0, -18.8]] : [[10, 40, -19.49], [10, 0, -19.5]]), false));
    await top();   // the plan button flies the camera; with the loop paused it never lands, so put it there
    // 1. tap the forklift where it is
    const [fx, fy] = await p.evaluate(() => window.__plan.screen('Forklift')); await tapAt(fx, fy);
    ok(await p.evaluate(() => window.__plan.sel()) === 'Forklift: Doosan G15S', `${n}: forklift picked by a real ${touch ? 'tap' : 'click'}`);
    const fk1 = await check('home'); if (fk1) { const txt = await p.evaluate(() => document.getElementById('plan').textContent); ok(/Turning circles/.test(txt) && /1\.98 m/.test(txt), `${n} home: panel reads out the turning circles`); }
    await close(); await p.evaluate(() => window.__frame()); await p.screenshot({ path: `${pre}-${n}-fk1.png`, timeout: TMO });
    // 2. shove it hard left into the racking by real input
    await top();
    const mpp = await p.evaluate(() => { const h = innerWidth / innerHeight < .8 ? 38 : 40; return (2 * h * Math.tan((innerWidth / innerHeight < .8 ? 70 : 55) * Math.PI / 360)) / innerHeight; });
    const [sx, sy] = await p.evaluate(() => window.__plan.screen('Forklift')), dx = -8 / mpp, steps = 10;
    if (touch) { const cdp = await ctx.newCDPSession(p); const t = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
      await t('touchStart', sx, sy); for (let i = 1; i <= steps; i++) { await t('touchMove', sx + dx * i / steps, sy); await p.waitForTimeout(50); } await t('touchEnd'); }
    else { await p.mouse.move(sx, sy); await p.mouse.down(); for (let i = 1; i <= steps; i++) { await p.mouse.move(sx + dx * i / steps, sy); await p.waitForTimeout(50); } await p.mouse.up(); }
    await p.waitForTimeout(400);
    const fk2 = await check('against the racking');
    if (fk1 && fk2) { ok(fk2[0].c[0] < fk1[0].c[0] - .5, `${n}: circles followed the drag (left centre x ${fk1[0].c[0]} → ${fk2[0].c[0]})`);
      const txt = await p.evaluate(() => document.getElementById('plan').textContent), bad = fk2.filter(s => !s.clear).length;
      ok(bad >= 1, `${n}: against the racking at least one circle is blocked (${bad})`); ok(bad < 2 || /Too tight to turn round here/.test(txt), `${n}: panel warns when it can't turn either way`); res[n] = { home: fk1, wall: fk2 }; }
    await close(); await p.evaluate(() => window.__frame()); await p.screenshot({ path: `${pre}-${n}-fk2.png`, timeout: TMO });
    // labels and panel stay clear of the bar
    const clash = await p.evaluate(() => { const bar = [...document.querySelectorAll('.bar button')].map(e => e.getBoundingClientRect()), pl = document.getElementById('plan').getBoundingClientRect(); return bar.filter(q => q.top < pl.bottom && q.bottom > pl.top && q.left < pl.right && q.right > pl.left).length; });
    ok(clash === 0, `${n}: plan panel clear of the button bar`);
    await ctx.close();
  }
  log.push('page errors: ' + JSON.stringify(errs)); if (errs.length) fail++;
  log.push('RESULT ' + (fail ? 'FAIL (' + fail + ')' : 'PASS')); log.push(JSON.stringify(res));
  fs.writeFileSync(pre + '-test.txt', log.join('\n') + '\n'); console.log(log.join('\n')); await b.close(); process.exit(fail ? 1 : 0);
})();
