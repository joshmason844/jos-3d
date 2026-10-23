// ===== Main hall v3: one clean model, everything in its place (metres) =====
// Frame: the roller door is at z = 0 and the hall runs to z = -39. x runs 0 (left wall as you walk in) to 20 (right wall). y up.
// Front of every stack faces the aisle. Built from Josh's 60 photos and 2 walk-round videos; sizes from crates (1.2 × 1.0 m), stillages (2.32 × 1.35 m) and the forklift (2.16 m guard).
const HW = 20, HL = 39, EAVE = 6.0, RIDGE = 7.7, BAY = 6.5, DOOR = { x0: 6.85, x1: 12.35, h: 5.5 }, SIDE = { x0: 13.2, x1: 15.1, h: 2.2 };   // SIDE: the door wall's side door, LiDAR (15 Oct): x 13.2–15.1, daylight through it; head ≈ 2.2 m (down-facing face in the scan)
const LEFT = Math.PI / 2, RIGHT = -Math.PI / 2, FAR = 0;   // ry that turns a stack's front to face the aisle from the left wall / right wall / far wall
const SPARE = new THREE.Group();   // never added to the scene: old builds whose random draws must still be taken so the seeded layout after them stays put
const ZONES = [];                                          // { name, items: [groups] } for the zone buttons
let ZONE = null; const zone = name => { ZONE = { name, items: [] }; ZONES.push(ZONE); };
const T = (obj, name, what, size, sure = 'sure') => { tag(obj, name, what, size, [], sure); if (ZONE) ZONE.items.push(obj); return obj; };

