// P8 (10 Nov 23:xx): test_planner_p7.js with the panel folded on a phone: the red why-line names side, what and why without repeating the number
// ('drive past' for the forklift), the phone panel stays short (bottom px logged and capped), and a real tap on 'more' opens the 'to …' line, a second folds it.
// P7 (10 Nov 07:xx): test_planner_p6.js plus: when the picked item has a red gap (not flush), the panel says which, to what and why.
// P6 labels (10 Nov 06:xx): test_planner.js plus a check that no gap label covers the picked item's on-screen box and no two labels overlap.
// Headless test of the yard planner (P1, 9 Nov): turn 'plan' on, drag a crate with the mouse (desktop) and with a real touch (phone, CDP touch
// events), read the aisle gaps, then try to shove the forklift into the workshop and check nothing overlaps. Shots: <prefix>-<size>-plan*.png
// usage: NODE_PATH=$(npm root -g) node test_planner.js hall3.html <out prefix> [phone|desk]
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const C = process.env.HOME + '/.cache/jos3d/'; const [page, pre, only] = [process.argv[2], process.argv[3] || 'plan', process.argv[4]];
const TMO = +process.env.SHOT_TIMEOUT || 300000;
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = [], log = [], res = {}; let fail = 0; const ok = (c, m) => { log.push((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
  for (const [n, W, H, touch] of [['phone', 390, 844, true], ['desk', 1200, 800, false]].filter(s => !only || s[0] === only)) {
    const ctx = await b.newContext({ viewport: { width: W, height: H }, hasTouch: touch, isMobile: touch }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(n + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(n + ': ' + m.text()); });
    await p.route(/cdn\.jsdelivr\.net/, r => { const m = r.request().url().match(/three@[^/]+\/(.*)$/); return m ? r.fulfill({ path: C + 'three-r180/' + m[1], contentType: 'text/javascript' }) : r.abort(); });
    await p.route(/fonts\./, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await p.goto('file://' + path.resolve(page), { waitUntil: 'commit' }); await p.waitForFunction(() => window.__ready, null, { timeout: 300000 });
    await p.evaluate(() => { window.__hq(false); window.__loop(false); });   // input goes in between frames; one frame drawn before each shot
    { const r = await p.evaluate(() => { const b = document.getElementById('plan-b').getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; }); if (touch) await p.touchscreen.tap(...r); else await p.mouse.click(...r); }   // a real tap / click on the button (locator clicks time out: SwiftShader frames are too slow for Playwright's checks)
    await p.waitForTimeout(300); ok(await p.evaluate(() => document.getElementById('plan-b').classList.contains('on')), `${n}: the plan button turns plan on`);   // the button itself, then the fly to the plan view
    const h = W / H < .8 ? 38 : 40, zc = W / H < .8 ? -18.8 : -19.5; await p.evaluate(([h, zc]) => window.__cam([10, h, zc + .01], [10, 0, zc], false), [h, zc]);   // same as planOn()
    ok(await p.evaluate(() => window.__plan.items().length) >= 20, `${n}: ${await p.evaluate(() => window.__plan.items().length)} pieces of floor kit can be dragged`);
    ok((await p.evaluate(() => window.__plan.overlaps())).length === 0, `${n}: nothing overlaps at the start`);
    await p.evaluate(() => window.__frame()); await p.screenshot({ path: `${pre}-${n}-plan0.png`, timeout: TMO });
    // 1. drag the GY ply crate 2 m towards the door-side aisle and 1.5 m right
    const name = 'Plywood crate (GY badge)', r0 = await p.evaluate(n => window.__plan.rect(n), name), [sx, sy] = await p.evaluate(n => window.__plan.screen(n), name);
    const px = await p.evaluate(() => { const a = window.__plan.screen('Plywood crate'); return a; });
    const mpp = await p.evaluate(h => (2 * (h - 1) * Math.tan((innerWidth / innerHeight < .8 ? 70 : 55) * Math.PI / 360)) / innerHeight, h);   // metres per pixel at the floor
    const steps = 8, dx = 1.5 / mpp, dy = 2.0 / mpp;
    if (touch) { const cdp = await ctx.newCDPSession(p); const t = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
      await t('touchStart', sx, sy); for (let i = 1; i <= steps; i++) { await t('touchMove', sx + dx * i / steps, sy + dy * i / steps); await p.waitForTimeout(60); } await t('touchEnd'); }
    else { await p.mouse.move(sx, sy); await p.mouse.down(); for (let i = 1; i <= steps; i++) { await p.mouse.move(sx + dx * i / steps, sy + dy * i / steps); await p.waitForTimeout(60); } await p.mouse.up(); }
    await p.waitForTimeout(500);
    const r1 = await p.evaluate(n => window.__plan.rect(n), name), g1 = await p.evaluate(() => window.__plan.gaps()), sel = await p.evaluate(() => window.__plan.sel());
    const mv = [r1[0] - r0[0], r1[2] - r0[2]]; res[n] = { r0, r1, moved: mv.map(v => +v.toFixed(2)), gaps: g1, sel };
    ok(sel === name && Math.abs(mv[0] - 1.5) < .35 && Math.abs(mv[1] - 2.0) < .35, `${n}: ${touch ? 'touch' : 'mouse'} drag moved the crate ${mv.map(v => v.toFixed(2)).join(', ')} m (asked 1.5, 2.0)`);
    ok(Math.abs(r1[0] / .1 - Math.round(r1[0] / .1)) < .01 && Math.abs(r1[2] / .1 - Math.round(r1[2] / .1)) < .01, `${n}: snapped to 10 cm (x0 ${r1[0]}, z0 ${r1[2]})`);
    ok(g1 && g1.length === 4 && g1.every(v => v >= 0), `${n}: aisle gaps left/right/far/door ${JSON.stringify(g1)} m`);
    // check one gap by hand: the right-hand gap = nearest thing to its right in its z band (or the wall)
    const want = await p.evaluate(n => { const B = window.__boxes(), r = window.__plan.rect(n); let best = 19.92 - r[1];
      for (const [nm, ax, ay, az, bx, by, bz] of B) { if (nm === n || nm === 'The hall' || !isFinite(ax) || by < .05) continue; if (az < r[3] - .015 && bz > r[2] + .015 && ax >= r[1] - .02) best = Math.min(best, Math.max(0, ax - r[1])); } return +best.toFixed(2); }, name);
    ok(Math.abs(want - g1[1]) < .03, `${n}: right-hand gap ${g1[1]} m matches a separate measure from the boxes (${want} m)`);
    await p.evaluate(() => window.__frame());
    const lab = await p.evaluate(() => [...document.querySelectorAll('.pm')].filter(d => d.style.display !== 'none').map(d => d.textContent));
    const clash = await p.evaluate(() => { const bar = Math.min(...[...document.querySelectorAll('.bar button')].map(e => e.getBoundingClientRect().top)); return [...document.querySelectorAll('.pm')].filter(d => d.style.display !== 'none' && d.getBoundingClientRect().bottom > bar).map(d => d.textContent); });
    ok(!clash.length, `${n}: no gap label under the button bar ${JSON.stringify(clash)}`);
    ok(lab.length >= 2, `${n}: gap labels on screen: ${lab.join(', ')}`);
        { const c = await p.evaluate(() => { const r = document.querySelector('.pmring'), L = [...document.querySelectorAll('.pm')].filter(d => d.style.display !== 'none' && !d.classList.contains('wz')).map(d => [d.textContent, d.getBoundingClientRect()]);
        if (!r || r.style.display === 'none') return { ring: false }; const R = r.getBoundingClientRect(), ov = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        return { ring: true, ringPx: [Math.round(R.width), Math.round(R.height)], onItem: L.filter(l => ov(l[1], R)).map(l => l[0]), pairs: L.flatMap((a, i) => L.slice(i + 1).filter(b => ov(a[1], b[1])).map(b => a[0] + '/' + b[0])) }; });
      ok(c.ring && !c.onItem.length && !c.pairs.length, `${n}: plan1 outline drawn ${JSON.stringify(c.ringPx)} px; labels on the item ${JSON.stringify(c.onItem)}; labels on each other ${JSON.stringify(c.pairs)}`); }
    { const w = await p.evaluate(() => { const g = window.__plan.gaps(), t = document.querySelector('#plan small.bad'), S = ['left', 'right', 'far side', 'door side'];
        const red = g.map((v, i) => [v, i]).filter(q => q[0] >= .02 && q[0] < .9).sort((a, b) => a[0] - b[0]); return { red: red.map(q => q[0]), side: red.length ? S[red[0][1]] : null, why: t ? t.textContent : null }; });
      ok(w.red.length ? !!w.why && w.why.toLowerCase().startsWith(w.side + ' gap') && /too tight to walk kit through/.test(w.why) && !w.why.includes(w.red[0].toFixed(2)) : !w.why, `${n}: plan1 red gaps ${JSON.stringify(w.red)}; panel says ${JSON.stringify(w.why)} (side, what, why; number not said twice)`); }
    { const ph = await p.evaluate(() => Math.round(document.getElementById('plan').getBoundingClientRect().bottom)); res[n]['plan1PanelBottom'] = ph;
      ok(!touch || ph <= 0.27 * H, `${n}: plan1 panel bottom at ${ph} px of ${H} (${touch ? 'phone cap ' + Math.round(.27 * H) : 'desk: no cap, panel stays open'})`); }
    await p.evaluate(() => window.__frame()); await p.screenshot({ path: `${pre}-${n}-plan1.png`, timeout: TMO });
    { const tap = async () => { const r = await p.evaluate(() => { const b = document.querySelector('#plan button[data-a=more]'); if (!b) return null; const q = b.getBoundingClientRect(); return [q.x + q.width / 2, q.y + q.height / 2]; });
        if (!r) return false; if (touch) await p.touchscreen.tap(...r); else await p.mouse.click(...r); await p.waitForTimeout(200); return true; };
      const st = () => p.evaluate(() => ({ to: !!document.querySelector('#plan small.to'), h: Math.round(document.getElementById('plan').getBoundingClientRect().bottom) }));
      const s0 = await st(); const t1 = await tap(); const s1 = await st(); await p.evaluate(() => window.__frame()); await p.screenshot({ path: `${pre}-${n}-plan1more.png`, timeout: TMO }); const t2 = await tap(); const s2 = await st();
      ok(t1 && t2 && s0.to === !touch && s1.to === touch && s2.to === s0.to && (touch ? s1.h > s0.h : s1.h < s0.h), `${n}: 'more' ${touch ? 'opens' : 'folds'} the 'to …' line and back (${s0.h} → ${s1.h} → ${s2.h} px)`); }
    // 2. shove the forklift hard left into the workshop wall: it must stop against it, nothing overlapping
    const f0 = await p.evaluate(() => window.__plan.rect('Forklift')), [fx, fy] = await p.evaluate(() => window.__plan.screen('Forklift'));
    await p.mouse.move(fx, fy); await p.mouse.down(); for (let i = 1; i <= 10; i++) { await p.mouse.move(fx - (8 / mpp) * i / 10, fy); await p.waitForTimeout(40); } await p.mouse.up();
    await p.waitForTimeout(400);
    const f1 = await p.evaluate(() => window.__plan.rect('Forklift')), ov = await p.evaluate(() => window.__plan.overlaps());
    ok(f1[0] < f0[0] - .5 && ov.length === 0, `${n}: forklift pushed left ${(f0[0] - f1[0]).toFixed(2)} m and stopped; overlaps ${JSON.stringify(ov)}`);
    const fg = await p.evaluate(() => window.__plan.gaps()); ok(fg[0] < .1 + .02, `${n}: forklift stopped flush against what's on its left (gap ${fg[0]} m, x0 ${f1[0]})`);
    await p.evaluate(() => window.__frame()); const clash2 = await p.evaluate(() => { const bar = Math.min(...[...document.querySelectorAll('.bar button')].map(e => e.getBoundingClientRect().top)); return [...document.querySelectorAll('.pm')].filter(d => d.style.display !== 'none' && d.getBoundingClientRect().bottom > bar).map(d => d.textContent); });
    ok(!clash2.length, `${n}: forklift's gap labels clear of the button bar ${JSON.stringify(clash2)}`);
    res[n].forklift = { f0, f1 };
        { const c = await p.evaluate(() => { const r = document.querySelector('.pmring'), L = [...document.querySelectorAll('.pm')].filter(d => d.style.display !== 'none' && !d.classList.contains('wz')).map(d => [d.textContent, d.getBoundingClientRect()]);
        if (!r || r.style.display === 'none') return { ring: false }; const R = r.getBoundingClientRect(), ov = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        return { ring: true, ringPx: [Math.round(R.width), Math.round(R.height)], onItem: L.filter(l => ov(l[1], R)).map(l => l[0]), pairs: L.flatMap((a, i) => L.slice(i + 1).filter(b => ov(a[1], b[1])).map(b => a[0] + '/' + b[0])) }; });
      ok(c.ring && !c.onItem.length && !c.pairs.length, `${n}: plan2 outline drawn ${JSON.stringify(c.ringPx)} px; labels on the item ${JSON.stringify(c.onItem)}; labels on each other ${JSON.stringify(c.pairs)}`); }
    { const w = await p.evaluate(() => { const g = window.__plan.gaps(), t = document.querySelector('#plan small.bad'), S = ['left', 'right', 'far side', 'door side'];
        const red = g.map((v, i) => [v, i]).filter(q => q[0] >= .02 && q[0] < .9).sort((a, b) => a[0] - b[0]); return { red: red.map(q => q[0]), side: red.length ? S[red[0][1]] : null, why: t ? t.textContent : null }; });
      ok(w.red.length ? !!w.why && w.why.toLowerCase().startsWith(w.side + ' gap') && /too tight to drive past/.test(w.why) && !w.why.includes(w.red[0].toFixed(2)) : !w.why, `${n}: plan2 red gaps ${JSON.stringify(w.red)}; panel says ${JSON.stringify(w.why)} (side, what, why; number not said twice)`); }
    { const ph = await p.evaluate(() => Math.round(document.getElementById('plan').getBoundingClientRect().bottom)); res[n]['plan2PanelBottom'] = ph;
      ok(!touch || ph <= 0.27 * H, `${n}: plan2 panel bottom at ${ph} px of ${H} (${touch ? 'phone cap ' + Math.round(.27 * H) : 'desk: no cap, panel stays open'})`); }
    await p.evaluate(() => window.__frame()); await p.screenshot({ path: `${pre}-${n}-plan2.png`, timeout: TMO });
    await ctx.close();
  }
  log.push('page errors: ' + JSON.stringify(errs)); if (errs.length) fail++;
  log.push('RESULT ' + (fail ? 'FAIL (' + fail + ')' : 'PASS')); log.push(JSON.stringify(res));
  fs.writeFileSync(pre + '-test.txt', log.join('\n') + '\n'); console.log(log.join('\n')); await b.close(); process.exit(fail ? 1 : 0);
})();
