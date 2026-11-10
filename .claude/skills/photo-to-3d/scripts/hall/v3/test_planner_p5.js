// Headless test of yard planner P5 (10 Nov 05:xx): baked floor shadows go with moved kit. Real touch drags on a phone, mouse on desk.
// For the sack truck (its own shadow sheet) and the workbench under a tarp (its share of a big yard-bay sheet): drag each into open floor,
// then look straight down (plan mode, nothing picked, labels hidden) at where it was and where it went and read the floor's mean brightness
// over its footprint + 25 cm. Run on the P5 build, and with --vs on the build before it, the same drags on both:
//   home  : before anything moves, P5 must look the same as before (|A − B| < 1.5 grey levels)
//   old   : the spot it left: brighter on P5 (its baked shadow no longer stays behind as a ghost), by > 2
//   new   : where it went: darker on P5 (its shadow came with it), by > 2
// On the P5 build alone: the drags land; after a reload the item and its shadow are still there; reset brings it home with no doubled shadow.
// usage: NODE_PATH=$(npm root -g) node test_planner_p5.js hall3.html <out prefix> [phone|desk] [--vs before.html]
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const C = process.env.HOME + '/.cache/jos3d/'; const argv = process.argv.slice(2), vi = argv.indexOf('--vs'), VS = vi >= 0 ? argv.splice(vi, 2)[1] : null;
const [page, pre, only] = [argv[0], argv[1] || 'p5', argv[2]];
const TMO = +process.env.SHOT_TIMEOUT || 300000;
const ITEMS = ['Sack truck', 'Workbench under a tarp'];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = [], log = []; let fail = 0; const ok = (c, m) => { log.push((c ? 'PASS ' : 'FAIL ') + m); if (!c) fail++; };
  const stat = await (await b.newContext()).newPage();   // decodes screenshots: mean luminance of screen rects
  const lum = async (buf, rects) => stat.evaluate(async ([b64, rects]) => { const im = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob()); const c = new OffscreenCanvas(im.width, im.height), x = c.getContext('2d'); x.drawImage(im, 0, 0);
    return rects.map(([x0, y0, x1, y1, hole]) => { x0 = Math.max(0, Math.round(x0)); y0 = Math.max(0, Math.round(y0)); x1 = Math.min(im.width, Math.round(x1)); y1 = Math.min(im.height, Math.round(y1)); if (x1 - x0 < 2 || y1 - y0 < 2) return null;
      const d = x.getImageData(x0, y0, x1 - x0, y1 - y0).data, w = x1 - x0; let s = 0, n = 0; for (let i = 0; i < d.length; i += 4) { const px = x0 + (i / 4) % w, py = y0 + Math.floor(i / 4 / w); if (hole && px > hole[0] && px < hole[2] && py > hole[1] && py < hole[3]) continue; s += .2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2]; n++; } return n ? s / n : null; }); }, [buf.toString('base64'), rects]);
  const L = {};   // L[build][view][item] = { home, old, new, reset, reload }
  for (const [bk, file] of [['A', page], ...(VS ? [['B', VS]] : [])]) for (const [n, W, H, touch] of [['phone', 390, 844, true], ['desk', 1200, 800, false]].filter(s => !only || s[0] === only)) {
    const T = (L[bk] = L[bk] || {})[n] = {};
    const ctx = await b.newContext({ viewport: { width: W, height: H }, hasTouch: touch, isMobile: touch }); const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(bk + ' ' + n + ': ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(bk + ' ' + n + ': ' + m.text()); });
    await p.route(/cdn\.jsdelivr\.net/, r => { const m = r.request().url().match(/three@[^/]+\/(.*)$/); return m ? r.fulfill({ path: C + 'three-r180/' + m[1], contentType: 'text/javascript' }) : r.abort(); });
    await p.route(/fonts\./, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    const load = async () => { await p.goto('file://' + path.resolve(file), { waitUntil: 'commit' }); await p.waitForFunction(() => window.__ready, null, { timeout: 300000 });
      await p.evaluate(() => { window.__hq && window.__hq(false); window.__loop && window.__loop(false); }); };
    await load(); await p.evaluate(() => { try { localStorage.clear(); } catch (e) { } }); await load();
    if (bk === 'A' && await p.evaluate(() => typeof window.__p5 === 'function')) log.push(`A ${n}: P5 ${JSON.stringify(await p.evaluate(() => window.__p5()))}`);
    const tapAt = async (x, y) => { if (touch) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); await p.waitForTimeout(300); };
    const tapSel = async s => { const r = await p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; }, s); if (r) await tapAt(...r); return !!r; };
    const top = () => p.evaluate(() => window.__cam(...(innerWidth / innerHeight < .8 ? [[10, 38, -18.79], [10, 0, -18.8]] : [[10, 40, -19.49], [10, 0, -19.5]]), false));
    const scr = a => p.evaluate(a => window.__plan.toScreen(...a), a);
    const dragPx = async ([sx, sy], [ex, ey]) => { const steps = 10;
      if (touch) { const cdp = await ctx.newCDPSession(p); const t = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
        await t('touchStart', sx, sy); for (let i = 1; i <= steps; i++) { await t('touchMove', sx + (ex - sx) * i / steps, sy + (ey - sy) * i / steps); await p.waitForTimeout(40); } await t('touchEnd'); }
      else { await p.mouse.move(sx, sy); await p.mouse.down(); for (let i = 1; i <= steps; i++) { await p.mouse.move(sx + (ex - sx) * i / steps, sy + (ey - sy) * i / steps); await p.waitForTimeout(40); } await p.mouse.up(); }
      await p.waitForTimeout(300); };
    // look straight down at a floor rect (plan mode, nothing picked, roof off, labels hidden), high enough to see 1 m round it;
    // returns mean lum of rect+25 cm (spot) and of the bare slab band 0.6–1.0 m out (bare)
    const look = async (r, tag) => { const cx = (r[0] + r[1]) / 2, cz = (r[2] + r[3]) / 2, hw = (r[1] - r[0]) / 2 + 1.3, hd = (r[3] - r[2]) / 2 + 1.3;
      await p.evaluate(([cx, cz, hw, hd]) => { window.__plan.on(true); const a = innerWidth / innerHeight, t = Math.tan((innerWidth / innerHeight < .8 ? 70 : 55) * Math.PI / 360), h = Math.max(3.2, hd / t, hw / (t * a));
        window.__cam([cx, h, cz + .001], [cx, 0, cz], false); document.querySelectorAll('#labels, #pmlabs, #plan, #card').forEach(e => e.style.visibility = 'hidden'); window.__frame(); }, [cx, cz, hw, hd]);
      const buf = await p.screenshot({ timeout: TMO }); if (tag) fs.writeFileSync(`${pre}-${bk}-${n}-${tag}.png`, buf);
      const box = async (m) => { const a = await scr([r[0] - m, r[2] - m]), c = await scr([r[1] + m, r[3] + m]); return [Math.min(a[0], c[0]), Math.min(a[1], c[1]), Math.max(a[0], c[0]), Math.max(a[1], c[1])]; };
      const inner = await box(.25), ring0 = await box(.6), ring1 = await box(1.0);
      const [spot, bare] = await lum(buf, [[...inner, null], [...ring1, ring0]]);
      await p.evaluate(() => document.querySelectorAll('#labels, #pmlabs, #plan, #card').forEach(e => e.style.visibility = '')); return { spot, bare }; };
    for (const name of ITEMS) { const key = name.split(' ')[0].toLowerCase(), R = T[name] = {};
      const r0 = await p.evaluate(nm => window.__plan.rect(nm), name); const w = r0[1] - r0[0], d = r0[3] - r0[2];
      R.home = (await look(r0, `${key}-home`)).spot;   // before anything moves
      const feet = await p.evaluate(() => window.__plan.feet()), clearAt = (x0, z0, ww, dd) => x0 > .3 && x0 + ww < 19.7 && z0 > -38.8 && z0 + dd < -.3 && !feet.some(q => q[0] < x0 + ww && q[1] > x0 && q[2] < z0 + dd && q[3] > z0);
      const hx = (r0[0] + r0[1]) / 2, hz = (r0[2] + r0[3]) / 2, cand = [];   // open floor with 60 cm clear round it, fully off its home spot, mostly up/down the screen so a phone shows both ends
      for (let z = -38; z < -1; z += .1) for (let x = .5; x < 19.5; x += .1) { const dx = x + w / 2 - hx, dz = z + d / 2 - hz, dd = Math.hypot(dx, dz); if (dd < Math.max(w, d) + 1.0 || dd > 14) continue; cand.push([4 * dx * dx + dz * dz, x, z]); }
      cand.sort((a, b) => a[0] - b[0]); let spot = null; for (const [, x, z] of cand) if (clearAt(x - .6, z - .6, w + 1.2, d + 1.2)) { spot = [Math.round(x * 10) / 10, Math.round(z * 10) / 10]; break; }
      ok(!!spot, `${bk} ${n}: open floor for the ${name} at ${JSON.stringify(spot)}`); if (!spot) continue;
      const mx = (hx + spot[0] + w / 2) / 2, mz = (hz + spot[1] + d / 2) / 2;   // plan mode, camera over the middle of the trip, so the item is clear of the panel and the bar
      await p.evaluate(([mx, mz]) => { window.__plan.on(true); window.__cam([mx, 20, mz + .01], [mx, 0, mz], false); window.__frame(); }, [mx, mz]);
      await dragPx(await scr([hx, hz]), await scr([spot[0] + w / 2, spot[1] + d / 2]));
      const r1 = R.rect = await p.evaluate(nm => window.__plan.rect(nm), name), moved = Math.hypot((r1[0] + r1[1] - r0[0] - r0[1]) / 2, (r1[2] + r1[3] - r0[2] - r0[3]) / 2);
      ok(moved > Math.max(w, d) + .5, `${bk} ${n}: real ${touch ? 'touch' : 'mouse'} drag moved the ${name} ${moved.toFixed(2)} m to ${JSON.stringify(r1)}`);
      R.old = (await look(r0, `${key}-oldspot`)).spot; R.new = (await look(r1, `${key}-newspot`)).spot; R.r0 = r0; }
    if (bk === 'A') {   // saved layout: reload, still there with its shadow; reset: home with no doubled shadow
      await load(); const nm = ITEMS[1], R = T[nm];
      if (R && R.rect) { const rr = await p.evaluate(nm => window.__plan.rect(nm), nm); ok(rr && rr.every((v, i) => Math.abs(v - R.rect[i]) < .01), `A ${n}: after a reload the ${nm} is still at ${JSON.stringify(rr)}`);
        R.reload = (await look(rr, 'workbench-reload')).spot; ok(Math.abs(R.reload - R.new) < 1.5, `A ${n}: after a reload its floor reads the same as straight after the move (${R.reload.toFixed(1)} vs ${R.new.toFixed(1)})`);
        await p.evaluate(() => window.__plan.reset()); R.reset = (await look(R.r0, 'workbench-reset')).spot; ok(Math.abs(R.reset - R.home) < 1.5, `A ${n}: reset: home reads ${R.reset.toFixed(1)} vs ${R.home.toFixed(1)} before anything moved (no doubled shadow, no hole)`); } }
    await ctx.close(); }
  if (VS) for (const n of Object.keys(L.A)) for (const name of ITEMS) { const a = L.A[n][name], b = L.B[n] && L.B[n][name]; if (!a || !b || a.old == null || b.old == null) continue;
    ok(Math.abs(a.home - b.home) < 1.5, `${n}: ${name}: home view unchanged by P5 before anything moves (${a.home.toFixed(1)} vs ${b.home.toFixed(1)})`);
    ok(a.old - b.old > 2, `${n}: ${name}: the spot it left is ${(a.old - b.old).toFixed(1)} brighter than before P5 (no ghost shadow left behind)`);
    ok(b.new - a.new > 2, `${n}: ${name}: where it went is ${(b.new - a.new).toFixed(1)} darker than before P5 (its shadow came with it)`); }
  ok(!errs.length, `page errors ${JSON.stringify(errs)}`);
  const num = JSON.stringify(L, (k, v) => typeof v === 'number' ? +v.toFixed(2) : v);
  const out = [...log, 'numbers ' + num].join('\n'); console.log(out); fs.writeFileSync(`${pre}-result.txt`, out + `\n${fail ? 'FAIL' : 'PASS'} (${fail} failed)\n`);
  console.log(fail ? `FAIL (${fail})` : 'PASS'); await b.close(); process.exit(fail ? 1 : 0); })();