// ---------------- materials ----------------
// Stretch-wrap film: one shared 512² map + alpha map, own RNG (the layout seed must not move). Front faces only, so a pile is wrapped once, not twice.
function filmMat(top) { let q = top ? 57 : 91; const r = () => (q = (q * 16807) % 2147483647) / 2147483647;
  const draw = alphaOnly => (x, w, h) => {
    x.fillStyle = alphaOnly ? 'rgb(112,112,112)' : '#dfe4e6'; x.fillRect(0, 0, w, h);                       // ≈ 44 % milky: several turns of film over each other
    if (!top) { let y = -20; while (y < h) { const bh = 38 + r() * 120, tilt = (r() - .5) * 60;             // wound bands, uneven, each overlapping the last
      x.fillStyle = alphaOnly ? `rgba(255,255,255,${.12 + r() * .18})` : `rgba(255,255,255,${.2 + r() * .25})`;
      x.beginPath(); x.moveTo(0, y); x.lineTo(w, y + tilt); x.lineTo(w, y + tilt + 10 + r() * 22); x.lineTo(0, y + 8 + r() * 22); x.fill();   // overlap strip
      x.strokeStyle = alphaOnly ? `rgba(255,255,255,${.25 + r() * .3})` : 'rgba(255,255,255,.7)'; x.lineWidth = .8 + r(); x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(w * .33, y + tilt * .2 + (r() - .5) * 14, w * .66, y + tilt * .8 + (r() - .5) * 14, w, y + tilt); x.stroke();   // band edge, a little wavy
      y += bh; } }
    for (let i = 0; i < (top ? 40 : 70); i++) { const y0 = r() * h, x0 = r() * w, L = 40 + r() * 160, a = top ? r() * 6.3 : (r() - .5) * .3;   // stretch creases (any way on the top)
      x.strokeStyle = alphaOnly ? `rgba(255,255,255,${.2 + r() * .35})` : `rgba(255,255,255,${.35 + r() * .4})`; x.lineWidth = .6 + r() * 1.6;
      x.beginPath(); x.moveTo(x0, y0); let px = x0, py = y0; for (let k = 1; k <= 6; k++) { px += Math.cos(a) * L / 6 + (r() - .5) * 5; py += Math.sin(a) * L / 6 + (r() - .5) * 6; x.lineTo(px, py); } x.stroke(); }
    for (let i = 0; i < 22; i++) { const x0 = r() * w, y0 = r() * h;                                         // pulled spots / small puckers
      const g = x.createRadialGradient(x0, y0, 0, x0, y0, 6 + r() * 14); g.addColorStop(0, alphaOnly ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(x0 - 20, y0 - 20, 40, 40); }
    if (top) { const g = x.createRadialGradient(w / 2, h / 2, w * .25, w / 2, h / 2, w * .72); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, alphaOnly ? 'rgba(255,255,255,.8)' : 'rgba(250,252,252,.9)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }   // the top: plain, many layers bunched round the edge
    else for (const [y0, dir] of [[0, 1], [h, -1]]) { const g = x.createLinearGradient(0, y0, 0, y0 + dir * h * .09);   // bunched, many layers thick at top and bottom
      g.addColorStop(0, alphaOnly ? 'rgba(255,255,255,.75)' : 'rgba(250,252,252,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, Math.min(y0, y0 + dir * h * .09), w, h * .09); }
    if (!alphaOnly) for (let i = 0; i < (top ? 1600 : 900); i++) { x.fillStyle = `rgba(90,96,100,${r() * (top ? .12 : .08)})`; x.fillRect(r() * w, r() * h, 1 + r() * 3, 1); }   // dust (more on the top)
  };
  const n = top ? 256 : 512, map = tex(n, n, draw(false)), alpha = tex(n, n, draw(true)); alpha.colorSpace = THREE.NoColorSpace;
  return new THREE.MeshStandardMaterial({ color: 0xffffff, map, alphaMap: alpha, transparent: true, roughness: .32, metalness: 0, envMapIntensity: .6, side: THREE.FrontSide, depthWrite: false }); }
// A stretch-wrapped box: sides take a different patch of the band map per pile (own hash, no rnd()), the top its own plain film
function filmBox(w, h, d, key) { const geo = new THREE.BoxGeometry(w, h, d), uv = geo.attributes.uv; let q = 1 + Math.abs(Math.floor(key * 7919)) % 2147483646; const r = () => (q = (q * 16807) % 2147483647) / 2147483647;
  for (let f = 0; f < 6; f++) { if (f === 2 || f === 3) continue; const su = .7 + r() * .3, sv = Math.min(1, .55 + h * .12), ou = r() * (1 - su), ov = r() * (1 - sv);
    for (let k = f * 4; k < f * 4 + 4; k++) uv.setXY(k, ou + uv.getX(k) * su, ov + uv.getY(k) * sv); }
  return new THREE.Mesh(geo, [MX.film, MX.film, MX.filmTop, MX.filmTop, MX.film, MX.film]); }
const MX = {
  steel: STD({ color: 0x1f3a2b, roughness: .5, metalness: .35 }),
  timber: STD({ map: grain('#c99c5f', '120,80,40', 256, 32, 1), roughness: .75 }),
  clad: STD({ map: tex(64, 256, (x, w, h) => { for (let i = 0; i < w; i += 16) { const g = x.createLinearGradient(i, 0, i + 16, 0); g.addColorStop(0, '#7f878d'); g.addColorStop(.18, '#c3c8cc'); g.addColorStop(.5, '#a9afb4'); g.addColorStop(.82, '#cfd3d6'); g.addColorStop(1, '#7f878d'); x.fillStyle = g; x.fillRect(i, 0, 16, h); } }, [120, 1]), roughness: .55, metalness: .25, side: THREE.DoubleSide }),
  roof: STD({ map: tex(64, 128, (x, w, h) => { for (let i = 0; i < w; i += 16) { const g = x.createLinearGradient(i, 0, i + 16, 0); g.addColorStop(0, '#4c4640'); g.addColorStop(.5, '#8d857b'); g.addColorStop(1, '#4c4640'); x.fillStyle = g; x.fillRect(i, 0, 16, h); } speckle(x, w, h, 'rgba(0,0,0,0)', .1, 300); }, [160, 4]), side: THREE.DoubleSide, roughness: .7 }),
  rooflight: new THREE.MeshStandardMaterial({ color: 0xdfe9f2, emissive: 0xcfe2f5, emissiveIntensity: .9, side: THREE.DoubleSide, transparent: true, opacity: .92 }),
  floor: STD({ map: tex(1024, 1024, (x, w, h) => { speckle(x, w, h, '#9b9a94', .06, 50000);
      for (let i = 0; i < 60; i++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 1); x.save(); x.translate(rnd() * w, rnd() * h); x.scale(40 + rnd() * 140, 20 + rnd() * 70); g.addColorStop(0, `rgba(70,66,60,${.05 + rnd() * .06})`); g.addColorStop(1, 'rgba(70,66,60,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 1, 0, 7); x.fill(); x.restore(); }
      for (let i = 0; i < 18; i++) { x.strokeStyle = `rgba(35,33,30,${.04 + rnd() * .05})`; x.lineWidth = 5 + rnd() * 5; x.beginPath(); let px = rnd() * w; x.moveTo(px, 0); for (let k = 1; k <= 12; k++) x.lineTo(px += (rnd() - .5) * 50, k * h / 12); x.stroke(); }
      x.strokeStyle = 'rgba(30,30,30,.22)'; x.lineWidth = 1.5; for (let i = 0; i < 6; i++) { x.beginPath(); let px = rnd() * w, py = rnd() * h; x.moveTo(px, py); for (let k = 0; k < 6; k++) x.lineTo(px += (rnd() - .5) * 50, py += (rnd() - .5) * 50); x.stroke(); } }, [6, 12]), roughness: .9 }),
  joint: new THREE.MeshBasicMaterial({ color: 0x55534f }),
  osb: STD({ map: tex(256, 256, (x, w, h) => { speckle(x, w, h, '#d6a96a', .3, 5000); for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(${150 + rnd() * 60},${100 + rnd() * 40},50,.5)`; x.fillRect(rnd() * w, rnd() * h, 8 + rnd() * 20, 3 + rnd() * 6); } }, [2, 1]) }),
  ply: STD({ map: tex(512, 384, (x, w, h) => { x.fillStyle = '#cdb08a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 50; i++) { x.strokeStyle = `rgba(90,70,45,${.08 + rnd() * .14})`; x.lineWidth = 2; x.beginPath(); x.ellipse(rnd() * w, rnd() * h, 30 + rnd() * 120, 6 + rnd() * 20, rnd() * .3, 0, 7); x.stroke(); } x.fillStyle = 'rgba(90,80,70,.25)'; x.fillRect(0, 0, w, h); }) }),
  alu: STD({ color: 0xc9cdd1, metalness: .75, roughness: .32 }), white: STD({ color: 0xeceae4, roughness: .9 }), black: STD({ color: 0x1c1e21, roughness: .5 }),
  orange: STD({ color: 0xe0601e, roughness: .5, metalness: .3 }), upright: STD({ color: 0x2c3a6a, roughness: .5, metalness: .4 }), yellow: STD({ color: 0xe3b11c, roughness: .5, metalness: .3 }),
  jute: STD({ map: tex(256, 256, (x, w, h) => { x.fillStyle = '#b8945e'; x.fillRect(0, 0, w, h); for (let i = 0; i < h; i += 6) { x.fillStyle = `rgba(90,60,30,${.2 + rnd() * .2})`; x.fillRect(0, i, w, 2); } for (let i = 0; i < w; i += 6) { x.fillStyle = `rgba(255,235,190,${.08 + rnd() * .1})`; x.fillRect(i, 0, 2, h); } for (let i = 0; i < h; i += 40) { x.fillStyle = 'rgba(60,40,20,.35)'; x.fillRect(0, i, w, 5); } }, [2, 2]), roughness: 1 }),
  film: filmMat(),   // milky stretch-wrap: wound bands, overlaps, creases, bunched top and bottom (17 Oct 04:xx; was a 13 % clear double-sided box that read as see-through ghost shelving)
};
MX.filmThin = MX.film.clone(); MX.filmThin.opacity = .15; MX.filmTop = filmMat(true);   // one or two clear wraps (black crate tower by the door): the milky pallet-wrap washed black covers out to white

const doorTex = tex(512, 900, (x, w, h) => { x.fillStyle = '#c4873f'; x.fillRect(0, 0, w, h); for (let i = 0; i < w; i += 64) { const g = x.createLinearGradient(i, 0, i + 64, 0); g.addColorStop(0, 'rgba(90,50,20,.45)'); g.addColorStop(.06, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(255,230,190,.06)'); x.fillStyle = g; x.fillRect(i, 0, 64, h); }
  for (let i = 0; i < 160; i++) { x.strokeStyle = `rgba(110,65,25,${.06 + rnd() * .12})`; x.beginPath(); const xx = rnd() * w; x.moveTo(xx, 0); x.bezierCurveTo(xx + (rnd() - .5) * 10, h * .3, xx + (rnd() - .5) * 10, h * .7, xx + (rnd() - .5) * 8, h); x.stroke(); }
  x.strokeStyle = '#7a4a1e'; x.lineWidth = 26; x.strokeRect(13, 13, w - 26, h - 26); x.fillStyle = '#141414'; for (const yy of [130, h - 130]) { x.fillRect(30, yy - 8, 300, 16); x.beginPath(); x.moveTo(330, yy - 8); x.lineTo(380, yy); x.lineTo(330, yy + 8); x.fill(); } x.fillRect(w - 70, h / 2 - 40, 14, 80); });
const DOORMAT = STD({ map: doorTex, roughness: .7 });


// ---------------- the floor (15–16 Oct) ----------------
// Colour and wear read off Josh's LiDAR scan (colours sampled only, no scan texture used): pale warm-grey power-floated
// concrete, grey polished lanes where the forklift runs, warm dust along the walls and racking, a few dark oil spots.
// No painted aisle lines: the scan shows none. Two layers: a fine tiled detail (2 mm/px, aggregate, pores, trowel marks)
// and one wear layer stretched over the whole 20 × 39 m (≈1 cm/px) that tints colour and sets roughness, so nothing repeats.
// Own RNG so the seeded layout of everything else doesn't shift.
MX.floor.map.dispose();                                    // the old tiled floor (still drawn above to keep the layout seed in step)
function wwFloor() {
  let sd = 4242; const fr = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const can = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  // --- detail tile: 2 m square
  const [dc, d] = can(1024, 1024); d.fillStyle = '#a29e92'; d.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 14; i++) { const g = d.createRadialGradient(0, 0, 0, 0, 0, 1); d.save(); d.translate(fr() * 1024, fr() * 1024); d.rotate(fr() * 6); d.scale(160 + fr() * 260, 50 + fr() * 120);   // soft trowel clouds
    const c = fr() < .5 ? '255,252,240' : '120,116,104'; g.addColorStop(0, `rgba(${c},${.05 + fr() * .05})`); g.addColorStop(1, `rgba(${c},0)`); d.fillStyle = g; d.beginPath(); d.arc(0, 0, 1, 0, 7); d.fill(); d.restore(); }
  for (let i = 0; i < 26; i++) { d.strokeStyle = `rgba(255,253,245,${.025 + fr() * .03})`; d.lineWidth = 18 + fr() * 30; d.beginPath(); const cx = fr() * 1024, cy = fr() * 1024, r = 120 + fr() * 220, a = fr() * 6; d.arc(cx, cy, r, a, a + .6 + fr() * .8); d.stroke(); }   // power-float swirls
  for (let i = 0; i < 18000; i++) { const t = fr(), sz = t < .9 ? .8 + fr() * 1.6 : 2 + fr() * 3.5; const k = fr();                   // aggregate: grey, cream and the odd brown fleck
    d.fillStyle = k < .45 ? `rgba(90,88,82,${.08 + fr() * .14})` : k < .85 ? `rgba(240,236,224,${.1 + fr() * .16})` : `rgba(130,100,70,${.1 + fr() * .14})`; d.beginPath(); d.ellipse(fr() * 1024, fr() * 1024, sz, sz * (.5 + fr() * .5), fr() * 3, 0, 7); d.fill(); }
  const [bc, b] = can(512, 512); b.fillStyle = '#808080'; b.fillRect(0, 0, 512, 512);                          // bump: pin-hole pores and tiny pits
  for (let i = 0; i < 2600; i++) { const r = .6 + fr() * 1.4, x = fr() * 512, y = fr() * 512; b.fillStyle = `rgba(20,20,20,${.5 + fr() * .5})`; b.beginPath(); b.arc(x, y, r, 0, 7); b.fill(); d.fillStyle = 'rgba(70,66,58,.35)'; d.beginPath(); d.arc(x * 2, y * 2, r * 1.6, 0, 7); d.fill(); }
  for (let i = 0; i < 9000; i++) { b.fillStyle = `rgba(${fr() < .5 ? '255,255,255' : '0,0,0'},.12)`; b.fillRect(fr() * 512, fr() * 512, 1 + fr() * 2, 1 + fr() * 2); }
  const rep = t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(HW / 2, HL / 2); t.anisotropy = 8; return t; };
  const map = rep(new THREE.CanvasTexture(dc)); map.colorSpace = THREE.SRGBColorSpace; const bump = rep(new THREE.CanvasTexture(bc));
  // --- wear layer over the whole floor: rgb = colour multiplier (128 = no change), separate roughness canvas (255 = .92)
  const W = 2048, H = 4096, sx = W / HW, sz = H / HL, P = (x, z) => [x * sx, (HL + z) * sz];
  const [wc, w] = can(W, H), [rc, r] = can(W, H); w.fillStyle = 'rgb(128,128,128)'; w.fillRect(0, 0, W, H); r.fillStyle = '#fff'; r.fillRect(0, 0, W, H);
  const blob = (ctx, x, z, rx, rz, col, a, rot = 0) => { const [px, py] = P(x, z); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(.6, `rgba(${col},${a * .55})`); g.addColorStop(1, `rgba(${col},0)`);
    ctx.save(); ctx.translate(px, py); ctx.rotate(rot); ctx.scale(rx * sx, rz * sz); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fill(); ctx.restore(); };
  for (let i = 0; i < 420; i++) { const lighter = fr() < .5; blob(w, fr() * HW, -fr() * HL, .6 + fr() * 2.4, .6 + fr() * 2.4, lighter ? '146,145,141' : '110,109,106', .35 + fr() * .45, fr() * 3); }   // large-scale mottling (±8%), like the scan
  // dust and dirt along the walls and under the racking (warm, rough)
  for (const [x0, z0, x1, z1] of [[0, 0, .6, -39], [19.4, 0, 20, -39], [0, -38.5, 20, -39], [18.3, -.3, 20, -14.3], [13.5, -14.6, 18.6, -15.4], [15.1, -1.4, 18.2, -2.2], [6.9, -5.1, 7.6, -11]])
    for (let i = 0; i < 40; i++) blob(w, x0 + fr() * (x1 - x0), z0 + fr() * (z1 - z0), .25 + fr() * .5, .25 + fr() * .5, '108,100,86', .25 + fr() * .25, fr() * 3);
  // forklift lanes: many faint tyre passes; the busiest lane runs in from the door, branches swing into the yard bay
  // racking and the yellow racking. Passes fade with distance from the door. Darker, cooler and polished (lower roughness).
  const lane = (pts, n, spread, a0) => { for (let k = 0; k < n; k++) { const off = (fr() - .5) * spread, fade = .6 + fr() * .4;
    for (const tyre of [-.45, .45]) {                          // G15S front track ≈ 0.9 m, ~20 cm tyres
      w.strokeStyle = `rgba(78,80,85,${a0 * fade})`; r.strokeStyle = `rgba(150,150,150,${a0 * fade * 1.2})`;
      for (const ctx of [w, r]) { ctx.lineWidth = .17 * sx; ctx.lineCap = 'round'; ctx.beginPath();
        pts.forEach(([x, z], i) => { const nx = (pts[Math.min(i + 1, pts.length - 1)][1] - pts[Math.max(i - 1, 0)][1]), nz = -(pts[Math.min(i + 1, pts.length - 1)][0] - pts[Math.max(i - 1, 0)][0]), L = Math.hypot(nx, nz) || 1;
          const [px, py] = P(x + (nx / L) * (tyre + off), z + (nz / L) * (tyre + off)); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.stroke(); } } } };
  const curve = (x0, z0, x1, z1, bend) => { const out = []; for (let t = 0; t <= 1.0001; t += .05) { const mx = (x0 + x1) / 2 + bend[0], mz = (z0 + z1) / 2 + bend[1]; out.push([(1 - t) ** 2 * x0 + 2 * (1 - t) * t * mx + t * t * x1, (1 - t) ** 2 * z0 + 2 * (1 - t) * t * mz + t * t * z1]); } return out; };
  lane(curve(10.6, 1, 11.0, -20, [.4, 0]), 34, 1.0, .11);                       // door → mid-hall, the busiest run
  lane(curve(11.0, -20, 11.6, -33, [-.3, 0]), 16, .9, .08);                     // on to the far end
  for (const zb of [-1.8, -4.5, -7.3, -10.1, -12.8]) lane(curve(10.8, zb + 2.6, 16.9, zb, [.8, .9]), 7, .6, .1);   // into each yard-bay bay
  lane(curve(10.6, -4.5, 8.4, -8.2, [-.2, .6]), 6, .5, .09);                     // to the yellow racking
  lane(curve(11.2, -22, 8.6, -26.6, [-.6, .4]), 6, .6, .08);                    // to the 14 ft crowns
  // tyre scuffs: short black rubber arcs where the forklift turns on the spot
  for (const [x, z] of [[11.0, -3.2], [11.2, -6.0], [11.4, -8.9], [11.0, -11.7], [9.4, -6.2], [10.8, -23.5]]) for (let i = 0; i < 3; i++) {
    const [px, py] = P(x + (fr() - .5) * 1.2, z + (fr() - .5) * 1.2); w.strokeStyle = `rgba(40,40,42,${.18 + fr() * .2})`; w.lineWidth = .05 * sx + fr() * 4; w.beginPath(); const rr2 = (.5 + fr() * 1.2) * sx, a = fr() * 6; w.arc(px, py, rr2, a, a + .25 + fr() * .5); w.stroke(); }
  // oil and hydraulic spots: dark, shiny, soft-edged, with a few drips (where the forklift parks, by the IBC tanks, at the door)
  const oil = (x, z, s) => { for (let i = 0; i < 5; i++) blob(w, x + (fr() - .5) * s, z + (fr() - .5) * s, s * (.25 + fr() * .4), s * (.2 + fr() * .35), '62,58,54', .35 + fr() * .3, fr() * 3);
    blob(w, x, z, s * .25, s * .2, '45,42,40', .5, fr() * 3); for (let i = 0; i < 4; i++) blob(r, x + (fr() - .5) * s, z + (fr() - .5) * s, s * .45, s * .4, '90,90,90', .6, 0);
    for (let i = 0; i < 6; i++) blob(w, x + (fr() - .5) * s * 3, z + (fr() - .5) * s * 3, .03 + fr() * .05, .03 + fr() * .05, '55,52,50', .6); };
  oil(9.7, -7.2, .7); oil(9.4, -6.0, .35); oil(7.4, -14.0, .5); oil(11.3, -1.0, .45); oil(10.9, -17.5, .3); oil(12.1, -26.0, .4);
  // saw-cut slab joints every portal bay (6.5 m) and down the middle, dirt in the cut, chipped arrises here and there
  const joint = (x0, z0, x1, z1) => { const [a, bq] = P(x0, z0), [c2, e] = P(x1, z1); w.strokeStyle = 'rgba(58,55,50,.85)'; w.lineWidth = 2.4; w.beginPath(); w.moveTo(a, bq); w.lineTo(c2, e); w.stroke();
    w.strokeStyle = 'rgba(90,86,78,.3)'; w.lineWidth = 7; w.stroke(); const n = Math.hypot(c2 - a, e - bq) / 40;
    for (let i = 0; i < n; i++) if (fr() < .3) { const t = fr(); blob(w, x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, .02 + fr() * .05, .02 + fr() * .04, '84,80,74', .55, fr() * 3); } };
  for (let z = -BAY; z > -HL; z -= BAY) joint(0, z, HW, z); joint(HW / 2, 0, HW / 2, -HL);
  // hairline shrinkage cracks
  for (let i = 0; i < 16; i++) { let [px, py] = P(fr() * HW, -fr() * HL); w.strokeStyle = `rgba(70,68,64,${.35 + fr() * .3})`; w.lineWidth = 1; w.beginPath(); w.moveTo(px, py); let ang = fr() * 6; for (let k = 0; k < 14; k++) { ang += (fr() - .5) * .9; w.lineTo(px += Math.cos(ang) * 9, py += Math.sin(ang) * 9); } w.stroke(); }
  const wear = new THREE.CanvasTexture(wc); wear.colorSpace = THREE.NoColorSpace; wear.anisotropy = 8;
  const rough = new THREE.CanvasTexture(rc); rough.colorSpace = THREE.NoColorSpace; rough.anisotropy = 8;
  const m = new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: .6, roughnessMap: rough, roughness: .92, metalness: 0 });
  m.onBeforeCompile = sh => { sh.uniforms.wearMap = { value: wear };
    sh.vertexShader = 'varying vec2 vWear;\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\nvWear = uv;');
    sh.fragmentShader = 'uniform sampler2D wearMap;\nvarying vec2 vWear;\n' + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb *= texture2D(wearMap, vWear).rgb * 2.0;'); };
  m.customProgramCacheKey = () => 'wwFloor';
  return m; }
MX.floor = wwFloor();

// ---------------- the shed ----------------
function shed() {
  const g = grp(scene); g.name = 'Shed'; const roofG = grp(g); roofG.name = 'Roof';
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(HW, HL), MX.floor); fl.rotation.x = -Math.PI / 2; fl.position.set(HW / 2, 0, -HL / 2); fl.receiveShadow = true; g.add(fl);
  // slab joints are drawn into the floor's wear layer (wwFloor)
  const ang = Math.atan2(RIDGE - EAVE, HW / 2), slope = Math.hypot(HW / 2, RIDGE - EAVE);
  for (let z = 0; z >= -HL - .01; z -= BAY) {   // portal frames: columns, haunched rafters, knee and apex braces
    for (const x of [.15, HW - .15]) { box(g, .3, EAVE, .2, MX.steel, x, 0, z); box(g, .5, .02, .4, MX.steel, x, 0, z); }
    for (const s of [-1, 1]) { const r = box(roofG, slope, .42, .2, MX.steel, 0, 0, z); r.position.set(HW / 2 + s * HW / 4, (EAVE + RIDGE) / 2 - .18, z); r.rotation.z = -s * ang;
      const hn = box(roofG, 1.6, .5, .2, MX.steel, 0, 0, z); hn.position.set(s < 0 ? .9 : HW - .9, EAVE - .35, z); hn.rotation.z = -s * ang;
      const br = box(roofG, 3.2, .1, .1, MX.steel, 0, 0, z); br.position.set(HW / 2 + s * 2.3, RIDGE - 1.5, z); br.rotation.z = s * .72; } }
  wwRoof(roofG, ang, slope);   // sheets, roof lights, purlins, cleats, eaves beams, trunking and high-bays
  // side walls: cladding with timber posts and four girts (as in the photos)
  // (the sheets themselves are wwWalls(): profiled, lapped, screwed and weathered; behind the workshop the old plain cladding stays for now)
  { const KEEP = 13.2, w = new THREE.Mesh(new THREE.PlaneGeometry(KEEP, EAVE), MX.clad); w.position.set(0, EAVE / 2, -KEEP / 2); w.rotation.y = Math.PI / 2; w.receiveShadow = true; g.add(w); }
  wwWalls(g);
  for (const x of [0, HW]) {
    for (let yy = 1.15; yy < EAVE; yy += 1.2) box(g, .07, .14, HL, MX.timber, x + (x ? -.06 : .06), yy, -HL / 2);
    for (let z = -BAY / 2; z > -HL; z -= BAY) box(g, .12, EAVE, .07, MX.timber, x + (x ? -.08 : .08), 0, z); }
  const gable = pts => new THREE.Shape(pts.map(p => new THREE.Vector2(...p)));
  for (let xx = 1.7; xx < HW; xx += 3.3) box(g, .14, EAVE + (RIDGE - EAVE) * (1 - Math.abs(xx - HW / 2) / (HW / 2)) - .25, .07, MX.timber, xx, 0, -HL + .07);
  for (let yy = 1.15; yy < EAVE; yy += 1.2) box(g, HW, .14, .07, MX.timber, HW / 2, yy, -HL + .1);
  box(g, DOOR.x1 - DOOR.x0 + .5, .55, .55, MX.alu, (DOOR.x0 + DOOR.x1) / 2, DOOR.h, .1);   // rolled-up door drum
  for (const x of [DOOR.x0, DOOR.x1]) { box(g, .14, DOOR.h, .1, MX.alu, x, 0, .05); }
  // outside: the yard, the green shed opposite, a tree, a second forklift
  const yard = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), STD({ color: 0xb5b3ab })); yard.rotation.x = -Math.PI / 2; yard.position.set(HW / 2, -.002, 15); g.add(yard);
  const opp = new THREE.Mesh(new THREE.ShapeGeometry(gable([[-14, 0], [14, 0], [14, 5], [0, 6.6], [-14, 5]])), STD({ map: tex(64, 256, (x, w, h) => { for (let i = 0; i < w; i += 8) { const gg = x.createLinearGradient(i, 0, i + 8, 0); gg.addColorStop(0, '#2c6539'); gg.addColorStop(.5, '#4f8a5a'); gg.addColorStop(1, '#2c6539'); x.fillStyle = gg; x.fillRect(i, 0, 8, h); } }, [50, 1]), side: THREE.DoubleSide })); opp.position.set(HW / 2 + 1, 0, 18); opp.rotation.y = Math.PI; g.add(opp);
  box(g, 28, 1.7, .2, STD({ color: 0xece8e0 }), HW / 2 + 1, 0, 17.9);
  const tree = new THREE.Mesh(new THREE.IcosahedronGeometry(1.8, 1), STD({ color: 0x6f9a3a, flatShading: true })); tree.position.set(3.5, 3.4, 9); g.add(tree); cyl(g, .15, 2.6, STD({ color: 0x5a4632 }), 3.5, 1.3, 9);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(120, 50), new THREE.MeshBasicMaterial({ color: 0xeef3f6 })); sky.position.set(HW / 2, 10, 40); sky.rotation.y = Math.PI; g.add(sky);
  T(g, 'The hall', 'Steel portal-frame shed: dark green frames every 6.5 m with braced, haunched rafters, timber purlins and wall girts, grey cladding, profiled roof sheets with GRP roof lights in every bay, LED high-bays hung off a cable tray along the ridge, one big roller door onto the yard.', `≈ ${HW} × ${HL} m · eaves ${EAVE} m · ridge ${RIDGE} m (estimate)`, 'fairly sure').userData.noPick = true;
  return { g, roofG };
}

// ---------------- the roof (WW ceiling) ----------------
// What you see looking up: trapezoidal steel sheets (32 mm ribs at 333 mm, 1 m cover, side laps every metre, an end lap half way up)
// laid on timber purlins with steel cleats at every rafter, two GRP roof-light sheets per bay per slope (translucent, a bit yellowed,
// dirt along the laps), steel eaves beams, a galvanised cable tray under the ridge with the LED high-bays hung off it on chains.
// The LiDAR scan didn't reach the roof, so layout is a typical portal-frame shed (6.5 m bays). Own RNG: the layout seed doesn't move.
// Roof detail doesn't cast shadows, so the floor light stays as it was.
function wwRoof(roofG, ang, slope) {
  let sd = 9137; const fr = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const can = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  const PITCH = 1 / 3, DEPTH = .032, NP = 7, PX = k => -slope / 2 + (k + .5) / NP * slope;   // rib pitch, rib depth, purlins across the slope
  // profile across the hall (local z): trough sits on the purlins (y −.015), rib crest up at y −.015 + DEPTH
  const prof = t => { const f = ((t % PITCH) + PITCH) % PITCH / PITCH; return -.015 + DEPTH * (f < .07 ? f / .07 : f < .17 ? 1 : f < .24 ? 1 - (f - .17) / .07 : 0); };
  const knots = [0, .07, .17, .24].map(f => f * PITCH);
  function sheetGeo(x0, x1, z0, z1, dy = 0) {   // flat-shaded profiled strip, local x across the slope, z along the hall
    const zs = []; for (let b = Math.floor(z0 / PITCH) * PITCH; b < z1 + PITCH; b += PITCH) for (const k of knots) { const z = b + k; if (z > z0 && z < z1) zs.push(z); }
    zs.unshift(z0); zs.push(z1); const pos = [], uv = [], U = x => (x + slope / 2) / slope, V = z => (z + HL / 2) / HL;
    for (let i = 0; i < zs.length - 1; i++) { const za = zs[i], zb = zs[i + 1], ya = prof(za) + dy, yb = prof(zb) + dy;
      pos.push(x0, ya, za, x1, ya, za, x1, yb, zb, x0, ya, za, x1, yb, zb, x0, yb, zb); uv.push(U(x0), V(za), U(x1), V(za), U(x1), V(zb), U(x0), V(za), U(x1), V(zb), U(x0), V(zb)); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals(); return g; }
  // --- the sheets' underside: one canvas per slope, u across the slope, v along the hall (≈ 100 px/m)
  const W = 1024, H = 4096, ux = x => (x + slope / 2) / slope * W, vz = z => (z + HL / 2) / HL * H;
  const LIGHTS = []; for (let b = 0; b < 6; b++) for (const [dz, dx] of [[1, -.9], [4, 1.6]]) LIGHTS.push({ z: -HL / 2 + Math.floor(b * BAY) + dz, x: dx });  // 1 m wide (one sheet, on the laps), 3 m up the slope, clear of the rafters
  function sheetTex(side) {
    const [c, x] = can(W, H); x.fillStyle = '#7f8184'; x.fillRect(0, 0, W, H);
    for (let z = -HL / 2; z < HL / 2; z += 1) { const k = fr(); x.fillStyle = `rgba(${k < .5 ? '255,255,255' : '0,0,0'},${.02 + fr() * .05})`; x.fillRect(0, vz(z), W, vz(z + 1) - vz(z)); }   // sheet-to-sheet tone
    for (let i = 0; i < 160; i++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 1); x.save(); x.translate(fr() * W, fr() * H); x.scale(60 + fr() * 200, 40 + fr() * 160); const cc = fr() < .55 ? '60,58,54' : '200,200,196'; g.addColorStop(0, `rgba(${cc},${.04 + fr() * .06})`); g.addColorStop(1, `rgba(${cc},0)`); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 1, 0, 7); x.fill(); x.restore(); }   // mottling
    for (let i = 0; i < 260; i++) { const z = (fr() - .5) * HL, x0 = fr() * W, len = 40 + fr() * 260; x.strokeStyle = `rgba(70,62,52,${.05 + fr() * .1})`; x.lineWidth = 1 + fr() * 4; x.beginPath(); x.moveTo(x0, vz(z)); x.lineTo(x0 + len * (side < 0 ? 1 : -1), vz(z) + (fr() - .5) * 6); x.stroke(); }   // drip streaks down the slope
    for (let z = -HL / 2 + 1; z < HL / 2; z += 1) { x.fillStyle = 'rgba(40,40,42,.4)'; x.fillRect(0, vz(z) - 1.5, W, 3); x.fillStyle = 'rgba(95,82,64,.12)'; x.fillRect(0, vz(z) - 6, W, 12); }   // side laps every metre, a bit of grime in each
    const eL = ux(slope * .02); x.fillStyle = 'rgba(35,35,37,.6)'; x.fillRect(eL - 2, 0, 4, H); x.fillStyle = 'rgba(95,82,64,.2)'; x.fillRect(eL - 14, 0, 28, H);   // end lap half way up
    for (let z = -HL / 2 + 1; z < HL / 2; z += 1) for (let u = 20; u < W; u += 46) { x.fillStyle = 'rgba(150,95,55,.3)'; x.beginPath(); x.arc(u, vz(z) + 4, 3.5, 0, 7); x.fill(); x.fillStyle = 'rgba(28,28,30,.85)'; x.beginPath(); x.arc(u, vz(z), 2.2, 0, 7); x.fill(); }   // stitching screws along each side lap, a rust tear under some
    for (const s of [0, W - 1]) { const g = x.createLinearGradient(s, 0, s ? s - 120 : 120, 0); g.addColorStop(0, 'rgba(40,36,30,.45)'); g.addColorStop(1, 'rgba(40,36,30,0)'); x.fillStyle = g; x.fillRect(s ? W - 120 : 0, 0, 120, H); }   // dirtier at eaves and ridge
    for (const L of LIGHTS) { const xa = ux(L.x - 1.5), xb = ux(L.x + 1.5), za = vz(L.z), zb = vz(L.z + 1); x.fillStyle = 'rgba(30,30,30,.5)'; x.fillRect(xa - 4, za - 4, xb - xa + 8, zb - za + 8); }   // lap shadow round each roof light
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
  const [lc, l] = can(256, 512); l.fillStyle = '#f2ecd6'; l.fillRect(0, 0, 256, 512);   // GRP roof light: fibre mat, yellowed, dirt in the troughs and at the ends
  for (let i = 0; i < 1400; i++) { l.strokeStyle = `rgba(${fr() < .5 ? '255,255,250' : '170,150,110'},${.08 + fr() * .12})`; l.lineWidth = .6 + fr(); l.beginPath(); const a = fr() * 6, px = fr() * 256, py = fr() * 512, r = 4 + fr() * 14; l.arc(px, py, r, a, a + 1 + fr() * 2); l.stroke(); }
  for (let i = 0; i < 40; i++) { const g = l.createRadialGradient(0, 0, 0, 0, 0, 1); l.save(); l.translate(fr() * 256, fr() * 512); l.scale(20 + fr() * 70, 30 + fr() * 120); g.addColorStop(0, `rgba(120,100,70,${.08 + fr() * .14})`); g.addColorStop(1, 'rgba(120,100,70,0)'); l.fillStyle = g; l.beginPath(); l.arc(0, 0, 1, 0, 7); l.fill(); l.restore(); }
  for (const s of [0, 1]) { const g = l.createLinearGradient(0, s * 512, 0, s ? 440 : 72); g.addColorStop(0, 'rgba(70,60,45,.55)'); g.addColorStop(1, 'rgba(70,60,45,0)'); l.fillStyle = g; l.fillRect(0, s ? 440 : 0, 256, 72); }
  const lt = new THREE.CanvasTexture(lc); lt.colorSpace = THREE.SRGBColorSpace;
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xe9e4d2, map: lt, emissive: 0xfff6e2, emissiveMap: lt, emissiveIntensity: .75, roughness: .6, side: THREE.DoubleSide });
  const purlinXs = []; for (let k = 0; k < NP; k++) purlinXs.push(PX(k));
  const cleatGeo = new THREE.BoxGeometry(.008, .17, .11), cleats = new THREE.InstancedMesh(cleatGeo, MX.steel, 2 * NP * 7); let ci = 0; const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), vp = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  for (const s of [-1, 1]) { const h = grp(roofG, HW / 2 + s * HW / 4, (EAVE + RIDGE) / 2 + .24, -HL / 2); h.rotation.z = -s * ang; h.updateMatrixWorld();
    const sheet = new THREE.Mesh(sheetGeo(-slope / 2, slope / 2, -HL / 2, HL / 2), STD({ map: sheetTex(s), roughness: .62, metalness: .35, side: THREE.DoubleSide })); sheet.receiveShadow = true; h.add(sheet);
    // the roof lights: same profile, 1 cm under the sheet, 1 m wide × 3 m up the slope
    for (const L of LIGHTS) { const m = new THREE.Mesh(sheetGeo(L.x - 1.5, L.x + 1.5, L.z, L.z + 1, -.01), lightMat); const a = m.geometry.attributes.uv.array; for (let i = 0; i < a.length; i += 2) { const su = (a[i] * slope - slope / 2 - (L.x - 1.5)) / 3, zv = a[i + 1] * HL - HL / 2 - L.z; a[i] = zv; a[i + 1] = su; } h.add(m); }
    for (const px of purlinXs) box(h, .075, .2, HL, MX.timber, px, -.215, 0);   // timber purlins (still cast, so the floor light is unchanged)
    for (let b = 0; b <= 6; b++) for (const px of purlinXs) { const z = -HL / 2 + Math.min(b * BAY, HL - .06) + (b ? 0 : .06);   // a steel cleat bolted to the rafter at every purlin
      vp.set(px + .045, -.12, z); h.localToWorld(vp); roofG.worldToLocal(vp); e.set(0, 0, -s * ang); q.setFromEuler(e); m4.compose(vp, q, one); cleats.setMatrixAt(ci++, m4); }
    // the eaves beam on top of each wall
    const eb = box(roofG, .16, .22, HL, MX.steel, s < 0 ? .22 : HW - .22, EAVE - .02, -HL / 2); eb.castShadow = false; }
  cleats.count = ci; cleats.instanceMatrix.needsUpdate = true; roofG.add(cleats);
  // galvanised cable tray under the ridge, the high-bays hung off it on chains (same spots as the warm point lights)
  const galv = STD({ color: 0x3c4044, metalness: .3, roughness: .75 }), trayY = RIDGE - .55;   // dull (the warm point lights sit just under it); tray below the rafters at the apex
  const tray = new THREE.Group(); roofG.add(tray);
  for (const dx of [-.1, .1]) { const r = box(tray, .012, .05, HL, galv, HW / 2 + dx, trayY, -HL / 2); r.castShadow = false; }
  { const b = box(tray, .2, .008, HL, STD({ map: tex(16, 512, (x, w, h) => { x.fillStyle = '#3c4044'; x.fillRect(0, 0, w, h); x.fillStyle = '#17181a'; for (let i = 6; i < h; i += 16) x.fillRect(4, i, 8, 6); }, [1, 60]), metalness: .3, roughness: .75 }), HW / 2, trayY, -HL / 2); b.castShadow = false; }   // slotted base
  for (let z = -1.5; z > -HL; z -= 3) { for (const dx of [-.1, .1]) cyl(tray, .006, RIDGE + .05 - trayY, galv, HW / 2 + dx, (RIDGE + .05 + trayY) / 2, z).castShadow = false; }   // drop rods to the ridge purlins
  for (const dx of [-.06, .04]) { const c = cyl(tray, .011, HL, MX.black, HW / 2 + dx, trayY + .02, -HL / 2, 'z', 8); c.castShadow = false; }   // cables in the tray
  const finsGeo = new THREE.BoxGeometry(.006, .075, .085), bodyMat = STD({ color: 0x2b2e31, metalness: .6, roughness: .4 });
  const linkMat = STD({ color: 0x9a9fa3, metalness: .8, roughness: .35 }), linkGeo = new THREE.TorusGeometry(.012, .003, 4, 8);
  for (let z = -5; z > -HL; z -= 8.5) { const f = grp(roofG, HW / 2, RIDGE - .95, z);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(.22, .235, .07, 32), bodyMat); f.add(body);
    const fins = new THREE.InstancedMesh(finsGeo, bodyMat, 24); for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; e.set(0, -a, 0); q.setFromEuler(e); vp.set(Math.cos(a) * .16, .07, Math.sin(a) * .16); m4.compose(vp, q, one); fins.setMatrixAt(i, m4); } f.add(fins);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(.05, .06, .05, 16), bodyMat); hub.position.y = .12; f.add(hub);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.03, .006, 6, 16), linkMat); ring.position.y = .17; f.add(ring);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(.205, 32), new THREE.MeshBasicMaterial({ color: 0xfffaf0 })); lens.rotation.x = Math.PI / 2; lens.position.y = -.036; f.add(lens);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.21, .012, 6, 32), linkMat); rim.rotation.x = Math.PI / 2; rim.position.y = -.035; f.add(rim);
    const chainTop = trayY - .01 - (RIDGE - .95), n = Math.floor((chainTop - .18) / .02);   // chain from the hook up to the tray
    for (let i = 0; i < n; i++) { const k = new THREE.Mesh(linkGeo, linkMat); k.position.y = .19 + i * .02; k.rotation.y = i % 2 ? Math.PI / 2 : 0; f.add(k); }
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(.04, .14, 0), new THREE.Vector3(.12, .3, .08), new THREE.Vector3(.1, chainTop * .7, .14), new THREE.Vector3(.04, chainTop + .02, .1)]);   // power lead looping up to the tray
    f.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, .005, 6), MX.black)); }
}

// ---------------- the walls (WW cladding, 16 Oct) ----------------
// Josh's LiDAR scan only sees the walls in a few gaps (behind the racking, over the door): cool mid-grey sheets (≈ 105/115/120 in the
// scan's light), warmer and dirtier low down (≈ 100/88/78 under 2 m). Colours read off the scan, nothing from it is used.
// Inside you look at the back of trapezoidal sheets: the wide pans sit on the girts, the ribs (32 mm deep, every 333 mm) recede outwards.
// Side laps every metre, a row of fixing screws in the pans at every girt, splash dirt and forklift scuffs low down, rust tears
// under some screws, grime under the eaves. Own RNG, so nothing else in the layout moves.
function wwWalls(g) {
  let sd = 4721; const fr = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const PITCH = 1 / 3, DEPTH = .032, GIRTS = []; for (let yy = 1.15; yy < EAVE; yy += 1.2) GIRTS.push(yy + .07);
  const prof = t => { const f = ((t % PITCH) + PITCH) % PITCH / PITCH; return -DEPTH * (f < .07 ? f / .07 : f < .17 ? 1 : f < .24 ? 1 - (f - .17) / .07 : 0); };
  const knots = [0, .07, .17, .24].map(f => f * PITCH);
  // one profiled panel: local s along the wall (s0..s1), y up from y0(s) to top(s), z = depth (+ into the room). uv: u = s / L, v = y / Ht
  function geo(s0, s1, y0, top, L, Ht) {
    const ss = []; for (let b = Math.floor(s0 / PITCH) * PITCH; b < s1 + PITCH; b += PITCH) for (const k of knots) { const t = b + k; if (t > s0 && t < s1) ss.push(t); }
    ss.unshift(s0); ss.push(s1); const pos = [], uv = [];
    for (let i = 0; i < ss.length - 1; i++) { const a = ss[i], b = ss[i + 1], za = prof(a), zb = prof(b), ta = top(a), tb = top(b), ya = y0(a), yb = y0(b);
      pos.push(a, ya, za, b, yb, zb, b, tb, zb, a, ya, za, b, tb, zb, a, ta, za);
      uv.push(a / L, ya / Ht, b / L, yb / Ht, b / L, tb / Ht, a / L, ya / Ht, b / L, tb / Ht, a / L, ta / Ht); }
    const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); G.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); G.computeVertexNormals(); return G; }
  // the sheets' inside face, ≈ 100 px/m: u along the wall, v up
  function skin(L, Ht, opts = {}) {
    const PX = 100, W = Math.min(4096, Math.ceil(L * PX)), H = Math.ceil(Ht * PX), sx = W / L, sy = H / Ht;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    const X = s => s * sx, Y = y => H - y * sy;   // canvas y runs down
    x.fillStyle = '#8f989d'; x.fillRect(0, 0, W, H);
    for (let s = 0; s < L; s += 1) { const k = fr(); x.fillStyle = `rgba(${k < .5 ? '255,255,255' : '20,24,28'},${.02 + fr() * .05})`; x.fillRect(X(s), 0, sx + 1, H); }   // sheet-to-sheet tone
    for (let i = 0; i < L * 3; i++) { const gg = x.createRadialGradient(0, 0, 0, 0, 0, 1); x.save(); x.translate(fr() * W, fr() * H); x.scale(40 + fr() * 160, 40 + fr() * 140); const cc = fr() < .6 ? '70,66,60' : '210,214,216'; gg.addColorStop(0, `rgba(${cc},${.03 + fr() * .05})`); gg.addColorStop(1, `rgba(${cc},0)`); x.fillStyle = gg; x.beginPath(); x.arc(0, 0, 1, 0, 7); x.fill(); x.restore(); }   // mottling
    for (let i = 0; i < L * 5; i++) { const sx0 = fr() * W, y0 = fr() * H * .5, len = 60 + fr() * 300; x.strokeStyle = `rgba(80,72,62,${.04 + fr() * .08})`; x.lineWidth = 1 + fr() * 3; x.beginPath(); x.moveTo(sx0, y0); x.lineTo(sx0 + (fr() - .5) * 4, y0 + len); x.stroke(); }   // run-down streaks
    { const gg = x.createLinearGradient(0, 0, 0, sy * .9); gg.addColorStop(0, 'rgba(45,42,38,.45)'); gg.addColorStop(1, 'rgba(45,42,38,0)'); x.fillStyle = gg; x.fillRect(0, 0, W, sy * .9); }   // grime under the eaves
    // splash and dust low down (the scan's warmer, darker band under ~2 m), uneven top edge
    for (let s = 0; s < L; s += .25) { const h = .45 + fr() * .5 + (fr() < .15 ? fr() * .8 : 0), gg = x.createLinearGradient(0, Y(0), 0, Y(h)); gg.addColorStop(0, 'rgba(92,78,60,.62)'); gg.addColorStop(.35, 'rgba(110,94,74,.32)'); gg.addColorStop(1, 'rgba(110,94,74,0)'); x.fillStyle = gg; x.fillRect(X(s), Y(h), X(.25) + 1, Y(0) - Y(h)); }
    x.fillStyle = 'rgba(55,48,40,.55)'; x.fillRect(0, Y(.06), W, Y(0) - Y(.06));   // wet line at the foot
    // forklift and pallet scuffs: scrapes along the wall at fork height, a few dents
    for (let i = 0; i < L / 3; i++) { const y = .15 + fr() * 1.3, s0 = fr() * L, len = .3 + fr() * 1.6; x.strokeStyle = `rgba(${fr() < .5 ? '40,40,42' : '190,196,198'},${.25 + fr() * .3})`; x.lineWidth = 1 + fr() * 2.5; x.beginPath(); x.moveTo(X(s0), Y(y)); x.lineTo(X(s0 + len), Y(y + (fr() - .5) * .08)); x.stroke(); }
    for (let i = 0; i < L / 6; i++) { const gg = x.createRadialGradient(0, 0, 0, 0, 0, 1); x.save(); x.translate(fr() * W, Y(.3 + fr() * 1.1)); x.scale(18 + fr() * 30, 14 + fr() * 22); gg.addColorStop(0, 'rgba(30,30,32,.35)'); gg.addColorStop(.6, 'rgba(30,30,32,.12)'); gg.addColorStop(1, 'rgba(30,30,32,0)'); x.fillStyle = gg; x.beginPath(); x.arc(0, 0, 1, 0, 7); x.fill(); x.fillStyle = 'rgba(230,232,232,.18)'; x.beginPath(); x.arc(-.35, -.35, .4, 0, 7); x.fill(); x.restore(); }
    // side laps every metre: a dark seam with a little dirt caught in it
    for (let s = 1; s < L; s += 1) { x.fillStyle = 'rgba(40,42,44,.55)'; x.fillRect(X(s) - 1.5, 0, 3, H); x.fillStyle = 'rgba(95,84,68,.14)'; x.fillRect(X(s) - 7, 0, 14, H); }
    // fixing screws in the pans at every girt, a rust tear under some (and a seam of stitching screws up each lap)
    for (const gy of GIRTS) if (gy < Ht - .05) for (let s = PITCH * .6; s < L; s += PITCH) { const top = opts.top ? opts.top(s) : Ht; if (gy > top - .05) continue;
      if (fr() < .12) { const gg = x.createLinearGradient(0, Y(gy), 0, Y(gy - .12 - fr() * .25)); gg.addColorStop(0, 'rgba(140,82,42,.5)'); gg.addColorStop(1, 'rgba(140,82,42,0)'); x.fillStyle = gg; x.fillRect(X(s) - 2, Y(gy), 4, X(.37)); }
      x.fillStyle = 'rgba(25,26,28,.9)'; x.beginPath(); x.arc(X(s), Y(gy), 2.6, 0, 7); x.fill(); x.fillStyle = 'rgba(200,204,206,.6)'; x.beginPath(); x.arc(X(s) - .8, Y(gy) - .8, .9, 0, 7); x.fill(); }
    for (let s = 1; s < L; s += 1) for (let y = .45; y < Ht; y += .45) { x.fillStyle = 'rgba(28,29,31,.75)'; x.beginPath(); x.arc(X(s), Y(y), 1.6, 0, 7); x.fill(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
  const mat = map => STD({ map, roughness: .6, metalness: .3, side: THREE.DoubleSide });
  const panel = (parent, pieces, L, Ht, top, place) => { const m = mat(skin(L, Ht, { top })), h = grp(parent, ...place.p); h.rotation.y = place.ry;
    for (const [s0, s1, y0, tp] of pieces) { const w = new THREE.Mesh(geo(s0, s1, y0, tp, L, Ht), m); w.receiveShadow = true; h.add(w); } return h; };
  const flat = v => () => v, gab = s => EAVE + (RIDGE - EAVE) * (1 - Math.abs(s - HW / 2) / (HW / 2));
  // left wall (s = distance from the door, z = −s), skipping the stretch behind the workshop (z 0 to −13.2)
  panel(g, [[13.2, HL, flat(0), flat(EAVE)]], HL, EAVE, null, { p: [0, 0, 0], ry: Math.PI / 2 });
  // right wall (s from the far end, z = −HL + s)
  panel(g, [[0, HL, flat(0), flat(EAVE)]], HL, EAVE, null, { p: [HW, 0, -HL], ry: -Math.PI / 2 });
  // far gable (s = x)
  panel(g, [[0, HW, flat(0), gab]], HW, RIDGE, gab, { p: [0, 0, -HL], ry: 0 });
  // door wall from inside (s = HW − x): round the roller door opening
  const d0 = HW - DOOR.x1, d1 = HW - DOOR.x0, e0 = HW - SIDE.x1, e1 = HW - SIDE.x0;
  panel(g, [[0, e0, flat(0), gab], [e0, e1, flat(SIDE.h), gab], [e1, d0, flat(0), gab], [d0, d1, flat(DOOR.h), gab], [d1, HW, flat(0), gab]], HW, RIDGE, gab, { p: [HW, 0, 0], ry: Math.PI });
  // galvanised base angle along the foot of the sheets
  const galv = STD({ color: 0x8d9296, metalness: .55, roughness: .5 });
  box(g, .05, .05, HL - 13.2, galv, .025, 0, -(13.2 + HL) / 2).castShadow = false; box(g, .05, .05, HL, galv, HW - .025, 0, -HL / 2).castShadow = false;
  box(g, HW, .05, .05, galv, HW / 2, 0, -HL + .025).castShadow = false;
}

// ---------------- builders ----------------
const crownKind = (ft, n, D, label) => ({ w: 1.2, d: 1.0, h: 1.1, n, D, mats: coverMats('c' + ft, '#1d6658', '#eef0e6', label, { labelSize: 70 }) });
const K12 = crownKind(12, 12, .9, '12FT CROWN × 12'), K14 = crownKind(14, 5, 1.05, '14FT CROWN × 5'), K16 = crownKind(16, 5, 1.15, '16FT CROWN × 5');
const CRATES = [];
const ONTOP = [];   // things sitting on a crate stack: they ride up with the level under them when the stack opens
function crownStack(p, K, x, z, ry, cols) { const g = grp(p, x, 0, z, ry); cols.forEach(([cx, n]) => { for (let i = 0; i < n; i++) { const c = crownCrate(g, K, cx * 1.32, i * 1.24, 0, 0); c.userData.level = i; CRATES.push(c); } }); return g; }
function onTop(o, level, h = 1.1) { ONTOP.push({ o, y0: o.position.y, level, h }); return o; }
function plainStack(p, mats, x, z, ry, cols, w = 1.2, h = 1.04, d = 1.0) { const g = grp(p, x, 0, z, ry); cols.forEach(([cx, n]) => { for (let i = 0; i < n; i++) { const pg = grp(g, cx * (w + .05), i * (h + .2), 0); pallet(pg, w, d); const c = coverMesh(w + .02, h, d + .02, mats); c.position.y = .144 + h / 2; pg.add(c); } }); return g; }
const canvasMats = (ft, range, bg = '#8c2a2b', label = `${ft}ft CANVAS`) => { const key = 'cv' + label + range; return _coverMats[key] || (_coverMats[key] = (() => {
  const front = STD({ map: tex(1024, 680, (x, w, h) => { fabric(x, w, h, bg); x.fillStyle = '#f2e8e2'; x.font = '500 62px Arial'; x.fillText(label, 40, 92); if (range) { x.font = '500 54px Arial'; x.fillText(range, 40, 156); } x.fillStyle = 'rgba(235,235,235,.45)'; x.fillRect(46, 200, 150, 90); drawBadge(x, w / 2 + 70, h / 2 + 10, 210, '#f2e8e2', bg); x.fillStyle = 'rgba(0,0,0,.6)'; for (const nx of [150, 420, 600, 870]) x.fillRect(nx, h - 50, 70, 50); dressFace(x, w, h, { straps: [.93] }); }), roughness: .85, bumpMap: coverBump('cf', 1024, 680, [.93]), bumpScale: 1.4 });
  const side = STD({ map: tex(512, 340, (x, w, h) => { fabric(x, w, h, bg); drawBadge(x, w / 2, h / 2, 120, '#f2e8e2', bg); dressFace(x, w, h, { straps: [.16, .84] }); }), roughness: .85, bumpMap: coverBump('cs', 512, 340, [.16, .84]), bumpScale: 1.4 }); return [side, side, side, side, front, side]; })()); };
function canvasStack(p, ft, x, z, ry, cols, bg, label) { const g = grp(p, x, 0, z, ry); let r = 0; cols.forEach(([cx, n, ranges]) => { for (let i = 0; i < n; i++) { const pg = grp(g, cx * 1.25, i * .84, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(pg, .07, .05, .07, M.red, sx * .55, 0, sz * .45);
  const c = coverMesh(1.2, .78, 1.0, canvasMats(ft, ranges ? ranges[i] : null, bg, label)); c.position.y = .05 + .39; pg.add(c); } }); return g; }
// trellis loads: folded sections laid two side by side, with optional doors on top
function trellisLoad(s, sets, perSet, doorsEach, seed) { let y = .14; for (let set = 0; set < sets; set++) {
    for (let k = 0; k < perSet; k++) { const sec = trellisSection({ seed: seed + set * 7 + k, weathered: .3 }); sec.setOpen(sec.minOpen);
      const lay = new THREE.Group(); lay.rotation.x = -Math.PI / 2; const spin = new THREE.Group(); spin.rotation.z = -Math.PI / 2; lay.add(spin); spin.add(sec);
      sec.position.set(-sec.userData.cx, -sec.userData.height / 2 + sec.userData.end0, 0); const row = Math.floor(k / 2), col = k % 2, alone = k === perSet - 1 && perSet % 2;
      lay.position.set((rnd() - .5) * .06, y + row * .052, alone ? (rnd() - .5) * .2 : (col - .5) * (sec.userData.width + .04)); s.add(lay); }
    y += Math.ceil(perSet / 2) * .052;
    for (let d = 0; d < doorsEach; d++) { const dm = new THREE.Mesh(new THREE.BoxGeometry(1.98, .045, 1.1), [M.pallet, M.pallet, DOORMAT, M.pallet, M.pallet, M.pallet]); dm.position.set((rnd() - .5) * .05, y + .022, (rnd() - .5) * .06); dm.castShadow = dm.receiveShadow = true; s.add(dm); y += .05; } }
  return y; }
function stillageFrame(s, mat, L = 2.3, D = 1.35, post = .95) {
  for (const sz of [-1, 1]) box(s, L, .07, .07, mat, 0, .05, sz * (D / 2 - .04));
  for (const sx of [-1, 1]) { box(s, .07, .07, D, mat, sx * (L / 2 - .04), .05, 0); for (const sz of [-1, 1]) { box(s, .07, post, .07, mat, sx * (L / 2 - .04), 0, sz * (D / 2 - .04)); box(s, .14, .015, .14, mat, sx * (L / 2 - .04), 0, sz * (D / 2 - .04)); const c = new THREE.Mesh(new THREE.ConeGeometry(.05, .08, 8), mat); c.position.set(sx * (L / 2 - .04), post - .02, sz * (D / 2 - .04)); s.add(c); } }
  for (const xx of [-.4, .4]) box(s, .1, .1, D, mat, xx, 0, 0); }
function trellisStillages(p, x, z, ry, levels) { const g = grp(p, x, 0, z, ry); let y = 0;
  levels.forEach((lv, i) => { const s = grp(g, 0, y, 0); stillageFrame(s, M.purple); const top = trellisLoad(s, lv.sets, lv.per, lv.doors, 100 + i * 31 + Math.floor(x * 7 + z));
    if (lv.film !== false) { s.updateWorldMatrix(true, true); const bb = new THREE.Box3().setFromObject(s).applyMatrix4(s.matrixWorld.clone().invert());   // wrap round what's really on it: the folded trellis runs past the frame's ends
      const W = Math.max(2.36, bb.max.x - bb.min.x + .04), D = Math.max(1.41, bb.max.z - bb.min.z + .04), f = filmBox(W, top + .04, D, x * 13.1 + z * 3.7 + i * 1.9);
      f.position.set((bb.max.x + bb.min.x) / 2, (top + .04) / 2, (bb.max.z + bb.min.z) / 2); f.userData.keep = true; s.add(f); }
    y += 1.0; }); return g; }
// bags
const bagGeos = [0, 1, 2, 3].map(() => { const g = new THREE.SphereGeometry(.5, 22, 14), p = g.attributes.position, v = new THREE.Vector3(); const ph = [rnd() * 6, rnd() * 6, rnd() * 6, rnd() * 6];
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); let y = v.y; if (y < -.18) y = -.18 - (y + .18) * .35; const sl = 1 + .22 * Math.max(0, -y);
    const r = 1 + .07 * Math.sin(v.x * 7 + ph[0]) * Math.sin(v.z * 6 + ph[1]) + .05 * Math.sin(v.y * 9 + v.x * 5 + ph[2]) + .03 * Math.sin(v.z * 15 + v.y * 13 + ph[3]);
    v.set(v.x * sl * r, y * r * (y > 0 ? .85 : 1), v.z * sl * r); p.setXYZ(i, v.x, v.y, v.z); } g.computeVertexNormals(); return g; });
const _bm = {}; const bagMat = c => _bm[c] || (_bm[c] = STD({ map: tex(256, 256, (x, w, h) => { fabric(x, w, h, c); for (let i = 0; i < 14; i++) { x.strokeStyle = `rgba(0,0,0,${.06 + rnd() * .08})`; x.lineWidth = 2 + rnd() * 3; x.beginPath(); const y0 = rnd() * h; x.moveTo(0, y0); x.bezierCurveTo(w * .3, y0 + (rnd() - .5) * 60, w * .7, y0 + (rnd() - .5) * 60, w, y0 + (rnd() - .5) * 40); x.stroke(); } }), roughness: .95 }));
const _tm = {}; const tagMat = c => _tm[c] || (_tm[c] = STD({ color: c, roughness: .5, side: THREE.DoubleSide, emissive: c, emissiveIntensity: .12 }));
function bag(p, x, y, z, w, h, d, col, tagCol, ry = 0) { const b = new THREE.Mesh(bagGeos[Math.floor(rnd() * 4)], bagMat(col)); b.scale.set(w, h, d); b.position.set(x, y + h * .5, z); b.rotation.y = ry; b.castShadow = b.receiveShadow = true; p.add(b);
  if (tagCol) { const t = new THREE.Mesh(new THREE.PlaneGeometry(.055, .09), tagMat(tagCol)); t.position.set(x + (rnd() - .5) * w * .5, y + h * (.3 + rnd() * .4), z + d * .5 + .01); t.rotation.set((rnd() - .5) * .4, (rnd() - .5) * .4, (rnd() - .5) * .6); p.add(t); } }
function bagRack(p, x, z, ry, levels, step, cols, tagCol, mat = M.stillGreen, w = 1.25, d = 1.05) { const g = grp(p, x, 0, z, ry);
  for (let lv = 0; lv < levels; lv++) { const s = grp(g, 0, lv * step, 0);
    for (const sx of [-1, 1]) { box(s, .06, .06, d, mat, sx * (w / 2 - .03), .02, 0); for (const sz of [-1, 1]) { box(s, .055, step - .03, .055, mat, sx * (w / 2 - .03), 0, sz * (d / 2 - .03)); const c = new THREE.Mesh(new THREE.ConeGeometry(.05, .08, 8), mat); c.position.set(sx * (w / 2 - .03), step - .05, sz * (d / 2 - .03)); s.add(c); } }
    for (const sz of [-1, 1]) box(s, w, .06, .06, mat, 0, .02, sz * (d / 2 - .03)); for (const xx of [-.3, .3]) box(s, .12, .04, d, mat, xx, .02, 0);
    const n = 5 + Math.floor(rnd() * 3); for (let k = 0; k < n; k++) { const c = cols[Math.floor(rnd() * cols.length)], row = k < 3 ? 0 : 1; bag(s, -w / 2 + .22 + (k % 3) * ((w - .44) / 2) + (rnd() - .5) * .1, .06 + row * step * .36, (rnd() - .5) * .3 + (row ? -.12 : .12), .46 + rnd() * .14, step * (.46 + rnd() * .1), .58 + rnd() * .14, c, tagCol, (rnd() - .5) * 1.2); } }
  return g; }
// pole stillages
const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), v4 = new THREE.Vector3(), s4 = new THREE.Vector3(), c4 = new THREE.Color();
const hollowGeo = r => { const s = new THREE.Shape(); s.absarc(0, 0, r, 0, Math.PI * 2); const h = new THREE.Path(); h.absarc(0, 0, r * .82, 0, Math.PI * 2, true); s.holes.push(h); const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false, curveSegments: 12 }); g.translate(0, 0, -.5); return g; };
function tubes(p, n, x0, x1, y0, rows, len, r, mat, o = {}) { const geo = o.hollow ? hollowGeo(r) : (() => { const g = new THREE.CylinderGeometry(r, r, 1, 10); g.rotateX(Math.PI / 2); return g; })();
  const im = new THREE.InstancedMesh(geo, mat, n), per = Math.ceil(n / rows);
  for (let i = 0; i < n; i++) { const row = Math.floor(i / per), k = i % per; e4.set((rnd() - .5) * (o.tilt || .03), (rnd() - .5) * (o.yaw || .04), 0); q4.setFromEuler(e4);
    v4.set(x0 + (k + .5) / per * (x1 - x0) + (rnd() - .5) * r, y0 + r + row * r * 1.9, (o.z || 0) + (rnd() - .5) * (o.zj || .3)); s4.set(1, 1, len * (.85 + rnd() * .3)); m4.compose(v4, q4, s4); im.setMatrixAt(i, m4);
    if (o.tint) { const t = .85 + rnd() * .3; im.setColorAt(i, c4.setRGB(t, t * .93, t * .8)); } }
  im.castShadow = im.receiveShadow = true; p.add(im); return im; }
function rolls(p, n, x0, x1, y0, len, r, z = 0) { for (let i = 0; i < n; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 18), MX.jute); c.rotation.x = Math.PI / 2; c.position.set(x0 + (i + .5) / n * (x1 - x0), y0 + r, z + (rnd() - .5) * .3); c.castShadow = c.receiveShadow = true; p.add(c); } }
function lump(p, x, y, z, w, h, d, mat) { const g = new THREE.BoxGeometry(w, h, d, 6, 4, 6), pp = g.attributes.position; for (let i = 0; i < pp.count; i++) if (pp.getY(i) > 0) pp.setY(i, pp.getY(i) + (rnd() - .5) * h * .3); g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); m.position.set(x, y + h / 2, z); m.castShadow = m.receiveShadow = true; p.add(m); return m; }
function blackCrate(p, x, y, z, w = .75, h = .36, d = .55, ry = 0, label) { const g = grp(p, x, y, z, ry); const lid = label ? STD({ map: tex(256, 128, (c, W, H) => { c.fillStyle = '#1d1f22'; c.fillRect(0, 0, W, H); c.fillStyle = '#eee'; c.font = 'italic 26px Comic Sans MS, cursive'; c.fillText(label, 20, 60); }) }) : MX.black;
  box(g, w, h, d, [MX.black, MX.black, MX.black, MX.black, lid, MX.black], 0, 0, 0); box(g, w + .03, .04, d + .03, MX.black, 0, h - .02, 0); return g; }
function poleLevel(p, y, h, mat, W = 1.05, D = 2.4, mesh = false) { const s = grp(p, 0, y, 0);
  for (const sx of [-1, 1]) { box(s, .06, .07, D, mat, sx * (W / 2 - .03), 0, 0); for (const sz of [-1, 1]) { box(s, .06, h - .02, .06, mat, sx * (W / 2 - .03), 0, sz * (D / 2 - .03)); const c = new THREE.Mesh(new THREE.ConeGeometry(.06, .1, 8), mat); c.position.set(sx * (W / 2 - .03), h - .05, sz * (D / 2 - .03)); s.add(c); } }
  for (const sz of [-1, 1]) box(s, W, .07, .06, mat, 0, 0, sz * (D / 2 - .03)); box(s, W - .1, .015, D - .1, STD({ color: 0x4e1f1b, metalness: .4 }), 0, .06, 0);
  if (mesh) { const mm = new THREE.MeshStandardMaterial({ map: tex(256, 256, (x, w, hh) => { x.strokeStyle = '#6a2420'; x.lineWidth = 2; for (let i = 0; i < w; i += 12) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, hh); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); } }), transparent: true, alphaTest: .5, side: THREE.DoubleSide });
    for (const sz of [-1, 1]) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(W, h - .1), mm); pl.position.set(0, h / 2, sz * D / 2); s.add(pl); } for (const sx of [-1, 1]) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(D, h - .1), mm); pl.rotation.y = Math.PI / 2; pl.position.set(sx * W / 2, h / 2, 0); s.add(pl); } }
  return s; }
const RAFTER = STD({ map: grain('#d9bb8c', '140,100,55', 256, 32, 1) });
function poleStillage(p, x, z, ry, levels, fills, mat = M.red, W = 1.05, D = 2.6) { const g = grp(p, x, 0, z, ry); let y = 0;
  levels.forEach((h, i) => { const s = poleLevel(g, y, h, mat, W, D, fills[i] === 'cage'); fill(s, fills[i], h, W, D); y += h; }); return g; }
function fill(s, kind, h, W, D) {
  if (kind === 'rafters') tubes(s, 36, -W / 2 + .08, W / 2 - .08, .08, 3, D + .3, .024, RAFTER, { tint: true, zj: .15 });
  // yurt roof poles by size: length ≈ (radius − crown radius) ÷ cos(roof pitch ≈ 32°) + 0.1 m at the ends
  else if (kind === 'r16') tubes(s, 36, -W / 2 + .08, W / 2 - .08, .08, 3, 2.3, .026, RAFTER, { tint: true, zj: .15 });
  else if (kind === 'r14') tubes(s, 38, -W / 2 + .08, W / 2 - .08, .08, 3, 2.0, .024, RAFTER, { tint: true, zj: .15 });
  else if (kind === 'r12') tubes(s, 40, -W / 2 + .08, W / 2 - .08, .08, 3, 1.7, .022, RAFTER, { tint: true, zj: .15 });
  else if (kind === 'poles') tubes(s, 20, -W / 2 + .1, W / 2 - .1, .08, 2, D + 1.2, .06, RAFTER, { tint: true, zj: .4 });
  else if (kind === 'alu') { tubes(s, 16, -W / 2 + .08, W / 2 - .08, .08, 2, D + .4, .032, MX.alu, { hollow: true, z: .2, tilt: .06 }); if (rnd() < .5) lump(s, 0, .25, -.4, W - .2, .25, 1.0, MX.white); }
  else if (kind === 'coir') { rolls(s, 3, -W / 2 + .05, W / 2 - .05, .08, 1.4, .16); lump(s, 0, .4, .2, W - .2, .3, 1.4, MX.jute); }
  else if (kind === 'cage') { lump(s, 0, .08, 0, W - .15, h * .6, D - .2, MX.white); }
  else if (kind === 'crates') { blackCrate(s, 0, .08, .4); blackCrate(s, 0, .08, -.5); lump(s, 0, .45, 0, W - .2, .25, 1.6, MX.jute); }
  else if (kind === 'timber') { for (let k = 0; k < 18; k++) box(s, .09, .05, D + .5, MX.timber, -W / 2 + .1 + (k % 6) * ((W - .2) / 5), .08 + Math.floor(k / 6) * .055, (rnd() - .5) * .2); } }
// ---------------- pallet racking (16 Oct: racking paint, Josh's textures request) ----------------
// Colours read off Josh's LiDAR scan (numbers only, bin/scan_colours.py): uprights are blue (scan ≈ 43/61/92, highlights 92/119/158),
// the yard-bay beams a burnt orange (saturated texels ≈ 174/108/60 at their brightest: more amber than the old 0xe0601e), the yellow
// beams golden (≈ 137/104/41). Uprights: 80 mm punched-slot section, slots every 50 mm, chips and forklift scuffs in the bottom
// 600 mm. Beams: box-section step beams with welded end connectors and a red safety-lock pin, powder coat with orange peel, chips
// to bare steel and dust on top. End frames: zig-zag bracing, base plates with two anchors, one SWL sign per run at the aisle end.
// Own RNG, so nothing else in the layout moves.
const RACK = (() => {
  let sd = 9311; const fr = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const can = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  const toTex = (c, srgb = true) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const rgb = (h, k = 1) => [(h >> 16) & 255, (h >> 8) & 255, h & 255].map(v => Math.round(Math.min(255, v * k)));   // sRGB bytes (THREE.Color.r is linear: canvases came out too dark and red)
  const chip = (x, cx, cy, r, fill) => { x.fillStyle = fill; x.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283, rr = r * (.5 + fr() * .7); x.lineTo(cx + Math.cos(a) * rr * 1.6, cy + Math.sin(a) * rr); } x.fill(); };
  // powder coat: base + orange-peel mottling, fine dust speckle
  const coat = (x, w, h, col) => { const [r, g, b] = rgb(col); x.fillStyle = `rgb(${r},${g},${b})`; x.fillRect(0, 0, w, h);
    for (let i = 0; i < w * h / 18; i++) { const v = (fr() - .5) * 18; x.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 255 * 2.2})`; x.fillRect(fr() * w, fr() * h, 1.5, 1.5); } };
  // --- upright: one canvas per height and variant; u across the 80 mm face (32 px), v up (≈ 200 px/m)
  const upMats = {};
  function upright(H, k) { const key = H.toFixed(2) + ':' + k; if (upMats[key]) return upMats[key];
    const PX = 200, h = Math.round(H * PX), [c, x] = can(32, h); coat(x, 32, h, 0x2f4a78);
    for (let i = 0; i < 32; i++) { const e = Math.abs(i - 15.5) / 15.5; x.fillStyle = `rgba(0,0,0,${e > .8 ? (e - .8) * 1.6 : 0})`; x.fillRect(i, 0, 1, h); }   // rolled edges darker
    for (let yy = 0; yy < h; yy += 10) for (const sx of [6, 22]) { x.fillStyle = '#0d1420'; x.fillRect(sx - 2, h - yy - 7, 4, 6); x.beginPath(); x.arc(sx, h - yy - 7, 2, 0, 7); x.fill(); x.fillStyle = 'rgba(160,185,220,.35)'; x.fillRect(sx - 2, h - yy - 1, 4, 1); }   // teardrop slots, lit lower lip
    for (let i = 0; i < 26; i++) { const yy = h - fr() * .6 * PX; chip(x, fr() * 32, yy, 1 + fr() * 3, fr() < .6 ? 'rgba(150,152,150,.9)' : 'rgba(70,52,40,.8)'); }   // forklift chips low down: bare steel, a bit of rust
    for (let i = 0; i < 5; i++) { x.strokeStyle = `rgba(200,205,205,${.25 + fr() * .3})`; x.lineWidth = 1; const y0 = h - (.08 + fr() * .5) * PX; x.beginPath(); x.moveTo(0, y0); x.lineTo(32, y0 + (fr() - .5) * 8); x.stroke(); }   // scrapes across
    for (let i = 0; i < 4 + k; i++) chip(x, fr() * 32, fr() * h, 1 + fr() * 1.5, 'rgba(150,152,150,.8)');
    const gr = x.createLinearGradient(0, h, 0, h - .35 * PX); gr.addColorStop(0, 'rgba(90,75,55,.45)'); gr.addColorStop(1, 'rgba(90,75,55,0)'); x.fillStyle = gr; x.fillRect(0, h - .35 * PX, 32, .35 * PX);   // floor splash
    const side = STD({ map: toTex(c), roughness: .55, metalness: .35 }), plain = STD({ color: 0x24375a, roughness: .6, metalness: .35 });
    return (upMats[key] = [side, side, plain, plain, side, side]); }
  // --- beams: one canvas per colour and variant over the whole beam front (u along, v up 120 mm)
  const bmMats = {};
  function beam(col, L, k) { const key = col + ':' + k; if (bmMats[key]) return bmMats[key];
    const [c, x] = can(1024, 48); coat(x, 1024, 48, col);
    const gr = x.createLinearGradient(0, 0, 0, 48); gr.addColorStop(0, 'rgba(255,255,255,.10)'); gr.addColorStop(.12, 'rgba(255,255,255,0)'); gr.addColorStop(.85, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.25)'); x.fillStyle = gr; x.fillRect(0, 0, 1024, 48);   // rolled top and bottom edges
    for (let i = 0; i < 10 + k * 4; i++) chip(x, fr() * 1024, fr() < .7 ? 44 + fr() * 4 : fr() * 48, 1 + fr() * 3, fr() < .7 ? 'rgba(120,118,112,.9)' : 'rgba(60,40,28,.85)');   // chips, mostly on the bottom edge where pallets drag
    for (let i = 0; i < 3 + k; i++) { x.strokeStyle = `rgba(40,30,25,${.12 + fr() * .2})`; x.lineWidth = 1 + fr() * 2; const x0 = fr() * 1000, y0 = 4 + fr() * 40; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + 30 + fr() * 120, y0 + (fr() - .5) * 6); x.stroke(); }   // black rubber / pallet scuffs
    if (k === 1) { x.fillStyle = '#f2f0e8'; x.fillRect(470, 10, 84, 28); x.fillStyle = '#1b1b1b'; x.font = 'bold 11px sans-serif'; x.fillText('LOC  B-' + (2 + Math.floor(fr() * 7)), 476, 22); x.font = '9px sans-serif'; x.fillText('2000 kg UDL', 476, 34); }   // a beam location label
    const front = STD({ map: toTex(c), roughness: .45, metalness: .25 });
    const [tc, tx] = can(512, 16); coat(tx, 512, 16, col); for (let i = 0; i < 900; i++) { tx.fillStyle = `rgba(150,140,120,${.15 + fr() * .3})`; tx.fillRect(fr() * 512, fr() * 16, 2, 1.5); }   // dust on the top
    const top = STD({ map: toTex(tc), roughness: .8, metalness: .15 });
    return (bmMats[key] = [front, front, top, front, front, front]); }
  const conMat = col => STD({ color: new THREE.Color(col).multiplyScalar(.92), roughness: .5, metalness: .3 });
  const steel = STD({ color: 0x9a9fa2, roughness: .45, metalness: .7 }), pin = STD({ color: 0xc8261e, roughness: .45 }), brace = STD({ color: 0x2b4470, roughness: .55, metalness: .35 });
  const sign = (() => { const [c, x] = can(256, 320); x.fillStyle = '#f7f6f1'; x.fillRect(0, 0, 256, 320); x.fillStyle = '#c8261e'; x.fillRect(0, 0, 256, 54); x.fillStyle = '#fff'; x.font = 'bold 30px sans-serif'; x.fillText('SAFE LOAD', 38, 38);
    x.fillStyle = '#1b1b1b'; x.font = 'bold 20px sans-serif'; ['Max per beam level', '2000 kg', 'evenly spread', '', 'Max per bay', '6000 kg', '', 'Report all damage'].forEach((t, i) => { x.font = (i === 1 || i === 5 ? 'bold 34px' : '18px') + ' sans-serif'; x.fillText(t, 20, 86 + i * 30); });
    x.strokeStyle = '#1b1b1b'; x.lineWidth = 4; x.strokeRect(2, 2, 252, 316); return STD({ map: toTex(c), roughness: .6 }); })();
  return { upright, beam, conMat, steel, pin, brace, sign, fr };
})();
function racking(p, x, z, ry, bays, beams, bw = 2.7, dep = 1.1, beamMat = MX.orange, fillFn) { const g = grp(p, x, 0, z, ry), H = beams[beams.length - 1] + 1.2, R = RACK;
  const col = beamMat === MX.orange ? 0xd06a2e : beamMat === MX.yellow ? 0xdcab2a : beamMat.color.getHex(), con = R.conMat(col);
  for (let b = 0; b <= bays; b++) {
    for (const zz of [-dep / 2, dep / 2]) { box(g, .08, H, .08, R.upright(H, Math.floor(R.fr() * 3)), b * bw, 0, zz);
      box(g, .16, .008, .16, R.steel, b * bw, 0, zz); for (const ax of [-.05, .05]) cyl(g, .008, .03, R.steel, b * bw + ax, .02, zz); }   // base plate + two anchor bolts
    // end frame: bottom and top horizontals, zig-zag diagonals between (C-section, a shade darker)
    const ys = [.15]; while (ys[ys.length - 1] + 1.0 < H - .3) ys.push(ys[ys.length - 1] + 1.0); ys.push(H - .15);
    for (const yy of [ys[0], ys[ys.length - 1]]) box(g, .03, .04, dep - .08, R.brace, b * bw, yy - .02, 0);
    for (let i = 0; i < ys.length - 1; i++) { const dy = ys[i + 1] - ys[i], L = Math.hypot(dy, dep - .08), m = new THREE.Mesh(new THREE.BoxGeometry(.03, L, .04), R.brace);
      m.position.set(b * bw, (ys[i] + ys[i + 1]) / 2, 0); m.rotation.x = (i % 2 ? 1 : -1) * Math.atan2(dep - .08, dy); m.castShadow = m.receiveShadow = true; g.add(m); }
    if (b === 0) { const s = new THREE.Mesh(new THREE.PlaneGeometry(.2, .25), R.sign); s.position.set(-.042, 1.55, dep / 2 - .22); s.rotation.y = -Math.PI / 2; g.add(s); } }   // SWL sign on the run's end frame
  for (let b = 0; b < bays; b++) for (const yy of beams) { for (const zz of [-dep / 2, dep / 2]) { const k = Math.floor(R.fr() * 3), out = zz > 0 ? 1 : -1, L = bw - .1;
      box(g, L, .12, .05, R.beam(col, L, zz > 0 && yy > .5 ? k : 0), b * bw + bw / 2, yy, zz);
      box(g, L, .025, .02, con, b * bw + bw / 2, yy + .095, zz - out * .033);   // the step the decking/pallets sit in
      for (const ex of [b * bw + .065, b * bw + bw - .065]) { box(g, .035, .18, .052, con, ex, yy - .03, zz);   // welded end connector over the upright face
        if (zz > 0) { const pp = cyl(g, .007, .02, R.pin, ex + (ex < b * bw + 1 ? .03 : -.03), yy + .14, zz + .03, 'z', 8); } } }   // red safety-lock pin
    if (fillFn) fillFn(g, b * bw + bw / 2, yy + .12, b, yy); }
  return g; }
function rackFill(g, cx, y) { for (let k = 0; k < 3; k++) { const x = cx - .85 + k * .85, kind = rnd();
  if (kind < .3) { box(g, .62, .4, .78, STD({ color: 0xe9eef0, transparent: true, opacity: .75, roughness: .2 }), x, y, 0); box(g, .66, .04, .82, STD({ color: 0xd5dde1 }), x, y + .4, 0); }
  else if (kind < .6) box(g, .7, .45 + rnd() * .15, .8, STD({ map: tex(128, 128, (c, w, h) => { c.fillStyle = '#b48a58'; c.fillRect(0, 0, w, h); c.fillStyle = '#8a6a40'; c.fillRect(0, h / 2 - 4, w, 8); }) }), x, y, 0);
  else if (kind < .85) { box(g, .78, .55, .6, MX.ply, x, y, 0); for (const s of [-1, 1]) box(g, .1, .04, .02, MX.alu, x + s * .2, y + .4, .31); }
  else box(g, .75, .5, .75, STD({ color: 0x2c5fa0, roughness: .5 }), x, y, 0); } }

// ---- yard-bay stock, bay by bay from the LiDAR elevations (16 Oct 06:xx) ----
// What the scan's front elevations of the orange run show, read per bay and level (numbers and shapes only; no scan texture used):
// far bays: stacks of folded grey/white sheeting low down, folded striped rugs (brown, maroon, cream) above, pale beige and grey bags
// on top (grey and beige bags = bells); by the door: mixed small stock (boxes, totes, jerry cans, an orange-and-yellow tangle = cable).
// Builders with real cues instead of plain blocks: folded stacks show their folds and layer edges, rugs show kilim stripes on the
// folded edge, bags slump, boxes have tape and a label, totes have rims and hand slots, cable reels have flanges and coils.
// Own RNG so nothing else in the seeded layout moves.
const STOCK = (() => {
  let sd = 9127; const fr = () => (sd = (sd * 16807) % 2147483647) / 2147483647, fx = (a, b) => a + (b - a) * fr();
  const can = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  const toTex = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const hex = h => `${(h >> 16) & 255},${(h >> 8) & 255},${h & 255}`;
  const noise = (x, w, h, n, a) => { for (let i = 0; i < n; i++) { x.fillStyle = `rgba(${fr() > .5 ? '255,255,255' : '0,0,0'},${a * fr()})`; x.fillRect(fr() * w, fr() * h, 1 + fr() * 2, 1 + fr() * 2); } };
  // a folded layer: soft slab whose front edge bulges and rolls (the fold), top a touch domed; jittered so no two match
  const slabGeo = () => { const g = new THREE.BoxGeometry(1, 1, 1, 10, 3, 6), P = g.attributes.position, ph = fx(0, 6), ph2 = fx(0, 6);
    for (let i = 0; i < P.count; i++) { let x = P.getX(i), y = P.getY(i), z = P.getZ(i);
      const r = Math.max(Math.abs(y) * 2, 0); const roll = z > 0 ? (1 - r * r) * .06 : 0;          // the fold bulges forward at mid-height
      x += Math.sin(z * 4 + ph) * .012; z += roll + Math.sin(x * 5 + ph2) * .02;
      y += (y > 0 ? .08 * (1 - x * x * 4) * (1 - z * z * 4) : 0) + Math.sin(x * 7 + ph) * .04;        // domed top, wavy layer line
      P.setXYZ(i, x, y, z); }
    g.computeVertexNormals(); return g; };
  const SLABS = [0, 1, 2, 3, 4, 5].map(slabGeo);
  // fabric textures: plain sheeting (grey/white, PVC sheen), striped rug (kilim bands); u along the width, v up the folded edge
  const sheetMat = col => { const [c, x] = can(256, 128); x.fillStyle = `rgb(${hex(col)})`; x.fillRect(0, 0, 256, 128); noise(x, 256, 128, 2500, .08);
    for (let i = 0; i < 6; i++) { const y = fx(10, 118); x.strokeStyle = `rgba(0,0,0,${fx(.05, .14)})`; x.lineWidth = fx(1, 3); x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(80, y + fx(-8, 8), 170, y + fx(-8, 8), 256, y + fx(-5, 5)); x.stroke(); }   // creases
    const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, 'rgba(255,255,255,.12)'); g.addColorStop(.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.25)'); x.fillStyle = g; x.fillRect(0, 0, 256, 128);   // fold shading
    for (let i = 0; i < 5; i++) { x.fillStyle = `rgba(110,95,75,${fx(.05, .12)})`; x.beginPath(); x.ellipse(fx(0, 256), fx(60, 128), fx(10, 40), fx(4, 10), 0, 0, 7); x.fill(); }   // grubby patches
    return STD({ map: toTex(c), roughness: .55 }); };
  const RUGS = [[0x6e2a24, 0xd8c7a4, 0x2e2a36, 0xb0652e], [0x8a5a33, 0xe2d6bc, 0x3d2b22, 0x7a2f2a], [0x4a3426, 0xcdb48a, 0x8e3b2c, 0x2c3a44], [0x9a7a52, 0x5b2b2a, 0xe7dcc5, 0x3a3a3a]];
  const rugMat = pal => { const [c, x] = can(512, 128); x.fillStyle = `rgb(${hex(pal[0])})`; x.fillRect(0, 0, 512, 128);
    let u = 0; while (u < 512) { const bw = fx(6, 40), col = pal[Math.floor(fr() * pal.length)]; x.fillStyle = `rgb(${hex(col)})`; x.fillRect(u, 0, bw, 128);
      if (fr() < .5) { x.fillStyle = `rgb(${hex(pal[Math.floor(fr() * pal.length)])})`; for (let y = 0; y < 128; y += 16) { x.beginPath(); x.moveTo(u + bw / 2, y); x.lineTo(u + bw, y + 8); x.lineTo(u + bw / 2, y + 16); x.lineTo(u, y + 8); x.fill(); } }   // kilim diamonds
      u += bw; }
    for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(${fr() > .5 ? '255,240,210' : '0,0,0'},${fx(.03, .1)})`; x.fillRect(fr() * 512, fr() * 128, 1, 2); }   // wool pile
    const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, 'rgba(255,255,255,.1)'); g.addColorStop(.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.3)'); x.fillStyle = g; x.fillRect(0, 0, 512, 128);
    return STD({ map: toTex(c), roughness: .97 }); };
  const SHEETS = [0xc9ccca, 0xe6e6e1, 0x9ea4a6, 0xb7bcb8, 0xd9dbd4].map(sheetMat), RUGM = RUGS.map(rugMat);
  function foldStack(p, cx, y, z, w, d, n, mats, lh = [.07, .12]) { const g = grp(p, cx, y, z); let yy = 0;
    for (let i = 0; i < n; i++) { const h = fx(lh[0], lh[1]), m = new THREE.Mesh(SLABS[Math.floor(fr() * SLABS.length)], mats[Math.floor(fr() * mats.length)]);
      m.scale.set(w * fx(.93, 1.03), h, d * fx(.92, 1.02)); m.position.set(fx(-.04, .04), yy + h / 2, fx(-.03, .04)); m.rotation.y = fx(-.05, .05); m.castShadow = m.receiveShadow = true; g.add(m); yy += h * .92; }
    return g; }
  // bags: slumped bodies in canvas duffle colours (grey/beige = bells), webbing handles, a kit tag
  const bagM = {}; const bagMt = col => bagM[col] || (bagM[col] = (() => { const [c, x] = can(256, 256); x.fillStyle = `rgb(${hex(col)})`; x.fillRect(0, 0, 256, 256); noise(x, 256, 256, 4000, .1);
    for (let i = 0; i < 12; i++) { x.strokeStyle = `rgba(0,0,0,${fx(.06, .16)})`; x.lineWidth = fx(2, 5); x.beginPath(); const y0 = fx(0, 256); x.moveTo(0, y0); x.bezierCurveTo(80, y0 + fx(-50, 50), 180, y0 + fx(-50, 50), 256, y0 + fx(-30, 30)); x.stroke(); }
    x.fillStyle = 'rgba(40,36,30,.5)'; x.fillRect(0, 124, 256, 8);   // the zip seam
    return STD({ map: toTex(c), roughness: .93 }); })());
  const web = STD({ color: 0x24262a, roughness: .8 });
  function duffle(p, x, y, z, w, h, d, col, tagCol) { const g = grp(p, x, y, z, fx(-.15, .15)); const b = new THREE.Mesh(bagGeos[Math.floor(fr() * 4)], bagMt(col)); b.scale.set(w, h, d); b.position.y = h * .48; b.castShadow = b.receiveShadow = true; g.add(b);
    for (const s of [-1, 1]) { const t = new THREE.Mesh(new THREE.TorusGeometry(.09, .012, 5, 12, Math.PI), web); t.position.set(s * w * .18, h * .93, 0); t.rotation.y = Math.PI / 2; g.add(t); }
    if (tagCol) box(g, .07, .1, .006, STD({ color: tagCol, roughness: .5 }), w * .3, h * .5, d * .48);
    return g; }
  // cardboard box with tape, flap line and a shipping label
  const card = (() => { const [c, x] = can(256, 256); x.fillStyle = '#b88d5c'; x.fillRect(0, 0, 256, 256); noise(x, 256, 256, 3000, .07); for (let i = 0; i < 256; i += 6) { x.fillStyle = 'rgba(95,62,30,.05)'; x.fillRect(0, i, 256, 2); }
    x.fillStyle = 'rgba(80,50,20,.18)'; x.fillRect(0, 0, 256, 10); return STD({ map: toTex(c), roughness: .92 }); })();
  const tape = STD({ color: 0xc59c5f, roughness: .3 }), lab = (() => { const [c, x] = can(128, 96); x.fillStyle = '#f2f0ea'; x.fillRect(0, 0, 128, 96); x.fillStyle = '#222'; for (let i = 0; i < 6; i++) x.fillRect(10, 14 + i * 12, 40 + fr() * 60, 4); for (let i = 0; i < 30; i++) x.fillRect(70 + i * 1.6, 70, fr() < .5 ? 1 : 2, 18); return STD({ map: toTex(c), roughness: .6 }); })();
  function cardBox(p, x, y, z, w, h, d) { const g = grp(p, x, y, z, fx(-.06, .06)); box(g, w, h, d, card, 0, 0, 0);
    box(g, .05, .003, d + .006, tape, 0, h, 0); box(g, .05, .09, .003, tape, 0, h - .09, d / 2 + .0015); box(g, w - .01, .002, .003, STD({ color: 0x3b2a18 }), 0, h - .004, d / 2 + .0016);
    const l = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(.12, w * .3), Math.min(.09, h * .35)), lab); l.position.set(w * .22, h * .45, d / 2 + .003); g.add(l); return g; }
  // stacking tote: tapered body, rim, ribs, hand slots
  function tote(p, x, y, z, w, h, d, col) { const g = grp(p, x, y, z), m = STD({ color: col, roughness: .45 }), dk = STD({ color: 0x07090b, roughness: .9 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(.5, .45, 1, 4, 1), m); body.rotation.y = Math.PI / 4; body.scale.set(w * 1.38, h - .03, d * 1.38); body.position.y = (h - .03) / 2; body.castShadow = body.receiveShadow = true; g.add(body);
    box(g, w, .03, d, m, 0, h - .03, 0); for (const sx of [-1, 1]) box(g, .004, .035, .13, dk, sx * (w * .47 + .003), h - .085, 0);
    for (let i = 1; i < 4; i++) box(g, .012, h * .6, .006, m, -w / 2 + i * w / 4, h * .15, d * .48); return g; }
  // pressed-steel jerry can (green), X pressing, three-bar handle, spout cap
  const jm = STD({ color: 0x4b6b34, roughness: .55, metalness: .2 }), jd = STD({ color: 0x3b5629, roughness: .6 }), cap = STD({ color: 0x22261f });
  function jerry(p, x, y, z, ry = 0) { const g = grp(p, x, y, z, ry), W = .165, H = .40, D = .345; box(g, W, H, D, jm, 0, 0, 0); box(g, W + .008, .02, D + .008, jm, 0, H * .5 - .01, 0);
    const a = Math.atan2(D - .06, H - .06), L = Math.hypot(D - .06, H - .06); for (const sx of [-1, 1]) for (const k of [1, -1]) { const s = new THREE.Mesh(new THREE.BoxGeometry(.006, L, .028), jd); s.position.set(sx * (W / 2 + .002), H / 2, 0); s.rotation.x = k * a; g.add(s); }
    for (const dz of [-.085, 0, .085]) box(g, .028, .055, .022, jm, 0, H, dz - .03); box(g, .028, .024, .22, jm, 0, H + .055, -.03); cyl(g, .024, .05, cap, 0, H + .02, .13); return g; }
  // cable reel: two ply flanges, a drum wound with orange or yellow flex, a loose tail
  function reel(p, x, y, z, r, wd, col) { const g = grp(p, x, y + r, z), fl = STD({ map: card.map, color: 0xd9c09a, roughness: .8 }), cm = STD({ color: col, roughness: .5 });
    for (const s of [-1, 1]) cyl(g, r, .018, fl, s * wd / 2, 0, 0, 'x', 24);
    cyl(g, r * .82, wd - .03, cm, 0, 0, 0, 'x', 24);
    for (let i = 0; i < 7; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(r * .82, .012, 6, 28), cm); t.rotation.y = Math.PI / 2; t.position.x = -wd / 2 + .03 + i * (wd - .06) / 6; g.add(t); }
    const tail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, -r * .5, r * .8), new THREE.Vector3(.1, -r * .9, r * 1.05), new THREE.Vector3(.25, -r, r * 1.0)]), 12, .012, 6), cm); g.add(tail);
    return g; }
  // ---- what goes on each bay/level of the orange run (b: 0 = far end … 4 = door; level 0/1/2 = bottom/middle/top beam) ----
  // returns true if this bay-level was filled here (planters sit in b 2–3, levels 0–1, handled by PLANTER)
  function fill(g, cx, y, b, lv) {
    const S = SHEETS, items = [];
    const at = (o, name, what, size) => { items.push([o, name, what, size]); return o; };
    if (b === 0 && lv === 0) { at(foldStack(g, cx - .72, y, 0, 1.2, .95, 9, [S[0], S[2], S[3]]), 'Folded sheeting', 'Grey PVC sheeting folded and stacked (groundsheets or covers). The scan shows grey-white layers here.', '≈ 1.2 × 0.95 m · ~0.9 m tall');
      tote(g, cx + .45, y, .05, .6, .42, .4, 0x2c5fa0); tote(g, cx + .45, y + .42, .05, .6, .42, .4, 0x2c5fa0); jerry(g, cx + 1.02, y, .2, .1); jerry(g, cx + 1.02, y, -.2, -.05); }
    else if (b === 0 && lv === 1) { at(foldStack(g, cx - .7, y, 0, 1.25, .95, 7, RUGM, [.08, .13]), 'Folded rugs', 'Woven rugs folded and stacked. The scan shows striped layers here.', '≈ 1.25 × 0.95 m'); cardBox(g, cx + .55, y, 0, .62, .48, .55); cardBox(g, cx + .55, y + .48, .02, .5, .36, .45); }
    else if (b === 0 && lv === 2) { for (const [dx, col] of [[-.85, 0xcbbd9c], [0, 0xd3c6a8], [.85, 0x9a9b97]]) at(duffle(g, cx + dx, y, 0, .85, .62, .9, col, 0x8ac43f), 'Bell tent bag', 'A packed bell tent in its bag on the top beam (grey and beige bags = bells). The scan shows pale bags here.', '≈ 0.85 × 0.9 m'); }
    else if (b === 1 && lv === 0) { at(foldStack(g, cx - .4, y, 0, 1.6, .98, 10, [S[0], S[1], S[4], S[2]], [.06, .1]), 'Folded sheeting', 'A tall stack of folded grey and white sheeting. The scan shows grey-white striped layers here.', '≈ 1.6 × 1.0 m · ~0.8 m tall'); jerry(g, cx + .82, y, .15, .2); jerry(g, cx + 1.0, y, .15, -.1); jerry(g, cx + .9, y, -.25, 0); }
    else if (b === 1 && lv === 1) { at(foldStack(g, cx - .6, y, 0, 1.4, .95, 8, RUGM, [.08, .13]), 'Folded rugs', 'Folded rugs in browns, maroons and cream. The scan shows brown and maroon stripes here.', '≈ 1.4 × 0.95 m'); cardBox(g, cx + .72, y, 0, .7, .5, .6); }
    else if (b === 1 && lv === 2) { at(duffle(g, cx - .7, y, 0, .9, .66, .9, 0x9a9b97, 0xd23b2b), 'Bell tent bag', 'Grey bell bag with a red tag (red = bad: needs a look).', '≈ 0.9 × 0.9 m'); duffle(g, cx + .2, y, 0, .8, .55, .85, 0xc8bb98, 0x8ac43f); cardBox(g, cx + .9, y, 0, .55, .45, .5); }
    else if (b === 4 && lv === 0) { at(reel(g, cx - .8, y, .05, .3, .38, 0xe8742a), 'Cable reel', 'Orange flex on a reel. The scan shows orange and yellow coils low in this bay.', '≈ 0.6 m reel'); reel(g, cx - .25, y, .05, .26, .34, 0xe3b11c);
      tote(g, cx + .45, y, .05, .6, .42, .4, 0x2c5fa0); jerry(g, cx + 1.0, y, .2, 0); jerry(g, cx + 1.0, y, -.2, .1); cardBox(g, cx + .45, y + .42, .05, .5, .32, .4); }
    else if (b === 4 && lv === 1) { cardBox(g, cx - .85, y, 0, .7, .55, .6); cardBox(g, cx - .85, y + .55, .02, .6, .4, .55); cardBox(g, cx - .12, y, 0, .6, .6, .6); at(foldStack(g, cx + .75, y, 0, .95, .9, 6, RUGM, [.08, .12]), 'Folded rugs', 'A short stack of folded rugs.', '≈ 0.95 × 0.9 m'); }
    else if (b === 4 && lv === 2) { duffle(g, cx - .8, y, 0, .8, .55, .85, 0x9a9b97, 0x8ac43f); duffle(g, cx + .1, y, 0, .85, .6, .9, 0xcbbd9c, 0x8ac43f); }
    else if ((b === 2 || b === 3) && lv === 2) { duffle(g, cx - .6, y, 0, .85, .5, .9, b === 2 ? 0x9a9b97 : 0xcbbd9c, 0x8ac43f); duffle(g, cx + .5, y, 0, .8, .45, .85, 0xb5ac93, 0x8ac43f); }
    else return null;
    return items; }
  // rolled canvas bundle: a long roll lying along the beam, spiral end showing the layers, two webbing straps, a loose flap
  const rollEnd = col => { const [c, x] = can(128, 128); x.fillStyle = `rgb(${hex(col)})`; x.fillRect(0, 0, 128, 128);
    x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 1.4; x.beginPath(); for (let a = 0; a < 46; a += .1) { const r = 6 + a * 1.25; x.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); } x.stroke();
    x.fillStyle = 'rgba(30,26,22,.8)'; x.beginPath(); x.arc(64, 64, 6, 0, 7); x.fill(); return STD({ map: toTex(c), roughness: .9 }); };
  function roll(p, x, y, z, len, r, col) { const g = grp(p, x, y + r * .92, z), body = sheetMat(col), end = rollEnd(col);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.03, len, 20, 6), [body, end, end]); const P = m.geometry.attributes.position;
    for (let i = 0; i < P.count; i++) { const yy = P.getY(i); P.setX(i, P.getX(i) * (1 + Math.sin(yy * 5) * .04)); P.setZ(i, P.getZ(i) * (.88 + Math.cos(yy * 3) * .04)); }   // sags flat, not a perfect tube
    m.geometry.computeVertexNormals(); m.rotation.z = Math.PI / 2; m.castShadow = m.receiveShadow = true; g.add(m);
    for (const s of [-.3, .3]) { const t = new THREE.Mesh(new THREE.TorusGeometry(r * 1.01, .012, 4, 22), web); t.rotation.y = Math.PI / 2; t.scale.set(1, 1, .88); t.position.x = s * len; g.add(t); }
    const f = new THREE.Mesh(new THREE.PlaneGeometry(len * .7, r * 1.2, 6, 2), body); f.position.set(0, -r * .35, r * .9); f.rotation.x = .25; g.add(f);   // the loose outer flap
    return g; }
  // the yellow run across the back of the yard bay (2 bays × 2.45 m, beams 1.35 / 3.0; fillBack below the decking): b 0 = the x 13.6 end. Scan: light and part-empty;
  // a long beige bundle laid along the top beam the whole run, mixed small stock (orange, teal, a yellow-and-navy case) on the middle beam,
  // a grey bag and a few bits low down, a big beige bag at the end by the orange run
  // galvanised wire-mesh decking panel across a beam pair (50 × 100 mm mesh, see-through, channel supports underneath)
  const meshM = (() => { const [c, x] = can(256, 256); x.clearRect(0, 0, 256, 256); x.strokeStyle = '#b9c0c4'; x.lineWidth = 3; for (let i = 0; i <= 256; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.stroke(); } x.lineWidth = 4; for (let i = 0; i <= 256; i += 32) { x.beginPath(); x.moveTo(0, i); x.lineTo(256, i); x.stroke(); }
    const t = toTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 2); return STD({ map: t, transparent: true, alphaTest: .4, metalness: .6, roughness: .45, side: THREE.DoubleSide }); })();
  function deck(g, cx, y, w) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 1.12), meshM); m.rotation.x = -Math.PI / 2; m.position.set(cx, y - .006, 0); m.receiveShadow = true; g.add(m);
    for (const dx of [-w / 3, 0, w / 3]) box(g, .04, .03, 1.1, RACK.brace || meshM, cx + dx, y - .04, 0); }
  // a tagged single box must sit in its own group: bake() merges a bare tagged mesh into its rack and it vanished (17 Oct)
  const solo = (p, w, h, d, m, x, y, z) => { const s = grp(p, x, y, z); box(s, w, h, d, m, 0, 0, 0); return s; };
  function fillBack(g, cx, y, b, lv) { const items = [], at = (o, n, w, s) => { items.push([o, n, w, s]); return o; }; deck(g, cx, y, 2.33);
    if (lv === 2) { if (b === 0) at(roll(g, cx + 1.22, y, 0, 4.6, .3, 0xb9a882), 'Rolled canvas', 'A long roll of beige canvas laid along the top beam, strapped. The scan shows one long pale bundle across both bays up here.', '≈ 4.6 m long · ≈ 0.6 m across'); else duffle(g, cx + .75, y + .55, -.15, .6, .4, .6, 0x2f3437, null); }
    else if (lv === 1) { if (b === 1) { cardBox(g, cx - .7, y, .05, .55, .5, .5); tote(g, cx - .1, y, .05, .6, .42, .4, 0x2a8b8c); reel(g, cx + .6, y, .05, .26, .34, 0xe8742a); duffle(g, cx - .7, y + .5, 0, .55, .3, .55, 0x7a4a2e, null); }
      else { at(solo(g, .75, .42, .5, STD({ color: 0x1f2a44, roughness: .4 }), cx - .3, y, .05), 'Flight case', 'A navy flight case with a yellow case beside it. The scan shows yellow and navy here.', '≈ 0.75 × 0.5 m'); for (const s of [-1, 1]) box(g, .1, .04, .02, MX.alu, cx - .3 + s * .2, y + .32, .31); box(g, .5, .32, .45, STD({ color: 0xe3b11c, roughness: .45 }), cx + .4, y, .05); } }
    else { if (b === 1) { at(duffle(g, cx - .55, y, .05, .85, .6, .85, 0x9a9b97, 0xd23b2b), 'Bell tent bag', 'A grey bell bag low down with a red tag (red = bad). The scan shows a grey bag here.', '≈ 0.85 × 0.85 m'); jerry(g, cx + .45, y, .2, .15); }
      else { cardBox(g, cx - .55, y, 0, .5, .4, .45); cardBox(g, cx - .55, y + .4, .02, .42, .3, .4); foldStack(g, cx + .45, y, 0, .8, .85, 5, [SHEETS[1], SHEETS[0]], [.07, .1]); } }
    return items; }
  // the door-wall orange bay (1 bay × 2.9 m, beams 2.15 / 3.05). Scan: big beige bags and white sheeting piled low, a blue-grey tarp bundle;
  // on the 2.15 m beam a folded striped rug and a black-and-white striped bundle; bags and a yellow bag on top to ≈ 4 m
  function fillDoor(g, cx, y, lv) { const items = [], at = (o, n, w, s) => { items.push([o, n, w, s]); return o; }; deck(g, cx, y, 2.78);
    if (lv === 0) { at(duffle(g, cx + .85, y, .05, 1.05, .95, 1.0, 0xcbbd9c, 0x8ac43f), 'Bell tent bags', 'Big beige bell bags piled low (beige = bells). The scan shows a tall pale pile here.', '≈ 1.0 × 1.0 m each'); duffle(g, cx + .8, y + .9, 0, .95, .6, .9, 0xd3c6a8, 0x8ac43f);
      at(duffle(g, cx - .25, y, .05, 1.0, .55, .95, 0x6f8494, null), 'Tarp bundle', 'A blue-grey tarp folded into a bundle. The scan shows blue-grey here.', '≈ 1.0 × 0.95 m'); foldStack(g, cx - .95, y, 0, .75, .9, 6, [SHEETS[1], SHEETS[0]], [.08, .12]); }
    else if (lv === 1) { at(foldStack(g, cx + .2, y, 0, 1.15, .9, 5, [RUGM[1], RUGM[3]], [.09, .13]), 'Folded rugs', 'Folded striped rugs on the 2.15 m beam. The scan shows pale and orange stripes here.', '≈ 1.15 × 0.9 m');
      foldStack(g, cx + .95, y, 0, .6, .85, 4, [STD({ map: STD.zebra || (STD.zebra = (() => { const [c, x] = can(256, 64); x.fillStyle = '#e8e4da'; x.fillRect(0, 0, 256, 64); x.fillStyle = '#1d1d1f'; for (let u = 0; u < 256; u += 22) x.fillRect(u, 0, 10, 64); return toTex(c); })()), roughness: .9 })], [.1, .14]);
      duffle(g, cx - .85, y, 0, .7, .5, .8, 0x9a9b97, 0x8ac43f); }
    else { duffle(g, cx + .7, y, 0, .85, .62, .85, 0xcbbd9c, 0x8ac43f); duffle(g, cx - .25, y, 0, .7, .5, .8, 0xd8b23a, null); duffle(g, cx - .95, y, 0, .6, .45, .7, 0x9a9b97, 0x8ac43f); }
    return items; }
  // ---- the yellow racking on the workshop's outside wall (2 bays × 2.8 m, beams .15 / 1.35 / 2.55 / 3.75), 17 Oct ----
  // Read off the scan's elevation of this run (bin/scan_elevation.py, private): b 0 = the door end (z −5.25…−8.05), b 1 = the far bay.
  // Low: red and blue bins, a teal tote, dark cases, grey bags, an orange reel, a white bag; middle: grey and lilac bags, an orange
  // bundle, a herringbone rug, a pale box; upper: sheepskins, a yellow bag, a grey chevron rug, wicker baskets, a white storage box;
  // top: rolled jute rugs with a blue strap, a coil of rope, a red banner folded on purple cloth, white sheeting. All NOT SURE.
  const weave = (base, dark, diag) => { const [c, x] = can(256, 256); x.fillStyle = base; x.fillRect(0, 0, 256, 256);   // basket / jute weave: over-under strands
    for (let j = 0; j < 256; j += 8) for (let i = 0; i < 256; i += 8) { const over = ((i + j) >> 3) & 1; x.fillStyle = `rgba(${dark},${over ? .32 : .12})`;
      if (diag) { x.save(); x.translate(i, j); x.rotate(Math.PI / 4); x.fillRect(0, 0, over ? 11 : 3, over ? 3 : 11); x.restore(); } else x.fillRect(i + (over ? 0 : 2), j + (over ? 2 : 0), over ? 8 : 3, over ? 3 : 8); }
    noise(x, 256, 256, 3000, .12); const t = toTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  const JUTE = STD({ map: weave('#a98a5c', '70,50,25', false), roughness: .97 }), WICKER = STD({ map: weave('#9c7442', '60,38,18', true), roughness: .8 });
  JUTE.map.repeat.set(6, 3); WICKER.map.repeat.set(3, 2);
  const CHEV = (() => { const [c, x] = can(512, 128); x.fillStyle = '#e7e5df'; x.fillRect(0, 0, 512, 128); x.fillStyle = '#5d6063';   // grey-and-white chevron rug (the scan's zig-zag)
    for (let u = -64; u < 576; u += 32) { x.beginPath(); for (let v = 0; v <= 128; v += 16) x.lineTo(u + ((v / 16) & 1 ? 12 : 0), v); for (let v = 128; v >= 0; v -= 16) x.lineTo(u + 12 + ((v / 16) & 1 ? 12 : 0), v); x.fill(); }
    noise(x, 512, 128, 6000, .1); return STD({ map: toTex(c), roughness: .97 }); })();
  const BANNER = (() => { const [c, x] = can(256, 128); x.fillStyle = '#c4302b'; x.fillRect(0, 0, 256, 128); x.fillStyle = 'rgba(255,255,255,.9)'; x.font = 'bold 30px sans-serif';   // red banner, white print on the fold
    x.fillText('GREEN YURTS', 18, 52); x.fillRect(18, 66, 210, 5); noise(x, 256, 128, 1500, .1); return STD({ map: toTex(c), roughness: .7 }); })();
  const FLEECE = (() => { const [c, x] = can(256, 256); x.fillStyle = '#e9e2d2'; x.fillRect(0, 0, 256, 256);   // sheepskin: tight curls
    for (let i = 0; i < 1400; i++) { const px = fr() * 256, py = fr() * 256, r = fx(2, 5); x.strokeStyle = `rgba(${fr() < .5 ? '150,135,110' : '255,252,240'},${fx(.25, .6)})`; x.lineWidth = 1.2; x.beginPath(); x.arc(px, py, r, fx(0, 3), fx(3, 6.3)); x.stroke(); }
    const t = toTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return STD({ map: t, bumpMap: t, bumpScale: 2, roughness: 1 }); })();
  const ROPE = STD({ color: 0xb59a6a, roughness: .9 }), BLUESTRAP = STD({ color: 0x2c58b8, roughness: .6 }), PURPLE = sheetMat(0x8d7fc7);
  function sheepskins(p, x, y, z, n) { const g = grp(p, x, y, z); let yy = 0;   // a pile of hides: flattened lumpy discs, shaggy edge
    for (let i = 0; i < n; i++) { const geo = new THREE.SphereGeometry(.5, 20, 8), P = geo.attributes.position, ph = fx(0, 6);
      for (let k = 0; k < P.count; k++) { const a = Math.atan2(P.getZ(k), P.getX(k)), r = 1 + .14 * Math.sin(a * 5 + ph) + .08 * Math.sin(a * 11 + ph * 2); P.setX(k, P.getX(k) * r); P.setZ(k, P.getZ(k) * r); }
      geo.computeVertexNormals(); const m = new THREE.Mesh(geo, FLEECE); m.scale.set(fx(.8, .95), fx(.07, .1), fx(.65, .8)); m.position.set(fx(-.05, .05), yy + .04, fx(-.04, .04)); m.rotation.y = fx(0, 6);
      m.castShadow = m.receiveShadow = true; g.add(m); yy += .075; } return g; }
  function juteRoll(p, x, y, z, len, r) { const g = grp(p, x, y + r, z), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 22, 4), [JUTE, rollEnd(0xa98a5c), rollEnd(0xa98a5c)]);
    const P = m.geometry.attributes.position; for (let i = 0; i < P.count; i++) P.setZ(i, P.getZ(i) * .9);   // sags a touch flat
    m.geometry.computeVertexNormals(); m.rotation.z = Math.PI / 2; m.castShadow = m.receiveShadow = true; g.add(m);
    for (const s of [-.28, .28]) { const t = new THREE.Mesh(new THREE.TorusGeometry(r * 1.01, .014, 4, 24), BLUESTRAP); t.rotation.y = Math.PI / 2; t.scale.set(1, 1, .9); t.position.x = s * len; g.add(t); }
    for (let k = 0; k < 2; k++) { const f = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .05, 4), ROPE); f.position.set((k ? 1 : -1) * len / 2, (fr() - .5) * r, r * .6); f.rotation.z = Math.PI / 2; g.add(f); }   // fringe tufts at the ends
    return g; }
  function basket(p, x, y, z, rT, rB, h, lid) { const g = grp(p, x, y, z, fx(0, 6)), b = new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, h, 24, 1, !lid), WICKER); b.material.side = THREE.DoubleSide;   // wicker basket, rolled rim
    b.position.y = h / 2; b.castShadow = b.receiveShadow = true; g.add(b); const rim = new THREE.Mesh(new THREE.TorusGeometry(rT, .014, 6, 28), WICKER); rim.rotation.x = Math.PI / 2; rim.position.y = h; g.add(rim);
    if (lid) { const l = new THREE.Mesh(new THREE.CylinderGeometry(rT * 1.03, rT * 1.03, .03, 24), WICKER); l.position.y = h + .015; g.add(l); } return g; }
  function rope(p, x, y, z, R, turns) { const g = grp(p, x, y, z);   // a coil of rope laid flat
    for (let i = 0; i < turns; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(R - (i % 3) * .035, .014, 6, 30), ROPE); t.rotation.x = Math.PI / 2; t.position.y = .014 + Math.floor(i / 3) * .026; t.castShadow = true; g.add(t); } return g; }
  // lin bins: small-parts bins with an open hopper front and a label slot, in rows on a mesh deck
  const binGeo = (() => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(.24, 0); s.lineTo(.24, .13); s.lineTo(.06, .13); s.lineTo(0, .07); s.closePath();   // side profile: back high, sloped open front
    const g = new THREE.ExtrudeGeometry(s, { depth: .15, bevelEnabled: false }); g.translate(-.12, 0, -.075); g.rotateY(Math.PI / 2); return g; })();
  const binM = col => STD({ color: col, roughness: .42 }), BINLAB = STD({ color: 0xf3f1ea, roughness: .6 }), DARKIN = STD({ color: 0x15171a, roughness: .9 });
  function bins(p, x, y, z, cols, rows, pal) { const g = grp(p, x, y, z);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const m = binM(pal[(c + r) % pal.length]), b = new THREE.Mesh(binGeo, m), bx = (c - (cols - 1) / 2) * .157, by = r * .132;
      b.position.set(bx, by, 0); b.castShadow = b.receiveShadow = true; g.add(b);
      const hole = new THREE.Mesh(new THREE.PlaneGeometry(.13, .05), DARKIN); hole.rotation.x = -.8; hole.position.set(bx, by + .104, .092); g.add(hole);   // the dark mouth of the hopper
      box(g, .07, .025, .004, BINLAB, bx, by + .035, .121); }   // label in the front slot
    return g; }
  function fillTool(g, cx, y, b, lv) { const items = [], at = (o, n, w, s) => { items.push([o, n, w, s]); return o; }; deck(g, cx, y, 2.68);
    if (b === 1) {
      if (lv === 0) { at(bins(g, cx + .72, y, .3, 6, 3, [0xc8262a, 0x1f5fb0]), 'Red and blue bins', 'Small-parts bins, red and blue, in rows on the bottom shelf: fixings, pegs, shackles. The scan shows red and blue here.', '≈ 0.24 × 0.15 m each');
        bins(g, cx + .72, y, -.02, 6, 2, [0x1f5fb0, 0xc8262a]); at(tote(g, cx - .25, y, .05, .6, .42, .4, 0x2a8b8c), 'Teal tote', 'A teal stacking tote. The scan shows teal here.', '≈ 0.6 × 0.4 m');
        at(solo(g, .7, .5, .55, STD({ color: 0x1c1e21, roughness: .45 }), cx - .95, y, 0), 'Black flight case', 'A black flight case. The scan shows dark cases low down.', '≈ 0.7 × 0.55 m'); for (const s of [-1, 1]) box(g, .1, .04, .02, MX.alu, cx - .95 + s * .2, y + .38, .285); duffle(g, cx - .95, y + .5, 0, .5, .3, .5, 0x9a9b97, null); }
      else if (lv === 1) { duffle(g, cx + .9, y, 0, .7, .55, .8, 0xb4b0b8, 0x8ac43f); at(foldStack(g, cx + .15, y, 0, .7, .8, 4, [sheetMat(0xd8742c)], [.1, .14]), 'Orange bundle', 'A folded orange cover or tarp. The scan shows orange here.', '≈ 0.7 × 0.8 m');
        duffle(g, cx - .45, y, 0, .6, .5, .75, 0x3a3532, null); cardBox(g, cx - 1.02, y, 0, .5, .45, .5); }
      else if (lv === 2) { at(duffle(g, cx + 1.12, y, 0, .4, .5, .6, 0xd8b23a, null), 'Yellow bag', 'A yellow bag at the end of the shelf. The scan shows yellow here.', '≈ 0.4 × 0.6 m'); at(sheepskins(g, cx + .62, y, 0, 6), 'Sheepskins', 'A pile of sheepskin rugs for dressing the yurts. The scan shows a white, fluffy pile here.', '≈ 0.9 × 0.7 m each');
        at(basket(g, cx - .05, y, .05, .22, .18, .32, true), 'Wicker hamper', 'A lidded wicker hamper.', '≈ 0.45 m across'); at(foldStack(g, cx - .72, y, 0, 1.0, .85, 6, [CHEV], [.07, .1]), 'Chevron rug', 'A grey-and-white chevron rug, folded. The scan shows a grey zig-zag here.', '≈ 1.0 × 0.85 m'); }
      else { at(juteRoll(g, cx - .3, y, -.24, 1.7, .2), 'Rolled jute rugs', 'Jute rugs rolled and strapped with blue webbing. The scan shows a woven brown roll and a blue strap up here.', '≈ 1.7 m long'); juteRoll(g, cx - .3, y, .2, 1.6, .19); juteRoll(g, cx - .3, y + .36, 0, 1.5, .18);
        duffle(g, cx + .9, y, 0, .7, .55, .8, 0xd8742c, null); } }
    else {
      if (lv === 0) { at(reel(g, cx + .95, y, .05, .3, .38, 0xe8742a), 'Cable reel', 'Orange flex on a reel. The scan shows orange low down here.', '≈ 0.6 m reel'); cardBox(g, cx + .25, y, 0, .6, .5, .55);
        duffle(g, cx - .4, y, 0, .7, .55, .8, 0x9a9b97, 0x8ac43f); at(duffle(g, cx - 1.05, y, 0, .5, .55, .75, 0xe6e6e1, null), 'White bag', 'A white bag at the end of the bottom shelf.', '≈ 0.5 × 0.75 m'); }
      else if (lv === 1) { duffle(g, cx + 1.0, y, 0, .55, .5, .75, 0x9a9b97, 0x8ac43f); duffle(g, cx + .45, y, 0, .55, .45, .75, 0xb4b0b8, null); cardBox(g, cx - .12, y, 0, .55, .55, .55);
        at(foldStack(g, cx - .85, y, 0, .85, .85, 6, [RUGM[0], CHEV, RUGM[2]], [.08, .12]), 'Folded rugs', 'Folded rugs: a herringbone one on top, a maroon one at the end. The scan shows a zig-zag weave and maroon here.', '≈ 0.85 × 0.85 m'); }
      else if (lv === 2) { at(basket(g, cx + .95, y, 0, .2, .17, .38, false), 'Wicker baskets', 'Wicker baskets for the yurts. The scan shows woven brown here.', '≈ 0.4 m across'); basket(g, cx + .52, y, .1, .22, .19, .3, false); basket(g, cx + .52, y, -.32, .18, .15, .26, true);
        tote(g, cx + .1, y, 0, .45, .3, .38, 0x2a8b8c); duffle(g, cx - .45, y, 0, .6, .55, .8, 0xcbbd9c, 0x8ac43f);
        at(solo(g, .55, .38, .45, STD({ color: 0xeeeeea, roughness: .35 }), cx - 1.05, y, .05), 'White storage box', 'A white plastic storage box with its lid on.', '≈ 0.55 × 0.45 m'); box(g, .58, .03, .48, STD({ color: 0xdedfd9, roughness: .3 }), cx - 1.05, y + .38, .05); }
      else { at(duffle(g, cx + 1.05, y, 0, .5, .45, .7, 0x24324e, null), 'Navy bag', 'A navy bag. The scan shows dark blue here.', '≈ 0.5 × 0.7 m'); at(rope(g, cx + .62, y, .1, .26, 9), 'Coiled rope', 'A coil of guy rope laid flat. The scan shows a tan coil here.', '≈ 0.5 m across');
        foldStack(g, cx + .05, y, 0, .75, .8, 3, [PURPLE], [.06, .09]); at(foldStack(g, cx + .05, y + .2, 0, .7, .7, 2, [BANNER], [.05, .07]), 'Red banner', 'A red banner folded on a purple cloth. The scan shows a red panel with white print on lilac here.', '≈ 0.7 × 0.7 m folded');
        foldStack(g, cx - .75, y, 0, .9, .9, 5, [SHEETS[1], SHEETS[4]], [.07, .1]); } }
    return items; }
  // ---- the left wall band, 17 Oct 03:xx: read off the scan (bin/scan_top.py heightmap + bin/scan_elevation.py, private) ----
  // Racking bay at z −16.65…−19.4, front x 1.4, beams .15 / 2.3 / 4.35 (the scan's gaps at ≈ 2.2–2.45 and ≈ 4.4 m, stock to its 5 m top).
  // Low: bags and a pale tote piled to ≈ 1.9 m, a white bag in the middle; middle: a folded grey-and-white striped stack with a yellow bag
  // on it at the far upright, a big white bulk bag, a dark brown bundle by the door-end upright; top: pale grey and beige bags. All NOT SURE.
  // Local x runs from the door-end upright (z −16.65, x = 0) to the far one (z −19.4); +z local = the aisle side.
  const TICK = (() => { const [c, x] = can(256, 128); x.fillStyle = '#dcdcd6'; x.fillRect(0, 0, 256, 128);   // grey-and-white striped canvas
    for (let u = 0; u < 256; u += 16) { x.fillStyle = 'rgba(70,74,78,.75)'; x.fillRect(u, 0, 6, 128); x.fillStyle = 'rgba(70,74,78,.3)'; x.fillRect(u + 9, 0, 2, 128); }
    noise(x, 256, 128, 2500, .08); const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(0,0,0,.28)'); x.fillStyle = g; x.fillRect(0, 0, 256, 128);
    return STD({ map: toTex(c), roughness: .9 }); })();
  // woven polypropylene (bulk bags, tarps): fine basket weave, a couple of creases, grime low down
  const wovenTex = (col, w = 256, h = 256) => { const [c, x] = can(w, h); x.fillStyle = `rgb(${hex(col)})`; x.fillRect(0, 0, w, h);
    for (let j = 0; j < h; j += 3) for (let i = 0; i < w; i += 3) if (((i + j) / 3) & 1) { x.fillStyle = 'rgba(0,0,0,.06)'; x.fillRect(i, j, 3, 1); }
    for (let i = 0; i < 7; i++) { const x0 = fx(0, w), a = fx(-30, 30), b2 = fx(-30, 30), e = fx(-20, 20), wd = fx(10, 26);   // soft vertical folds: a wide shadow with a lit ridge beside it
      for (const [o, col] of [[0, `rgba(0,0,0,${fx(.05, .1)})`], [wd * .6, `rgba(255,255,255,${fx(.05, .1)})`]]) { x.strokeStyle = col; x.lineWidth = wd; x.lineCap = 'round'; x.beginPath(); x.moveTo(x0 + o, -10); x.bezierCurveTo(x0 + o + a, h * .3, x0 + o + b2, h * .7, x0 + o + e, h + 10); x.stroke(); } }
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,.08)'); g.addColorStop(.75, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(70,58,44,.35)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    noise(x, w, h, w * h / 30, .07); return c; };
  // a soft box: sides bulge, top sags between the corners, vertical folds, the hem flares out a little on the floor
  const softGeo = (bulge, sag, folds, flare, fq = 9) => { const g = new THREE.BoxGeometry(1, 1, 1, 12, 10, 12), P = g.attributes.position, ph = fx(0, 6);
    for (let i = 0; i < P.count; i++) { let x = P.getX(i), y = P.getY(i), z = P.getZ(i); const t = y + .5, e = Math.sin(Math.PI * t);
      const fo = 1 + bulge * e + folds * (Math.sin((x + z) * fq + ph) + .5 * Math.sin((x - z) * fq * 7 / 3 + ph * 2)) * (.4 + .6 * e) + flare * Math.max(0, .12 - t) * 8;
      x *= fo; z *= fo; if (y > .45) y -= sag * (1 - 4 * x * x) * (1 - 4 * z * z) - sag * .5;
      P.setXYZ(i, x, y, z); }
    g.computeVertexNormals(); return g; };
  function bulkBag(p, x, y, z, w, h, d) { const g = grp(p, x, y, z, fx(-.08, .08)), m = STD({ map: toTex(wovenTex(0xe2dfd4)), roughness: .8 });
    const b = new THREE.Mesh(softGeo(.09, .1, .012, .0), m); b.scale.set(w, h, d); b.position.y = h / 2; b.castShadow = b.receiveShadow = true; g.add(b);
    for (const [sx, sz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) { const l = new THREE.Mesh(new THREE.TorusGeometry(.13, .022, 5, 12, Math.PI), m); l.position.set(sx * w * .42, h * .9, sz * d * .44); l.rotation.y = Math.atan2(sz, sx) + Math.PI / 4; g.add(l); }   // four lifting loops
    for (const sz of [-1, 1]) box(g, w * .92, .012, .006, STD({ color: 0xcfcdc4, roughness: .8 }), 0, h * .55, sz * (d * .53));   // sewn band round the middle
    return g; }
  // a sheeted stack: a tarp thrown over a block of kit, roped down; folds, sag, hem on the floor
  function tarpBlock(p, x, y, z, w, h, d, col, ry = 0, fo = .022, fq = 9) { const g = grp(p, x, y, z, ry), tx = toTex(wovenTex(col, 512, 256)), m = STD({ map: tx, roughness: .7 });
    const b = new THREE.Mesh(softGeo(.04, .07, fo, .06, fq), m); b.scale.set(w, h, d); b.position.y = h / 2; b.castShadow = b.receiveShadow = true; g.add(b);
    const rp = STD({ color: 0x4f6272, roughness: .75 }), hem = STD({ color: new THREE.Color(col).multiplyScalar(.6), roughness: .8 }), eye = STD({ color: 0xb8bcbe, metalness: .7, roughness: .35 });
    for (const sz of [-1, 1]) { box(g, w * 1.05, .05, .012, hem, 0, .02, sz * d * .53); for (let k = 0; k < 5; k++) cyl(g, .014, .008, eye, -w * .45 + k * w * .225, .045, sz * d * .536, 'z', 10); }   // reinforced hem with eyelets
    for (const f of [-.3, .3]) { const L = w * f, pts = [[L, .05, d * .6], [L, h * .5, d * .6], [L, h * .9, d * .58], [L, h * 1.07, d * .3], [L, h * 1.08, -d * .3], [L, h * .9, -d * .58], [L, h * .5, -d * .6], [L, .05, -d * .6]].map(q => new THREE.Vector3(...q));
      const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, .011, 6), rp); t.castShadow = true; g.add(t); }   // two ropes over the top
    return g; }
  function fillLeft(g, cx, y, b, lv) { const s0 = sd; sd = 7717 + lv * 31; const items = [], at = (o, n, w, s) => { items.push([o, n, w, s]); return o; }; deck(g, cx, y, 2.66);
    if (lv === 0) { at(duffle(g, cx + .85, y, .02, 1.0, .85, .95, 0xcbbd9c, 0x8ac43f), 'Bell tent bags', 'Beige bell bags piled two high at the far end of the bottom shelf. The scan shows pale bags here.', '≈ 1.0 × 0.95 m each'); duffle(g, cx + .8, y + .8, 0, .9, .7, .9, 0xd3c6a8, 0x8ac43f);
      tote(g, cx - .3, y, .1, .6, .42, .4, 0x9cc3d8); at(duffle(g, cx - .3, y + .42, 0, .8, .7, .8, 0xe6e6e1, null), 'White bag', 'A white bag on a pale blue tote. The scan shows white and light blue here.', '≈ 0.8 × 0.8 m');
      duffle(g, cx - 1.0, y, 0, .6, .6, .85, 0x9a9b97, 0x8ac43f); cardBox(g, cx - 1.0, y + .58, .05, .5, .4, .45); }
    else if (lv === 1) { at(foldStack(g, cx + .78, y, 0, 1.0, .95, 8, [TICK, SHEETS[1]], [.08, .12]), 'Striped canvas (folded)', 'Grey-and-white striped canvas folded and stacked. The scan shows fine grey and white stripes here.', '≈ 1.0 × 0.95 m');
      at(duffle(g, cx + .95, y + .76, 0, .5, .62, .6, 0xd8b23a, null), 'Yellow bag', 'A yellow bag on the striped stack. The scan shows yellow here.', '≈ 0.5 × 0.6 m');
      at(bulkBag(g, cx - .4, y, -.04, .98, 1.65, .84), 'Bulk bag (white)', 'A big white woven bulk bag with four lifting loops, full. The scan shows a tall white bag here.', '≈ 1.0 × 0.9 × 1.65 m');
      foldStack(g, cx - 1.08, y, 0, .42, .85, 8, [sheetMat(0x4a3426), sheetMat(0x5a4030)], [.08, .12]); }
    else { duffle(g, cx + .85, y, 0, .85, .5, .9, 0xcbbd9c, 0x8ac43f); at(duffle(g, cx, y, 0, .8, .55, .85, 0xb5b5b0, 0x8ac43f), 'Bags (top level)', 'Pale grey and beige bags on the top beam, up to about 5 m. The scan shows pale bags up here.', '≈ 0.85 × 0.9 m'); duffle(g, cx - .85, y, 0, .8, .5, .85, 0xd3c6a8, null); }
    sd = s0; return items; }
  // ---- the left band's high bay, 17 Oct 06:xx (scan step 2c-iv, part 1): heightmap + elevations (private) show a flat deck at ≈ 2.4 m from x 2.8 to 3.5,
  // uprights at z ≈ −21.8 and −25.0, nothing seen under it from the aisle but a dark bag hanging off the front, and stock from 2.45 m to the scan's 5 m top
  // set back to x ≈ 2.8: grey-white folded sheeting (the scan's vertical stripes) at the far end, a blue-grey sheeted mass in the middle, a brown bundle by the door-end upright.
  // Local x runs from the door-end upright (z −21.8) to the far one (z −25.0); +z local = the aisle side; stock sits to the back (local z ≈ −0.45).
  function fillHigh(g, cx, y) { const s0 = sd; sd = 8819; const items = [], at = (o, n, w, s) => { items.push([o, n, w, s]); return o; }; deck(g, cx, y, 3.1);
    const zb = -.42, x0 = cx - 1.6;
    at(foldStack(g, x0 + 2.47, y, zb, 1.3, .66, 26, [SHEETS[1], SHEETS[4], sheetMat(0xd6cdbb), sheetMat(0x9a948a)], [.07, .1]), 'Folded sheeting (high)', 'Grey and white sheeting folded and stacked to the top, about 2.3 m of it. The scan shows grey and white stripes here (the folded edges), 2.5–4.8 m up.', '≈ 1.3 × 0.7 × 2.3 m');
    at(tarpBlock(g, x0 + 1.0, y, zb + .02, 1.5, 2.42, .72, 0x8e949a, 0, .028, 22), 'Blue-grey sheeted stack', 'A stack about 1.5 m wide under a blue-grey sheet, up to the scan\'s 5 m top. What\'s under the sheet isn\'t known.', '≈ 1.5 × 0.7 × 2.4 m');
    at(foldStack(g, x0 + .16, y, zb, .3, .6, 4, [sheetMat(0x5a4030), sheetMat(0x4a3426)], [.16, .26]), 'Brown bundle', 'A dark brown bundle stood against the door-end upright. The scan shows brown here, about 3.5–4.8 m up.', '≈ 0.3 × 0.6 m');
    // the dark bag the scan sees hanging off the front beam, ≈ 1.3–2.4 m (a black holdall hung by its strap)
    const hb = grp(g, x0 + 1.75, y - .12, .62); const bm = new THREE.Mesh(new THREE.CapsuleGeometry(.16, .62, 4, 10), bagMt(0x26272a)); bm.scale.set(1.3, 1, .6); bm.position.y = -.62; bm.rotation.z = .06; bm.castShadow = true; hb.add(bm);
    box(hb, .012, .78, .004, STD({ color: 0x9a9b97, metalness: .6, roughness: .4 }), 0, -.98, .1); for (const sy of [-.25, -1.0]) box(hb, .42, .035, .11, STD({ color: 0x1b1b1d, roughness: .8 }), 0, sy, 0);   // zip down the front, webbing bands round it
    for (const sx of [-.09, .09]) box(hb, .03, .3, .006, STD({ color: 0x1b1b1d, roughness: .8 }), sx, -.17, .01);   // the strap over the beam
    hb.parent.remove(hb);   // 17 Oct: the hanging bag reverted (07:xx review: it floated in front of a red crate)
    sd = s0; return items; }
  // ---- the left band's tall bay above the pale sheeted block, 17 Oct 07:xx (scan step 2c-iv, part 2): heightmap (q95 and q20) + elevation (private)
  // show a face at x ≈ 1.4 reaching the scan's 5 m top from z −25.0 to −28.2 (uprights read at both ends), a deck at ≈ 2.3 m, a second level at ≈ 3.3 m;
  // the pale block hides everything under 2.1 m. Level 1: a teal tote and a white/cream folded pile with a yellow bag on it, a brown bundle at the far upright;
  // level 2: dark navy and black bags at the front, grey-white folded sheeting behind them to ≈ 4.9 m, timber lengths laid on top, the brown bundle again.
  // Local x runs from the door-end upright (z −25.0) to the far one (z −28.2); +z local = the aisle side.
  function fillTall(g, cx, y, lv) { const s0 = sd; sd = 9931 + lv * 17; const items = [], at = (o, n, w, s) => { items.push([o, n, w, s]); return o; };
    if (lv === 0) { sd = s0; return items; }   // bottom level: behind the pale block, not seen in the scan, left empty
    deck(g, cx, y, 3.1); const b = cx + 1.6;   // b = the far upright (z −28.2)
    if (lv === 1) { at(foldStack(g, cx - .15, y, -.05, 1.05, .85, 7, [sheetMat(0xe4ddcc), SHEETS[1], sheetMat(0xd2c9b4)], [.07, .1]), 'Cream folded pile', 'Cream and white sheeting folded flat. The scan shows cream and white here, about 2.3–2.8 m up.', '≈ 1.0 × 0.85 m');
      at(duffle(g, cx + .25, y + .55, .05, .75, .3, .6, 0xd8b23a, null), 'Yellow bag', 'A yellow bag on the cream pile. The scan shows a yellow band here, about 3.0–3.3 m up.', '≈ 0.75 × 0.6 m'); duffle(g, cx - .45, y + .55, 0, .55, .28, .55, 0xcfa632, null);
      at(tote(g, cx + .82, y, .05, .6, .45, .4, 0x2a8b8c), 'Teal tote', 'A teal plastic tote. The scan shows teal-green here.', '≈ 0.6 × 0.4 m'); duffle(g, cx - 1.12, y, 0, .6, .5, .8, 0x9a9b97, 0x8ac43f);
      at(foldStack(g, b - .24, y, 0, .34, .7, 6, [sheetMat(0x5a4030), sheetMat(0x4a3426)], [.12, .16]), 'Brown bundle', 'A dark brown bundle stood at the far upright. The scan shows brown here from about 2.5 to 4.7 m.', '≈ 0.35 × 0.7 m'); }
    else { at(foldStack(g, cx - .1, y, -.22, 2.3, .62, 18, [SHEETS[0], SHEETS[1], SHEETS[4], sheetMat(0xa9adab)], [.07, .1]), 'Folded sheeting (top)', 'Grey and white sheeting folded and stacked at the back of the top level. The scan shows pale grey and white here, about 4.0–4.9 m up.', '≈ 2.3 × 0.6 × 1.5 m');
      at(duffle(g, cx - .85, y, .24, .95, .55, .55, 0x2b3550, null), 'Navy bag', 'A navy bag at the front of the top level. The scan shows dark blue here, about 3.3–3.9 m up.', '≈ 0.95 × 0.55 m'); duffle(g, cx + .45, y, .26, .8, .6, .5, 0x26272a, null);
      at(foldStack(g, b - .24, y, 0, .34, .7, 8, [sheetMat(0x5a4030), sheetMat(0x4a3426)], [.12, .16]), 'Brown bundle (top)', 'The brown bundle carries on up the far upright.', '≈ 0.35 × 0.7 m');
      const tm = [0x8a6440, 0x7a5634, 0x94704a].map(c => STD({ color: c, roughness: .85 })), tg = grp(g, cx - .2, y + 1.39, -.2, .02);
      for (let i = 0; i < 4; i++) box(tg, 2.4 - i * .12, .075, .2, tm[i % 3], fx(-.05, .05), i < 3 ? 0 : .075, -.22 + i * .15 - (i === 3 ? .2 : 0));
      at(tg, 'Timber lengths', 'Timber boards laid on top of the stack. The scan shows a long brown edge along the top here, about 4.9 m up.', '≈ 2.4 m × 0.2 m boards'); }
    sd = s0; return items; }
  return { fill, fillBack, fillDoor, fillTool, fillLeft, fillHigh, fillTall, tarpBlock, roll: (p, x, y, z, len, r) => roll(p, x, y, z, len, r, 0xdcdcd6), duffle, TICK }; })();

// ---- black ribbed planters (Josh: "black ribbed boxes strapped in pairs on the racking = planters") ----
// One ribbed, tapered body (extruded plan outline: a 40 mm rib every 100 mm, 18 mm proud), an open top with a thick lip and a silver
// trim band, black HDPE with fine texture, scuffs low down and on the ribs, dust on the lip. Pairs sit on two euro pallets with a blue
// ratchet strap round their middle (ratchet + label on the front, tail hanging). Own RNG so nothing else in the layout moves.
const PLANTER = (() => {
  let sd = 5813; const fr = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const can = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  const toTex = (c, srgb = true) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  const W = 1.18, D = .92, H = .98, LIP = .07, RIB = .1, RW = .04, RP = .018, TAPER = .9;
  // plan outline, anticlockwise, ribs on every side (corners plain)
  const pts = []; const side = (ax, ay, bx, by, nx, ny) => { const L = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / L, uy = (by - ay) / L, n = Math.floor((L - .12) / RIB);
    const s0 = (L - (n - 1) * RIB) / 2; pts.push([ax, ay]);
    for (let i = 0; i < n; i++) { const s = s0 + i * RIB; for (const [t, o] of [[-RW / 2 - .006, 0], [-RW / 2, RP], [RW / 2, RP], [RW / 2 + .006, 0]]) pts.push([ax + ux * (s + t) + nx * o, ay + uy * (s + t) + ny * o]); } };
  const c = .03, w2 = W / 2, d2 = D / 2;   // 30 mm chamfered corners
  side(-w2 + c, -d2, w2 - c, -d2, 0, -1); side(w2, -d2 + c, w2, d2 - c, 1, 0); side(w2 - c, d2, -w2 + c, d2, 0, 1); side(-w2, d2 - c, -w2, -d2 + c, -1, 0);
  const shape = new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1])));
  const body = new THREE.ExtrudeGeometry(shape, { depth: H, bevelEnabled: false, curveSegments: 1 }); body.rotateX(-Math.PI / 2);   // shape y → −z, extrusion → +y
  { const P = body.attributes.position, uv = body.attributes.uv; for (let i = 0; i < P.count; i++) { const y = P.getY(i), k = TAPER + (1 - TAPER) * y / H; P.setX(i, P.getX(i) * k); P.setZ(i, P.getZ(i) * k);
      uv.setXY(i, (P.getX(i) + P.getZ(i)) * .5 + .5, y / H); } body.computeVertexNormals(); }
  // lip: a ring (outer a touch wider than the top of the body, hole = the body's inside), and the trim band round it
  const rect = (w, d) => { const s = new THREE.Shape(); s.moveTo(-w / 2, -d / 2); s.lineTo(w / 2, -d / 2); s.lineTo(w / 2, d / 2); s.lineTo(-w / 2, d / 2); s.closePath(); return s; };
  const ring = (wo, dO, wi, di, h) => { const s = rect(wo, dO); const hole = new THREE.Path(); hole.moveTo(-wi / 2, -di / 2); hole.lineTo(-wi / 2, di / 2); hole.lineTo(wi / 2, di / 2); hole.lineTo(wi / 2, -di / 2); hole.closePath(); s.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false }); g.rotateX(-Math.PI / 2); return g; };
  const lip = ring(W + .06, D + .06, W - .05, D - .05, LIP), trim = ring(W + .075, D + .075, W + .04, D + .04, .026), foot = ring(W * TAPER + .03, D * TAPER + .03, W * TAPER - .06, D * TAPER - .06, .035);
  // textures: body (1 tile across 2 m of perimeter in u, full height in v)
  const bodyTex = (() => { const [cv, x] = can(1024, 512); x.fillStyle = '#2a2c30'; x.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 9000; i++) { const v = fr(); x.fillStyle = `rgba(${v > .5 ? '255,255,255' : '0,0,0'},${.025 + fr() * .04})`; x.fillRect(fr() * 1024, fr() * 512, 1 + fr() * 2, 1 + fr() * 2); }   // HDPE grain
    for (let i = 0; i < 14; i++) { const y = fr() * 512; x.fillStyle = `rgba(255,255,255,${.015 + fr() * .02})`; x.fillRect(0, y, 1024, 1 + fr() * 3); }   // faint mould lines
    const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, 'rgba(170,160,145,.22)'); g.addColorStop(.12, 'rgba(170,160,145,.05)'); g.addColorStop(.8, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(120,105,85,.25)'); x.fillStyle = g; x.fillRect(0, 0, 1024, 512);   // dust under the lip, grime at the foot
    for (let i = 0; i < 70; i++) { const low = fr() < .7, cx = fr() * 1024, cy = low ? 330 + fr() * 180 : fr() * 512, L = 8 + fr() * 50, a = (fr() - .5) * .7;   // scuffs and pale scratches, mostly low
      x.strokeStyle = `rgba(190,185,175,${.08 + fr() * .2})`; x.lineWidth = .6 + fr() * 1.6; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * L, cy + Math.sin(a) * L); x.stroke(); }
    for (let i = 0; i < 6; i++) { x.fillStyle = `rgba(150,140,125,${.06 + fr() * .08})`; x.beginPath(); x.ellipse(fr() * 1024, 400 + fr() * 100, 20 + fr() * 50, 6 + fr() * 10, 0, 0, 7); x.fill(); }   // dried splash marks
    return toTex(cv); })();
  const bump = (() => { const [cv, x] = can(256, 256); x.fillStyle = '#808080'; x.fillRect(0, 0, 256, 256); for (let i = 0; i < 5000; i++) { x.fillStyle = `rgba(${fr() > .5 ? '255,255,255' : '0,0,0'},.18)`; x.fillRect(fr() * 256, fr() * 256, 1, 1); } const t = toTex(cv, false); t.repeat.set(6, 6); return t; })();
  const mBody = STD({ map: bodyTex, bumpMap: bump, bumpScale: .4, roughness: .45, metalness: 0, flatShading: true });
  const mIn = STD({ color: 0x141517, roughness: .9 });
  const mLip = STD({ map: (() => { const [cv, x] = can(512, 64); x.fillStyle = '#26272a'; x.fillRect(0, 0, 512, 64); for (let i = 0; i < 1600; i++) { x.fillStyle = `rgba(185,175,160,${fr() * .25})`; x.fillRect(fr() * 512, fr() * 64, 1 + fr() * 2, 1); } return toTex(cv); })(), roughness: .55 });
  const mTrim = STD({ map: (() => { const [cv, x] = can(512, 32); x.fillStyle = '#b9bec2'; x.fillRect(0, 0, 512, 32); for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(${fr() > .5 ? '255,255,255' : '60,60,60'},${fr() * .25})`; x.fillRect(0, fr() * 32, 512, 1); } for (let i = 0; i < 30; i++) { x.fillStyle = 'rgba(40,40,40,.35)'; x.fillRect(fr() * 512, fr() * 32, 2 + fr() * 6, 1 + fr() * 2); } return toTex(cv); })(), roughness: .3, metalness: .85 });
  // blue ratchet strap: woven webbing with an edge stripe, and a white rating label
  const mStrap = STD({ map: (() => { const [cv, x] = can(256, 32); x.fillStyle = '#2154b4'; x.fillRect(0, 0, 256, 32); for (let i = 0; i < 256; i += 2) { x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(i, 0, 1, 32); } x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(0, 3, 256, 1.5); x.fillRect(0, 27.5, 256, 1.5); return toTex(cv); })(), roughness: .7 });
  const mLabel = STD({ map: (() => { const [cv, x] = can(128, 48); x.fillStyle = '#eceae2'; x.fillRect(0, 0, 128, 48); x.fillStyle = '#1b1b1b'; x.font = 'bold 15px sans-serif'; x.fillText('LC 2500 daN', 8, 20); x.font = '11px sans-serif'; x.fillText('EN 12195-2', 8, 38); return toTex(cv); })(), roughness: .6 });
  const mSteel = STD({ color: 0xa7acb0, roughness: .35, metalness: .85 }), mHandle = STD({ color: 0x1c1c1c, roughness: .5 });
  function one(p, x, y, z, ry) { const g = grp(p, x, y, z, ry);
    const b = new THREE.Mesh(body, [mIn, mBody]); b.castShadow = b.receiveShadow = true; g.add(b);
    for (const [geo, m, yy] of [[lip, mLip, H - .002], [trim, mTrim, H + .02], [foot, mLip, .01]]) { const r = new THREE.Mesh(geo, m); r.position.y = yy; r.castShadow = r.receiveShadow = true; g.add(r); }
    return g; }
  // a strapped pair on two pallets, centred on (cx, y) in the rack's frame (x along the bay, +z = the aisle side)
  function pair(p, cx, y) { const g = grp(p, cx, y, 0);
    for (const s of [-1, 1]) { const pg = grp(g, s * .64, 0, 0); pallet(pg, 1.2, 1.0, 0, .5); one(g, s * .645 + (fr() - .5) * .02, .144, 0, (fr() - .5) * .008); }
    // strap at 55% height, hugging the tapered faces: front + back runs, the two ends, ratchet on the front
    const yS = .144 + H * .55, k = TAPER + (1 - TAPER) * .55, fz = D / 2 * k + RP + .014, ex = .645 + W / 2 * k + RP + .014, sw = .05;
    for (const zz of [-fz, fz]) box(g, ex * 2, sw, .004, mStrap, 0, yS, zz);
    for (const xx of [-ex, ex]) box(g, .004, sw, fz * 2, mStrap, xx, yS, 0);
    const r = grp(g, .25, yS + sw / 2, fz + .012);   // ratchet: frame plates, spindle, black handle, release tab
    for (const sz of [-1, 1]) box(r, .16, .07, .004, mSteel, 0, -.035, sz * .018); cyl(r, .012, .05, mSteel, .02, 0, 0, 'z', 10); box(r, .13, .03, .03, mHandle, -.03, .02, 0); box(r, .05, .012, .03, mSteel, -.1, .01, 0);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(.1, .036), mLabel); lab.position.set(-.35, yS + sw / 2, fz + .003); g.add(lab);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(sw, .32, .004), mStrap); tail.position.set(.36, yS - .14, fz + .006); tail.rotation.z = .12; tail.castShadow = true; g.add(tail);   // loose tail hanging off the ratchet
    return g; }
  return { pair, H: H + LIP };
})();

