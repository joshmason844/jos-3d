// Headless shots of the WW page (hall3.html): phone 390×844 + desktop 1200×800, same cameras every time.
// usage: NODE_PATH=$(npm root -g) node shoot.js hall3.html <out prefix> [views] [phone|desk]
//   views: comma list of names below (default: door,up,roofclose,far). Writes <prefix>-<size>-<view>.png and <prefix>-console.txt
// One browser, one page load per size, all views shot from it (a load is the slow part, ~30 s under SwiftShader).
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const C = process.env.HOME + '/.cache/jos3d/';
const [page, pre, only, sizeOnly] = [process.argv[2], process.argv[3] || 'shot', process.argv[4], process.argv[5]];
const sizes = [['phone', 390, 844], ['desk', 1200, 800]].filter(s => !sizeOnly || s[0] === sizeOnly);
const VIEWS = { // [[cam], [target], roof visible]. Keep the target BELOW the camera: OrbitControls' maxPolarAngle (.495π) lifts a camera that looks up to the target's height
  door: 'door',                                              // the page's own walk-in view
  far: 'far',
  top: 'top',
  up: [[10, 2.6, -6], [10, 2.5, -30], true],                 // mid-aisle, eye a bit high, looking down the hall: roof fills the top half
  roofclose: [[11, 5.4, -14], [17, 5.3, -21], true],         // up close under the right-hand slope: sheets, purlins, a roof light, a high-bay
  floorclose: [[11, 1.4, -6], [13, 0, -10], true],
  wallleft: [[8, 3.4, -17], [0.5, 3.2, -25], true],          // left wall past the workshop, above the stillages: cladding, girts, posts
  wallfar: [[12, 3.6, -26], [9, 3.4, -39], true],            // the far gable end
  wallclose: [[4.2, 4.6, -27], [0, 4.4, -30.5], true],       // close on the left wall's upper cladding: profile, laps, fixings
  rackrun: [[14.5, 2.6, -0.8], [18.4, 1.5, -9], true],        // down the yard-bay orange racking from the door corner
  rackclose: [[16.6, 1.8, -4.6], [18.4, 1.1, -6.3], true],    // one upright of the orange run: beam ends, frame bracing, base plate
  rackhigh: [[17.2, 3.25, -10.3], [18.4, 2.95, -11.43], true], // the top beam's connector on an upright
  yellowclose: [[9.4, 2.4, -6.2], [7.2, 1.6, -8.0], true],    // the yellow racking on the workshop's outside wall
  cratefront: [[8.6, 1.9, -24.6], [7.6, 1.2, -28.0], true],   // the 14 ft crown crate fronts, mid-hall: labels, badge, check-sheet window
  crateclose: [[7.6, 0.95, -26.6], [7.1, 0.55, -27.9], true],  // close on one cover's lower front + side: weave, seams, hem, straps
  cratetop: [[9.2, 3.9, -25.6], [8.1, 2.9, -28.2], true],      // looking down on the stack tops: seams, sag, dust
  planters: [[14.6, 2.0, -5.9], [18.4, 1.45, -5.9], true],      // the yard-bay racking bays 2–3 from the aisle: planter pairs on levels 1–2
  planterclose: [[16.9, 1.25, -4.4], [18.4, .8, -5.6], true],   // close on one planter pair: ribs, trim, strap, ratchet, pallet
  bayfar: [[14.4, 2.1, -11.3], [18.4, 1.55, -11.3], true],      // yard-bay bays 1–2 from the far end (z −14.2…−8.63), levels 1–3
  baydoor: [[14.9, 2.3, -5.4], [18.4, 1.5, -1.8], true],     // yard-bay bay 5 by the door (z −3.13…−0.35)
  stockclose: [[16.9, 1.3, -9.0], [18.4, .75, -10.4], true],    // close on bay 2's lower shelf: what's stacked on it
  doorbay: [[16.4, 2.2, -5.6], [16.6, 1.5, -1.2], true],       // the door-wall orange bay (x 15.2–18.1), seen from the hall
  yellowback: [[16.0, 2.3, -10.6], [16.0, 1.5, -15.4], true],   // the yellow run across the back of the yard bay (x 13.6–18.5)
  backclose: [[15.3, 1.35, -12.9], [15.0, .8, -15.1], true],    // close on its lower shelf
  wsfront: [[10.4, 2.0, -2.0], [6.0, 1.3, -3.4], true],     // the workshop's aisle wall at the door end, from across the aisle: OSB, window, door
  wsclose: [[7.5, 1.55, -3.3], [6.0, 1.15, -4.9], true],     // close on the workshop's aisle wall: OSB sheets, joints, screws, the door
  wsend: [[8.8, 2.0, -14.2], [6.0, 1.5, -11.4], true],       // the far end of the workshop wall past the yellow racking, sewing-room wall above
  toolwall: [[12.2, 2.7, -8.05], [7.2, 2.3, -8.05], true],    // the yellow racking on the workshop wall, whole run from across the aisle
  toolhigh: [[9.8, 3.9, -6.6], [6.9, 3.5, -9.2], true],      // its top two levels
  toolclose: [[8.7, 1.25, -8.4], [7.0, .75, -10.1], true],   // close on its lower shelves, far bay
  canvasclose:[[3.4, 1.5, -20.0], [1.0, 1.0, -21.6], true],   // the red 14 ft canvas covers on the left wall
  sidedoor: [[12.0, 2.0, -6.8], [14.2, 1.3, 0.0], true],     // the door wall's side door (x 13.2–15.1) and the floor-panel pile in front of it
  panelclose:[[12.4, 1.5, -5.2], [14.0, .7, -3.45], true],   // close on the floor-panel pile
  mezz: [[12.6, 3.6, -1.6], [5.0, 3.5, -8.0], true],          // the workshop and the sewing room on top, from across the aisle by the door
  leftstacks:[[10.5, 3.6, -13.6], [3.6, 1.4, -21.6], true],  // the left-side stacks at z −18…−26 from the aisle: wall stillages, the cling-filmed stillage stacks
  leftside: [[9.2, 2.2, -21.0], [3.0, 1.6, -21.0], true],    // square on to them from mid-aisle
  leftclose: [[7.6, 1.6, -20.9], [4.6, 1.1, -22.4], true],   // close on the stack ends and the gap between them
  leftrack: [[5.2, 3.5, -14.9], [1.0, 2.5, -18.2], true],    // the left-wall racking bay at z −16.65…−19.4, from the aisle over the safari crates (17 Oct 03:xx)
  leftrackhi:[[3.9, 2.6, -16.0], [1.0, 3.6, -18.4], true],   // up close under its top two levels
  leftfar: [[6.4, 2.3, -24.0], [1.6, 1.2, -26.6], true],     // the pale sheeted block at z −25.1…−28.3 and the red pole stillages by it
};
const want = only ? only.split(',') : ['door', 'up', 'roofclose', 'far'];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = [], log = [];
  for (const [n, W, H] of sizes) {
    const p = await b.newPage({ viewport: { width: W, height: H } });
    p.on('pageerror', e => errs.push(n + ': ' + e.message));
    p.on('console', m => { log.push(n + ' ' + m.type() + ': ' + m.text()); if (m.type() === 'error' && !/ERR_FAILED/.test(m.text())) errs.push(n + ': ' + m.text()); });
    await p.route(/cdn\.jsdelivr\.net/, r => { const m = r.request().url().match(/three@[^/]+\/(.*)$/); return m ? r.fulfill({ path: C + 'three-r180/' + m[1], contentType: 'text/javascript' }) : r.abort(); });
    await p.route(/fonts\./, r => r.abort());
    const t0 = Date.now();
    const died = new Promise((_, no) => p.on('pageerror', e => no(new Error(n + ' page error before ready: ' + e.message))));   // fail fast instead of a 300 s timeout
    await p.goto('file://' + path.resolve(page), { waitUntil: 'commit' }); await Promise.race([p.waitForFunction(() => window.__ready, null, { timeout: 300000 }), died]);
    log.push(`${n}: ready in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    for (const v of want) {
      const V = VIEWS[v];
      if (typeof V === 'string') { await p.evaluate(k => window.__view(k), V); await p.waitForTimeout(1800); }
      else await p.evaluate(a => window.__cam(...a), V);
      await p.waitForTimeout(700);
      await p.screenshot({ path: `${pre}-${n}-${v}.png`, timeout: 300000 });
    }
    await p.close();
  }
  log.push('page errors: ' + JSON.stringify(errs));
  fs.writeFileSync(pre + '-console.txt', log.join('\n') + '\n');
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
