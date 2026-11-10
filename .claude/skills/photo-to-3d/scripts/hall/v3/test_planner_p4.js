// Headless test of yard planner P4 (10 Nov 03:xx): 'wet canvas' drying zones. Real taps / touch drags on a phone, clicks / mouse drags on desk.
// 1. tap 'wet canvas', drag out a zone on open floor (found here from the page's own footprints): checks size, area, all clear;
// 2. drag a second zone over the forklift: its clear area must be less than its area, re-measured here on a 1 cm grid (not the page's 10 cm);
// 3. tap inside zone 2 to pick it, 'delete zone'; 4. saved, reload, zones back; 5. reset clears them. Shoots close-ups for before/after.
// usage: NODE_PATH=$(npm root -g) node test_planner_p4.js hall3.html <out prefix> [phone|desk]
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const C = process.env.HOME + '/.cache/jos3d/'; const [page, pre, only] = [process.argv[2], process.argv[3] || 'p4', process.argv[4]];
const TMO = +process.env.SHOT_TIMEOUT || 300000;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = [], log = [], res = {}; let fail = 0; const ok = (c, m) => { log.push((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
  for (const [n, W, H, touch] of [['phone', 390, 844, true], ['desk', 1200, 800, false]].filter(s => !only || s[0] === only)) {
    const ctx = await b.newContext({ viewport: { width: W, height: H }, hasTouch: touch, isMobile: touch }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(n + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(n + ': ' + m.text()); });
    await p.route(/cdn\.jsdelivr\.net/, r => { const m = r.request().url().match(/three@[^/]+\/(.*)$/); return m ? r.fulfill({ path: C + 'three-r180/' + m[1], contentType: 'text/javascript' }) : r.abort(); });
    await p.route(/fonts\./, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    const load = async () => { await p.goto('file://' + path.resolve(page), { waitUntil: 'commit' }); await p.waitForFunction(() => window.__ready, null, { timeout: 300000 });
      await p.evaluate(() => { window.__hq && window.__hq(false); window.__loop && window.__loop(false); }); };
    await load(); await p.evaluate(() => { try { localStorage.clear(); } catch (e) { } });
    const has = await p.evaluate(() => typeof (window.__plan && window.__plan.wet) === 'function');
    const tapAt = async (x, y) => { if (touch) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); await p.waitForTimeout(300); };
    const tapSel = async s => { const r = await p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; }, s); if (r) await tapAt(...r); return !!r; };
    const top = () => p.evaluate(() => window.__cam(...(innerWidth / innerHeight < .8 ? [[10, 38, -18.79], [10, 0, -18.8]] : [[10, 40, -19.49], [10, 0, -19.5]]), false));
    const drag = async (a, z) => { const [sx, sy] = await p.evaluate(a => window.__plan.toScreen(...a), a), [ex, ey] = await p.evaluate(z => window.__plan.toScreen(...z), z), steps = 8;
      if (touch) { const cdp = await ctx.newCDPSession(p); const t = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
        await t('touchStart', sx, sy); for (let i = 1; i <= steps; i++) { await t('touchMove', sx + (ex - sx) * i / steps, sy + (ey - sy) * i / steps); await p.waitForTimeout(40); } await t('touchEnd'); }
      else { await p.mouse.move(sx, sy); await p.mouse.down(); for (let i = 1; i <= steps; i++) { await p.mouse.move(sx + (ex - sx) * i / steps, sy + (ey - sy) * i / steps); await p.waitForTimeout(40); } await p.mouse.up(); }
      await p.waitForTimeout(300); };
    await tapSel('#plan-b'); await top();
    if (!has) { await p.evaluate(() => window.__frame && window.__frame()); await p.screenshot({ path: `${pre}-${n}-wet.png`, timeout: TMO }); log.push(`${n}: no P4 on this build, shot only`); await ctx.close(); continue; }
    ok(await tapSel('#plan button[data-a=wet]'), `${n}: 'wet canvas' button there and tapped`);
    ok(await p.evaluate(() => window.__plan.wet().on), `${n}: wet canvas mode on`);
    // 1. open floor: a 3.0 × 2.0 m spot with no footprint in it (searched on the 10 cm grid, away from the walls)
    const feet = await p.evaluate(() => window.__plan.feet()), clearAt = (x0, z0, w, d) => !feet.some(q => q[0] < x0 + w && q[1] > x0 && q[2] < z0 + d && q[3] > z0);
    let spot = null; for (let z = -6; z > -36 && !spot; z -= .5) for (let x = 2; x < 16 && !spot; x += .5) if (clearAt(x - .2, z - .2, 3.4, 2.4)) spot = [x, z];
    ok(!!spot, `${n}: found open floor for zone 1 at ${JSON.stringify(spot)}`);
    await drag([spot[0] + .02, spot[1] + .02], [spot[0] + 3.0 - .02, spot[1] + 2.0 - .02]);
    let w = await p.evaluate(() => window.__plan.wet()); const z1 = w.zones[0];
    ok(w.zones.length === 1 && z1 && Math.abs(z1[1] - z1[0] - 3) < .11 && Math.abs(z1[3] - z1[2] - 2) < .11, `${n}: zone 1 drawn by real ${touch ? 'touch' : 'mouse'} drag, ${z1 && (z1[1] - z1[0]).toFixed(2)} × ${z1 && (z1[3] - z1[2]).toFixed(2)} m (asked 3 × 2)`);
    ok(z1 && z1.every(v => Math.abs(v * 10 - Math.round(v * 10)) < 1e-6), `${n}: zone 1 on the 10 cm grid ${JSON.stringify(z1)}`);
    ok(w.areas[0] && Math.abs(w.areas[0][0] - (z1[1] - z1[0]) * (z1[3] - z1[2])) < .01 && w.areas[0][1] === w.areas[0][0] && w.areas[0][2] === 0, `${n}: zone 1 area ${w.areas[0] && w.areas[0][0]} m², all clear (${JSON.stringify(w.areas[0])})`);
    let txt = await p.evaluate(() => document.getElementById('plan').textContent); ok(/m²/.test(txt) && /all clear floor/.test(txt), `${n}: panel reads out zone 1's area: "${txt.slice(0, 90)}"`);
    // 2. a zone over the forklift: clear < area, re-measured on a 1 cm grid
    const f = await p.evaluate(() => window.__plan.rect('Forklift')), a2 = [f[0] - .6, f[2] - .5], b2 = [f[1] + .6, f[3] + .5];
    await drag(a2, b2); w = await p.evaluate(() => window.__plan.wet()); const z2 = w.zones[1];
    let mine = 0; if (z2) for (let i = 0; i < Math.round((z2[1] - z2[0]) / .01); i++) for (let j = 0; j < Math.round((z2[3] - z2[2]) / .01); j++) { const x = z2[0] + (i + .5) * .01, y = z2[2] + (j + .5) * .01; if (!feet.some(q => x > q[0] && x < q[1] && y > q[2] && y < q[3])) mine += 1e-4; }
    ok(w.zones.length === 2 && w.areas[1][1] < w.areas[1][0] - .5 && w.areas[1][2] >= 1, `${n}: zone 2 over the forklift: ${w.areas[1] && w.areas[1][0]} m², ${w.areas[1] && w.areas[1][1]} clear, ${w.areas[1] && w.areas[1][2]} bit(s) of kit in it`);
    ok(z2 && Math.abs(mine - w.areas[1][1]) < .06, `${n}: zone 2 clear area ${w.areas[1] && w.areas[1][1]} m², re-measured on a 1 cm grid ${mine.toFixed(2)} m²`);
    txt = await p.evaluate(() => document.getElementById('plan').textContent); ok(/kit in it/.test(txt) && /2 zones/.test(txt), `${n}: panel names the kit in zone 2 and totals 2 zones`);
    await p.evaluate(() => window.__frame());   // labels are placed by the render loop: draw one frame first
    const labs = await p.evaluate(() => [...document.querySelectorAll('.pm.wz')].filter(d => d.style.display !== 'none').map(d => d.textContent)); ok(labs.length === 2 && labs.every(t => /m²/.test(t)), `${n}: two area labels on the floor ${JSON.stringify(labs)}`);
    const clash = await p.evaluate(() => { const bar = [...document.querySelectorAll('.bar button')].map(e => e.getBoundingClientRect()), els = [document.getElementById('plan'), ...[...document.querySelectorAll('.pm.wz')].filter(d => d.style.display !== 'none')].map(e => e.getBoundingClientRect());
      return els.filter(pl => bar.some(q => q.top < pl.bottom && q.bottom > pl.top && q.left < pl.right && q.right > pl.left)).length; });
    ok(clash === 0, `${n}: panel and zone labels clear of the button bar`);
    await p.screenshot({ path: `${pre}-${n}-wet.png`, timeout: TMO });
    const cx = (f[0] + f[1]) / 2, cz = (f[2] + f[3]) / 2, hh = W / H < .8 ? 15 : 11;
    await p.evaluate(([cx, cz, h]) => window.__cam([cx, h, cz + 2], [cx, 0, cz - .3], false), [cx, cz, hh]); await p.evaluate(() => window.__frame()); await p.screenshot({ path: `${pre}-${n}-wetclose.png`, timeout: TMO });
    await top();
    // 3. tap inside zone 2 (beside the forklift, inside the zone) to pick it, then delete
    const [tx, ty] = await p.evaluate(([x, z]) => window.__plan.toScreen(x, z), [z2[0] + .25, z2[2] + .25]); await tapAt(tx, ty);
    ok(await p.evaluate(() => window.__plan.wet().sel) === 1, `${n}: real tap picks zone 2`);
    ok(await tapSel('#plan button[data-a=wetdel]'), `${n}: 'delete zone' tapped`); w = await p.evaluate(() => window.__plan.wet());
    ok(w.zones.length === 1 && JSON.stringify(w.zones[0]) === JSON.stringify(z1), `${n}: zone 2 gone, zone 1 kept`);
    // 4. saved and back after a reload
    const sv = await p.evaluate(() => window.__plan.saved()); ok(sv && Array.isArray(sv.__wet) && sv.__wet.length === 1, `${n}: saved on this device ${JSON.stringify(sv)}`);
    await load(); w = await p.evaluate(() => window.__plan.wet()); ok(w.zones.length === 1 && w.zones[0].every((v, i) => Math.abs(v - z1[i]) < .005), `${n}: after a reload zone 1 is back ${JSON.stringify(w.zones[0])}`);
    // 5. reset clears it
    await tapSel('#plan-b'); await top(); await tapSel('#plan button[data-a=reset]'); w = await p.evaluate(() => window.__plan.wet());
    ok(w.zones.length === 0 && (await p.evaluate(() => window.__plan.saved())) === null, `${n}: reset layout clears the zones and the save`);
    res[n] = { spot, z1, z2, areas: w.areas };
    await ctx.close();
  }
  log.push('page errors: ' + JSON.stringify(errs)); if (errs.length) fail++;
  log.push('RESULT ' + (fail ? 'FAIL (' + fail + ')' : 'PASS')); log.push(JSON.stringify(res));
  fs.writeFileSync(pre + '-test.txt', log.join('\n') + '\n'); console.log(log.join('\n')); await b.close(); process.exit(fail ? 1 : 0);
})();