// ---------------- OSB sheets (16–17 Oct night) ----------------
// The workshop under the mezzanine is clad in OSB. Colours from Josh's workshop scan (sampled numbers only, no scan texture):
// tan strands p10 ≈ 101/78/42, median ≈ 148/123/90, p90 ≈ 217/183/142. Real sheets, 1.22 × 2.44 m, stood portrait, so
// sheet joints, screw lines and the odd grade stamp land where they would. Surface strands run along the sheet's length.
// Four sheet canvases (two clean, two "low" with floor splash, scuffs and grime), each ~360 px/m, + a bump map each.
// Own RNG so the rest of the seeded layout doesn't move.
const OSB = (() => {
  let sd = 9157; const fr = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const SW = 1.22, SH = 2.44, PW = 440, PH = 880, K = PW / SW;            // px per metre ≈ 360
  const PAL = [[128, 100, 68], [142, 114, 78], [152, 124, 88], [162, 131, 90], [172, 142, 100], [182, 152, 112], [194, 160, 112], [204, 172, 130]];   // the scan's p25–p85: the full p10–p90 spread read as wood chips
  const can = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  function strand(x, b, cx, cy, L, Wd, a, col, dark) {           // one flake: a wonky rotated rectangle with ragged ends
    x.save(); x.translate(cx, cy); x.rotate(a); x.beginPath();
    x.moveTo(-L / 2 + fr() * 3, -Wd / 2); x.lineTo(L / 2 - fr() * 4, -Wd / 2 + (fr() - .5) * 2); x.lineTo(L / 2 + (fr() - .5) * 5, 0); x.lineTo(L / 2 - fr() * 4, Wd / 2); x.lineTo(-L / 2 + fr() * 4, Wd / 2 + (fr() - .5) * 2); x.lineTo(-L / 2 + (fr() - .5) * 5, 0); x.closePath();
    x.fillStyle = col; x.fill(); x.strokeStyle = dark; x.lineWidth = .9; x.stroke();
    x.restore();
    b.save(); b.translate(cx / 2, cy / 2); b.rotate(a); const v = 120 + fr() * 70 | 0; b.fillStyle = `rgb(${v},${v},${v})`; b.fillRect(-L / 4, -Wd / 4, L / 2, Wd / 2);
    b.strokeStyle = 'rgba(30,30,30,.7)'; b.lineWidth = .7; b.strokeRect(-L / 4, -Wd / 4, L / 2, Wd / 2); b.restore(); }
  function base() {                                                // the strands: two of these, shared by the clean and the low sheets (the costly part)
    const [c, x] = can(PW, PH), [bc, b] = can(PW / 2, PH / 2);
    x.fillStyle = 'rgb(120,94,62)'; x.fillRect(0, 0, PW, PH); b.fillStyle = '#505050'; b.fillRect(0, 0, PW / 2, PH / 2);   // dark resin-filled gaps between flakes
    for (let i = 0; i < 6400; i++) {                                // strands, mostly along the sheet (vertical), a few cross ones from the core showing
      const p = PAL[fr() * PAL.length | 0], j = (fr() - .5) * 14, L = (.045 + fr() * .085) * K, Wd = (.01 + fr() * .018) * K;
      const a = fr() < .12 ? fr() * Math.PI : Math.PI / 2 + (fr() - .5) * .8;
      strand(x, b, fr() * PW, fr() * PH, L, Wd, a, `rgb(${p[0] + j | 0},${p[1] + j | 0},${p[2] + j * .8 | 0})`, `rgba(80,58,32,${.18 + fr() * .25})`); }
    for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(${55 + fr() * 30 | 0},${38 + fr() * 20 | 0},${22},${.5 + fr() * .4})`; x.save(); x.translate(fr() * PW, fr() * PH); x.rotate(Math.PI / 2 + (fr() - .5)); x.fillRect(-6, -1.5, 8 + fr() * 14, 2 + fr() * 3); x.restore(); }   // bark and resin flecks
    for (let i = 0; i < 10; i++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 1); x.save(); x.translate(fr() * PW, fr() * PH); x.scale(60 + fr() * 140, 80 + fr() * 200); const k = fr() < .5;   // big soft mottling: some sheets darker in patches
      g.addColorStop(0, k ? 'rgba(90,62,30,.10)' : 'rgba(255,240,210,.08)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 1, 0, 7); x.fill(); x.restore(); }
    return [c, bc]; }
  const BASE = [base(), base()];
  function sheet(bi, low, stamp) {
    const [c, x] = can(PW, PH), [bc, b] = can(PW / 2, PH / 2); x.drawImage(BASE[bi][0], 0, 0); b.drawImage(BASE[bi][1], 0, 0);
    if (fr() < .5) { x.fillStyle = `rgba(${fr() < .5 ? '255,236,200' : '80,56,30'},.06)`; x.fillRect(0, 0, PW, PH); }   // sheets differ a shade from each other
    if (stamp) { x.save(); x.translate(PW * (.25 + fr() * .3), PH * (.25 + fr() * .4)); x.rotate((fr() - .5) * .08); x.globalAlpha = .45; x.fillStyle = '#2f4f8a'; x.strokeStyle = '#2f4f8a'; x.lineWidth = 2;   // the grade stamp, faded blue ink
      x.strokeRect(0, 0, 150, 58); x.font = 'bold 19px Arial'; x.fillText('OSB/3', 10, 24); x.font = '13px Arial'; x.fillText('EN 300 · 18 mm', 10, 42); x.fillText('E1 · CE', 88, 24); x.globalAlpha = .3; x.fillRect(4, 49, 142, 4); x.restore(); }
    const scr = (px, py) => { x.fillStyle = 'rgba(60,45,30,.55)'; x.beginPath(); x.arc(px, py, 3.4, 0, 7); x.fill(); x.fillStyle = '#9a968e'; x.beginPath(); x.arc(px, py, 2.4, 0, 7); x.fill(); x.fillStyle = '#5c5a56'; x.fillRect(px - 1.4, py - .3, 2.8, .6); x.fillRect(px - .3, py - 1.4, .6, 2.8);   // screw head + its countersink
      b.fillStyle = '#e8e8e8'; b.beginPath(); b.arc(px / 2, py / 2, 1.3, 0, 7); b.fill(); };
    const e = .012 * K;                                             // screws: 12 mm in round the edges every 150 mm, every 300 mm down the middle stud
    for (let y = .075 * K; y < PH; y += .15 * K) { scr(e + (fr() - .5), y + (fr() - .5) * 2); scr(PW - e + (fr() - .5), y + (fr() - .5) * 2); if ((y / (.15 * K) | 0) % 2 === 0) scr(PW / 2 + (fr() - .5) * 2, y); }
    for (const y of [e, PH - e]) for (let xx = .15 * K; xx < PW - .1 * K; xx += .2 * K) scr(xx, y);
    if (low) {                                                      // bottom row: floor splash and grime, trolley/fork scuffs, a boot mark or two
      const g = x.createLinearGradient(0, PH, 0, PH - .45 * K); g.addColorStop(0, 'rgba(70,62,52,.55)'); g.addColorStop(.35, 'rgba(80,70,58,.22)'); g.addColorStop(1, 'rgba(80,70,58,0)'); x.fillStyle = g; x.fillRect(0, PH - .45 * K, PW, .45 * K);
      for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(${90 + fr() * 40 | 0},${85 + fr() * 30 | 0},${75 + fr() * 25 | 0},${.15 + fr() * .3})`; x.beginPath(); x.arc(fr() * PW, PH - Math.pow(fr(), 2) * .3 * K, .6 + fr() * 2.2, 0, 7); x.fill(); }   // splash
      for (let i = 0; i < 7; i++) { const y = PH - (.08 + fr() * .5) * K, x0 = fr() * PW, len = (.1 + fr() * .45) * K; x.strokeStyle = `rgba(${fr() < .4 ? '70,70,72' : '230,220,200'},${.15 + fr() * .2})`; x.lineWidth = 1 + fr() * 3; x.beginPath(); x.moveTo(x0, y); x.lineTo(x0 + len, y + (fr() - .5) * 6); x.stroke(); }   // scuffs
      for (let i = 0; i < 2; i++) { x.save(); x.translate(fr() * PW, PH - (.05 + fr() * .25) * K); x.rotate((fr() - .5) * .6); x.fillStyle = 'rgba(55,50,45,.16)'; x.beginPath(); x.ellipse(0, 0, 14, 34, 0, 0, 7); x.fill(); x.restore(); } }   // boot marks
    x.fillStyle = 'rgba(40,28,16,.55)'; x.fillRect(0, 0, PW, 1.5); x.fillRect(0, PH - 1.5, PW, 1.5); x.fillRect(0, 0, 1.5, PH); x.fillRect(PW - 1.5, 0, 1.5, PH);   // the joint: a hair of dark gap round the sheet
    b.fillStyle = '#101010'; b.fillRect(0, 0, PW / 2, 1); b.fillRect(0, PH / 2 - 1, PW / 2, 1); b.fillRect(0, 0, 1, PH / 2); b.fillRect(PW / 2 - 1, 0, 1, PH / 2);
    const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8; const bump = new THREE.CanvasTexture(bc);
    return STD({ map, bumpMap: bump, bumpScale: 1.4, roughness: .86 }); }
  const MAT = { up: [sheet(0, false, true), sheet(1, false, false)], low: [sheet(1, true, false), sheet(0, true, true)] };
  // A wall of sheets: group at (ox, y0, oz) turned ry; sheets run along local +x for L metres, face local +z, H metres tall.
  // skip: [[s0, s1, y0, y1]] holes (local metres) where no sheet is drawn (openings).
  function wall(p, ox, y0, oz, ry, L, H, row0Low = true) {
    const g = grp(p, ox, y0, oz, ry);
    for (let s = 0, i = 0; s < L - .001; s += SW, i++) {
      const w = Math.min(SW, L - s);
      for (let y = 0, r = 0; y < H - .001; y += SH, r++) {
        const h = Math.min(SH, H - y), low = r === 0 && row0Low, m = (low ? MAT.low : MAT.up)[(i + r + (fr() < .3 ? 1 : 0)) % 2], flip = fr() < .5;
        const geo = new THREE.PlaneGeometry(w, h), uv = geo.attributes.uv;
        for (let k = 0; k < uv.count; k++) { let u = uv.getX(k) * w / SW, v = uv.getY(k) * h / SH; if (flip) u = 1 - u; if (!low && r > 0) v = 1 - h / SH + v * 1; uv.setXY(k, u, v); }
        const mesh = new THREE.Mesh(geo, m); mesh.position.set(s + w / 2, y + h / 2, 0); mesh.receiveShadow = true; g.add(mesh); } }
    return g; }
  MX.osb.map.dispose(); MX.osb.map = null; MX.osb.color.set(0x9a7c56); MX.osb.needsUpdate = true;   // box edges and inner faces: plain OSB tone (the old stretched blotchy map is gone)
  return { wall, MAT, SW, SH };
})();

