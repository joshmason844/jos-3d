// Headless test of yard planner P4b (10 Nov 04:xx): move and resize a drying zone once it's drawn. Real touch drags on a phone, mouse on desk.
// 1. draw a 3 × 2 m zone on open floor (found from the page's own footprints); 2. drag inside it: it moves by the drag (10 cm grid), keeps its size;
// 3. drag its far corner handle out 1 m and 0.5 m: it grows to 4 × 2.5 m, the opposite corner stays put; 4. shoved against a wall it stops inside;
// 5. a drag that would shrink it under 0.3 m is refused; 6. saved and back after a reload. Shoots the picked zone for before/after.
// usage: NODE_PATH=$(npm root -g) node test_planner_p4b.js hall3.html <out prefix> [phone|desk]
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const C = process.env.HOME + '/.cache/jos3d/'; const [page, pre, only] = [process.argv[2], process.argv[3] || 'p4b', process.argv[4]];
const TMO = +process.env.SHOT_TIMEOUT || 300000;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = [], log = [], res = {}; let fail = 0; const ok = (c, m) => { log.push((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
  const near = (a, b, t = .005) => a && b && a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < t);
  for (const [n, W, H, touch] of [['phone', 390, 844, true], ['desk', 1200, 800, false]].filter(s => !only || s[0] === only)) {
    const ctx = await b.newContext({ viewport: { width: W, height: H }, hasTouch: touch, isMobile: touch }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(n + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(n + ': ' + m.text()); });
    await p.route(/cdn\.jsdelivr\.net/, r => { const m = r.request().url().match(/three@[^/]+\/(.*)$/); return m ? r.fulfill({ path: C + 'three-r180/' + m[1], contentType: 'text/javascript' }) : r.abort(); });
    await p.route(/fonts\./, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    const load = async () => { await p.goto('file://' + path.resolve(page), { waitUntil: 'commit' }); await p.waitForFunction(() => window.__ready, null, { timeout: 300000 });
      await p.evaluate(() => { window.__hq && window.__hq(false); window.__loop && window.__loop(false); }); };
    await load(); await p.evaluate(() => { try { localStorage.clear(); } catch (e) { } });
    const tapAt = async (x, y) => { if (touch) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); await p.waitForTimeout(300); };
    const tapSel = async s => { const r = await p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; }, s); if (r) await tapAt(...r); return !!r; };
    const top = () => p.evaluate(() => window.__cam(...(innerWidth / innerHeight < .8 ? [[10, 38, -18.79], [10, 0, -18.8]] : [[10, 40, -19.49], [10, 0, -19.5]]), false));
    const scr = a => p.evaluate(a => window.__plan.toScreen(...a), a);
    const dragPx = async ([sx, sy], [ex, ey]) => { const steps = 8;
      if (touch) { const cdp = await ctx.newCDPSession(p); const t = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
        await t('touchStart', sx, sy); for (let i = 1; i <= steps; i++) { await t('touchMove', sx + (ex - sx) * i / steps, sy + (ey - sy) * i / steps); await p.waitForTimeout(40); } await t('touchEnd'); }
      else { await p.mouse.move(sx, sy); await p.mouse.down(); for (let i = 1; i <= steps; i++) { await p.mouse.move(sx + (ex - sx) * i / steps, sy + (ey - sy) * i / steps); await p.waitForTimeout(40); } await p.mouse.up(); }
      await p.waitForTimeout(300); };
    const drag = async (a, z) => dragPx(await scr(a), await scr(z));
    const shot = async tag => { const z = (await p.evaluate(() => window.__plan.wet())).zones[0]; if (!z) return; const cx = (z[0] + z[1]) / 2, cz = (z[2] + z[3]) / 2, hh = W / H < .8 ? 13 : 10;
      await p.evaluate(([cx, cz, h]) => window.__cam([cx, h, cz + 1.5], [cx, 0, cz - .2], false), [cx, cz, hh]); await p.evaluate(() => window.__frame()); await p.screenshot({ path: `${pre}-${n}-${tag}.png`, timeout: TMO });
      await top(); await p.evaluate(() => window.__frame()); await p.screenshot({ path: `${pre}-${n}-${tag}top.png`, timeout: TMO }); };
    await tapSel('#plan-b'); await top();
    ok(await tapSel('#plan button[data-a=wet]'), `${n}: 'wet canvas' button tapped`);
    const feet = await p.evaluate(() => window.__plan.feet()), clearAt = (x0, z0, w, d) => !feet.some(q => q[0] < x0 + w && q[1] > x0 && q[2] < z0 + d && q[3] > z0);
    let spot = null; for (let z = -8; z > -36 && !spot; z -= .5) for (let x = 3; x < 14 && !spot; x += .5) if (clearAt(x - 1.2, z - 1.2, 5.6, 4.6)) spot = [x, z];
    ok(!!spot, `${n}: open floor for the zone at ${JSON.stringify(spot)}`);
    await drag([spot[0] + .02, spot[1] + .02], [spot[0] + 3 - .02, spot[1] + 2 - .02]);
    let w = await p.evaluate(() => window.__plan.wet()); const z1 = w.zones[0];
    ok(w.zones.length === 1 && w.sel === 0 && z1 && Math.abs(z1[1] - z1[0] - 3) < .11 && Math.abs(z1[3] - z1[2] - 2) < .11, `${n}: zone drawn ${JSON.stringify(z1)} and picked`);
    const hasH = await p.evaluate(() => typeof window.__plan.wetHandles === 'function');
    if (!hasH) { await shot('pick'); log.push(`${n}: no P4b on this build, shots only`); await ctx.close(); continue; }
    const hs = await p.evaluate(() => window.__plan.wetHandles()); ok(hs && hs.length === 4, `${n}: four corner handles on the picked zone ${JSON.stringify(hs)}`);
    await shot('pick');
    // 2. move: drag from inside (not near a corner) by +1.0, −1.5 m
    const c0 = [(z1[0] + z1[1]) / 2, (z1[2] + z1[3]) / 2]; await drag([c0[0] - .3, c0[1] + .2], [c0[0] + .7, c0[1] - 1.3]);
    w = await p.evaluate(() => window.__plan.wet()); const z2 = w.zones[0], want2 = [z1[0] + 1, z1[1] + 1, z1[2] - 1.5, z1[3] - 1.5];
    ok(w.zones.length === 1 && near(z2, want2, .11), `${n}: real ${touch ? 'touch' : 'mouse'} drag inside moved it ${JSON.stringify(z1)} → ${JSON.stringify(z2)} (asked +1.0, −1.5 m)`);
    ok(z2 && Math.abs((z2[1] - z2[0]) - (z1[1] - z1[0])) < 1e-6 && Math.abs((z2[3] - z2[2]) - (z1[3] - z1[2])) < 1e-6, `${n}: same size after the move ${(z2[1] - z2[0]).toFixed(2)} × ${(z2[3] - z2[2]).toFixed(2)} m`);
    ok(z2 && z2.every(v => Math.abs(v * 10 - Math.round(v * 10)) < 1e-6), `${n}: still on the 10 cm grid`);
    // 3. resize: drag the (max x, max z) corner handle out 1.0 m and 0.5 m; the (min x, min z) corner stays
    const hs2 = await p.evaluate(() => window.__plan.wetHandles()); const hc = hs2[3];
    const [ex, ey] = await scr([z2[1] + 1, z2[3] + .5]), [hx, hy] = await scr([z2[1], z2[3]]); await dragPx([hc[0], hc[1]], [ex + (hc[0] - hx), ey + (hc[1] - hy)]);
    w = await p.evaluate(() => window.__plan.wet()); const z3 = w.zones[0], want3 = [z2[0], z2[1] + 1, z2[2], z2[3] + .5];
    ok(near(z3, want3, .11) && Math.abs(z3[0] - z2[0]) < 1e-6 && Math.abs(z3[2] - z2[2]) < 1e-6, `${n}: corner drag resized it ${JSON.stringify(z2)} → ${JSON.stringify(z3)}, opposite corner fixed`);
    ok(w.areas[0] && Math.abs(w.areas[0][0] - (z3[1] - z3[0]) * (z3[3] - z3[2])) < .01, `${n}: area follows: ${w.areas[0] && w.areas[0][0]} m² (${(z3[1] - z3[0]).toFixed(1)} × ${(z3[3] - z3[2]).toFixed(1)})`);
    let txt = await p.evaluate(() => document.getElementById('plan').textContent); ok(txt.includes((z3[1] - z3[0]).toFixed(1) + ' × ' + (z3[3] - z3[2]).toFixed(1)), `${n}: panel shows the new size: "${txt.slice(0, 80)}"`);
    await shot('sized');
    // 5. shrink under the minimum: drag the same corner past the opposite one: refused, zone unchanged
    const hs3 = await p.evaluate(() => window.__plan.wetHandles()); await dragPx([hs3[3][0], hs3[3][1]], await scr([z3[0] + .1, z3[2] + .1]));
    w = await p.evaluate(() => window.__plan.wet()); const z5 = w.zones[0];
    ok(z5 && z5[1] - z5[0] >= .3 - 1e-6 && z5[3] - z5[2] >= .3 - 1e-6, `${n}: can't shrink it under 0.3 m: ${JSON.stringify(z5)}`);
    // 4. shove it 40 m to the right: stops inside the walls, size kept
    const c5 = [(z5[0] + z5[1]) / 2, (z5[2] + z5[3]) / 2]; await drag([c5[0] - .2, c5[1] + .1], [c5[0] + 40, c5[1] + .1]);
    w = await p.evaluate(() => window.__plan.wet()); const z4 = w.zones[0], IN = await p.evaluate(() => window.__plan.inside && window.__plan.inside());
    ok(z4 && IN && z4[1] <= IN[1] + 1e-6 && z4[1] > IN[1] - .11 && Math.abs((z4[1] - z4[0]) - (z5[1] - z5[0])) < 1e-6, `${n}: shoved right it stops at the wall (${z4 && z4[1]} vs inside edge ${IN && IN[1]}), size kept`);
    // 6. saved, back after a reload
    const sv = await p.evaluate(() => window.__plan.saved()); ok(sv && Array.isArray(sv.__wet) && near(sv.__wet[0], z4, .006), `${n}: saved ${JSON.stringify(sv && sv.__wet)}`);
    await load(); w = await p.evaluate(() => window.__plan.wet()); ok(w.zones.length === 1 && near(w.zones[0], z4), `${n}: after a reload it's back ${JSON.stringify(w.zones[0])}`);
    res[n] = { spot, z1, z2, z3, z5, z4 };
    await ctx.close();
  }
  log.push('page errors: ' + JSON.stringify(errs)); if (errs.length) fail++;
  log.push('RESULT ' + (fail ? 'FAIL (' + fail + ')' : 'PASS')); log.push(JSON.stringify(res));
  fs.writeFileSync(pre + '-test.txt', log.join('\n') + '\n'); console.log(log.join('\n')); await b.close(); process.exit(fail ? 1 : 0);
})();
