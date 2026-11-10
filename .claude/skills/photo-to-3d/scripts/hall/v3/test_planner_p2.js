// Headless test of yard planner P2 (10 Nov): drag a crate, tap 'turn 90°' (real tap / click), check the footprint swaps, lands on the grid
// and touches nothing; reload the page and check the layout comes back from this device's storage; tap 'reset layout' and check it's all home.
// usage: NODE_PATH=$(npm root -g) node test_planner_p2.js hall3.html <out prefix> [phone|desk]
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const C = process.env.HOME + '/.cache/jos3d/'; const [page, pre, only] = [process.argv[2], process.argv[3] || 'p2', process.argv[4]];
const TMO = +process.env.SHOT_TIMEOUT || 300000;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = [], log = [], res = {}; let fail = 0; const ok = (c, m) => { log.push((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
  for (const [n, W, H, touch] of [['phone', 390, 844, true], ['desk', 1200, 800, false]].filter(s => !only || s[0] === only)) {
    const ctx = await b.newContext({ viewport: { width: W, height: H }, hasTouch: touch, isMobile: touch }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(n + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(n + ': ' + m.text()); });
    await p.route(/cdn\.jsdelivr\.net/, r => { const m = r.request().url().match(/three@[^/]+\/(.*)$/); return m ? r.fulfill({ path: C + 'three-r180/' + m[1], contentType: 'text/javascript' }) : r.abort(); });
    await p.route(/fonts\./, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    const h = W / H < .8 ? 38 : 40, zc = W / H < .8 ? -18.8 : -19.5;
    const tap = async sel => { const r = await p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; }, sel); if (!r) return false; if (touch) await p.touchscreen.tap(...r); else await p.mouse.click(...r); await p.waitForTimeout(300); return true; };
    const open = async () => { await p.waitForFunction(() => window.__ready, null, { timeout: 300000 }); await p.evaluate(() => { window.__hq(false); window.__loop(false); });
      await tap('#plan-b'); await p.evaluate(([h, zc]) => window.__cam([10, h, zc + .01], [10, 0, zc], false), [h, zc]); };
    await p.goto('file://' + path.resolve(page), { waitUntil: 'commit' }); await open();
    ok(await p.evaluate(() => window.__plan.saved()) === null, `${n}: nothing saved on a first visit`);
    ok(await p.evaluate(() => !!document.querySelector('#plan button[data-a=reset]')), `${n}: 'reset layout' button in the plan panel`);
    const name = 'Plywood crate (GY badge)', r0 = await p.evaluate(n => window.__plan.rect(n), name), [sx, sy] = await p.evaluate(n => window.__plan.screen(n), name);
    const mpp = await p.evaluate(h => (2 * (h - 1) * Math.tan((innerWidth / innerHeight < .8 ? 70 : 55) * Math.PI / 360)) / innerHeight, h), dx = 1.5 / mpp, dy = 2.0 / mpp, steps = 8;
    if (touch) { const cdp = await ctx.newCDPSession(p); const t = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
      await t('touchStart', sx, sy); for (let i = 1; i <= steps; i++) { await t('touchMove', sx + dx * i / steps, sy + dy * i / steps); await p.waitForTimeout(60); } await t('touchEnd'); }
    else { await p.mouse.move(sx, sy); await p.mouse.down(); for (let i = 1; i <= steps; i++) { await p.mouse.move(sx + dx * i / steps, sy + dy * i / steps); await p.waitForTimeout(60); } await p.mouse.up(); }
    await p.waitForTimeout(400);
    const r1 = await p.evaluate(n => window.__plan.rect(n), name), s1 = await p.evaluate(() => window.__plan.saved());
    ok(s1 && s1[name] && s1[name][2] === 0, `${n}: drag saved on this device ${JSON.stringify(s1)}`);
    ok(await tap('#plan button[data-a=turn]'), `${n}: 'turn 90°' button there once the crate is picked`);
    const r2 = await p.evaluate(n => window.__plan.rect(n), name), s2 = await p.evaluate(() => window.__plan.saved()), ov = await p.evaluate(() => window.__plan.overlaps());
    const w1 = [r1[1] - r1[0], r1[3] - r1[2]], w2 = [r2[1] - r2[0], r2[3] - r2[2]], c1 = [(r1[0] + r1[1]) / 2, (r1[2] + r1[3]) / 2], c2 = [(r2[0] + r2[1]) / 2, (r2[2] + r2[3]) / 2];
    res[n] = { r0, r1, r2, w1: w1.map(v => +v.toFixed(3)), w2: w2.map(v => +v.toFixed(3)), moved: +Math.hypot(c2[0] - c1[0], c2[1] - c1[1]).toFixed(2) };
    ok(Math.abs(w2[0] - w1[1]) < .02 && Math.abs(w2[1] - w1[0]) < .02, `${n}: turned: footprint ${w1.map(v => v.toFixed(2)).join(' × ')} → ${w2.map(v => v.toFixed(2)).join(' × ')} m`);
    ok(Math.hypot(c2[0] - c1[0], c2[1] - c1[1]) <= 1.05, `${n}: turned about its own middle (centre moved ${res[n].moved} m)`);
    ok(Math.abs(r2[0] / .1 - Math.round(r2[0] / .1)) < .01 && Math.abs(r2[2] / .1 - Math.round(r2[2] / .1)) < .01, `${n}: turned crate on the 10 cm grid (x0 ${r2[0]}, z0 ${r2[2]})`);
    ok(ov.length === 0, `${n}: nothing overlaps after the turn ${JSON.stringify(ov)}`);
    ok(s2 && s2[name] && s2[name][2] === 1, `${n}: the turn is saved (${JSON.stringify(s2 && s2[name])})`);
    await p.evaluate(() => window.__frame()); await p.screenshot({ path: `${pre}-${n}-turn.png`, timeout: TMO });
    // reload: the layout must come back
    await p.reload({ waitUntil: 'commit' }); await open();
    const r3 = await p.evaluate(n => window.__plan.rect(n), name), ld = await p.evaluate(() => window.__plan.loaded()), msg = await p.evaluate(() => document.getElementById('plan').textContent);
    ok(r3 && r3.every((v, i) => Math.abs(v - r2[i]) < .002), `${n}: after a reload the crate is where it was left ${JSON.stringify(r3)}`);
    ok(ld === 1 && /from last time/.test(msg), `${n}: the panel says the layout came back (${ld} moved)`);
    ok((await p.evaluate(() => window.__plan.overlaps())).length === 0, `${n}: nothing overlaps after the reload`);
    await p.evaluate(() => window.__frame()); await p.screenshot({ path: `${pre}-${n}-back.png`, timeout: TMO });
    // reset
    ok(await tap('#plan button[data-a=reset]'), `${n}: tapped 'reset layout'`);
    const r4 = await p.evaluate(n => window.__plan.rect(n), name), s4 = await p.evaluate(() => window.__plan.saved());
    ok(r4.every((v, i) => Math.abs(v - r0[i]) < .002) && s4 === null, `${n}: reset puts the crate home ${JSON.stringify(r4)} and clears the save`);
    await p.evaluate(() => window.__frame()); await p.screenshot({ path: `${pre}-${n}-reset.png`, timeout: TMO });
    await ctx.close();
  }
  log.push('page errors: ' + JSON.stringify(errs)); if (errs.length) fail++;
  log.push('RESULT ' + (fail ? 'FAIL (' + fail + ')' : 'PASS')); log.push(JSON.stringify(res));
  fs.writeFileSync(pre + '-test.txt', log.join('\n') + '\n'); console.log(log.join('\n')); await b.close(); process.exit(fail ? 1 : 0);
})();