// ---------------- the layout ----------------
function layout() {
  const P = scene;
  // ===== door end, left: workshop under the mezzanine, racking with the mezzanine store over it, IBCs =====
  zone('Door end · left');
  { const g = grp(P, 0, 0, -2.3); const MW = 6.0, ML = 10.6, CH = 3.8, DK = CH + .22, SH = 1.95;   // CH: workshop ceiling 3.8 m in Josh's workshop scan (was drawn 3.0); DK: sewing-room floor; SH: its front wall, kept under the 6 m eaves. LiDAR (15 Oct): left as you walk in, 6.1 m deep off the left wall × 10.6 m long, front 2.45 m in from the door wall (Josh guessed 8 × 4)
    box(g, MW, .22, ML, MX.steel, MW / 2, CH, -ML / 2 - .1); for (const [x, z] of [[.3, -.3], [MW - .1, -.3], [MW - .1, -ML / 2], [MW - .1, -ML], [.3, -ML]]) box(g, .14, CH, .14, MX.steel, x, 0, z);
    box(g, MW, CH, .05, MX.osb, MW / 2, 0, -.15); box(g, .05, CH, ML - .2, MX.osb, MW, 0, -ML / 2 - .1);   // workshop walls
    box(g, .04, 1.4, 2.4, STD({ color: 0x8aa0ad, metalness: .4, roughness: .1 }), MW + .04, 1.2, -1.8); box(g, .04, .9, 1.6, STD({ color: 0x8aa0ad, metalness: .4, roughness: .1 }), MW + .04, 1.2, -9.5);   // windows clear of the yellow racking (scan: racking z -5.25…-10.85)
    box(SPARE, .06, 2.0, .9, MX.osb, MW + .04, 0, -2.4);   // 17 Oct: no door here (the workshop scan has the long bench and a wide window on this stretch; the way in is in the far wall): drawn into SPARE. Was: door near the front, where the scan shows the way in                                                         // door
    { const sv = _seed, TR = STD({ map: grain('#c8a878', '120,85,45', 256, 32, 0), roughness: .7 }), _r = (_seed = sv), HW_ = STD({ color: 0x8e9196, metalness: .7, roughness: .35 });   // OSB sheets on every face you can see (16–17 Oct): front to the door, long wall to the aisle, sewing-room walls above
      OSB.wall(g, 0, 0, -.122, 0, MW, CH); OSB.wall(g, MW + .028, 0, -.2, Math.PI / 2, ML - .2, CH);
      OSB.wall(g, 0, DK, -.122, 0, MW, SH, false); OSB.wall(g, MW + .028, DK, -.2, Math.PI / 2, ML - .2, .62, false); OSB.wall(g, MW + .028, DK + 1.9, -.2, Math.PI / 2, ML - .2, .5, false);
      for (const [y, h] of [[0, CH], [DK, SH]]) box(g, .07, h, .07, TR, MW - .005, y, -.135);   // corner battens over the sheet edges
      for (const [zc, ww, y0, wh] of [[-1.8, 2.4, 1.2, 1.4], [-9.5, 1.6, 1.2, .9]]) { for (const s of [-1, 1]) box(g, .03, wh + .1, .06, TR, MW + .04, y0 - .05, zc + s * (ww / 2 + .03)); for (const y of [y0 - .08, y0 + wh]) box(g, .03, .06, ww + .12, TR, MW + .04, y, zc); }   // window architraves (front window 2.4 × 1.4 m from the workshop scan, 17 Oct)
      OSB.wall(SPARE, MW + .072, 0, -1.95, Math.PI / 2, .9, 2.0);   // (17 Oct: moved to the far wall, old aisle door drawn into SPARE) the door: an OSB-faced door, frame, three hinges, lever handle
      for (const s of [-1, 1]) box(SPARE, .035, 2.06, .06, TR, MW + .05, 0, -2.4 + s * .48); box(SPARE, .035, .06, 1.02, TR, MW + .05, 2.0, -2.4);
      for (const y of [.25, 1.0, 1.75]) box(SPARE, .012, .1, .05, HW_, MW + .078, y, -1.97);
      box(SPARE, .012, .16, .045, HW_, MW + .078, .95, -2.76); box(SPARE, .05, .022, .022, HW_, MW + .1, 1.02, -2.76); box(SPARE, .022, .022, .12, HW_, MW + .125, 1.02, -2.71); }
    box(g, MW, SH, .05, MX.osb, MW / 2, DK, -.15); box(g, .05, .62, ML - .2, MX.osb, MW, DK, -ML / 2 - .1); box(g, .05, .5, ML - .2, MX.osb, MW, DK + 1.9, -ML / 2 - .1);   // sewing room walls, open in the middle so you can see in
    for (const [dy, h] of [[DK + .62, .06], [DK + 1.88, .06]]) box(g, .1, h, 2.7, MX.timber, MW + .03, dy, -4.0); for (const dz of [-5.32, -2.68]) box(g, .1, 1.3, .06, MX.timber, MW + .03, DK + .62, dz);   // open front onto the aisle
    // the sewing room up top (Josh): long cutting tables, industrial machines, rolls of canvas, strip lights
    { const sw = grp(g, 0, DK, 0), TOP = STD({ color: 0xe9e6dc, roughness: .6 }), LEG = STD({ color: 0x5b5f63, metalness: .5, roughness: .4 });
      for (const [x, z, L] of [[1.3, -2.4, 3.2], [1.3, -6.0, 2.4]]) { box(sw, 1.2, .04, L, TOP, x, .86, z); for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(sw, .05, .86, .05, LEG, x + sx * .55, 0, z + sz * (L / 2 - .1)); }
      for (let i = 0; i < 2; i++) { const t = new THREE.Mesh(new THREE.BoxGeometry(1.2, .02, 2.2), STD({ color: [0xcbb998, 0x3f5a46][i], roughness: .95 })); t.position.set(1.3, .91 + i * .02, -2.4 + i * .3); t.rotation.y = (rnd() - .5) * .1; t.castShadow = true; sw.add(t); }   // canvas laid out on the cutting table
      for (const z of [-4.4, -5.0]) { box(sw, .55, .74, 1.1, STD({ color: 0x3c3f44, roughness: .5 }), 3.1, 0, z); box(sw, .55, .04, 1.1, TOP, 3.1, .74, z);
        const mc = grp(sw, 3.1, .78, z); box(mc, .18, .1, .45, STD({ color: 0x2b4a7a, roughness: .35, metalness: .2 }), 0, 0, 0); box(mc, .12, .26, .1, STD({ color: 0x2b4a7a, roughness: .35, metalness: .2 }), 0, .1, -.17); box(mc, .12, .1, .4, STD({ color: 0x2b4a7a, roughness: .35, metalness: .2 }), 0, .32, -.02); cyl(mc, .008, .14, M.steel, 0, .22, .17); }
      for (let i = 0; i < 6; i++) { const c = cyl(sw, .12, 1.5, STD({ color: [0xd8cdb4, 0x3f5a46, 0xcbb998, 0xece8df][i % 4], roughness: .95 }), .45, .12 + Math.floor(i / 3) * .24, -6.6 - (i % 3) * .26, 'x', 16); }   // canvas rolls
      for (let i = 0; i < 3; i++) bag(sw, 2.9, 0, -6.8 - i * .45, .45, .34, .55, '#3e5240', '#9cff3a');
      for (const z of [-2, -4, -6]) { box(sw, .12, .04, 1.4, STD({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: .8 }), 1.6, 1.85, z); } }   // strip lights hung under the roof (the sewing room sits 0.8 m higher since the 3.8 m workshop ceiling)
    for (let i = 0; i < 3; i++) box(g, 1.1, .2, .9, MX.ply, 1.2, DK + i * .21, -6.4);
    T(g, 'Workshop + sewing room', 'Measured from Josh\'s LiDAR scan (15 Oct): about 6.1 × 10.6 m. On the left as you walk in: a boxed-in workshop under a steel mezzanine (OSB walls and windows onto the aisle, the way in through its far wall; tap "Workshop (inside)" to go in: benches all round, a tool wall, shelving, a centre table). Up on the mezzanine is the sewing room: long cutting tables with canvas laid out, industrial sewing machines, rolls of canvas and a few bags waiting for repair.', '6.1 × 10.6 m (scan) · workshop ceiling ≈ 3.8 m (scan)', 'sure'); }
  { const spare = new THREE.Group(), stock = [], toolFill = (g, cx, y, b, yy) => { rackFill(spare, cx, y); stock.push(...STOCK.fillTool(g, cx, y, b, Math.round((yy - .15) / 1.2))); };   // from the scan elevation (17 Oct); old random draws still taken into spare so nothing else moves
    const r = racking(P, 6.65, -5.25, LEFT, 2, [.15, 1.35, 2.55, 3.75], 2.8, 1.1, MX.yellow, toolFill);   // LiDAR: against the workshop wall, front at x 7.2
    for (const [o, name, what, size] of stock) T(o, name, what + ' Read off the LiDAR scan\'s elevation of this run, not confirmed.', size, 'not sure');
    const lad = grp(P, 7.5, 0, -11.2); lad.rotation.z = -.1; for (const s of [-1, 1]) box(lad, .08, 4.4, .05, MX.yellow, 0, 0, s * .22); for (let i = 0; i < 13; i++) box(lad, .05, .04, .44, MX.alu, 0, .3 + i * .32, 0);
    T(r, 'Yellow racking (workshop wall)', 'Pallet racking with yellow beams on the outside of the workshop wall, facing the aisle (placed from the LiDAR scan), stocked shelf by shelf from the scan: red and blue bins, totes and cases low, bags and rugs in the middle, sheepskins, baskets and rolled jute rugs up top; a yellow fibreglass ladder at the end.', '2 bays × 2.8 m (scan) · beams at 1.35 / 2.55 / 3.75 m', 'fairly sure'); }
  { const g = grp(P, 6.75, 0, -14.2, LEFT);   // LiDAR let y = 0; for (let i = 0; i < 3; i++) { pallet(g, 1.2, 1.0, y); box(g, 1.1, .95, .95, STD({ color: 0xe8e6dc, roughness: .35, transparent: true, opacity: .9 }), 0, y + .15, 0); const cage = new THREE.Mesh(new THREE.BoxGeometry(1.16, .98, 1.0, 6, 5, 5), new THREE.MeshStandardMaterial({ color: 0x9a9fa3, wireframe: true, metalness: .6 })); cage.position.y = y + .64; g.add(cage); y += 1.16; }
    T(g, 'IBC water tanks', 'Caged 1,000 litre IBC tanks, three high, just past the yellow racking.', '1.2 × 1.0 × 1.15 m each'); }
  // ===== door end, right: orange racking, black crate tower, trellis leaning, low floor-panel stack =====
  zone('Door end · right');
  { const spare = new THREE.Group(), planted = [];   // bays 3–4 from the far end, levels 1–2: planter pairs (the scan's darkest bays; contents top out at 1.47 / 2.92 m, as the pairs do)
    const stock = [], yardFill = (g, cx, y, b, yy) => { const lv = yy < 1 ? 0 : yy < 2 ? 1 : 2; if ((b === 2 || b === 3) && lv < 2) { rackFill(spare, cx, y); const s0 = _seed; planted.push(PLANTER.pair(g, cx, y)); _seed = s0; } else { const it = STOCK.fill(g, cx, y, b, lv); if (it) { rackFill(spare, cx, y); stock.push(...it); } else rackFill(g, cx, y); } };   // every bay-level now built from the scan elevations (STOCK); the old random draws still taken into spare   // spare + seed restore (pallet() uses rnd): same random draws, so nothing else moves
    const r = racking(P, 18.95, -14.2, RIGHT, 5, [.15, 1.55, 3.03], 2.77, 1.1, MX.orange, yardFill);   // LiDAR: uprights at z -14.2, -11.43, -8.63, -5.9, -3.13, -0.35
    for (const [i, g] of planted.entries()) T(g, 'Black planters (pair)', 'Two black ribbed planters with a silver trim band round the lip, strapped together with a blue ratchet strap, each on a euro pallet. Josh: "black ribbed boxes strapped in pairs on the racking = planters". Which bays they sit in is read off the LiDAR scan (darkest bays, matching heights), not confirmed.', '≈ 1.24 × 0.98 × 1.05 m each · pair ≈ 2.5 m', 'not sure');
    for (const [o, name, what, size] of stock) T(o, name, what + ' Read off the LiDAR scan\'s elevation of this bay, not confirmed.', size, 'not sure');
    T(r, 'Orange racking (yard bay)', 'Pallet racking with orange beams down the right wall from the door: the yard bay. Bays and beam heights measured from Josh\'s LiDAR scan (15 Oct).', '5 bays × 2.77 m · beams 1.55 / 3.03 m · front 1.55 m off the wall'); }
  { const spare = new THREE.Group(), stock = [], doorFill = (g, cx, y, b, yy) => { rackFill(spare, cx, y); stock.push(...STOCK.fillDoor(g, cx, y, yy < 1 ? 0 : yy < 2.5 ? 1 : 2)); };   // from the scan elevation (16 Oct 07:xx); old random draws still taken into spare so nothing else moves
    const r = racking(P, 18.1, -1.2, Math.PI, 1, [.15, 2.15, 3.05], 2.9, 1.1, MX.orange, doorFill);   // LiDAR: one bay along the door wall, x 15.2–18.1
    for (const [o, name, what, size] of stock) T(o, name, what + ' Read off the LiDAR scan\'s elevation of this bay, not confirmed.', size, 'not sure');
    T(r, 'Orange racking (door wall)', 'One bay of orange racking along the door wall, in the corner with the right-wall run (from the LiDAR scan).', '1 bay × 2.9 m · beams 2.15 / 3.05 m', 'fairly sure'); }
  { const spare = new THREE.Group(), stock = [], backFill = (g, cx, y, b, yy) => { rackFill(spare, cx, y); stock.push(...STOCK.fillBack(g, cx, y, b, yy < 1 ? 0 : yy < 2 ? 1 : 2)); };   // from the scan elevation (16 Oct 07:xx)
    const r = racking(P, 13.6, -15.4, FAR, 2, [.15, 1.35, 3.0], 2.45, 1.1, MX.yellow, backFill);
    for (const [o, name, what, size] of stock) T(o, name, what + ' Read off the LiDAR scan\'s elevation of this run, not confirmed.', size, 'not sure');   // LiDAR: across the hall at the back of the yard bay, x 13.6–18.5, front at z -14.85
    T(r, 'Yellow racking (back of the yard bay)', 'A short run of yellow-beam racking across the hall at the back of the yard bay, facing the door (from the LiDAR scan).', '2 bays × ≈2.45 m · beams ≈1.35 / 3.0 m', 'fairly sure'); }
  { const g = plainStack(P, coverMats('bedx', '#1c1d20', '#e9e9e6', null, { window: false }), 7.6, -1.8, RIGHT, [[0, 3]], 1.2, 1.1, 1.0); g.scale.setScalar(1);
    const film = new THREE.Mesh(new THREE.BoxGeometry(1.3, 3.95, 1.1), MX.filmThin); film.position.y = 1.97; film.userData.keep = true; g.add(film);
    T(g, 'Black crate tower', 'Three black Green Yurts crates stacked and cling-filmed together beside the door (the LiDAR scan shows a tall pile left of the roller door, x 4.9–8.2; black kit barely shows on LiDAR), with a flight case on wheels and a stack of trays next to it.', '≈ 3.9 m tall', 'not sure'); }
  { const g = grp(P, 14.6, 0, -1.6, -.3); for (let i = 0; i < 6; i++) { const s = trellisSection({ seed: 700 + i, weathered: .4 }); s.setOpen(s.minOpen); const h = grp(g, 0, 0, i * .1); h.rotation.x = -.3; h.add(s); s.position.set(-s.userData.cx, s.userData.end0, 0); }
    T(g, 'Trellis stood on end', 'Folded trellis sections stood up and leaning, next to the doorway.', '≈ 2.5 m tall'); }
  { const g = grp(P, 14.0, 0, -3.45, .05), faces = [];   // LiDAR (15 Oct): a 2.0 × 0.9 m pile, 1.15 m tall (was drawn 9 panels, 0.43 m). Panels 40 mm + 8 mm battens = 48 mm a layer: 24 high
    for (let i = 0; i < 9; i++) { faces.push(box(g, 1.95, .04, 1.1, STD({ map: grain(['#5a3a26', '#6a4430', '#4e3322'][i % 3], '30,20,10') }), (rnd() - .5) * .08, i * .048, 0)); box(g, 1.8, .01, .06, M.pallet, 0, i * .048 + .04, .4); }   // the first nine as before (same rnd draws, so nothing else moves)
    let sd = 4433; const fr = () => (sd = (sd * 16807) % 2147483647) / 2147483647, N = 24, LH = .048;
    const BAT = STD({ color: 0x9a7650, roughness: .85 }), EDGE = STD({ color: 0x3a281c, roughness: .9 }), STRAP = STD({ color: 0x1c1c1e, roughness: .7 });
    for (let i = 9; i < N; i++) { const lean = i > 18 ? (i - 18) * .006 : 0;   // the top few slide a touch off square, as hand-stacked panels do
      const b = box(g, 1.95, .04, 1.1, faces[i % 3].material, (fr() - .5) * .08 + lean, i * LH, (fr() - .5) * .05); b.rotation.y = (fr() - .5) * .025;
      if (i < N - 1) box(g, 1.8, .01, .06, M.pallet, 0, i * LH + .04, .4); }
    for (let i = 0; i < N - 1; i++) for (const bz of [-.42, 0, .42]) box(g, 1.85, .008, .045, BAT, 0, i * LH + .04, bz);   // battens under every panel: they show as a stripe of light timber between the dark faces
    for (let i = 0; i < N; i += 2) box(g, .012, .035, 1.08, EDGE, -.976, i * LH + .003, 0);   // sealed end grain on every other panel
    for (const sx of [-.55, .55]) {   // two black ratchet straps round the pile
      box(g, .05, N * LH + .02, .006, STRAP, sx, 0, .556); box(g, .05, N * LH + .02, .006, STRAP, sx, 0, -.556);
      box(g, .05, .006, 1.12, STRAP, sx, N * LH + .01, 0);
      box(g, .07, .09, .03, STD({ color: 0x8d9296, metalness: .7, roughness: .35 }), sx, .55, .572); }
    T(g, 'Floor panels (stack by the side door)', 'Yurt floor sections stacked flat: dark hardwood-faced panels on light timber battens, about two dozen high, two ratchet straps round the pile. Height and footprint from the LiDAR scan (15 Oct).', '≈ 2.0 × 1.1 m · 1.15 m tall (scan)', 'fairly sure'); }
  { const s0 = _seed, g = grp(P, 0, 0, 0), TR = STD({ map: grain('#c8a878', '120,85,45', 256, 32, 0), roughness: .7 }), HWm = STD({ color: 0x8e9196, metalness: .7, roughness: .35 }); _seed = s0;   // the door wall's side door (LiDAR, 15 Oct: x 13.2–15.1, daylight through it): OSB-lined opening, timber frame, a pair of OSB-faced doors, one open in, one out
    const { x0, x1, h } = SIDE, W = x1 - x0, LW = W / 2 - .03;
    OSB.wall(g, x0 + .012, 0, .14, Math.PI / 2, .2, h, false); OSB.wall(g, x1 - .012, 0, -.06, -Math.PI / 2, .2, h, false);   // OSB lining on the reveals
    box(g, W, .018, .2, MX.osb, (x0 + x1) / 2, h - .018, .04);   // and the head
    for (const x of [x0 - .035, x1 + .035]) box(g, .07, h + .07, .03, TR, x, 0, -.016); box(g, W + .14, .07, .03, TR, (x0 + x1) / 2, h, -.016);   // architraves on the hall side
    for (const x of [x0 + .025, x1 - .025]) box(g, .05, h, .07, TR, x, 0, .11); box(g, W, .05, .07, TR, (x0 + x1) / 2, h - .05, .11);   // door frame (stops on the outside line)
    box(g, W + .04, .012, .2, STD({ color: 0x9aa0a4, metalness: .6, roughness: .45 }), (x0 + x1) / 2, 0, .04);   // galvanised threshold plate, worn bright
    const leaf = (hx, sgn, ang) => { const lg = grp(g, hx, 0, .1); lg.rotation.y = ang; const f = grp(lg, sgn > 0 ? 0 : -LW, .015, 0);
      OSB.wall(f, 0, 0, .022, 0, LW, h - .07, false); OSB.wall(f, LW, 0, -.022, Math.PI, LW, h - .07, false);   // OSB both faces on a 40 mm frame
      box(f, LW, h - .07, .04, MX.osb, LW / 2, 0, 0); for (const yy of [.04, (h - .07) / 2 - .05, h - .18]) box(f, LW - .02, .1, .012, TR, LW / 2, yy, .027);   // ledges on the outside face
      for (const yy of [.25, 1.05, 1.85]) box(f, .28, .03, .006, HWm, sgn > 0 ? .14 : LW - .14, yy, -.026);   // tee hinges
      box(f, .025, .2, .03, HWm, sgn > 0 ? LW - .09 : .09, .95, -.04); return lg; };   // pull handle
    leaf(x0, 1, -Math.PI / 4);   // left leaf propped half open outwards (you see it through the opening)
    leaf(x1, -1, -Math.PI / 4);   // right leaf propped half open into the hall
    T(g, 'Side door (door wall)', 'A pedestrian door in the door wall, right of the roller door: OSB-lined opening with a timber frame and a pair of OSB-faced doors, propped open. Opening measured from the LiDAR scan (x 13.2–15.1 m, daylight through it); the doors themselves are a guess.', '≈ 1.9 × 2.2 m (scan)', 'fairly sure'); }
  // ===== the aisle: forklift and a loose bag =====
  zone('Aisle');
  { const f = buildForklift(); f.position.set(9.6, 0, -6.5); f.rotation.y = Math.PI; f.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); P.add(f);
    T(f, 'Forklift: Doosan G15S', 'The gas forklift (FTD 8548): DAEWOO on the mast, Calor bottle on the back, orange beacon.', '1.07 m wide · 2.16 m to the guard'); }
  { const g = grp(P, 11.2, 0, -9.4); bag(g, 0, 0, 0, 1.1, .4, .6, '#dcdcd6', null, .4); T(g, 'Canvas kit bag', 'A white canvas kit bag left on the floor.', ''); }
  // ===== right wall going in: ovens, Bedouin Extra, crown crates =====
  zone('Ovens · Bedouin · crowns');
  { const g = plainStack(P, coverMats('oven', '#1c1d20', '#e9e9e6', 'OVEN', { labelSize: 70 }), 19.3, -17.6, RIGHT, [[0, 3]]); T(g, 'Oven crates', 'Black covers marked "OVEN", three high: the wood-fired pizza ovens. Moved past the yard bay: the LiDAR scan shows racking where they were drawn, and didn\'t reach this spot.', '≈ 1.2 × 1.0 × 1.25 m each', 'not sure'); }
  { const bm = coverMats('bed', '#1c1d20', '#e9e9e6', 'BEDOUIN EXTRA', { labelSize: 64 }); const g = grp(P, 19.1, 0, -19.7, RIGHT);   // moved past the yard bay (scan), spot not scanned
    const bed = (x, y, z, w, h, d) => { const pg = grp(g, x, y, z); pallet(pg, w, d); const c = coverMesh(w + .02, h, d + .02, bm); c.position.y = .144 + h / 2; pg.add(c); };
    bed(0, 0, 0, 2.1, 1.04, 1.2); bed(-.5, 1.24, -.05, 1.1, 1.04, 1.1); bed(.1, 2.5, 0, 2.2, 1.1, 1.2);
    const rc = grp(g, .75, 1.24, .05); pallet(rc, 1.0, 1.1); const ply = STD({ map: tex(512, 384, (x, w, h) => { x.drawImage(MX.ply.map.image, 0, 0, w, h); x.fillStyle = 'rgba(30,25,20,.75)'; x.font = 'bold 34px Arial'; x.fillText('BEDOUIN', 300, 120); x.fillText('RECEPTION', 290, 160); drawBadge(x, 160, 220, 110, 'rgba(30,25,20,.75)', 'rgba(0,0,0,0)'); x.fillStyle = '#0c0a08'; x.beginPath(); x.arc(70, 70, 34, 0, 7); x.fill(); }) });
    box(rc, 1.0, 1.0, 1.1, [ply, ply, MX.ply, MX.ply, ply, ply], 0, .144, 0);
    T(g, 'Bedouin Extra crates', 'Black covers marked "BEDOUIN EXTRA" with dated check sheets in the pocket (spare kit for the Bedouin tents), three high, with the ply "BEDOUIN RECEPTION" crate (round hand-hole) on the middle level. Moved past the yard bay (LiDAR); exact spot not scanned.', 'bottom ≈ 2.1 × 1.2 m', 'not sure'); }
  { const g = grp(P, 15.9, 0, -17.6, -.2);   // moved out of the yard bay (scan) for (const dx of [0, 1.5]) { const s = grp(g, dx, 0, 0); const w = 1.2, d = 1.0; for (const sx of [-1, 1]) for (const sz of [-1, 1]) { box(s, .07, .9, .07, M.lime, sx * (w / 2 - .035), 0, sz * (d / 2 - .035)); box(s, .09, .18, .09, M.lime, sx * (w / 2 - .035), 0, sz * (d / 2 - .035)); } for (const sz of [-1, 1]) box(s, w, .08, .07, M.lime, 0, .1, sz * (d / 2 - .035)); for (const sx of [-1, 1]) box(s, .07, .08, d, M.lime, sx * (w / 2 - .035), .1, 0); for (const xx of [-.28, .28]) box(s, .2, .06, d, M.lime, xx, .1, 0); }
    T(g, 'Lime stillages (new, empty)', 'Brand-new lime-green post pallets with removable posts, standing empty. Moved out of the yard bay (LiDAR); spot not scanned.', '≈ 1.2 × 1.0 × 0.9 m', 'not sure'); }
  { const g = crownStack(P, K14, 6.75, -28.4, FAR, [[0, 3], [1, 2], [2, 2]]);   // LiDAR: 14FT CROWN crates mid-hall, x 6.1–10, z ≈ -27…-29 /* 7: 5 counted in photo 5 + 2 more (Josh) */ const top = onTop(grp(g, 1.32, 2.48, 0), 2); for (let i = 0; i < 8; i++) pallet(top, 1.2, .8, i * .145, .2); const cu = onTop(grp(g, 2.64, 2.48, 0), 2); for (let i = 0; i < 6; i++) box(cu, 1.15, .15, .62, STD({ color: 0x24262a, roughness: .55 }), 0, i * .165, 0);
    T(g, '14 ft crown crates', 'Green covers "14FT CROWN × 5": five 14 ft yurt crowns per crate, seven crates (up to three high), mid-hall where the LiDAR scan shows them, fronts to the door, with a stack of empty pallets and black cushion pads beside them.', '1.2 × 1.0 × 1.24 m each'); }
  { const g = crownStack(P, K16, 19.1, -18.6, RIGHT, [[0, 4], [1, 3]]);   // 7 counted (photo 51)
    const cage = onTop(grp(g, 1.32, 3.72, 0), 3); poleLevel(cage, 0, 1.0, M.red, 1.2, 1.0, true); for (let k = 0; k < 4; k++) blackCrate(cage, -.27 + (k % 2) * .54, .1 + Math.floor(k / 2) * .37, -.2, .5, .34, .38);
    T(g, '16 ft crown crates', 'Green covers "16FT CROWN × 5", stacked up to four high (about 5 m), with a red mesh cage of black crates on top of the middle column.', '1.2 × 1.0 × 1.24 m each'); }
  { const g = grp(P, 16.2, 0, -19.6, -.25); for (let i = 0; i < 3; i++) { const c = crown(g, 1.0, i * .14, .5, 0); c.rotation.x = Math.PI / 2; }
    T(g, 'Spare crowns (on edge)', 'Loose yurt crowns stood on edge against the crown crates.', '≈ 1.0 m across'); }
  { const g = canvasStack(P, 0, 17.0, -22.0, RIGHT, [[0, 2, ['', '']]], '#1f3f9a', '5 × TIPI CANVAS'); T(g, 'Tipi canvas crates', 'Blue covers marked "5 × TIPI CANVAS": five tipi canvases per crate, two high.', '≈ 1.2 × 1.0 m'); }
  { const g = canvasStack(P, 12, 17.0, -23.4, RIGHT, [[0, 1, ['10–18']]], '#1f3f9a'); T(g, '12 ft canvas crate', 'Blue cover marked "12ft CANVAS 10–18".', '≈ 1.2 × 1.0 m'); }
  // ===== right wall, far half: the bell tent bag racks, with the door stillages in front =====
  zone('Bag racks · door stillages');
  { const g = grp(P); const cols = [['#3e5240', '#45594a', '#34463a', '#e6dccb'], ['#a9b2ad', '#b8c0bb', '#9ea7a2'], ['#e6dccb', '#d9cbb3', '#3e5240'], ['#e6dccb', '#3e5240']];
    [[-24.6, 6, 0, '#9cff3a'], [-25.9, 6, 0, '#9cff3a'], [-27.2, 5, 1, null], [-28.5, 5, 2, '#ff3b3b'], [-29.8, 4, 2, '#ff3b3b'], [-31.1, 5, 3, '#9cff3a']].forEach(([z, lv, c, t]) => bagRack(g, 19.3, z, RIGHT, lv, .8, cols[c], t));
    [[-24.6, 5], [-25.9, 4], [-27.2, 5]].forEach(([z, lv]) => bagRack(g, 18.05, z, RIGHT, lv, .8, cols[(z * 3 | 0) % 2 ? 0 : 2], '#9cff3a'));
    T(g, 'Tent bag racks', 'Green post pallets four to six high, two deep against the right wall. Dark green bags are Emperor tents (emps); grey and beige bags are bell tents; pink bags: not known yet. Tags show condition: lime-green = good, red = bad.', 'post pallets 1.25 × 1.05 m · 0.8 m a level'); }
  { const g = grp(P); [[14.6, -25.0, .05, [{ sets: 1, per: 4, doors: 2 }]], [14.4, -27.2, -.04, [{ sets: 1, per: 4, doors: 2 }]], [14.7, -29.4, .02, [{ sets: 1, per: 4, doors: 2 }, { sets: 1, per: 4, doors: 1 }, { sets: 1, per: 4, doors: 1 }]], [11.9, -26.0, .08, [{ sets: 1, per: 4, doors: 2 }]]]
      .forEach(([x, z, ry, lv]) => trellisStillages(g, x, z, Math.PI / 2 + ry, lv));
    T(g, '16 ft trellis + door stillages', 'Purple stillages, one 16 ft yurt each: 4 trellis sections folded and laid two side by side, with the door set (pine boards, black strap hinges) laid flat on top, cling-filmed. One stack is three high.', 'stillages 2.32 × 1.35 m'); }
  // ===== left wall, middle: trellis wall stack, blue pole stillages, 14 ft canvas + 14 ft trellis/door stillages =====
  zone('14 ft kit · left wall');
  { const g = trellisStillages(P, .8, -15.2, LEFT, [{ sets: 1, per: 4, doors: 0 }, { sets: 1, per: 4, doors: 0 }, { sets: 1, per: 4, doors: 0 }]); T(g, 'Trellis stillages (wall stack)', 'Purple stillages of folded trellis, three high against the left wall.', '≈ 3 m tall'); }
  { const g = poleStillage(P, 1.31, -20.1, LEFT, [.5, .5, .5, .5, .5, .5, .5, .5, .5], Array(9).fill('r14'), M.blue, 1.15, 2.2); T(g, 'Pole stillages (blue): 14 ft', 'Blue pole stillages stacked nine high (about 4.5 m): the 14 ft yurt roof poles, strapped in bundles.', 'poles ≈ 2.0 m (worked out from the yurt size) · 0.5 m a level'); }
  { const g = grp(P, 1.08, 0, -21.6, LEFT); const cv = canvasStack(g, 14, 0, 0, 0, [[0, 1, ['13–17']]]); const cage = grp(g, 0, .84, 0); poleLevel(cage, 0, .76, M.red, 1.2, 1.0, true); lump(cage, 0, .08, 0, 1.0, .55, .85, MX.white);
    const up = canvasStack(g, 14, -.15, -.45, 0, [[0, 3, ['28–32', '18–22', '8–12']]]); up.position.y = 1.6;
    T(g, '14 ft canvas crates', 'Red covers marked "14ft CANVAS" with number ranges (13–17, 28–32, 18–22, 8–12…): 14 ft yurt canvases, five to a crate, numbered so a set goes out together; a red mesh cage of bulk bags between them.', '≈ 1.2 × 1.0 × 0.84 m each'); }
  { // LiDAR (15 Oct): three wrapped stacks run ACROSS the hall at x 3.7–6.6 (not one along the wall): z −18.3…−20.0 ≈ 3.7 m tall, z −21.6…−22.9 ≈ 2.6–3.8 m, z −22.9…−24.6 ≈ 1.25 m. Josh: 5 doors per stillage, 3 trellis each.
    // 17 Oct 05:xx: redone (02:xx version reverted for see-through film; the wrap is milky stretch-film now). Seed saved and restored round them, so every later random stack stays put.
    const s0 = _seed; trellisStillages(SPARE, 3.4, -21.9, LEFT + .03, [{ sets: 5, per: 3, doors: 1 }, { sets: 5, per: 3, doors: 1 }, { sets: 5, per: 3, doors: 1 }]); const s1 = _seed; _seed = s0;   // old single stack: draws taken, not shown
    const L5 = { sets: 5, per: 3, doors: 1 }, info = ['14 ft trellis + door stillages', 'Purple 14 ft stillages, stretch-wrapped, stacked in three piles that run across the hall from the left-wall stillages towards the aisle. A 14 ft yurt is 3 trellis sections per door, and each stillage holds 5 doors with their trellis: 15 sections, the folded trellis laid two side by side with each door flat on its set. Where and how high from the LiDAR scan (15 Oct): one pile four high (≈ 3.7 m in the scan), one three high, one single.'];
    const st = [trellisStillages(P, 5.0, -19.15, .02, [L5, L5, L5, L5]), trellisStillages(P, 5.05, -22.25, -.015, [L5, L5, L5]), trellisStillages(P, 5.15, -23.78, .01, [L5])];
    st.forEach((g, k) => T(g, info[0] + ['', ' (three high)', ' (single)'][k], info[1], 'stillages 2.32 × 1.35 m · 5 yurts each · ' + ['≈ 4.0', '≈ 3.0', '≈ 1.0'][k] + ' m tall', 'not sure')); _seed = s1; }
  { const s0 = _seed; poleStillage(SPARE, 1.47, -23.9, LEFT, [.5, .5, .5, .5, .5, .5], ['r16', 'r16', 'r16', 'r12', 'r12', 'r12'], M.red, 1.15, 2.4); const s1 = _seed; _seed = s0;   // old six-high stack: draws taken, not shown
    const g = poleStillage(P, 1.47, -23.9, LEFT, [.5, .5, .5, .5], ['r16', 'r16', 'r12', 'r12'], M.red, 1.15, 2.4); _seed = s1;   // 17 Oct 06:xx: four high, under the high bay's 2.4 m deck
    T(g, 'Pole stillages (red): 16 ft + 12 ft', 'Red pole stillages four high along the left wall, under the high racking bay: the 16 ft and 12 ft yurt roof poles, strapped in bundles. Moved 1.5 m towards the door on 17 Oct: the LiDAR scan has a pale sheeted block where they were drawn; their own spot isn\'t scanned clearly (it\'s hidden behind the stock in front).', 'poles ≈ 2.3 m (16 ft) and 1.7 m (12 ft), worked out from the yurt sizes', 'not sure'); }
  // ===== left wall band from the scan (17 Oct 03:xx, Josh's request: scan step 2c-iii) =====
  { const stock = [], leftFill = (g, cx, y, b, yy) => stock.push(...STOCK.fillLeft(g, cx, y, b, yy < 1 ? 0 : yy < 3 ? 1 : 2));
    const r = racking(P, .85, -16.53, LEFT, 1, [.15, 2.3, 4.35], 2.77, 1.1, MX.orange, leftFill);   // LiDAR: a face 5 m tall at x ≈ 1.4, z −16.6…−19.4; one 2.77 m bay like the yard bay's
    for (const [o, name, what, size] of stock) T(o, name, what + ' Read off the LiDAR scan\'s elevation of this bay, not confirmed.', size, 'not sure');
    T(r, 'Racking (left wall)', 'One bay of pallet racking against the left wall, blue uprights and orange beams like the yard bay, stocked from the LiDAR scan: bags and a tote low, striped canvas, a yellow bag and a white bulk bag in the middle, pale bags on top to about 5 m.', '1 bay × 2.77 m · beams ≈ 2.3 / 4.35 m (scan)', 'not sure');
    // in front of it on the floor (scan: 2.0–2.8 m at x 1.6–3.4, z −16.5…−18.2; ≈ 1 m at z −18.5…−19.3)
    const f = grp(P, 2.5, 0, -17.35); { const s0 = _seed; pallet(f, 1.2, 1.6, 0); _seed = s0; }
    STOCK.tarpBlock(f, 0, .06, 0, 1.7, 1.94, 1.25, 0x3c3f43, LEFT); STOCK.roll(f, 0, 2.0, 0, 1.5, .27);
    T(f, 'Sheeted pile + striped roll', 'Something about 1.6 × 1.2 m and 2 m tall under a black tarp, roped down, with a grey-and-white striped roll on top. The scan shows a dark block here with a striped bundle on it; what\'s under the tarp isn\'t known.', '≈ 1.6 × 1.2 × 2.5 m', 'not sure');
    const lb = grp(P, 2.4, 0, -18.9); STOCK.duffle(lb, -.35, 0, 0, .8, .7, .75, 0xcbbd9c, 0x8ac43f); STOCK.duffle(lb, .5, 0, .05, .75, .8, .7, 0x6b6e5a, null); STOCK.duffle(lb, .1, .65, 0, .6, .4, .6, 0x9a9b97, null);
    T(lb, 'Bags on the floor', 'Bags dumped on the floor in front of the racking, about 1 m high. The scan shows rounded beige, olive and grey shapes here.', '≈ 1.7 × 0.8 m', 'not sure');
    // the pale 2 m block at x 1.5–2.6, z −25.1…−28.3 (scan: smooth pale top at ≈ 2.1 m, creased sides)
    const pb = grp(P, 2.05, 0, -26.7); { const s0 = _seed; for (const dz of [-1.1, 0, 1.1]) pallet(grp(pb, 0, 0, dz), 1.2, 1.0, 0, .3); _seed = s0; }
    STOCK.tarpBlock(pb, 0, .05, 0, 3.25, 2.05, 1.15, 0xd8d3c4, LEFT);
    T(pb, 'Sheeted block (pale)', 'A long block about 3.2 m × 1.1 m and 2.1 m tall under a pale tarp, roped down, against the left wall. The LiDAR scan shows a smooth pale top and creased sides here; what\'s under it isn\'t known.', '≈ 3.2 × 1.1 × 2.1 m (scan)', 'not sure'); }
    // ---- 17 Oct 06:xx (scan step 2c-iv, part 1): the high bay at z −21.8…−25.0 and the cream sheeted stack by the walkway ----
    const hs = [], hi = racking(P, 2.95, -21.8, LEFT, 1, [2.4], 3.2, 1.1, MX.orange, (g, cx, y) => hs.push(...STOCK.fillHigh(g, cx, y)));   // LiDAR: deck ≈ 2.4 m at x 2.8–3.5, uprights z ≈ −21.8 / −25.0
    for (const [o, name, what, size] of hs) T(o, name, what + ' Read off the LiDAR scan, not confirmed.', size, 'not sure');
    T(hi, 'Racking (high bay)', 'One bay of racking with a single deck at about 2.4 m, stock on it up to about 5 m, the red pole stillages underneath. The LiDAR scan shows the deck, the uprights and the stock from the aisle; nothing under the deck is visible in it.', '1 bay × 3.2 m · deck ≈ 2.4 m (scan)', 'not sure');
    const cr = grp(SPARE, 3.6, 0, -20.55);   // 17 Oct: reverted (07:xx blind review: read as a 3 m thin slab in the walkway, 5.3 → 4.0); still built into SPARE so the stock RNG stays in step
    { const s0 = _seed; pallet(cr, 1.0, 1.2, 0, .3); _seed = s0; }
    STOCK.tarpBlock(cr, -.25, .06, 0, 1.1, 2.3, .85, 0xd2c8b2, LEFT, .03, 24); STOCK.tarpBlock(cr, .3, .06, 0, 1.05, 3.55, .62, 0xd9cfb8, LEFT, .04, 30);   // scan: ≈ 2.2–2.5 m at x 2.9–3.4, ≈ 3.3–3.8 m at x 3.5–4.25
    // (cream stack tag removed with it)
    // ---- 17 Oct 07:xx (scan step 2c-iv, part 2): the tall bay above the pale sheeted block, z −25.0…−28.2, front x 1.4 ----
    { const s0 = _seed, ts = [], tb = racking(P, .85, -25.0, LEFT, 1, [.15, 2.3, 3.3], 3.2, 1.1, MX.orange, (g, cx, y, b, yy) => ts.push(...STOCK.fillTall(g, cx, y, yy < 1 ? 0 : yy < 3 ? 1 : 2))); _seed = s0;   // LiDAR: face to the 5 m top at x ≈ 1.4, deck ≈ 2.3 m (q20), level ≈ 3.3 m
      for (const [o, name, what, size] of ts) T(o, name, what + ' Read off the LiDAR scan, not confirmed.', size, 'not sure');
      T(tb, 'Racking (tall bay)', 'One bay of racking against the left wall behind the pale sheeted block, stocked on its upper two levels up to about 5 m: a teal tote, cream sheeting and a yellow bag, then navy and black bags, grey-white sheeting and timber on top. The bottom level is hidden behind the block in the scan.', '1 bay × 3.2 m · beams ≈ 2.3 / 3.3 m (scan)', 'not sure'); }
  { const g = crownStack(P, K12, 7.2, -15.6, Math.PI, [[0, 1], [1, 1]]); const top = crownCrate(g, K12, .66, 1.24, 0); top.userData.level = 1; CRATES.push(top);   // 3 here + 1 by the door = 4 counted (photo 11)
    const byDoor = crownStack(P, K12, 6.75, -2.6, Math.PI / 2, [[0, 1]]);   // 17 Oct: x 6.3 → 6.75, it poked 0.2 m through the workshop's aisle wall T(byDoor, '12 ft crown crate (by the door)', 'A single "12FT CROWN × 12" crate near the roller door.', '1.2 × 1.0 × 1.24 m');
    T(g, '12 ft crown crates', 'Green covers "12FT CROWN × 12": twelve 12 ft yurt crowns per crate, out in the middle of the hall.', '1.2 × 1.0 × 1.24 m each'); }
  { const g = plainStack(P, coverMats('white', '#efeee9', '#161616', null, { window: false }), 4.4, -15.6, Math.PI, [[0, 2], [1, 2]], 1.2, 1.04, 1.0); T(g, 'Safari tent crates', 'White covers with the black Green Yurts badge, two high: the safari tents (Josh).', '≈ 1.2 × 1.0 × 1.2 m each'); }
  { const g = grp(P, 9.4, 0, -14.3); pallet(g, 2.2, 1.15); box(g, 2.2, 1.05, 1.15, [MX.ply, MX.ply, MX.ply, MX.ply, STD({ map: tex(512, 256, (x, w, h) => { x.drawImage(MX.ply.map.image, 0, 0, w, h); drawBadge(x, w / 2, h / 2, 100, 'rgba(30,25,20,.8)', 'rgba(0,0,0,0)'); }) }), MX.ply], 0, .144, 0); bag(g, .3, 1.2, 0, 1.0, .18, .4, '#3fae86');
    T(g, 'Plywood crate (GY badge)', 'Big ply crate with clips and the Green Yurts badge burnt on, a rolled green canvas on top. Moved out of the workshop footprint the LiDAR scan measured; spot not scanned.', '≈ 2.2 × 1.15 × 1.2 m', 'not sure'); }
  { const g = grp(P, 8.4, 0, -12.2); for (let i = 0; i < 14; i++) box(g, 1.25, .06, .85, STD({ map: tex(128, 128, (x, w, h) => { x.fillStyle = '#d9dbd9'; x.fillRect(0, 0, w, h); x.strokeStyle = '#4b4f52'; x.lineWidth = 3; for (let k = -w; k < w * 2; k += 18) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + h, h); x.moveTo(k + h, 0); x.lineTo(k, h); x.stroke(); } }) }), (rnd() - .5) * .05, .144 + i * .06, 0); pallet(g, 1.2, 1.0);
    T(g, 'Rugs (folded, strapped)', 'Grey and white diamond-pattern yurt floor rugs folded flat on a pallet. Moved out of the workshop footprint the LiDAR scan measured; spot not scanned.', '≈ 1.25 × 0.85 m', 'not sure'); }
  { const g = grp(SPARE, 7.3, 0, -19.8, .1); for (const s of [0, 1]) for (let i = 0; i < 20; i++) { box(g, 1.95 - rnd() * .2, .035, 1.15 - rnd() * .15, STD({ map: grain(['#5a3a26', '#6a4430', '#4e3322'][i % 3], '30,20,10') }), s * 1.3 - .65 + (rnd() - .5) * .08, i * .048, (rnd() - .5) * .08); } }   // LiDAR (15 Oct): open floor here, the only floor-panel pile is the scanned one by the side door. Draws kept, not shown
  // ===== far end: pole stillage towers, red canvas, timber =====
  zone('Far end · poles + canvas');
  { const g = poleStillage(P, 8.4, -31.2, 0, [1.7, .5, 1.0, 1.13], ['poles', 'alu', 'cage', 'alu']); const s = grp(g, 0, 4.33, 0); tubes(s, 22, -.55, .55, .02, 2, 4.2, .07, RAFTER, { tint: true });
    blackCrate(g, 0, 1.0, .9, .75, .38, .5, .1); for (const xx of [-.15, .2]) { cyl(g, .075, 3.2, RAFTER, xx, .09, 1.6, 'z', 14); const pl = cyl(g, .13, .01, MX.alu, xx, .09, 3.2, 'z', 20); }
    T(g, 'Pole stillage tower', 'Red post pallets four high: round timber roof poles on top (about 4 m), aluminium tubes with snap hooks, a mesh-sided level of folded coir and jute rugs, and centre poles with steel base plates on the bottom.', '1.05 × 2.6 m · ≈ 4.5 m to the top poles'); }
  { const g = poleStillage(P, 6.0, -31.6, 0, [.95, 1.0, 1.05, 1.2], ['cage', 'alu', 'crates', 'coir']); const ply = box(g, .45, .4, .02, STD({ map: tex(128, 128, (x, w, h) => { x.fillStyle = '#c6a273'; x.fillRect(0, 0, w, h); x.fillStyle = '#2a2420'; x.font = 'bold 44px Arial'; x.fillText('6×6', 22, 80); }) }), -.2, .3, 1.31);
    T(g, 'Pole stillages: 6×6 marquee + tubes', 'Four red post pallets: a mesh cage with white canvas and a ply board marked "6×6" (the 6 × 6 m marquee kit), aluminium tubes, black crates, jute and coir matting rolls.', '≈ 4.2 m'); }
  { const g = poleStillage(P, 10.8, -32.0, 0, [1.0, 1.05, 1.05, 1.1], ['coir', 'alu', 'crates', 'alu']); blackCrate(g, 0, 2.15, .7, .75, .32, .55, .4, 'Double Bedouin');
    T(g, 'Pole stillages: Double Bedouin', 'A third red stack: a black crate marked "Double Bedouin + extra bedouin bits", aluminium tubes sticking out at an angle, coir rolls.', '≈ 4.2 m'); }
  { const g = grp(P, 12.2, 0, -29.6, -.15); const n = 80, im = new THREE.InstancedMesh(new THREE.BoxGeometry(.035, .035, 1), RAFTER, n);
    for (let i = 0; i < n; i++) { e4.set(.1 + (rnd() - .5) * .04, (rnd() - .5) * .05, 0); q4.setFromEuler(e4); v4.set(-.3 + (i % 16) * .04, .02 + Math.floor(i / 16) * .036 + (i % 16) * .012, 0); s4.set(1, 1, 1 + rnd() * .2); m4.compose(v4, q4, s4); im.setMatrixAt(i, m4); }
    im.castShadow = true; g.add(im); for (let i = 0; i < 16; i++) box(g, .036, .036, .05, STD({ color: 0xd23a3a }), -.3 + i * .04, .02 + i * .012, -.55);
    T(g, 'Tent stakes', 'A strapped bundle of square timber stakes with red-painted tips.', '≈ 1.0–1.2 m'); }
  { const g = grp(P, 3.6, 0, -29.3); for (let i = 0; i < 4; i++) { tubes(g, 8, -.6, .6, i * .07, 1, 2.6, .035, MX.alu, { hollow: true, yaw: .5, tilt: .05 }); } blackCrate(g, .4, 0, 1.2, .78, .36, .58, -.2); blackCrate(g, -.6, 0, 1.0, .78, .36, .58, .3);
    T(g, 'Loose tubes + black crates', 'Aluminium tubes and black lidded crates on the floor at the foot of the pole stacks.', ''); }
  { const g = canvasStack(P, 16, 4.5, -36.6, FAR, [[0, 5, ['11–15', '41–45', '16–20', '1–5', '21–25']], [1, 4, ['36–40', '', '', '']]]);   // 9 counted (photo 39)
    const g2 = canvasStack(P, 16, .75, -33.8, LEFT, [[0, 5, ['', '', '', '', '']]]);   // 5 counted (photo 2)
    T(g, '16 ft canvas crates', 'Red covers marked "16ft CANVAS" with number ranges on the front: the 16 ft yurt canvases, five to a crate, stacked four or five high in the far-left corner.', '≈ 1.2 × 1.0 × 0.84 m each'); T(g2, '16 ft canvas crates (wall)', 'More "16ft CANVAS" crates along the left wall at the far end.', ''); }
  { const g = poleStillage(P, 13.4, -35.0, 0, [1.05, 1.05, 1.05, 1.05, 1.05], ['poles', 'timber', 'alu', 'coir', 'timber']); T(g, 'Pole tower (far end)', 'Red post pallets five high in the middle of the end wall: long timber poles sticking out both ends, aluminium tubes, canvas and jute bags.', '≈ 5.3 m'); }
  { const g = grp(P, 9.0, 0, -37.9); stillageFrame(g, M.purple, 3.0, .7, .3); for (let i = 0; i < 16; i++) box(g, .09, .05, 3.2, MX.timber, -.4 + (i % 4) * .25, .1 + Math.floor(i / 4) * .055, 0).rotation.y = Math.PI / 2;
    T(g, 'Timber lengths', 'Planed timber lengths in a low stillage against the end wall.', '≈ 3.2 m long'); }
  { const g = grp(P, 9.9, 0, -33.8); box(g, 1.2, .14, .8, STD({ color: 0xc0567a }), 0, 0, 0); T(g, 'Pink plastic pallet', 'A pink plastic pallet left on the floor.', '1.2 × 0.8 m'); }
  { const g = poleStillage(P, 17.6, -35.6, 0, [1.1, 1.1, 1.1, 1.1], ['alu', 'coir', 'alu', 'crates']); T(g, 'Red racks: poles + coir (far right)', 'Red post pallets with aluminium poles, rolled coir and jute matting, white canvas bags and black boxes.', '≈ 4.4 m'); }
  { const g = grp(P, 19.4, 0, -37.0); for (let i = 0; i < 26; i++) box(g, .1, .05, 3.6, MX.timber, (rnd() - .5) * .3, i * .05, 0); T(g, 'Timber stack (wall)', 'Planed timber stacked on battens against the far right wall.', '≈ 3.6 m long'); }
  // ===== the workshop INSIDE (17 Oct, Josh: "a complete picture with even more detail") =====
  // Read off Josh's workshop LiDAR scan (private; numbers, shapes and sampled colours only, never its textures). Fitted to the WW frame:
  // scan floor y −1.445, walls square to the scan's axes; WW x = scan z + 3.45, WW z = −scan x − 7.9 (its +z wall is the aisle wall, its −x end the
  // front). Inside: left lining x ≈ 0.45, aisle wall x ≈ 5.95, front z −2.45, far wall z −12.95 with the way out at its aisle corner (x ≈ 5.0–5.8;
  // the main scan sees the same gap from the hall). Front 3.6 m sits under a lower ply soffit at ≈ 3.0 m; the rest is open to the 3.8 m deck.
  zone('Workshop (inside)'); ZONE.cam = [[3.4, 2.05, -12.2], [3.1, 1.25, -5.2]];
  WSHOP(P);
}
// The workshop's contents. Own RNG (wr) and own canvases: nothing here draws from the layout seed, so nothing else moves.
function WSHOP(P) {
  let sq = 4409; const qr = () => (sq = (sq * 16807) % 2147483647) / 2147483647, qf = (a, b) => a + (b - a) * qr(), qspecks = (x, w, h, n, a) => { for (let i = 0; i < n; i++) { x.fillStyle = `rgba(${qr() > .5 ? '255,255,255' : '0,0,0'},${a * qr()})`; x.fillRect(qr() * w, qr() * h, 1 + qr() * 2, 1 + qr() * 2); } };   // W5 (22 Oct): own RNG for the detail pass, so wr()'s layout doesn't move
  let sv = 9203; const vr = () => (sv = (sv * 16807) % 2147483647) / 2147483647, vf = (a, b) => a + (b - a) * vr();   // W5b (23 Oct): a third RNG, so qr()'s sawdust and wr()'s layout stay put
  const n0 = P.children.length;   // everything added from here on is the workshop (for the contact-shadow bake at the end)
  let sd = 6271; const wr = () => (sd = (sd * 16807) % 2147483647) / 2147483647, wf = (a, b) => a + (b - a) * wr();
  const can = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new CT(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const specks = (x, w, h, n, a) => { for (let i = 0; i < n; i++) { x.fillStyle = `rgba(${wr() > .5 ? '255,255,255' : '0,0,0'},${a * wr()})`; x.fillRect(wr() * w, wr() * h, 1 + wr() * 2, 1 + wr() * 2); } };
  const T2 = (o, n, w, s, sure = 'not sure') => T(o, n, w + ' Read off Josh\'s workshop LiDAR scan (17 Oct).', s, sure);
  // --- materials
  const TOP = STD({ roughness: .72, map: can(512, 256, (x, w, h) => { x.fillStyle = '#b48f5f'; x.fillRect(0, 0, w, h);   // worn ply worktop: grain, rings, glue and paint spots, burn marks, saw kerfs
    for (let i = 0; i < 60; i++) { x.strokeStyle = `rgba(110,72,38,${wf(.05, .16)})`; x.lineWidth = wf(1, 3); x.beginPath(); let y = wr() * h; x.moveTo(0, y); for (let k = 1; k <= 8; k++) x.lineTo(k * w / 8, y += wf(-3, 3)); x.stroke(); }
    for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(${['60,40,25', '40,40,40', '200,190,170', '90,110,140', '160,60,40'][i % 5]},${wf(.12, .4)})`; x.beginPath(); x.ellipse(wr() * w, wr() * h, wf(2, 14), wf(2, 9), wr() * 3, 0, 7); x.fill(); }
    for (let i = 0; i < 14; i++) { x.strokeStyle = `rgba(50,32,18,${wf(.25, .5)})`; x.lineWidth = 1; x.beginPath(); const a = wr() * w, b = wr() * h; x.moveTo(a, b); x.lineTo(a + wf(-60, 60), b + wf(-8, 8)); x.stroke(); }
    specks(x, w, h, 4000, .12); const g = x.createRadialGradient(w / 2, h / 2, h * .2, w / 2, h / 2, w * .6); g.addColorStop(0, 'rgba(70,45,25,.12)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }) });
  const CARC = STD({ color: 0x9a7c56, roughness: .85 }), EDGE = STD({ color: 0x6b5236, roughness: .8 });
  const STEEL = STD({ color: 0x7c8186, metalness: .6, roughness: .45 }), DARK = STD({ color: 0x24272b, roughness: .55, metalness: .3 }), CHIP = STD({ color: 0xc9b48f, roughness: .85 });
  const RED = STD({ color: 0xb8231d, roughness: .4, metalness: .2 }), YEL = STD({ color: 0xf2b705, roughness: .45 }), BLK = STD({ color: 0x1b1c1e, roughness: .6 }), ORA = STD({ color: 0xe0661c, roughness: .45, metalness: .2 });
  // W5b (23 Oct): grime. Cupboard doors: finger marks round the pull, boot scuffs at the foot, dirty edges; bench front edges: dings, dark worn patches
  const DOORM = STD({ roughness: .62, map: can(128, 256, (x, w, h) => { x.fillStyle = '#d9d4c8'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${vr() > .5 ? '255,255,255' : '60,50,40'},${.06 * vr()})`; x.fillRect(vr() * w, vr() * h, 1 + vr() * 2, 1 + vr() * 2); }
    const eg = (x0, y0, x1, y1, a) => { const g = x.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, `rgba(70,55,40,${a})`); g.addColorStop(1, 'rgba(70,55,40,0)'); return g; };
    x.fillStyle = eg(0, 0, 10, 0, .35); x.fillRect(0, 0, 10, h); x.fillStyle = eg(w, 0, w - 10, 0, .35); x.fillRect(w - 10, 0, 10, h); x.fillStyle = eg(0, h, 0, h - 60, .4); x.fillRect(0, h - 60, w, 60);
    for (let i = 0; i < 26; i++) { const cx = w / 2 + vf(-26, 26), cy = vf(6, 40), r = vf(3, 9), g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, `rgba(60,48,36,${vf(.12, .3)})`); g.addColorStop(1, 'rgba(60,48,36,0)'); x.fillStyle = g; x.fillRect(cx - r, cy - r, 2 * r, 2 * r); }   // fingers round the pull (top)
    for (let i = 0; i < 9; i++) { x.strokeStyle = `rgba(40,32,26,${vf(.15, .4)})`; x.lineWidth = vf(1, 3); x.beginPath(); const a = vr() * w, b = h - vf(4, 50); x.moveTo(a, b); x.lineTo(a + vf(-30, 30), b + vf(-6, 6)); x.stroke(); }   // boot scuffs
    for (let i = 0; i < 3; i++) { x.fillStyle = `rgba(90,70,45,${vf(.08, .18)})`; const a = vr() * w; x.fillRect(a, vf(40, 150), vf(2, 4), vf(30, 90)); } }) });   // a few run-down drips
  EDGE.map = can(1024, 16, (x, w, h) => { x.fillStyle = '#6b5236'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(${vr() < .6 ? '35,24,14' : '160,128,90'},${vf(.2, .55)})`; x.fillRect(vr() * w, vr() * h, vf(2, 14), vf(2, 7)); }
    x.fillStyle = 'rgba(30,20,12,.35)'; x.fillRect(0, 0, w, 3); x.fillStyle = 'rgba(190,160,120,.25)'; x.fillRect(0, h - 2, w, 2); }); EDGE.color.set(0xffffff);
  const burn = n => { for (let i = 0; i < n; i++) wr(); };   // W5: the old CARD/OSBIN canvases drew from wr(); burn the same number of draws so every later item stays where it was
  burn(5404);
  const CARDS = [0, 1, 2].map(k => STD({ roughness: .9, map: can(128, 128, (x, w, h) => { x.fillStyle = ['#b88d5c', '#a87f52', '#c29a68'][k]; x.fillRect(0, 0, w, h); qspecks(x, w, h, 900, .08);   // three kinds of box: label, tape and print differ
    x.fillStyle = 'rgba(205,170,115,.9)'; x.fillRect(w / 2 - 8, 0, 16, h); if (k === 1) { x.fillStyle = 'rgba(160,150,140,.55)'; x.fillRect(0, h / 2 - 7, w, 14); }
    if (k === 0) { x.fillStyle = '#f0ede6'; x.fillRect(14, 70, 40, 26); x.fillStyle = '#333'; for (let i = 0; i < 4; i++) x.fillRect(18, 75 + i * 5, 20 + qr() * 14, 2); }
    else if (k === 1) { x.fillStyle = '#1a1a1a'; x.font = 'bold 15px Arial'; x.fillText('FIXINGS', 72, 100); x.fillText('M8', 80, 116); }
    else { x.strokeStyle = 'rgba(40,40,40,.8)'; x.lineWidth = 2; x.beginPath(); x.moveTo(20, 40); x.lineTo(20, 22); x.moveTo(14, 28); x.lineTo(20, 22); x.lineTo(26, 28); x.moveTo(36, 40); x.lineTo(36, 22); x.moveTo(30, 28); x.lineTo(36, 22); x.lineTo(42, 28); x.stroke(); x.fillStyle = '#2a2a2a'; x.fillRect(74, 84, 40, 4); x.fillRect(74, 92, 30, 3); } }) }));
  const CARD = CARDS[0]; let cardN = 0;
  const PEG = STD({ roughness: .8, map: can(512, 256, (x, w, h) => { x.fillStyle = '#a07a52'; x.fillRect(0, 0, w, h); specks(x, w, h, 3000, .08); x.fillStyle = 'rgba(30,20,12,.85)'; for (let j = 8; j < h; j += 16) for (let i = 8; i < w; i += 16) { x.beginPath(); x.arc(i, j, 2.4, 0, 7); x.fill(); }
    x.strokeStyle = 'rgba(40,30,20,.35)'; x.lineWidth = 2; for (let i = 0; i < 12; i++) { const a = wr() * w, b = wr() * h; x.strokeRect(a, b, wf(20, 70), wf(30, 90)); } }) });   // tool outlines drawn on the board
  burn(22500);
  const OSBIN = STD({ roughness: .86, map: can(512, 1024, (x, w, h) => { x.fillStyle = '#b38c5c'; x.fillRect(0, 0, w, h);   // one 1.22 x 2.44 m sheet at ~420 px/m: many small strands close in tone (the 17 Oct big blotchy ones read as camouflage)
    for (let i = 0; i < 5200; i++) { const t = qf(-32, 32), y0 = [0, 1, -1][i % 3] * 8; x.save(); x.translate(qr() * w, qr() * h); x.rotate(Math.PI / 2 + qf(-.5, .5)); x.fillStyle = `rgb(${179 + t + y0},${140 + t * .9},${92 + t * .7})`; const L = qf(26, 60), Wd = qf(7, 14); x.fillRect(-L / 2, -Wd / 2, L, Wd); x.restore(); }
    for (let i = 0; i < 420; i++) { x.fillStyle = `rgba(70,45,22,${qf(.3, .6)})`; x.fillRect(qr() * w, qr() * h, qf(2, 9), qf(1, 3)); }   // resin gaps and bark flecks
    qspecks(x, w, h, 3000, .07);
    x.fillStyle = 'rgba(60,40,22,.55)'; x.fillRect(0, 0, w, 2); x.fillRect(0, h - 2, w, 2); x.fillRect(0, 0, 2, h); x.fillRect(w - 2, 0, 2, h);   // the joint to the next sheet
    x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(0, 0, w, 10); x.fillRect(0, 0, 10, h);
    x.fillStyle = 'rgba(45,45,48,.9)'; for (const sx of [10, w / 2, w - 10]) for (let y = 16; y < h; y += 64) { x.beginPath(); x.arc(sx, y + qf(-2, 2), 2.2, 0, 7); x.fill(); }   // screw lines on the studs
    const g = x.createLinearGradient(0, h, 0, h * .8); g.addColorStop(0, 'rgba(60,45,30,.22)'); g.addColorStop(1, 'rgba(60,45,30,0)'); x.fillStyle = g; x.fillRect(0, h * .8, w, h * .2); }) });   // scuffed and grubby along the bottom
  OSBIN.map.wrapS = OSBIN.map.wrapT = THREE.RepeatWrapping;
  const sheet = (w, h, m, x, y, z, ry) => { const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); s.position.set(x, y + h / 2, z); s.rotation.y = ry; s.receiveShadow = true; P.add(s); return s; };
  // --- shell: OSB lining on the left (x 0.45) and on the inside of the front and aisle walls, the far wall with its doorway, the low ply soffit
  const shell = grp(P);
  const lin = (L, H, x, z, ry) => { const m = OSBIN.clone(); m.map = OSBIN.map.clone(); m.map.repeat.set(L / 1.22, H / 2.44); m.map.needsUpdate = true; const s = sheet(L, H, m, x, 0, z, ry); P.remove(s); shell.add(s); return s; };
  lin(10.5, 3.8, .45, -7.7, Math.PI / 2);
  { const w = grp(P), GL = STD({ color: 0x9fb4c2, metalness: .3, roughness: .08, emissive: 0x6f8798, emissiveIntensity: .35 }), FR = STD({ color: 0xc8a878, roughness: .7 });   // the front window from inside (scan: the aisle wall reads as glass at z −2.9…−5.3, 1.2–2.6 m)
    box(w, .02, 1.4, 2.4, GL, 5.945, 1.2, -4.1); for (const s of [-1, 1]) box(w, .05, 1.5, .07, FR, 5.93, 1.15, -4.1 + s * 1.235); for (const y of [1.13, 2.6]) box(w, .05, .07, 2.54, FR, 5.93, y, -4.1); box(w, .05, 1.4, .05, FR, 5.93, 1.2, -4.1);
    box(w, .16, .03, 2.54, FR, 5.86, 1.13, -4.1); } lin(5.5, 3.8, 3.2, -2.48, Math.PI); lin(10.4, 3.8, 5.96, -7.65, -Math.PI / 2);
  { const fw = grp(P, 0, 0, -12.95); const H = 3.8, D0 = 4.95, D1 = 5.85, DH = 2.05;   // far wall: OSB on studs, a doorway at the aisle corner (scan: gap at x ≈ 5.0–5.8)
    for (const [a, b, y0, y1] of [[.45, D0, 0, H], [D1, 6.0, 0, H], [D0, D1, DH, H]]) { box(fw, b - a, y1 - y0, .1, CARC, (a + b) / 2, y0, 0); for (const zz of [.052, -.052]) { const om = OSBIN.clone(); om.map = OSBIN.map.clone(); om.map.repeat.set((b - a) / 1.22, (y1 - y0) / 2.44); om.map.needsUpdate = true; const s = new THREE.Mesh(new THREE.PlaneGeometry(b - a, y1 - y0), om); s.position.set((a + b) / 2, (y0 + y1) / 2, zz); s.rotation.y = zz > 0 ? 0 : Math.PI; s.receiveShadow = true; fw.add(s); } }
    const TR = STD({ color: 0xc8a878, roughness: .7 }); for (const x of [D0 - .03, D1 + .03]) box(fw, .06, DH + .06, .14, TR, x, 0, 0); box(fw, D1 - D0 + .12, .06, .14, TR, (D0 + D1) / 2, DH, 0);
    const leaf = grp(fw, D0 + .02, 0, -.07); leaf.rotation.y = -Math.PI * .62; box(leaf, .86, DH - .03, .04, CARC, .43, .01, -.02); for (const s of [.022, -.062]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(.86, DH - .03), OSBIN); f.position.set(.43, (DH) / 2, s); if (s < 0) f.rotation.y = Math.PI; leaf.add(f); }
    box(leaf, .12, .03, .03, STEEL, .74, 1.0, .02); box(leaf, .12, .03, .03, STEEL, .74, 1.0, -.07);
    T2(fw, 'Workshop far wall + way out', 'The workshop\'s far wall, OSB on studs, with a doorway at the aisle corner into the hall. The scan walks out through a gap here, and the main hall scan sees the same gap from outside.', 'doorway ≈ 0.9 × 2.05 m', 'fairly sure'); }
  { const sf = grp(P); const s = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 3.65), STD({ color: 0xc9b089, roughness: .8, side: THREE.DoubleSide })); s.rotation.x = Math.PI / 2; s.position.set(3.2, 2.98, -4.28); sf.add(s);
    for (const x of [2.2, 4.0]) box(sf, .1, .18, 3.65, CARC, x, 2.8, -4.28); box(sf, 5.5, .2, .1, CARC, 3.2, 2.78, -6.08);
    T2(sf, 'Low ceiling (front of the workshop)', 'The front 3.6 m of the workshop has a lower ply ceiling at about 3.0 m on two beams; the rest is open up to the deck at 3.8 m. What\'s above it (a store?) isn\'t in the scan.', 'soffit ≈ 3.0 m (scan)'); }
  T(shell, 'Workshop walls (inside)', 'OSB-lined walls inside the workshop.', '10.5 × 5.5 m inside (scan)', 'fairly sure').userData.noPick = true;
  // --- builders
  function bench(p, x, z, L, D, H, ry, opts = {}) { const g = grp(p, x, 0, z, ry);   // a timber workbench: ply top with a front edge, legs, a rail, a shelf underneath (optional cupboard doors)
    box(g, L, .04, D, TOP, 0, H - .04, 0); box(g, L, .06, .025, EDGE, 0, H - .07, D / 2);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, .07, H - .04, .07, CARC, sx * (L / 2 - .05), 0, sz * (D / 2 - .05));
    for (let k = 1; k < Math.floor(L / 1.4); k++) for (const sz of [-1, 1]) box(g, .07, H - .04, .07, CARC, -L / 2 + k * L / Math.floor(L / 1.4), 0, sz * (D / 2 - .05));
    box(g, L - .1, .022, D - .1, CHIP, 0, .16, 0); box(g, L, .07, .04, CARC, 0, H - .14, -D / 2 + .03);
    if (opts.doors) { const n = Math.round(L / .6); for (let i = 0; i < n; i++) { box(g, L / n - .01, H - .26, .018, DOORM, -L / 2 + (i + .5) * L / n, .1, D / 2 - .01); box(g, .1, .015, .02, STEEL, -L / 2 + (i + .5) * L / n, H - .3, D / 2 + .01); } }
    return g; }
  function shelving(p, x, z, L, D, H, ry, levels) { const g = grp(p, x, 0, z, ry);   // grey slotted-angle shelving, chipboard shelves
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, .04, H, .04, STEEL, sx * (L / 2 - .02), 0, sz * (D / 2 - .02));
    for (const y of levels) { box(g, L, .018, D, CHIP, 0, y, 0); for (const sz of [-1, 1]) box(g, L, .035, .015, STEEL, 0, y - .02, sz * D / 2); }
    for (const sx of [-1, 1]) { const m = new THREE.Mesh(new THREE.BoxGeometry(.012, Math.hypot(H * .5, D) , .02), STEEL); m.position.set(sx * (L / 2 - .02), H * .75, 0); m.rotation.x = Math.atan2(D, H * .5); g.add(m); }
    return g; }
  const cbox = (p, x, y, z, w, h, d, ry = 0) => { const b = box(p, w, h, d, CARDS[cardN++ % 3], x, y, z, ry); return b; };
  const tub = (p, x, y, z, w, h, d, lid) => { box(p, w, h, d, STD({ color: 0xe8ecee, transparent: false, roughness: .3 }), x, y, z); box(p, w + .02, .03, d + .02, STD({ color: lid, roughness: .4 }), x, y + h, z); };
  const tin = (p, x, y, z, r, h, col) => { cyl(p, r, h, STD({ color: 0xb5b9bc, metalness: .7, roughness: .35 }), x, y + h / 2, z); cyl(p, r * 1.01, h * .55, STD({ color: col, roughness: .5 }), x, y + h * .45, z); cyl(p, r * .95, .006, STEEL, x, y + h + .003, z); };
  const caseY = (p, x, y, z, w, h, d, ry = 0) => { const g = grp(p, x, y, z, ry); box(g, w, h * .5, d, YEL, 0, 0, 0); box(g, w, h * .5, d, BLK, 0, h * .5, 0); box(g, w + .008, .012, d + .008, BLK, 0, h * .5 - .006, 0);   // moulded seam rim
    for (const sx of [-1, 1]) { box(g, .022, .028, .03, BLK, sx * w * .2, h, 0); box(g, .05, .05, .018, YEL, sx * w * .35, h * .42, d / 2 + .009); box(g, .036, .014, .02, BLK, sx * w * .35, h * .5, d / 2 + .012); }   // handle posts, flip latches
    const hd = tmesh(g, new THREE.CapsuleGeometry(.011, w * .36, 3, 8), BLK, 0, h + .036, 0); hd.rotation.z = Math.PI / 2;   // grip
    for (let i = 0; i < 3; i++) box(g, w * .7, .004, .006, BLK, 0, h * .78 + i * .018, -d / 2 - .003);   // ribs on the lid back
    return g; };   // yellow-and-black tool case
  // hand and power tools (23 Oct 04:xx: shaped, not blocks; same footprints and call signatures as before)
  const tmesh = (p, geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; p.add(o); return o; };
  const GRIP = STD({ color: 0x2a2c2e, roughness: .85 }), WOODH = STD({ color: 0x9a6b3c, roughness: .6 }), BRIGHT = STD({ color: 0xb4b9bd, metalness: .85, roughness: .28 });
  const drill = (p, x, y, z, ry, col = YEL) => { const g = grp(p, x, y, z, ry), C = col.isMaterial ? col : STD({ color: col, roughness: .45 });   // callers pass YEL (a material) or a colour number
    const body = tmesh(g, new THREE.CapsuleGeometry(.038, .12, 4, 12), C, -.015, .215, 0); body.rotation.z = Math.PI / 2; body.scale.set(1, 1, .9);   // motor housing
    const vent = tmesh(g, new THREE.CylinderGeometry(.034, .034, .03, 14), BLK, -.075, .215, 0); vent.rotation.z = Math.PI / 2;   // rear cap
    const clutch = tmesh(g, new THREE.CylinderGeometry(.03, .032, .028, 16), BLK, .07, .215, 0); clutch.rotation.z = Math.PI / 2;
    const chuck = tmesh(g, new THREE.CylinderGeometry(.015, .022, .05, 12), BLK, .108, .215, 0); chuck.rotation.z = Math.PI / 2;
    const nose = tmesh(g, new THREE.CylinderGeometry(.01, .012, .012, 10), BRIGHT, .138, .215, 0); nose.rotation.z = Math.PI / 2;
    const bit = tmesh(g, new THREE.CylinderGeometry(.0035, .0035, .06, 6), BRIGHT, .173, .215, 0); bit.rotation.z = Math.PI / 2;
    const h = new THREE.Group(); h.position.set(-.035, .05, 0); h.rotation.z = -.18; g.add(h);   // handle, raked back
    box(h, .046, .135, .044, GRIP, 0, 0, 0); box(h, .02, .13, .046, C, .02, 0, 0); box(h, .016, .03, .02, BLK, .03, .1, 0);   // grip, coloured front, trigger
    box(g, .115, .022, .082, C, -.045, .03, 0); box(g, .12, .032, .086, BLK, -.045, 0, 0); box(g, .012, .006, .03, STD({ color: 0x3fd26a, emissive: 0x0c3a1a }), -.095, .054, 0);   // battery: coloured top, black pack, charge lights
    return g; };
  const hammer = (p, x, y, z, ry) => { const g = grp(p, x, y, z, ry);
    tmesh(g, new THREE.CylinderGeometry(.012, .015, .3, 10), WOODH, 0, .15, 0); tmesh(g, new THREE.CylinderGeometry(.0165, .0175, .11, 10), GRIP, 0, .055, 0);   // ash shaft, rubber grip
    const fc = tmesh(g, new THREE.CylinderGeometry(.015, .015, .045, 14), DARK, .035, .295, 0); fc.rotation.z = Math.PI / 2;   // striking face side
    const fr = tmesh(g, new THREE.CylinderGeometry(.0165, .0165, .006, 14), BRIGHT, .06, .295, 0); fr.rotation.z = Math.PI / 2;   // polished face
    box(g, .03, .036, .028, DARK, 0, .277, 0);   // eye block
    for (const sz of [-1, 1]) { const c = box(g, .07, .012, .009, DARK, -.04, .286, sz * .007); c.rotation.z = -.45; }   // split claw, curving down
    return g; };
  const spanner = (p, x, y, z, L) => { const g = grp(p, x, y, z);
    box(g, .012, L * .78, .004, BRIGHT, 0, L * .11, 0);   // shaft
    const ring = tmesh(g, new THREE.TorusGeometry(.011 + L * .02, .0045, 6, 14), BRIGHT, 0, L * .9, 0); ring.scale.z = .8;   // ring end
    for (const sx of [-1, 1]) box(g, .008, .028, .004, BRIGHT, sx * (.008 + L * .015), 0, 0);   // open-end jaws
    box(g, .03 + L * .03, .01, .004, BRIGHT, 0, -.004, 0);
    return g; };
  const saw = (p, x, y, z) => { const g = grp(p, x, y, z), sh = new THREE.Shape(); sh.moveTo(-.06, .02);   // hand saw hung by its handle: blade tapers to the toe, teeth down the front edge
    const n = 34; for (let i = 0; i <= n; i++) { const t = i / n, ex = .06 - .05 * t, ey = .02 - .47 * t; sh.lineTo(ex + (i % 2 ? .005 : 0), ey); }
    sh.lineTo(-.06, -.45); sh.lineTo(-.06, .02);
    const bl = tmesh(g, new THREE.ShapeGeometry(sh), STD({ color: 0xaeb3b7, metalness: .8, roughness: .32, side: THREE.DoubleSide }), 0, 0, .001);
    const hs = new THREE.Shape(); hs.moveTo(-.07, 0); hs.lineTo(.07, 0); hs.lineTo(.065, .07); hs.quadraticCurveTo(.06, .13, .0, .13); hs.quadraticCurveTo(-.07, .13, -.07, .07); hs.lineTo(-.07, 0);
    const hole = new THREE.Path(); hole.moveTo(-.035, .03); hole.lineTo(.035, .03); hole.quadraticCurveTo(.04, .095, .0, .095); hole.quadraticCurveTo(-.04, .095, -.035, .03); hs.holes.push(hole);
    const hg = new THREE.ExtrudeGeometry(hs, { depth: .022, bevelEnabled: true, bevelSize: .004, bevelThickness: .004, bevelSegments: 2 }); hg.translate(0, 0, -.011);
    tmesh(g, hg, STD({ color: 0x8a3a24, roughness: .55 }), 0, -.01, .005);
    for (const sx of [-.035, .035]) { const r = tmesh(g, new THREE.CylinderGeometry(.006, .006, .03, 8), BRIGHT, sx, .01, 0); r.rotation.x = Math.PI / 2; }   // brass-ish rivets
    return g; };
  // 23 Oct 05:xx: the last plain blocks on the far wall and floor get real shapes (F-clamps, spirit levels, roll cabinet, offcuts bin, bench cable reel). No RNG draws, so nothing else moves
  const CLR = STD({ color: 0xc0221b, roughness: .42, metalness: .25 }), ALU = STD({ color: 0xc3c7ca, metalness: .75, roughness: .38 });
  const peg = (p, x, y, z, L = .05) => { const k = tmesh(p, new THREE.CylinderGeometry(.0028, .0028, L, 6), BRIGHT, x, y, z + L / 2); k.rotation.x = Math.PI / 2; return k; };   // a pegboard hook sticking out of the board
  const fclamp = (p, x, y, z, L = .45, R = .1) => { const g = grp(p, x, y, z);   // F-clamp hung by its fixed jaw: flat steel bar, cast red jaws, a sliding jaw part way down, a threaded spindle with a wooden handle and a swivel pad
    box(g, .02, L, .006, BRIGHT, 0, -L, 0); for (let i = 0; i < 12; i++) box(g, .022, .002, .007, DARK, 0, -L + .02 + i * L / 13, 0);   // the bar and its notches
    const jaw = (yy, len, top) => { const sh = new THREE.Shape(); sh.moveTo(-.015, 0); sh.lineTo(len, top ? -.004 : .004); sh.lineTo(len, top ? -.026 : .026); sh.lineTo(.02, top ? -.034 : .034); sh.lineTo(-.015, top ? -.03 : .03); sh.lineTo(-.015, 0);
      const ge = new THREE.ExtrudeGeometry(sh, { depth: .014, bevelEnabled: true, bevelSize: .002, bevelThickness: .002, bevelSegments: 1 }); ge.translate(0, 0, -.007); return tmesh(g, ge, CLR, 0, yy, 0); };
    jaw(0, R, true); box(g, .022, .012, .016, BRIGHT, R - .008, -.038, 0);   // fixed jaw at the top and its pad
    const sy = -L * .62; jaw(sy, R, false);   // sliding jaw
    const sp = tmesh(g, new THREE.CylinderGeometry(.005, .005, .12, 8), BRIGHT, R - .01, sy + .02, 0);   // spindle up through the sliding jaw
    tmesh(g, new THREE.CylinderGeometry(.008, .008, .006, 10), BRIGHT, R - .01, sy + .083, 0);   // swivel pad
    tmesh(g, new THREE.CylinderGeometry(.011, .013, .08, 10), WOODH, R - .01, sy - .045, 0); tmesh(g, new THREE.CylinderGeometry(.0135, .0135, .008, 10), BRIGHT, R - .01, sy - .004, 0);   // wooden handle and ferrule
    peg(p, x + .01, y + .012, z - .02, .04); return g; };
  const sLevel = (p, x, y, z, L, col) => { const g = grp(p, x, y, z);   // spirit level hung flat on two hooks: painted box section, dark rubber end caps, a centre vial in a window and a plumb vial near one end
    const C = STD({ color: col, roughness: .45, metalness: .25 });
    box(g, L - .04, .055, .025, C, 0, 0, 0); box(g, L - .04, .006, .027, ALU, 0, -.003, 0); box(g, L - .04, .006, .027, ALU, 0, .052, 0);   // body, machined top and bottom faces
    for (const s of [-1, 1]) box(g, .02, .06, .03, GRIP, s * (L / 2 - .01), -.0025, 0);
    const vial = (vx, vert) => { box(g, .055, .035, .028, BLK, vx, .01, 0); const v = tmesh(g, new THREE.CylinderGeometry(.006, .006, .036, 8), STD({ color: 0xc8e04a, emissive: 0x2a3a08, roughness: .2 }), vx, .0275, .0145); if (!vert) v.rotation.z = Math.PI / 2; box(g, .002, .02, .001, BLK, vx - .005, .0175, .0151); box(g, .002, .02, .001, BLK, vx + .005, .0175, .0151); };
    vial(0, false); vial(-L / 2 + .12, true);
    for (const s of [-.3, .3]) peg(p, x + s * L, y - .006, z - .02, .04);
    return g; };
  const rollCab = (p, x, z) => { const g = grp(p, x, 0, z);   // grey steel roll cabinet: castors, a seven-drawer base with pull bars and label slots, a lift-lid top chest, side handle, rubber mat on top
    const GC = STD({ color: 0x5e6367, metalness: .55, roughness: .42 }), GE = STD({ color: 0x494d51, metalness: .5, roughness: .5 }), LBL = STD({ color: 0xe9e6dc, roughness: .7 });
    box(g, .7, .03, .5, GE, 0, .1, 0); box(g, .02, .97, .5, GC, -.34, .13, 0); box(g, .02, .97, .5, GC, .34, .13, 0); box(g, .7, .97, .02, GC, 0, .13, -.24); box(g, .7, .025, .5, GE, 0, 1.075, 0);   // carcass
    const hs = [.1, .1, .1, .12, .14, .16, .2]; let yy = .135;
    for (const h of hs) { box(g, .655, h - .008, .02, GC, 0, yy, .245); box(g, .6, .012, .018, BRIGHT, 0, yy + h - .03, .262); for (const s of [-1, 1]) box(g, .012, .018, .03, BRIGHT, s * .29, yy + h - .033, .256);   // drawer front, aluminium pull bar on two posts
      box(g, .06, .022, .003, LBL, -.22, yy + h * .35, .256); yy += h; }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const c = grp(g, sx * .29, 0, sz * .19); box(c, .045, .006, .045, GE, 0, .093, 0); box(c, .006, .045, .03, GE, -.016, .045, 0); box(c, .006, .045, .03, GE, .016, .045, 0); cyl(c, .035, .025, GRIP, 0, .035, 0, 'x', 14); cyl(c, .012, .028, BRIGHT, 0, .035, 0, 'x', 8); }   // swivel castors
    const tc = grp(g, 0, 1.1, 0); box(tc, .72, .3, .48, GC, 0, 0, 0); box(tc, .73, .1, .49, GC, 0, .3, 0); box(tc, .73, .006, .49, GE, 0, .3, 0);   // top chest and its lid, hinge line
    for (let i = 0; i < 3; i++) { box(tc, .62, .075, .015, GC, 0, .02 + i * .093, .24); box(tc, .5, .01, .014, BRIGHT, 0, .072 + i * .093, .254); }
    box(tc, .7, .008, .47, STD({ color: 0x2a2b2d, roughness: .95 }), 0, .4, 0);   // rubber mat on the lid
    cyl(tc, .012, .012, BRIGHT, .3, .3, .248, 'z', 10);   // key lock
    for (const yy2 of [.85, .45]) box(g, .02, .02, .03, BRIGHT, .36, yy2, 0); cyl(g, .01, .42, BRIGHT, .385, .65, 0, 'y', 8);   // side push handle
    return g; };
  const offBin = (p, x, z) => { const g = grp(p, x, 0, z), BB = STD({ color: 0x1d1e20, roughness: .7 });   // ribbed black bin of timber offcuts
    const bm = new THREE.Mesh(new THREE.CylinderGeometry(.27, .23, .68, 28, 1, true), STD({ color: 0x1d1e20, roughness: .7, side: THREE.DoubleSide })); bm.position.y = .34; bm.castShadow = bm.receiveShadow = true; g.add(bm);
    cyl(g, .23, .02, BB, 0, .01, 0, 'y', 24);   // base
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = box(g, .022, .6, .012, BB, Math.cos(a) * .254, .05, Math.sin(a) * .254); r.rotation.order = 'YXZ'; r.rotation.set(0, -a, -.06); }   // vertical ribs following the taper
    const rim = new THREE.Mesh(new THREE.TorusGeometry(.275, .016, 8, 32), BB); rim.rotation.x = Math.PI / 2; rim.position.y = .68; g.add(rim);
    for (const s of [-1, 1]) { const hd = new THREE.Mesh(new THREE.TorusGeometry(.045, .01, 6, 12, Math.PI), BB); hd.position.set(s * .285, .6, 0); hd.rotation.set(0, Math.PI / 2, Math.PI); g.add(hd); }   // two side handles
    const WD = [0xc79a62, 0xb3875a, 0x9a7650, 0xd2b07c, 0xa8865e];
    for (let i = 0; i < 11; i++) { const a = i * 2.39, rr = .05 + (i % 4) * .045, L = .35 + (i * 37 % 50) / 100, o = box(g, [.045, .07, .095, .035][i % 4], L, [.02, .045, .018, .035][i % 4], STD({ color: WD[i % 5], roughness: .8 }), Math.cos(a) * rr, .2, Math.sin(a) * rr); o.rotation.set(Math.sin(a) * .35, a, Math.cos(a) * .3); }   // offcuts stood up and leaning, poking out the top
    const sx = box(g, .34, .1, .018, STD({ color: 0xd9d6cc, roughness: .8 }), -.02, .56, .08); sx.rotation.set(-.45, .2, .12);   // a strip of ply across the top, inside the rim
    return g; };
  const benchReel = (p, x, y, z, ry) => { const g = grp(p, x, y, z, ry), YR = STD({ color: 0xf0b414, roughness: .5 });   // site cable reel on its frame: yellow drum ends, four sockets on the hub, orange flex wound on, a winding handle
    const d = grp(g, 0, .17, 0); for (const s of [-1, 1]) { const f = tmesh(d, new THREE.CylinderGeometry(.155, .155, .014, 24), YR, s * .085, 0, 0); f.rotation.z = Math.PI / 2; }
    for (let i = 0; i < 6; i++) { const c = tmesh(d, new THREE.TorusGeometry(.115, .02, 6, 24), STD({ color: 0xe0661c, roughness: .55 }), -.065 + i * .026, 0, 0); c.rotation.y = Math.PI / 2; }   // turns of flex
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + .4; box(d, .012, .04, .04, STD({ color: 0x2a2c2e, roughness: .6 }), .098, Math.sin(a) * .06 - .02, Math.cos(a) * .06); }   // sockets in the front hub
    const fr = STD({ color: 0x2a2c2e, roughness: .55, metalness: .3 }); for (const s of [-1, 1]) { box(g, .012, .2, .02, fr, s * .1, 0, -.06).rotation.x = -.35; box(g, .012, .2, .02, fr, s * .1, 0, .06).rotation.x = .35; }   // A-frame legs
    box(g, .21, .012, .025, fr, 0, .3, 0);   // carry bar
    tmesh(g, new THREE.CylinderGeometry(.008, .008, .07, 8), BRIGHT, .13, .17, .09).rotation.z = Math.PI / 2; tmesh(g, new THREE.CylinderGeometry(.012, .012, .05, 10), GRIP, .165, .17, .09);   // winding handle
    const tail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, .05, .12), new THREE.Vector3(.02, .005, .2), new THREE.Vector3(-.06, .006, .32), new THREE.Vector3(-.16, .006, .3)]), 16, .007, 6), STD({ color: 0xe0661c, roughness: .55 })); tail.castShadow = true; g.add(tail);   // loose tail and plug
    box(g, .04, .03, .05, STD({ color: 0x1b1c1e }), -.18, 0, .3);
    return g; };
  // --- 1. front wall bench, under the window-less front, with shelves over its left end (scan: top ≈ 1.0–1.1 m, a shelf ≈ 2.0 m at x 0.75–2.0)
  { const g = grp(P), b = bench(g, 3.2, -2.78, 5.4, .62, 1.0, 0, { doors: false });
    const s = shelving(g, 1.4, -2.68, 1.7, .4, 1.3, 0, [.55, 1.0]); s.position.y = 1.0; for (let i = 0; i < 5; i++) tin(s, -.7 + i * .17, .57, 0, .065, .14, [0xd9dde0, 0x2f5f8f, 0xb8231d, 0xe8e2d0, 0x3b6b3a][i]);
    for (let i = 0; i < 3; i++) caseY(s, .15 + i * .28, 1.02, 0, .26, .12 + i * .01, .32); cbox(s, -.55, 1.02, 0, .4, .26, .3);
    const t = grp(g, 0, 1.0, 0); drill(t, 1.6, 0, -2.78, .4); drill(t, 1.95, 0, -2.7, -.3, 0x2a5aa8); caseY(t, 2.6, 0, -2.85, .5, .14, .36); for (let i = 0; i < 4; i++) tin(t, 4.4 + i * .14, 0, -2.9, .055, .12, [0xe8e2d0, 0xe0661c, 0x2f5f8f, 0xe8e2d0][i]);
    box(t, .3, .1, .2, STD({ color: 0x3c6e9e, roughness: .4 }), 3.6, 0, -2.85); hammer(t, 3.2, 0, -2.66, 0).rotation.z = Math.PI / 2; for (let i = 0; i < 3; i++) cbox(t, 5.15, i * .2, -2.85, .38, .2, .34, wf(-.1, .1));
    T2(g, 'Bench (front wall)', 'A timber bench right along the front wall: ply top, a shelf underneath, tins, drills and tool cases on it, a slotted-angle shelf unit over its left end with paint tins and yellow tool cases.', '≈ 5.4 × 0.6 m · top ≈ 1.0 m (scan)'); }
  // --- 2. left wall bench in the front, and a yellow banner on the wall above it (scan: ≈ 0.9–1.3 m at x 0.75–1.25; yellow 1.3–2.4 m at z −3.5…−4.6)
  { const g = grp(P), b = bench(g, .82, -4.4, 2.6, .7, .95, Math.PI / 2, { doors: true });
    const t = grp(g, .82, .95, -4.4); const vice = grp(t, 0, 0, .9); box(vice, .2, .12, .14, STD({ color: 0x2f5f8f, metalness: .4, roughness: .4 }), 0, 0, 0); box(vice, .2, .1, .04, STEEL, 0, .12, .08); cyl(vice, .01, .3, STEEL, 0, .08, .2, 'z', 8);
    for (let i = 0; i < 3; i++) cbox(t, wf(-.15, .1), i * .2, -.8 + i * .02, .5, .2, .4);
    const ban = sheet(1.05, 1.0, STD({ roughness: .6, map: can(256, 256, (x, w, h) => { x.fillStyle = '#e4e83a'; x.fillRect(0, 0, w, h); specks(x, w, h, 900, .08); x.strokeStyle = '#141414'; x.lineCap = 'round';
      for (let k = 0; k < 9; k++) { x.lineWidth = wf(5, 10); x.beginPath(); let px = 60 + k * 18, py = 110 + wf(-20, 30); x.moveTo(px, py); for (let s = 0; s < 4; s++) x.lineTo(px += wf(-8, 14), py += wf(-22, 22)); x.stroke(); }
      x.fillStyle = 'rgba(0,0,0,.15)'; x.fillRect(0, 0, w, 6); }) }), .48, 1.35, -4.05, Math.PI / 2); P.remove(ban); g.add(ban);
    for (const s of [-1, 1]) { const ey = new THREE.Mesh(new THREE.TorusGeometry(.012, .004, 6, 10), STEEL); ey.position.set(.49, 2.32, -4.05 + s * .48); ey.rotation.y = Math.PI / 2; g.add(ey); }
    T2(g, 'Bench with vice (left wall, front)', 'A bench along the left wall at the front with cupboards under it and a blue engineer\'s vice on the end; boxes stacked on it. On the wall above, a big yellow banner with black lettering (the scan can\'t read the words).', '≈ 2.6 × 0.7 m · top ≈ 0.95 m (scan)'); }
  // --- 3. the centre table (scan: ≈ 1.0–1.1 m at x 2.5–3.9, z −4.45…−5.8, open underneath with boxes)
  { const g = grp(P), b = bench(g, 3.2, -5.1, 1.4, 1.35, 1.05, 0); const t = grp(g, 3.2, 1.05, -5.1);
    const sht = box(t, 1.2, .018, .9, STD({ color: 0xcfc7b2, roughness: .9 }), -.05, 0, .05); sht.rotation.y = .06;   // a cut piece of canvas or sheet laid out
    box(t, .6, .02, .03, STEEL, .2, .02, -.1).rotation.y = -.3; box(t, .03, .008, .3, STD({ color: 0xf2b705 }), -.4, .02, .3); hammer(t, .35, .02, .35, 1.1).rotation.z = Math.PI / 2;
    for (let i = 0; i < 4; i++) cbox(g, 2.75 + (i % 2) * .55, .2 + Math.floor(i / 2) * .32, -5.1 + wf(-.2, .2), .5, .3, .5, wf(-.1, .1));
    T2(g, 'Centre table', 'A big timber table in the middle of the front, about waist height, with a piece of sheet laid out on it, tools, and boxes stored underneath.', '≈ 1.4 × 1.35 m · top ≈ 1.05 m (scan)'); }
  // --- 4. bench under the soffit edge, facing the back (scan: ≈ 1.0–1.1 m at x 2.75–4.0, z −6.45…−6.95)
  { const g = grp(P), b = bench(g, 3.4, -6.7, 1.5, .55, 1.05, 0); const t = grp(g, 3.4, 1.05, -6.7);
    const saw = grp(t, -.2, 0, 0); box(saw, .45, .08, .35, DARK, 0, 0, 0); cyl(saw, .13, .02, STEEL, 0, .25, 0, 'x', 24); box(saw, .3, .12, .1, YEL, .05, .3, .05); box(saw, .04, .25, .04, DARK, -.15, .05, 0);   // a mitre saw
    for (let i = 0; i < 2; i++) tub(t, .45, i * .2, 0, .4, .18, .3, [0x2a5aa8, 0xb8231d][i]);
    T2(g, 'Bench with mitre saw', 'A short bench at the edge of the low ceiling with a mitre saw on it and two plastic boxes of fixings.', '≈ 1.5 × 0.55 m · top ≈ 1.05 m (scan)'); }
  // --- 5. the long bench down the aisle wall, cupboards under it, shelves over the far half (scan: top ≈ 0.9–1.1 m at x 5.25–5.8 the whole length; stock to ≈ 1.7 m and 2.6 m over z −9…−12.7)
  { const g = grp(P), b = bench(g, 5.62, -7.6, 9.6, .62, .95, Math.PI / 2, { doors: true }); const t = grp(g, 5.62, .95, 0);
    let z = -3.4; const kinds = ['case', 'drill', 'tins', 'box', 'reel', 'tub', 'case', 'box', 'drill', 'tins', 'tub', 'box', 'case'];
    for (const k of kinds) { z -= wf(.55, .8); if (z < -12.3) break;
      if (k === 'case') caseY(t, 0, 0, z, .35, .13, .5, Math.PI / 2 + wf(-.1, .1)); else if (k === 'drill') drill(t, -.05, 0, z, wf(0, 6), wr() < .5 ? YEL : 0x2a5aa8);
      else if (k === 'tins') for (let i = 0; i < 3; i++) tin(t, -.12 + (i % 2) * .14, 0, z + i * .13, .05, .1 + wr() * .06, [0xe8e2d0, 0x3b6b3a, 0xb8231d][i]);
      else if (k === 'box') cbox(t, 0, 0, z, .35, .25, .45, wf(-.2, .2)); else if (k === 'tub') tub(t, 0, 0, z, .32, .22, .45, [0x2a5aa8, 0xb8231d, 0x3b6b3a][Math.floor(wr() * 3)]);
      else benchReel(t, -.02, 0, z, Math.PI / 2); }   // 05:xx: a real site cable reel
    const s = shelving(g, 5.74, -10.85, 3.6, .38, 1.75, Math.PI / 2, [.6, 1.15, 1.65]); s.position.y = .95;
    for (let i = 0; i < 6; i++) { cbox(s, -1.55 + i * .55, .62, 0, .45, .3, .32, wf(-.1, .1)); if (i % 2) tub(s, -1.5 + i * .55, 1.17, 0, .42, .24, .3, 0x2a5aa8); else caseY(s, -1.5 + i * .55, 1.17, 0, .4, .14, .3); }
    for (let i = 0; i < 5; i++) cbox(s, -1.5 + i * .7, 1.67, 0, .55, .22 + wr() * .1, .32, wf(-.1, .1));
    T2(g, 'Long bench (aisle wall)', 'A long bench the whole length of the aisle wall with cupboards under it, covered in tool cases, drills, tins, boxes and a cable reel; slotted-angle shelves above the far half full of boxes, fixings tubs and more cases.', '≈ 9.6 × 0.6 m · top ≈ 0.95 m (scan)'); }
  // --- 6. tall shelving down the left wall, back half (scan: 2.0–2.5 m at x 1.0–2.0, z −6.0…−9.4), and a lower unit after it (1.2–1.5 m, z −9.4…−10.2)
  { const g = grp(P), s = shelving(g, 1.45, -7.7, 3.3, 1.0, 2.45, Math.PI / 2, [.12, .62, 1.12, 1.62, 2.12]);   // scan: its front face at x ≈ 2.0
    const cols = [0xb8231d, 0x2a5aa8, 0x3b6b3a, 0xe0661c];
    for (let lv = 0; lv < 5; lv++) { let u = -1.5; while (u < 1.45) { const k = wr(), y = .14 + lv * .5;
      if (k < .35) { const w = wf(.3, .5); cbox(s, u + w / 2, y, wf(-.15, .15), w, wf(.2, .4), .5); u += w + .03; }
      else if (k < .55) { tub(s, u + .22, y, 0, .42, .25, .55, cols[Math.floor(wr() * 4)]); u += .46; }
      else if (k < .72) { caseY(s, u + .2, y, 0, .38, .14, .5); u += .42; }
      else if (k < .86) { for (let i = 0; i < 3; i++) tin(s, u + .07 + i * .13, y, wf(-.2, .2), .055, .14, cols[i]); u += .42; }
      else { const c = grp(s, u + .2, y + .12, 0); for (let i = 0; i < 3; i++) { const tr = new THREE.Mesh(new THREE.TorusGeometry(.12 - i * .02, .012, 6, 20), ORA); tr.rotation.y = Math.PI / 2; c.add(tr); } u += .32; } } }
    const lo = shelving(g, 1.3, -9.8, .8, .9, 1.45, Math.PI / 2, [.12, .7, 1.3]); for (let lv = 0; lv < 3; lv++) cbox(lo, 0, .14 + lv * .58, 0, .6, .38, .55, wf(-.1, .1));
    T2(g, 'Tall shelving (left wall)', 'Floor-to-2.4 m slotted-angle shelving down the left wall, packed: cardboard boxes, plastic boxes with coloured lids, yellow tool cases, paint tins and coils of rope; a lower unit of boxes after it.', '≈ 4.1 × 0.85 m · ≈ 2.45 m tall (scan)'); }
  // --- 7. the far wall: bench with a pegboard tool wall over it, a roll cabinet, the fire extinguisher (scan: bench ≈ 1.2–1.3 m deep in clutter at z −12.2…−12.95, shelving to 2.5 m above; a grey drawer stack ≈ 1.4 m at x ≈ 1.6; red at x ≈ 0.8, 1.3 m)
  { const g = grp(P), b = bench(g, 3.25, -12.6, 2.9, .65, .95, 0); const t = grp(g, 0, .95, 0);
    const pb = sheet(3.0, 1.15, PEG, 3.25, 1.15, -12.88, 0); P.remove(pb); g.add(pb);
    for (let i = 0; i < 5; i++) { hammer(g, 2.02 + i * .165, 1.48, -12.86, 0); for (const hx of [-.022, .022]) peg(g, 2.02 + i * .165 + hx, 1.755, -12.875, .05); }   // 05:xx: hung straight, heads up, on pairs of hooks (they overlapped in crossed pairs)
    for (let i = 0; i < 8; i++) spanner(g, 2.9 + i * .05, 1.45 + i * .008, -12.86, .14 + i * .02);
    for (let i = 0; i < 3; i++) saw(g, 3.5 + i * .2, 1.9, -12.865);   // hand saws
    for (let i = 0; i < 4; i++) fclamp(g, 4.22 + i * .13, 1.76 - (i % 2) * .02, -12.855, .45 - (i % 2) * .1, .1 - (i % 2) * .015);   // F-clamps (05:xx: bar, cast jaws, spindle, handle)
    sLevel(g, 2.4, 1.27, -12.86, .6, 0xf2b705); sLevel(g, 2.5, 2.0, -12.86, .6, 0x2a5aa8);   // spirit levels (05:xx: box section, end caps, vials)
    const sh = shelving(g, 3.25, -12.78, 2.9, .3, .55, 0, [.35]); sh.position.y = 2.0; for (let i = 0; i < 6; i++) (i % 2 ? tub : (p, x, y, z, w, h, d) => cbox(p, x, y, z, w, h, d))(sh, -1.2 + i * .48, .37, 0, .4, .18, .26, 0x2a5aa8);
    drill(t, 2.4, 0, -12.5, .5); caseY(t, 3.0, 0, -12.6, .45, .14, .35); for (let i = 0; i < 3; i++) tub(t, 3.6 + i * .3, 0, -12.65, .26, .12, .2, [0xb8231d, 0x2a5aa8, 0x3b6b3a][i]);
    rollCab(g, 1.45, -12.6);   // roll cabinet (05:xx: castors, drawers with pull bars and labels, lift-lid top chest, side handle)
    const fe = grp(g, .75, 0, -12.85); cyl(fe, .075, .5, RED, 0, 1.15, 0); cyl(fe, .03, .06, BLK, 0, 1.43, 0); box(fe, .03, .08, .06, BLK, .05, 1.45, 0); const hose = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(.04, 1.43, 0), new THREE.Vector3(.1, 1.3, .03), new THREE.Vector3(.08, 1.0, .05)]), 10, .01, 6), BLK); fe.add(hose);
    box(fe, .2, .28, .005, STD({ roughness: .5, map: can(100, 140, (x, w, h) => { x.fillStyle = '#c8201b'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.fillRect(4, 4, w - 8, 2); x.beginPath(); x.roundRect(40, 26, 22, 56, 6); x.fill(); x.fillRect(46, 18, 10, 9); x.fillRect(56, 20, 14, 4); x.font = 'bold 12px Arial'; x.textAlign = 'center'; x.fillText('FIRE', w / 2, 104); x.fillText('EXTINGUISHER', w / 2, 120); }) }), 0, 1.72, .07);   // its sign (W5b: a real red sign, was a plain white card)
    T2(g, 'Tool wall (far wall)', 'The far wall: a bench with a pegboard tool wall over it (hammers, spanners, hand saws, F-clamps, levels), a shelf of boxes and fixings tubs on top, a grey roll cabinet of drawers at the left end and the fire extinguisher by the corner.', 'bench ≈ 2.9 × 0.65 m · tool wall to ≈ 2.5 m (scan)'); }
  // --- 8. on the floor: compressor (scan: ≈ 0.65 m at x 4.0–4.5, z −11.0…−11.5, orange on top), a bin (≈ 0.7 m at x 3.0–3.5, z −8.2…−8.7), offcuts and sheet stock leaning on the left lining
  { const g = grp(P);
    const cp = grp(g, 4.25, 0, -11.2, .3); cyl(cp, .19, .62, ORA, 0, .26, 0, 'x', 20); for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.19, 16, 8), ORA); e.scale.x = .35; e.position.set(s * .31, .26, 0); cp.add(e); }
    box(cp, .3, .2, .22, BLK, -.05, .45, 0); cyl(cp, .05, .05, STEEL, .2, .5, 0); for (const s of [-1, 1]) cyl(cp, .06, .04, BLK, .25, .06, s * .14, 'z', 12); box(cp, .04, .07, .04, BLK, -.3, 0, 0);
    const hs = new THREE.Mesh(new THREE.TorusGeometry(.13, .012, 6, 24), STD({ color: 0x2a5aa8 })); hs.rotation.x = Math.PI / 2; hs.position.set(.1, .02, .35); cp.add(hs);
    T2(cp, 'Compressor', 'An orange air compressor on wheels with a blue airline coiled beside it.', '≈ 0.7 × 0.4 × 0.65 m (scan)');
    const bn = offBin(g, 3.25, -8.45);   // 05:xx: ribbed bin, rim, side handles, offcuts stood up in it
    for (let i = 0; i < 18; i++) wr();   // the old offcuts took 18 layout draws: keep taking them so nothing after this moves
    for (const [x, z, r, c] of [[2.4, -9.5, .2, 0x2a5aa8], [1.97, -9.95, .16, 0xe8e2d0]]) { const bk = grp(g, x, 0, z); const bm2 = new THREE.Mesh(new THREE.CylinderGeometry(r, r * .85, r * 1.7, 18, 1, true), STD({ color: c, roughness: .5, side: THREE.DoubleSide })); bm2.position.y = r * .85; bk.add(bm2); const rim = new THREE.Mesh(new THREE.TorusGeometry(r, .012, 6, 20), STD({ color: c })); rim.rotation.x = Math.PI / 2; rim.position.y = r * 1.7; bk.add(rim); T2(bk, 'Bucket', 'A plastic bucket on the floor (the scan shows an open ring here).', '≈ ' + (r * 2).toFixed(1) + ' m across'); }   // scan: two rings ≈ 0.4 m at x 2.2–2.6, z −9.3…−9.7 and x 1.6–2.0, z −9.7…−10.1
    { const lc = grp(g, .9, 0, -11.95); box(lc, .8, .95, .6, DOORM, 0, 0, 0); box(lc, .84, .03, .64, TOP, 0, .95, 0); for (const dz of [-.15, .15]) box(lc, .015, .1, .02, STEEL, .41, .75, dz); tin(lc, -.1, .98, .1, .06, .16, 0xb8231d); cbox(lc, .1, .98, -.1, .35, .25, .3); T2(lc, 'Low cupboard', 'A low cupboard in the far left corner with a tin and a box on it.', '≈ 0.8 × 0.6 × 1.0 m (scan)'); }   // scan: ≈ 1.0–1.1 m at x 0.75–1.0, z −11.7…−12.2
    T2(bn, 'Offcuts bin', 'A black bin full of timber offcuts.', '≈ 0.55 m across · 0.7 m (scan)');
    const lean = grp(g, .5, 0, -11.0); for (let i = 0; i < 5; i++) { const s = box(lean, .018, 2.4 - i * .25, 1.2 - (i % 2) * .3, i % 2 ? CARC : STD({ color: 0xcdb08a, roughness: .8 }), .05 + i * .02, 0, wf(-.1, .1)); s.rotation.z = -.08; }
    for (let i = 0; i < 7; i++) { const o = box(lean, .05, wf(1.2, 2.2), .1, STD({ color: [0xc79a62, 0xb3875a][i % 2] }), .22 + i * .015, 0, -.9 + i * .1); o.rotation.z = -.12; }
    T2(lean, 'Sheet stock + offcuts', 'Ply and OSB sheets and long timber offcuts leaning on the left wall.', '≈ 1.2 × 2.4 m sheets'); }
  // --- 9. services: strip lights (two lit), sockets and conduit along the benches, a light switch by the door; floor dust and sawdust
  { const g = grp(P), LT = STD({ color: 0xffffff, emissive: 0xfff6e6, emissiveIntensity: 1.4 }), CND = STD({ color: 0xe9e9e4, roughness: .5 });
    for (const [x, y, z] of [[1.8, 2.94, -4.3], [4.4, 2.94, -4.3], [1.8, 3.74, -8.2], [4.4, 3.74, -8.2], [1.8, 3.74, -11.4], [4.4, 3.74, -11.4]]) { box(g, .12, .06, 1.5, CND, x, y - .06, z); box(g, .07, .02, 1.42, LT, x, y - .08, z); }
    for (const [x, y, z, I] of [[3.2, 2.2, -4.3, 6], [3.2, 2.85, -9.9, 7.5]]) { const l = new THREE.PointLight(0xfff1dc, I, 9, 1.6); l.position.set(x, y, z); g.add(l); }   // W5: hung lower and softer (at 2.7 m, 0.28 m under the soffit, the front one blew the ceiling white)
    { const PLY = STD({ roughness: .85, map: can(256, 512, (x, w, h) => { x.fillStyle = '#c9b089'; x.fillRect(0, 0, w, h);   // W5: the underside of the sewing-room deck over the back of the workshop (was bare dark steel): ply sheets on steel joists
        for (let i = 0; i < 70; i++) { x.strokeStyle = `rgba(150,110,65,${qf(.06, .18)})`; x.lineWidth = qf(1, 4); x.beginPath(); let u = qr() * w; x.moveTo(u, 0); for (let k = 1; k <= 8; k++) x.lineTo(u += qf(-4, 4), k * h / 8); x.stroke(); }
        qspecks(x, w, h, 2500, .08); x.fillStyle = 'rgba(70,50,30,.5)'; x.fillRect(0, 0, w, 2); x.fillRect(0, 0, 2, h);
        const gr = x.createRadialGradient(w * .6, h * .4, 0, w * .6, h * .4, w * .5); gr.addColorStop(0, 'rgba(90,70,45,.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); }) });
      PLY.map.wrapS = PLY.map.wrapT = THREE.RepeatWrapping; PLY.map.repeat.set(5.51 / 1.22, 6.85 / 2.44);
      const cl = new THREE.Mesh(new THREE.PlaneGeometry(5.51, 6.85), PLY); cl.rotation.x = Math.PI / 2; cl.position.set(3.205, 3.785, -9.525); cl.receiveShadow = true; g.add(cl);
      const bh = new THREE.Mesh(new THREE.PlaneGeometry(5.51, .82), PLY.clone()); bh.material.map = PLY.map.clone(); bh.material.map.repeat.set(5.51 / 1.22, .82 / 2.44); bh.material.map.needsUpdate = true; bh.position.set(3.205, 3.39, -6.13); bh.rotation.y = Math.PI; bh.receiveShadow = true; g.add(bh);   // the step from the low front ceiling up to the deck: boxed in, not an open dark slot
      const JST = STD({ color: 0x5d6266, metalness: .5, roughness: .55 }); for (let z = -6.3; z > -12.9; z -= 1.22) { box(g, 5.5, .2, .045, JST, 3.205, 3.585, z); box(g, 5.5, .012, .1, JST, 3.205, 3.585, z); box(g, 5.5, .012, .1, JST, 3.205, 3.773, z); } }
    box(g, 9.4, .025, .025, CND, 5.93, 1.2, -7.6).rotation.y = Math.PI / 2; for (let z = -3.6; z > -12.3; z -= 1.4) { box(g, .04, .09, .15, CND, 5.93, 1.16, z); for (const dz of [-.035, .035]) box(g, .005, .025, .015, BLK, 5.905, 1.2, z + dz); }
    box(g, 2.8, .025, .025, CND, 3.25, 1.28, -12.92); for (const x of [2.2, 3.4, 4.5]) box(g, .15, .09, .04, CND, x, 1.24, -12.92);
    box(g, .08, .12, .03, CND, 4.75, 1.3, -12.92); box(g, .025, 1.3, .025, CND, 4.75, 1.42, -12.92);
    const dust = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 10.5), new THREE.MeshStandardMaterial({ transparent: true, depthWrite: false, roughness: 1, map: can(256, 512, (x, w, h) => { x.clearRect(0, 0, w, h);
      for (let i = 0; i < 220; i++) { const cx = wr() * w, cy = wr() * h, r = wf(6, 30), gr = x.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, `rgba(${wr() < .7 ? '214,180,128' : '120,110,96'},${wf(.15, .4)})`); gr.addColorStop(1, 'rgba(214,180,128,0)'); x.fillStyle = gr; x.fillRect(cx - r, cy - r, 2 * r, 2 * r); }
      for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(225,195,140,${wf(.2, .6)})`; x.fillRect(wr() * w, wr() * h, 1, 1); } }) }));
    dust.rotation.x = -Math.PI / 2; dust.position.set(3.2, .004, -7.7); g.add(dust);
    T(g, 'Workshop lights + sockets', 'Fluorescent strip lights on the ceilings, white conduit and double sockets along the benches, a switch by the door; sawdust on the floor.', '', 'not sure').userData.noPick = true; }
  // --- 9b. W5b (23 Oct): signs and notices on the bare walls (the scan can't read anything this small: typical workshop kit, NOT SURE)
  { const g = grp(P), sg = (w, h, cw, ch, draw, x, y, z, ry) => { const m = box(g, w, h, .004, STD({ roughness: .45, map: can(cw, ch, draw) }), x, y, z, ry); return m; };
    const txt = (x, t, px, cx, cy, col = '#111') => { x.fillStyle = col; x.font = `bold ${px}px Arial`; x.textAlign = 'center'; x.fillText(t, cx, cy); };
    const blue = (pict, l1, l2) => (x, w, h) => { x.fillStyle = '#f7f6f2'; x.fillRect(0, 0, w, h); x.fillStyle = '#1f5fae'; x.beginPath(); x.arc(w / 2, 62, 50, 0, 7); x.fill(); x.strokeStyle = x.fillStyle = '#fff'; x.lineWidth = 6; pict(x, w / 2, 62); txt(x, l1, 15, w / 2, 138); txt(x, l2, 15, w / 2, 156); x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 2; x.strokeRect(1, 1, w - 2, h - 2); };
    const goggles = (x, cx, cy) => { for (const s of [-1, 1]) { x.beginPath(); x.ellipse(cx + s * 17, cy, 14, 11, 0, 0, 7); x.stroke(); } x.beginPath(); x.moveTo(cx - 3, cy - 2); x.lineTo(cx + 3, cy - 2); x.stroke(); x.beginPath(); x.moveTo(cx - 31, cy); x.lineTo(cx - 42, cy - 6); x.moveTo(cx + 31, cy); x.lineTo(cx + 42, cy - 6); x.stroke(); };
    const ears = (x, cx, cy) => { x.beginPath(); x.arc(cx, cy + 4, 26, Math.PI * 1.08, Math.PI * 1.92); x.stroke(); for (const s of [-1, 1]) { x.beginPath(); x.ellipse(cx + s * 26, cy + 12, 9, 15, 0, 0, 7); x.fill(); } };
    // far wall, above the tool-wall shelf: eye and ear protection; over the doorway: no smoking
    sg(.2, .27, 120, 164, blue(goggles, 'EYE PROTECTION', 'MUST BE WORN'), 2.55, 2.68, -12.896, 0);
    sg(.2, .27, 120, 164, blue(ears, 'EAR PROTECTION', 'MUST BE WORN'), 2.82, 2.68, -12.896, 0);
    sg(.3, .2, 180, 120, (x, w, h) => { x.fillStyle = '#f7f6f2'; x.fillRect(0, 0, w, h); x.strokeStyle = '#d0201a'; x.lineWidth = 8; x.beginPath(); x.arc(46, 60, 36, 0, 7); x.stroke(); x.fillStyle = '#222'; x.fillRect(22, 56, 40, 9); x.fillStyle = '#d0201a'; x.fillRect(62, 56, 7, 9); x.strokeStyle = '#d0201a'; x.beginPath(); x.moveTo(21, 35); x.lineTo(71, 85); x.stroke(); txt(x, 'NO', 22, 132, 56); txt(x, 'SMOKING', 18, 132, 80); }, 5.4, 2.25, -12.896, 0);
    // front wall, the bare OSB over the front bench: a whiteboard of jobs, a calendar, a printed notice taped up
    const wb = grp(g, 3.75, 1.45, -2.492, Math.PI); box(wb, 1.2, .8, .02, STD({ color: 0xb9bcbf, metalness: .5, roughness: .4 }), 0, 0, 0);
    box(wb, 1.16, .76, .004, STD({ roughness: .25, map: can(464, 304, (x, w, h) => { x.fillStyle = '#f4f5f3'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 7; i++) { const cx = vf(0, w), cy = vf(0, h), r = vf(30, 90), gr = x.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, 'rgba(150,160,175,.12)'); gr.addColorStop(1, 'rgba(150,160,175,0)'); x.fillStyle = gr; x.fillRect(cx - r, cy - r, 2 * r, 2 * r); }   // ghosts of old writing
      x.font = 'bold 30px "Comic Sans MS", "Marker Felt", cursive'; x.fillStyle = '#1b3f8a'; x.fillText('JOBS', 18, 40); x.fillRect(18, 46, 70, 3);
      x.lineCap = 'round'; for (let r = 0; r < 7; r++) { const y = 82 + r * 31, col = r === 3 ? '#b3261e' : r === 6 ? '#1d6b35' : '#1b2030'; x.strokeStyle = col; x.lineWidth = 2.6;   // scribbled lines of a list, not real words
        x.beginPath(); x.arc(26, y - 6, 4, 0, 7); x.stroke(); let px = 40; x.beginPath(); x.moveTo(px, y); const L = vf(160, 360); while (px < 40 + L) { const step = vf(5, 11); x.quadraticCurveTo(px + step / 2, y - vf(4, 14), px + step, y + vf(-2, 2)); px += step; if (vr() < .12) { px += vf(6, 12); x.moveTo(px, y); } } x.stroke();
        if (r < 3) { x.strokeStyle = '#1b2030'; x.beginPath(); x.moveTo(36, y - 5); x.lineTo(36 + L * .9, y - 7); x.stroke(); } }   // three jobs crossed off
      x.fillStyle = '#d0201a'; x.beginPath(); x.arc(420, 30, 9, 0, 7); x.fill(); x.fillStyle = '#1f5fae'; x.beginPath(); x.arc(392, 30, 9, 0, 7); x.fill(); }) }), 0, .02, .011);
    box(wb, .5, .03, .05, STD({ color: 0xb9bcbf, metalness: .5, roughness: .4 }), .2, -.03, .03); for (const [dx, c] of [[.05, 0x1b3f8a], [.15, 0xb3261e], [.25, 0x1b1c1e]]) cyl(wb, .009, .13, STD({ color: c, roughness: .4 }), dx, .0, .035, 'x', 8);
    const cal = grp(g, 4.75, 1.4, -2.49, Math.PI); box(cal, .3, .42, .003, STD({ roughness: .7, map: can(150, 210, (x, w, h) => { x.fillStyle = '#fbfaf6'; x.fillRect(0, 0, w, h); x.fillStyle = '#4c7a9a'; x.fillRect(0, 0, w, 92); x.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(vf(0, w), 92); x.lineTo(vf(0, w), vf(10, 60)); x.lineTo(vf(0, w), 92); x.fill(); }   // a picture, then the month grid
      txt(x, 'OCTOBER', 13, w / 2, 110, '#222'); x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 1; for (let i = 0; i <= 7; i++) { x.beginPath(); x.moveTo(8 + i * 19.1, 118); x.lineTo(8 + i * 19.1, 202); x.stroke(); } for (let j = 0; j <= 5; j++) { x.beginPath(); x.moveTo(8, 118 + j * 16.8); x.lineTo(142, 118 + j * 16.8); x.stroke(); }
      x.strokeStyle = '#b3261e'; x.lineWidth = 1.6; for (let k = 0; k < 22; k++) { const i = k % 7, j = Math.floor(k / 7); x.beginPath(); x.moveTo(10 + i * 19.1, 120 + j * 16.8); x.lineTo(24 + i * 19.1, 132 + j * 16.8); x.stroke(); } }) }), 0, 0, 0);   // days crossed off
    cyl(cal, .004, .02, STEEL, 0, .43, .005, 'z', 6);
    const nt = grp(g, 5.3, 1.58, -2.488, Math.PI); box(nt, .21, .297, .002, STD({ roughness: .8, map: can(105, 148, (x, w, h) => { x.fillStyle = '#fdfdfb'; x.fillRect(0, 0, w, h); txt(x, 'PLEASE', 12, w / 2, 22); txt(x, 'TIDY UP', 15, w / 2, 40); txt(x, 'AS YOU GO', 12, w / 2, 56); x.fillStyle = '#555'; for (let i = 0; i < 6; i++) x.fillRect(14, 74 + i * 9, vf(50, 78), 2.5);
      x.fillStyle = 'rgba(240,235,200,.75)'; x.fillRect(w / 2 - 16, 0, 32, 9); x.fillRect(w / 2 - 16, h - 9, 32, 9); }) }), 0, 0, 0); nt.rotation.z = .03;   // taped top and bottom
    // aisle wall above the long bench, between the window and the shelves: a first-aid box
    const fa = grp(g, 5.86, 1.5, -6.3, -Math.PI / 2); box(fa, .34, .26, .11, STD({ color: 0x1d8a4a, roughness: .4 }), 0, 0, 0);
    box(fa, .2, .2, .003, STD({ roughness: .4, transparent: true, map: can(64, 64, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = '#fff'; x.fillRect(24, 8, 16, 48); x.fillRect(8, 24, 48, 16); }) }), 0, .03, .056); box(fa, .1, .015, .02, STD({ color: 0xeeeeee }), 0, .22, .06);
    T(g, 'Signs + notices', 'Safety signs (eye and ear protection, no smoking), a whiteboard of jobs, a calendar, a tidy-up notice and a first-aid box. The scan can\'t read anything this small, so these are typical workshop kit, placed on the bare walls.', 'A4 and smaller', 'not sure'); }
  // --- 9c. W5b (23 Oct): light from the front window. The window looks out into the lit hall: a soft patch of light slanting down onto the
  //     bench top under it and across the floor towards the centre table, broken by the glazing bar. (A see-through light shaft was tried: from near the window it read as a glass panel, so it's out.)
  { const g = grp(P), WL = { x: 5.945, y0: 1.2, y1: 2.6, z0: -5.3, z1: -2.9 }, TAN = .7;   // light drops 0.7 m per metre in from the window (≈ 35°)
    const add = (w, h, cw, ch, draw, x, y, z, op = 1) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: can(cw, ch, draw), transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -4 }));
      m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.renderOrder = 2; g.add(m); return m; };
    // floor: x where a ray through window height hh lands; canvas u = x, row 0 = the low-z edge (a −π/2 plane puts canvas row 0 at −z)
    { const X0 = 1.9, X1 = 4.6, Z0 = -5.6, Z1 = -2.8, S = 40, small = document.createElement('canvas'); small.width = Math.ceil((X1 - X0) * S / 4); small.height = Math.ceil((Z1 - Z0) * S / 4);
      const sx = small.getContext('2d'), k = S / 4, xa = WL.x - WL.y1 / TAN, xb = WL.x - WL.y0 / TAN;
      const gr = sx.createLinearGradient((xa - X0) * k, 0, (xb - X0) * k, 0); gr.addColorStop(0, 'rgba(255,244,226,.30)'); gr.addColorStop(1, 'rgba(255,244,226,.62)'); sx.fillStyle = gr;
      sx.fillRect((xa - X0) * k, (WL.z0 - Z0) * k, (xb - xa) * k, (-3.09 - WL.z0) * k);   // the front bench's top shades the strip nearest the front wall
      sx.globalCompositeOperation = 'destination-out'; sx.fillStyle = '#000'; sx.fillRect(0, (-4.15 - Z0) * k, small.width, .1 * k);   // the glazing bar
      sx.fillRect(0, 0, (2.45 - X0) * k, (-4.45 - Z0) * k);   // the centre table's top shades the far corner of the patch
      add(X1 - X0, Z1 - Z0, Math.ceil((X1 - X0) * S), Math.ceil((Z1 - Z0) * S), (x, w, h) => { x.imageSmoothingQuality = 'high'; x.drawImage(small, 0, 0, w, h); }, (X0 + X1) / 2, .008, (Z0 + Z1) / 2, .55); }
    // the long bench's top right under the window catches the low slice
    add(.36, 2.3, 18, 115, (x, w, h) => { const gr = x.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,244,226,0)'); gr.addColorStop(.35, 'rgba(255,244,226,.5)'); gr.addColorStop(1, 'rgba(255,244,226,.7)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); x.clearRect(0, 58, w, 4); }, 5.47, .953, -4.16, .5);
    g.traverse(o => { o.userData.noAO = true; }); T(g, 'Window light', 'Light from the hall coming in through the front window: a soft patch on the bench and the floor.', '', 'not sure').userData.noPick = true; }
  // --- 10. W5 (22 Oct): soft contact shadows on the workshop floor. Every mesh that reaches within 30 cm of the floor darkens its footprint,
  //     the darker the lower it sits (legs, bins, cupboards, the wall foot), blurred in JS on a small canvas (no ctx.filter: slow under SwiftShader).
  { const X0 = .45, X1 = 5.96, Z0 = -12.95, Z1 = -2.48, PPM = 28, W = Math.ceil((X1 - X0) * PPM), H = Math.ceil((Z1 - Z0) * PPM), A = new Float32Array(W * H).fill(.18), bb = new THREE.Box3();
    P.updateMatrixWorld(true);
    for (const top of P.children.slice(n0)) top.traverse(o => { if (!o.isMesh || o.material.transparent || o.isLight) return; bb.setFromObject(o);
      if (bb.min.y > .3 || bb.max.y - bb.min.y < .01 || bb.max.x < X0 || bb.min.x > X1 || bb.max.z < Z0 || bb.min.z > Z1) return;
      const k = Math.pow(1 - Math.max(0, bb.min.y) / .3, 2) * (bb.max.y - bb.min.y > .25 ? .72 : .4), pad = .05;
      const i0 = Math.max(0, Math.floor((bb.min.x - pad - X0) * PPM)), i1 = Math.min(W - 1, Math.ceil((bb.max.x + pad - X0) * PPM)), j0 = Math.max(0, Math.floor((bb.min.z - pad - Z0) * PPM)), j1 = Math.min(H - 1, Math.ceil((bb.max.z + pad - Z0) * PPM));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) A[j * W + i] = 1 - (1 - A[j * W + i]) * (1 - k); });
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const d = Math.min((i + .5) / PPM, (W - i - .5) / PPM, (j + .5) / PPM, (H - j - .5) / PPM); if (d < .35) A[j * W + i] = 1 - (1 - A[j * W + i]) * (1 - .5 * Math.pow(1 - d / .35, 2)); }   // the wall foot
    const B = new Float32Array(W * H); for (let pass = 0; pass < 3; pass++) { for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { let t = 0, n = 0; for (let d = -2; d <= 2; d++) { const ii = i + d; if (ii >= 0 && ii < W) { t += A[j * W + ii]; n++; } } B[j * W + i] = t / n; }
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { let t = 0, n = 0; for (let d = -2; d <= 2; d++) { const jj = j + d; if (jj >= 0 && jj < H) { t += B[jj * W + i]; n++; } } A[j * W + i] = t / n; } }
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), im = x.createImageData(W, H);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const q = (j * W + i) * 4; im.data[q] = 22; im.data[q + 1] = 16; im.data[q + 2] = 10; im.data[q + 3] = Math.min(255, A[j * W + i] * 255); }   // W5b: canvas row 0 = the FAR end (z0): a −π/2 plane puts canvas row 0 at −z (it was flipped, so every floor shadow sat mirrored about the room's middle)
    x.putImageData(im, 0, 0); const tx = new CT(c); tx.colorSpace = THREE.SRGBColorSpace;
    const cs = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0), new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    cs.rotation.x = -Math.PI / 2; cs.position.set((X0 + X1) / 2, .006, (Z0 + Z1) / 2); cs.renderOrder = 1; P.add(cs); }
  // --- 10b. W5b (23 Oct): contact shadows on bench tops and shelves. Each worktop or shelf board gets its own small baked shadow sheet:
  //     everything resting on it (within 10 cm) darkens its footprint, the closer the darker, blurred in JS. Same maths as the floor bake.
  { P.updateMatrixWorld(true); const surf = [], items = [], bb = new THREE.Box3();
    for (const top of P.children.slice(n0)) top.traverse(o => { if (!o.isMesh || o.material.transparent) return; const b = bb.setFromObject(o).clone();
      if ((o.material === TOP || o.material === CHIP) && b.max.y - b.min.y < .05 && b.max.x - b.min.x > .25 && b.max.z - b.min.z > .2) surf.push(b); else if (b.max.y - b.min.y > .004) items.push(b); });
    const SM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    for (const sf of surf) { const y = sf.max.y, PPM = 60, W = Math.max(2, Math.ceil((sf.max.x - sf.min.x) * PPM)), H = Math.max(2, Math.ceil((sf.max.z - sf.min.z) * PPM)), A = new Float32Array(W * H); let hit = 0;
      for (const b of items) { const gap = b.min.y - y; if (gap < -.012 || gap > .1 || b.max.y < y + .01 || b.max.x < sf.min.x || b.min.x > sf.max.x || b.max.z < sf.min.z || b.min.z > sf.max.z) continue;
        const k = Math.pow(1 - Math.max(0, gap) / .1, 2) * (b.max.y - b.min.y > .08 ? .78 : .5), pad = .03; hit++;
        const i0 = Math.max(0, Math.floor((b.min.x - pad - sf.min.x) * PPM)), i1 = Math.min(W - 1, Math.ceil((b.max.x + pad - sf.min.x) * PPM)), j0 = Math.max(0, Math.floor((b.min.z - pad - sf.min.z) * PPM)), j1 = Math.min(H - 1, Math.ceil((b.max.z + pad - sf.min.z) * PPM));
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) A[j * W + i] = 1 - (1 - A[j * W + i]) * (1 - k); }
      if (!hit) continue;
      const B = new Float32Array(W * H); for (let pass = 0; pass < 2; pass++) { for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { let t = 0, n = 0; for (let d = -2; d <= 2; d++) { const ii = i + d; if (ii >= 0 && ii < W) { t += A[j * W + ii]; n++; } } B[j * W + i] = t / n; }
        for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { let t = 0, n = 0; for (let d = -2; d <= 2; d++) { const jj = j + d; if (jj >= 0 && jj < H) { t += B[jj * W + i]; n++; } } A[j * W + i] = t / n; } }
      const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), im = x.createImageData(W, H);
      for (let q = 0; q < W * H; q++) { im.data[q * 4] = 20; im.data[q * 4 + 1] = 14; im.data[q * 4 + 2] = 8; im.data[q * 4 + 3] = Math.min(255, A[q] * 255); }   // row 0 = low z, as the floor bake
      x.putImageData(im, 0, 0); const m = SM.clone(); m.map = new CT(c); m.map.colorSpace = THREE.SRGBColorSpace;
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(sf.max.x - sf.min.x, sf.max.z - sf.min.z), m); pl.rotation.x = -Math.PI / 2; pl.position.set((sf.min.x + sf.max.x) / 2, y + .002, (sf.min.z + sf.max.z) / 2); pl.renderOrder = 1; P.add(pl); } }
  // --- W5 (22 Oct): sawdust heaped under the mitre-saw bench and the vice, and swept against the wall foot (own RNG)
  { const SD = STD({ color: 0xd2b07a, roughness: 1 }), heap = (x, z, r, h) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), SD); m.scale.set(r * qf(.8, 1.2), h, r * qf(.8, 1.2)); m.position.set(x, 0, z); m.rotation.y = qf(0, 6); m.receiveShadow = true; P.add(m); };
    for (let i = 0; i < 7; i++) heap(3.1 + qf(-.5, .5), -6.75 + qf(-.25, .25), qf(.08, .22), qf(.012, .035));   // under the mitre saw
    for (let i = 0; i < 4; i++) heap(.95 + qf(-.2, .3), -3.55 + qf(-.3, .3), qf(.06, .15), qf(.01, .025));     // under the vice
    for (let i = 0; i < 6; i++) heap(qf(.6, .75), qf(-6, -10.5), qf(.1, .25), qf(.01, .03)); }                 // swept up against the left wall
}

// ---------------- bake: merge each item's static meshes by material (far fewer draw calls) ----------------
function bake(root) {
  const merge = THREE_ADDONS.mergeGeometries; let before = 0, after = 0;
  for (const item of INFO) { if (item.userData.noPick) continue; const buckets = new Map(), kill = []; item.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(item.matrixWorld).invert();
    item.traverse(o => { if (o === item) return; if (o.userData.keep || o.userData.lift) { o.traverse(c => { c.userData._skip = true; }); return; } });
    item.traverse(o => { if (!o.isMesh || o.isInstancedMesh || o.userData._skip || Array.isArray(o.material) || o.material.wireframe || o.material.transparent) return; before++;
      const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
      for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k); if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
      (buckets.get(o.material) || buckets.set(o.material, []).get(o.material)).push(geo); kill.push(o); });
    for (const o of kill) o.parent.remove(o);
    for (const [mat, geos] of buckets) { const g = merge(geos, false); if (!g) continue; const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; item.add(m); after++; } }
  return [before, after];
}
// W5 lighting (23 Oct 02:xx): the workshop is a closed OSB box, but the hall's sky fill, room-environment light and its high-bay / door spots
// (no shadows) lit it straight through its walls and ceiling, so the room came out evenly over-lit and every baked shadow read faint.
// Every lit material gets a world-position gate: a fragment inside the workshop box keeps a little of the hall's fill and spill and the
// full light of the lamps hung inside it; outside, nothing changes. One function, patched once after bake(), no new render pass.
const WS_BOX = [.38, 6.02, -12.98, -2.42, 3.9], WS_FILL = .3, WS_IBL = .35, WS_SPILL = .08;
function wsLightGate(root) {
  const head = `mat4 wsInvV; float wsFrag;
float wsIn(vec3 w) { return step(${WS_BOX[0]}, w.x) * step(w.x, ${WS_BOX[1]}) * step(${WS_BOX[2]}, w.z) * step(w.z, ${WS_BOX[3]}) * step(w.y, ${WS_BOX[4]}); }
float wsG(vec3 lv) { return mix(1., mix(${WS_SPILL.toFixed(3)}, 1., wsIn((wsInvV * vec4(lv, 1.)).xyz)), wsFrag); }
`;
  const done = new Set();
  root.traverse(o => { for (const m of [].concat(o.material || [])) { if (!m || done.has(m) || !(m.isMeshStandardMaterial || m.isMeshPhysicalMaterial || m.isMeshLambertMaterial || m.isMeshPhongMaterial)) continue; done.add(m);
    const prev = m.onBeforeCompile, prevKey = m.customProgramCacheKey;
    m.onBeforeCompile = (sh, r) => { if (prev) prev.call(m, sh, r); let f = sh.fragmentShader; if (!f.includes('#include <lights_fragment_begin>')) return;
      f = f.replace('#include <common>', '#include <common>\n' + head)
        .replace('#include <lights_fragment_begin>', 'wsInvV = inverse(viewMatrix); wsFrag = wsIn((wsInvV * vec4(-vViewPosition, 1.)).xyz);\n' + THREE.ShaderChunk.lights_fragment_begin
          .replace('getPointLightInfo( pointLight, geometryPosition, directLight );', 'getPointLightInfo( pointLight, geometryPosition, directLight ); directLight.color *= wsG( pointLight.position );')
          .replace('getSpotLightInfo( spotLight, geometryPosition, directLight );', 'getSpotLightInfo( spotLight, geometryPosition, directLight ); directLight.color *= wsG( spotLight.position );')
          .replace('irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );', `irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal ) * mix(1., ${WS_FILL.toFixed(3)}, wsFrag);`))
        .replace('#include <lights_fragment_end>', `#if defined( RE_IndirectDiffuse )\n iblIrradiance *= mix(1., ${WS_IBL.toFixed(3)}, wsFrag);\n#endif\n#if defined( RE_IndirectSpecular )\n radiance *= mix(1., ${WS_IBL.toFixed(3)}, wsFrag);\n#endif\n#include <lights_fragment_end>`);
      sh.fragmentShader = f; };
    m.customProgramCacheKey = () => (prevKey ? prevKey.call(m) : '') + '|wsGate'; m.needsUpdate = true; } });
  return done.size;
}
