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
// 29 Oct 05:xx (03:xx review: "blown point-light glare on the window frame and the glass"): scale a material's DIRECT specular only (lamp and
// spot highlights), leaving its env reflection and diffuse alone. Roughness can't do it (.04 → .14 spread the dot into a bigger bloom, 29 Oct 02:xx).
// Chains any onBeforeCompile already set; wsLightGate() later chains on top of this and still finds its own include.
const dimSpec = (m, k) => { const prev = m.onBeforeCompile, pk = m.customProgramCacheKey;
  m.onBeforeCompile = (sh, r) => { if (prev) prev.call(m, sh, r); sh.fragmentShader = sh.fragmentShader.replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\nreflectedLight.directSpecular *= ' + k.toFixed(3) + ';'); };
  m.customProgramCacheKey = () => (pk ? pk.call(m) : '') + '|ds' + k; return m; };
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
  // 28 Oct 01:xx: the old aggregate (18000 cream/grey/brown flecks up to 5 mm) read as terrazzo up close (07:xx review). Power-floated
  // concrete shows almost no stone: a fine low-contrast cement-paste grain, a few sand fines, faint darker fines. Own RNG; the old
  // loop's 7 draws × 18000 are still eaten so the lanes, oil and joints below don't move.
  for (let i = 0; i < 126000; i++) fr();
  { let sa = 7781; const ar = () => (sa = (sa * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 90000; i++) { const v = ar() < .5 ? 255 : 60; d.fillStyle = `rgba(${v},${v - (v > 128 ? 4 : 2)},${v - (v > 128 ? 12 : 6)},${.025 + ar() * .045})`; d.fillRect(ar() * 1024, ar() * 1024, 1, 1); }   // paste grain, 2 mm
    for (let i = 0; i < 26; i++) { const g = d.createRadialGradient(0, 0, 0, 0, 0, 1); d.save(); d.translate(ar() * 1024, ar() * 1024); d.rotate(ar() * 6); d.scale(40 + ar() * 90, 30 + ar() * 70);   // 10–40 cm blotches of paste tone
      const c = ar() < .5 ? '250,246,236' : '112,108,98'; g.addColorStop(0, `rgba(${c},${.035 + ar() * .035})`); g.addColorStop(1, `rgba(${c},0)`); d.fillStyle = g; d.beginPath(); d.arc(0, 0, 1, 0, 7); d.fill(); d.restore(); }
    for (let i = 0; i < 2200; i++) { const k = ar(); d.fillStyle = k < .6 ? `rgba(120,116,106,${.07 + ar() * .08})` : `rgba(206,202,190,${.06 + ar() * .07})`; d.beginPath(); d.arc(ar() * 1024, ar() * 1024, .6 + ar() * .9, 0, 7); d.fill(); } }   // sand fines, ≤ 3 mm, close to the paste tone
  const [bc, b] = can(512, 512); b.fillStyle = '#808080'; b.fillRect(0, 0, 512, 512);                          // bump: pin-hole pores and tiny pits
  for (let i = 0; i < 2600; i++) { const r = .6 + fr() * 1.4, x = fr() * 512, y = fr() * 512; b.fillStyle = `rgba(20,20,20,${.5 + fr() * .5})`; b.beginPath(); b.arc(x, y, r, 0, 7); b.fill(); d.fillStyle = 'rgba(84,80,72,.17)'; d.beginPath(); d.arc(x * 2, y * 2, r * 1.15, 0, 7); d.fill(); }
  for (let i = 0; i < 9000; i++) { b.fillStyle = `rgba(${fr() < .5 ? '255,255,255' : '0,0,0'},.12)`; b.fillRect(fr() * 512, fr() * 512, 1 + fr() * 2, 1 + fr() * 2); }
  const rep = t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(HW / 2, HL / 2); t.anisotropy = 8; return t; };
  const map = rep(new THREE.CanvasTexture(dc)); map.colorSpace = THREE.SRGBColorSpace; const bump = rep(new THREE.CanvasTexture(bc));
  // --- wear layer over the whole floor: rgb = colour multiplier (128 = no change), separate roughness canvas (255 = .92)
  const W = 2048, H = 4096, sx = W / HW, sz = H / HL, P = (x, z) => [x * sx, (HL + z) * sz];
  const [wc, w] = can(W, H), [rc, r] = can(W, H); w.fillStyle = 'rgb(128,128,128)'; w.fillRect(0, 0, W, H); r.fillStyle = '#fff'; r.fillRect(0, 0, W, H);
  const blob = (ctx, x, z, rx, rz, col, a, rot = 0) => { const [px, py] = P(x, z); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(.6, `rgba(${col},${a * .55})`); g.addColorStop(1, `rgba(${col},0)`);
    ctx.save(); ctx.translate(px, py); ctx.rotate(rot); ctx.scale(rx * sx, rz * sz); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fill(); ctx.restore(); };
  // 28 Oct 01:xx: slab-scale variation (07:xx review: no slab-to-slab change). Each pour between the saw cuts gets its own
  // tone (±3 %) and a soft diagonal drift, and a darker, grubbier 10–20 cm band along its edges where dirt packs against
  // the joint. Drawn under the mottling. Own RNG so the lanes, oil and joints below don't move.
  { let sb = 5309; const br = () => (sb = (sb * 16807) % 2147483647) / 2147483647;
    for (let z0 = 0; z0 > -HL + .01; z0 -= BAY) for (const [x0, x1] of [[0, HW / 2], [HW / 2, HW]]) { const z1 = Math.max(z0 - BAY, -HL);
      const [ax, ay] = P(x0, z0), [bx, by] = P(x1, z1), tone = Math.round(128 + (br() - .5) * 8);
      w.fillStyle = `rgb(${tone},${tone},${tone - 1})`; w.fillRect(ax, by, bx - ax, ay - by);
      const g = w.createLinearGradient(ax, ay, bx, by), d2 = Math.round((br() - .5) * 6); g.addColorStop(0, `rgba(${128 + d2},${128 + d2},${128 + d2},.5)`); g.addColorStop(1, `rgba(${128 - d2},${128 - d2},${128 - d2},.5)`); w.fillStyle = g; w.fillRect(ax, by, bx - ax, ay - by);
      const e = (.1 + br() * .1) * sx; for (const [rx, ry, rw, rh, gx0, gy0, gx1, gy1] of [[ax, by, bx - ax, e, 0, by, 0, by + e], [ax, ay - e, bx - ax, e, 0, ay, 0, ay - e], [ax, by, e, ay - by, ax, 0, ax + e, 0], [bx - e, by, e, ay - by, bx, 0, bx - e, 0]]) {
        const gg = w.createLinearGradient(gx0, gy0, gx1, gy1); gg.addColorStop(0, 'rgba(112,108,100,.45)'); gg.addColorStop(1, 'rgba(112,108,100,0)'); w.fillStyle = gg; w.fillRect(rx, ry, rw, rh); } } }
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
  // Y4 (3 Nov): the yard's low-shelf fluids (model.js: lantern, oil, spray and other bottles), which the WW never had: a galvanised storm lantern, engine oil, an aerosol, a green bottle and a trigger spray, stood on a tote lid. Own materials, no draws from fr(), so nothing else moves.
  let FLM = null;
  function fluids(p, x, y, z, ry = 0) {
    if (!FLM) { const label = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
      const shadow = label(64, 64, (x, w) => { const g = x.createRadialGradient(w / 2, w / 2, w * .1, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(0,0,0,.62)'); g.addColorStop(.55, 'rgba(0,0,0,.3)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); });
      const galv = label(128, 128, (x, w) => { x.fillStyle = '#9ea3a3'; x.fillRect(0, 0, w, w); let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(${r() < .5 ? '225,228,226' : '92,96,96'},${.08 + r() * .14})`; x.beginPath(); x.ellipse(r() * w, r() * w, 3 + r() * 9, 2 + r() * 6, r() * 3, 0, 7); x.fill(); } for (let i = 0; i < 26; i++) { x.fillStyle = `rgba(122,74,38,${.14 + r() * .3})`; x.beginPath(); x.arc(r() * w, w * (.6 + r() * .4), .7 + r() * 2.2, 0, 7); x.fill(); } });
      const oilL = label(256, 320, (x, w, h) => { x.fillStyle = '#e9b81f'; x.fillRect(0, 0, w, h); x.fillStyle = '#17181a'; x.fillRect(0, 0, w, 96); x.fillStyle = '#f4f1e6'; x.font = 'bold 54px Arial'; x.textAlign = 'center'; x.fillText('ENGINE', w / 2, 66); x.fillStyle = '#17181a'; x.font = 'bold 76px Arial'; x.fillText('OIL', w / 2, 178); x.font = 'bold 42px Arial'; x.fillText('10W-40', w / 2, 236); x.font = '24px Arial'; x.fillText('SEMI SYNTHETIC', w / 2, 272); x.fillText('1 LITRE', w / 2, 302); });
      const aero = label(256, 256, (x, w, h) => { x.fillStyle = '#f0c61c'; x.fillRect(0, 0, w, h); x.fillStyle = '#1e2124'; x.fillRect(0, 150, w, 56); x.fillStyle = '#f0c61c'; x.font = 'bold 32px Arial'; x.textAlign = 'center'; for (const u of [.25, .75]) x.fillText('SILICONE', w * u, 190); x.fillStyle = '#1e2124'; x.font = 'bold 26px Arial'; for (const u of [.25, .75]) x.fillText('SPRAY', w * u, 120); });
      const wash = label(512, 150, (x, w, h) => { x.fillStyle = '#ece6d4'; x.fillRect(0, 0, w, h); x.fillStyle = '#2f7a4a'; x.fillRect(0, 0, w, 26); x.fillRect(0, h - 20, w, 20); x.font = 'bold 50px Arial'; x.textAlign = 'center'; x.fillStyle = '#1f3b2b'; for (const u of [.25, .75]) x.fillText('WASH', w * u, 84); x.font = '26px Arial'; for (const u of [.25, .75]) x.fillText('concentrate', w * u, 116); });
      const clean = label(256, 256, (x, w, h) => { x.fillStyle = '#f2f3f1'; x.fillRect(0, 0, w, h); x.fillStyle = '#2b6fb3'; x.fillRect(0, 30, w, 34); x.font = 'bold 44px Arial'; x.textAlign = 'center'; x.fillStyle = '#23527f'; x.fillText('CLEANER', w / 2, 128); x.font = '26px Arial'; x.fillText('multi surface', w / 2, 168); x.strokeStyle = '#2b6fb3'; x.lineWidth = 5; x.strokeRect(36, 196, w - 72, 34); });
      FLM = { shadow: new THREE.MeshBasicMaterial({ map: shadow, transparent: true, depthWrite: false }), steel: STD({ map: galv, roughness: .46, metalness: .55, envMapIntensity: .7 }), wire: STD({ color: 0x6f7375, roughness: .5, metalness: .6 }), glass: STD({ color: 0xdfeaea, roughness: .12, transparent: true, opacity: .26, side: THREE.DoubleSide, depthWrite: false }), soot: STD({ color: 0x2b2926, roughness: .8 }),
        hdpe: STD({ color: 0x141517, roughness: .42 }), oilL: STD({ map: oilL, roughness: .5 }), yellow: STD({ color: 0xf0c61c, roughness: .34, metalness: .25 }), aero: STD({ map: aero, roughness: .34, metalness: .2 }), tin: STD({ color: 0xb5b8b8, roughness: .36, metalness: .6 }), red: STD({ color: 0xc23a2a, roughness: .4 }),
        green: STD({ color: 0x2f7a4a, roughness: .38 }), wash: STD({ map: wash, roughness: .55 }), black: STD({ color: 0x111214, roughness: .5 }), white: STD({ color: 0xf0f0ec, roughness: .4 }), clean: STD({ map: clean, roughness: .45 }), blue: STD({ color: 0x2b6fb3, roughness: .4 }) }; }
    const M = FLM, g = grp(p, x, y, z, ry), add = (ge, m, q = g, px = 0, py = 0, pz = 0) => { const o = new THREE.Mesh(ge, m); o.position.set(px, py, pz); o.castShadow = o.receiveShadow = true; q.add(o); return o; };
    const lathe = (pts, m, q, px, py, pz, seg = 30) => add(new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), seg), m, q, px, py, pz);
    const shell = (r, h, m, q, px, py, pz, thetaLen = Math.PI * 2, th0 = 0) => add(new THREE.CylinderGeometry(r, r, h, 30, 1, true, th0, thetaLen), m, q, px, py + h / 2, pz);
    const tube = (pts, r, m, q) => add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(a => new THREE.Vector3(...a))), 18, r, 6), m, q);
    const foot = (px, pz, r, sz = 1) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2 * sz), M.shadow); o.rotation.x = -Math.PI / 2; o.position.set(px, .0016, pz); g.add(o); };
    // storm lantern: pressed tank, burner, glass globe, two side tubes, cap, wire bail
    { const l = grp(g, -.172, 0, -.05, .5); foot(-.172, -.05, .082);
      lathe([[.001, 0], [.07, 0], [.076, .005], [.076, .03], [.07, .05], [.046, .064], [.03, .068], [.03, .08], [.001, .08]], M.steel, l); lathe([[.03, .078], [.038, .088], [.03, .1], [.001, .1]], M.wire, l);
      lathe([[.03, .098], [.05, .118], [.061, .145], [.06, .172], [.046, .2], [.03, .216], [.027, .226]], M.glass, l); add(new THREE.BoxGeometry(.02, .03, .003), M.soot, l, 0, .112, 0);
      lathe([[.024, .224], [.05, .23], [.055, .238], [.034, .254], [.016, .262], [.012, .272], [.001, .273]], M.steel, l);
      for (const sx of [-1, 1]) { tube([[sx * .074, .03, 0], [sx * .088, .1, 0], [sx * .082, .19, 0], [sx * .046, .238, 0]], .0052, M.steel, l); tube([[sx * .088, .19, 0], [sx * .07, .165, .03], [0, .158, .066]], .0014, M.wire, l); tube([[sx * .088, .19, 0], [sx * .07, .165, -.03], [0, .158, -.066]], .0014, M.wire, l); }
      add(new THREE.TorusGeometry(.064, .0016, 5, 40), M.wire, l, 0, .158, 0).rotation.x = Math.PI / 2; add(new THREE.TorusGeometry(.05, .0016, 5, 40), M.wire, l, 0, .122, 0).rotation.x = Math.PI / 2;
      add(new THREE.TorusGeometry(.086, .0021, 6, 26, Math.PI), M.wire, l, 0, .215, 0); const k = add(new THREE.CylinderGeometry(.009, .009, .012, 12), M.wire, l, 0, .086, .044); k.rotation.x = Math.PI / 2; const c = add(new THREE.CylinderGeometry(.014, .014, .012, 14), M.tin, l, .05, .068, 0); c.position.set(.05, .07, 0); }
    // engine oil: moulded black bottle with a through handle, off-centre neck, label on the front, yellow cap
    { const o = grp(g, -.065, 0, .075, -.22), w = .118, h = .205, s = new THREE.Shape(); foot(-.065, .075, .09, .7); s.moveTo(-w / 2 + .012, 0); s.lineTo(w / 2 - .012, 0); s.quadraticCurveTo(w / 2, 0, w / 2, .012); s.lineTo(w / 2, h - .05); s.quadraticCurveTo(w / 2, h - .02, w / 2 - .03, h - .02); s.lineTo(-.012, h - .02); s.lineTo(-.034, h - .002); s.lineTo(-w / 2 + .01, h - .002); s.quadraticCurveTo(-w / 2, h - .002, -w / 2, h - .014); s.lineTo(-w / 2, .012); s.quadraticCurveTo(-w / 2, 0, -w / 2 + .012, 0);
      const ho = new THREE.Path(); ho.moveTo(.02, h - .058); ho.lineTo(.04, h - .058); ho.quadraticCurveTo(.046, h - .058, .046, h - .064); ho.lineTo(.046, h - .1); ho.quadraticCurveTo(.046, h - .108, .04, h - .108); ho.lineTo(.02, h - .108); ho.quadraticCurveTo(.012, h - .108, .012, h - .1); ho.lineTo(.012, h - .064); ho.quadraticCurveTo(.012, h - .058, .02, h - .058); s.holes.push(ho);
      add(new THREE.ExtrudeGeometry(s, { depth: .05, bevelEnabled: true, bevelSize: .006, bevelThickness: .006, bevelSegments: 2, curveSegments: 8 }), M.hdpe, o, 0, 0, -.025); cyl(o, .018, .018, M.hdpe, -.034, h + .004, 0, 'y', 16); cyl(o, .021, .024, M.yellow, -.034, h + .022, 0, 'y', 18);
      const f = add(new THREE.PlaneGeometry(.098, .116), M.oilL, o, -.0005, .068, .0315); f.castShadow = false; }
    // aerosol: tin can, printed sleeve, shoulder, nozzle, red straw clipped to the side
    { const a = grp(g, .03, 0, -.03, .3); foot(.03, -.03, .06); lathe([[.001, .004], [.028, .002], [.0325, .007], [.0325, .172], [.03, .18], [.017, .196], [.0135, .198], [.0135, .204], [.001, .204]], M.tin, a); shell(.0332, .166, M.aero, a, 0, .007, 0, Math.PI * 2, -Math.PI / 2); lathe([[.012, .203], [.0125, .217], [.001, .218]], M.white, a); add(new THREE.BoxGeometry(.012, .006, .008), M.white, a, .009, .211, 0); const st = add(new THREE.CylinderGeometry(.0013, .0013, .12, 5), M.red, a, .036, .1, 0); st.rotation.z = .02; }
    // green bottle: shouldered, printed band, black cap
    { const b = grp(g, .1, 0, .09, .35); foot(.1, .09, .075); lathe([[.001, .002], [.048, .002], [.054, .008], [.054, .138], [.048, .158], [.03, .178], [.021, .186], [.021, .196], [.001, .196]], M.green, b); shell(.0548, .1, M.wash, b, 0, .02, 0, Math.PI * 2, -Math.PI / 2); lathe([[.0235, .194], [.0245, .222], [.02, .226], [.001, .226]], M.black, b, 0, 0, 0, 16); }
    // trigger spray: flattened white bottle, label, blue head, nozzle, trigger
    { const t = grp(g, .19, 0, -.03, -.45); foot(.19, -.03, .06, .8); const b = lathe([[.001, .002], [.04, .002], [.047, .008], [.047, .15], [.04, .17], [.022, .186], [.017, .19], [.017, .2], [.001, .2]], M.white, t); b.scale.z = .68; const ls = shell(.0478, .104, M.clean, t, 0, .03, 0, Math.PI * .9, -Math.PI * .45); ls.scale.z = .68;
      const s = new THREE.Shape([[-.024, 0], [.02, 0], [.022, .018], [.075, .026], [.078, .05], [.03, .056], [-.03, .05], [-.034, .03]].map(([a, b]) => new THREE.Vector2(a, b))); const h = grp(t, 0, .197, 0, -Math.PI / 2); add(new THREE.ExtrudeGeometry(s, { depth: .024, bevelEnabled: true, bevelSize: .002, bevelThickness: .002, bevelSegments: 1 }), M.blue, h, 0, 0, -.012); add(new THREE.CylinderGeometry(.0105, .009, .014, 12), M.black, h, .084, .038, 0).rotation.z = Math.PI / 2;
      const tr = new THREE.Shape([[.032, .016], [.046, .018], [.038, -.022], [.03, -.044], [.022, -.042], [.03, -.018]].map(([a, b]) => new THREE.Vector2(a, b))); add(new THREE.ExtrudeGeometry(tr, { depth: .014, bevelEnabled: false }), M.blue, h, 0, 0, -.007); }
    return g; }
  // Y4 part 2 (4 Nov): the yard's 'Tote bags and a crate' (model.js: two white carry bags, one on the other, a black stacking crate beside them). Own RNG, nothing else moves.
  // Bags: one soft skin, pinched in at the zip, sagged by the load on top, in white woven polypropylene with grey webbing handles and bound edges. Crate: moulded, tapered, open, ribbed, with hand slots in the ends.
  let CARRY = null;
  function carry(p, x, y, z) { let sc = 7211; const cr = () => (sc = (sc * 16807) % 2147483647) / 2147483647;
    if (!CARRY) { const [c, q] = can(512, 512); q.fillStyle = '#c9c7bf'; q.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 512; i += 4) { q.fillStyle = 'rgba(120,118,112,.13)'; q.fillRect(i, 0, 1.4, 512); q.fillRect(0, i, 512, 1.4); }   // woven tape
      for (let i = 0; i < 500; i++) { q.fillStyle = `rgba(${cr() > .5 ? '255,255,250' : '96,92,84'},${cr() * .05})`; q.fillRect(cr() * 512, cr() * 512, 2 + cr() * 24, 1 + cr() * 3); }
      for (let i = 0; i < 9; i++) { const yy = cr() * 512, xx = cr() * 300; q.strokeStyle = 'rgba(70,66,60,.06)'; q.lineCap = 'round'; q.lineWidth = 12 + cr() * 18; q.beginPath(); q.moveTo(xx, yy); q.quadraticCurveTo(xx + 90, yy + (cr() - .5) * 70, xx + 150 + cr() * 110, yy + (cr() - .5) * 60); q.stroke(); }   // handling creases
      const gr = q.createLinearGradient(0, 330, 0, 512); gr.addColorStop(0, 'rgba(84,76,64,0)'); gr.addColorStop(1, 'rgba(84,76,64,.28)'); q.fillStyle = gr; q.fillRect(0, 330, 512, 182);
      q.fillStyle = '#6d7276'; for (const u of [0, 496]) q.fillRect(u, 0, 16, 512); q.fillRect(0, 0, 512, 12); q.fillRect(0, 500, 512, 12); q.fillStyle = 'rgba(232,232,226,.7)'; for (let i = 0; i < 512; i += 12) { q.fillRect(6, i, 2, 7); q.fillRect(503, i, 2, 7); }   // bound edge, stitched
      const [c2, b] = can(128, 128); b.fillStyle = '#7f7f7f'; b.fillRect(0, 0, 128, 128); for (let i = 0; i < 128; i += 4) for (let j = 0; j < 128; j += 4) { b.fillStyle = (i + j) % 8 ? '#9a9a9a' : '#5e5e5e'; b.fillRect(i, j, 3, 3); } const bt = toTex(c2); bt.colorSpace = THREE.NoColorSpace; bt.wrapS = bt.wrapT = THREE.RepeatWrapping; bt.repeat.set(10, 10);
      const [c3, r] = can(256, 256); r.fillStyle = '#1f2123'; r.fillRect(0, 0, 256, 256); for (let i = 0; i < 2600; i++) { r.fillStyle = `rgba(${cr() > .5 ? '150,150,146' : '0,0,0'},${cr() * .09})`; r.fillRect(cr() * 256, cr() * 256, 1 + cr() * 2.5, 1 + cr() * 2.5); } for (let i = 0; i < 42; i++) { r.strokeStyle = `rgba(190,188,180,${.05 + cr() * .15})`; r.lineWidth = .6 + cr(); r.beginPath(); const a = cr() * 256, e = cr() * 256; r.moveTo(a, e); r.lineTo(a + (cr() - .5) * 70, e + (cr() - .5) * 26); r.stroke(); }
      const dg = r.createLinearGradient(0, 0, 0, 40); dg.addColorStop(0, 'rgba(176,170,158,.3)'); dg.addColorStop(1, 'rgba(176,170,158,0)'); r.fillStyle = dg; r.fillRect(0, 0, 256, 40);
      CARRY = { bag: STD({ map: toTex(c), roughness: .68, bumpMap: bt, bumpScale: .7 }), web: STD({ color: 0x5f6468, roughness: .85 }), plas: STD({ map: toTex(c3), roughness: .58 }), plain: STD({ color: 0x1b1d1f, roughness: .62 }), dark: STD({ color: 0x0b0c0d, roughness: .9 }), dust: STD({ color: 0x3e3d39, roughness: 1 }) }; }
    const M = CARRY, g = grp(p, x, y, z), soft = (w, h, d, sag, seed) => { const ge = new THREE.BoxGeometry(w, h, d, 18, 12, 14), P = ge.attributes.position; const ph = seed * 1.7;
      for (let i = 0; i < P.count; i++) { let px = P.getX(i), py = P.getY(i), pz = P.getZ(i); const u = px / (w / 2), v = pz / (d / 2), t = py / h + .5, mid = Math.sin(Math.PI * Math.min(1, t * 1.02)), bl = (1 - u * u * u * u) * (1 - v * v * v * v);
        px *= 1 + .1 * mid; pz *= 1 + .13 * mid - .12 * t * t * t; if (t > .84) pz *= 1 - (t - .84) * .9;   // bellied sides, shoulders pulled in to the zip
        py += (t > .5 ? (bl * .045 - sag * bl) * (t - .5) * 2 : 0) + (t < .5 ? (.5 - t) * 2 * bl * .012 : 0);   // domed or sat on
        px += Math.sin(py * 15 + ph) * .009 * mid + Math.sin(pz * 19 + ph * 2) * .006; pz += Math.sin(px * 13 + ph * 3) * .011 * mid + Math.sin(py * 21 + ph) * .006; py += Math.sin(px * 17 + ph) * Math.sin(pz * 11 + ph) * .009; P.setXYZ(i, px, py, pz); }
      ge.computeVertexNormals(); const m = new THREE.Mesh(ge, M.bag); m.castShadow = m.receiveShadow = true; return m; };
    const handles = (q, w, h, d) => { for (const sz of [-1, 1]) { const y0 = h * .5, pts = [[-.1, y0 - .065, sz * d * .53], [-.1, y0 - .012, sz * d * .47], [-.085, y0 + .03, sz * d * .36], [-.04, y0 + .05, sz * d * .2], [.04, y0 + .05, sz * d * .17], [.09, y0 + .032, sz * d * .32], [.1, y0 - .012, sz * d * .47], [.1, y0 - .065, sz * d * .53]].map(([a, b, c]) => new THREE.Vector3(a, b * 2.6, c)), tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, .017, 6); tg.scale(1, 1 / 2.6, 1); const t = new THREE.Mesh(tg, M.web); t.castShadow = true; q.add(t); } };   // flat webbing flopped over the top, not standing up
    for (const [yy, hh, sag, sd, ry, dx] of [[0, .3, .06, 2, -.05, 0], [.262, .3, -.01, 5, .1, .015]]) { const q = grp(g, dx, yy + hh / 2, 0, ry); q.add(soft(.32, hh, .45, sag, sd)); handles(q, .32, hh, .45); }
    const cg = grp(g, .385, 0, .02, -.06), W = .35, H = .55, D = .5, tp = 1.06;
    const shell = (r0, m, side) => { const ge = new THREE.CylinderGeometry(.5 * Math.SQRT2, .5 * Math.SQRT2 / tp, 1, 4, 1, true); ge.rotateY(Math.PI / 4); ge.computeVertexNormals(); const nn = ge.toNonIndexed(); nn.computeVertexNormals(); const o = new THREE.Mesh(nn, m); o.scale.set(W * r0 * tp / tp, H, D * r0); o.position.y = H / 2; o.castShadow = o.receiveShadow = true; o.material.side = side; cg.add(o); return o; };
    shell(1, M.plas, THREE.FrontSide); const inn = shell(.94, STD({ map: M.plas.map, roughness: .7, side: THREE.BackSide }), THREE.BackSide); inn.castShadow = false;
    box(cg, W * .84, .006, D * .84, M.dust, 0, .03, 0); for (const sx of [-1, 1]) { box(cg, .022, .03, D + .036, M.plain, sx * (W / 2 + .004), H - .032, 0); box(cg, .012, .018, D + .012, M.plain, sx * (W / 2 + .004), H - .1, 0); } for (const sz of [-1, 1]) { box(cg, W + .03, .03, .022, M.plain, 0, H - .032, sz * (D / 2 + .004)); box(cg, W + .012, .018, .012, M.plain, 0, H - .1, sz * (D / 2 + .004)); }   // rolled stacking rim, stacking ledge
    for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) { const zz = -D * .4 + i * D * .2, o = box(cg, .014, H - .19, .024, M.plain, sx * (W / 2 - .003), .05, zz); o.rotation.z = sx * .05; }   // long-side ribs
    for (let i = 0; i < 3; i++) for (const sz of [-1, 1]) { const o = box(cg, .024, H - .19, .014, M.plain, -W * .3 + i * W * .3, .05, sz * (D / 2 - .003)); o.rotation.x = -sz * .05; }
    for (const sz of [-1, 1]) box(cg, .14, .032, .006, M.dark, 0, H - .17, sz * (D / 2 + .008)); box(cg, W + .012, .05, D + .012, M.plain, 0, 0, 0);   // hand slots, foot
    return g; }
  function fill(g, cx, y, b, lv) {
    const S = SHEETS, items = [];
    const at = (o, name, what, size) => { items.push([o, name, what, size]); return o; };
    if (b === 0 && lv === 0) { at(foldStack(g, cx - .72, y, 0, 1.2, .95, 9, [S[0], S[2], S[3]]), 'Folded sheeting', 'Grey PVC sheeting folded and stacked (groundsheets or covers). The scan shows grey-white layers here.', '≈ 1.2 × 0.95 m · ~0.9 m tall');
      { const t = grp(g), j = grp(g); tote(t, cx + .45, y, .05, .6, .42, .4, 0x2c5fa0); tote(t, cx + .45, y + .42, .05, .6, .42, .4, 0x2c5fa0); jerry(j, cx + 1.02, y, .2, .1); jerry(j, cx + 1.02, y, -.2, -.05);   // Y3a (2 Nov): the yard's cards on what was untagged
        at(t, 'Storage boxes', 'Two blue ribbed stacking totes, one on the other: the yard\'s blue and black stacking boxes, as on the Yard in 3D page.', '≈ 0.6 × 0.4 m each'); at(j, 'Jerry cans', 'Two green pressed-steel jerry cans (fuel or water) standing on the bottom shelf: the yard\'s jerry cans, as on the Yard in 3D page\'s low shelf.', '≈ 20 L each'); } }
    else if (b === 0 && lv === 1) { at(foldStack(g, cx - .7, y, 0, 1.25, .95, 7, RUGM, [.08, .13]), 'Folded rugs', 'Woven rugs folded and stacked. The scan shows striped layers here.', '≈ 1.25 × 0.95 m'); cardBox(g, cx + .55, y, 0, .62, .48, .55); cardBox(g, cx + .55, y + .48, .02, .5, .36, .45); }
    else if (b === 0 && lv === 2) { for (const [dx, col] of [[-.85, 0xcbbd9c], [0, 0xd3c6a8], [.85, 0x9a9b97]]) at(duffle(g, cx + dx, y, 0, .85, .62, .9, col, 0x8ac43f), 'Bell tent bag', 'A packed bell tent in its bag on the top beam (grey and beige bags = bells). The scan shows pale bags here.', '≈ 0.85 × 0.9 m'); }
    else if (b === 1 && lv === 0) { at(foldStack(g, cx - .4, y, 0, 1.6, .98, 10, [S[0], S[1], S[4], S[2]], [.06, .1]), 'Folded sheeting', 'A tall stack of folded grey and white sheeting. The scan shows grey-white striped layers here.', '≈ 1.6 × 1.0 m · ~0.8 m tall'); jerry(g, cx + .82, y, .15, .2); jerry(g, cx + 1.0, y, .15, -.1); jerry(g, cx + .9, y, -.25, 0); }
    else if (b === 1 && lv === 1) { at(foldStack(g, cx - .6, y, 0, 1.4, .95, 8, RUGM, [.08, .13]), 'Folded rugs', 'Folded rugs in browns, maroons and cream. The scan shows brown and maroon stripes here.', '≈ 1.4 × 0.95 m'); cardBox(g, cx + .72, y, 0, .7, .5, .6); }
    else if (b === 1 && lv === 2) { at(duffle(g, cx - .7, y, 0, .9, .66, .9, 0x9a9b97, 0xd23b2b), 'Bell tent bag', 'Grey bell bag with a red tag (red = bad: needs a look).', '≈ 0.9 × 0.9 m'); duffle(g, cx + .2, y, 0, .8, .55, .85, 0xc8bb98, 0x8ac43f); cardBox(g, cx + .9, y, 0, .55, .45, .5); }
    else if (b === 4 && lv === 0) { at(reel(g, cx - .8, y, .05, .3, .38, 0xe8742a), 'Cable reel', 'Orange flex on a reel. The scan shows orange and yellow coils low in this bay.', '≈ 0.6 m reel'); reel(g, cx - .25, y, .05, .26, .34, 0xe3b11c);
      { const t = grp(g), j = grp(g); tote(t, cx + .45, y, .05, .6, .42, .4, 0x2c5fa0); jerry(j, cx + 1.0, y, .2, 0); jerry(j, cx + 1.0, y, -.2, .1); cardBox(t, cx + .45, y + .42, .05, .5, .32, .4);
        at(fluids(t, cx + .45, y + .74, .05), 'Fluids and a lantern', 'A galvanised storm lantern, engine oil, a can of silicone spray, a green bottle and a trigger spray stood on the box on the tote: the yard\'s lantern and bottles, as on the Yard in 3D page\'s low shelf. Too small for the scan to show, so this spot is a guess.', '≈ 0.2–0.27 m tall');
        at(t, 'Storage boxes', 'A blue ribbed stacking tote with a taped cardboard box on its lid: the yard\'s stacking boxes, as on the Yard in 3D page.', '≈ 0.6 × 0.4 m'); at(j, 'Jerry cans', 'Two green pressed-steel jerry cans (fuel or water) standing on the bottom shelf: the yard\'s jerry cans, as on the Yard in 3D page\'s low shelf.', '≈ 20 L each'); } }
    else if (b === 4 && lv === 1) { { const c = grp(g); cardBox(c, cx - .85, y, 0, .7, .55, .6); cardBox(c, cx - .85, y + .55, .02, .6, .4, .55); cardBox(c, cx - .12, y, 0, .6, .6, .6); at(c, 'Cardboard boxes', 'Three taped cardboard boxes with shipping labels, two stacked: the yard\'s cardboard boxes, as on the Yard in 3D page\'s shelves.', '≈ 0.6–0.7 m each'); } at(foldStack(g, cx + .75, y, 0, .95, .9, 6, RUGM, [.08, .12]), 'Folded rugs', 'A short stack of folded rugs.', '≈ 0.95 × 0.9 m'); }
    else if (b === 4 && lv === 2) { duffle(g, cx + .92, y, 0, .8, .55, .85, 0x9a9b97, 0x8ac43f); duffle(g, cx + .1, y, 0, .85, .6, .9, 0xcbbd9c, 0x8ac43f); at(carry(g, cx - 1.0, y, .03), 'Tote bags and a crate', 'Two white woven carry bags, one on the other, and a black stacking crate on the top level: the yard\'s, as on the Yard in 3D page. Too small for the scan to tell them apart: it only shows mixed pale and dark shapes on this level, so the spot is a guess.', '≈ 0.32 × 0.45 m · crate ≈ 0.35 × 0.5 m'); }
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
    else { if (b === 1) { at(duffle(g, cx - .55, y, .05, .85, .6, .85, 0x9a9b97, 0xd23b2b), 'Bell tent bag', 'A grey bell bag low down with a red tag (red = bad). The scan shows a grey bag here.', '≈ 0.85 × 0.85 m'); at(jerry(g, cx + .45, y, .2, .15), 'Jerry can', 'A green pressed-steel jerry can (fuel or water) beside the bag: one of the yard\'s jerry cans, as on the Yard in 3D page.', '≈ 20 L'); }
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
  let R = fr;                                                       // 28 Oct 03:xx: canvas draws go through R, so the inside sheets can draw on their own RNG
  const can = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  function strand(x, b, cx, cy, L, Wd, a, col, dark) {           // one flake: a wonky rotated rectangle with ragged ends
    x.save(); x.translate(cx, cy); x.rotate(a); x.beginPath();
    x.moveTo(-L / 2 + R() * 3, -Wd / 2); x.lineTo(L / 2 - R() * 4, -Wd / 2 + (R() - .5) * 2); x.lineTo(L / 2 + (R() - .5) * 5, 0); x.lineTo(L / 2 - R() * 4, Wd / 2); x.lineTo(-L / 2 + R() * 4, Wd / 2 + (R() - .5) * 2); x.lineTo(-L / 2 + (R() - .5) * 5, 0); x.closePath();
    x.fillStyle = col; x.fill(); x.strokeStyle = dark; x.lineWidth = .9; x.stroke();
    x.restore();
    b.save(); b.translate(cx / 2, cy / 2); b.rotate(a); const v = 120 + R() * 70 | 0; b.fillStyle = `rgb(${v},${v},${v})`; b.fillRect(-L / 4, -Wd / 4, L / 2, Wd / 2);
    b.strokeStyle = 'rgba(30,30,30,.7)'; b.lineWidth = .7; b.strokeRect(-L / 4, -Wd / 4, L / 2, Wd / 2); b.restore(); }
  function base(o = {}) {                                                // the strands: two of these, shared by the clean and the low sheets (the costly part)
    const [c, x] = can(PW, PH), [bc, b] = can(PW / 2, PH / 2);
    x.fillStyle = o.gap || 'rgb(120,94,62)'; x.fillRect(0, 0, PW, PH); b.fillStyle = o.bgap || '#505050'; b.fillRect(0, 0, PW / 2, PH / 2);   // dark resin-filled gaps between flakes
    for (let i = 0, N = o.n || 6400; i < N; i++) {                                // strands, mostly along the sheet (vertical), a few cross ones from the core showing
      const p0 = PAL[R() * PAL.length | 0], mx = o.mix || 0, p = p0.map((v, q) => v + ([156, 127, 90][q] - v) * mx), j = (R() - .5) * 14 * (1 - mx), L = ((o.L0 || .045) + R() * (o.L1 || .085)) * K, Wd = ((o.W0 || .01) + R() * (o.W1 || .018)) * K;
      const a = R() < .12 ? R() * Math.PI : Math.PI / 2 + (R() - .5) * (o.spread || .8);
      strand(x, b, R() * PW, R() * PH, L, Wd, a, `rgb(${p[0] + j | 0},${p[1] + j | 0},${p[2] + j * .8 | 0})`, `rgba(80,58,32,${(o.ol || .18) + R() * (o.ol ? o.ol : .25)})`); }
    for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(${55 + R() * 30 | 0},${38 + R() * 20 | 0},${22},${.5 + R() * .4})`; x.save(); x.translate(R() * PW, R() * PH); x.rotate(Math.PI / 2 + (R() - .5)); x.fillRect(-6, -1.5, 8 + R() * 14, 2 + R() * 3); x.restore(); }   // bark and resin flecks
    for (let i = 0; i < 10; i++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 1); x.save(); x.translate(R() * PW, R() * PH); x.scale(60 + R() * 140, 80 + R() * 200); const k = R() < .5;   // big soft mottling: some sheets darker in patches
      g.addColorStop(0, k ? 'rgba(90,62,30,.10)' : 'rgba(255,240,210,.08)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 1, 0, 7); x.fill(); x.restore(); }
    return [c, bc]; }
  const BASE = [base(), base()];
  function sheet(bi, low, stamp, BS = BASE) {
    const [c, x] = can(PW, PH), [bc, b] = can(PW / 2, PH / 2); x.drawImage(BS[bi][0], 0, 0); b.drawImage(BS[bi][1], 0, 0);
    if (R() < .5) { x.fillStyle = `rgba(${R() < .5 ? '255,236,200' : '80,56,30'},.06)`; x.fillRect(0, 0, PW, PH); }   // sheets differ a shade from each other
    if (stamp) {   // the grade stamp, faded blue ink. 31 Oct 01:xx (review: "oversized, ghostly, paired"): real size ≈ 26 × 10 cm (was 42 × 16), crisper broken ink, kept 37–50 % down the sheet: a 3.8 m wall's top row shows the top 56 % of a sheet, so the joint never splits it and it still shows under the front soffit; same three R() draws
      const tx = PW * (.2 + R() * .3), ty = PH * (.37 + R() * .1), ta = (R() - .5) * .08, [sc, s] = can(160, 64); let hs = (tx * 7 + ty * 13) | 0; const hr = () => ((hs = (hs * 16807) % 2147483647) / 2147483647);
      s.fillStyle = s.strokeStyle = '#27457e'; s.lineWidth = 2.6; s.strokeRect(3, 3, 150, 58); s.font = 'bold 20px Arial'; s.fillText('OSB/3', 12, 27); s.font = 'bold 13px Arial'; s.fillText('EN 300 · 18 mm', 12, 45); s.fillText('E1 · CE', 90, 27); s.fillRect(8, 51, 140, 4);
      s.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 260; i++) { s.globalAlpha = .4 + hr() * .6; s.beginPath(); s.arc(hr() * 160, hr() * 64, .5 + hr() * 1.6, 0, 7); s.fill(); }   // ink skips where the strands stand proud
      const lg = s.createLinearGradient(0, 0, 160, 0), le = .25 + hr() * .3; lg.addColorStop(0, `rgba(0,0,0,${le})`); lg.addColorStop(.6, 'rgba(0,0,0,0)'); s.globalAlpha = 1; s.fillStyle = lg; s.fillRect(0, 0, 160, 64);   // one end inked lighter: the stamp rocked
      x.save(); x.translate(tx, ty); x.rotate(ta); x.scale(.62, .62); x.globalAlpha = .62; x.drawImage(sc, 0, 0); x.restore(); }
    const scr = (px, py) => { x.fillStyle = 'rgba(60,45,30,.55)'; x.beginPath(); x.arc(px, py, 3.4, 0, 7); x.fill(); x.fillStyle = '#9a968e'; x.beginPath(); x.arc(px, py, 2.4, 0, 7); x.fill(); x.fillStyle = '#5c5a56'; x.fillRect(px - 1.4, py - .3, 2.8, .6); x.fillRect(px - .3, py - 1.4, .6, 2.8);   // screw head + its countersink
      b.fillStyle = '#e8e8e8'; b.beginPath(); b.arc(px / 2, py / 2, 1.3, 0, 7); b.fill(); };
    const e = .012 * K;                                             // screws: 12 mm in round the edges every 150 mm, every 300 mm down the middle stud
    for (let y = .075 * K; y < PH; y += .15 * K) { scr(e + (R() - .5), y + (R() - .5) * 2); scr(PW - e + (R() - .5), y + (R() - .5) * 2); if ((y / (.15 * K) | 0) % 2 === 0) scr(PW / 2 + (R() - .5) * 2, y); }
    for (const y of [e, PH - e]) for (let xx = .15 * K; xx < PW - .1 * K; xx += .2 * K) scr(xx, y);
    if (low) {                                                      // bottom row: floor splash and grime, trolley/fork scuffs, a boot mark or two
      const g = x.createLinearGradient(0, PH, 0, PH - .45 * K); g.addColorStop(0, 'rgba(70,62,52,.55)'); g.addColorStop(.35, 'rgba(80,70,58,.22)'); g.addColorStop(1, 'rgba(80,70,58,0)'); x.fillStyle = g; x.fillRect(0, PH - .45 * K, PW, .45 * K);
      for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(${90 + R() * 40 | 0},${85 + R() * 30 | 0},${75 + R() * 25 | 0},${.15 + R() * .3})`; x.beginPath(); x.arc(R() * PW, PH - Math.pow(R(), 2) * .3 * K, .6 + R() * 2.2, 0, 7); x.fill(); }   // splash
      for (let i = 0; i < 7; i++) { const y = PH - (.08 + R() * .5) * K, x0 = R() * PW, len = (.1 + R() * .45) * K; x.strokeStyle = `rgba(${R() < .4 ? '70,70,72' : '230,220,200'},${.15 + R() * .2})`; x.lineWidth = 1 + R() * 3; x.beginPath(); x.moveTo(x0, y); x.lineTo(x0 + len, y + (R() - .5) * 6); x.stroke(); }   // scuffs
      for (let i = 0; i < 2; i++) { x.save(); x.translate(R() * PW, PH - (.05 + R() * .25) * K); x.rotate((R() - .5) * .6); x.fillStyle = 'rgba(55,50,45,.16)'; x.beginPath(); x.ellipse(0, 0, 14, 34, 0, 0, 7); x.fill(); x.restore(); } }   // boot marks
    x.fillStyle = 'rgba(40,28,16,.55)'; x.fillRect(0, 0, PW, 1.5); x.fillRect(0, PH - 1.5, PW, 1.5); x.fillRect(0, 0, 1.5, PH); x.fillRect(PW - 1.5, 0, 1.5, PH);   // the joint: a hair of dark gap round the sheet
    b.fillStyle = '#101010'; b.fillRect(0, 0, PW / 2, 1); b.fillRect(0, PH / 2 - 1, PW / 2, 1); b.fillRect(0, 0, 1, PH / 2); b.fillRect(PW / 2 - 1, 0, 1, PH / 2);
    const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8; const bump = new THREE.CanvasTexture(bc);
    const m = STD({ map, bumpMap: bump, bumpScale: 1.4, roughness: .86 }); m.userData.stamp = !!stamp; return m; }
  const MAT = { up: [sheet(0, false, true), sheet(1, false, false)], low: [sheet(1, true, false), sheet(0, true, true)] };
  // inside the workshop: 28 Oct 02:xx used MAT a shade lighter, but at phone size its thin bright flakes on dark resin read as matchsticks (wsboard).
  // 28 Oct 03:xx: the inside gets its OWN sheets: wider, flatter flakes (2.5–5 cm × 6–14 cm, laid closer to the sheet's length), lighter gaps,
  // softer outlines, tones pulled 45 % toward the scan's median (blind review 03:xx: full spread read as camouflage at board distance), and three strand bases instead of two so sheets don't pair up across the room. Own RNG (6007): nothing outside moves.
  let si = 6007; const fi = () => (si = (si * 16807) % 2147483647) / 2147483647;
  R = fi; const BI = [0, 1, 2].map(() => base({ n: 2900, L0: .06, L1: .08, W0: .025, W1: .025, spread: .5, gap: 'rgb(146,117,82)', bgap: '#6c6c6c', ol: .08, mix: .45 }));
  const MIN = { up: [sheet(0, false, true, BI), sheet(1, false, false, BI), sheet(2, false, false, BI)], low: [sheet(1, true, false, BI), sheet(2, true, true, BI), sheet(0, true, false, BI)] };
  R = fr; for (const k in MIN) for (const m of MIN[k]) { m.color.setScalar(1.22); m.bumpScale = .9; }
  // A wall of sheets: group at (ox, y0, oz) turned ry; sheets run along local +x for L metres, face local +z, H metres tall.
  // skip: [[s0, s1, y0, y1]] holes (local metres) where no sheet is drawn (openings).
  // turn (28 Oct, inside lining): clean sheets may also hang upside down (a 180° turn, strands still run up the sheet), so 2 strand bases give 4 looks
  // holes (28 Oct 23:xx, see-through front window): [[s0, s1, y0, y1]] in wall metres; a sheet that overlaps one is drawn as up to 4 pieces round it, UVs as the whole sheet's, no extra draws
  function wall(p, ox, y0, oz, ry, L, H, row0Low = true, turn = false, holes = []) {
    const g = grp(p, ox, y0, oz, ry), st = new Set();   // st: rows whose last sheet carried a stamp (31 Oct: two stamped sheets side by side read as a mirrored pair)
    for (let s = 0, i = 0; s < L - .001; s += SW, i++) {
      const w = Math.min(SW, L - s);
      for (let y = 0, r = 0; y < H - .001; y += SH, r++) {
        const h = Math.min(SH, H - y), low = r === 0 && row0Low, ms = (low ? MAT.low : MAT.up), k2 = (i + r + (fr() < .3 ? 1 : 0)) % 2, m0 = turn ? (low ? MIN.low : MIN.up)[(i * 2 + r + k2) % 3] : ms[k2], m = m0.userData.stamp && st.has(r) ? (turn ? (low ? MIN.low : MIN.up)[(i * 2 + r + k2 + 1) % 3] : ms[1 - k2]) : m0, flip = fr() < .5 && !m.userData.stamp, rot = turn && !low && !m.userData.stamp && ((i * 5 + r * 3 + (ox * 7 | 0)) & 1);   // never turn or mirror the stamped sheet (upside-down or mirrored ink; 31 Oct: a mirrored pair read as twins in wstool)
        if (m.userData.stamp) st.add(r); else st.delete(r);
        let parts = [[0, w, 0, h]];
        for (const [h0, h1, hy0, hy1] of holes) { const a = Math.max(0, h0 - s), b = Math.min(w, h1 - s), c = Math.max(0, hy0 - y), d = Math.min(h, hy1 - y);
          if (a < b && c < d) parts = [[0, w, 0, c], [0, w, d, h], [0, a, c, d], [b, w, c, d]].filter(q => q[1] - q[0] > .001 && q[3] - q[2] > .001); }
        for (const [a, b, c, d] of parts) {
          const geo = new THREE.PlaneGeometry(b - a, d - c), uv = geo.attributes.uv, pos = geo.attributes.position; geo.translate((a + b - w) / 2, (c + d - h) / 2, 0);
          for (let k = 0; k < uv.count; k++) { let u = (pos.getX(k) + w / 2) / w * w / SW, v = (pos.getY(k) + h / 2) / h * h / SH; if (flip) u = 1 - u; if (!low && r > 0) v = 1 - h / SH + v * 1; if (rot) { u = 1 - u; v = 1 - v; } uv.setXY(k, u, v); }
          const mesh = new THREE.Mesh(geo, m); mesh.position.set(s + w / 2, y + h / 2, 0); mesh.receiveShadow = true; g.add(mesh); } } }
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
    box(g, MW, .22, ML, MX.steel, MW / 2, CH, -ML / 2 - .1); { const sh = new THREE.Shape(), a = .07, r = .012; sh.moveTo(-a + r, -a); sh.lineTo(a - r, -a); sh.quadraticCurveTo(a, -a, a, -a + r); sh.lineTo(a, a - r); sh.quadraticCurveTo(a, a, a - r, a); sh.lineTo(-a + r, a); sh.quadraticCurveTo(-a, a, -a, a - r); sh.lineTo(-a, -a + r); sh.quadraticCurveTo(-a, -a, -a + r, -a);
      const POSTM = STD({ color: 0x2c4a39, roughness: .4, metalness: .3 });   // satin moss-green paint, a shade lighter than the portal frames so the rounded corners catch the light
      const PG = new THREE.ExtrudeGeometry(sh, { depth: CH, bevelEnabled: false, curveSegments: 3 }); PG.rotateX(-Math.PI / 2); PG.translate(0, -CH / 2, 0);   // 27 Oct 06:xx: mezzanine posts are 140 SHS with rounded corners (were sharp boxes: a flat dark stripe at phone size), same material, same mesh count
      for (const [x, z] of [[.3, -.3], [MW - .1, -.3], [MW - .1, -ML / 2], [MW - .1, -ML], [.3, -ML]]) { const m = box(g, .14, CH, .14, POSTM, x, 0, z); m.geometry.dispose(); m.geometry = PG; } }
    box(g, MW, CH, .05, MX.osb, MW / 2, 0, -.15);   // workshop walls; 28 Oct 23:xx: the aisle wall has a real opening for the front window (local z −.6…−3.0, y 1.2–2.6), was solid behind frosted panes
    box(g, .05, CH, .4, MX.osb, MW, 0, -.4); box(g, .05, CH, ML - 3.0, MX.osb, MW, 0, -(ML + 3.0) / 2); box(g, .05, 1.2, 2.4, MX.osb, MW, 0, -1.8); box(g, .05, CH - 2.6, 2.4, MX.osb, MW, 2.6, -1.8);
    { const GO = box(g, .012, 1.4, 2.4, dimSpec(STD({ color: 0xc4d2da, metalness: 0, roughness: .04, transparent: true, opacity: .14, depthWrite: false }), .03), MW + .055, 1.2, -1.8); GO.castShadow = GO.receiveShadow = false; GO.userData.noAO = true; }   // clear glass you see the workshop through
    box(g, .04, .9, 1.6, STD({ color: 0x8aa0ad, metalness: .4, roughness: .1 }), MW + .04, 1.2, -9.5);   // windows clear of the yellow racking (scan: racking z -5.25…-10.85)
    box(SPARE, .06, 2.0, .9, MX.osb, MW + .04, 0, -2.4);   // 17 Oct: no door here (the workshop scan has the long bench and a wide window on this stretch; the way in is in the far wall): drawn into SPARE. Was: door near the front, where the scan shows the way in                                                         // door
    { const sv = _seed, TR = STD({ map: grain('#c8a878', '120,85,45', 256, 32, 0), roughness: .7 }), _r = (_seed = sv), HW_ = STD({ color: 0x8e9196, metalness: .7, roughness: .35 });   // OSB sheets on every face you can see (16–17 Oct): front to the door, long wall to the aisle, sewing-room walls above
      OSB.wall(g, 0, 0, -.122, 0, MW, CH); OSB.wall(g, MW + .028, 0, -.2, Math.PI / 2, ML - .2, CH, true, false, [[.4, 2.8, 1.2, 2.6]]);
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
    for (const [o, name, what, size] of stock) T(o, name, what.includes('Too small for the scan') ? what : what + ' Read off the LiDAR scan\'s elevation of this bay, not confirmed.', size, 'not sure');
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
  // ---- 2 Nov 00:xx (Josh's request "bring the yard in", step Y1): the Yard in 3D page's battened ply crate (model.js plyCrate), at the size and spot the
  //      LiDAR heightmap shows on the yard-bay floor: a flat-topped block x 16.0–17.3, z −7.5…−9.5, 0.9–1.0 m tall, tan top and sides (scan median ≈ #806e5c / #856d52).
  //      Ply panels set inside a pine batten frame, screwed; lid with a batten ring; two toggle clips on the aisle side. Own RNG, existing materials: nothing else moves.
  //      2 Nov 04:xx (blind review: "too clean and shiny for plywood, lid battens look loose, barely casts a shadow so it looks pasted in"): its own weathered faces (fine grain, plugs, grey sun, dirt rising from the floor, fork rubs, dust on the lid),
  //      a matt finish, the lid battens bedded and screwed with their shadow baked into the lid, and a baked floor shadow round the foot. Same size and spot.
  { const W = 1.25, D = 2.0, H = .92, b = .045, g = grp(P, 16.65, 0, -8.5, .012); let sd = 8821; const fr = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const SCR = STD({ color: 0x6d675e, metalness: .45, roughness: .62 }), CLIP = STD({ color: 0x858178, metalness: .55, roughness: .55 });
    const PX = 400, soft = (x, cx, cy, r, sq, col, a) => { x.save(); x.translate(cx, cy); x.scale(1, sq); const gr = x.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); x.fillStyle = gr; x.fillRect(-r, -r, 2 * r, 2 * r); x.restore(); };
    // one ply sheet as it has aged: grain runs along the width, `floor` true adds what rises from the floor (bottom edge of the canvas is the floor)
    const plyFace = (mw, mh, floor) => { const w = Math.round(mw * PX), h = Math.round(mh * PX), c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
      x.fillStyle = '#8c7b64'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) soft(x, fr() * w, fr() * h, 40 + fr() * 170, .4, fr() < .5 ? '70,58,44' : '196,184,164', .1 + fr() * .1);   // uneven sheet colour
      for (let i = 0; i < mh * 260; i++) { const y = fr() * h, a = fr() * .1 + .03, dy = (fr() - .5) * 8; x.strokeStyle = `rgba(66,52,38,${a})`; x.lineWidth = .6 + fr() * .9; x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(w * .3, y + dy, w * .6, y - dy, w, y + (fr() - .5) * 6); x.stroke(); }   // fine straight grain
      for (let k = 0, n = 1 + Math.round(mw * 1.5); k < n; k++) { const cx = fr() * w, cy = fr() * h, l = 90 + fr() * 170; for (let i = 0; i < 7; i++) { x.strokeStyle = `rgba(60,46,32,${.05 + fr() * .05})`; x.lineWidth = .8; x.beginPath(); x.ellipse(cx, cy, l * (1 - i * .12), 5 + i * 5.5, (fr() - .5) * .03, 0, 7); x.stroke(); } }   // low, thin cathedral figure
      for (let i = 0, n = Math.round(mw * mh * 2) + 1; i < n; i++) { const cx = fr() * w, cy = fr() * h, l = 15 + fr() * 8, t = 4 + fr() * 2; x.fillStyle = 'rgba(164,146,116,.3)'; x.beginPath(); x.ellipse(cx, cy, l, t, 0, 0, 7); x.fill(); x.strokeStyle = 'rgba(52,40,28,.22)'; x.lineWidth = 1; x.stroke(); }   // boat plugs where knots were cut out
      x.fillStyle = 'rgba(112,108,100,.15)'; x.fillRect(0, 0, w, h);   // sun and damp grey it
      for (let i = 0; i < mw * 60; i++) { const xx = fr() * w, l = 30 + fr() * 170, a = .03 + fr() * .05; const gr = x.createLinearGradient(0, 0, 0, l); gr.addColorStop(0, `rgba(54,46,38,${a})`); gr.addColorStop(1, 'rgba(54,46,38,0)'); x.fillStyle = gr; x.fillRect(xx, 0, 1 + fr() * 3, l); }   // run marks from the lid edge
      if (floor) { const gr = x.createLinearGradient(0, h, 0, h * .5); gr.addColorStop(0, 'rgba(42,34,26,.55)'); gr.addColorStop(.3, 'rgba(50,41,32,.24)'); gr.addColorStop(1, 'rgba(58,48,38,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h);   // dirt rising from the floor
        for (let i = 0; i < mw * 18; i++) soft(x, fr() * w, h - fr() * 70, 10 + fr() * 34, 1, '38,30,24', .08 + fr() * .12);   // not a straight tide line
        for (let i = 0; i < mw * 900; i++) { const y = h - Math.pow(fr(), 2.2) * h * .62; x.fillStyle = fr() < .7 ? `rgba(34,27,21,${.1 + fr() * .3})` : `rgba(190,178,158,${.08 + fr() * .16})`; const r = .6 + fr() * 1.7; x.fillRect(fr() * w, y, r, r); }   // splash specks, thick low down
        for (let i = 0; i < mw * 2.4; i++) { const cx = fr() * w, cy = h - (46 + fr() * 34), l = 60 + fr() * 170; x.strokeStyle = `rgba(24,21,18,${.2 + fr() * .25})`; x.lineCap = 'round'; x.lineWidth = 3 + fr() * 7; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + l, cy + (fr() - .5) * 8); x.stroke(); }   // black fork and pallet rubs at knee height
        for (let i = 0; i < mw * 5; i++) { const cx = fr() * w, cy = h * (.3 + fr() * .62), l = 16 + fr() * 70, an = (fr() - .5) * 1.1; x.strokeStyle = `rgba(206,192,168,${.1 + fr() * .14})`; x.lineCap = 'round'; x.lineWidth = .8 + fr() * 1.3; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(an) * l, cy + Math.sin(an) * l); x.stroke(); }   // pale knocks, bare wood showing
      } return c; };
    const mat = (c, o = {}) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; const m = STD({ map: t, roughness: .96, metalness: 0, ...o }); m.envMapIntensity = .45; return m; };
    const SIDE = mat(plyFace(D - .03, H - .06, true)), SIDE2 = mat(plyFace(D - .03, H - .06, true)), END = mat(plyFace(W - .03, H - .06, true)), END2 = mat(plyFace(W - .03, H - .06, true));
    box(g, W - .03, H - .06, D - .03, [SIDE2, SIDE, END, END, END2, END], 0, .02, 0);   // ply skin, set in from the frame
    // pine: grain along the length; uprights carry the same dirt from the floor up, rings stay dull with knocks
    const pineTex = (w, h, along, low) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = low ? '#75675a' : '#93836e'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 46; i++) { const t = fr() * (along ? w : h); x.strokeStyle = `rgba(52,40,30,${.08 + fr() * .17})`; x.lineWidth = .7 + fr() * 1.3; x.beginPath(); if (along) { x.moveTo(t, 0); x.lineTo(t + (fr() - .5) * 7, h); } else { x.moveTo(0, t); x.lineTo(w, t + (fr() - .5) * 7); } x.stroke(); }
      if (along) { const gr = x.createLinearGradient(0, h, 0, h * .5); gr.addColorStop(0, 'rgba(36,29,23,.72)'); gr.addColorStop(.3, 'rgba(44,36,28,.34)'); gr.addColorStop(1, 'rgba(50,42,32,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); }
      for (let i = 0; i < (along ? 7 : 12); i++) { x.fillStyle = `rgba(206,190,160,${.2 + fr() * .26})`; x.fillRect(fr() * w, fr() * h, 2 + fr() * (along ? 6 : 16), 1 + fr() * (along ? 12 : 4)); }   // knocked corners, paler bare wood
      return c; };
    const PINEU = mat(pineTex(48, 400, true)), PINER = mat(pineTex(800, 48, false)), PINEL = mat(pineTex(800, 48, false, true));
    for (const [yy, M] of [[0, PINEL], [H - .03 - b, PINER]]) { for (const sz of [-1, 1]) box(g, W, b, b, M, 0, yy, sz * (D - b) / 2); for (const sx of [-1, 1]) box(g, b, b, D - 2 * b, M, sx * (W - b) / 2, yy, 0); }   // bottom and top rings
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, b, H - .03 - 2 * b, b, PINEU, sx * (W - b) / 2, b, sz * (D - b) / 2);   // corner posts
    for (const sx of [-1, 1]) for (const zz of [-D / 6, D / 6]) box(g, b + .004, H - .03 - 2 * b, .07, PINEU, sx * (W - b) / 2, b, zz);   // two upright battens on each long side
    // the lid and its battens are one part: same small twist, battens bedded 4 mm in with a screw at each end, and their shadow and the dust round them baked into the lid
    const LW = W + .02, LD = D + .02, bat = [[0, D / 2 - .08, W - .1, .06], [0, -(D / 2 - .08), W - .1, .06], [0, 0, .06, D - .3]];
    const lidC = (() => { const A = plyFace(LD, LW, false), c = document.createElement('canvas'); c.width = A.height; c.height = A.width; const x = c.getContext('2d'); x.translate(c.width, 0); x.rotate(Math.PI / 2); x.drawImage(A, 0, 0); x.setTransform(1, 0, 0, 1, 0, 0);   // grain down the long way
      const w = c.width, h = c.height, m = v => v * PX;
      x.fillStyle = 'rgba(156,146,130,.2)'; x.fillRect(0, 0, w, h);   // dust lies on a flat top
      for (let i = 0; i < 34; i++) soft(x, fr() * w, fr() * h, 30 + fr() * 120, .5 + fr(), fr() < .6 ? '176,166,148' : '62,52,42', .06 + fr() * .09);   // wiped and settled patches
      for (const zz of [-.55, .55]) for (let i = 0; i < 7; i++) soft(x, m(.06 + fr() * .22), m(LD / 2 + zz) + (fr() - .5) * 130, 9 + fr() * 16, 1.3, '48,38,30', .2 + fr() * .2);   // hand marks by the clips
      for (const [bx, bz, bw, bd] of bat) { const x0 = m(LW / 2 + bx - bw / 2), y0 = m(LD / 2 + bz - bd / 2), bW = m(bw), bH = m(bd);
        x.save(); x.shadowColor = 'rgba(18,13,9,.8)'; x.shadowBlur = 16; x.fillStyle = 'rgba(18,13,9,.75)'; x.fillRect(x0, y0, bW, bH); x.fillRect(x0, y0, bW, bH); x.restore();
        x.fillStyle = 'rgba(14,10,7,.8)'; x.fillRect(x0 - 2, y0 - 2, bW + 4, bH + 4); }
      return c; })();
    const LIDT = mat(lidC), LEDG = mat((() => { const c = document.createElement('canvas'); c.width = 800; c.height = 16; const x = c.getContext('2d'); [[0, '#7c6c58'], [3, '#5e5040'], [6, '#84745e'], [9, '#5f5141'], [12, '#7a6a56']].forEach(([y, col]) => { x.fillStyle = col; x.fillRect(0, y, 800, 4); });   // the ply's layers show on the lid edge
      for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(30,24,18,${.04 + fr() * .1})`; x.fillRect(fr() * 800, 0, 20 + fr() * 90, 16); } return c; })());
    const lg = grp(g, 0, H - .03, 0, .004); box(lg, LW, .03, LD, [LEDG, LEDG, LIDT, LIDT, LEDG, LEDG], 0, 0, 0);   // lid sits a hair proud and a touch off square
    for (const [bx, bz, bw, bd] of bat) { box(lg, bw, .029, bd, bw > bd ? PINER : PINEU, bx, .026, bz); const n = bw > bd ? 2 : 3; for (let i = 0; i < n; i++) { const t = n === 1 ? 0 : i / (n - 1) - .5, sc = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .003, 8), SCR); sc.position.set(bx + (bw > bd ? t * (bw - .1) : 0), .056, bz + (bw > bd ? 0 : t * (bd - .1))); lg.add(sc); } }   // lid battens
    // screw heads along the battens on the faces you see: the aisle side (−x) and both ends
    const scr = (x, y, z, ax) => { const s = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .004, 8), SCR); if (ax === 'x') s.rotation.z = Math.PI / 2; else s.rotation.x = Math.PI / 2; s.position.set(x, y, z); g.add(s); };
    for (const yy of [b / 2, H - .03 - b / 2]) { for (let i = 0; i < 7; i++) scr(-W / 2 - .001, yy, -D / 2 + .1 + i * (D - .2) / 6 + (fr() - .5) * .02, 'x'); for (const sz of [-1, 1]) for (let i = 0; i < 4; i++) scr(-W / 2 + .1 + i * (W - .2) / 3 + (fr() - .5) * .02, yy, sz * (D / 2 + .001), 'z'); }
    for (const zz of [-D / 6, D / 6]) for (let i = 0; i < 4; i++) scr(-W / 2 - .003, b + .08 + i * (H - .3) / 3, zz + (fr() - .5) * .01, 'x');
    for (const zz of [-.55, .55]) { const c = grp(g, -W / 2 - .012, H - .16, zz); box(c, .012, .07, .045, CLIP, 0, 0, 0); box(c, .02, .012, .03, CLIP, -.006, .06, 0); box(c, .008, .05, .022, CLIP, 0, .1, 0); }   // toggle clips: catch on the side, hook over the lid
    // baked floor shadow: tight dark line where the crate meets the slab, a wide soft pool round it, dust swept up against the foot
    { const pad = .55, PW = W + 2 * pad, PD = D + 2 * pad, PPM = 110, cw = Math.ceil(PW * PPM), ch = Math.ceil(PD * PPM), c = document.createElement('canvas'); c.width = cw; c.height = ch; const x = c.getContext('2d'), im = x.createImageData(cw, ch);
      for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) { const px = (i + .5) / PPM - PW / 2, pz = (j + .5) / PPM - PD / 2, d = Math.hypot(Math.max(0, Math.abs(px) - W / 2), Math.max(0, Math.abs(pz) - D / 2)), e = Math.max(0, 1 - d / pad);
        const a = d <= 0 ? .7 : Math.min(.7, (.34 * Math.exp(-d / .02) + .42 * Math.exp(-d / .17)) * Math.min(1, e * 2.2)), q = (j * cw + i) * 4; im.data[q] = 12; im.data[q + 1] = 9; im.data[q + 2] = 7; im.data[q + 3] = a * 255; }
      x.putImageData(im, 0, 0); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const s = new THREE.Mesh(new THREE.PlaneGeometry(PW, PD), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })); s.rotation.x = -Math.PI / 2; s.position.y = .004; s.renderOrder = 1; s.userData.keep = true; s.userData.noAO = true; g.add(s); }
    T(g, 'Ply crate (yard bay floor)', 'A plywood crate on a pine batten frame, screwed, lid on with two toggle clips: the same build as the crates in the Yard in 3D page. Size and spot from the LiDAR scan (a flat-topped tan block about 1.3 × 2.0 m, 0.9 m tall); what is inside is not known.', '≈ 1.25 × 2.0 × 0.92 m (scan)', 'not sure'); }
  // ---- 2 Nov 01:xx (Josh's request "bring the yard in", step Y2): the Yard in 3D page's blue sack truck and loose cable (model.js), rebuilt in detail.
  //      Sack truck parked against the first bay of the right-wall run by the door, where the LiDAR heightmap shows something ≈ 1.0–1.1 m tall and ≈ 0.3–0.5 m
  //      wide standing at x 18.2, z −2.3…−2.6 (scan colour there is mid-grey, so what it is isn't confirmed). The cable lies across the open floor in front of the
  //      door-wall bay, from under its bottom shelf. Own RNG (6131) and own materials: nothing else moves.
  { let sd = 6131; const fr = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const shadowTex = (sx, sy) => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 4, 64, 64, 62);
      gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(.45, 'rgba(0,0,0,.28)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); };
    const blob = (p, w, d, x, z, o = 1) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: shadowTex(), transparent: true, opacity: o, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })); m.rotation.x = -Math.PI / 2; m.position.set(x, .004, z); m.renderOrder = 1; m.userData.keep = true; p.add(m); return m; };
    // powder-coated blue with chips and rubs (canvas): darker where hands and boots wear it, a few bare-steel chips
    const pc = document.createElement('canvas'); pc.width = 64; pc.height = 256; { const x = pc.getContext('2d'); x.fillStyle = '#2b5f9c'; x.fillRect(0, 0, 64, 256);
      for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${fr() < .5 ? '20,40,70' : '90,140,200'},${.05 + fr() * .08})`; x.fillRect(fr() * 64, fr() * 256, 1 + fr() * 2, 1 + fr() * 3); }
      for (let i = 0; i < 22; i++) { const y = fr() < .6 ? 200 + fr() * 56 : fr() * 256; x.fillStyle = `rgba(${fr() < .5 ? '170,172,170' : '60,55,50'},${.5 + fr() * .4})`; x.fillRect(fr() * 64, y, 1 + fr() * 3, 1 + fr() * 2); }
      const gg = x.createLinearGradient(0, 200, 0, 256); gg.addColorStop(0, 'rgba(60,50,40,0)'); gg.addColorStop(1, 'rgba(60,50,40,.35)'); x.fillStyle = gg; x.fillRect(0, 200, 64, 56); }
    const BLUE = STD({ map: new THREE.CanvasTexture(pc), roughness: .62, metalness: .2 }); BLUE.map.colorSpace = THREE.SRGBColorSpace;
    const TOE = STD({ color: 0x7c8084, metalness: .7, roughness: .5 }), RUB = STD({ color: 0x18191b, roughness: .85 }), GRIP = STD({ color: 0x141416, roughness: .7 }), RIM = STD({ color: 0xb8bcc0, metalness: .75, roughness: .35 }), RED = STD({ color: 0xb02a22, roughness: .5, metalness: .2 });
    const g = grp(P, 18.02, 0, -2.45, .06);   // toe plate faces the aisle (−x), handles back toward the racking stock, a touch off square
    const tube = (pts, r, m) => { const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))); const t = new THREE.Mesh(new THREE.TubeGeometry(c, 40, r, 8), m); t.castShadow = t.receiveShadow = true; g.add(t); return t; };
    // two rails: up from the toe plate, a slight forward lean, then bent back into the handle loops (in local x, +x = toward the racking)
    for (const z of [-.2, .2]) tube([[.02, .02, z], [.05, .35, z], [.06, .8, z], [.05, 1.05, z], [.1, 1.17, z * .92], [.2, 1.2, z * .85]], .0135, BLUE);
    for (const z of [-.2, .2]) { const h = cyl(g, .019, .11, GRIP, .17, 1.195, z * .85, 'x', 10); h.rotation.z = Math.PI / 2 + .12; }   // rubber grips on the loop ends
    for (const y of [.32, .58, .84, 1.02]) cyl(g, .009, .4, BLUE, .05 + (y > .9 ? .003 : 0), y, 0, 'z', 8);   // cross bars
    box(g, .016, .14, .44, BLUE, .05, .05, 0);   // back plate behind the toe, welded to the rails
    // toe plate (nose): a pressed steel plate sticking out toward the aisle, folded lip, two gussets, scuffed
    box(g, .2, .006, .46, TOE, -.08, .0, 0); box(g, .006, .018, .46, TOE, -.177, .0, 0);
    for (const z of [-.17, .17]) { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(-.12, 0); s.lineTo(0, .12); s.closePath(); const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: .006, bevelEnabled: false }), TOE); m.position.set(.04, .006, z - .003); m.castShadow = true; g.add(m); }
    // axle, brackets and two pneumatic wheels behind the rails
    cyl(g, .011, .6, RIM, .13, .13, 0, 'z', 10);
    for (const z of [-.2, .2]) { const b = box(g, .14, .03, .012, BLUE, .07, .115, z); b.rotation.z = -.5; }
    for (const z of [-.275, .275]) { const w = grp(g, .13, .13, z);
      const tyre = new THREE.Mesh(new THREE.TorusGeometry(.096, .036, 12, 36), RUB); tyre.castShadow = true; w.add(tyre);
      for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2, t = new THREE.Mesh(new THREE.BoxGeometry(.006, .014, .03), RUB); t.position.set(Math.cos(a) * .128, Math.sin(a) * .128, (i % 2 ? .011 : -.011)); t.rotation.z = a; t.rotation.x = i % 2 ? .45 : -.45; w.add(t); }   // chevron tread blocks
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .05, 20), RED); rim.rotation.x = Math.PI / 2; w.add(rim);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .066, 12), RIM); hub.rotation.x = Math.PI / 2; w.add(hub);
      const valve = new THREE.Mesh(new THREE.CylinderGeometry(.003, .003, .018, 5), RIM); valve.position.set(.05, .04, z > 0 ? .02 : -.02); valve.rotation.z = .9; w.add(valve); }
    blob(P, .7, .78, 18.0, -2.45, .9);   // soft contact shadow under toe plate and wheels
    T(g, 'Sack truck', 'Blue sack truck parked against the racking by the door: pressed steel toe plate, tube frame, two pneumatic wheels, rubber grips. The same truck as in the Yard in 3D page; spot from the LiDAR scan (something about 1 m tall stands here), not confirmed.', '≈ 1.2 m tall', 'not sure');
    // the loose cable: black flex with a blue 16 A plug, out from under the door-wall bay's bottom shelf, lying in loose S-bends
    const pts = [[16.72, -1.2], [16.78, -1.62], [16.55, -1.98], [16.62, -2.35], [16.98, -2.55], [17.32, -2.42], [17.48, -2.78], [17.3, -3.12], [17.0, -3.26]].map(([x, z]) => new THREE.Vector3(x + (fr() - .5) * .03, .0085, z));
    const curve = new THREE.CatmullRomCurve3(pts), cab = new THREE.Mesh(new THREE.TubeGeometry(curve, 120, .0085, 8), STD({ color: 0x141414, roughness: .55 })); cab.castShadow = cab.receiveShadow = true; const cg = grp(P); cg.add(cab);
    const end = curve.getPoint(1), dir = curve.getTangent(1), plug = grp(cg, end.x, .021, end.z); plug.rotation.y = Math.atan2(-dir.z, dir.x);
    const BLU = STD({ color: 0x1f5fc4, roughness: .45 });
    { cyl(plug, .014, .05, BLU, .025, 0, 0, 'x', 12); cyl(plug, .021, .055, BLU, .075, 0, 0, 'x', 14); for (const dx of [.058, .07, .082]) cyl(plug, .0215, .004, STD({ color: 0x184c9c, roughness: .5 }), dx, 0, 0, 'x', 14); cyl(plug, .018, .006, STD({ color: 0x0e0e10, roughness: .6 }), .104, 0, 0, 'x', 14); plug.position.y = .021; }
    for (let i = 1; i < 8; i++) { const p = curve.getPoint(i / 8); blob(P, .09, .09, p.x, p.z, .55); }
    T(cg, 'Loose cable', 'A black extension cable with a blue 16 A plug, out from under the door-wall racking and lying across the floor in loose bends, as in the Yard in 3D page: a trip hazard, worth coiling up. Not in the LiDAR scan (too thin to show).', '≈ 3 m showing', 'not sure'); }
  // ---- 2 Nov 07:xx (Josh's request "bring the yard in", step Y3c part 3): what the LiDAR shows heaped against the front of the far-end bay, x 17.75–18.2, built from the
  //      scan's own shapes and colours: z −11.38…−12.05 a straight edge to 1.45 m stepping down to the floor (dark brown, greyer up top, a yellow patch ≈ 1 m up), z −12.1…−12.65
  //      a bundle to 1.5 m (grey woven sack with a blue strap, cream ribbed pad, red and black on top) on something dark brown with blue hanging down. What they really are is a guess. Own RNG, own materials.
  { let sd = 5531; const fr = () => (sd = (sd * 16807) % 2147483647) / 2147483647, g = grp(P, 0, 0, 0);
    const can = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }, srgb = (c, rx = 1, ry = 1) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
    const soft = (x, cx, cy, r, sq, col, a) => { x.save(); x.translate(cx, cy); x.scale(1, sq); const gr = x.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); x.fillStyle = gr; x.fillRect(-r, -r, 2 * r, 2 * r); x.restore(); };
    const sag = (w, h, d, s, k = .05, e = .55) => { const G = new THREE.SphereGeometry(1, 40, 28), p = G.attributes.position, sp = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e); for (let i = 0; i < p.count; i++) { const x = sp(p.getX(i), e), y = sp(p.getY(i), e), z = sp(p.getZ(i), e), l = .5 - y / 2, b = 1 + l * l * .14 + k * Math.sin(3.1 * x + 2.3 * y + s) * Math.sin(2.7 * z - 1.9 * y + s * 1.7) + k * .5 * Math.sin(7.3 * y + 4.1 * z + s * .6); p.setXYZ(i, x * w / 2 * b, (y + 1) * h / 2 * (1 + .025 * Math.sin(3 * x + s) * Math.cos(3 * z)), z * d / 2 * b); } G.computeVertexNormals(); return G; };
    const M = (G, m, x, y, z, rx = 0, ry = 0, rz = 0, q = g) => { const o = new THREE.Mesh(G, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = o.receiveShadow = true; q.add(o); return o; };
    // old shuttering ply: dark brown, oil-stained, face veneer lifting grey towards the top edge, cut edges pale; px are a fixed 280/m so nothing stretches
    const board = (W, H, foot, z0, tilt, tone) => { const [c, x] = can(Math.round(W * 280), Math.round(H * 280)), w = c.width, h = c.height; x.fillStyle = tone; x.fillRect(0, 0, w, h); for (let i = 0; i < 60 * W * H + 90; i++) { const a = fr() * w, b = fr() * h; x.strokeStyle = `rgba(${fr() < .7 ? '26,18,10' : '132,108,80'},${.05 + fr() * .1})`; x.lineWidth = .7 + fr(); x.beginPath(); x.moveTo(a, b); x.lineTo(a + (fr() - .5) * 5, b + 60 + fr() * 170); x.stroke(); }
        for (let i = 0; i < 8; i++) soft(x, fr() * w, fr() * h, 30 + fr() * 70, 1.5, fr() < .6 ? '22,15,9' : '120,100,78', .16); const gg = x.createLinearGradient(0, 0, 0, h * .55); gg.addColorStop(0, 'rgba(142,128,110,.55)'); gg.addColorStop(1, 'rgba(142,128,110,0)'); x.fillStyle = gg; x.fillRect(0, 0, w, h * .55); const gd = x.createLinearGradient(0, h, 0, h - 60); gd.addColorStop(0, 'rgba(20,16,12,.5)'); gd.addColorStop(1, 'rgba(20,16,12,0)'); x.fillStyle = gd; x.fillRect(0, h - 60, w, 60);
        for (let i = 0; i < 4 + H * 5; i++) { x.fillStyle = `rgba(150,128,98,${.25 + fr() * .3})`; const b = fr() < .5 ? fr() * 8 : w - 8 * fr() - 5; x.fillRect(b, fr() * h, 3 + fr() * 4, 6 + fr() * 26); }   // knocked edges
        const q = grp(g, foot, 0, z0 - W / 2); q.rotation.z = -tilt; const F = STD({ map: srgb(c), roughness: .9, envMapIntensity: .3 }), E = STD({ color: 0x5f4f3c, roughness: .94, envMapIntensity: .25 }); box(q, .018, H, W, [E, F, E, E, E, E], 0, 0, 0); return q; };
    // the bulk the boards rest on: a slumped brown bag against the racking (the scan's slope falls towards the aisle and towards z −12)
    const [bb, bx] = can(512, 512); { bx.fillStyle = '#4a3825'; bx.fillRect(0, 0, 512, 512); for (let i = 0; i < 4500; i++) { bx.fillStyle = `rgba(${fr() < .5 ? '30,22,14' : '110,92,70'},${.05 + fr() * .09})`; bx.fillRect(fr() * 512, fr() * 512, 2 + fr() * 3, 1); } for (let i = 0; i < 26; i++) soft(bx, fr() * 512, fr() * 512, 40 + fr() * 90, .5, fr() < .6 ? '22,16,10' : '128,112,90', .16); for (let i = 0; i < 16; i++) { bx.strokeStyle = 'rgba(20,14,9,.38)'; bx.lineWidth = 2 + fr() * 3; const a = fr() * 512, b = fr() * 512; bx.beginPath(); bx.moveTo(a, b); bx.bezierCurveTo(a + 40, b + 40 * fr(), a + 70, b + 90, a + 40 * fr(), b + 170); bx.stroke(); } }
    { const G = sag(.22, 1.4, .64, 1.3, .035, .34), p = G.attributes.position; for (let i = 0; i < p.count; i++) { const t = Math.min(1, Math.max(0, (.3 - p.getZ(i)) / .6)); p.setY(i, p.getY(i) * (1 - .62 * t * t)); } G.computeVertexNormals(); M(G, STD({ map: srgb(bb), roughness: .95, envMapIntensity: .3 }), 18.13, 0, -11.71); }
    for (const [W, H, f, t, tone] of [[.36, 1.46, 17.78, .155, '#4d3a28'], [.47, 1.03, 17.76, .155, '#46331f'], [.55, .79, 17.74, .15, '#523d29'], [.67, .56, 17.72, .14, '#3f2e1e']]) board(W, H, f + (fr() - .5) * .008, -11.38 - (fr() - .5) * .012, t + (fr() - .5) * .012, tone);
    // yellow hard hat left on the second board's top edge, tipped back: lathe shell, brim, centre ridge, scuffed (the scan's yellow patch ≈ 0.3 m across, 1 m up)
    const [hc, hx] = can(256, 128); { hx.fillStyle = '#c9a716'; hx.fillRect(0, 0, 256, 128); for (let i = 0; i < 16; i++) soft(hx, fr() * 256, fr() * 128, 18 + fr() * 40, .6, fr() < .6 ? '120,92,20' : '244,214,70', .2); for (let i = 0; i < 130; i++) { hx.fillStyle = `rgba(${fr() < .6 ? '86,72,40' : '240,226,150'},${.14 + fr() * .3})`; hx.fillRect(fr() * 256, fr() * 128, 1 + fr() * 5, 1); } }
    { const H = STD({ map: srgb(hc), roughness: .56, envMapIntensity: .45 }), q = grp(g, 17.84, 1.05, -11.53); q.rotation.set(.5, .6, -.18); q.scale.setScalar(.9); const pts = []; for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI / 2; pts.push(new THREE.Vector2(.105 * Math.cos(a) * (1 + .02 * Math.cos(a)), .115 * Math.sin(a))); } M(new THREE.LatheGeometry(pts, 36), H, 0, .012, 0, 0, 0, 0, q).scale.z = 1.22; const br = M(new THREE.CylinderGeometry(.112, .118, .012, 36), H, 0, .006, .006, 0, 0, 0, q); br.scale.z = 1.3; const rd = M(new THREE.SphereGeometry(.118, 28, 12, 0, Math.PI), H, 0, .018, 0, 0, Math.PI / 2, 0, q); rd.scale.set(1.2, .98, .17); }
    // the base under the bundle: a dark timber box of planks, a blue tarp hanging down its aisle side
    const [tb, tx] = can(256, 256); { tx.fillStyle = '#39291a'; tx.fillRect(0, 0, 256, 256); for (let i = 0; i < 260; i++) { tx.strokeStyle = `rgba(${fr() < .7 ? '18,12,7' : '112,90,64'},${.05 + fr() * .12})`; tx.lineWidth = .8; const y = fr() * 256; tx.beginPath(); tx.moveTo(0, y); tx.lineTo(256, y + (fr() - .5) * 8); tx.stroke(); } tx.fillStyle = 'rgba(10,7,4,.85)'; for (const y of [84, 170]) tx.fillRect(0, y, 256, 3); tx.fillStyle = 'rgba(120,110,96,.7)'; for (const y of [42, 128, 212]) for (const a of [16, 240]) { tx.beginPath(); tx.arc(a, y, 2.2, 0, 7); tx.fill(); } }
    { const Bm = STD({ map: srgb(tb), roughness: .93, envMapIntensity: .3 }); box(g, .46, .6, .5, Bm, 17.97, 0, -12.37, .02); }
    const [bl, lx] = can(256, 256); { lx.fillStyle = '#2b5a96'; lx.fillRect(0, 0, 256, 256); lx.strokeStyle = 'rgba(14,38,76,.3)'; lx.lineWidth = 1; for (let i = 0; i < 256; i += 7) { lx.beginPath(); lx.moveTo(i, 0); lx.lineTo(i, 256); lx.moveTo(0, i); lx.lineTo(256, i); lx.stroke(); } for (let i = 0; i < 22; i++) soft(lx, fr() * 256, fr() * 256, 20 + fr() * 50, 1.6, fr() < .6 ? '12,30,62' : '150,172,200', .16); }
    { const G = new THREE.PlaneGeometry(.34, .62, 14, 18), p = G.attributes.position; for (let i = 0; i < p.count; i++) { const u = p.getX(i), v = p.getY(i); p.setZ(i, .012 * Math.sin(u * 62 + v * 3) + .007 * Math.sin(u * 133 - v * 5)); p.setX(i, u * (1 + .25 * (.31 - v))); } G.computeVertexNormals(); const m = M(G, STD({ map: srgb(bl), roughness: .68, envMapIntensity: .5, side: THREE.DoubleSide }), 17.733, .31, -12.3, 0, -Math.PI / 2, 0); m.castShadow = true; }
    // grey woven sack with a blue strap, cream ribbed pad in folds on it, a red and a black bag at the very top (top ≈ 1.5 m)
    const [wv, wx] = can(256, 256); { wx.fillStyle = '#9b9a91'; wx.fillRect(0, 0, 256, 256); wx.lineWidth = 2; for (let i = 0; i < 256; i += 6) { wx.strokeStyle = 'rgba(72,70,62,.16)'; wx.beginPath(); wx.moveTo(i, 0); wx.lineTo(i, 256); wx.stroke(); wx.strokeStyle = 'rgba(204,202,190,.14)'; wx.beginPath(); wx.moveTo(0, i + 2); wx.lineTo(256, i + 2); wx.stroke(); } for (let i = 0; i < 24; i++) soft(wx, fr() * 256, fr() * 256, 24 + fr() * 60, .7, fr() < .55 ? '56,54,46' : '206,204,192', .17); wx.lineWidth = 2.5; for (let i = 0; i < 12; i++) { wx.strokeStyle = 'rgba(50,48,42,.3)'; const a = fr() * 256, b = fr() * 256; wx.beginPath(); wx.moveTo(a, b); wx.bezierCurveTo(a + 26 * fr(), b + 30, a - 20 * fr(), b + 60, a + 12 * fr(), b + 100); wx.stroke(); } }
    const SK = STD({ map: srgb(wv, 4, 3), roughness: .9, envMapIntensity: .3 }); M(sag(.5, .54, .56, 2.6, .03, .36), SK, 17.97, .595, -12.38, .03, .1, -.02);
    { const S = STD({ color: 0x25588a, roughness: .78 }), n = 56, pts = [], sp = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e); for (let i = 0; i < n; i++) { const a = i / n * 2 * Math.PI; pts.push(new THREE.Vector3(.285 * sp(Math.cos(a), .36), 0, .315 * sp(Math.sin(a), .36))); } const m = M(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 120, .01, 6, true), S, 17.97, .875, -12.38, .03, .1, -.02); m.scale.y = 2.4; }
    const [cr, ex] = can(128, 256); { ex.fillStyle = '#d8c6a6'; ex.fillRect(0, 0, 128, 256); for (let i = 0; i < 60; i++) { ex.strokeStyle = `rgba(${fr() < .6 ? '120,102,78' : '238,228,206'},${.1 + fr() * .14})`; ex.lineWidth = 1; const b = fr() * 256; ex.beginPath(); ex.moveTo(0, b); ex.lineTo(128, b); ex.stroke(); } for (let i = 0; i < 10; i++) soft(ex, fr() * 128, fr() * 256, 16 + fr() * 34, 1, '96,80,60', .15); }
    { const C = STD({ map: srgb(cr, 1, 1), roughness: .93, envMapIntensity: .3 }); for (let i = 0; i < 5; i++) { const q = M(sag(.52 - i * .012, .068, .6 - i * .01, 6 + i * 1.3, .03, .3), C, 18.0 + (fr() - .5) * .02, 1.125 + i * .061, -12.38 + (fr() - .5) * .018, 0, .1 + (fr() - .5) * .05, -.015); } const B3 = STD({ color: 0x9db4d0, roughness: .86 }); box(g, .4, .03, .012, B3, 18.0, 1.2, -12.09); }
    { const R = STD({ color: 0x7e2a2c, roughness: .78 }), K = STD({ color: 0x1d1e20, roughness: .62, envMapIntensity: .5 }); M(sag(.3, .085, .24, 3.9, .1, .32), R, 18.04, 1.43, -12.19, .05, .35, .05); M(sag(.42, .1, .34, 5.2, .1, .32), K, 18.06, 1.42, -12.5, -.05, -.2, -.04); }
    // baked floor shadow round the whole lot, tight at the feet, open on the rack side
    { const X0 = 17.3, Z0 = -12.9, PW = 1.0, PD = 1.9, K = 110, [c, x] = can(Math.round(PW * K), Math.round(PD * K)), rr = (m, a) => { x.fillStyle = `rgba(18,14,10,${a})`; x.beginPath(); x.roundRect((.42 - m) * K, (.25 - m) * K, (.6 + m) * K, (.62 + 2 * m) * K, m * K); x.fill(); x.beginPath(); x.roundRect((.43 - m) * K, (.85 - m) * K, (.6 + m) * K, (.68 + 2 * m) * K, m * K); x.fill(); };
      for (let m = .3; m > .02; m -= .03) rr(m, .03); rr(.03, .22);
      const s = new THREE.Mesh(new THREE.PlaneGeometry(PW, PD), new THREE.MeshBasicMaterial({ map: srgb(c), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })); s.rotation.x = -Math.PI / 2; s.position.set(X0 + PW / 2, .004, Z0 + PD / 2); s.renderOrder = 1; s.userData.keep = true; s.userData.noAO = true; P.add(s); }
    T(g, 'Boards and bagged kit', 'Dark shuttering ply offcuts leaning on a slumped brown bag against the far-end bay, a yellow hard hat left on them, and next to them a bundle of bags on a timber box: a grey woven sack with a blue strap, a cream folded pad, a red and a black bag on top, a blue tarp hanging down. The heights, sizes and colours are from the LiDAR scan; what each thing really is, is a guess.', '≈ 0.5 × 1.3 m, up to 1.5 m (scan)', 'not sure'); }
  // ---- 2 Nov 03:xx (Josh's request "bring the yard in", step Y3b, part 1): the Yard in 3D page's steel keg (model.js), rebuilt in detail, two of them,
  //      where the LiDAR heightmap shows a 0.6 m block, neutral grey (scan median ≈ #7f837e), x 17.5–18.1, z −12.7…−13.4, on the floor in front of the
  //      far-end bay of the right-wall run. Two 50 L Euro kegs (Ø 408 × 600 mm) side by side fill it. Own RNG (7717) and own materials: nothing else moves.
  { let sd = 7717; const fr = () => (sd = (sd * 16807) % 2147483647) / 2147483647, R = .204;
    // brushed stainless (canvas, u round the keg, v up): fine streaks round the barrel, a few scratches and rubs, grime and a tide line low down
    const sc = document.createElement('canvas'); sc.width = 512; sc.height = 256; { const x = sc.getContext('2d'); x.fillStyle = '#b4b8bb'; x.fillRect(0, 0, 512, 256);
      for (let i = 0; i < 1400; i++) { const y = fr() * 256; x.fillStyle = `rgba(${fr() < .5 ? '235,238,240' : '95,100,105'},${.04 + fr() * .07})`; x.fillRect(fr() * 512, y, 30 + fr() * 200, 1); }
      for (let i = 0; i < 70; i++) { const x0 = fr() * 512, y0 = fr() * 256, a = (fr() - .5) * 1.2, l = 6 + fr() * 30; x.strokeStyle = `rgba(${fr() < .6 ? '230,232,234' : '70,72,75'},${.25 + fr() * .3})`; x.lineWidth = .7; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + Math.cos(a) * l, y0 + Math.sin(a) * l); x.stroke(); }
      for (let i = 0; i < 9; i++) { x.fillStyle = `rgba(80,74,66,${.06 + fr() * .08})`; x.beginPath(); x.ellipse(fr() * 512, 60 + fr() * 140, 10 + fr() * 30, 4 + fr() * 10, 0, 0, 7); x.fill(); }   // dull rubs and hand marks
      const gg = x.createLinearGradient(0, 256, 0, 190); gg.addColorStop(0, 'rgba(70,60,48,.45)'); gg.addColorStop(1, 'rgba(70,60,48,0)'); x.fillStyle = gg; x.fillRect(0, 190, 512, 66);
      x.fillStyle = 'rgba(90,80,64,.18)'; x.fillRect(0, 214, 512, 3); }
    const SS = STD({ map: new THREE.CanvasTexture(sc), metalness: .85, roughness: .34 }); SS.map.colorSpace = THREE.SRGBColorSpace; SS.map.wrapS = THREE.RepeatWrapping;
    // the chimes (top and bottom skirts): same steel, double-sided; the top one has two hand holes cut out with an alpha map
    const hc = document.createElement('canvas'); hc.width = 256; hc.height = 32; { const x = hc.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 256, 32); x.fillStyle = '#000';
      for (const u of [.25, .75]) { const cx = u * 256, w = 34, h = 11, y = 9, r = 5.5; x.beginPath(); x.moveTo(cx - w / 2 + r, y); x.arcTo(cx + w / 2, y, cx + w / 2, y + h, r); x.arcTo(cx + w / 2, y + h, cx - w / 2, y + h, r); x.arcTo(cx - w / 2, y + h, cx - w / 2, y, r); x.arcTo(cx - w / 2, y, cx + w / 2, y, r); x.fill(); } }
    const CH = STD({ map: SS.map, metalness: .85, roughness: .38, side: THREE.DoubleSide }), CHT = CH.clone(); CHT.alphaMap = new THREE.CanvasTexture(hc); CHT.alphaTest = .5;
    const CAP = [STD({ color: 0xb3261e, roughness: .55 }), STD({ color: 0x2f5fa8, roughness: .55 })], SPEAR = STD({ color: 0xc9ccce, metalness: .9, roughness: .22 }), DARK = STD({ color: 0x2a2b2d, roughness: .6 });
    const shadowTex = () => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 4, 64, 64, 62);
      gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(.55, 'rgba(0,0,0,.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); }, ST = shadowTex();
    const body = new THREE.LatheGeometry([[.001, .072], [.06, .07], [.13, .075], [.178, .088], [.198, .108], [R - .002, .13], [R, .2], [R - .003, .3], [R, .4], [R - .002, .47], [.198, .492], [.178, .512], [.13, .525], [.06, .53], [.001, .531]].map(([r, y]) => new THREE.Vector2(r, y)), 40);
    const keg = (x, z, ry, k) => { const g = grp(P, x, 0, z, ry);
      const b = new THREE.Mesh(body, SS); b.castShadow = b.receiveShadow = true; g.add(b);   // barrel with domed ends, a slight waist between the beads
      for (const y of [.2, .4]) { const t = new THREE.Mesh(new THREE.TorusGeometry(R + .002, .009, 8, 40), SS); t.rotation.x = Math.PI / 2; t.position.y = y; t.castShadow = true; g.add(t); }   // two rolling beads
      const skirt = (y0, h, m) => { const s = new THREE.Mesh(new THREE.CylinderGeometry(R - .006, R - .006, h, 40, 1, true), m); s.position.y = y0 + h / 2; s.castShadow = s.receiveShadow = true; g.add(s);
        for (const yy of [y0 + .006, y0 + h - .004]) { const l = new THREE.Mesh(new THREE.TorusGeometry(R - .006, .006, 6, 40), SS); l.rotation.x = Math.PI / 2; l.position.y = yy; g.add(l); } };   // rolled lips top and bottom of each chime
      skirt(0, .1, CH); skirt(.5, .1, CHT);
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(R - .012, R - .012, .095, 40, 1, true), DARK); hole.material = hole.material.clone(); hole.material.side = THREE.BackSide; hole.position.y = .05; g.add(hole);   // dark inside the bottom chime
      // spear (Sankey fitting) in the middle of the top dome, a plastic dust cap on one, the bare valve on the other
      cyl(g, .045, .018, SPEAR, 0, .538, 0, 'y', 20); cyl(g, .032, .02, SPEAR, 0, .556, 0, 'y', 20);
      if (k === 0) { cyl(g, .041, .03, CAP[0], 0, .568, 0, 'y', 20); cyl(g, .043, .006, CAP[0], 0, .555, 0, 'y', 20); }
      else { const v = new THREE.Mesh(new THREE.TorusGeometry(.02, .005, 6, 18), SPEAR); v.rotation.x = Math.PI / 2; v.position.y = .567; g.add(v); cyl(g, .012, .008, DARK, 0, .566, 0, 'y', 12); }
      // a printed collar ring on the barrel (brewer's band), faded
      const band = new THREE.Mesh(new THREE.CylinderGeometry(R + .0012, R + .0012, .05, 40, 1, true), STD({ color: k ? 0x2f5fa8 : 0x3b3f44, roughness: .55, metalness: .2, transparent: true, opacity: .75 })); band.position.y = .3; g.add(band);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(.62, .62), new THREE.MeshBasicMaterial({ map: ST, transparent: true, opacity: .85, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })); m.rotation.x = -Math.PI / 2; m.position.y = .004; m.renderOrder = 1; m.userData.keep = true; g.add(m);   // soft contact shadow
      return g; };
    const kg = grp(P); kg.add(keg(17.8, -12.86, fr() * 6, 0)); kg.add(keg(17.79, -13.28, fr() * 6, 1));
    T(kg, 'Steel kegs', 'Two stainless 50 L beer kegs standing on the floor in front of the far-end bay: bar kit, as in the Yard in 3D page (rolling beads, chimes with hand holes, spear fitting on top; one still has its red dust cap). Spot from the LiDAR scan: a grey block 0.6 m tall, about 0.6 × 0.8 m, which two kegs side by side fill. Not confirmed.', 'Ø 0.41 × 0.6 m each', 'not sure'); }
  // ---- 2 Nov 05:xx (Josh's request "bring the yard in", step Y3c part 1): the LiDAR's unbuilt block at the yard-bay's back: a flat 0.52 m block x 13.75–15.35, z −11.9…−13.1 with a thin sheet leaning on its
  //      door-side edge, foot at x ≈ 16.5, top at x ≈ 14.95, 0.8 m up (section from the side, 27° slope). The yard's two kits that fit: its blue plastic pallet of canvas-tent cartons (two layers, strapped) and its
  //      batten-framed ply panels leaning on a pallet (model.js), at the scan's sizes. Own RNG, own materials, nothing else moves.
  { let sd = 4409; const fr = () => (sd = (sd * 16807) % 2147483647) / 2147483647, B = [1.6, 1.2, .52], g = grp(P, 14.55, 0, -12.5, -.01);
    const can = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }, srgb = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
    const soft = (x, cx, cy, r, sq, col, a) => { x.save(); x.translate(cx, cy); x.scale(1, sq); const gr = x.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); x.fillStyle = gr; x.fillRect(-r, -r, 2 * r, 2 * r); x.restore(); };
    // blue plastic pallet: moulded grid deck, three runners, scuffed pale on the corners (scan blues ≈ #1e2e53, highlights #6e7a96)
    const [pc, px] = can(512, 384); { px.fillStyle = '#27457a'; px.fillRect(0, 0, 512, 384); for (let i = 0; i < 40; i++) soft(px, fr() * 512, fr() * 384, 30 + fr() * 70, 1, fr() < .5 ? '14,24,46' : '120,136,168', .12);
      px.strokeStyle = 'rgba(8,14,30,.75)'; px.lineWidth = 5; for (let i = 16; i < 512; i += 30) { px.beginPath(); px.moveTo(i, 0); px.lineTo(i, 384); px.stroke(); } for (let i = 14; i < 384; i += 30) { px.beginPath(); px.moveTo(0, i); px.lineTo(512, i); px.stroke(); } for (let i = 0; i < 700; i++) { px.fillStyle = `rgba(182,186,190,${.08 + fr() * .2})`; px.fillRect(fr() * 512, fr() * 384, 1 + fr() * 7, 1 + fr() * 2); } }
    const BP = STD({ map: srgb(pc), roughness: .62, envMapIntensity: .4 }), BPS = STD({ color: 0x26406f, roughness: .6, envMapIntensity: .4 }), pal = grp(g, 0, 0, 0);
    box(pal, B[0], .035, B[1], BP, 0, .105, 0); for (const zz of [-.52, 0, .52]) box(pal, B[0] - .02, .03, .16, BPS, 0, 0, zz); for (const xx of [-.72, -.24, .24, .72]) for (const zz of [-.52, 0, .52]) box(pal, .15, .09, .15, BPS, xx, .02, zz);
    // canvas-tent cartons: kraft, brown tape down the seam, black print on the long faces, corners knocked pale, dirt low
    const [cc, cx] = can(512, 128); { cx.fillStyle = '#9d8460'; cx.fillRect(0, 0, 512, 128); for (let i = 0; i < 70; i++) { cx.strokeStyle = `rgba(72,52,30,${.05 + fr() * .07})`; cx.lineWidth = 1; const y = fr() * 128; cx.beginPath(); cx.moveTo(0, y); cx.lineTo(512, y + (fr() - .5) * 2); cx.stroke(); } for (let i = 0; i < 9; i++) soft(cx, fr() * 512, fr() * 128, 22 + fr() * 50, .6, fr() < .5 ? '60,44,28' : '196,172,132', .16);
      cx.fillStyle = 'rgba(28,24,20,.78)'; cx.font = 'bold 42px Arial'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('CANVAS TENT', 256, 70); cx.font = 'bold 15px Arial'; cx.fillText('THIS WAY UP', 76, 24); cx.fillText('5 m', 450, 24);
      for (let i = 0; i < 26; i++) { const a = fr() * 512; cx.fillStyle = `rgba(214,198,166,${.12 + fr() * .2})`; cx.fillRect(a, fr() < .5 ? 0 : 124, 8 + fr() * 40, 2 + fr() * 2); }   // rubbed edges
      for (const [a, b] of [[0, 0], [504, 0], [0, 118], [504, 118]]) { cx.fillStyle = 'rgba(212,194,160,.6)'; cx.fillRect(a, b, 8, 10); } const gg = cx.createLinearGradient(0, 128, 0, 60); gg.addColorStop(0, 'rgba(46,36,26,.4)'); gg.addColorStop(1, 'rgba(46,36,26,0)'); cx.fillStyle = gg; cx.fillRect(0, 60, 512, 68); for (let i = 0; i < 260; i++) { cx.fillStyle = `rgba(${fr() < .5 ? '52,40,28' : '196,184,160'},${.08 + fr() * .14})`; cx.fillRect(fr() * 512, fr() * 128, 1 + fr() * 2, 1 + fr() * 3); } }
    const [tc, tx] = can(256, 256); { tx.drawImage(cc, 0, 0, 40, 128, 0, 0, 256, 256); tx.fillStyle = 'rgba(112,82,48,.75)'; tx.fillRect(0, 108, 256, 40); tx.fillStyle = 'rgba(212,190,150,.2)'; tx.fillRect(0, 112, 256, 3); for (let i = 0; i < 900; i++) { tx.fillStyle = `rgba(186,176,156,${.05 + fr() * .1})`; tx.fillRect(fr() * 256, fr() * 256, 1 + fr() * 2, 1 + fr() * 2); } for (let i = 0; i < 12; i++) soft(tx, fr() * 256, fr() * 256, 30 + fr() * 60, 1, fr() < .5 ? '66,54,40' : '190,180,160', .14); }
    const CS = STD({ map: srgb(cc), roughness: .92, envMapIntensity: .3 }), CT2 = STD({ map: srgb(tc), roughness: .92, envMapIntensity: .3 }), CE = STD({ color: 0x9d8159, roughness: .92, envMapIntensity: .3 }), CM = [CE, CE, CT2, CT2, CS, CS];
    for (let l = 0; l < 2; l++) for (let c = 0; c < 2; c++) box(g, .78 - fr() * .012, .19, 1.16 - fr() * .012, CM, (c - .5) * .795 + (fr() - .5) * .014, .14 + l * .192, (fr() - .5) * .014, (fr() - .5) * .012);
    // two red ratchet straps round the stack and under the deck, ratchet on the aisle side
    const RED = STD({ color: 0xa8251f, roughness: .78 }), BK = STD({ color: 0x6f7377, metalness: .6, roughness: .46 }), H1 = .14 + 2 * .192;
    for (const xx of [-.42, .42]) { box(g, .05, .005, 1.2, RED, xx, H1 + .001, 0); for (const zz of [-.6, .6]) box(g, .05, H1 - .1, .005, RED, xx, .1, zz + Math.sign(zz) * .001); }
    { const r = grp(g, -.42, .36, .612); box(r, .058, .13, .022, BK, 0, 0, 0); box(r, .07, .018, .03, BK, 0, .135, 0); const h = cyl(r, .007, .075, BK, 0, .11, .018, 'x'); h.castShadow = true; box(r, .03, .1, .012, BK, 0, .02, .02); }
    // two batten-framed ply panels leaning on the stack's door-side edge: foot on the floor at x ≈ 16.5, top end over the stack, 0.8 m up
    const [ply, lx] = can(512, 384); { lx.fillStyle = '#a0917a'; lx.fillRect(0, 0, 512, 384); for (let i = 0; i < 330; i++) { const y = fr() * 384; lx.strokeStyle = `rgba(${fr() < .75 ? '62,48,34' : '205,190,165'},${.04 + fr() * .1})`; lx.lineWidth = .6 + fr() * .8; lx.beginPath(); lx.moveTo(fr() * 200, y); lx.lineTo(300 + fr() * 212, y + (fr() - .5) * 6); lx.stroke(); }
      for (let n = 0; n < 5; n++) { const a = fr() * 512, b = fr() * 384; lx.fillStyle = 'rgba(190,172,142,.34)'; lx.beginPath(); lx.ellipse(a, b, 13, 5, 0, 0, 7); lx.fill(); } for (let i = 0; i < 24; i++) soft(lx, fr() * 512, fr() * 384, 18 + fr() * 60, .6, fr() < .6 ? '46,38,30' : '186,176,158', .1); const gr = lx.createLinearGradient(512, 0, 340, 0); gr.addColorStop(0, 'rgba(38,30,24,.6)'); gr.addColorStop(1, 'rgba(38,30,24,0)'); lx.fillStyle = gr; lx.fillRect(340, 0, 172, 384); }   // u 1 = the foot on the floor: dirt up from there
    const [bt, bx] = can(512, 64); { bx.fillStyle = '#ab9270'; bx.fillRect(0, 0, 512, 64); for (let i = 0; i < 80; i++) { bx.strokeStyle = `rgba(${fr() < .7 ? '66,50,34' : '200,186,160'},${.08 + fr() * .18})`; bx.lineWidth = .6 + fr(); const y = fr() * 64; bx.beginPath(); bx.moveTo(0, y); bx.bezierCurveTo(170, y + (fr() - .5) * 8, 340, y + (fr() - .5) * 8, 512, y); bx.stroke(); } }
    const PLY2 = STD({ map: srgb(ply), roughness: .96, envMapIntensity: .3 }), PIN = STD({ map: srgb(bt), roughness: .94, envMapIntensity: .3 }), SCRW = STD({ color: 0x6d675e, metalness: .45, roughness: .62 }), LEN = 1.75, WD = 1.1, A = Math.atan2(.8, 1.55);
    const lean = (dy, dz, ry) => { const q = grp(g, 16.5 - 14.55 - .02 + dy, 0, dz); q.rotation.set(0, ry, -A); const f = grp(q, 0, 0, 0); f.position.x = -LEN / 2; const pl = box(f, LEN, .012, WD, PLY2, 0, .045, 0);   // local +x runs down the slope to the foot; battens underneath, ply on top
      for (const s of [-1, 1]) { box(f, LEN, .045, .07, PIN, 0, 0, s * (WD - .07) / 2); box(f, .07, .045, WD - .14, PIN, s * (LEN - .07) / 2, 0, 0); } box(f, .07, .045, WD - .14, PIN, 0, 0, 0);
      for (const s of [-1, 1]) for (let i = 0; i < 9; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.0055, .0055, .003, 8), SCRW); c.position.set(-LEN / 2 + .08 + i * (LEN - .16) / 8, .058, s * (WD / 2 - .035)); f.add(c); } return pl; };
    lean(-.13, .005, .006); lean(0, -.012, -.01);
    // floor shadow: baked outline of the pallet and the panels' footprint, tight line at the foot, soft pool round it
    { const X0 = 13.75 - .5, Z0 = -13.1 - .5, PW = 3.75, PD = 2.2, K = 110, [c, x] = can(Math.round(PW * K), Math.round(PD * K)), rr = (m, a) => { x.fillStyle = `rgba(18,14,10,${a})`; x.beginPath(); x.roundRect((.5 - m) * K, (.5 - m) * K, (2.75 + 2 * m) * K, (1.2 + 2 * m) * K, m * K); x.fill(); };
      for (let m = .42; m > .02; m -= .03) rr(m, .035); rr(.03, .28);
      const s = new THREE.Mesh(new THREE.PlaneGeometry(PW, PD), new THREE.MeshBasicMaterial({ map: srgb(c), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })); s.rotation.x = -Math.PI / 2; s.position.set(X0 + PW / 2, .004, Z0 + PD / 2); s.renderOrder = 1; s.userData.keep = true; s.userData.noAO = true; P.add(s); }
    T(g, 'Tent cartons and leaning panels', 'A blue plastic pallet of flat CANVAS TENT cartons, two layers, red ratchet straps, with two batten-framed ply panels leaning on it: the kit the Yard in 3D page has on its racking, put where the LiDAR scan shows a flat block with a thin sheet leaning on one end. Block, slope and sizes are from the scan; what they really are is not known.', '≈ 1.6 × 1.2 × 0.52 m, panels ≈ 1.75 × 1.1 m (scan)', 'not sure'); }
  // ---- 3 Nov 01:xx (Josh's request "bring the yard in", step Y3d): the biggest thing the WW was missing by the door: a LiDAR block x 11.3–12.65, z −1.3…−3.15, flat top 1.0–1.1 m, nothing like it in the page.
  //      It is the yard's workbench to within the scan's error (model.js: 1.3 × 2.0 m on castors, top 1.07), so the bench goes here, not on the ply crate (that block is 0.92 m, solid to the floor). The scan's sides
  //      stop at ≈ 0.5 m on the aisle and far ends with empty floor below, and run to the floor on the yard-bay side and the door end, olive-grey with a paler dusty top: a sheet thrown over it. The sheet is not hand-modelled:
  //      bin/cloth_drape.js drops a 3 × 3.6 m tarp on the bench offline (drape_bench.json → drape_bench.b64, 8k verts), the page only loads the result. Own RNG, own materials, nothing else moves.
  { let sd = 5417; const fr = () => (sd = (sd * 16807) % 2147483647) / 2147483647, CX = 11.95, CZ = -2.225, W = 1.3, D = 1.85, TOP = 1.045, g = grp(P, CX, 0, CZ);
    const can = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }, srgb = (c, rep) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rep) t.repeat.set(...rep); return t; };
    const soft = (x, cx, cy, r, sq, col, a) => { x.save(); x.translate(cx, cy); x.scale(1, sq); const gr = x.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); x.fillStyle = gr; x.fillRect(-r, -r, 2 * r, 2 * r); x.restore(); };
    const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    // old dark-stained timber, grain along the canvas width
    const timber = (w, h, base, n) => { const [c, x] = can(w, h); x.fillStyle = base; x.fillRect(0, 0, w, h); for (let i = 0; i < n; i++) { const y = fr() * h, dy = (fr() - .5) * 7; x.strokeStyle = `rgba(30,21,13,${.1 + fr() * .2})`; x.lineWidth = .6 + fr() * 1.4; x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(w * .3, y + dy, w * .6, y - dy, w, y + (fr() - .5) * 5); x.stroke(); }
      for (let i = 0; i < 16; i++) soft(x, fr() * w, fr() * h, 12 + fr() * 50, .4, fr() < .6 ? '24,17,11' : '156,134,104', .14); for (let i = 0; i < 12; i++) { x.fillStyle = `rgba(182,160,126,${.18 + fr() * .25})`; x.fillRect(fr() * w, fr() * h, 2 + fr() * 14, 1 + fr() * 2); } return c; };
    const TB = STD({ map: srgb(timber(512, 64, '#65503a', 40)), roughness: .86, envMapIntensity: .45 }), TBUP = (() => { const c = timber(512, 64, '#5f4b37', 40), [r, x] = can(64, 512); x.translate(64, 0); x.rotate(Math.PI / 2); x.drawImage(c, 0, 0); return STD({ map: srgb(r), roughness: .86, envMapIntensity: .45 }); })();
    const PLYM = STD({ map: srgb(timber(512, 384, '#75614a', 70)), roughness: .84, envMapIntensity: .45 }), STL = STD({ color: 0x4a4c4e, metalness: .55, roughness: .55 }), RUB = STD({ color: 0x1b1b1c, roughness: .82 }), ZNC = STD({ color: 0x8f9396, metalness: .6, roughness: .5 });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const px = sx * (W / 2 - .05), pz = sz * (D / 2 - .05); box(g, .09, .91, .09, TBUP, px, .1, pz);
      box(g, .1, .006, .1, ZNC, px, .094, pz); for (const s2 of [-1, 1]) box(g, .004, .05, .05, ZNC, px + s2 * .021, .045, pz);   // castor: plate, fork, wheel with its axle bolt
      cyl(g, .042, .028, RUB, px, .043, pz, 'x', 18); cyl(g, .018, .03, ZNC, px, .043, pz, 'x', 10); cyl(g, .006, .052, STL, px, .043, pz, 'x', 8); }
    for (const yy of [.26, .9]) { for (const sz of [-1, 1]) box(g, W - .19, .09, .045, TB, 0, yy, sz * (D / 2 - .05)); for (const sx of [-1, 1]) box(g, .045, .09, D - .19, TB, sx * (W / 2 - .05), yy, 0); }   // rails, low and under the top
    box(g, W - .1, .018, D - .1, PLYM, 0, .35, 0); box(g, W - .05, .04, D - .05, PLYM, 0, TOP - .046, 0);   // shelf and ply top
    for (const zz of [-.4, .4]) box(g, W - .19, .09, .045, TB, 0, .9, zz);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const yy of [.3, .94]) cyl(g, .009, .012, ZNC, sx * (W / 2 + .001), yy, sz * (D / 2 - .05), 'x', 8);   // coach-bolt heads on the rails
    // the box section off the bench top (model.js), on the shelf: end caps show the hollow, a few a bit longer so they stick out at the far end
    { const [c, x] = can(32, 32); x.fillStyle = '#54585a'; x.fillRect(0, 0, 32, 32); x.fillStyle = '#0b0b0c'; x.fillRect(4, 4, 24, 24); const E = STD({ map: srgb(c), metalness: .15, roughness: .6 }), S1 = STD({ color: 0x777a7b, metalness: .2, roughness: .6, envMapIntensity: .6 }), S2 = STD({ color: 0x66696a, metalness: .2, roughness: .64, envMapIntensity: .6 });
      for (let r = 0; r < 3; r++) for (let k = 0; k < 7 - r; k++) { const L = 1.45 + fr() * .2, m = (k + r) % 2 ? S1 : S2; box(g, .05, .05, L, [m, m, m, m, E, E], -.4 + k * .054 + r * .027, .368 + r * .05, -.34 - fr() * .05); } }
    // two curved ply templates leaning on the far end (model.js's cut-outs)
    { const Sh = new THREE.Shape(); Sh.moveTo(0, 0); Sh.bezierCurveTo(.2, .3, .4, -.1, .6, .2); Sh.lineTo(.6, .45); Sh.bezierCurveTo(.4, .3, .2, .6, 0, .4); Sh.closePath(); const G = new THREE.ExtrudeGeometry(Sh, { depth: .018, bevelEnabled: false, curveSegments: 16 }), Mt = STD({ map: srgb(timber(256, 256, '#8f7a58', 36), [3, 3]), roughness: .84, envMapIntensity: .45 });
      for (const [xx, zz, tilt, r] of [[.02, -D / 2 - .13, .17, 0], [-.3, -D / 2 - .1, .13, .06]]) { const m = new THREE.Mesh(G, Mt); m.position.set(xx, .004, zz); m.rotation.set(tilt, r, 0, 'YXZ'); m.castShadow = m.receiveShadow = true; g.add(m); } }
    // the tarp: olive-grey proofed canvas (the scan's sides #625e4c, #726a53) gone pale and dusty on top (#a9a49a; that part goes in by vertex colour). 1 uv = the sheet, 3 × 3.6 m
    const [mc, mx] = can(1024, 1228), MW = 1024, MH = 1228; { mx.fillStyle = '#6e6a56'; mx.fillRect(0, 0, MW, MH); for (let i = 0; i < 130; i++) soft(mx, fr() * MW, fr() * MH, 50 + fr() * 200, .4 + fr() * .8, fr() < .5 ? '46,44,34' : '142,136,114', .13);
      for (let i = 0; i < 16; i++) { const cx = fr() * MW, cy = fr() * MH, r = 30 + fr() * 70; mx.strokeStyle = `rgba(60,56,44,${.04 + fr() * .05})`; mx.lineWidth = 3 + fr() * 3; mx.beginPath(); for (let k = 0; k <= 40; k++) { const a = k / 40 * 6.28, q = r * (1 + .2 * Math.sin(a * 3 + i)); mx.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q * .8); } mx.stroke(); }   // dried tide marks
      for (let i = 0; i < 26000; i++) { mx.fillStyle = `rgba(${fr() < .5 ? '38,36,28' : '160,154,132'},${.03 + fr() * .07})`; const L = fr() < .5; mx.fillRect(fr() * MW, fr() * MH, L ? 3 + fr() * 9 : 1, L ? 1 : 3 + fr() * 9); }   // slubs along warp and weft: what stops it reading as leather
      for (const t of [.25, .5, .75]) for (const [c1, o] of [['rgba(34,32,24,.12)', 0], ['rgba(150,144,122,.06)', 5]]) { mx.strokeStyle = c1; mx.lineWidth = 4; mx.beginPath(); mx.moveTo(0, MH * t + o); for (let k = 1; k <= 12; k++) mx.lineTo(MW * k / 12, MH * t + o + (fr() - .5) * 5); mx.stroke(); mx.beginPath(); mx.moveTo(MW * t + o, 0); for (let k = 1; k <= 14; k++) mx.lineTo(MW * t + o + (fr() - .5) * 5, MH * k / 14); mx.stroke(); }   // the creases from years folded in four
      const P2 = MW / 3, hem = .035 * P2, sp = (a, b, c, e) => { const L = Math.hypot(c - a, e - b), n = Math.floor(L / 5.5), dx = (c - a) / L, dy = (e - b) / L; mx.fillStyle = 'rgba(150,144,120,.5)'; for (let i = 0; i < n; i++) { mx.save(); mx.translate(a + dx * i * 5.5, b + dy * i * 5.5); mx.rotate(Math.atan2(dy, dx)); mx.fillRect(0, -.6, 3.6, 1.2); mx.restore(); } };
      mx.fillStyle = 'rgba(32,30,22,.3)'; for (const [a, b, c, e] of [[0, 0, MW, hem], [0, MH - hem, MW, hem], [0, 0, hem, MH], [MW - hem, 0, hem, MH]]) mx.fillRect(a, b, c, e); mx.fillStyle = 'rgba(138,132,110,.2)'; mx.fillRect(hem + 2, hem + 2, MW - 2 * hem - 4, 2); mx.fillRect(hem + 2, MH - hem - 4, MW - 2 * hem - 4, 2);
      for (const d of [hem * .25, hem * .85]) { sp(d, d, MW - d, d); sp(d, MH - d, MW - d, MH - d); sp(d, d, d, MH - d); sp(MW - d, d, MW - d, MH - d); }
      const ey = (cx, cy) => { soft(mx, cx, cy, 14, 1, '24,20,14', .4); mx.strokeStyle = '#a58d52'; mx.lineWidth = 3.2; mx.beginPath(); mx.arc(cx, cy, 6.5, 0, 7); mx.stroke(); mx.fillStyle = '#0c0b09'; mx.beginPath(); mx.arc(cx, cy, 4.8, 0, 7); mx.fill(); soft(mx, cx, cy + 16, 14, 2.2, '40,28,16', .3); };   // brass eyelet, its rust tear below
      for (let i = 0; i <= 6; i++) { const q = hem * .55 + i * (MW - hem * 1.1) / 6; ey(q, hem * .55); ey(q, MH - hem * .55); } for (let i = 1; i < 7; i++) { const q = hem * .55 + i * (MH - hem * 1.1) / 7; ey(hem * .55, q); ey(MW - hem * .55, q); }
      { const a = 300, b = 860, w = 120, h = 88; mx.save(); mx.translate(a, b); mx.rotate(.07); mx.fillStyle = 'rgba(82,78,62,.8)'; mx.fillRect(0, 0, w, h); mx.strokeStyle = 'rgba(24,22,16,.35)'; mx.lineWidth = 3; mx.strokeRect(0, 0, w, h); mx.setLineDash([3.6, 2]); mx.strokeStyle = 'rgba(150,144,120,.5)'; mx.lineWidth = 1.2; mx.strokeRect(5, 5, w - 10, h - 10); mx.setLineDash([]); mx.restore(); } }   // a patched rip
    const [wc, wx] = can(128, 128); { const im = wx.createImageData(128, 128), d = im.data; for (let j = 0; j < 128; j++) for (let i = 0; i < 128; i++) { const over = ((i >> 2) + (j >> 2)) & 1, f = over ? i & 3 : j & 3, v = 112 + 42 * Math.sin((f + .5) / 4 * Math.PI) + (over ? 9 : -9) + (fr() - .5) * 14, k = (j * 128 + i) * 4; d[k] = d[k + 1] = d[k + 2] = v; d[k + 3] = 255; } wx.putImageData(im, 0, 0); }
    const WV = new THREE.CanvasTexture(wc); WV.wrapS = WV.wrapT = THREE.RepeatWrapping; WV.repeat.set(20, 24); WV.anisotropy = 4;
    const CL = STD({ map: srgb(mc), vertexColors: true, bumpMap: WV, bumpScale: 1.0, roughness: .95, envMapIntensity: .42, side: THREE.DoubleSide });
    const raw = atob('__DRAPE_BENCH__'), B = new Uint8Array(raw.length); for (let i = 0; i < raw.length; i++) B[i] = raw.charCodeAt(i); const dv = new DataView(B.buffer), nx = dv.getUint16(0, true), nz = dv.getUint16(2, true), I = new Float32Array(nx * nz * 3); for (let k = 0; k < I.length; k++) I[k] = dv.getInt16(4 + k * 2, true) / 1000;
    // twice as many rows and columns (Catmull-Rom), so silhouettes and folds stay smooth up close; then crease shading from the shape itself: blurred copy minus the sheet = how far down a fold this point is
    const cr = (a, b, c, e, t) => .5 * ((2 * b) + (c - a) * t + (2 * a - 5 * b + 4 * c - e) * t * t + (3 * b - a - 3 * c + e) * t * t * t), NX = nx * 2 - 1, NZ = nz * 2 - 1, O = new Float32Array(NX * NZ * 3), cl = (v, n) => Math.max(0, Math.min(n - 1, v));
    for (let a = 0; a < 3; a++) { const R = new Float32Array(NX * nz); for (let j = 0; j < nz; j++) for (let i = 0; i < NX; i++) { const i0 = i >> 1, t = (i & 1) / 2, q = k => I[(j * nx + cl(k, nx)) * 3 + a]; R[j * NX + i] = cr(q(i0 - 1), q(i0), q(i0 + 1), q(i0 + 2), t); }
      for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const j0 = j >> 1, t = (j & 1) / 2, q = k => R[cl(k, nz) * NX + i]; O[(j * NX + i) * 3 + a] = cr(q(j0 - 1), q(j0), q(j0 + 1), q(j0 + 2), t); } }
    for (let k = 1; k < O.length; k += 3) O[k] = Math.max(.004, O[k]);
    const idx = [], uv = new Float32Array(NX * NZ * 2); for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { uv[(j * NX + i) * 2] = i / (NX - 1); uv[(j * NX + i) * 2 + 1] = 1 - j / (NZ - 1); if (i < NX - 1 && j < NZ - 1) { const a = j * NX + i, b = a + 1, c = a + NX, e = c + 1; idx.push(a, c, b, b, c, e); } }
    const Gm = new THREE.BufferGeometry(); Gm.setAttribute('position', new THREE.BufferAttribute(O, 3)); Gm.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); Gm.setIndex(idx); Gm.computeVertexNormals(); const Nm = Gm.attributes.normal.array;
    { let S = O.slice(); const T0 = new Float32Array(S.length), RAD = 7; for (let pass = 0; pass < 2; pass++) { for (let a = 0; a < 3; a++) { for (let j = 0; j < NZ; j++) { let s = 0; for (let i = -RAD; i <= RAD; i++) s += S[(j * NX + cl(i, NX)) * 3 + a]; for (let i = 0; i < NX; i++) { T0[(j * NX + i) * 3 + a] = s / (2 * RAD + 1); s += S[(j * NX + cl(i + RAD + 1, NX)) * 3 + a] - S[(j * NX + cl(i - RAD, NX)) * 3 + a]; } }
          for (let i = 0; i < NX; i++) { let s = 0; for (let j = -RAD; j <= RAD; j++) s += T0[(cl(j, NZ) * NX + i) * 3 + a]; for (let j = 0; j < NZ; j++) { S[(j * NX + i) * 3 + a] = s / (2 * RAD + 1); s += T0[(cl(j + RAD + 1, NZ) * NX + i) * 3 + a] - T0[(cl(j - RAD, NZ) * NX + i) * 3 + a]; } } } }
      const col = new Float32Array(O.length); for (let q = 0; q < O.length; q += 3) { const nxv = Nm[q], nyv = Nm[q + 1], nzv = Nm[q + 2], f = nyv < 0 ? -1 : 1, dd = ((O[q] - S[q]) * nxv + (O[q + 1] - S[q + 1]) * nyv + (O[q + 2] - S[q + 2]) * nzv) * f, cre = Math.max(.42, Math.min(1.14, 1 + 5.2 * dd)), y = O[q + 1], up = ss(.55, .95, Math.abs(nyv)) * ss(.2, .9, y), low = .74 + .26 * ss(0, .22, y), d = .76 * (1 + .52 * up) * cre * low; col[q] = d * (1 + .03 * up); col[q + 1] = d * (1 + .03 * up); col[q + 2] = d * (1 + .1 * up); }
      Gm.setAttribute('color', new THREE.BufferAttribute(col, 3)); }
    const me = new THREE.Mesh(Gm, CL); me.position.set(-CX, 0, -CZ); me.castShadow = me.receiveShadow = true; me.userData.keep = true; g.add(me);
    // floor shadow: the dark under the bench, a soft pool round the footprint, dark where the cloth lies on or near the slab, a tight dab under each castor
    { const X0 = 10.4, Z0 = -4.2, PW = 3.8, PD = 4.4, K = 80, [c, x] = can(Math.round(PW * K), Math.round(PD * K)), RX = (11.3 - X0) * K, RZ = (-3.15 - Z0) * K, RW = 1.3 * K, RD = 1.85 * K;
      for (let m = .46; m > 0; m -= .023) { x.fillStyle = 'rgba(14,11,8,.038)'; x.beginPath(); x.roundRect(RX - m * K, RZ - m * K, RW + 2 * m * K, RD + 2 * m * K, (m + .03) * K); x.fill(); }
      for (let q = 0; q < I.length; q += 9) { const y = I[q + 1]; if (y < .16) soft(x, (I[q] - X0) * K, (I[q + 2] - Z0) * K, 8 + y * 40, 1, '14,11,8', .1); }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) soft(x, (CX + sx * (W / 2 - .05) - X0) * K, (CZ + sz * (D / 2 - .05) - Z0) * K, 11, 1, '10,8,6', .75);
      const s = new THREE.Mesh(new THREE.PlaneGeometry(PW, PD), new THREE.MeshBasicMaterial({ map: srgb(c), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })); s.rotation.x = -Math.PI / 2; s.position.set(X0 + PW / 2, .004, Z0 + PD / 2); s.renderOrder = 1; s.userData.keep = true; s.userData.noAO = true; P.add(s); }
    T(g, 'Workbench under a tarp', 'The yard\'s timber workbench on castors, by the roller door, with a stained olive canvas thrown over it, box section on the shelf and two curved ply templates against the far end. Size and spot are from the LiDAR scan (a flat 1.0–1.1 m top, the sheet stopping at about 0.5 m on the aisle and far sides). That it is the same bench as the yard photos, and what is under the sheet, is a guess.', '≈ 1.3 × 1.85 m · top ≈ 1.05 m (scan)', 'not sure'); }
  // ---- 4 Nov 01:xx (Josh's request "bring the yard in", step Y4 part 2): the yard's broom pole leaning on a beam (model.js). The LiDAR shows a slim 0.3 m wide item leaning on the run's front beam
  //      by the upright at z −3.13: foot at x ≈ 18.0, top on the beam at ≈ 1.6 m, beige low, grey higher up (#9c9281 / #9c968c). Nobody had built it, so: a weathered scaffold board there, and the broom beside it.
  //      Own RNG (5417), own materials: nothing else moves.
  { let sd = 5417; const fr = () => (sd = (sd * 16807) % 2147483647) / 2147483647, g = grp(P);
    const texOf = (w, h, draw, rep) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); } return t; };
    const blob = (w, d, x, z, ry, o) => { const c = document.createElement('canvas'); c.width = c.height = 96; const y = c.getContext('2d'), gr = y.createRadialGradient(48, 48, 4, 48, 48, 47); gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(.5, 'rgba(0,0,0,.27)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); y.fillStyle = gr; y.fillRect(0, 0, 96, 96);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, opacity: o, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })); m.rotation.set(-Math.PI / 2, 0, ry); m.position.set(x, .004, z); g.add(m); };
    // --- scaffold board: 225 × 38 mm, 1.95 m, grey weathered at the top, dirtier beige at the foot where it stands in the wet; hoop-iron bands nailed round both ends
    const L = 1.95, W = .225, Th = .038, bx = 18.02, bz = -3.275, lean = Math.atan2(18.375 - Th / 2 - bx, 1.62);
    const face = texOf(160, 1024, (x, w, h) => { const gr = x.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, '#8c7f68'); gr.addColorStop(.3, '#a2957e'); gr.addColorStop(.62, '#9a9486'); gr.addColorStop(1, '#8e8c86'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) { const u = fr() * w, a = .05 + fr() * .17; x.strokeStyle = `rgba(${fr() < .75 ? '48,42,34' : '205,200,188'},${a})`; x.lineWidth = .6 + fr() * 1.7; x.beginPath(); let px = u; x.moveTo(px, 0); for (let v = 0; v <= h; v += 64) { px += (fr() - .5) * 3.4; x.lineTo(px, v); } x.stroke(); }
      for (let i = 0; i < 4; i++) { const kx = 18 + fr() * (w - 36), ky = 80 + fr() * (h - 160), ks = 5 + fr() * 6; x.fillStyle = 'rgba(46,36,26,.75)'; x.beginPath(); x.ellipse(kx, ky, ks, ks * 1.5, 0, 0, 7); x.fill(); for (let r = 1; r < 5; r++) { x.strokeStyle = 'rgba(52,42,32,.13)'; x.lineWidth = 1; x.beginPath(); x.ellipse(kx, ky, ks * (1 + r * .3), ks * (1.5 + r * 1.7), 0, 0, 7); x.stroke(); } }
      for (let i = 0; i < 26; i++) { x.fillStyle = `rgba(232,228,216,${.1 + fr() * .3})`; x.beginPath(); x.ellipse(fr() * w, fr() * h, 1 + fr() * 5, 1 + fr() * 3, fr() * 3, 0, 7); x.fill(); }   // old paint and plaster spots
      for (let i = 0; i < 2; i++) { const sy = fr() * h * .7; x.strokeStyle = 'rgba(30,24,18,.55)'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(w * (.2 + fr() * .6), sy); x.lineTo(w * (.3 + fr() * .4), sy + 120 + fr() * 120); x.stroke(); }   // drying checks
      const f = x.createLinearGradient(0, h, 0, h - 170); f.addColorStop(0, 'rgba(38,30,22,.6)'); f.addColorStop(1, 'rgba(38,30,22,0)'); x.fillStyle = f; x.fillRect(0, h - 170, w, 170);   // wet dirt up from the foot
      const e = x.createLinearGradient(0, 0, w, 0); e.addColorStop(0, 'rgba(30,25,20,.32)'); e.addColorStop(.09, 'rgba(30,25,20,0)'); e.addColorStop(.91, 'rgba(30,25,20,0)'); e.addColorStop(1, 'rgba(30,25,20,.32)'); x.fillStyle = e; x.fillRect(0, 0, w, h); });
    const edge = texOf(32, 512, (x, w, h) => { x.fillStyle = '#857a69'; x.fillRect(0, 0, w, h); for (let i = 0; i < 26; i++) { x.fillStyle = `rgba(35,28,22,${.1 + fr() * .3})`; x.fillRect(0, fr() * h, w, 1 + fr() * 6); } }), endg = STD({ color: 0x6d604f, roughness: .95 }), faceM = STD({ map: face, roughness: .92 }), edgeM = STD({ map: edge, roughness: .92 });
    const brd = grp(g, bx, Th / 2 * Math.sin(lean), bz); brd.rotation.z = -lean;
    const bm = new THREE.Mesh(new THREE.BoxGeometry(Th, L, W), [faceM, faceM, endg, endg, edgeM, edgeM]); bm.position.y = L / 2; bm.castShadow = bm.receiveShadow = true; brd.add(bm);
    const hoop = STD({ color: 0x8f9293, roughness: .5, metalness: .55 }), nail = STD({ color: 0x4e4a45, roughness: .6, metalness: .4 });
    for (const yy of [.075, L - .075]) { for (const sx of [-1, 1]) { box(brd, .0016, .03, W + .004, hoop, sx * (Th / 2 + .0008), yy, 0); for (const dz of [-.08, 0, .08]) cyl(brd, .0034, .0012, nail, sx * (Th / 2 + .002), yy + .015, dz, 'x', 6); } for (const sz of [-1, 1]) box(brd, Th + .004, .03, .0016, hoop, 0, yy, sz * (W / 2 + .0008)); }
    blob(.56, .5, bx - .03, bz, 0, .95); blob(.2, .3, bx + .01, bz, 0, 1);
    // --- yard broom: stiff bassine head on the floor, timber stock, ash handle up to the same beam
    const hx = 17.97, hz = -3.62, topY = 1.63, hTop = new THREE.Vector3(18.375 - .0145, topY, hz + .025), hBot = new THREE.Vector3(hx, .125, hz), dir = hTop.clone().sub(hBot), Ln = dir.length() + .05; dir.normalize();
    const hand = texOf(32, 768, (x, w, h) => { x.fillStyle = '#c9ab7c'; x.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) { x.fillStyle = `rgba(112,78,44,${.08 + fr() * .2})`; x.fillRect(fr() * w, 0, .6 + fr() * 1.6, h); }
      const d = x.createLinearGradient(0, 0, 0, 300); d.addColorStop(0, 'rgba(72,48,28,.2)'); d.addColorStop(.12, 'rgba(70,46,26,.6)'); d.addColorStop(.72, 'rgba(70,46,26,.5)'); d.addColorStop(1, 'rgba(70,46,26,0)'); x.fillStyle = d; x.fillRect(0, 0, w, 300);   // dark and polished where hands go
      const b = x.createLinearGradient(0, h - 200, 0, h); b.addColorStop(0, 'rgba(60,50,40,0)'); b.addColorStop(1, 'rgba(60,50,40,.5)'); x.fillStyle = b; x.fillRect(0, h - 200, w, 200); for (let i = 0; i < 9; i++) { x.fillStyle = `rgba(40,30,22,${.2 + fr() * .3})`; x.fillRect(0, h - fr() * 420, w, 1 + fr() * 2); } });
    const hm = new THREE.Mesh(new THREE.CylinderGeometry(.0135, .0145, Ln, 12), STD({ map: hand, roughness: .55 })); hm.position.copy(hBot).addScaledVector(dir, Ln / 2); hm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); hm.castShadow = hm.receiveShadow = true; g.add(hm);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(.0135, 10, 6), hm.material); cap.scale.y = .5; cap.position.copy(hBot).addScaledVector(dir, Ln); cap.quaternion.copy(hm.quaternion); g.add(cap);
    const head = grp(g, hx, 0, hz, .34), sw = .42, sd2 = .068, sh = new THREE.Shape(), r = .03, a = sw / 2, b = sd2 / 2;   // stock turned a little off square to the rack, as a dropped broom sits
    sh.moveTo(-a + r, -b); sh.lineTo(a - r, -b); sh.quadraticCurveTo(a, -b, a, -b + r); sh.lineTo(a, b - r); sh.quadraticCurveTo(a, b, a - r, b); sh.lineTo(-a + r, b); sh.quadraticCurveTo(-a, b, -a, b - r); sh.lineTo(-a, -b + r); sh.quadraticCurveTo(-a, -b, -a + r, -b);
    const sg = new THREE.ExtrudeGeometry(sh, { depth: .026, bevelEnabled: true, bevelSize: .005, bevelThickness: .005, bevelSegments: 2, steps: 1 }); sg.rotateX(-Math.PI / 2); sg.translate(0, .096, 0);
    const stockTex = texOf(256, 64, (x, w, h) => { x.fillStyle = '#7f6a50'; x.fillRect(0, 0, w, h); for (let i = 0; i < 26; i++) { x.strokeStyle = `rgba(52,38,24,${.1 + fr() * .25})`; x.lineWidth = .7 + fr() * 1.6; x.beginPath(); let yy = fr() * h; x.moveTo(0, yy); for (let k = 1; k <= 6; k++) x.lineTo(k * w / 6, yy += (fr() - .5) * 4); x.stroke(); } for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(${fr() < .7 ? '36,30,24' : '150,144,130'},${.08 + fr() * .22})`; x.fillRect(fr() * w, fr() * h, 2 + fr() * 12, 1 + fr() * 3); } });
    stockTex.wrapS = stockTex.wrapT = THREE.RepeatWrapping; stockTex.repeat.set(2.4, 7); const stock = new THREE.Mesh(sg, STD({ map: stockTex, roughness: .72 })); stock.castShadow = stock.receiveShadow = true; head.add(stock);
    box(head, sw - .05, .012, sd2 - .022, STD({ color: 0x17120e, roughness: 1 }), 0, .086, 0);   // the dark of the tufts' roots under the stock
    const tuft = new THREE.CylinderGeometry(.0052, .0032, .092, 5, 1); tuft.translate(0, -.046, 0); const NR = 5, NC = 30, bri = new THREE.InstancedMesh(tuft, STD({ color: 0xffffff, roughness: .78 }), NR * NC * 2), mt = new THREE.Object3D(), tc = new THREE.Color(); let bi = 0;
    for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) for (let k = 0; k < 2; k++) { const u = (j + .5) / NC * 2 - 1, v = (i + .5) / NR * 2 - 1; mt.position.set(u * (sw / 2 - .02) + (fr() - .5) * .01, .092, v * (sd2 / 2 - .009) + (fr() - .5) * .006);
      const worn = .84 + .16 * (1 - Math.abs(u)) * fr(); mt.rotation.set(v * .17 + (fr() - .5) * .16, 0, -u * .17 + (fr() - .5) * .14); mt.scale.set(1, worn + .06 * fr(), 1); mt.updateMatrix(); bri.setMatrixAt(bi, mt.matrix);
      const t = .08 + fr() * .14, d = fr(); tc.setRGB(t * 1.25 + (d < .12 ? .16 : 0), t * .95 + (d < .12 ? .13 : 0), t * .7 + (d < .12 ? .08 : 0), THREE.SRGBColorSpace); bri.setColorAt(bi++, tc); }
    bri.castShadow = true; bri.receiveShadow = true; head.add(bri);
    const clip = STD({ color: 0x7d8083, roughness: .45, metalness: .6 }), scr = STD({ color: 0x44413c, roughness: .5, metalness: .5 });   // pressed steel socket holding the handle, two screws
    const sock = new THREE.Mesh(new THREE.CylinderGeometry(.0165, .021, .075, 12), clip); sock.position.copy(hBot).addScaledVector(dir, .05); sock.quaternion.copy(hm.quaternion); sock.castShadow = true; g.add(sock); const pad = new THREE.Mesh(new THREE.CylinderGeometry(.036, .04, .007, 14), clip); pad.position.set(hx, .131, hz); g.add(pad); for (const dx of [-.026, .026]) { const q = cyl(head, .0042, .003, scr, dx, .136, 0, 'y', 8); }
    blob(.62, .24, hx - .005, hz, .34, 1); blob(.46, .1, hx, hz, .34, .9);
    T(g, 'Board and yard broom', 'A weathered scaffold board and a stiff yard broom leaning on the racking\'s front beam by the upright. The LiDAR shows a slim 0.3 m wide item leaning here, beige low down and grey higher up, so something does lean here: that it\'s a board is a guess. The broom is the yard\'s, from the Yard in 3D page; it\'s too thin for the scan to show.', 'board ≈ 1.95 m × 225 mm · broom ≈ 1.6 m', 'not sure'); }
  // ---- 2 Nov 06:xx (Josh's request "bring the yard in", step Y3c part 2): the LiDAR's low rounded heap on the yard-bay floor: x 14.0–15.25, z −10.65…−11.7, ≈ 0.3 m high, 0.42 at its back left, soft edges, tan
  //      (#858064 median, up to #ab9f93) with a darker taupe sheet down its −x side and a blue-grey sheet on its door side, low at x 14.7–15.1. Reads as folded canvas or tarp. Own RNG, own materials, nothing else moves.
  { let sd = 5521; const fr = () => (sd = (sd * 16807) % 2147483647) / 2147483647, RY = -.2, g = grp(P, 14.62, 0, -11.17, RY);
    const can = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }, srgb = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
    const soft = (x, cx, cy, r, sq, col, a) => { x.save(); x.translate(cx, cy); x.scale(1, sq); const gr = x.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); x.fillStyle = gr; x.fillRect(-r, -r, 2 * r, 2 * r); x.restore(); };
    // canvas: tan cloth, broad grubby patches, dried tide marks, fold lines; 1 uv = 1 m, the tile spreads over 1.4 m so nothing repeats on the heap
    const [mc, mx] = can(512, 512); { mx.fillStyle = '#857859'; mx.fillRect(0, 0, 512, 512); for (let i = 0; i < 60; i++) soft(mx, fr() * 512, fr() * 512, 40 + fr() * 120, .4 + fr() * .6, fr() < .62 ? '52,44,32' : '186,174,146', .17);
      for (let i = 0; i < 12; i++) { mx.strokeStyle = `rgba(52,44,32,${.05 + fr() * .05})`; mx.lineWidth = 3 + fr() * 7; mx.lineCap = 'round'; mx.beginPath(); let a = fr() * 512, b = fr() * 512; mx.moveTo(a, b); for (let k = 0; k < 4; k++) mx.lineTo(a += 40 + fr() * 50, b += (fr() - .5) * 20); mx.stroke(); }
      for (let i = 0; i < 2600; i++) { mx.fillStyle = `rgba(${fr() < .5 ? '60,50,38' : '222,212,190'},${.05 + fr() * .09})`; mx.fillRect(fr() * 512, fr() * 512, 1 + fr() * 2, 1 + fr() * 2); } }
    const [wc, wx] = can(128, 128); { const im = wx.createImageData(128, 128), d = im.data; for (let j = 0; j < 128; j++) for (let i = 0; i < 128; i++) { const over = ((i >> 2) + (j >> 2)) & 1, f = over ? i & 3 : j & 3, v = 112 + 42 * Math.sin((f + .5) / 4 * Math.PI) + (over ? 9 : -9) + (fr() - .5) * 14, k = (j * 128 + i) * 4; d[k] = d[k + 1] = d[k + 2] = v; d[k + 3] = 255; } wx.putImageData(im, 0, 0); }
    const MAP = srgb(mc), WV = new THREE.CanvasTexture(wc); MAP.repeat.set(.7, .7); WV.wrapS = WV.wrapT = THREE.RepeatWrapping; WV.repeat.set(5, 5); WV.anisotropy = 4;
    const TAN = STD({ map: MAP, vertexColors: true, bumpMap: WV, bumpScale: .4, roughness: .96, envMapIntensity: .28 }), TAUPE = STD({ map: MAP, color: 0xb4a8a8, bumpMap: WV, bumpScale: .22, roughness: .96, envMapIntensity: .28, side: THREE.DoubleSide }), PVC = STD({ color: 0x66737e, roughness: .66, envMapIntensity: .4, side: THREE.DoubleSide });
    const lump = (x, z) => .085 * Math.exp(-(((x + .14) ** 2) / .16 + ((z + .28) ** 2) / .05)) + .012 * Math.sin(x * 3.3 + 1) * Math.sin(z * 4.1 + .4), N = 6, spow = (c, e) => Math.sign(c) * Math.abs(c) ** e;
    // the heap is ONE skin, no hidden faces: a loft from the floor up, each layer a bull-nosed fold edge with a groove under it, then one fine top. Stacked closed slabs cut each other in saw-teeth and specks.
    // The outline is even by arc length (stepping the angle evenly leaves 25 % jumps along the straight sides). UV is a sheared top projection, so the cloth has no seams. Grooves are baked into vertex colour; userData.keep because the page's static merge drops that attribute (the cloth went black).
    const NT = 170, W0 = 1.24, D0 = .95, H = .068, STEP = .055, OL = [], LY = []; { const D = [], M2 = 6000; let L = 0; for (let k = 0; k <= M2; k++) { const t = k / M2 * Math.PI * 2, px = spow(Math.cos(t), .3) * W0 / 2, pz = spow(Math.sin(t), .3) * D0 / 2; if (k) L += Math.hypot(px - D[k - 1][0], pz - D[k - 1][1]); D.push([px, pz, L]); } for (let j = 0, k = 0; j < NT; j++) { const a = j / NT * L; while (D[k][2] < a) k++; OL.push(D[k]); } }
    for (let i = 0; i < N; i++) { const t = i / (N - 1), sh = i > 3 ? (i - 3) * .05 : 0; LY.push({ w: 1 - (t * .05 + sh) / W0 + (fr() - .5) * .02, d: 1 - (t * .04 + sh * 1.5) / D0 + (fr() - .5) * .02, ox: (fr() - .5) * .06 - sh * .3, oz: (fr() - .5) * .05 - sh * .8, ph: fr() * 6 }); }
    { const R = []; for (let i = 0; i < N; i++) for (let k = 0; k <= 12; k++) { if (i && k < 3) continue; const a = -Math.PI / 2 + k / 12 * Math.PI, r = H / 2, ins = r * (1 - Math.cos(a)); R.push([i + k / 12 * .999, ins, i * STEP + r + r * Math.sin(a), .5 + .5 * Math.min(1, Math.max(0, (k - (i ? 3 : 0)) / 8) ** 1.3)]); }
      const CAP = 40, topI = N - 1 + .999, RR = R; for (let k = 1; k <= CAP; k++) RR.push([topI, -k / CAP, (N - 1) * STEP + H, 1]);   // ins < 0: fraction of the way in to the middle
      const pos = [], uv = [], idx = [], col = []; const lay = q => { const a = Math.min(N - 1, Math.floor(q)), b = Math.min(N - 1, a + 1), f = q - a, s = f * f * (3 - 2 * f), L0 = LY[a], L1 = LY[b], m = k => L0[k] + (L1[k] - L0[k]) * s; return { w: m('w'), d: m('d'), ox: m('ox'), oz: m('oz'), ph: L0.ph + (L1.ph - L0.ph) * s }; };
      for (let i = 0; i < RR.length; i++) { const [q, ins, y, dk] = RR[i], Lq = lay(q), tq = Math.min(1, q / (N - 1)); for (let j = 0; j < NT; j++) { const t = j / NT * Math.PI * 2; let sx, sz; if (ins < 0) sx = sz = (1 + ins) * .94; else { sx = 1 - 2 * ins / (W0 * Lq.w); sz = 1 - 2 * ins / (D0 * Lq.d); } let X = OL[j][0] * Lq.w * sx + Lq.ox, Z = OL[j][1] * Lq.d * sz + Lq.oz, ph = Lq.ph;
          X += .034 * Math.sin(Z * 3.1 + ph) + .009 * Math.sin(Z * 9.7 + ph * 2) + (ins >= 0 ? .012 * Math.sin(t * 5 + ph * 2) + .005 * Math.sin(t * 13 + ph) : 0); Z += .03 * Math.sin(X * 2.7 + ph * 1.7) + .008 * Math.sin(X * 8.3 + ph) + (ins >= 0 ? .012 * Math.sin(t * 7 + ph) : 0);
          const Y = y + (ins >= 0 ? .006 * Math.sin(t * 6 + q * .9) * Math.min(1, q * 2) : 0) + tq * lump(X, Z) + .005 * Math.sin(X * 13 + ph) * Math.sin(Z * 11 + ph) + (ins < 0 ? -.009 * Math.exp(-(((X + Z * .12 - .19) / .03) ** 2)) - .007 * Math.exp(-(((Z + X * .1 + .08) / .03) ** 2)) : 0); pos.push(X, Math.max(.002, Y), Z); uv.push(X + Y * .7, Z + Y * .7); col.push(dk, dk, dk); } }
      for (let i = 0; i < RR.length - 1; i++) for (let j = 0; j < NT; j++) { const a = i * NT + j, b = i * NT + (j + 1) % NT, c = a + NT, e = b + NT; idx.push(a, c, b, b, c, e); }
      const q = new THREE.BufferGeometry(); q.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); q.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); q.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); q.setIndex(idx); q.computeVertexNormals(); const me = new THREE.Mesh(q, TAN); me.castShadow = me.receiveShadow = true; me.userData.keep = true; g.add(me); }
    // a free sheet (u across, v down): f(u, v) gives the point; the hem is a thin tube along v = 1 so the cloth has an edge
    const sheet = (nu, nv, f, m) => { const q = new THREE.PlaneGeometry(1, 1, nu, nv), p = q.attributes.position, uv = q.attributes.uv; for (let i = 0; i < p.count; i++) { const u = uv.getX(i), v = 1 - uv.getY(i), [X, Y, Z] = f(u, v); p.setXYZ(i, X, Y, Z); uv.setXY(i, X + Y * .7, Z + Y * .7); } q.computeVertexNormals(); const me = new THREE.Mesh(q, m); me.castShadow = me.receiveShadow = true; g.add(me);
      const pts = []; for (let k = 0; k <= nu; k++) pts.push(new THREE.Vector3(...f(k / nu, 1))); const hem = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), nu * 2, .0045, 6), m); hem.castShadow = true; g.add(hem); return me; };
    // the darker top sheet: lies over the heap's back left and hangs down its −x side in slack folds, as the scan's taupe band
    const top = (x, z) => .343 + lump(x, z);
    sheet(40, 34, (u, v) => { const z = -.36 + u * .68, fold = Math.sin(z * 13 + 1) * .011 + Math.sin(z * 29 + 2) * .004, L = .34 + .1 * Math.sin(z * 4 + .6) + .02 * Math.sin(z * 19), xE = -.585, d = v * 1.02; let X, Y;
      if (d < .5) { X = xE + .5 - d; Y = top(X, z) + .02 + .004 * Math.sin(X * 14 + z * 6); } else { const a = Math.min(1, (d - .5) / .13) * Math.PI / 2, Yt = top(xE, z) + .02; X = xE - .075 * Math.sin(a); Y = Yt - .075 * (1 - Math.cos(a)); if (d > .63) { const q = Math.min((d - .63) / .39, 1); Y -= q * L * .86; X -= .012 * q; } X -= fold * Math.min(1, Math.max(0, (d - .4) / .3)); }
      return [X, Math.max(.004, Y), z + fold * .3]; }, TAUPE);
    // the blue-grey sheet tucked between the folds on the door side, hanging to the floor at x ≈ 14.7–15.1 (a tarp or groundsheet?)
    sheet(44, 20, (u, v) => { const x = .1 + u * .48 + (u - .5) * .06 * v, fold = Math.sin(x * 21 + 2) * .016 + Math.sin(x * 47) * .005, sag = .018 * Math.sin(u * Math.PI); return [x, Math.max(.003, (.228 + .03 * Math.sin(x * 7) - sag) * (1 - v) + .01 * Math.sin(x * 15) * v * (1 - v) * 4 + (v > .93 ? 0 : 0)), .43 + .095 * Math.min(1, v * 3) ** .7 + fold * Math.min(1, v * 1.8) + .03 * v * v]; }, PVC);
    // floor shadow: tight dark line where the heap meets the concrete, soft pool round it
    { const PW = 2.3, PD = 2.0, K = 110, [c, x] = can(Math.round(PW * K), Math.round(PD * K)); x.translate(PW * K / 2, PD * K / 2); x.rotate(-RY); const rr = (m, a) => { x.fillStyle = `rgba(18,14,10,${a})`; x.beginPath(); x.roundRect((-.62 - m) * K, (-.475 - m) * K, (1.24 + 2 * m) * K, (.95 + 2 * m) * K, (.12 + m) * K); x.fill(); };
      for (let m = .4; m > .02; m -= .03) rr(m, .035); rr(.025, .26);
      const s = new THREE.Mesh(new THREE.PlaneGeometry(PW, PD), new THREE.MeshBasicMaterial({ map: srgb(c), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })); s.rotation.x = -Math.PI / 2; s.position.set(14.62, .004, -11.17); s.renderOrder = 1; s.userData.keep = true; s.userData.noAO = true; P.add(s); }
    T(g, 'Folded canvas (yard bay floor)', 'A soft heap on the floor, folded cloth by the look of it: tan canvas in layers, a darker sheet over the top and down one side, a blue-grey sheet tucked in at the door side. Spot, size, height and colours are from the LiDAR scan; what it really is (spare canvas, tarps, groundsheet) is not known.', '≈ 1.25 × 0.95 × 0.35–0.42 m (scan)', 'not sure'); }
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
  const BACKB = STD({ color: 0x5e4a34, roughness: .96 }), PLINTH = STD({ color: 0x3e3428, roughness: .96 }); const NOTCHE = STD({ color: 0xc8ad84, roughness: .96 });   // 27 Oct 06:xx: raw ply on the worktop's notch cut   // 27 Oct 05:xx: carcass back (hardboard) and kick plinth; roughness ≥ .95 keeps them out of the wear pass
  const CARC = STD({ color: 0x9a7c56, roughness: .85 }), EDGE = STD({ color: 0x6b5236, roughness: .8 });
  const FRW = STD({ color: 0x8a6c48, roughness: .96 }), FOOT = STD({ color: 0x4a3e30, roughness: .97 }), WASH = STD({ color: 0x9a9fa4, metalness: .5, roughness: .45 }), BOLTM = STD({ color: 0x55595e, metalness: .5, roughness: .5 });   // 30 Oct 07:xx: open-bench frame (rails a shade darker than the legs, grubby feet, zinc washers, dark bolt heads)
  const STEEL = STD({ color: 0x7c8186, metalness: .6, roughness: .45 }), DARK = STD({ color: 0x24272b, roughness: .55, metalness: .3 }), CHIP = STD({ color: 0xc9b48f, roughness: .85 });
  const RED = STD({ color: 0xb8231d, roughness: .4, metalness: .2 }), YEL = STD({ color: 0xf2b705, roughness: .45 }), BLK = STD({ color: 0x1b1c1e, roughness: .6 }), ORA = STD({ color: 0xe0661c, roughness: .45, metalness: .2 });
  // W5b (23 Oct): grime. Cupboard doors: finger marks round the pull, boot scuffs at the foot, dirty edges; bench front edges: dings, dark worn patches
  // 27 Oct 00:xx: cupboard doors redrawn (26 Oct 07:xx review: "flat white with blotchy dark marks and blocky handles"). A painted MDF door with a routed
  // shaker panel (a groove 7 cm in, in the colour and as a bump map so it catches the light), faint roller stipple, soft finger grime round the pull, a
  // lightly scuffed foot; no drips. Own RNG: the old canvas's 5573 vr() draws are burned, so EDGE and the signs keep their looks.
  const doorSheet = panel => { let sq = 4021; const q = () => (sq = (sq * 16807) % 2147483647) / 2147483647, f = (a, b) => a + (b - a) * q(); const N = 256;
    const map = can(N, N, (x, w, h) => { x.fillStyle = '#dcd7ca'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 1400; i++) { x.fillStyle = `rgba(${q() > .5 ? '255,255,255' : '90,80,66'},${f(.02, .05)})`; x.fillRect(q() * w, q() * h, 1 + q() * 1.5, 1 + q() * 1.5); }   // roller stipple
      const eg = (x0, y0, x1, y1, a) => { const g = x.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, `rgba(80,66,50,${a})`); g.addColorStop(1, 'rgba(80,66,50,0)'); return g; };
      x.fillStyle = eg(0, 0, 7, 0, .16); x.fillRect(0, 0, 7, h); x.fillStyle = eg(w, 0, w - 7, 0, .16); x.fillRect(w - 7, 0, 7, h); x.fillStyle = eg(0, 0, 0, 6, .12); x.fillRect(0, 0, w, 6);   // edges a touch grubby
      if (panel) { const m = 30; x.lineWidth = 4; x.strokeStyle = 'rgba(96,86,70,.42)'; x.strokeRect(m, m, w - 2 * m, h - 2 * m);   // the routed groove, in shade
        x.lineWidth = 1.5; x.strokeStyle = 'rgba(255,253,246,.5)'; x.beginPath(); x.moveTo(m + 3, h - m - 3); x.lineTo(m + 3, m + 3); x.lineTo(w - m - 3, m + 3); x.stroke();   // its lit inner bevel (light from above)
        x.strokeStyle = 'rgba(70,60,48,.22)'; x.beginPath(); x.moveTo(m + 3, h - m - 3); x.lineTo(w - m - 3, h - m - 3); x.lineTo(w - m - 3, m + 3); x.stroke(); }
      for (let i = 0; i < 16; i++) { const cx = w / 2 + f(-34, 34), cy = f(30, 78), r = f(5, 13), g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, `rgba(84,70,54,${f(.04, .1)})`); g.addColorStop(1, 'rgba(84,70,54,0)'); x.fillStyle = g; x.fillRect(cx - r, cy - r, 2 * r, 2 * r); }   // fingers round the pull
      const g = x.createLinearGradient(0, h, 0, h - 34); g.addColorStop(0, 'rgba(78,64,48,.2)'); g.addColorStop(1, 'rgba(78,64,48,0)'); x.fillStyle = g; x.fillRect(0, h - 34, w, 34);   // grubby foot
      for (let i = 0; i < 6; i++) { x.strokeStyle = `rgba(60,50,40,${f(.07, .16)})`; x.lineWidth = f(1, 2.2); x.beginPath(); const a = q() * w, b = h - f(3, 26); x.moveTo(a, b); x.lineTo(a + f(-24, 24), b + f(-3, 3)); x.stroke(); }   // light boot scuffs
      // 30 Oct 06:xx (03:xx review: "cupboard doors uniform white, no handle shadows"): the D-pull's own shade baked on the door, drawn after every q() draw so
      // nothing else moves. The pull sits ≈ 12.4 cm under the door top (≈ 47 px on a 0.95 m bench), bar 13 cm (≈ 56 px), posts ±5.5 cm (±24 px), 2.7 cm proud;
      // the workshop lamps are overhead, so the bar's shadow drops ≈ 2 cm below it. Soft ellipses stacked (no ctx.filter: slow under SwiftShader); a first try grew each ring 45 % and read as a wide smear on the phone, so rings grow 8–25 %.
      if (panel) { const cx = w / 2, py = 47, soft = (ex, ey, rx, ry, a, rgb = '40,32,24', gr = .12) => { for (let k = 0; k < 6; k++) { const s = 1 + k * gr; x.fillStyle = `rgba(${rgb},${a / 6})`; x.beginPath(); x.ellipse(ex, ey, rx * s, ry * s, 0, 0, 7); x.fill(); } };
        soft(cx, py + 7, 22, 7, .13, '78,64,48', .2);   // grubby, a little greasy, where fingers hook behind the bar
        soft(cx, py + 6, 25, 2.2, .42, '40,32,24', .25); soft(cx, py + 4, 26, 1.3, .34, '40,32,24', .08);   // the bar's shadow, a dark core with a soft fall-off below
        for (const sx of [-24, 24]) { soft(cx + sx, py + 2.5, 2.4, 3, .45, '40,32,24', .2); soft(cx + sx, py + .5, 1.6, 1.6, .5, '24,20,16'); }   // each post's foot and its short drop
        x.fillStyle = 'rgba(255,253,246,.35)'; x.fillRect(cx - 27, py - 4, 54, 1); } });   // a thin catch of light on the door just above the bar
    const bump = can(N, N, (x, w, h) => { x.fillStyle = '#9a9a9a'; x.fillRect(0, 0, w, h); if (panel) { const m = 30; x.strokeStyle = '#404040'; x.lineWidth = 5; x.strokeRect(m, m, w - 2 * m, h - 2 * m); x.strokeStyle = '#6a6a6a'; x.lineWidth = 11; x.globalAlpha = .5; x.strokeRect(m, m, w - 2 * m, h - 2 * m); x.globalAlpha = 1; }
      x.fillStyle = '#7a7a7a'; for (const [a, b, c, d] of [[0, 0, w, 3], [0, h - 3, w, 3], [0, 0, 3, h], [w - 3, 0, 3, h]]) x.fillRect(a, b, c, d); });   // eased edges
    bump.colorSpace = THREE.NoColorSpace; return STD({ roughness: .58, map, bumpMap: bump, bumpScale: 1.2 }); };
  const DOORM = doorSheet(true), DOORP = doorSheet(false); for (let i = 0; i < 5573; i++) vr();
  const PULLD = STD({ color: 0xd2d6da, metalness: .35, roughness: .3 });   // brushed D-pulls (pale, low metalness reads as metal in the gated workshop light)
  // 27 Oct 02:xx: the bench front edge was one 1024 × 16 canvas stretched along the whole bench (9.6 m on the aisle bench: ≈ 1 cm a pixel, blocky dings).
  // Now a seamless 1 m tile (512 × 32, ≈ 2 mm a pixel) repeated along each bench (`edgeMat(L)`): stained timber grain along the strip, small dings and
  // dark knocks drawn wrapped round the tile's ends, a shade under the worktop and a pale worn arris on the bottom edge. Own RNG; the old canvas's 960 vr() draws are burned.
  { let se = 6151; const er = () => (se = (se * 16807) % 2147483647) / 2147483647, ef = (a, b) => a + (b - a) * er();
    EDGE.map = can(512, 32, (x, w, h) => { x.fillStyle = '#6b5236'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) { x.strokeStyle = `rgba(${er() < .5 ? '58,40,24' : '128,98,64'},${ef(.12, .3)})`; x.lineWidth = ef(.6, 1.6); const y = ef(2, h - 2), a = ef(-.8, .8), ph = er() * 7;
        x.beginPath(); for (let k = 0; k <= 32; k++) { const xx = k * w / 32; const yy = y + a * Math.sin(xx / w * 2 * Math.PI * 2 + ph); k ? x.lineTo(xx, yy) : x.moveTo(xx, yy); } x.stroke(); }   // grain (whole sine periods, so it wraps)
      const wrap = (fn, cx, ww) => { fn(cx); if (cx + ww > w) fn(cx - w); if (cx < 0) fn(cx + w); };
      for (let i = 0; i < 34; i++) { const cx = er() * w, cy = er() * h, rw = ef(1.5, 6), rh = ef(1, 3.5), dark = er() < .65, al = ef(.25, .6);
        wrap(c => { x.fillStyle = `rgba(${dark ? '34,22,12' : '172,140,100'},${al})`; x.beginPath(); x.ellipse(c, cy, rw, rh, 0, 0, 7); x.fill(); }, cx, rw); }   // dings and knocks
      for (let i = 0; i < 9; i++) { const cx = er() * w, ww = ef(18, 70), al = ef(.08, .18);
        wrap(c => { const g = x.createLinearGradient(c - ww, 0, c + ww, 0); g.addColorStop(0, 'rgba(25,16,9,0)'); g.addColorStop(.5, `rgba(25,16,9,${al})`); g.addColorStop(1, 'rgba(25,16,9,0)'); x.fillStyle = g; x.fillRect(c - ww, 0, 2 * ww, h); }, cx, ww); }   // dark worn patches (hands, clamps)
      const t = x.createLinearGradient(0, 0, 0, 7); t.addColorStop(0, 'rgba(28,18,10,.45)'); t.addColorStop(1, 'rgba(28,18,10,0)'); x.fillStyle = t; x.fillRect(0, 0, w, 7);   // shade under the worktop
      x.fillStyle = 'rgba(196,164,122,.32)'; x.fillRect(0, h - 3, w, 2); x.fillStyle = 'rgba(196,164,122,.14)'; x.fillRect(0, h - 5, w, 2); });   // worn arris
    EDGE.map.wrapS = THREE.RepeatWrapping; EDGE.color.set(0xffffff); for (let i = 0; i < 960; i++) vr(); }
  // 27 Oct 07:xx (05:xx find: "the rail is a flat plain tan band; doors sit on the plinth with no reveal"): the rail over the doors is a painted face-frame rail in the
  // doors' paint, a seamless 1 m tile (512 × 48, ≈ 2 mm a pixel) repeated by the bench's length: roller stipple, a shade under the worktop edge, a lit eased arris
  // along its foot, grubby finger marks along the bottom where hands reach for the pulls, a few knocks. Own RNG (7207), no shared draws. Doors get 6 mm reveals.
  const RAIL = STD({ color: 0xffffff, roughness: .6 });
  { let sr = 7207; const rr = () => (sr = (sr * 16807) % 2147483647) / 2147483647, rf = (a, b) => a + (b - a) * rr();
    RAIL.map = can(512, 48, (x, w, h) => { x.fillStyle = '#d6d0c2'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${rr() > .5 ? '255,255,255' : '90,80,66'},${rf(.02, .05)})`; x.fillRect(rr() * w, rr() * h, 1 + rr() * 1.5, 1 + rr() * 1.5); }   // roller stipple (same as the doors)
      const wrap = (fn, cx, ww) => { fn(cx); if (cx + ww > w) fn(cx - w); if (cx < 0) fn(cx + w); };
      for (let i = 0; i < 14; i++) { const cx = rr() * w, ww = rf(10, 26), al = rf(.05, .12);
        wrap(c => { const g = x.createRadialGradient(c, h - 4, 0, c, h - 4, ww); g.addColorStop(0, `rgba(84,70,54,${al})`); g.addColorStop(1, 'rgba(84,70,54,0)'); x.fillStyle = g; x.fillRect(c - ww, h - 4 - ww, 2 * ww, 2 * ww); }, cx, ww); }   // finger grime along the foot
      for (let i = 0; i < 10; i++) { const cx = rr() * w, cy = rf(8, h - 6), rw = rf(1, 3), rh = rf(.8, 2), al = rf(.15, .35);
        wrap(c => { x.fillStyle = `rgba(110,96,78,${al})`; x.beginPath(); x.ellipse(c, cy, rw, rh, 0, 0, 7); x.fill(); }, cx, rw); }   // small knocks
      const t = x.createLinearGradient(0, 0, 0, 12); t.addColorStop(0, 'rgba(60,48,34,.38)'); t.addColorStop(1, 'rgba(60,48,34,0)'); x.fillStyle = t; x.fillRect(0, 0, w, 12);   // shade under the worktop edge
      x.fillStyle = 'rgba(255,253,246,.55)'; x.fillRect(0, h - 4, w, 2); x.fillStyle = 'rgba(70,58,44,.35)'; x.fillRect(0, h - 2, w, 2); });   // lit eased arris, dark underside line
    RAIL.map.wrapS = THREE.RepeatWrapping; }
  const RAILS = {}; const railMat = L => { const k = L.toFixed(2); if (!RAILS[k]) { const m = RAIL.clone(); m.map = RAIL.map.clone(); m.map.repeat.set(L, 1); m.map.needsUpdate = true; RAILS[k] = m; } return RAILS[k]; };
  const EDGES = {}; const edgeMat = L => { const k = L.toFixed(2); if (!EDGES[k]) { const m = EDGE.clone(); m.map = EDGE.map.clone(); m.map.repeat.set(L, 1); m.map.needsUpdate = true; EDGES[k] = m; } return EDGES[k]; };
  const burn = n => { for (let i = 0; i < n; i++) wr(); };   // W5: the old CARD/OSBIN canvases drew from wr(); burn the same number of draws so every later item stays where it was
  burn(5404);
  // 1 Nov 06:xx (05:xx self-critique: "every face of a box shows the same label"): each card canvas is now 128 × 256: the LOWER half is the labelled
  // face (as before), the UPPER half a copy of the plain board and tape taken just before the label goes on. cbox() maps the ±z faces to the lower half
  // and the sides and top to the upper, so a box seen corner-on shows one label, not two. Same RNG draws as before, label whites a step duller.
  // 1 Nov 23:xx (07:xx review: "the 128 px label canvas blurs close up", wsfoot detail down): every card canvas drawn at CS = 4× (512 × 1024) by scaling
  // the context, so the same strokes, same RNG draws and same layout, only the labels and print come out sharp. The self-copy for the plain half scales too.
  const CS = 4;
  const CARDS = [0, 1, 2].map(k => STD({ roughness: .9, map: can(128 * CS, 256 * CS, (x, w, H) => { x.scale(CS, CS); w /= CS; const h = 128; x.translate(0, 128); x.fillStyle = ['#b88d5c', '#a87f52', '#c29a68'][k]; x.fillRect(0, 0, w, h); qspecks(x, w, h, 900, .08);   // three kinds of box: label, tape and print differ
    x.fillStyle = 'rgba(205,170,115,.9)'; x.fillRect(w / 2 - 8, 0, 16, h); if (k === 1) { x.fillStyle = 'rgba(160,150,140,.55)'; x.fillRect(0, h / 2 - 7, w, 14); }
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(x.canvas, 0, 128 * CS, 128 * CS, 128 * CS, 0, 0, 128 * CS, 128 * CS); x.restore();   // plain sides and top
    if (k === 0) { x.fillStyle = '#e0dbcf'; x.fillRect(14, 70, 40, 26); x.fillStyle = '#333'; for (let i = 0; i < 4; i++) x.fillRect(18, 75 + i * 5, 20 + qr() * 14, 2); }
    else if (k === 1) { x.fillStyle = '#1a1a1a'; x.font = 'bold 15px Arial'; x.fillText('FIXINGS', 34, 100); x.fillText('M8', 52, 116); }   // 07:xx: centred (at x 72 it ran off the canvas edge; with labels now at true size a narrow box cut it to 'FIXI')
    else { x.strokeStyle = 'rgba(40,40,40,.8)'; x.lineWidth = 2; x.beginPath(); x.moveTo(20, 40); x.lineTo(20, 22); x.moveTo(14, 28); x.lineTo(20, 22); x.lineTo(26, 28); x.moveTo(36, 40); x.lineTo(36, 22); x.moveTo(30, 28); x.lineTo(36, 22); x.lineTo(42, 28); x.stroke(); x.fillStyle = '#2a2a2a'; x.fillRect(74, 84, 40, 4); x.fillRect(74, 92, 30, 3); } }) }));
  // 1 Nov 05:xx (03:xx review: "the same FIXINGS M8 box on several shelves"): five more kinds of box, each its own maker's print and its own contents
  // label (different words, sizes and colours), drawn from their own RNG (5105) so qr()/wr() and the layout stay put. cbox() now steps through all 8,
  // three at a time, not round-robin over 3, so neighbours never match.
  { let sc = 5105; const cr = () => (sc = (sc * 16807) % 2147483647) / 2147483647, cf = (a, b) => a + (b - a) * cr();
    const KINDS = [['#b48a58', 'SCREWS', '5 × 60', '#e3ddcf', '#1d1d1d', 1], ['#a9845a', 'CABLE TIES', '300 mm BLACK', '#ebe7de', '#b8231d', 0], ['#bf9764', 'WASHERS', 'M10', '#ddd6ba', '#1d1d1d', 1],
      ['#9f7a50', 'COACH BOLTS', 'M8 × 100', '#e5e1d6', '#2a4f8f', 0], ['#c4a070', 'MIXED', 'odds + ends', null, '#222', 2]];
    for (const [bg, t1, t2, lab, ink, st] of KINDS) CARDS.push(STD({ roughness: .9, map: can(128 * CS, 256 * CS, (x, w, H) => { x.scale(CS, CS); w /= CS; const h = 128; x.translate(0, 128); x.fillStyle = bg; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${cr() > .5 ? '255,255,255' : '0,0,0'},${.08 * cr()})`; x.fillRect(cr() * w, cr() * h, 1 + cr() * 2, 1 + cr() * 2); }   // board specks
      const tx = cf(30, 70); x.fillStyle = st === 1 ? 'rgba(150,140,128,.6)' : 'rgba(205,170,115,.85)'; x.fillRect(tx, 0, cf(14, 20), h);   // tape strip: brown or clear, never in the same place
      x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(x.canvas, 0, 128 * CS, 128 * CS, 128 * CS, 0, 0, 128 * CS, 128 * CS); x.restore();   // plain sides and top (06:xx)
      if (st === 0) { x.fillStyle = 'rgba(40,36,30,.7)'; x.fillRect(8, 8, 46, 5); x.fillRect(8, 16, 30, 3); }   // maker's print, top left
      if (lab) { const lx = cf(8, 22), ly = cf(62, 74), lw = 96 - lx + cf(0, 16); x.fillStyle = lab; x.fillRect(lx, ly, lw, 38); x.fillStyle = 'rgba(0,0,0,.12)'; x.fillRect(lx, ly + 36, lw, 2);
        x.fillStyle = ink; x.font = `bold ${t1.length > 8 ? 13 : 16}px Arial`; x.fillText(t1, lx + 5, ly + 17); x.font = '11px Arial'; x.fillStyle = '#333'; x.fillText(t2, lx + 5, ly + 32); }
      else { x.save(); x.translate(20, 92); x.rotate(-.08); x.strokeStyle = 'rgba(25,25,30,.85)'; x.lineWidth = 2.5; x.font = 'bold 20px "Comic Sans MS", cursive'; x.fillStyle = 'rgba(25,25,30,.85)'; x.fillText(t1, 0, 0); x.font = '13px "Comic Sans MS", cursive'; x.fillText(t2, 6, 18); x.restore(); }   // marker on the board
      for (let i = 0; i < 4; i++) { x.fillStyle = `rgba(70,50,30,${cf(.06, .16)})`; x.beginPath(); x.ellipse(cr() * w, cr() * h, cf(4, 14), cf(3, 9), cr() * 3, 0, 7); x.fill(); } }) })); }   // knocks and grubby marks
  const CARD = CARDS[0]; let cardN = 0;
  burn(18048);   // 24 Oct 06:xx: the old flat PEG canvas drew 18 048 times from wr() (3000 specks × 6 + 12 outlines × 4); burn them so the layout stays put. The board is pegBoard() below
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
  // 28 Oct 02:xx: the lining is real sheets from OSB.wall (2 strand bases, flipped/turned, stamps, a grubby bottom row, bump), not one
  // 1.22 × 2.44 tile repeated identically down every wall (07:xx review: "OSB grain repeated and overscaled up close"). OSBIN is still drawn (qr() draws) for the far-wall door leaf.
  const lin = (L, H, x, z, ry, holes = []) => OSB.wall(shell, x - Math.cos(ry) * L / 2, 0, z + Math.sin(ry) * L / 2, ry, L, H, true, true, holes);
  lin(10.5, 3.8, .45, -7.7, Math.PI / 2);
  { const w = grp(P), GL = dimSpec(STD({ color: 0xc4d2da, metalness: 0, roughness: .04, transparent: true, opacity: .16, depthWrite: false }), .03), FR = dimSpec(STD({ color: 0xc8a878, roughness: .7 }), .3);   // 28 Oct 23:xx (07:xx review: "front window blown out white"): clear glass onto the hall, was an opaque frosted emissive pane with a hotspot   // the front window from inside (scan: the aisle wall reads as glass at z −2.9…−5.3, 1.2–2.6 m)
    { const gi = box(w, .012, 1.4, 2.4, GL, 5.95, 1.2, -4.1); gi.castShadow = gi.receiveShadow = false; gi.userData.noAO = true; }
    for (const z of [-2.9, -5.3]) box(w, .1, 1.4, .012, FR, 5.995, 1.2, z + (z > -4 ? -.006 : .006)); for (const y of [1.2, 2.6]) box(w, .1, .012, 2.4, FR, 5.995, y - (y > 2 ? .012 : 0), -4.1);   // timber reveals through the wall's depth
    for (const s of [-1, 1]) box(w, .05, 1.5, .07, FR, 5.93, 1.15, -4.1 + s * 1.235); for (const y of [1.13, 2.6]) box(w, .05, .07, 2.54, FR, 5.93, y, -4.1); box(w, .05, 1.4, .05, FR, 5.93, 1.2, -4.1);
    box(w, .16, .03, 2.54, FR, 5.86, 1.13, -4.1); } lin(5.5, 3.8, 3.2, -2.48, Math.PI); { const L = 10.4, z = -7.65, s0 = -2.9 - (z - L / 2); lin(L, 3.8, 5.96, z, -Math.PI / 2, [[s0 - 2.4, s0, 1.2, 2.6]]); }
  { const fw = grp(P, 0, 0, -12.95); const H = 3.8, D0 = 4.95, D1 = 5.85, DH = 2.05;   // far wall: OSB on studs, a doorway at the aisle corner (scan: gap at x ≈ 5.0–5.8)
    for (const [a, b, y0, y1] of [[.45, D0, 0, H], [D1, 6.0, 0, H], [D0, D1, DH, H]]) { box(fw, b - a, y1 - y0, .1, CARC, (a + b) / 2, y0, 0); for (const zz of [.052, -.052]) OSB.wall(fw, zz > 0 ? a : b, y0, zz, zz > 0 ? 0 : Math.PI, b - a, y1 - y0, y0 === 0, true); }   // 28 Oct: real sheets, as the lining
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
    if (opts.notch) { const { x: nx, w: nw, d: nd } = opts.notch, a = nx - nw / 2, b = nx + nw / 2;   // 27 Oct 06:xx (03:xx review: "the green column runs through the bench top"): the top is notched round the mezzanine post, cut edges show
      const sh = new THREE.Shape([[-L / 2, -D / 2], [L / 2, -D / 2], [L / 2, D / 2], [b, D / 2], [b, D / 2 - nd], [a, D / 2 - nd], [a, D / 2], [-L / 2, D / 2]].map(q => new THREE.Vector2(...q)));   // one notched slab (06:xx v1 was three boxes: a shading seam showed at the joins)
      const TG = new THREE.ExtrudeGeometry(sh, { depth: .04, bevelEnabled: false }); TG.rotateX(-Math.PI / 2); TG.translate(0, H - .04, 0); TG.computeVertexNormals();
      const P_ = TG.attributes.position, N_ = TG.attributes.normal, U_ = TG.attributes.uv; for (let i = 0; i < P_.count; i++) if (N_.getY(i) > .5) U_.setXY(i, (P_.getX(i) + L / 2) / L, 1 - (P_.getZ(i) + D / 2) / D);   // same UVs as the uncut box top
      const tm = new THREE.Mesh(TG, TOP); tm.castShadow = tm.receiveShadow = true; g.add(tm);
      for (const ex of [a, b]) box(g, .003, .041, nd, NOTCHE, ex, H - .0405, -D / 2 + nd / 2); box(g, nw, .041, .003, NOTCHE, nx, H - .0405, -D / 2 + nd); }   // raw ply on the cut faces, a hair proud so they show
    else box(g, L, .04, D, TOP, 0, H - .04, 0);
    box(g, L, .06, .025, edgeMat(L), 0, H - .07, D / 2);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, .07, H - .04, .07, CARC, sx * (L / 2 - .05), 0, sz * (D / 2 - .05));
    for (let k = 1; k < Math.floor(L / 1.4); k++) for (const sz of [-1, 1]) box(g, .07, H - .04, .07, CARC, -L / 2 + k * L / Math.floor(L / 1.4), 0, sz * (D / 2 - .05));
    box(g, L - .1, .022, D - .1, CHIP, 0, .16, 0); box(g, L, .07, .04, CARC, 0, H - .14, -D / 2 + .03);
    if (!opts.doors) {   // 30 Oct 07:xx (03:xx review: "bench frames are plain blocks"): open benches get a real frame: shelf bearers along both long sides, cross rails
      // at each leg (low under the shelf and high under the top), a coach bolt + washer where each rail meets a leg, and grubby leg feet. Own materials, no RNG drawn.
      // FRW/FOOT roughness ≥ .95 so the wear pass leaves them alone; bolts are small steel, which the wear pass dresses as it does every other bolt.
      const n = Math.floor(L / 1.4), xs = [-(L / 2 - .05), L / 2 - .05]; for (let k = 1; k < n; k++) xs.push(-L / 2 + k * L / n);
      for (const sz of [-1, 1]) box(g, L - .06, .055, .022, FRW, 0, .095, sz * (D / 2 - .004));   // bearers on the legs' outer faces, the shelf sits on them
      for (const lx of xs) { box(g, .045, .055, D - .14, FRW, lx, .095, 0); box(g, .045, .07, D - .14, FRW, lx, H - .14, 0);   // cross rails between each leg pair
        box(g, .074, .035, .074, FOOT, lx, 0, D / 2 - .05); box(g, .074, .035, .074, FOOT, lx, 0, -(D / 2 - .05));   // floor grime on the leg feet
        for (const sz of [-1, 1]) { cyl(g, .014, .003, WASH, lx, .1225, sz * (D / 2 + .0085), 'z', 12); cyl(g, .0085, .007, BOLTM, lx, .1225, sz * (D / 2 + .013), 'z', 10); }   // coach bolt through bearer and leg
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, .012, .003, WASH, lx + sx * .0365, H - .105, sz * (D / 2 - .05), 'x', 12); } }   // the high rail's bolts show on the legs' sides
    if (opts.doors) {   // 27 Oct 05:xx (03:xx review: "black gaps behind the rails, bare wall behind the doors"): close the carcass: hardboard back, ply ends, a rail over the doors, a dark kick plinth
      box(g, L - .02, H - .06, .006, BACKB, 0, .02, -D / 2 + .008); for (const sx of [-1, 1]) box(g, .018, H - .06, D - .02, CARC, sx * (L / 2 - .009), .02, 0);
      box(g, L - .02, .09, .02, railMat(L - .02), 0, H - .16, D / 2 - .012); box(g, L - .04, .1, .018, PLINTH, 0, 0, D / 2 - .035); }
    if (opts.doors) { const n = Math.round(L / .6); for (let i = 0; i < n; i++) { box(g, L / n - .01, H - .272, .018, DOORM, -L / 2 + (i + .5) * L / n, .106, D / 2 - .01);   // 6 mm reveals under the rail and over the plinth (07:xx)
      const px = -L / 2 + (i + .5) * L / n; cyl(g, .0055, .13, PULLD, px, H - .29, D / 2 + .026, 'x', 10); for (const sx of [-.055, .055]) cyl(g, .0045, .026, PULLD, px + sx, H - .29, D / 2 + .012, 'z', 8); } }   // 27 Oct: slim D-pull (bar on two posts) instead of a 10 cm steel block
    return g; }
  // slotted-angle upright map: one 40 × 300 mm tile (64 × 512 px), grey stove enamel, long slots and round holes punched through (alpha 0), rolled-edge
  // highlight, faint scuffs and rub marks. UVs are scaled so the tile repeats every 30 cm up the angle.
  // 1 Nov 01:xx (31 Oct 02:xx find: "every upright is the same clean grey with no grime low down"): floor-standing uprights get their bottom 15 cm
  // as its own piece with a grimed copy of the map (same seed, so the slots line up; the grime is drawn source-atop so the punched holes stay open):
  // a dirty mop-and-boot band fading up from the floor, light scrapes where boots and trolleys catch the angle, mop splash specks. Own RNG 5179.
  const slotMat = grime => { let ss = 5023; const sr = () => (ss = (ss * 16807) % 2147483647) / 2147483647;
    const c = document.createElement('canvas'); c.width = 64; c.height = 512; const x = c.getContext('2d');
    // 1 Nov 03:xx (31 Oct 02:xx find: "uprights read blue-dark in shade next to the warm OSB"): the workshop scan's shelving greys sample neutral to a touch
    // warm (front face median 159/157/146, never blue-leaning), so the enamel goes from cool #8b9095 to a lighter warm grey #aaa79f, and metalness .45 → .12
    // (stove enamel is paint, not bare metal: at .45 it mirrored the dark room and went near-black in the bay's shade).
    x.fillStyle = '#aaa79f'; x.fillRect(0, 0, 64, 512);
    for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(${sr() < .5 ? '60,62,64' : '190,194,196'},${.05 + sr() * .08})`; x.fillRect(sr() * 64, sr() * 512, 1 + sr() * 4, 1 + sr() * 14); }
    x.fillStyle = 'rgba(205,210,214,.55)'; x.fillRect(0, 0, 3, 512); x.fillStyle = 'rgba(40,42,45,.35)'; x.fillRect(61, 0, 3, 512);   // rolled edge + the corner's shade
    const rr = (cx, cy, w, h) => { const r = w / 2; x.beginPath(); x.moveTo(cx - r, cy - h / 2 + r); x.arc(cx, cy - h / 2 + r, r, Math.PI, 0); x.lineTo(cx + r, cy + h / 2 - r); x.arc(cx, cy + h / 2 - r, r, 0, Math.PI); x.closePath(); };
    for (let k = 0; k < 8; k++) { const y0 = 32 + k * 64;   // every 37.5 mm: a 22 × 8 mm slot near the free edge, an 8 mm hole nearer the corner, offset half a pitch
      x.fillStyle = 'rgba(30,32,34,.5)'; rr(26, y0 + 1.5, 16, 40); x.fill(); rr(46, y0 - 30.5, 15, 15); x.fill();   // dark lip round each punch
      x.globalCompositeOperation = 'destination-out'; rr(25, y0, 13, 37); x.fill(); rr(45, y0 - 32, 13, 13); x.fill(); x.globalCompositeOperation = 'source-over'; }
    if (grime) { let gs = 5179; const gr = () => (gs = (gs * 16807) % 2147483647) / 2147483647; x.globalCompositeOperation = 'source-atop';   // canvas y 256–512 = the bottom 15 cm (v .5 → 0, floor at y 512)
      const g = x.createLinearGradient(0, 256, 0, 512); g.addColorStop(0, 'rgba(168,150,122,0)'); g.addColorStop(.35, 'rgba(168,150,122,.2)'); g.addColorStop(.75, 'rgba(162,142,114,.5)'); g.addColorStop(1, 'rgba(150,130,102,.7)');   /* dried mop water and floor dust: dusty tan, lighter than the grey, so it reads in the shade */ x.fillStyle = g; x.fillRect(0, 256, 64, 256);
      for (let i = 0; i < 9; i++) { const y = 400 + gr() * 100; x.fillStyle = `rgba(${gr() < .6 ? '215,218,216' : '92,84,74'},${.3 + gr() * .3})`; x.fillRect(gr() * 30, y, 14 + gr() * 34, 1.5 + gr() * 3); }   // boot and trolley scrapes
      for (let i = 0; i < 70; i++) { const y = 512 - Math.pow(gr(), 1.8) * 200; x.fillStyle = `rgba(${gr() < .6 ? '70,60,48' : '186,174,150'},${.2 + gr() * .35})`; x.beginPath(); x.arc(gr() * 64, y, .8 + gr() * 2.2, 0, 7); x.fill(); }   // mop splash
      x.fillStyle = 'rgba(112,96,76,.5)'; x.fillRect(0, 498, 64, 14); x.globalCompositeOperation = 'source-over'; }   // the damp line right at the floor
    const t = new CT(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
    return STD({ map: t, alphaTest: .5, metalness: .12, roughness: grime ? .64 : .52 }); };
  const SLOTM = slotMat(false), SLOTMG = slotMat(true);
  const SLOTFOOT = STD({ color: 0x1b1c1e, roughness: .97 }), SLOTNUT = STD({ color: 0x9a9fa3, metalness: .7, roughness: .38 });
  const slotUV = (m, H, v0 = 0) => { const uv = m.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, v0 + uv.getY(i) * H / .3); uv.needsUpdate = true; return m; };
  function shelving(p, x, z, L, D, H, ry, levels, floor = true) { const g = grp(p, x, 0, z, ry);   // grey slotted-angle shelving, chipboard shelves
    // 31 Oct 02:xx (07:xx review: "the near-right shelf upright is a plain grey slab" in wsfrontin): each upright is a real slotted angle, two 40 mm
    // flanges 2 mm thick meeting at the outer corner, punched right through (long slots and round holes on a 37.5 mm pitch, see-through via alphaTest,
    // shadows too), a black plastic foot cap, and a hex bolt + washer where each shelf angle is bolted to the upright. No RNG drawn (own map seed).
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const cx = sx * L / 2, cz = sz * D / 2;
      const G = floor ? .15 : 0;   // floor-standing: bottom 15 cm in the grimed map, v .5 on up so the slots carry on unbroken
      if (G) { slotUV(box(g, .04, G, .002, SLOTMG, cx - sx * .02, 0, cz - sz * .001), G); slotUV(box(g, .002, G, .04, SLOTMG, cx - sx * .001, 0, cz - sz * .02), G); }
      slotUV(box(g, .04, H - G, .002, SLOTM, cx - sx * .02, G, cz - sz * .001), H - G, G / .3); slotUV(box(g, .002, H - G, .04, SLOTM, cx - sx * .001, G, cz - sz * .02), H - G, G / .3);
      box(g, .046, .012, .046, SLOTFOOT, cx - sx * .021, 0, cz - sz * .021);
      for (const y of levels) { const bz = cz + sz * .0085; cyl(g, .0085, .0012, SLOTNUT, cx - sx * .02, y - .003, bz, 'z', 14); cyl(g, .0062, .0045, SLOTNUT, cx - sx * .02, y - .003, bz + sz * .0028, 'z', 6); } }
    // 31 Oct 03:xx (02:xx run's find: "the shelf-edge angles and diagonal braces are still plain bars"): the front and back shelf bearers are slotted
    // angle too (a 35 mm flange down the face, a 40 mm flange under the board, slots running along the length, bolted to each upright's inner flange),
    // and the two end braces are 30 mm flat slotted strip bolted at both ends, set just outside the uprights so they don't cut through them. No RNG drawn.
    const slotBar = (w, len, px, py, pz) => { const m = slotUV(new THREE.Mesh(new THREE.BoxGeometry(w, len, .002), SLOTM), len); m.position.set(px, py, pz); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
    for (const y of levels) { box(g, L - .006, .018, D - .01, CHIP, 0, y, 0);
      for (const sz of [-1, 1]) { const fz = sz * (D / 2 - .003);   // inside the uprights' face flanges, ending inside their side flanges
        slotBar(.035, L - .006, 0, y - .0175, fz).rotation.set(0, 0, Math.PI / 2);                        // the face flange, 35 mm down from the board's underside line
        slotBar(.04, L - .006, 0, y - .001, fz - sz * .02).rotation.set(Math.PI / 2, 0, Math.PI / 2); } }   // the flange the board sits on
    for (const sx of [-1, 1]) { const len = Math.hypot(H * .5, D - .02), a = Math.atan2(D - .02, H * .5), bx = sx * (L / 2 + .002);
      slotBar(.03, len, bx, H * .75, 0).rotation.set(a, Math.PI / 2, 0);   // flat strip in the end's plane, just outside the uprights
      for (const e of [-1, 1]) cyl(g, .007, .004, SLOTNUT, bx + sx * .003, H * .75 + e * H * .25 * .92, e * (D / 2 - .01) * .92, 'x', 6); }
    return g; }
  const cbox = (p, x, y, z, w, h, d, ry = 0) => { const b = box(p, w, h, d, CARDS[(cardN++ * 3) % CARDS.length], x, y, z, ry); const uv = b.geometry.attributes.uv;
    // 1 Nov 07:xx (06:xx self-critique: "labels stretch with the box width, CABLE TIES pulled wide"): the labelled half is a 0.5 m square of board, so the
    // ±z faces show a w × h window of it (square texels), centred on the label (u .5, v .33 of the half) and shrunk to fit if the face is over 0.5 m.
    const k = Math.min(1, .5 / Math.max(w, h)), uw = w / .5 * k, vh = h / .5 * k, u0 = Math.min(1 - uw, Math.max(0, .5 - uw / 2)), v0 = Math.min(1 - vh, Math.max(0, .33 - vh / 2));
    for (let i = 0; i < 24; i++) { if (i >= 16) { uv.setX(i, u0 + uv.getX(i) * uw); uv.setY(i, (v0 + uv.getY(i) * vh) * .5); } else uv.setY(i, .5 + uv.getY(i) * .5); } return b; };   // 06:xx: ±z faces (16–23) get the labelled lower half, sides and top the plain upper half   // 1 Nov 05:xx: steps through all 8 kinds 3 at a time (was round-robin over 3), so the next 7 boxes along never repeat one; a position hash was tried first and clustered (four MIXED in one view)
  // 28 Oct 00:xx (07:xx review: "the white crate with the green lid has no contact shadow and its texture is a low-res smear of scratches"): a moulded
  // polypropylene storage box instead of two boxes. Tapered body with rounded corners, a stacking rim under the lid, a lid with a raised centre panel and
  // end grips, its own fine moulded-plastic map in metres (so the wear pass, which only dresses mapless meshes, leaves it alone). Its contact shadow comes from
  // the 27 Oct 23:xx halo bake (a shadow plane of its own was tried first; dropped so the two don't stack). Replaces the 23:xx TUBM box tub (its 0–1-per-face tile doesn't fit metre UVs).
  // Same call signature and footprint; no RNG draws (own seed), so nothing else in the workshop moves.
  const TUB = (() => { let ts = 9311; const tr = () => (ts = (ts * 16807) % 2147483647) / 2147483647;
    const cvs = (W, H, draw) => { const c = document.createElement('canvas'); c.width = W; c.height = H; draw(c.getContext('2d'), W, H); const t = new CT(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; };
    const plastic = cvs(512, 512, (x, W, H) => { x.fillStyle = '#e9ebe8'; x.fillRect(0, 0, W, H);   // 1 m tile (side UVs are in metres): faint mould flow lines, soft grey handling marks, a few fine scuffs
      for (let i = 0; i < 90; i++) { x.strokeStyle = `rgba(150,155,150,${.03 + tr() * .05})`; x.lineWidth = .6 + tr(); const a = tr() * W; x.beginPath(); x.moveTo(a, 0); x.bezierCurveTo(a + (tr() - .5) * 30, H * .3, a + (tr() - .5) * 30, H * .7, a + (tr() - .5) * 20, H); x.stroke(); }
      for (let i = 0; i < 14; i++) { const cx = tr() * W, cy = tr() * H, r = 20 + tr() * 50, g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, `rgba(95,90,80,${.05 + tr() * .07})`); g.addColorStop(1, 'rgba(95,90,80,0)'); x.fillStyle = g; x.fillRect(cx - r, cy - r, 2 * r, 2 * r); }
      for (let i = 0; i < 40; i++) { x.strokeStyle = `rgba(${tr() < .5 ? '255,255,255' : '120,118,110'},${.12 + tr() * .2})`; x.lineWidth = .5 + tr() * .6; const a = tr() * W, b = tr() * H, t = tr() * 6.28, L = 6 + tr() * 22; x.beginPath(); x.moveTo(a, b); x.lineTo(a + Math.cos(t) * L, b + Math.sin(t) * L * .4); x.stroke(); }
      for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(${tr() < .5 ? '255,255,255' : '140,140,132'},${.03 + tr() * .05})`; x.fillRect(tr() * W, tr() * H, 1, 1); } });
    const body = STD({ map: plastic, color: 0xffffff, roughness: .52 }), rim = STD({ map: plastic, color: 0xdfe1de, roughness: .48 }), lids = {};
    const lidM = c => lids[c] || (lids[c] = STD({ map: plastic, color: c, roughness: .5 }));
    const rrect = (w, d, r) => { const s = new THREE.Shape(), a = w / 2, b = d / 2; s.moveTo(-a + r, -b); s.lineTo(a - r, -b); s.quadraticCurveTo(a, -b, a, -b + r); s.lineTo(a, b - r); s.quadraticCurveTo(a, b, a - r, b); s.lineTo(-a + r, b); s.quadraticCurveTo(-a, b, -a, b - r); s.lineTo(-a, -b + r); s.quadraticCurveTo(-a, -b, -a + r, -b); return s; };
    const slab = (w, d, r, h, taper = 0) => { const G = new THREE.ExtrudeGeometry(rrect(w, d, r), { depth: h, bevelEnabled: false, curveSegments: 4 }); G.rotateX(-Math.PI / 2);   // extruded up +y from y 0
      if (taper) { const P_ = G.attributes.position; for (let i = 0; i < P_.count; i++) { const k = 1 - taper * (1 - P_.getY(i) / h); P_.setX(i, P_.getX(i) * k); P_.setZ(i, P_.getZ(i) * k); } }
      G.computeVertexNormals(); return G; };
    const mesh = (p, G, m, x, y, z) => { const o = new THREE.Mesh(G, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; p.add(o); return o; };
    return (p, x, y, z, w, h, d, lid) => { const r = Math.min(.03, w * .08, d * .08), hb = h - .022, L = lidM(lid);
      mesh(p, slab(w - .012, d - .012, r, hb, .07), body, x, y, z);                       // tapered body, 7 % narrower at the foot
      mesh(p, slab(w + .004, d + .004, r + .004, .016), rim, x, y + hb - .016, z);          // stacking rim just under the lid
      mesh(p, slab(w + .016, d + .016, r + .008, .022), L, x, y + hb, z);                  // lid
      mesh(p, slab(w * .72, d * .66, r * .8, .008), L, x, y + h, z);                       // raised centre panel
      for (const s of [-1, 1]) { const g = mesh(p, new THREE.BoxGeometry(.012, .016, d * .42), L, x + s * (w / 2 + .012), y + hb + .006, z); g.position.y += .008; }   // end grips
    }; })();
  const tub = (p, x, y, z, w, h, d, lid) => TUB(p, x, y, z, w, h, d, lid);
  // 1 Nov 05:xx (03:xx review: "identical red/blue/green tin trios"): tin groups for the shelves, [r, h, colour, x offset] each; no RNG drawn
  const TINSETS = [[[.075, .19, 0xd9d4c4, .09], [.055, .12, 0x2f5f8f, .25], [.05, .1, 0x2f5f8f, .36]], [[.06, .15, 0xb8231d, .08], [.06, .15, 0xb8231d, .21], [.045, .09, 0xe9c33a, .33]],
    [[.085, .22, 0x9aa3a8, .1], [.07, .13, 0x3b6b3a, .29]], [[.05, .11, 0xe0661c, .07], [.065, .17, 0xe8e2d0, .2], [.05, .08, 0x1c1c1c, .33]], [[.07, .2, 0x5d4a3a, .09], [.07, .2, 0x5d4a3a, .25]]]; let tinN = 0;
  const tin = (p, x, y, z, r, h, col) => { cyl(p, r, h, STD({ color: 0xb5b9bc, metalness: .7, roughness: .35 }), x, y + h / 2, z); cyl(p, r * 1.01, h * .55, STD({ color: col, roughness: .5 }), x, y + h * .45, z); cyl(p, r * .95, .006, STEEL, x, y + h + .003, z); };
  // 28 Oct 04:xx (03:xx review, wstop: "the black case on the yellow base is a noisy black block: no corner caps, latches or edge trim, handle looks stuck on").
  // A moulded stacking tool case instead of two boxes: rounded, slightly tapered yellow base with black corner bumpers, a dark parting rim, a black lid with
  // two stacking ribs and a rounded front lip, two brushed-steel flip latches over yellow keeps (hinge pin, hook over the base lip), two lid hinges at the back,
  // and a rubber grip that actually sits on its posts (was floating 1 cm above them). Shell parts carry their own fine moulded-plastic maps in metres
  // (own RNG 7411), so the wear pass, which paints scratches on mapless parts, leaves them alone: that was the "noise". Same signature and footprint.
  const CASEY = (() => { let cs = 7411; const cr = () => (cs = (cs * 16807) % 2147483647) / 2147483647;
    const cvs = (W, H, draw) => { const c = document.createElement('canvas'); c.width = W; c.height = H; draw(c.getContext('2d'), W, H); const t = new CT(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; };
    const skin = (base, spot, scuff, grime) => cvs(512, 512, (x, W, H) => { x.fillStyle = base; x.fillRect(0, 0, W, H);   // 1 m tile: fine matte stipple, soft handling grime, a few short pale scuffs, dust
      for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(${cr() < .5 ? spot : '0,0,0'},${.04 + cr() * .06})`; x.fillRect(cr() * W, cr() * H, 1, 1); }
      for (let i = 0; i < 16; i++) { const cx = cr() * W, cy = cr() * H, r = 18 + cr() * 46, g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, `rgba(${grime},${.06 + cr() * .08})`); g.addColorStop(1, `rgba(${grime},0)`); x.fillStyle = g; x.fillRect(cx - r, cy - r, 2 * r, 2 * r); }
      for (let i = 0; i < 26; i++) { x.strokeStyle = `rgba(${scuff},${.1 + cr() * .16})`; x.lineWidth = .5 + cr() * .7; const a = cr() * W, b = cr() * H, t = cr() * 6.28, L = 4 + cr() * 14; x.beginPath(); x.moveTo(a, b); x.lineTo(a + Math.cos(t) * L, b + Math.sin(t) * L * .5); x.stroke(); } });
    const yS = STD({ map: skin('#ffffff', '255,255,255', '255,255,240', '90,74,40'), color: 0xf2b705, roughness: .5 });
    const kS = STD({ map: skin('#2a2b2e', '120,120,124', '150,150,150', '110,104,94'), color: 0xffffff, roughness: .55 });
    const kR = STD({ color: 0x1d1e20, roughness: .78 });   // grip and posts: rubbery (the wear pass gives it a knurl and dust)
    // 28 Oct 07:xx (04:xx run's find: "the steel latches pick up rust specks and smudges from the wear pass"): the latches, hook lips and hinge pins get
    // their own 256 px brushed-stainless map (fine brush lines one way, a soft thumb smudge, a darker edge where dirt sits), so the wear pass skips them.
    // Drawn after yS/kS from the same case RNG, so nothing else moves.
    const brush = cvs(256, 256, (x, W, H) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 700; i++) { const yy = cr() * H, a = .03 + cr() * .07; x.fillStyle = `rgba(${cr() < .5 ? '255,255,255' : '60,62,66'},${a})`; x.fillRect(0, yy, W, .5 + cr()); }
      for (let i = 0; i < 4; i++) { const cx = cr() * W, cy = cr() * H, r = 30 + cr() * 50, g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, `rgba(90,86,80,${.08 + cr() * .06})`); g.addColorStop(1, 'rgba(90,86,80,0)'); x.fillStyle = g; x.fillRect(cx - r, cy - r, 2 * r, 2 * r); }
      const e = x.createLinearGradient(0, 0, 0, H); e.addColorStop(0, 'rgba(70,66,60,.18)'); e.addColorStop(.12, 'rgba(70,66,60,0)'); e.addColorStop(.88, 'rgba(70,66,60,0)'); e.addColorStop(1, 'rgba(70,66,60,.18)'); x.fillStyle = e; x.fillRect(0, 0, W, H); });
    brush.repeat.set(.25, .25);
    const stl = STD({ map: brush, color: 0xc4c8cb, metalness: .6, roughness: .34 }), keep = STD({ map: yS.map, color: 0xd9a204, roughness: .55 });
    // 29 Oct 01:xx (07:xx review: "lid and lower body flat matt black at phone size, grip posts plain cubes"): the lid shell becomes a satin charcoal moulding
    // with rounded (bevelled) edges that catch a light line, and its top is a separate inset panel with a coarse moulded grain (map + bump, own RNG 7433,
    // so the case RNG above is untouched) in a matt, slightly lighter tone, so the lid reads as rim + textured panel instead of one black field.
    // Grip posts are round with a flared foot. Same signature, same footprint.
    let gs = 7433; const gr = () => (gs = (gs * 16807) % 2147483647) / 2147483647;
    const grain = cvs(256, 256, (x, W, H) => { x.fillStyle = '#808080'; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 5200; i++) { const l = gr() < .5; x.fillStyle = `rgba(${l ? '255,255,255' : '0,0,0'},${.08 + gr() * .12})`; const r = 1 + gr() * 1.2; x.beginPath(); x.arc(gr() * W, gr() * H, r, 0, 7); x.fill(); } });
    grain.colorSpace = THREE.NoColorSpace; grain.repeat.set(12, 12);
    const kL = STD({ map: kS.map, color: 0xe2e4e8, roughness: .4 });                                   // lid shell: satin, so the rounded edges pick up a highlight
    const kB = STD({ map: kS.map, color: 0xffffff, roughness: .36 });                                  // bumpers + parting rim: satin rubber, a touch darker than the lid
    const bumpG = (r, H) => { const R = r + .003, P = [[0, 0], [R - .004, 0], [R - .001, .002], [R, .006], [R + .0007, H * .5], [R, H - .006], [R - .001, H - .002], [R - .004, H], [0, H]];
      const G = new THREE.LatheGeometry(P.map(([a, b]) => new THREE.Vector2(a, b)), 14); G.computeVertexNormals(); return G; };
    const kP = STD({ map: grain, color: 0x4a4c51, roughness: .84, bumpMap: grain, bumpScale: 1.1, roughnessMap: grain });   // lid top panel: matt moulded grain (a map, so the wear pass leaves it)
    const slabB = (w, d, r, h, bv) => { const G = new THREE.ExtrudeGeometry(rrect(w - 2 * bv, d - 2 * bv, Math.max(.002, r - bv)), { depth: h - 2 * bv, bevelEnabled: true, bevelThickness: bv, bevelSize: bv, bevelSegments: 3, curveSegments: 4 }); G.rotateX(-Math.PI / 2); G.translate(0, bv, 0); G.computeVertexNormals(); return G; };
    const rrect = (w, d, r) => { const s = new THREE.Shape(), a = w / 2, b = d / 2; s.moveTo(-a + r, -b); s.lineTo(a - r, -b); s.quadraticCurveTo(a, -b, a, -b + r); s.lineTo(a, b - r); s.quadraticCurveTo(a, b, a - r, b); s.lineTo(-a + r, b); s.quadraticCurveTo(-a, b, -a, b - r); s.lineTo(-a, -b + r); s.quadraticCurveTo(-a, -b, -a + r, -b); return s; };
    const slab = (w, d, r, h, taper = 0) => { const G = new THREE.ExtrudeGeometry(rrect(w, d, r), { depth: h, bevelEnabled: false, curveSegments: 4 }); G.rotateX(-Math.PI / 2);
      if (taper) { const P_ = G.attributes.position; for (let i = 0; i < P_.count; i++) { const k = 1 - taper * (1 - P_.getY(i) / h); P_.setX(i, P_.getX(i) * k); P_.setZ(i, P_.getZ(i) * k); } }
      G.computeVertexNormals(); return G; };
    const M = (p, G, m, x, y, z) => { const o = new THREE.Mesh(G, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; p.add(o); return o; };
    // 29 Oct 07:xx (03:xx review, wstop: "the case looks a touch floaty: its contact shadow on the bench is thin"): the bench bake darkens round each part's
    // bounding box, but the base tapers in 4 % to its foot and the bumpers stand proud, so the bake's tight core sat hidden under the overhang. Each case now
    // carries its own shadow sheet drawn from the real foot outline: a dark core right at the foot (≈ 5 mm) and a soft 2 cm spread. Transparent, so the
    // bake, the merge and the wear pass all skip it; no RNG drawn. One texture per case size.
    const fsTex = new Map(), FSM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    const footShadow = (w, d) => { const pad = .05, PW = w + 2 * pad, PD = d + 2 * pad, key = w.toFixed(3) + ',' + d.toFixed(3); let m = fsTex.get(key);
      if (!m) { const PPM = 400, W = Math.ceil(PW * PPM), H = Math.ceil(PD * PPM), fx = (w - .012) * .96 / 2, fz = (d - .012) * .96 / 2, c = document.createElement('canvas'); c.width = W; c.height = H;
        const x = c.getContext('2d'), im = x.createImageData(W, H);
        for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const px = (i + .5) / PPM - PW / 2, pz = (j + .5) / PPM - PD / 2, dd = Math.hypot(Math.max(0, Math.abs(px) - fx), Math.max(0, Math.abs(pz) - fz));
          const a = dd <= 0 ? .9 : Math.min(.9, .62 * Math.exp(-dd / .0045) + .3 * Math.exp(-dd / .018)), q = (j * W + i) * 4; im.data[q] = 20; im.data[q + 1] = 14; im.data[q + 2] = 8; im.data[q + 3] = a * 255; }
        x.putImageData(im, 0, 0); m = FSM.clone(); m.map = new CT(c); m.map.colorSpace = THREE.SRGBColorSpace; fsTex.set(key, m); }
      const s = new THREE.Mesh(new THREE.PlaneGeometry(PW, PD), m); s.rotation.x = -Math.PI / 2; s.position.y = .0025; s.renderOrder = 2; s.userData.noAO = true; return s; };
    return (p, x, y, z, w, h, d, ry = 0) => { const g = grp(p, x, y, z, ry), r = Math.min(.022, w * .07, d * .07), hb = h * .56, hl = h - hb;
      M(g, slab(w - .012, d - .012, r, hb - .006, .04), yS, 0, 0, 0);                                   // yellow base, a touch narrower at the foot
      g.add(footShadow(w, d));                                                                          // 29 Oct 07:xx: its own tight contact shadow round the foot
      // 29 Oct 03:xx (01:xx run's find: "bumpers and parting rim flat matt black, no edge light"): rubber corner caps turned on a lathe (rounded top and foot,
      // a slight belly) in a satin charcoal (kB), and the parting rim a bevelled band in the same satin, so both pick up a light line at phone size.
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) M(g, bumpG(r, hb - .014), kB, sx * (w / 2 - r - .004), 0, sz * (d / 2 - r - .004));   // corner bumpers
      M(g, slabB(w - .004, d - .004, r + .002, .007, .0025), kB, 0, hb - .008, 0);                    // dark parting rim, rounded edges
      M(g, slabB(w, d, r + .004, hl - .006, .005), kL, 0, hb - .002, 0);                              // lid, rounded edges
      M(g, slabB(w - .03, d - .03, r, .009, .002), kP, 0, h - .011, 0);                                // lid top: grained panel, a step in from the edge
      for (const s of [-1, 1]) { const rb = M(g, new THREE.CapsuleGeometry(.008, w * .76, 3, 10), kL, 0, h - .002, s * d * .3); rb.rotation.z = Math.PI / 2; rb.scale.set(.55, 1, 1); }   // two stacking ribs: wide, low, rounded satin ridges half-sunk into the lid top
      for (const sx of [-1, 1]) { const lx = sx * w * .33;
        box(g, .052, .044, .006, keep, lx, hb - .05, d / 2 - .004);                                       // recessed yellow keep on the base front
        // 29 Oct 06:xx (03:xx review, wscase: "the steel flip latches are flat grey slabs: no hinge barrel, no hook detail"): each latch is a pressed
        // plate with rounded corners and a pressed rib down its middle, rolled round a barrel at the top that turns on a pin held by two lugs on the lid,
        // and curled into a hook lip at the foot that sits over a catch tongue on the yellow keep. All parts mapped (stl / kL / keep), so the wear pass
        // still skips them; no RNG drawn, so nothing else moves.
        const L = M(g, slabB(.04, .044, .007, .0045, .0015), stl, lx, hb - .006, d / 2 + .0035); L.rotation.x = Math.PI / 2 - .04;   // pressed latch plate over the parting line
        const rib = M(g, new THREE.CapsuleGeometry(.0035, .02, 3, 8), stl, lx, hb - .008, d / 2 + .0082); rib.scale.set(1, 1, .45);   // pressed stiffening rib
        const bar = cyl(g, .0068, .04, stl, lx, hb + .018, d / 2 + .0062); bar.rotation.z = Math.PI / 2;     // the plate rolled round its pin: hinge barrel
        for (const s of [-1, 1]) box(g, .005, .018, .011, kL, lx + s * .0235, hb + .009, d / 2 + .004);     // pivot lugs moulded on the lid, either side of the barrel
        const lip = cyl(g, .0034, .04, stl, lx, hb - .03, d / 2 + .0075); lip.rotation.z = Math.PI / 2;     // hook lip curled at the foot
        box(g, .04, .0035, .007, stl, lx, hb - .0335, d / 2 + .0035);                                      // the hook turning in under the lip
        box(g, .03, .006, .007, keep, lx, hb - .0405, d / 2 + .0005);                                      // catch tongue on the keep, the hook sits over it
        const pin = cyl(g, .003, .052, stl, lx, hb + .018, d / 2 + .0062); pin.rotation.z = Math.PI / 2;     // hinge pin, ends showing through the lugs
        const hg = cyl(g, .007, w * .14, kS, sx * w * .3, hb, -d / 2 - .002); hg.rotation.z = Math.PI / 2; }  // lid hinges at the back
      for (const sx of [-1, 1]) { cyl(g, .0125, .03, kR, sx * w * .2, h + .013, 0, 'y', 14); cyl(g, .018, .006, kR, sx * w * .2, h + .001, 0, 'y', 14); }   // round grip posts with a flared foot, standing on the lid
      const hd = tmesh(g, new THREE.CapsuleGeometry(.012, w * .4, 3, 10), kR, 0, h + .036, 0); hd.rotation.z = Math.PI / 2;   // grip, resting on the posts
      for (let i = 0; i < 3; i++) box(g, w * .7, .004, .006, kS, 0, hb + hl * .3 + i * .016, -d / 2 - .004);  // ribs on the lid back
      return g; }; })();
  const caseY = (p, x, y, z, w, h, d, ry = 0) => CASEY(p, x, y, z, w, h, d, ry);   // yellow-and-black tool case
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
  // 25 Oct 00:xx: claw hammer rebuilt (07:xx review: "hammers read as thin sticks"): forged head as one extruded side profile (round-cornered eye, cheek, a claw that
  // curves back and down, split in two with a V gap), a round neck flaring to a bevelled face with a polished disc; an oval ash handle ≈ 34 × 25 mm with a
  // fat moulded rubber grip and a flared butt; wedge end showing through the top of the eye. Same origin, same height (head centre .295), so the hooks don't move
  // 26 Oct 00:xx (07:xx review: "hammer heads matte black like plastic, no bright strike face or polished cheeks"): the head is forged steel with its own
  // small sheet (blue-grey forge scale, darker in the eye's corners, lighter rubs, a few oily smudges), a lighter value and lower metalness so it doesn't go
  // black inside the workshop's light gate; the face, its bevel and the claw tips are ground bright (POLISH, metalness .5 not .85, same trap as the vice's bar).
  // Having a map, the head skips the small-kit wear pass. Own RNG, no layout draws.
  const HEADM = (() => { let hs = 7717; const hr = () => (hs = (hs * 16807) % 2147483647) / 2147483647, hf = (a, b) => a + (b - a) * hr();
    const mk = (draw, srgb) => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); draw(x, 128); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(16, 16); t.anisotropy = 4; return t; };
    const spots = (x, n, r0, r1, rgb, a0, a1) => { for (let i = 0; i < n; i++) { const cx = hf(0, 128), cy = hf(0, 128), r = hf(r0, r1), a = hf(a0, a1); for (const [ox, oy] of [[0, 0], [128, 0], [-128, 0], [0, 128], [0, -128]]) { const g = x.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = g; x.fillRect(cx + ox - r, cy + oy - r, 2 * r, 2 * r); } } };
    const map = mk((x, w) => { x.fillStyle = '#e4e6ea'; x.fillRect(0, 0, w, w); spots(x, 40, 6, 22, '70,78,92', .12, .3); spots(x, 22, 4, 14, '255,255,255', .1, .25); spots(x, 10, 5, 16, '40,34,28', .1, .22);   // forge scale, rubs, oil
      for (let i = 0; i < 500; i++) { x.fillStyle = `rgba(${hr() < .5 ? '255,255,255' : '60,64,72'},${hf(.05, .18)})`; x.fillRect(hf(0, w), hf(0, w), hf(.6, 1.6), hf(.6, 1.6)); } }, true);
    const rough = mk((x, w) => { x.fillStyle = '#b0b0b0'; x.fillRect(0, 0, w, w); spots(x, 30, 6, 20, '255,255,255', .12, .3); spots(x, 22, 4, 14, '60,60,60', .15, .35);
      for (let i = 0; i < 700; i++) { x.fillStyle = `rgba(${hr() < .5 ? '255,255,255' : '40,40,40'},${hf(.08, .25)})`; x.fillRect(hf(0, w), hf(0, w), 1, 1); } });
    return STD({ color: 0x5d646c, roughness: .6, metalness: .4, map, roughnessMap: rough, bumpMap: rough, bumpScale: .5 }); })();
  const mUV = (geo, su, sv) => { const u = geo.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i) * su, u.getY(i) * sv); return geo; };   // cylinder UVs (0–1 round it) to metres, like the extrudes, or the 16× tile goes to grain noise and the bump turns the neck black
  const POLISH = STD({ color: 0xd2d7dc, roughness: .2, metalness: .5 });
  const quadPts = (a, c, b, t0, t1, n) => { const o = []; for (let i = 0; i <= n; i++) { const t = t0 + (t1 - t0) * i / n, u = 1 - t; o.push(new THREE.Vector2(u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1])); } return o; };
  const ex2 = (sh, d, bv, seg = 2) => { const e = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelSize: bv, bevelThickness: bv, bevelSegments: seg, curveSegments: 12 }); e.translate(0, 0, -d / 2); return e; };
  // 31 Oct 00:xx (30 Oct 07:xx review: "the five hammers are identical clones"): a variant per hammer. v 0 is the old ash + black rubber grip (bench hammers keep
  // it); 1 plain ash with no grip and a smaller 16 oz head; 2 yellow fibreglass shaft with a black grip; 3 ash with a red grip; 4 a one-piece steel hammer with a
  // blue vinyl grip and a bigger head. The head is built in its own group at (0, hy) so it can be scaled about its centre; the hooks under it don't move.
  // 31 Oct 06:xx (03:xx review: "the plain-ash handle splits into a light upper half and a dark lower band with a hard edge, a texture seam"): the plain-ash
  // handle gets its own map (so the wear pass skips it): ash with fine lengthwise grain, darkening into a hand-worn, slightly glossier grip over the bottom
  // third with a ≈ 4 cm soft, uneven fade (no separate band mesh). Canvas top = v 1 = the head end. Own RNG (6061); nothing else draws.
  const ashWorn = (() => { let hs = 6061; const hr = () => (hs = (hs * 16807) % 2147483647) / 2147483647;
    const mkc = () => { const c = document.createElement('canvas'); c.width = 64; c.height = 512; return [c, c.getContext('2d')]; };
    const [c, x] = mkc(), [rc, rx] = mkc(), W = 64, H = 512;
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#e2c08e'); g.addColorStop(.55, '#d8b27d'); g.addColorStop(.6, '#b98d5b'); g.addColorStop(.66, '#9d7143');   // pale ash (the 06:xx first try at the old #b98a55 sat as dark as the pegboard)
    g.addColorStop(.76, '#90653b'); g.addColorStop(1, '#8a5f37'); x.fillStyle = g; x.fillRect(0, 0, W, H);   // 31 Oct 23:xx: grip's top edge a little firmer (fade ≈ 4 → 2.5 cm; review: "smoother but says less")
    for (let i = 0; i < 26; i++) { const y = H * (.56 + hr() * .16), r = 10 + hr() * 22, a = .08 + hr() * .1, cx = hr() * W;   // uneven fade: a few soft darker patches where fingers sit
      for (const ox of [-W, 0, W]) { const rg = x.createRadialGradient(cx + ox, y, 0, cx + ox, y, r); rg.addColorStop(0, `rgba(110,72,40,${a})`); rg.addColorStop(1, 'rgba(110,72,40,0)'); x.fillStyle = rg; x.fillRect(cx + ox - r, y - r * 2.4, 2 * r, r * 4.8); } }
    for (let i = 0; i < 70; i++) { const gx = hr() * W, w = .5 + hr() * 1.3, a = .05 + hr() * .1, dark = hr() < .7; x.strokeStyle = dark ? `rgba(90,58,30,${a})` : `rgba(235,205,160,${a * .8})`; x.lineWidth = w;   // lengthwise grain, wavering a little
      x.beginPath(); x.moveTo(gx, 0); for (let y = 0; y <= H; y += 32) x.lineTo(gx + Math.sin(y * .011 + i) * 1.6 + (hr() - .5) * .8, y); x.stroke(); }
    for (let i = 0; i < 1400; i++) { x.fillStyle = `rgba(${hr() < .5 ? '240,215,175' : '80,50,25'},${.03 + hr() * .04})`; x.fillRect(hr() * W, hr() * H, 1, 1 + hr() * 3); }   // pores along the grain
    const rgr = rx.createLinearGradient(0, 0, 0, H); rgr.addColorStop(0, '#9a9a9a'); rgr.addColorStop(.58, '#949494'); rgr.addColorStop(.74, '#707070'); rgr.addColorStop(1, '#666');   // hand-polished grip: smoother
    rx.fillStyle = rgr; rx.fillRect(0, 0, W, H); for (let i = 0; i < 900; i++) { rx.fillStyle = `rgba(${hr() < .5 ? '255,255,255' : '0,0,0'},.06)`; rx.fillRect(hr() * W, hr() * H, 1, 2); }
    const t = new THREE.CanvasTexture(c), rt = new THREE.CanvasTexture(rc); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return STD({ map: t, roughness: .62, roughnessMap: rt }); })();
  const vUV = (geo, v0, v1) => { const u = geo.attributes.uv; for (let i = 0; i < u.count; i++) u.setY(i, v0 + (v1 - v0) * u.getY(i)); return geo; };   // squeeze a part's v into one band of the handle map
  const HMV = [{ h: WOODH, g: GRIP, r: BLK, hs: 1 }, { h: ashWorn, g: null, hs: .9, ash: true },
    { h: STD({ color: 0xe2b21c, roughness: .35 }), g: STD({ color: 0x1e1f21, roughness: .8 }), r: STD({ color: 0xe2b21c, roughness: .35 }), hs: 1.04 },
    { h: WOODH, g: STD({ color: 0xa3281f, roughness: .75 }), r: STD({ color: 0x5a1410, roughness: .7 }), hs: 1 },
    { h: STD({ color: 0x9aa1a8, roughness: .35, metalness: .55 }), g: STD({ color: 0x2b5590, roughness: .6 }), r: STD({ color: 0x1d3d6c, roughness: .6 }), hs: 1.08, steel: true }];
  const hammer = (p, x, y, z, ry, v = 0) => { const g = grp(p, x, y, z, ry), hy = .295, V = HMV[v];
    const hd = tmesh(g, new THREE.CylinderGeometry(V.steel ? .0095 : .0125, V.steel ? .011 : .015, .3, 14), V.h, 0, .15, 0); hd.scale.set(1.35, 1, 1);   // oval handle, thicker at the bottom (steel: a slimmer forged shank)
    if (V.g) { const gr = tmesh(g, new THREE.CylinderGeometry(.0185, .0205, .12, 16), V.g, 0, .062, 0); gr.scale.set(1.25, 1, 1);   // moulded grip
      const bt = tmesh(g, new THREE.CylinderGeometry(.0225, .02, .014, 16), V.g, 0, .007, 0); bt.scale.set(1.25, 1, 1);   // flared butt
      for (let i = 0; i < 4; i++) { const r = tmesh(g, new THREE.TorusGeometry(.0198, .0016, 4, 18), V.r, 0, .03 + i * .024, 0); r.rotation.x = Math.PI / 2; r.scale.set(1.25, 1, 1); } }   // grip rings
    else { const bt = tmesh(g, vUV(new THREE.CylinderGeometry(.0175, .0155, .016, 14), .005, .05), V.h, 0, .008, 0); bt.scale.set(1.35, 1, 1); }   // bare ash: a swelled butt end; the hand-worn grip is in the handle's own map (31 Oct 06:xx)
    const H = grp(g, 0, hy, 0); H.scale.setScalar(V.hs);   // the head, scaled about its own centre
    const ey = new THREE.Shape(); ey.moveTo(-.018, -.021); ey.lineTo(.016, -.021); ey.quadraticCurveTo(.022, -.021, .022, -.014); ey.lineTo(.022, .014); ey.quadraticCurveTo(.022, .02, .016, .02);
    ey.lineTo(-.018, .02); ey.quadraticCurveTo(-.023, .02, -.023, .014); ey.lineTo(-.023, -.014); ey.quadraticCurveTo(-.023, -.021, -.018, -.021);
    tmesh(H, ex2(ey, .022, .003), HEADM, 0, 0, 0);   // eye block / cheeks
    const nk = tmesh(H, mUV(new THREE.CylinderGeometry(.0175, .0125, .036, 16), .1, .036), HEADM, .04, 0, 0); nk.rotation.z = -Math.PI / 2;   // neck flaring out to the face
    const fc = tmesh(H, mUV(new THREE.CylinderGeometry(.0168, .0178, .012, 18), .11, .012), HEADM, .0625, 0, 0); const fb = tmesh(H, new THREE.CylinderGeometry(.0158, .0174, .004, 18), POLISH, .0697, 0, 0); fb.rotation.z = -Math.PI / 2; fc.rotation.z = -Math.PI / 2;   // face ring, bevelled
    const fr = tmesh(H, new THREE.CylinderGeometry(.0148, .0162, .003, 18), POLISH, .0725, 0, 0); fr.rotation.z = -Math.PI / 2;   // ground bevel + polished striking face
    const CO = [[-.02, .016], [-.07, .02], [-.104, -.026]], CI = [[-.098, -.032], [-.07, -.004], [-.02, -.012]], TT = .8;   // claw outer / inner curves; the last 20 % ground bright
    const cl = new THREE.Shape([...quadPts(...CO, 0, TT, 10), ...quadPts(...CI, 1 - TT, 1, 10)]), ct = new THREE.Shape([...quadPts(...CO, TT, 1, 4), ...quadPts(...CI, 0, 1 - TT, 4)]);
    for (const sz of [-1, 1]) { tmesh(H, ex2(cl, .0075, .0015, 1), HEADM, 0, 0, sz * .0062); tmesh(H, ex2(ct, .0075, .0015, 1), POLISH, 0, 0, sz * .0062); }   // split claw, curving back and down, bright tips
    const wd = tmesh(H, V.ash ? vUV(new THREE.CylinderGeometry(.009, .009, .004, 12), .95, 1) : new THREE.CylinderGeometry(.009, .009, .004, 12), V.steel ? HEADM : V.h, 0, .0225, 0); wd.scale.set(1.35, 1, 1);   // handle end through the eye
    if (!V.steel) box(H, .016, .002, .0025, POLISH, 0, .0245, 0);   // steel wedge (none on a one-piece steel hammer)
    return g; };
  // 1 Nov 00:xx (31 Oct 07:xx review: "the spanners hang in a stiff, evenly spaced row, all the same tone"): a collected set, not a catalogue row.
  // k 0 bright chrome (as before), 1 black oxide (dark, satin), 2 an older satin chrome gone a little dull and warm. No RNG drawn.
  const SPANM = [[BRIGHT, STD({ color: 0x8c9196, metalness: .85, roughness: .4 })], [STD({ color: 0x3a3d40, metalness: .6, roughness: .5 }), STD({ color: 0x2c2e31, metalness: .55, roughness: .58 })],
    [STD({ color: 0xa8a69f, metalness: .75, roughness: .42 }), STD({ color: 0x8a8781, metalness: .7, roughness: .5 })]];
  const spanner = (p, x, y, z, L, k = 0) => { const g = grp(p, x, y, z), SB = SPANM[k][0], SC = SPANM[k][1];   // 24 Oct 05:xx: a real combination spanner (was a bar with a torus and two jaw stubs): 12-point ring at the top, open jaw at 15° at the bottom, tapered I-section shaft; hung by its ring on a hook
    const s = .006 + L * .045, Ro = s * 1.08, Rr = s * .98, yr = L * .9, ex = (sh, d, bv) => { const e = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelSize: bv, bevelThickness: bv, bevelSegments: 2, curveSegments: 18 }); e.translate(0, 0, -d / 2); return e; };
    const ring = new THREE.Shape(); ring.absarc(0, 0, Rr, 0, Math.PI * 2, false);
    const hole = new THREE.Path(); for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2, r = s * (i % 2 ? .5 : .57); i ? hole.lineTo(Math.cos(a) * r, Math.sin(a) * r) : hole.moveTo(r, 0); } ring.holes.push(hole);
    tmesh(g, ex(ring, .0055, .0012), SB, 0, yr, 0);
    const jaw = new THREE.Shape(), a0 = -Math.PI / 2 + Math.asin(s / 2 / Ro), yt = s * .1;   // jaw opening points down, cut s wide with a round throat
    jaw.moveTo(Math.cos(a0) * Ro, Math.sin(a0) * Ro); jaw.absarc(0, 0, Ro, a0, -Math.PI / 2 - Math.asin(s / 2 / Ro) + Math.PI * 2, false);
    jaw.lineTo(-s / 2, yt); jaw.absarc(0, yt, s / 2, Math.PI, 0, true); jaw.lineTo(s / 2, Math.sin(a0) * Ro);
    const jm = tmesh(g, ex(jaw, .005, .0012), SB, 0, 0, 0); jm.rotation.z = .26;   // the 15° offset
    const sh = new THREE.Shape(), y0 = Ro * .55, y1 = yr - Rr * .6, w0 = s * .55, w1 = s * .48; sh.moveTo(-w0, y0); sh.lineTo(w0, y0); sh.lineTo(w1, y1); sh.lineTo(-w1, y1); sh.lineTo(-w0, y0);
    tmesh(g, ex(sh, .0034, .001), SB, 0, 0, 0);
    for (const sz of [-1, 1]) box(g, w0 * .9, (y1 - y0) * .8, .0008, SC, 0, y0 + (y1 - y0) * .1, sz * .0026);   // the shaft's recessed centre (box() takes the BOTTOM y), a shade duller
    { const hy = yr + s * .5 - .0029; peg(g, 0, hy, -.017, .027, .012); }   // the hook through the ring (touching the top of the hole), 10 mm proud with an upturned tip (26 Oct: the tip is part of the bent-wire hook now)
    return g; };
  // 24 Oct 23:xx: hand saws rebuilt (07:xx review: "blades flat slabs with a blown highlight and no teeth; handles a plain arch block").
  // Blade: 0.9 mm steel plate, 110 fine teeth down the front edge, its own small canvas (satin grey, brushed along the length, faint small smudges,
  // a ground bright strip with alternating tooth ticks along the toothed edge, a faint etched mark at the heel) so the use-wear pass leaves it alone.
  // Handle: a pistol grip with a horn, a D-shaped hand hole (top kept at .095, so the hook stays put) and a black soft-grip pad on the back bar.
  let SAWTEX = null; const sawTex = () => { if (SAWTEX) return SAWTEX; let ss = 7717; const sr = () => (ss = (ss * 16807) % 2147483647) / 2147483647;
    const c = document.createElement('canvas'), W = 128, H = 512; c.width = W; c.height = H; const x = c.getContext('2d');
    const U = u => (u + .065) / .13 * W, V = y => (1 - (y + .455) / .48) * H;   // blade metres → canvas px (same mapping as the blade's UVs)
    const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#80878c'); g.addColorStop(.6, '#949a9f'); g.addColorStop(1, '#8a9095'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(${sr() < .5 ? '255,255,255' : '60,62,66'},${.03 + sr() * .06})`; x.fillRect(sr() * W, 0, .6 + sr() * 1.2, H); }   // brushed along the length
    { const sg = x.createLinearGradient(0, H * .15, W, H * .55); sg.addColorStop(.3, 'rgba(255,255,255,0)'); sg.addColorStop(.5, 'rgba(255,255,255,.16)'); sg.addColorStop(.7, 'rgba(255,255,255,0)'); x.fillStyle = sg; x.fillRect(0, 0, W, H); }   // 31 Oct 04:xx: a soft diagonal sheen so the blade reads as steel, not a flat grey card (no RNG)
    for (let i = 0; i < 40; i++) { const cx = sr() * W, cy = sr() * H, r = 2 + sr() * 6, rg = x.createRadialGradient(cx, cy, 0, cx, cy, r); rg.addColorStop(0, `rgba(40,36,32,${.05 + sr() * .09})`); rg.addColorStop(1, 'rgba(40,36,32,0)'); x.fillStyle = rg; x.fillRect(cx - r, cy - r, 2 * r, 2 * r); }   // small faint finger smudges
    for (let i = 0; i < 14; i++) { x.fillStyle = `rgba(120,64,30,${.2 + sr() * .3})`; x.fillRect(sr() * W, sr() * H, 1, 1); }   // a few rust pin-pricks
    const ax = U(.06), ay = V(.02), bx = U(.01), by = V(-.45), L = Math.hypot(bx - ax, by - ay), dx = (bx - ax) / L, dy = (by - ay) / L, nx = -dy, ny = dx;   // the toothed edge; n points into the blade (−x)
    const strip = (off, w, col) => { x.strokeStyle = col; x.lineWidth = w; x.beginPath(); x.moveTo(ax - nx * off, ay - ny * off); x.lineTo(bx - nx * off, by - ny * off); x.stroke(); };
    strip(4.2, 5.2, 'rgba(236,240,242,.95)'); strip(7.6, 1.8, 'rgba(60,64,68,.6)');   /* 31 Oct 04:xx: strip 3.2 → 5.2 px (≈ 5 mm), so the tooth line reads on a phone */   // ground bright edge, a thin dark line where the set starts
    const n = 110; x.lineWidth = 1.6; for (let i = 0; i < n; i++) { const t = (i + .5) / n * L, px = ax + dx * t, py = ay + dy * t; x.strokeStyle = i % 2 ? 'rgba(40,44,48,.7)' : 'rgba(255,255,255,.8)';
      x.beginPath(); x.moveTo(px - nx * .5, py - ny * .5); x.lineTo(px - nx * 3.5, py - ny * 3.5); x.stroke(); }   // alternate tooth ticks (set left/right catches the light)
    x.save(); x.translate(U(-.02), V(-.05)); x.rotate(-Math.PI / 2); x.fillStyle = 'rgba(40,44,50,.35)'; x.fillRect(-2, -9, 64, 13); x.fillStyle = 'rgba(200,205,210,.45)'; x.font = 'bold 9px Arial'; x.fillText('HARDPOINT 8', 1, 1); x.restore();   // faint etched mark at the heel
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return SAWTEX = STD({ map: t, metalness: .6, roughness: .52, side: THREE.DoubleSide }); };   // satin, not mirror: at .8/.32 the room light blew it out white
  // 31 Oct 04:xx (03:xx review: "handles blobby red with white speckles, melted plastic"): the handle had no map, so the wear pass gave it the paint
  // chip tile (white speckles). It now has its own moulded-plastic canvas (so the wear pass skips it): satin red, light from the top, a fine
  // orange-peel grain, a slightly darker moulded border round the outline, a ribbed thumb pad by the horn and a small raised maker's mark.
  // Handle metres → canvas: u = (x + .1) / .2, v = y / .16 (set on the geometry below). Own RNG, nothing else moves.
  const SAWSCR = STD({ color: 0x9c8a5a, metalness: .6, roughness: .5 });   // 31 Oct 04:xx: dull brass handle screws, 9 mm (were 12 mm mirror-bright BRIGHT: read as two white blobs on the phone)
  const SAWHM = []; const sawHandle = (k = 0) => { if (SAWHM[k]) return SAWHM[k]; let hs = 5531; const hr = () => (hs = (hs * 16807) % 2147483647) / 2147483647;
    const c = document.createElement('canvas'), W = 256, H = 205; c.width = W; c.height = H; const x = c.getContext('2d'), U = u => (u + .1) / .2 * W, V = y => (1 - y / .16) * H;
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#c4402a'); g.addColorStop(.55, '#ad3320'); g.addColorStop(1, '#962a1a'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(${hr() < .5 ? '255,200,180' : '70,10,5'},${.025 + hr() * .035})`; x.fillRect(hr() * W, hr() * H, 1 + hr(), 1 + hr()); }   // orange peel, low contrast
    const out = () => { x.beginPath(); x.moveTo(U(-.075), V(0)); x.lineTo(U(.07), V(0)); x.lineTo(U(.072), V(.05)); x.quadraticCurveTo(U(.092), V(.075), U(.086), V(.112));
      x.quadraticCurveTo(U(.06), V(.148), U(0), V(.142)); x.quadraticCurveTo(U(-.06), V(.138), U(-.08), V(.118)); x.quadraticCurveTo(U(-.094), V(.085), U(-.085), V(.05)); x.closePath(); };
    const hole = () => { x.beginPath(); x.moveTo(U(-.04), V(.03)); x.lineTo(U(.035), V(.03)); x.quadraticCurveTo(U(.045), V(.1), U(0), V(.095)); x.quadraticCurveTo(U(-.05), V(.1), U(-.04), V(.03)); x.closePath(); };
    x.lineJoin = 'round'; out(); x.strokeStyle = 'rgba(90,20,10,.28)'; x.lineWidth = 9; x.stroke(); x.strokeStyle = 'rgba(255,190,170,.18)'; x.lineWidth = 3; x.stroke();   // moulded border: darker band just inside the bevel, light lip on it
    hole(); x.strokeStyle = 'rgba(90,20,10,.3)'; x.lineWidth = 7; x.stroke();
    x.save(); x.translate(U(.068), V(.085)); x.rotate(-.35); for (let i = 0; i < 7; i++) { x.fillStyle = 'rgba(80,16,8,.35)'; x.fillRect(-9, -14 + i * 4.4, 18, 1.6); x.fillStyle = 'rgba(255,200,180,.2)'; x.fillRect(-9, -12.6 + i * 4.4, 18, 1); } x.restore();   // ribbed thumb pad by the horn
    x.font = 'bold 11px Arial'; x.textAlign = 'center'; x.fillStyle = 'rgba(255,190,170,.22)'; x.fillText('HARDPOINT', U(0) + .7, V(.113) + .7); x.fillStyle = 'rgba(80,14,6,.38)'; x.fillText('HARDPOINT', U(0), V(.113));   // raised mark above the hole
    for (let i = 0; i < 6; i++) { x.strokeStyle = `rgba(255,230,220,${.06 + hr() * .06})`; x.lineWidth = .8; x.beginPath(); const a = hr() * W, b = hr() * H; x.moveTo(a, b); x.lineTo(a + 6 + hr() * 14, b + (hr() - .5) * 4); x.stroke(); }   // a few fine scuffs
    // 31 Oct 23:xx (meet halfway after the 31 Oct 07:xx review: the clean moulded handle read "toy-like"): each saw gets its own fine, low-contrast use wear
    // on top of the same moulded base: hairline scratches (mostly pale, some dark, alpha ≤ .1, never white chips), a dulled rub where the palm sits on the
    // back bar and round the hole, soft grey scuffs on the lower edge where it gets dropped on benches. Own RNG per saw, so nothing else in the hall moves
    { let ws = 7103 + k * 977; const wr = () => (ws = (ws * 16807) % 2147483647) / 2147483647, amt = [1, 1.45, .7][k] || 1;
      x.save(); out(); x.clip();
      for (const [cx, cy, rr] of [[U(-.06), V(.07), 34], [U(0), V(.115), 30], [U(.0), V(.025), 26]]) { const rg = x.createRadialGradient(cx, cy, 0, cx, cy, rr); rg.addColorStop(0, `rgba(125,78,70,${.16 * amt})`); rg.addColorStop(1, 'rgba(125,78,70,0)'); x.fillStyle = rg; x.fillRect(cx - rr, cy - rr, 2 * rr, 2 * rr); }   // palm rub: duller, a touch greyer
      for (let i = 0; i < Math.round(120 * amt); i++) { const a = wr() * W, b = wr() * H, L = 3 + wr() * 16, an = (wr() - .5) * 1.1 + (wr() < .3 ? Math.PI / 2 : 0), lt = wr() < .7;   // hairline scratches
        x.strokeStyle = lt ? `rgba(255,205,190,${.07 + wr() * .09})` : `rgba(60,12,6,${.07 + wr() * .08})`; x.lineWidth = 1 + wr() * .8;
        x.beginPath(); x.moveTo(a, b); x.quadraticCurveTo(a + Math.cos(an) * L * .5 + (wr() - .5) * 2, b + Math.sin(an) * L * .5 + (wr() - .5) * 2, a + Math.cos(an) * L, b + Math.sin(an) * L); x.stroke(); }
      for (let i = 0; i < Math.round(5 * amt); i++) { const cx = U(-.07 + wr() * .14), cy = V(wr() * .02), rr = 5 + wr() * 9;   // bench scuffs along the bottom edge
        const rg = x.createRadialGradient(cx, cy, 0, cx, cy, rr); rg.addColorStop(0, `rgba(120,100,95,${.18 + wr() * .1})`); rg.addColorStop(1, 'rgba(120,100,95,0)'); x.fillStyle = rg; x.fillRect(cx - rr, cy - rr, 2 * rr, 2 * rr);
        for (let j = 0; j < 4; j++) { x.strokeStyle = `rgba(230,190,180,${.1 + wr() * .07})`; x.lineWidth = 1; x.beginPath(); const a = cx + (wr() - .5) * rr, b = cy + (wr() - .5) * rr * .6; x.moveTo(a, b); x.lineTo(a + 2 + wr() * 5, b + (wr() - .5) * 2); x.stroke(); } }
      x.restore(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return SAWHM[k] = STD({ map: t, roughness: .42 }); };
  const saw = (p, x, y, z, k = 0) => { const g = grp(p, x, y, z), sh = new THREE.Shape(); sh.moveTo(-.06, .02);   // hand saw hung by its handle: blade tapers to the toe, teeth down the front edge
    const n = 110; for (let i = 0; i <= n; i++) { const t = i / n; sh.lineTo(.06 - .05 * t + (i % 2 ? .0032 : 0), .02 - .47 * t); }
    sh.lineTo(-.06, -.45); sh.lineTo(-.06, .02);
    const bg = new THREE.ExtrudeGeometry(sh, { depth: .0009, bevelEnabled: false }); bg.translate(0, 0, -.00045);
    { const pa = bg.attributes.position, uv = bg.attributes.uv; for (let i = 0; i < pa.count; i++) uv.setXY(i, (pa.getX(i) + .065) / .13, (pa.getY(i) + .455) / .48); uv.needsUpdate = true; }
    tmesh(g, bg, sawTex(), 0, 0, .001);
    const hs = new THREE.Shape(); hs.moveTo(-.075, 0); hs.lineTo(.07, 0); hs.lineTo(.072, .05); hs.quadraticCurveTo(.092, .075, .086, .112);   // front edge up to the horn
    hs.quadraticCurveTo(.06, .148, .0, .142); hs.quadraticCurveTo(-.06, .138, -.08, .118); hs.quadraticCurveTo(-.094, .085, -.085, .05); hs.lineTo(-.075, 0);   // round top, sloping back
    const hole = new THREE.Path(); hole.moveTo(-.04, .03); hole.lineTo(.035, .03); hole.quadraticCurveTo(.045, .1, .0, .095); hole.quadraticCurveTo(-.05, .1, -.04, .03); hs.holes.push(hole);
    const hg = new THREE.ExtrudeGeometry(hs, { depth: .022, bevelEnabled: true, bevelSize: .004, bevelThickness: .004, bevelSegments: 3, curveSegments: 14 }); hg.translate(0, 0, -.011);
    { const pa = hg.attributes.position, uv = hg.attributes.uv; for (let i = 0; i < pa.count; i++) uv.setXY(i, (pa.getX(i) + .1) / .2, pa.getY(i) / .16); uv.needsUpdate = true; }
    tmesh(g, hg, sawHandle(k), 0, -.01, .005);
    const gp = new THREE.Shape(); gp.moveTo(-.079, .012); gp.lineTo(-.05, .03); gp.quadraticCurveTo(-.052, .07, -.05, .095); gp.quadraticCurveTo(-.062, .118, -.078, .112); gp.quadraticCurveTo(-.088, .08, -.081, .045); gp.lineTo(-.079, .012);   // soft-grip pad on the back bar, proud of both faces
    const gg = new THREE.ExtrudeGeometry(gp, { depth: .028, bevelEnabled: true, bevelSize: .002, bevelThickness: .002, bevelSegments: 2, curveSegments: 10 }); gg.translate(0, 0, -.014);
    tmesh(g, gg, GRIP, 0, -.01, .005);
    for (const sx of [-.035, .035]) { const r = tmesh(g, new THREE.CylinderGeometry(.0045, .0045, .03, 10), SAWSCR, sx, .01, .005); r.rotation.x = Math.PI / 2; }   // brass-ish screws through handle and blade
    peg(g, 0, SAWHOOK, -.012, .04);   /* 24 Oct 07:xx: the hook it hangs on, through the top of the handle's hole (it hung on nothing) */
    return g; };
  const SAWHOOK = .079;   // the saw's hook height above its origin: top of the handle hole (−.01 + .095) less the hook's radius and a little
  // 23 Oct 05:xx: the last plain blocks on the far wall and floor get real shapes (F-clamps, spirit levels, roll cabinet, offcuts bin, bench cable reel). No RNG draws, so nothing else moves
  const CLR = STD({ color: 0xc0221b, roughness: .42, metalness: .25 }), ALU = STD({ color: 0xc3c7ca, metalness: .75, roughness: .38 });
  // 26 Oct 04:xx: a real bent-wire pegboard hook (03:xx review: "peg tools hang with no hooks showing"; it was a straight 5.6 mm rod hidden behind each tool):
  // one zinc-plated wire that comes out of the hole above, runs down the board face (the bit you see over a hung tool), bends out into the arm and
  // turns up at the tip. Same signature and arm length as before, so every tool keeps its spot; the board's shadow bake picks the new shape up
  // 26 Oct 07:xx: zinc read mid-grey inside the workshop (04:xx: "hooks read mid-grey rather than bright zinc"): at metalness .8 almost all its colour comes from
  // the room environment, which wsLightGate cuts to 35 % in here. Bright zinc plating is a pale, faintly blue-white, so: lighter colour, half the metalness
  const ZINC = STD({ color: 0xe6eaea, metalness: .4, roughness: .28 });
  const peg = (p, x, y, z, L = .05, tip = .009) => { const r = .0022, b = .0045, V = (a, c, d) => new THREE.Vector3(0, a, d), cp = new THREE.CurvePath();
    const seg = (a, c) => cp.add(new THREE.LineCurve3(a, c)), bend = (a, c, d) => cp.add(new THREE.QuadraticBezierCurve3(a, c, d));
    seg(V(.025, 0, -.005), V(.025, 0, r - b)); bend(V(.025, 0, r - b), V(.025, 0, r), V(.025 - b, 0, r));   // in the hole above, round onto the face
    seg(V(.025 - b, 0, r), V(b, 0, r)); bend(V(b, 0, r), V(0, 0, r), V(0, 0, r + b));   // down the face, round into the arm
    seg(V(0, 0, r + b), V(0, 0, L - b)); bend(V(0, 0, L - b), V(0, 0, L), V(b, 0, L)); seg(V(b, 0, L), V(tip, 0, L));   // the arm, turned up at the tip
    const k = tmesh(p, new THREE.TubeGeometry(cp, 48, r, 6, false), ZINC, x, y, z); return k; };
  // 25 Oct 00:xx: F-clamp rebuilt (07:xx review: "clamps read as flat boxes"): a 25 × 8 mm bar with its notches, cast jaws with a rounded back and
  // an I-beam web (a darker recessed panel inside a raised rim on both faces), a jaw pad and swivel pad, a thicker threaded spindle and a fat
  // two-tone handle. Hook and footprint unchanged
  const CLRD = STD({ color: 0x8e1712, roughness: .55, metalness: .2, side: THREE.DoubleSide });
  let FCH = null;   // the F-clamp handle's lathe geometry, shared
  // 31 Oct 07:xx (05:xx find: "a hard white glint on the fixed jaw's pad"): the jaw pad and swivel pad were mirror-bright steel (metalness .85, rough .28)
  // and caught the lamp as a white blob; now dull, scuffed cast steel that only gives a soft sheen. Bar, spindle and ferrule stay bright
  const FCPAD = STD({ color: 0x8a8f93, metalness: .55, roughness: .62 });
  const fclamp = (p, x, y, z, L = .45, R = .1) => { const g = grp(p, x, y, z); R *= .88;   // jaws a touch shorter so neighbours 13 cm apart don't touch
    // 31 Oct 05:xx (04:xx run's look at wsclamp: "the bar reads as a ladder"): the notches were 14 dark bars right across the 25 mm face; on a real
    // F-clamp bar the face is plain bright steel and the serrations are small nicks cut into both narrow edges, so they're now 3 mm nicks on each edge
    box(g, .025, L, .008, BRIGHT, 0, -L, 0); for (let i = 0; i < 22; i++) for (const ex of [-1, 1]) box(g, .003, .0026, .0086, DARK, ex * .0112, -L + .02 + i * L / 23, 0);   // the bar and the nicks in its edges
    const jaw = (yy, len, top) => { const k = top ? -1 : 1, sh = new THREE.Shape();   // side profile: thick at the bar, a rounded back curving out to the pad end
      sh.moveTo(-.016, 0); sh.lineTo(len + .004, k * .003); sh.quadraticCurveTo(len + .01, k * .004, len + .01, k * .014); sh.lineTo(len + .006, k * .026);
      sh.quadraticCurveTo(len * .55, k * .028, .028, k * .044); sh.quadraticCurveTo(-.012, k * .05, -.018, k * .036); sh.lineTo(-.016, 0);
      tmesh(g, ex2(sh, .016, .003, 2), CLR, 0, yy, 0);
      const w = new THREE.Shape(); w.moveTo(.004, k * .008); w.lineTo(len - .006, k * .009); w.lineTo(len - .006, k * .02); w.quadraticCurveTo(len * .55, k * .022, .03, k * .034); w.lineTo(.004, k * .034); w.lineTo(.004, k * .008);
      for (const sz of [-1, 1]) tmesh(g, new THREE.ShapeGeometry(w), CLRD, 0, yy, sz * .0111);   // recessed web, both faces
      for (const sz of [-1, 1]) { const rim = box(g, len - .01, .003, .002, CLR, len / 2 - .002, yy + k * .005 - .0015, sz * .0118); } };
    jaw(0, R, true); box(g, .026, .007, .02, FCPAD, R - .006, -.033, 0);   // fixed jaw at the top and its pad
    const sy = -L * .62; jaw(sy, R, false);   // sliding jaw
    tmesh(g, new THREE.CylinderGeometry(.0065, .0065, .12, 10), BRIGHT, R - .006, sy + .03, 0);   // spindle up through the sliding jaw
    for (let i = 0; i < 9; i++) { const t = tmesh(g, new THREE.TorusGeometry(.0065, .0011, 3, 10), DARK, R - .006, sy + .04 + i * .007, 0); t.rotation.x = Math.PI / 2; }   // thread
    tmesh(g, new THREE.CylinderGeometry(.012, .012, .006, 14), FCPAD, R - .006, sy + .09, 0);   // swivel pad
    // 31 Oct 05:xx: the handle was a plain tapered cylinder (read as a dowel); now a turned barrel (LatheGeometry): slim at the ferrule, swelling
    // through the palm, rounded off at the end, with two dark turned grooves sitting on its surface. Same length and spot.
    const hn = tmesh(g, FCH || (FCH = new THREE.LatheGeometry([[0, -.0425], [.008, -.0418], [.0128, -.0392], [.0156, -.034], [.0174, -.022], [.0179, -.006], [.0173, .01], [.0156, .024], [.0136, .035], [.0124, .0425]].map(([r, y]) => new THREE.Vector2(r, y)), 18)), WOODH, R - .006, sy - .052, 0);   // handle
    for (const [t, rr] of [[-.02, .0172], [.016, .0162]]) { const r = tmesh(g, new THREE.TorusGeometry(rr, .0011, 4, 18), DARK, R - .006, sy - .052 + t, 0); r.rotation.x = Math.PI / 2; }   // turned grooves
    tmesh(g, new THREE.CylinderGeometry(.0105, .0125, .012, 12), BRIGHT, R - .006, sy - .004, 0);   // ferrule
    peg(p, x + .01, y + .012, z - .02, .04); return g; };
  // 24 Oct 06:xx: a real pegboard instead of a flat plane with soft blurred holes: 6 mm tempered hardboard (box, dark core on its edges) on 16 mm battens
  // off the wall (a dark gap behind, seen through the holes and round the edges), 6 mm holes at a 25 mm pitch (a small repeating tile: crisp on a phone
  // too, where big canvases get shrunk), screws with washers, and a soft drop shadow under every hung part baked onto the board.
  function pegBoard(p, cx, y0, zf, W, H) {
    let sp = 7717; const pr = () => (sp = (sp * 16807) % 2147483647) / 2147483647, pf = (a, b) => a + (b - a) * pr();   // its own RNG
    const T = 64, hc = document.createElement('canvas'); hc.width = hc.height = T; const hx = hc.getContext('2d');   // one hole per tile (25 mm)
    hx.fillStyle = '#fff'; hx.fillRect(0, 0, T, T); const r = T * 3 / 25 + .4;   // 6 mm hole
    hx.fillStyle = 'rgb(214,214,214)'; hx.beginPath(); hx.arc(T / 2, T / 2, r + 2.2, 0, 7); hx.fill();   // a pressed-in chamfer round each hole
    const gd = hx.createRadialGradient(T / 2, T / 2 + 2, 0, T / 2, T / 2, r); gd.addColorStop(0, 'rgb(14,11,9)'); gd.addColorStop(.75, 'rgb(22,17,13)'); gd.addColorStop(1, 'rgb(48,38,30)');
    hx.fillStyle = gd; hx.beginPath(); hx.arc(T / 2, T / 2, r, 0, 7); hx.fill();
    const hole = new THREE.CanvasTexture(hc); hole.wrapS = hole.wrapT = THREE.RepeatWrapping; hole.repeat.set(W / .025, H / .025); hole.anisotropy = 8;
    const PX = 1024, PY = Math.round(PX * H / W), mc = document.createElement('canvas'); mc.width = PX; mc.height = PY; const x = mc.getContext('2d'), k = PX / W;   // the board's face, 1:1
    x.fillStyle = '#93704c'; x.fillRect(0, 0, PX, PY);
    for (let i = 0; i < 900; i++) { const t = pf(-14, 14); x.fillStyle = `rgba(${147 + t},${112 + t * .8},${76 + t * .6},${pf(.25, .5)})`; x.beginPath(); x.ellipse(pr() * PX, pr() * PY, pf(6, 26), pf(4, 14), pr() * 3, 0, 7); x.fill(); }   // hardboard's soft mottle
    for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${pr() > .5 ? '255,240,220' : '40,25,12'},${pf(.02, .09)})`; x.fillRect(pr() * PX, pr() * PY, 1 + pr() * 2, 1 + pr() * 2); }
    const eg = x.createLinearGradient(0, 0, 0, PY); eg.addColorStop(0, 'rgba(50,35,20,.18)'); eg.addColorStop(.08, 'rgba(50,35,20,0)'); eg.addColorStop(.9, 'rgba(50,35,20,0)'); eg.addColorStop(1, 'rgba(50,35,20,.22)'); x.fillStyle = eg; x.fillRect(0, 0, PX, PY);   // grubby top and bottom edges
    const F = STD({ roughness: .78, bumpMap: hole, bumpScale: 3 }), E = STD({ color: 0x4a3524, roughness: .9 });
    F.onBeforeCompile = sh => { sh.uniforms.pegHole = { value: hole }; sh.fragmentShader = 'uniform sampler2D pegHole;\n' + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n diffuseColor.rgb *= texture2D( pegHole, vBumpMapUv ).rgb;'); };
    F.customProgramCacheKey = () => 'pegHole';
    const g = grp(p), D = .006, B = .016;
    const bd = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), [E, E, E, E, F, E]); bd.position.set(cx, y0 + H / 2, zf - D / 2); bd.castShadow = bd.receiveShadow = true; g.add(bd);
    const BAT = STD({ color: 0x6e5236, roughness: .85 });
    for (const yy of [.03, H / 2, H - .03]) box(g, W - .02, .045, B, BAT, cx, y0 + yy - .0225, zf - D - B / 2);   // battens behind (16 mm stand-off)
    for (const xx of [-W / 2 + .03, 0, W / 2 - .03]) box(g, .045, H - .02, B, BAT, cx + xx, y0 + .01, zf - D - B / 2);
    const gap = new THREE.Mesh(new THREE.PlaneGeometry(W + .02, H + .02), STD({ color: 0x1a140f, roughness: 1 })); gap.position.set(cx, y0 + H / 2, zf - D - B + .002); g.add(gap);   // the dark gap behind
    const SC = STD({ color: 0xb9bcbf, metalness: .7, roughness: .4 });
    for (const yy of [.03, H / 2, H - .03]) for (let xx = -W / 2 + .0375; xx <= W / 2; xx += .375) { if (Math.abs(xx) > W / 2 - .03) continue;
      const w = new THREE.Mesh(new THREE.CylinderGeometry(.009, .009, .0015, 12), SC); w.rotation.x = Math.PI / 2; w.position.set(cx + xx, y0 + yy, zf + .0008); g.add(w);
      const hd = new THREE.Mesh(new THREE.SphereGeometry(.0055, 10, 6, 0, 7, 0, Math.PI / 2), SC); hd.rotation.x = Math.PI / 2; hd.position.set(cx + xx, y0 + yy, zf + .0015); hd.scale.z = .5; g.add(hd); }
    // call once the tools hang on it: a soft drop shadow under every part, offset down by how far it stands off
    // call once the tools hang on it. 25 Oct 04:xx: the shadows come from the tools' real outlines, not their bounding boxes (rounded rects read as
    // blobs under a spanner's ring and barely showed under the clamps): every hung part is rendered once, orthographically from the front, into a
    // render target with a shader that writes how far each pixel stands off the board; the pixels are split into four stand-off bands and each band
    // is drawn onto the board as a soft shadow, pushed down and blurred more the further it stands off (light from the strip lights above and in front)
    g.userData.bake = sets => { g.updateWorldMatrix(true, true); for (const s of sets) s.updateWorldMatrix(true, true);   /* render() below must not recompute their world matrices */
      const o = bd.getWorldPosition(new THREE.Vector3()), S = 2, RW = PX * S, RH = PY * S, MX = .08;   // 2× supersampled; stand-off coded 0–8 cm
      const cam = new THREE.OrthographicCamera(o.x - W / 2, o.x + W / 2, o.y + H / 2, o.y - H / 2, .01, 2); cam.position.set(0, 0, zf + 1); cam.updateMatrixWorld();
      const DM = new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: { zf: { value: zf } },
        vertexShader: 'varying float vz; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vz = w.z; gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: `uniform float zf; varying float vz; void main(){ gl_FragColor = vec4(clamp((vz - zf) / ${MX.toFixed(3)}, 0., 1.), 0., 0., 1.); }` });
      const rt = new THREE.WebGLRenderTarget(RW, RH), px = new Uint8Array(RW * RH * 4), keep = [], cc = new THREE.Color(), ca = renderer.getClearAlpha(); renderer.getClearColor(cc);
      const prevRT = renderer.getRenderTarget(), prevTM = renderer.toneMapping, prevAC = renderer.autoClear; renderer.toneMapping = THREE.NoToneMapping; renderer.autoClear = false;   // one clear, then every set drawn on top
      renderer.setRenderTarget(rt); renderer.setClearColor(0, 0); renderer.clear();
      for (const s of sets) { s.traverse(m => { if (m.isMesh) { keep.push([m, m.material]); m.material = DM; } }); const au = s.matrixWorldAutoUpdate; s.matrixWorldAutoUpdate = false; renderer.render(s, cam); s.matrixWorldAutoUpdate = au; }
      renderer.readRenderTargetPixels(rt, 0, 0, RW, RH, px); renderer.setRenderTarget(prevRT); renderer.setClearColor(cc, ca); renderer.toneMapping = prevTM; renderer.autoClear = prevAC; for (const [m, mt] of keep) m.material = mt; rt.dispose(); DM.dispose();
      const BANDS = [[0, .012], [.012, .022], [.022, .035], [.035, 1]], lay = BANDS.map(() => { const c = document.createElement('canvas'); c.width = RW; c.height = RH; return c; });
      const ims = lay.map(c => c.getContext('2d').createImageData(RW, RH));
      for (let j = 0; j < RH; j++) for (let i = 0; i < RW; i++) { const q = ((RH - 1 - j) * RW + i) * 4; if (!px[q + 3]) continue;   // GL rows run bottom-up
        const off = px[q] / 255 * MX; let bi = 0; while (off >= BANDS[bi][1] && bi < 3) bi++; const d = ims[bi].data, r = (j * RW + i) * 4; d[r] = 20; d[r + 1] = 12; d[r + 2] = 6; d[r + 3] = 255; }
      const sc = document.createElement('canvas'); sc.width = PX * 2; sc.height = PY; const sx = sc.getContext('2d'); let n = 0; ims.forEach(im => { for (let q = 3; q < im.data.length; q += 4) n += im.data[q] > 0; }); window.__pegShadowPx = n;   /* test hook: how many tool pixels cast a shadow */
      BANDS.forEach(([b0, b1], bi) => { lay[bi].getContext('2d').putImageData(ims[bi], 0, 0); const off = Math.max(.006, Math.min(.05, (b0 + b1) / 2));
        /* 27 Oct 01:xx (review: "dark smear under the hammers"): alpha used to RISE with stand-off, so the hammer heads (5 cm off) threw the darkest, widest
           blobs. Now a part further off throws a lighter, softer shadow, and the tight dark core only comes from parts close to the board */
        /* 27 Oct 04:xx (blind review: "no contact shadows, the hammers look stuck on"): meet halfway. Keep the lighter wide pass, but every band gets a
           tight dark core again (alpha .4–.49, small blur, short drop) so heads and grips sit on the board without the old wide smear */
        for (const [al, bl, dy] of [[Math.max(.2, .46 - off * 5), 2 + off * k * .8, 1.6], [Math.max(.4, .5 - off * 2), 1 + off * k * .12, .7]]) {   // a wide soft shadow, then a tighter darker core nearer the part
          if (al <= 0) continue;
          sx.save(); sx.globalAlpha = al; sx.shadowColor = 'rgba(20,12,6,1)'; sx.shadowBlur = bl; sx.shadowOffsetX = -PX; sx.shadowOffsetY = off * k * dy;   // the image goes in the right half, its shadow lands in the left half
          sx.drawImage(lay[bi], PX, 0, PX, PY); sx.restore(); } });   // (drawing it fully off-canvas and keeping only the shadow, as the box version did, draws nothing in Chrome: drawImage off the canvas is skipped)
      x.drawImage(sc, 0, 0, PX, PY, 0, 0, PX, PY);
      const map = new THREE.CanvasTexture(mc); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8; F.map = map; F.needsUpdate = true; };   // texture made AFTER drawing: on phones CT() copies a shrunk canvas, so later draws wouldn't reach it
    return g; }
  const sLevel = (p, x, y, z, L, col) => { const g = grp(p, x, y, z);   // spirit level hung flat on two hooks: painted box section, dark rubber end caps, a centre vial in a window and a plumb vial near one end
    const C = STD({ color: col, roughness: .45, metalness: .25 });
    box(g, L - .04, .055, .025, C, 0, 0, 0); box(g, L - .04, .006, .027, ALU, 0, -.003, 0); box(g, L - .04, .006, .027, ALU, 0, .052, 0);   // body, machined top and bottom faces
    for (const s of [-1, 1]) box(g, .02, .06, .03, GRIP, s * (L / 2 - .01), -.0025, 0);
    const vial = (vx, vert) => { box(g, .055, .035, .028, BLK, vx, .01, 0); const v = tmesh(g, new THREE.CylinderGeometry(.006, .006, .036, 8), STD({ color: 0xc8e04a, emissive: 0x2a3a08, roughness: .2 }), vx, .0275, .0145); if (!vert) v.rotation.z = Math.PI / 2; box(g, .002, .02, .001, BLK, vx - .005, .0175, .0151); box(g, .002, .02, .001, BLK, vx + .005, .0175, .0151); };
    vial(0, false); vial(-L / 2 + .12, true);
    for (const s of [-1, 1]) peg(p, x + s * Math.round(.3 * L / .025) * .025, y - .006, z - .017, .037);   // 24 Oct 07:xx: hooks a whole number of 25 mm holes apart
    return g; };
  const rollCab = (p, x, z) => { const g = grp(p, x, 0, z);   // grey steel roll cabinet: castors, a seven-drawer base with pull bars and label slots, a lift-lid top chest, side handle, rubber mat on top
    const GC = STD({ color: 0x858c92, metalness: .12, roughness: .48 }), GE = STD({ color: 0x5d6368, metalness: .12, roughness: .55 }), LBL = STD({ color: 0xe9e6dc, roughness: .7 }), PULL = STD({ color: 0xd2d6da, metalness: .35, roughness: .3 });   // 24 Oct 03:xx: powder-coated grey, not bare metal (at .55 metalness it read near-black on a phone under the workshop's gated light)
    box(g, .7, .03, .5, GE, 0, .1, 0); box(g, .02, .97, .5, GC, -.34, .13, 0); box(g, .02, .97, .5, GC, .34, .13, 0); box(g, .7, .97, .02, GC, 0, .13, -.24); box(g, .7, .025, .5, GE, 0, 1.075, 0);   // carcass
    const DK = STD({ color: 0x17181a, roughness: .97 });   // 24 Oct 04:xx: a dark panel behind the drawer fronts, so every gap (now 16 mm) reads as a shadow line and the drawers count (they ran together on a phone)
    box(g, .655, .955, .006, DK, 0, .135, .231);
    const hs = [.1, .1, .1, .12, .14, .16, .2]; let yy = .135;
    for (const h of hs) { box(g, .655, h - .016, .02, GC, 0, yy + .004, .245); box(g, .6, .022, .022, PULL, 0, yy + h - .032, .272); for (const s of [-1, 1]) box(g, .018, .026, .042, PULL, s * .29, yy + h - .034, .262);   // drawer front, aluminium pull bar on two posts (03:xx: thicker, lighter, stands 3 cm proud)
      box(g, .06, .022, .003, LBL, -.22, yy + h * .35, .256); yy += h; }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const c = grp(g, sx * .29, 0, sz * .19); box(c, .045, .006, .045, GE, 0, .093, 0); box(c, .006, .045, .03, GE, -.016, .045, 0); box(c, .006, .045, .03, GE, .016, .045, 0); cyl(c, .035, .025, GRIP, 0, .035, 0, 'x', 14); cyl(c, .012, .028, BRIGHT, 0, .035, 0, 'x', 8); }   // swivel castors
    const tc = grp(g, 0, 1.1, 0); box(tc, .72, .3, .48, GC, 0, 0, 0); box(tc, .73, .1, .49, GC, 0, .3, 0); box(tc, .73, .006, .49, GE, 0, .3, 0);   // top chest and its lid, hinge line
    box(tc, .63, .28, .004, DK, 0, .01, .2445);   // the same shadow lines between the top chest's drawers
    for (let i = 0; i < 3; i++) { box(tc, .62, .075, .015, GC, 0, .02 + i * .093, .24); box(tc, .5, .018, .02, PULL, 0, .07 + i * .093, .262); for (const s of [-1, 1]) box(tc, .016, .022, .03, PULL, s * .24, .07 + i * .093, .253); }
    box(tc, .7, .008, .47, STD({ color: 0x2a2b2d, roughness: .95 }), 0, .4, 0);   // rubber mat on the lid
    cyl(tc, .012, .012, BRIGHT, .3, .3, .248, 'z', 10);   // key lock
    for (const yy2 of [.85, .45]) box(g, .02, .02, .03, BRIGHT, .36, yy2, 0); cyl(g, .01, .42, BRIGHT, .385, .65, 0, 'y', 8);   // side push handle
    return g; };
  const offBin = (p, x, z) => { const g = grp(p, x, 0, z), BB = STD({ color: 0x1d1e20, roughness: .7 });   // ribbed black bin of timber offcuts
    const bm = new THREE.Mesh(new THREE.CylinderGeometry(.27, .23, .68, 28, 1, true), STD({ color: 0x1d1e20, roughness: .7, side: THREE.DoubleSide })); bm.position.y = .34; bm.castShadow = bm.receiveShadow = true; g.add(bm);
    cyl(g, .23, .02, BB, 0, .01, 0, 'y', 24);   // base
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = box(g, .022, .63, .012, BB, Math.cos(a) * .254, .05, Math.sin(a) * .254); r.rotation.order = 'YXZ'; r.rotation.set(0, -a, -.06); }   // vertical ribs following the taper (07:xx: run up into the rim torus; their tops stopped just under it and showed as specks)
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
  // 23 Oct 06:xx: the mitre saw, the compressor and the vice get real shapes (they were stacked blocks). No RNG draws, so nothing else moves
  const sector = (r0, r1, a0, a1, depth) => { const sh = new THREE.Shape(); sh.absarc(0, 0, r1, a0, a1, false); sh.lineTo(Math.cos(a1) * r0, Math.sin(a1) * r0); sh.absarc(0, 0, r0, a1, a0, true); sh.closePath();
    const ge = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelSize: .003, bevelThickness: .003, bevelSegments: 1, curveSegments: 20 }); ge.translate(0, 0, -depth / 2); ge.rotateY(Math.PI / 2); return ge; };   // a ring sector in the y-z plane (thickness along x)
  const mitreSaw = (p, x, y, z, ry = 0) => { const g = grp(p, x, y, z, ry);   // sliding-free chop/mitre saw, operator on −z. 25 Oct 02:xx: cast shapes, not boxes: rounded base with wings and lugs, turntable with a rim and a locking tongue, mitre scale, profiled split fence with lightening holes, swept pivot casting, tapered arm, arbor cover, clear lower guard, gearbox boss, dust chute. No RNG draws
    const CAST = STD({ color: 0xa9aeb2, metalness: .4, roughness: .5 }), SY = STD({ color: 0xf2b705, roughness: .42 }), DK = STD({ color: 0x2b2d30, roughness: .7 });
    const rrs = (x0, y0, x1, y1, r) => { const s = new THREE.Shape(); s.moveTo(x0 + r, y0); s.lineTo(x1 - r, y0); s.quadraticCurveTo(x1, y0, x1, y0 + r); s.lineTo(x1, y1 - r); s.quadraticCurveTo(x1, y1, x1 - r, y1); s.lineTo(x0 + r, y1); s.quadraticCurveTo(x0, y1, x0, y1 - r); s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0); return s; };
    const flat = (sh, t, bv) => { const e = ex2(sh, t, bv); e.rotateX(Math.PI / 2); return e; };   // plate in x/z (shape y → z), centred on its thickness
    const side = (sh, t, bv) => { const e = ex2(sh, t, bv); e.rotateY(-Math.PI / 2); return e; };   // side profile (shape x → z, y → y), thickness along x
    tmesh(g, flat(rrs(-.2, -.17, .2, .21, .05), .038, .006), CAST, 0, .025, 0);   // cast base, rounded corners
    for (const sx of [-1, 1]) { tmesh(g, flat(rrs(-.065, -.11, .065, .17, .025), .024, .004), CAST, sx * .27, .036, 0); box(g, .012, .03, .24, CAST, sx * .245, .006, .03);   // extension wings and the web joining them to the base
      for (const sz of [-1, 1]) { tmesh(g, new THREE.CylinderGeometry(.022, .026, .02, 14), CAST, sx * .185, .012, .03 + sz * .155); tmesh(g, new THREE.CylinderGeometry(.007, .007, .004, 10), DK, sx * .185, .023, .03 + sz * .155); box(g, .05, .012, .05, GRIP, sx * .2, -.01, .02 + sz * .14); } }   // bolt-down lugs with holes, rubber feet
    const sc = new THREE.Shape(); sc.absarc(0, 0, .2, -Math.PI / 2 - .85, -Math.PI / 2 + .85, false); sc.absarc(0, 0, .155, -Math.PI / 2 + .85, -Math.PI / 2 - .85, true); sc.closePath(); tmesh(g, flat(sc, .006, .001), ALU, 0, .05, 0);   // mitre scale plate round the front
    for (let i = -8; i <= 8; i++) { const a = i * .09, L = i % 4 === 0 ? .022 : .012; box(g, .0025, .0015, L, BLK, Math.sin(a) * (.188 - L / 2), .0535, -Math.cos(a) * (.188 - L / 2)).rotation.y = -a; }   // its tick marks, long every 4th
    tmesh(g, new THREE.CylinderGeometry(.153, .155, .02, 40), CAST, 0, .062, 0); const rim = tmesh(g, new THREE.TorusGeometry(.153, .004, 6, 40), CAST, 0, .072, 0); rim.rotation.x = Math.PI / 2;   // turntable and its raised rim
    const tg = new THREE.Shape(); tg.moveTo(-.045, -.1); tg.lineTo(-.026, -.25); tg.quadraticCurveTo(0, -.272, .026, -.25); tg.lineTo(.045, -.1); tg.closePath(); tmesh(g, flat(tg, .018, .003), CAST, 0, .062, 0);   // locking tongue out the front
    tmesh(g, new THREE.CylinderGeometry(.006, .006, .004, 8), RED, 0, .074, -.188); tmesh(g, new THREE.CylinderGeometry(.018, .02, .045, 14), GRIP, 0, .085, -.255); box(g, .016, .006, .062, DK, 0, .05, -.228); box(g, .02, .009, .014, RED, 0, .049, -.262);   // pointer, lock knob, detent lever tucked up under the tongue (25 Oct 06:xx: was a red tab floating 1 cm below it), red thumb tip
    tmesh(g, flat(rrs(-.013, -.15, .013, .15, .012), .003, .001), BLK, 0, .0735, -.01);   // kerf insert
    for (const sx of [-1, 1]) { const f = new THREE.Shape(); f.moveTo(sx * .016, 0); f.lineTo(sx * .24, 0); f.lineTo(sx * .24, .042); f.quadraticCurveTo(sx * .2, .06, sx * .14, .072); f.lineTo(sx * .016, .078); f.closePath();
      for (const [a, b] of [[.05, .1], [.13, .19]]) f.holes.push(rrs(Math.min(sx * a, sx * b), .02, Math.max(sx * a, sx * b), .052, .01));
      tmesh(g, ex2(f, .012, .002), ALU, 0, .072, .13); box(g, .225, .008, .034, ALU, sx * .128, .072, .148); for (const k of [.06, .2]) tmesh(g, new THREE.CylinderGeometry(.006, .006, .006, 10), BRIGHT, sx * k, .083, .156); }   // split fence: profiled castings with lightening holes, base flange, screws
    const pc = new THREE.Shape(); pc.moveTo(.12, .04); pc.lineTo(.255, .04); pc.lineTo(.255, .17); pc.quadraticCurveTo(.255, .238, .205, .238); pc.lineTo(.175, .238); pc.quadraticCurveTo(.16, .16, .12, .085); pc.closePath(); tmesh(g, side(pc, .075, .007), CAST, 0, 0, 0);   // pivot casting swept up from the base to the hinge
    const bs = new THREE.Shape(); bs.absarc(0, 0, .085, .35, Math.PI - .35, false); bs.absarc(0, 0, .06, Math.PI - .35, .35, true); bs.closePath(); tmesh(g, new THREE.ShapeGeometry(bs), STD({ color: 0xc3c7ca, metalness: .5, roughness: .4, side: THREE.DoubleSide }), 0, .1, .264);   // bevel scale on the back
    const bk = tmesh(g, new THREE.CylinderGeometry(.016, .016, .035, 12), GRIP, 0, .1, .28); bk.rotation.x = Math.PI / 2;   // bevel lock knob
    const pv = tmesh(g, new THREE.CylinderGeometry(.022, .022, .1, 14), BRIGHT, 0, .2, .2); pv.rotation.z = Math.PI / 2;   // hinge pin
    const head = grp(g, 0, .2, .2); head.rotation.x = .12;   // the head, tipped up a touch at rest
    const ap = new THREE.Shape(); ap.moveTo(.03, -.028); ap.lineTo(.03, .03); ap.quadraticCurveTo(-.08, .05, -.19, .09); ap.lineTo(-.235, .05); ap.quadraticCurveTo(-.12, -.015, .03, -.028); tmesh(head, side(ap, .04, .005), SY, .045, 0, 0);   // tapered cast arm from the pivot to the arbor
    tmesh(head, new THREE.CylinderGeometry(.04, .04, .07, 16), CAST, .075, .05, -.2).rotation.z = Math.PI / 2;   // gearbox boss joining the motor to the arbor
    const bl = new THREE.Shape(), R = .127, n = 48; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, b = (i + .55) / n * Math.PI * 2; bl.lineTo(Math.cos(a) * R * .95, Math.sin(a) * R * .95); bl.lineTo(Math.cos(b) * R, Math.sin(b) * R); }   // 48-tooth blade
    const bg = new THREE.ShapeGeometry(bl); bg.rotateY(Math.PI / 2); tmesh(head, bg, STD({ color: 0xaeb3b7, metalness: .85, roughness: .3, side: THREE.DoubleSide }), 0, .05, -.2);
    const fl = tmesh(head, new THREE.CylinderGeometry(.032, .032, .012, 16), BRIGHT, 0, .05, -.2); fl.rotation.z = Math.PI / 2;   // arbor flange
    // upper blade guard (hood): 26 Oct 03:xx, was a solid 6 cm sector with flat faces wearing the sponge wear tile (07:xx review: "cheese wheel"). Now a moulded shell: two thin side plates, a thin rim band round the outside, rounded edges (half-round beads), raised moulded ribs on each face (three radial, one arc), all in the saw yellow with its own faint orange-peel sheet so the wear pass skips it. Own RNG, no layout draws
    { const A0 = -.25, A1 = Math.PI + .5; let hs = 4421; const hr = () => (hs = (hs * 16807) % 2147483647) / 2147483647;
      const ht = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#f4f4f4'; x.fillRect(0, 0, 128, 128);
        for (let i = 0; i < 900; i++) { const v = hr() < .5 ? 255 : 200; x.fillStyle = `rgba(${v},${v},${v},${.08 + hr() * .14})`; x.beginPath(); x.arc(hr() * 128, hr() * 128, .6 + hr() * 1.4, 0, 7); x.fill(); }   // orange peel
        for (let i = 0; i < 6; i++) { const cx = hr() * 128, cy = hr() * 128, r = 8 + hr() * 14, g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, 'rgba(150,140,120,.16)'); g.addColorStop(1, 'rgba(150,140,120,0)'); x.fillStyle = g; x.fillRect(cx - r, cy - r, 2 * r, 2 * r); }   // soft dust/grime smudges
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6); return t; })();
      const HOOD = STD({ color: 0xf2b705, roughness: .42, map: ht, bumpMap: ht, bumpScale: .25 });
      for (const sx of [-1, 1]) tmesh(head, sector(.02, .147, A0, A1, .005), HOOD, sx * .028, .05, -.2);   // side plates
      tmesh(head, sector(.1405, .147, A0, A1, .056), HOOD, 0, .05, -.2);   // rim band round the outside
      const bead = (r, t, x) => { const tg = new THREE.TorusGeometry(r, t, 6, 40, A1 - A0); tg.rotateZ(A0); tg.rotateY(Math.PI / 2); return tmesh(head, tg, HOOD, x, .05, -.2); };
      for (const sx of [-1, 1]) { bead(.1445, .0055, sx * .028);   // rounded edge where plate meets band
        bead(.098, .0048, sx * .0335);   // moulded arc rib (26 Oct 06:xx: .0034 → .0048 tube, read as a scratch on phone)
        for (const a of [.55, 1.45, 2.35]) { const rm = .101; const rb = tmesh(head, new THREE.CapsuleGeometry(.0048, .066, 4, 10), HOOD, sx * .0335, .05 + Math.sin(a) * rm, -.2 - Math.cos(a) * rm); rb.rotation.x = a - Math.PI / 2; } }   // radial ribs: 26 Oct 06:xx rounded 9.6 mm capsules half-sunk in the plate (were 5 × 6 mm boxes that read as scratched lines)
      // 26 Oct 06:xx: the blade side showed a pac-man notch at the arbor (03:xx review). A domed boss round the arbor on that plate, a dark seam ring at its foot and a bright arbor bolt, so the hood reads as a moulded shell
      const HOODG = HOOD.clone(); HOODG.roughness = .26;   // 27 Oct 03:xx: the boss read as a flat disc with an outline on phone (06:xx find): taller dome (14.6 → 21 mm proud) in a glossier moulding so it catches a highlight
      const dm = tmesh(head, new THREE.SphereGeometry(.052, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), HOODG, -.0325, .05, -.2); dm.rotation.z = Math.PI / 2; dm.scale.set(1, .4, 1);
      const dr = tmesh(head, new THREE.TorusGeometry(.052, .0012, 6, 36), STD({ color: 0x8a6a06, roughness: .6 }), -.0325, .05, -.2); dr.rotation.y = Math.PI / 2;   // seam ring thinner and a softer ochre (read as a sticker outline at .0016 dark)
      const ab = tmesh(head, new THREE.CylinderGeometry(.011, .011, .007, 6), STD({ color: 0xd2d6d8, metalness: .5, roughness: .32 }), -.0555, .05, -.2); ab.rotation.z = Math.PI / 2;   // arbor bolt: pale zinc at metalness .5 (BRIGHT .85 read near-black inside the light gate), moved out onto the taller dome
      const aw = tmesh(head, new THREE.CylinderGeometry(.015, .015, .002, 20), STD({ color: 0xb8bcbe, metalness: .5, roughness: .38 }), -.0525, .05, -.2); aw.rotation.z = Math.PI / 2; }   // washer under it
    const cv = tmesh(head, new THREE.CylinderGeometry(.085, .085, .012, 28), SY, .036, .05, -.2); cv.rotation.z = Math.PI / 2; const ar = tmesh(head, new THREE.TorusGeometry(.105, .003, 4, 20, 1.6), BLK, .033, .05, -.2); ar.rotation.y = Math.PI / 2; ar.rotation.z = .5;   // arbor side cover on the hood, blade-direction arrow
    const LG = STD({ color: 0xb9c2c9, roughness: .15, metalness: .1, transparent: true, opacity: .5, depthWrite: false }); const lg = tmesh(head, sector(.03, .138, Math.PI + .5, 2 * Math.PI - .25, .05), LG, 0, .05, -.2); lg.castShadow = false; lg.userData.noAO = true;   // clear lower guard round the bottom of the blade
    box(head, .006, .006, .11, BLK, .03, .1, -.12).rotation.x = .5;   // guard link rod up to the arm
    const ch = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, .1, -.07), new THREE.Vector3(0, .13, .03), new THREE.Vector3(0, .11, .13)]), 12, .02, 10), DK); ch.castShadow = true; head.add(ch);   // dust chute from the hood back to the bag
    const gs = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(.04, .195, -.24), new THREE.Vector3(.04, .19, -.33)]), 6, .021, 10), GRIP); gs.castShadow = true; head.add(gs);   // rubber grip on the handle's top bar
    const mo = tmesh(head, new THREE.CylinderGeometry(.055, .06, .14, 18), BLK, .12, .07, -.18); mo.rotation.z = Math.PI / 2; for (let i = 0; i < 6; i++) box(head, .1, .004, .012, GRIP, .13, .1 + 0, -.24 + i * .02).position.y = .125;   // motor and its vents
    const ec = tmesh(head, new THREE.CylinderGeometry(.045, .045, .02, 16), SY, .2, .07, -.18); ec.rotation.z = Math.PI / 2;   // brush cap end
    const hd = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(.04, .1, -.15), new THREE.Vector3(.04, .2, -.22), new THREE.Vector3(.04, .19, -.33), new THREE.Vector3(.04, .1, -.35)]), 16, .016, 8), BLK); hd.castShadow = true; head.add(hd);   // D-handle
    box(head, .012, .03, .02, RED, .04, .14, -.33);   // trigger
    const bag = tmesh(head, new THREE.CapsuleGeometry(.05, .14, 4, 12), STD({ color: 0x5a5d61, roughness: .95 }), 0, .1, .19); bag.rotation.x = -1.75; bag.scale.set(1, 1, .8);   // dust bag on the back
    box(g, .07, .05, .004, STD({ roughness: .6, map: can(64, 48, (c, w, h) => { c.fillStyle = '#111'; c.fillRect(0, 0, w, h); c.fillStyle = '#f2b705'; c.fillRect(3, 3, w - 6, 12); c.fillStyle = '#ddd'; for (let i = 0; i < 4; i++) c.fillRect(6, 22 + i * 6, 30 + (i * 7) % 20, 2); }) }), .16, .05, -.16);   // rating plate on the base front
    return g; };
  const compressor = (p, x, z, ry) => { const g = grp(p, x, 0, z, ry);   // wheeled site compressor: orange tank with welded end caps, pressed feet, tyred wheels and a pull handle; a direct-drive pump on a cradle plate: motor with feet, cast fins, end bell and fan cowl, crankcase bolted to it, finned barrel, red head; copper discharge pipe to a check valve, pressure switch with its unloader line, safety valve, two gauges, regulator, couplers, drain cock. 25 Oct 03:xx: parts now join (04:xx review: "head and motor stacked with nothing joining them"). No RNG draws
    const TK = STD({ color: 0xe0661c, roughness: .42, metalness: .2 }), WLD = STD({ color: 0xb4501a, roughness: .5 }), CU = STD({ color: 0xb8743f, metalness: .75, roughness: .38 }), BR = STD({ color: 0xc9a84a, metalness: .8, roughness: .3 }), CAST = STD({ color: 0x55595e, metalness: .35, roughness: .55 });
    const side = (sh, t, bv) => { const e = ex2(sh, t, bv); e.rotateY(-Math.PI / 2); return e; };   // profile in z/y (shape x → z), thickness along x
    cyl(g, .19, .56, TK, 0, .26, 0, 'x', 28); for (const s of [-1, 1]) { const e = tmesh(g, new THREE.SphereGeometry(.19, 24, 12), TK, s * .28, .26, 0); e.scale.x = .32; const w = tmesh(g, new THREE.TorusGeometry(.19, .004, 6, 32), WLD, s * .28, .26, 0); w.rotation.y = Math.PI / 2; }   // tank, domed ends, weld seams
    box(g, .34, .006, .002, WLD, 0, .449, 0);   // long seam on top
    // pressed-steel foot at the pump end, curved to the tank's underside and welded on, rubber pads under it
    { const f = new THREE.Shape(); f.moveTo(-.17, .012); f.lineTo(.17, .012); f.lineTo(.17, .03); f.lineTo(.1, .03); f.lineTo(.06, .08); f.absarc(0, .26, .19, -1.249, -1.893, true); f.lineTo(-.1, .03); f.lineTo(-.17, .03); f.closePath();
      tmesh(g, side(f, .03, .004), DARK, -.2, 0, 0); for (const s of [-1, 1]) box(g, .045, .012, .05, GRIP, -.2, 0, s * .14); }   // foot and its rubber pads
    // axle hangers welded under the tank, axle, and tyred wheels
    for (const s of [-1, 1]) box(g, .045, .09, .006, DARK, .25, .045, s * .14);
    tmesh(g, new THREE.CylinderGeometry(.008, .008, .42, 8), BRIGHT, .25, .07, 0).rotation.x = Math.PI / 2;   // axle
    for (const s of [-1, 1]) { const wg = grp(g, .25, .07, s * .19);
      const ty = tmesh(wg, new THREE.TorusGeometry(.054, .019, 10, 28), GRIP, 0, 0, 0);   // tyre (axis z)
      for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, tb = tmesh(wg, new THREE.BoxGeometry(.007, .013, .03), GRIP, Math.cos(a) * .072, Math.sin(a) * .073, 0); tb.rotation.z = a; }   // tread blocks
      const rm = tmesh(wg, new THREE.CylinderGeometry(.046, .046, .03, 20), STD({ color: 0xd8d8d0, roughness: .5 }), 0, 0, 0); rm.rotation.x = Math.PI / 2;   // grey rim
      const hb = tmesh(wg, new THREE.CylinderGeometry(.018, .02, .042, 14), STD({ color: 0xbfbfb6, roughness: .45 }), 0, 0, 0); hb.rotation.x = Math.PI / 2;   // hub
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; cyl(wg, .004, .006, BRIGHT, Math.cos(a) * .031, Math.sin(a) * .031, s * .016, 'z', 6); }   // wheel nuts on the outer face
      const cap = tmesh(wg, new THREE.CylinderGeometry(.009, .009, .05, 8), BRIGHT, 0, 0, 0); cap.rotation.x = Math.PI / 2; }   // axle cap
    const hp = new THREE.CatmullRomCurve3([new THREE.Vector3(.2, .3, -.13), new THREE.Vector3(.36, .55, -.13), new THREE.Vector3(.4, .68, -.1), new THREE.Vector3(.4, .7, 0), new THREE.Vector3(.4, .68, .1), new THREE.Vector3(.36, .55, .13), new THREE.Vector3(.2, .3, .13)]);
    const hn = new THREE.Mesh(new THREE.TubeGeometry(hp, 30, .011, 8), DARK); hn.castShadow = true; g.add(hn); const gr = tmesh(g, new THREE.CylinderGeometry(.016, .016, .14, 10), GRIP, .4, .7, 0); gr.rotation.x = Math.PI / 2;   // pull handle with a grip
    for (const s of [-1, 1]) { const lg = box(g, .055, .045, .012, DARK, .255, .37, s * .13); lg.rotation.z = -.55; const bd = tmesh(g, new THREE.TorusGeometry(.014, .004, 5, 12), DARK, .262, .395, s * .13); bd.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(.54, .84, 0)); cyl(g, .007, .03, BRIGHT, .25, .385, s * .13, 'z', 8); }   // 07:xx: welded lugs where the handle meets the tank, a weld bead round the tube and a bolt through each
    // cradle: two curved brackets welded to the tank carry the pump plate
    { const c = new THREE.Shape(); c.moveTo(-.1, .44); c.lineTo(.1, .44); c.lineTo(.1, .4216); c.absarc(0, .26, .19, 1.017, 2.124, false); c.closePath();
      for (const bx of [-.15, .09]) { tmesh(g, side(c, .012, .002), DARK, bx, 0, 0); for (const s of [-1, 1]) box(g, .02, .004, .004, WLD, bx, .42, s * .1); } }
    box(g, .3, .012, .2, DARK, -.03, .44, 0); for (const px of [-.17, .11]) for (const pz of [-.085, .085]) cyl(g, .007, .006, BRIGHT, px, .455, pz, 'y', 6);   // pump plate and its bolts
    // motor: body with cast cooling fins, two feet bolted to the plate, rounded end bell, slotted fan cowl, terminal box on top
    { const mg = grp(g, .06, .53, .02);
      const MOT = STD({ color: 0x4b525a, roughness: .46, metalness: .12 }), FIN = STD({ color: 0x6a727c, roughness: .4, metalness: .15 });   /* 26 Oct 05:xx: painted cast, so low metalness (the 24 Oct painted-steel trap): at .35 inside the light gate the body read near-black from the gauge side */   // 25 Oct 05:xx: was black on black (03:xx review: "motor fins black on black, reads boxy"): a dark grey cast body with lighter fins that catch the light
      const mb = tmesh(mg, new THREE.CylinderGeometry(.07, .07, .15, 24), MOT, 0, 0, 0); mb.rotation.z = Math.PI / 2;
      for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; if (Math.sin(a) < -.75) continue; const fn = tmesh(mg, new THREE.BoxGeometry(.13, .012, .004), FIN, 0, Math.sin(a) * .076, Math.cos(a) * .076); fn.rotation.x = Math.PI / 2 - a; }   // fins along the body (none under it, where the feet go)
      for (const fx of [-.045, .045]) { box(mg, .028, .05, .13, MOT, fx, -.078, 0); box(mg, .028, .006, .16, MOT, fx, -.078, 0); for (const s of [-1, 1]) cyl(mg, .006, .008, BRIGHT, fx, -.074, s * .074, 'y', 6); }   // feet, bolted down
      const eb = tmesh(mg, new THREE.SphereGeometry(.068, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), MOT, .075, 0, 0); eb.rotation.z = -Math.PI / 2; eb.scale.y = .45;   // rounded end bell at the fan end
      const fcv = can(64, 64, (c2, w, h) => { c2.fillStyle = '#58606a'; c2.fillRect(0, 0, w, h); c2.fillStyle = '#16181b'; for (let i = 0; i < 5; i++) c2.fillRect(13, 13 + i * 8.5, 38, 2.2); c2.fillStyle = '#6a727c'; c2.beginPath(); c2.arc(32, 32, 7, 0, 7); c2.fill(); });
      const cw = tmesh(mg, new THREE.CylinderGeometry(.062, .066, .03, 24), MOT, .11, 0, 0);   /* 26 Oct: cowl in the motor's cast grey (was flat near-black) */ cw.rotation.z = Math.PI / 2; { const rim = tmesh(mg, new THREE.TorusGeometry(.061, .0035, 6, 32), FIN, .1265, 0, 0); rim.rotation.y = Math.PI / 2; }   /* 26 Oct 05:xx: a lighter rolled rim on the cowl edge so the cowl reads at phone size */ const gface2 = tmesh(mg, new THREE.CircleGeometry(.058, 24), STD({ map: fcv, roughness: .6 }), .1255, 0, 0); gface2.rotation.y = Math.PI / 2;   // fan cowl with its slots
      box(mg, .06, .035, .05, MOT, -.02, .068, -.01); box(mg, .064, .004, .054, FIN, -.02, .1, -.01); box(mg, .062, .002, .052, STD({ color: 0x15161a, roughness: .6 }), -.02, .096, -.01);   /* 26 Oct: terminal box in the motor grey with a lighter lid and a dark lid line (was flat near-black) */ const gl = tmesh(mg, new THREE.CylinderGeometry(.008, .008, .02, 8), GRIP, -.02, .088, -.045); gl.rotation.x = Math.PI / 2; }   // terminal box, cable gland
    // crankcase bolted to the motor's drive end (direct drive), the finned barrel on it, the red head with four bolts
    { const cc = new THREE.Shape(); cc.moveTo(-.065, 0); cc.lineTo(.065, 0); cc.lineTo(.065, .045); cc.quadraticCurveTo(.065, .075, .035, .078); cc.lineTo(-.035, .078); cc.quadraticCurveTo(-.065, .075, -.065, .045); cc.closePath();
      tmesh(g, side(cc, .13, .008), CAST, -.1, .452, .02);   // crankcase: rounded cast block across the pump
      const fl = tmesh(g, new THREE.CylinderGeometry(.06, .06, .024, 20), CAST, -.027, .53, .02); fl.rotation.z = Math.PI / 2; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; cyl(g, .005, .02, BRIGHT, -.03, .53 + Math.sin(a) * .05, .02 + Math.cos(a) * .05, 'x', 6); }   // bolted flange joining it to the motor
      for (const sz of [-1, 1]) box(g, .14, .006, .008, CAST, -.1, .456, .02 + sz * .061);   // cast foot ribs
      const sg = tmesh(g, new THREE.CylinderGeometry(.03, .03, .01, 16), STD({ color: 0x8fa0a8, roughness: .2, metalness: .2 }), -.14, .5, -.048); sg.rotation.x = Math.PI / 2;   // oil sight glass
      const cy = grp(g, -.1, .53, .0); cyl(cy, .045, .07, STEEL, 0, .035, 0, 'y', 16); for (let i = 0; i < 6; i++) cyl(cy, .062, .006, STEEL, 0, .012 + i * .01, 0, 'y', 16);   // finned barrel
      const hd = new THREE.Shape(); hd.moveTo(-.055, -.055); hd.lineTo(.055, -.055); hd.quadraticCurveTo(.065, -.055, .065, -.045); hd.lineTo(.065, .045); hd.quadraticCurveTo(.065, .055, .055, .055); hd.lineTo(-.055, .055); hd.quadraticCurveTo(-.065, .055, -.065, .045); hd.lineTo(-.065, -.045); hd.quadraticCurveTo(-.065, -.055, -.055, -.055);
      const he = ex2(hd, .026, .004); he.rotateX(Math.PI / 2); tmesh(cy, he, RED, 0, .085, 0); for (let i = 0; i < 4; i++) { const hf = box(cy, .12, .006, .004, RED, 0, .098, -.04 + i * .027); }   // red head, fins on top
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { cyl(cy, .007, .012, BRIGHT, sx * .045, .104, sz * .045, 'y', 6); }   // head bolts
      const fil = tmesh(g, new THREE.CylinderGeometry(.03, .03, .03, 14), BLK, -.1, .615, .085); fil.rotation.x = Math.PI / 2; cyl(g, .008, .02, BLK, -.1, .615, .064, 'z', 8); }   // air filter on the head's intake
    // copper discharge pipe from the head down to the check valve on the tank, with cooling fins near the head
    { const dp = new THREE.CatmullRomCurve3([new THREE.Vector3(-.165, .615, -.01), new THREE.Vector3(-.215, .605, -.03), new THREE.Vector3(-.245, .53, -.07), new THREE.Vector3(-.235, .455, -.09)]); const t = new THREE.Mesh(new THREE.TubeGeometry(dp, 20, .007, 8), CU); t.castShadow = true; g.add(t);
      for (let i = 1; i < 5; i++) { const u = .1 + i * .1, pt = dp.getPointAt(u), tn = dp.getTangentAt(u), r = tmesh(g, new THREE.TorusGeometry(.011, .0025, 4, 12), CU, pt.x, pt.y, pt.z); r.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tn); }
      cyl(g, .014, .03, BR, -.235, .44, -.09, 'y', 6); const nt = tmesh(g, new THREE.CylinderGeometry(.011, .011, .012, 6), BR, -.235, .459, -.09); }   // brass check valve, hex nut
    // pressure switch on a bracket, the unloader line to the check valve, the safety valve with its pull ring
    // 26 Oct 02:xx: the pressure switch was a black box with a red cube on it (25 Oct 03:xx review). Now a moulded grey cover: square base, a domed lid on a lid line, two lid screws, a cable gland with its lead dropping to the motor side, and a red lever-style on/off knob on a pivot boss. No RNG draws
    { box(g, .03, .03, .004, DARK, .14, .425, -.098);   // bracket
      const PSW = STD({ color: 0x4a5058, roughness: .48, metalness: .1 }), PSL = STD({ color: 0x5c636c, roughness: .4, metalness: .1 }), PSD = STD({ color: 0x15161a, roughness: .6 });
      const pb = new THREE.Shape(); pb.moveTo(-.031, 0); pb.lineTo(.031, 0); pb.lineTo(.031, .036); pb.lineTo(-.031, .036); pb.closePath();
      tmesh(g, side(pb, .066, .004), PSW, .14, .45, -.12);   // base, rounded edges
      const pl = new THREE.Shape(); pl.moveTo(-.032, 0); pl.lineTo(.032, 0); pl.lineTo(.032, .008); pl.quadraticCurveTo(.032, .03, 0, .032); pl.quadraticCurveTo(-.032, .03, -.032, .008); pl.closePath();
      tmesh(g, side(pl, .068, .004), PSL, .14, .489, -.12);   // domed lid, a shade lighter so the curve reads
      box(g, .074, .003, .068, PSD, .14, .486, -.12);   // lid line (dark groove between base and lid)
      for (const sx of [-.022, .022]) cyl(g, .0045, .004, BRIGHT, .14 + sx, .5, -.1575, 'z', 6);   // lid screws on the lid's front face
      cyl(g, .008, .016, PSD, .118, .465, -.163, 'z', 8); cyl(g, .0095, .005, PSD, .118, .465, -.1575, 'z', 6);   // cable gland and its hex nut
      { const cl = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(.118, .465, -.171), new THREE.Vector3(.11, .45, -.18), new THREE.Vector3(.095, .44, -.165), new THREE.Vector3(.07, .445, -.11)]), 12, .0045, 6), PSD); cl.castShadow = true; g.add(cl); }   // lead from the gland back over the plate to the motor
      cyl(g, .009, .03, PSD, .14, .527, -.12, 'x', 12);   // pivot boss across the dome top
      const lv = new THREE.Shape(); lv.moveTo(-.006, -.004); lv.lineTo(.006, -.004); lv.lineTo(.008, .032); lv.quadraticCurveTo(0, .038, -.008, .032); lv.closePath();
      const le = tmesh(g, side(lv, .014, .002), RED, .14, .527, -.12); le.rotation.x = -.45; }   // red on/off lever, tipped forward (on)
    { const ul = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(.105, .47, -.13), new THREE.Vector3(0, .445, -.145), new THREE.Vector3(-.15, .44, -.13), new THREE.Vector3(-.222, .45, -.1)]), 20, .0035, 6), STD({ color: 0x1b1c1e, roughness: .4 })); ul.castShadow = true; g.add(ul); }
    cyl(g, .01, .04, BR, -.17, .495, -.17, 'y', 8); cyl(g, .013, .01, BR, -.17, .52, -.17, 'y', 8); const pr = tmesh(g, new THREE.TorusGeometry(.012, .0025, 5, 14), BRIGHT, -.17, .54, -.17); pr.rotation.y = Math.PI / 2;   // safety valve, pull ring
    const gface = can(64, 64, (c, w, h) => { c.fillStyle = '#f4f2ea'; c.fillRect(0, 0, w, h); c.strokeStyle = '#222'; c.lineWidth = 2; for (let i = 0; i <= 10; i++) { const a = Math.PI * (.75 + i * .15); c.beginPath(); c.moveTo(32 + Math.cos(a) * 24, 32 + Math.sin(a) * 24); c.lineTo(32 + Math.cos(a) * 29, 32 + Math.sin(a) * 29); c.stroke(); }
      c.strokeStyle = '#c0221b'; c.beginPath(); c.arc(32, 32, 27, Math.PI * 1.9, Math.PI * 2.25); c.stroke(); c.strokeStyle = '#111'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(32, 32); c.lineTo(48, 20); c.stroke(); });
    const GF = STD({ map: gface, roughness: .25 });
    box(g, .16, .025, .025, BRIGHT, -.1, .45, -.17); box(g, .03, .008, .08, DARK, -.1, .444, -.135);   // manifold and the bracket holding it off the pump plate
    for (const gx of [-.15, -.05]) { const gg = grp(g, gx, .5, -.19); const rim = tmesh(gg, new THREE.CylinderGeometry(.03, .03, .018, 20), BRIGHT, 0, 0, 0); rim.rotation.x = Math.PI / 2; const f = tmesh(gg, new THREE.CircleGeometry(.026, 20), GF, 0, 0, -.0095); f.rotation.y = Math.PI; tmesh(gg, new THREE.CylinderGeometry(.006, .006, .04, 8), BRIGHT, 0, -.035, .01); }   // two gauges: tank and line pressure
    const kb = tmesh(g, new THREE.CylinderGeometry(.018, .02, .025, 12), BLK, -.1, .47, -.205); kb.rotation.x = Math.PI / 2;   // regulator knob
    for (const gx of [-.17, -.03]) { const qc = tmesh(g, new THREE.CylinderGeometry(.009, .011, .03, 10), STD({ color: 0xc9a84a, metalness: .8, roughness: .3 }), gx, .43, -.2); qc.rotation.x = Math.PI / 2; }   // brass quick couplers
    tmesh(g, new THREE.CylinderGeometry(.006, .006, .03, 8), STD({ color: 0xc9a84a, metalness: .8, roughness: .3 }), .05, .055, 0);   // drain cock under the tank
    box(g, .12, .07, .002, STD({ roughness: .6, map: can(64, 40, (c, w, h) => { c.fillStyle = '#f0ede4'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; c.fillRect(0, 0, w, 9); c.fillStyle = '#444'; for (let i = 0; i < 4; i++) c.fillRect(5, 14 + i * 6, 26 + (i * 11) % 24, 2); c.fillStyle = '#c0221b'; c.fillRect(46, 18, 12, 12); }) }), .02, .24, .191);   // rating sticker on the tank side
    const coil = grp(g, .05, 0, .42); for (let i = 0; i < 5; i++) { const t = tmesh(coil, new THREE.TorusGeometry(.13 + (i % 2) * .012, .009, 6, 32), STD({ color: 0x2a5aa8, roughness: .55 }), (i - 2) * .006, .01 + i * .016, (i % 3) * .008); t.rotation.x = Math.PI / 2; }   // airline: a loose coil of blue hose
    const lead = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-.03, .43, -.215), new THREE.Vector3(-.16, .42, -.26), new THREE.Vector3(-.32, .36, -.18), new THREE.Vector3(-.39, .24, .0), new THREE.Vector3(-.34, .1, .2), new THREE.Vector3(-.16, .03, .33), new THREE.Vector3(.0, .02, .38)]), 40, .009, 6), STD({ color: 0x2a5aa8, roughness: .55 })); lead.castShadow = true; g.add(lead);   // hose from the coupler round the pump end of the tank (07:xx: it ran behind the tank out of sight) to the coil
    return g; };
  const bvice = (p, x, y, z, ry = 0) => { const g = grp(p, x, y, z, ry);   // engineer's bench vice, jaws opening along +x. 25 Oct 01:xx: cast shapes, not blocks (04:xx review: "vice body boxy, no casting curves or screw thread"): rounded base with bolt ears, swivel turntable with a lip, a cast body that sweeps up from the anvil into the fixed jaw, jaw heads with rounded tops, screwed jaw plates, a sliding jaw that flows into its slide beam, a nut boss, a threaded screw and a T-head with the tommy bar through it
    // 25 Oct 07:xx: the blue gets its own hammer-tone enamel sheet (03:xx review: "vice paint an even speckle"): hammered dimples in the bump and a faint light/dark
    // ripple in the colour, chips through to grey iron (more on the top edges, a few with a rust halo), grime and oil darkening low down; a map means the wear pass skips it
    const vbTex = bvice.tex || (bvice.tex = (() => { let vr = 7349; const r = () => (vr = (vr * 16807) % 2147483647) / 2147483647, f = (a, b) => a + (b - a) * r(); const N = 512;
      const mk = (draw, srgb) => { const c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'); draw(x); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; };
      const blot = (x, cx, cy, rd, rgba) => { const gr = x.createRadialGradient(cx, cy, 0, cx, cy, rd); gr.addColorStop(0, rgba); gr.addColorStop(1, rgba.replace(/[\d.]+\)$/, '0)')); x.fillStyle = gr; x.fillRect(cx - rd, cy - rd, 2 * rd, 2 * rd); };
      const dimp = []; for (let i = 0; i < 2600; i++) dimp.push([f(0, N), f(0, N), f(5, 13)]);   // hammer-tone cells
      const chip = []; for (let i = 0; i < 70; i++) { const top = r() < .55; chip.push([f(0, N), top ? f(0, N * .16) : f(0, N), f(2, top ? 11 : 6), r() < .25]); }   // [x, y, size, rusty]; more along the tile's top band
      const poly = (x, px, py, rd) => { x.beginPath(); x.moveTo(px + rd, py); for (let k = 1; k < 8; k++) { const a = k / 8 * 6.283 + f(-.35, .35), q = rd * f(.45, 1.1); x.lineTo(px + Math.cos(a) * q, py + Math.sin(a) * q * f(.5, 1)); } x.closePath(); x.fill(); };
      const wrapDo = (fn) => { for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) fn(ox, oy); };   // draw across the edges so the tile repeats seamlessly
      return {
        map: mk(x => { x.fillStyle = '#2e5d8c'; x.fillRect(0, 0, N, N);
          wrapDo((ox, oy) => { for (const [a, b, d] of dimp) { const gr = x.createRadialGradient(a + ox - d * .25, b + oy - d * .25, 0, a + ox, b + oy, d); gr.addColorStop(0, 'rgba(120,170,215,.10)'); gr.addColorStop(.7, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(10,25,45,.12)'); x.fillStyle = gr; x.fillRect(a + ox - d, b + oy - d, 2 * d, 2 * d); } });   // the hammered ripple
          for (let i = 0; i < 22; i++) blot(x, f(0, N), f(N * .45, N), f(30, 110), `rgba(22,26,30,${f(.08, .2)})`);   // grime and old oil, lower down
          for (let i = 0; i < 10; i++) blot(x, f(0, N), f(0, N), f(20, 60), `rgba(150,170,185,${f(.04, .09)})`);   // dusty patches
          for (const [a, b, d, rust] of chip) { if (rust) { x.fillStyle = 'rgba(120,62,28,.45)'; poly(x, a, b, d * 1.7); } x.fillStyle = `rgb(${f(92, 118) | 0},${f(96, 120) | 0},${f(100, 124) | 0})`; poly(x, a, b, d); x.fillStyle = 'rgba(20,40,60,.5)'; x.fillRect(a - d, b + d * .6, d * 2, 1); }   // chips to grey iron, a dark paint lip under each
          for (let i = 0; i < 26; i++) { x.strokeStyle = `rgba(${r() < .6 ? '150,160,170' : '15,30,45'},${f(.15, .4)})`; x.lineWidth = f(.6, 1.4); const a = f(0, N), b = f(0, N), t = f(0, 6.28), L = f(10, 40); x.beginPath(); x.moveTo(a, b); x.lineTo(a + Math.cos(t) * L, b + Math.sin(t) * L); x.stroke(); } }, true),   // a few scrapes
        bump: mk(x => { x.fillStyle = '#808080'; x.fillRect(0, 0, N, N);
          wrapDo((ox, oy) => { for (const [a, b, d] of dimp) { const gr = x.createRadialGradient(a + ox, b + oy, 0, a + ox, b + oy, d); gr.addColorStop(0, 'rgba(0,0,0,.22)'); gr.addColorStop(.75, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(255,255,255,.2)'); x.fillStyle = gr; x.fillRect(a + ox - d, b + oy - d, 2 * d, 2 * d); } });   // dimples with raised rims
          for (const [a, b, d] of chip) { x.fillStyle = 'rgba(0,0,0,.55)'; poly(x, a, b, d); } }),   // chips sit below the paint
        rough: mk(x => { x.fillStyle = '#7a7a7a'; x.fillRect(0, 0, N, N); for (let i = 0; i < 22; i++) blot(x, f(0, N), f(N * .45, N), f(30, 110), `rgba(255,255,255,${f(.15, .35)})`);   // grime matt
          for (const [a, b, d, rust] of chip) { x.fillStyle = rust ? 'rgba(235,235,235,1)' : 'rgba(110,110,110,1)'; poly(x, a, b, d); } }) }; })());   // bare iron a bit shinier, rust matt
    const vbm = (ru, rv) => { const t = {}; for (const k of ['map', 'bump', 'rough']) { t[k] = vbTex[k].clone(); t[k].needsUpdate = true; t[k].repeat.set(ru, rv); } return STD({ color: 0xffffff, metalness: .12, roughness: 1, map: t.map, roughnessMap: t.rough, bumpMap: t.bump, bumpScale: .35 }); };
    const VB = vbm(9, 9), VBt = vbm(4.2, .25), VBn = vbm(1.8, .45);   // extrusions (UVs in metres: ≈ 11 cm tile), turntable rim, nut boss
    const JP = STD({ color: 0x3a3d40, metalness: .7, roughness: .5 }), DK = STD({ color: 0x1d3a58, metalness: .15, roughness: .6 });
    const rr = (x0, y0, x1, y1, r) => { const s = new THREE.Shape(); s.moveTo(x0 + r, y0); s.lineTo(x1 - r, y0); s.quadraticCurveTo(x1, y0, x1, y0 + r); s.lineTo(x1, y1 - r); s.quadraticCurveTo(x1, y1, x1 - r, y1); s.lineTo(x0 + r, y1); s.quadraticCurveTo(x0, y1, x0, y1 - r); s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0); return s; };
    const flat = (sh, d, bv, m, yy) => { const e = ex2(sh, d, bv); e.rotateX(Math.PI / 2); return tmesh(g, e, m, 0, yy, 0); };   // shape in x/z, laid flat, d thick, centred on yy
    // base plate with four bolt ears, the swivel turntable on it, and the lock lever
    { const s = rr(-.205, -.075, .005, .075, .03); flat(s, .008, .003, VB, .006);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const bx = -.1 + sx * .082, bz = sz * .056; cyl(g, .012, .003, JP, bx, .012, bz, 'y', 16); cyl(g, .0085, .007, BRIGHT, bx, .0165, bz, 'y', 6); }   // washers + hex bolt heads
      cyl(g, .068, .012, VBt, -.1, .016, 0, 'y', 40); tmesh(g, new THREE.TorusGeometry(.068, .003, 6, 40), DK, -.1, .022, 0).rotation.x = Math.PI / 2;   // turntable and its lip
      cyl(g, .012, .022, BRIGHT, -.04, .02, .07, 'z', 10); const lv = tmesh(g, new THREE.CylinderGeometry(.0045, .0045, .06, 8), BRIGHT, -.04, .02, .105); lv.rotation.x = Math.PI / 2; tmesh(g, new THREE.SphereGeometry(.009, 10, 8), BRIGHT, -.04, .02, .135); }   // swivel lock, lever, ball end
    // the fixed half: one casting from the round-ended anvil up a swept neck into the fixed jaw
    { const s = new THREE.Shape(); s.moveTo(-.18, .024); s.lineTo(-.012, .024); s.lineTo(-.012, .118); s.quadraticCurveTo(-.05, .1, -.088, .098); s.lineTo(-.178, .098); s.quadraticCurveTo(-.196, .098, -.196, .08); s.lineTo(-.196, .042); s.quadraticCurveTo(-.196, .024, -.18, .024);
      tmesh(g, ex2(s, .074, .006, 3), VB, 0, 0, 0);
      const r = new THREE.Shape(); r.moveTo(-.17, .03); r.lineTo(-.09, .03); r.quadraticCurveTo(-.11, .07, -.17, .085); r.lineTo(-.17, .03); for (const sz of [-1, 1]) tmesh(g, ex2(r, .006, .002), VB, 0, 0, sz * .043);   // a cast rib down each side under the anvil
      for (const sz of [-1, 1]) { const o = new THREE.Shape(); o.absellipse(0, 0, .022, .011, 0, Math.PI * 2); tmesh(g, ex2(o, .002, .0012), DK, -.06, .062, sz * .0435).rotation.z = .05; }   // raised oval maker's badges
      box(g, .084, .005, .062, STD({ color: 0x8d949a, metalness: .7, roughness: .35 }), -.135, .098, 0);   // anvil face, worn bright
      tmesh(g, ex2(rr(-.044, .03, -.002, .152, .012), .132, .005, 3), VB, 0, 0, 0); }   // fixed jaw head, rounded top corners
    const jaw = (jx, s) => { box(g, .006, .045, .134, JP, jx, .102, 0); for (let i = 0; i < 6; i++) box(g, .002, .002, .134, BLK, jx + s * .003, .108 + i * .0065, 0);   // hardened jaw plates, cross-hatched
      for (const sz of [-.042, .042]) { cyl(g, .0055, .0016, BRIGHT, jx + s * .0035, .125, sz, 'x', 12); box(g, .0018, .0012, .008, BLK, jx + s * .0043, .1244, sz); } };   // two countersunk screws each, slotted
    jaw(.003, 1);
    // the slide beam, through the body and out under the sliding jaw to the nut boss
    { const b = ex2(rr(-.06, -.026, .17, .026, .008), .042, .004); b.rotateX(Math.PI / 2); tmesh(g, b, VB, 0, .058, 0); }
    // sliding jaw: rounded head flowing down and forward into the beam, 5 cm open
    { tmesh(g, ex2(rr(.056, .03, .098, .152, .012), .132, .005, 3), VB, 0, 0, 0); jaw(.055, -1);
      const f = new THREE.Shape(); f.moveTo(.094, .079); f.lineTo(.094, .128); f.quadraticCurveTo(.1, .086, .16, .079); f.lineTo(.094, .079); tmesh(g, ex2(f, .05, .005, 3), VB, 0, 0, 0); }   // the swept web between head and beam
    // nut boss, threaded screw, T-head and tommy bar
    { cyl(g, .028, .03, VBn, .17, .06, 0, 'x', 28); tmesh(g, new THREE.TorusGeometry(.028, .0025, 6, 28), DK, .185, .06, 0).rotation.y = Math.PI / 2;
      cyl(g, .0095, .03, BRIGHT, .198, .06, 0, 'x', 14); const TH = STD({ color: 0xa9b0b6, metalness: .75, roughness: .38 }); for (let i = 0; i < 6; i++) tmesh(g, new THREE.TorusGeometry(.0098, .0019, 5, 16), TH, .1875 + i * .0042, .06, 0).rotation.y = Math.PI / 2;   // exposed thread
      cyl(g, .018, .028, BRIGHT, .222, .06, 0, 'x', 18); cyl(g, .02, .004, BRIGHT, .209, .06, 0, 'x', 18);   // T-head with its collar
      tmesh(g, new THREE.CylinderGeometry(.0058, .0058, .22, 10), BRIGHT, .222, .03, 0); for (const yy of [-.08, .14]) tmesh(g, new THREE.SphereGeometry(.0115, 12, 9), BRIGHT, .222, yy, 0); }   // tommy bar hanging through it, ball ends
    return g; };
  // --- 1. front wall bench, under the window-less front, with shelves over its left end (scan: top ≈ 1.0–1.1 m, a shelf ≈ 2.0 m at x 0.75–2.0)
  { const g = grp(P), b = bench(g, 3.2, -2.78, 5.4, .62, 1.0, 0, { doors: false });
    const s = shelving(g, 1.4, -2.68, 1.7, .4, 1.3, 0, [.55, 1.0], false); s.position.y = 1.0; for (let i = 0; i < 5; i++) tin(s, -.7 + i * .17, .57, 0, .065, .14, [0xd9dde0, 0x2f5f8f, 0xb8231d, 0xe8e2d0, 0x3b6b3a][i]);
    for (let i = 0; i < 3; i++) caseY(s, .15 + i * .28, 1.02, 0, .26, .12 + i * .01, .32); cbox(s, -.55, 1.02, 0, .4, .26, .3);
    const t = grp(g, 0, 1.0, 0); for (const d of [drill(t, 1.6, 0, -2.78, .4), drill(t, 1.95, 0, -2.7, -.3, 0x2a5aa8)]) T2(d, 'Cordless drill', 'A cordless drill left on the bench. The scan shows small yellow and blue shapes on the bench top; which tools they are is a guess.', '≈ 0.25 m long'); caseY(t, 2.6, 0, -2.85, .5, .14, .36); for (let i = 0; i < 4; i++) tin(t, 4.4 + i * .14, 0, -2.9, .055, .12, [0xe8e2d0, 0xe0661c, 0x2f5f8f, 0xe8e2d0][i]);
    box(t, .3, .1, .2, STD({ color: 0x3c6e9e, roughness: .4 }), 3.6, 0, -2.85); hammer(t, 3.2, 0, -2.66, 0).rotation.z = Math.PI / 2; for (let i = 0; i < 3; i++) cbox(t, 5.15, i * .2, -2.85, .38, .2, .34, wf(-.1, .1));
    T2(g, 'Bench (front wall)', 'A timber bench right along the front wall: ply top, a shelf underneath, tins, drills and tool cases on it, a slotted-angle shelf unit over its left end with paint tins and yellow tool cases.', '≈ 5.4 × 0.6 m · top ≈ 1.0 m (scan)'); }
  // --- 2. left wall bench in the front, and a yellow banner on the wall above it (scan: ≈ 0.9–1.3 m at x 0.75–1.25; yellow 1.3–2.4 m at z −3.5…−4.6)
  { const g = grp(P), b = bench(g, .82, -4.4, 2.6, .7, .95, Math.PI / 2, { doors: true });
    const t = grp(g, .82, .95, -4.4); T2(bvice(t, .35, 0, .9), 'Bench vice', 'A blue engineer\'s bench vice bolted to the end of the bench, swivel base, jaws to the front. The scan shows a blue lump here about the right size; make and jaw width are a guess.', 'jaws ≈ 14 cm');   // 24 Oct: own tag + label. 06:xx: a real bench vice, jaws flush with the bench front (it was blue blocks facing along the bench)
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
    T2(mitreSaw(t, -.2, 0, 0), 'Mitre saw', 'A chop/mitre saw on the short bench. The scan shows a dark lump about 0.5 m across and 0.4 m tall here; the make and blade size are a guess.', '≈ 0.5 × 0.45 m · blade ≈ 250 mm');   // 06:xx: a real mitre saw (base, turntable, fence, hood, motor, handle, dust bag), operator on the open-floor side
    for (let i = 0; i < 2; i++) tub(t, .45, i * .2, 0, .4, .18, .3, [0x2a5aa8, 0xb8231d][i]);
    T2(g, 'Bench with mitre saw', 'A short bench at the edge of the low ceiling with a mitre saw on it and two plastic boxes of fixings.', '≈ 1.5 × 0.55 m · top ≈ 1.05 m (scan)'); }
  // --- 5. the long bench down the aisle wall, cupboards under it, shelves over the far half (scan: top ≈ 0.9–1.1 m at x 5.25–5.8 the whole length; stock to ≈ 1.7 m and 2.6 m over z −9…−12.7)
  { const g = grp(P), b = bench(g, 5.62, -7.6, 9.6, .62, .95, -Math.PI / 2, { doors: true, notch: { x: 0, w: .15, d: .105 } });   /* notch: the mezzanine post (x 5.83–5.97, z −7.6) stands in the back of this bench */ const t = grp(g, 5.62, .95, 0);   // 27 Oct: −π/2 (was +π/2: the doors and front edge faced the wall)
    let z = -3.4; const kinds = ['case', 'drill', 'tins', 'box', 'reel', 'tub', 'case', 'box', 'drill', 'tins', 'tub', 'box', 'case'];
    let prev = '';   // 30 Oct 00:xx (07:xx review: "a hard black wedge between the case and the box beside it" in wstop): a box straight after a case sits 10 cm further off it, so the ≈ 12 cm gap the AO filled black opens to ≈ 22 cm; nothing after it moves, no RNG drawn
    for (const k of kinds) { z -= wf(.55, .8); if (z < -12.3) break; const zb = k === 'box' && prev === 'case' ? z - .1 : z; prev = k;
      if (k === 'case') caseY(t, 0, 0, z, .35, .13, .5, -Math.PI / 2 + wf(-.1, .1)); else if (k === 'drill') drill(t, -.05, 0, z, wf(0, 6), wr() < .5 ? YEL : 0x2a5aa8);   // 28 Oct 04:xx: cases −π/2, latches and front to the room (were to the wall)
      else if (k === 'tins') for (let i = 0; i < 3; i++) tin(t, -.12 + (i % 2) * .14, 0, z + i * .13, .05, .1 + wr() * .06, [0xe8e2d0, 0x3b6b3a, 0xb8231d][i]);
      else if (k === 'box') cbox(t, 0, 0, zb, .35, .25, .45, wf(-.2, .2)); else if (k === 'tub') tub(t, 0, 0, z, .32, .22, .45, [0x2a5aa8, 0xb8231d, 0x3b6b3a][Math.floor(wr() * 3)]);
      else benchReel(t, -.02, 0, z, Math.PI / 2); }   // 05:xx: a real site cable reel
    const s = shelving(g, 5.74, -10.85, 3.6, .38, 1.75, Math.PI / 2, [.6, 1.15, 1.65], false); s.position.y = .95;
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
      else if (k < .86) { const q = TINSETS[tinN++ % TINSETS.length], zs = [wf(-.2, .2), wf(-.2, .2), wf(-.2, .2)]; for (let i = 0; i < q.length; i++) tin(s, u + q[i][3], y, zs[i], q[i][0], q[i][1], q[i][2]); u += .42; }   /* always 3 draws, so the layout after stays put */   // 1 Nov 05:xx: each trio its own sizes and colours (was red/blue/green clones)
      else { const c = grp(s, u + .2, y + .12, 0); for (let i = 0; i < 3; i++) { const tr = new THREE.Mesh(new THREE.TorusGeometry(.12 - i * .02, .012, 6, 20), ORA); tr.rotation.y = Math.PI / 2; c.add(tr); } u += .32; } } }
    const lo = shelving(g, 1.3, -9.8, .8, .9, 1.45, Math.PI / 2, [.12, .7, 1.3]); for (let lv = 0; lv < 3; lv++) cbox(lo, 0, .14 + lv * .58, 0, .6, .38, .55, wf(-.1, .1));
    T2(g, 'Tall shelving (left wall)', 'Floor-to-2.4 m slotted-angle shelving down the left wall, packed: cardboard boxes, plastic boxes with coloured lids, yellow tool cases, paint tins and coils of rope; a lower unit of boxes after it.', '≈ 4.1 × 0.85 m · ≈ 2.45 m tall (scan)'); }
  // --- 7. the far wall: bench with a pegboard tool wall over it, a roll cabinet, the fire extinguisher (scan: bench ≈ 1.2–1.3 m deep in clutter at z −12.2…−12.95, shelving to 2.5 m above; a grey drawer stack ≈ 1.4 m at x ≈ 1.6; red at x ≈ 0.8, 1.3 m)
  { const g = grp(P), b = bench(g, 3.25, -12.6, 2.9, .65, .95, 0); const t = grp(g, 0, .95, 0);
    const pb = pegBoard(g, 3.25, 1.15, -12.877, 3.0, 1.15);   // 24 Oct 06:xx: 6 mm board on battens, crisp 25 mm-pitch holes (was a flat plane at z −12.88)
    // 24 Oct 07:xx: every hook comes out of a real hole: holes sit at x 1.7625 + n·.025, y 1.1625 + m·.025 (board 1.75–4.75 × 1.15–2.30, 25 mm pitch, hole mid-tile).
    // Each tool moves with its hook (≤ 12.5 mm); hook pairs are a whole number of holes apart
    const HX = 1.7625, HY = 1.1625, gx = v => HX + Math.round((v - HX) / .025) * .025, gy = v => HY + Math.round((v - HY) / .025) * .025;
    const hm = grp(g); for (let i = 0; i < 5; i++) { const hx0 = gx(2.02 + i * .165), dy = gy(1.755) - 1.755, hp = grp(hm, hx0, 1.755 + dy, -12.86); hp.rotation.z = [.026, -.018, .012, -.032, .02][i]; hammer(hp, 0, 1.48 - 1.755, 0, 0, [3, 1, 0, 2, 4][i]); for (const hx of [-.025, .025]) peg(hm, hx0 + hx, 1.755 + dy, -12.875, .05); }   /* 1 Nov 02:xx: each hammer tips 0.7–1.8° about the seat of its head on its hook pair, some each way (31 Oct 00:xx find: "all five hang dead plumb"); the hooks stay square */   // 05:xx: hung straight, heads up, on pairs of hooks (they overlapped in crossed pairs)
    const sp = grp(g), sr = gy(1.725); for (let i = 0; i < 8; i++) { const L = .14 + i * .02; const ry0 = sr - (.006 + L * .045) * .5 + .0029, piv = grp(sp, gx(2.88) + i * .05, ry0, -12.86); piv.rotation.z = [0, .02, -.035, 0, .045, -.015, 0, .028][i];   // 1 Nov: a few hang a touch off plumb, turned about the ring on its hook
      spanner(piv, 0, -L * .9, 0, L, [0, 0, 0, 0, 0, 2, 0, 0][i]); }   /* 1 Nov 04:xx: the two black-oxide spanners back to chrome (03:xx blind review: they read as flat plastic, the chrome set read real); the dull warm one and the lean stay */   /* all eight on one row of holes, two holes apart; spanner() puts its hook at y + L·.9 + s/2 − .0029 */   // 05:xx 24 Oct: rings all on one hook rail, small to big
    const hs = grp(g); for (let i = 0; i < 3; i++) saw(hs, gx(3.5 + i * .2), gy(1.9 + SAWHOOK) - SAWHOOK, -12.865, i);   // hand saws
    const fc = grp(g); for (let i = 0; i < 4; i++) { const y = 1.76 - (i % 2) * .05;   /* 25 Oct: stagger 2 → 5 cm so the fatter top jaws clear each other */ fclamp(fc, gx(4.22 + i * .13 + .01) - .01, gy(y + .012) - .012, -12.855, .45 - (i % 2) * .1, .1 - (i % 2) * .015); }   /* its hook is at (x + .01, y + .012) */   // F-clamps (05:xx: bar, cast jaws, spindle, handle)
    const lv = grp(g); sLevel(lv, gx(2.4), gy(1.27 - .006) + .006, -12.86, .6, 0xf2b705); sLevel(lv, gx(2.5), gy(2.0 - .006) + .006, -12.86, .6, 0x2a5aa8); pb.userData.bake([hm, sp, hs, fc, lv]);   // outlines + drop shadows on the board
    { const W = ' on the pegboard. The scan only shows clutter on the wall here, so which tools hang where is a guess (typical workshop kit).';   // 24 Oct: each set gets its own tag + label
      T2(hm, 'Hammers', 'Five claw hammers hung heads up on pairs of hooks: ash with a red grip, plain ash, ash with a black grip, yellow fibreglass and a one-piece steel one' + W, '≈ 0.33 m'); T2(sp, 'Spanners', 'A row of combination spanners, small to big' + W, '0.14–0.28 m'); T2(hs, 'Hand saws', 'Three hand saws hung by their handles' + W, '≈ 0.55 m'); T2(fc, 'F-clamps', 'Four F-clamps hung by their fixed jaws' + W, '0.35–0.45 m'); }   // spirit levels (05:xx: box section, end caps, vials)
    const sh = shelving(g, 3.25, -12.78, 2.9, .3, .55, 0, [.35], false); sh.position.y = 2.0; for (let i = 0; i < 6; i++) (i % 2 ? tub : (p, x, y, z, w, h, d) => cbox(p, x, y, z, w, h, d))(sh, -1.2 + i * .48, .37, 0, .4, .18, .26, 0x2a5aa8);
    drill(t, 2.4, 0, -12.5, .5); caseY(t, 3.0, 0, -12.6, .45, .14, .35); for (let i = 0; i < 3; i++) tub(t, 3.6 + i * .3, 0, -12.65, .26, .12, .2, [0xb8231d, 0x2a5aa8, 0x3b6b3a][i]);
    T2(rollCab(g, 1.45, -12.6), 'Roll cabinet', 'A grey steel tool chest on castors: a drawer base with a lift-lid chest on top. The scan shows a grey drawer stack about 1.4 m tall here.', '≈ 0.7 × 0.45 × 1.4 m (scan)');   // roll cabinet (05:xx: castors, drawers with pull bars and labels, lift-lid top chest, side handle)
    const fe = grp(g, .75, 0, -12.85); cyl(fe, .075, .5, RED, 0, 1.15, 0); cyl(fe, .03, .06, BLK, 0, 1.43, 0); box(fe, .03, .08, .06, BLK, .05, 1.45, 0); const hose = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(.04, 1.43, 0), new THREE.Vector3(.1, 1.3, .03), new THREE.Vector3(.08, 1.0, .05)]), 10, .01, 6), BLK); fe.add(hose);
    box(fe, .2, .28, .005, STD({ roughness: .5, map: can(100, 140, (x, w, h) => { x.fillStyle = '#c8201b'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.fillRect(4, 4, w - 8, 2); x.beginPath(); x.roundRect(40, 26, 22, 56, 6); x.fill(); x.fillRect(46, 18, 10, 9); x.fillRect(56, 20, 14, 4); x.font = 'bold 12px Arial'; x.textAlign = 'center'; x.fillText('FIRE', w / 2, 104); x.fillText('EXTINGUISHER', w / 2, 120); }) }), 0, 1.72, .07);   // its sign (W5b: a real red sign, was a plain white card)
    T2(fe, 'Fire extinguisher', 'A red extinguisher on the wall by the corner with its sign above. The scan shows something red about 1.3 m up here; the type (CO2 or foam) isn\'t known.', '≈ 0.5 m tall');
    T2(g, 'Tool wall (far wall)', 'The far wall: a bench with a pegboard tool wall over it (hammers, spanners, hand saws, F-clamps, levels), a shelf of boxes and fixings tubs on top, a grey roll cabinet of drawers at the left end and the fire extinguisher by the corner.', 'bench ≈ 2.9 × 0.65 m · tool wall to ≈ 2.5 m (scan)'); }
  // --- 8. on the floor: compressor (scan: ≈ 0.65 m at x 4.0–4.5, z −11.0…−11.5, orange on top), a bin (≈ 0.7 m at x 3.0–3.5, z −8.2…−8.7), offcuts and sheet stock leaning on the left lining
  { const g = grp(P);
    const cp = compressor(g, 4.25, -11.2, .3);   // 06:xx: real shape (tank with welds, wheels, handle, finned pump, motor, gauges, couplers, hose coil)
    T2(cp, 'Compressor', 'An orange wheeled air compressor: pump and motor on top of the tank, two gauges and a regulator, a blue airline coiled beside it.', '≈ 0.7 × 0.4 × 0.65 m (scan)');
    const bn = offBin(g, 3.25, -8.45);   // 05:xx: ribbed bin, rim, side handles, offcuts stood up in it
    for (let i = 0; i < 18; i++) wr();   // the old offcuts took 18 layout draws: keep taking them so nothing after this moves
    for (const [x, z, r, c] of [[2.4, -9.5, .2, 0x2a5aa8], [1.97, -9.95, .16, 0xe8e2d0]]) { const bk = grp(g, x, 0, z); const bm2 = new THREE.Mesh(new THREE.CylinderGeometry(r, r * .85, r * 1.7, 18, 1, true), STD({ color: c, roughness: .5, side: THREE.DoubleSide })); bm2.position.y = r * .85; bk.add(bm2); const rim = new THREE.Mesh(new THREE.TorusGeometry(r, .012, 6, 20), STD({ color: c })); rim.rotation.x = Math.PI / 2; rim.position.y = r * 1.7; bk.add(rim); T2(bk, 'Bucket', 'A plastic bucket on the floor (the scan shows an open ring here).', '≈ ' + (r * 2).toFixed(1) + ' m across'); }   // scan: two rings ≈ 0.4 m at x 2.2–2.6, z −9.3…−9.7 and x 1.6–2.0, z −9.7…−10.1
    { const lc = grp(g, .9, 0, -11.95); box(lc, .8, .95, .6, DOORP, 0, 0, 0); box(lc, .84, .03, .64, TOP, 0, .95, 0); box(lc, .004, .86, .006, STD({ color: 0x3a362f, roughness: .9 }), .401, .05, 0); box(lc, .004, .06, .58, STD({ color: 0x4a4640, roughness: .9 }), .401, 0, 0);   // two doors meeting in the middle, scuffed dark kick strip (24 Oct 03:xx)
      const PULL2 = STD({ color: 0xc9cdd1, metalness: .35, roughness: .32 }); for (const dz of [-.045, .045]) { const pl = grp(lc, .4, .72, dz); box(pl, .03, .16, .022, PULL2, .028, 0, 0); for (const dy of [.01, .13]) box(pl, .03, .02, .02, PULL2, .012, dy, 0); } tin(lc, -.1, .98, .1, .06, .16, 0xb8231d); cbox(lc, .1, .98, -.1, .35, .25, .3); T2(lc, 'Low cupboard', 'A low cupboard in the far left corner with a tin and a box on it.', '≈ 0.8 × 0.6 × 1.0 m (scan)'); }   // D-pulls on each door by the meeting edge (24 Oct 03:xx; were 1.5 cm slivers). scan: ≈ 1.0–1.1 m at x 0.75–1.0, z −11.7…−12.2
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
    // 28 Oct 06:xx (03:xx review: "the grey rail runs across the green post and stops in mid-air"): the aisle-wall conduit was one 9.4 m bar at
    // x 5.93 straight through the mezzanine post and across the window's bottom rail, both ends loose, two sockets on the glass. Now two round
    // 20 mm runs on the lining (x 5.945), each fed by a drop from the ceiling into a back box, saddle-clipped, sockets only on solid wall:
    // the door-end run from a drop just in front of the post (z −7.47) back to the window jamb (z −5.5); the far run from a drop by the back
    // corner (z −12.76, between the shelving's end upright and the far wall) up to a socket that ends it just past the post (z −7.86). Nothing crosses the post or the window. No RNG draws.
    { const CX = 5.945, CY = 1.2, R = .01, SAD = STD({ color: 0xdcdcd6, roughness: .45 });
      const run = (z0, z1) => { cyl(g, R, Math.abs(z1 - z0), CND, CX, CY, (z0 + z1) / 2, 'z', 10); for (let z = Math.max(z0, z1) - .35; z > Math.min(z0, z1) + .2; z -= .8) { box(g, .004, .028, .016, SAD, CX - .012, CY - .014, z); for (const y of [CY - .02, CY + .014]) box(g, .012, .006, .016, SAD, CX + .006, y, z); } };   // saddle: a strap over the front, an ear screwed to the wall above and below
      const drop = (z, yTop) => { cyl(g, R, yTop - CY, CND, CX, (yTop + CY) / 2, z, 'y', 10); for (let y = CY + .45; y < yTop - .2; y += .9) { box(g, .004, .016, .028, SAD, CX - .012, y, z); for (const dz of [-.017, .017]) box(g, .012, .016, .006, SAD, CX + .006, y, z + dz); } box(g, .03, .02, .05, CND, CX - .003, yTop - .02, z - .025); };   // saddles up the drop, a ceiling box at the top
      const bb = (z) => { box(g, .045, .085, .085, CND, CX - .006, CY - .045, z); box(g, .002, .07, .07, STD({ color: 0xf2f2ee, roughness: .4 }), CX - .029, CY - .037, z); };   // adaptable back box where a drop turns into a run
      const sock = (z) => { box(g, .04, .09, .15, CND, 5.94, CY - .045, z); for (const dz of [-.035, .035]) box(g, .005, .025, .015, BLK, 5.918, CY - .012, z + dz); box(g, .004, .008, .012, STD({ color: 0xc23b22, emissive: 0x802010, emissiveIntensity: .6 }), 5.919, CY + .022, z); };   // double socket, a little red neon by the switch
      drop(-7.47, 3.58); bb(-7.47); run(-7.47, -5.5); for (const z of [-6.1, -6.85]) sock(z); box(g, .045, .085, .085, CND, CX - .006, CY - .045, -5.5);   // door-end run: ends in a box at the window jamb
      drop(-12.76, 3.58); bb(-12.76); run(-12.76, -7.86); for (const z of [-7.86, -9.0, -10.3, -11.6]) sock(z);
      // 29 Oct 02:xx (backlog: "the window bench has no socket at all" and "contact shadows under the conduit are weak"): a spur leaves the
      // window-jamb box downwards, turns and runs under the sill to a double socket under the glass (y 1.0–1.09: clear of the 0.95 m bench top
      // and the 1.13 m sill); and every run, drop, box and socket on this wall gets a soft baked shadow on the lining just below it (the light
      // comes from the strip lights above). Shadow strips are planes 2 mm off the lining (x 5.958), no AO, no shadows. No RNG draws.
      { const SY = 1.045, Z0 = -5.5, ZS = -4.62, zr = ZS + .075;
        cyl(g, R, 1.11 - SY, CND, CX, (1.11 + SY) / 2, Z0, 'y', 10); const el = new THREE.Mesh(new THREE.SphereGeometry(R, 10, 8), CND); el.position.set(CX, SY, Z0); g.add(el);   // drop out of the box, a rounded bend
        cyl(g, R, zr - Z0, CND, CX, SY, (Z0 + zr) / 2, 'z', 10); box(g, .004, .028, .016, SAD, CX - .012, SY - .014, -5.12); for (const y of [SY - .02, SY + .014]) box(g, .012, .006, .016, SAD, CX + .006, y, -5.12);
        box(g, .04, .09, .15, CND, 5.94, SY - .045, ZS); for (const dz of [-.035, .035]) box(g, .005, .025, .015, BLK, 5.918, SY - .012, ZS + dz); box(g, .004, .008, .012, STD({ color: 0xc23b22, emissive: 0x802010, emissiveIntensity: .6 }), 5.919, SY + .022, ZS); }
      { const sh = can(8, 64, (x, w, h) => { const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(30,22,14,.5)'); gr.addColorStop(.18, 'rgba(30,22,14,.32)'); gr.addColorStop(1, 'rgba(30,22,14,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); });
        const SHM = new THREE.MeshBasicMaterial({ map: sh, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
        const strip = (zA, zB, yTop, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(Math.abs(zB - zA), h), SHM); m.rotation.y = -Math.PI / 2; m.position.set(5.958, yTop - h / 2, (zA + zB) / 2); m.userData.noAO = true; m.renderOrder = 1; g.add(m); };
        strip(-7.47, -5.5, CY - .008, .035); strip(-12.76, -7.86, CY - .008, .035); strip(-5.5, -4.695, 1.045 - .008, .03);   // under the runs
        for (const z of [-6.1, -6.85, -7.86, -9.0, -10.3, -11.6]) strip(z - .085, z + .085, CY - .045, .05); strip(-4.705, -4.535, 1.0, .045);   // under the sockets (they stand 4 cm off)
        for (const z of [-7.47, -12.76, -5.5]) strip(z - .05, z + .05, CY - .088, .04); }   // under the back boxes
      }
    box(g, 2.8, .025, .025, CND, 3.25, 1.28, -12.92); for (const x of [2.2, 3.4, 4.5]) box(g, .15, .09, .04, CND, x, 1.24, -12.92);
    box(g, .08, .12, .03, CND, 4.75, 1.3, -12.92); box(g, .025, 1.3, .025, CND, 4.75, 1.42, -12.92);
    const dust = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 10.5), new THREE.MeshStandardMaterial({ transparent: true, depthWrite: false, roughness: 1, map: can(1024, 2048, (x, w, h) => { x.clearRect(0, 0, w, h);   // 28 Oct 01:xx: 4× the pixels (≈ 5 mm), same wr() draws
      for (let i = 0; i < 220; i++) { const cx = wr() * w, cy = wr() * h, r = wf(6, 30) * 4, gr = x.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, `rgba(${wr() < .7 ? '214,180,128' : '120,110,96'},${wf(.15, .4) * .8})`); gr.addColorStop(1, 'rgba(214,180,128,0)'); x.fillStyle = gr; x.fillRect(cx - r, cy - r, 2 * r, 2 * r); }
      // the 2500 specks were 2 cm squares at up to .6 alpha: from close they read as terrazzo chips (07:xx review). Now 5–12 mm
      // sawdust chips, fainter, plus a fine film of dust (own RNG) so the floor reads as concrete with dust on it.
      { let sf = 6421; const fq = () => (sf = (sf * 16807) % 2147483647) / 2147483647;
        for (let i = 0; i < 2500; i++) { const a = wf(.2, .6) * .5, px = wr() * w, py = wr() * h; x.fillStyle = `rgba(${fq() < .75 ? '222,192,138' : '170,140,98'},${a})`; x.beginPath(); x.ellipse(px, py, 1 + fq() * 1.4, .6 + fq() * .7, fq() * 3.14, 0, 7); x.fill(); }
        for (let i = 0; i < 70000; i++) { x.fillStyle = `rgba(${fq() < .8 ? '218,190,140' : '150,138,120'},${.04 + fq() * .1})`; x.fillRect(fq() * w, fq() * h, 1, 1); } } }) }));
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
    box(wb, 1.16, .76, .004, STD({ roughness: .55, envMapIntensity: .6, map: can(464, 304, (x, w, h) => { x.fillStyle = '#f4f5f3'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 7; i++) { const cx = vf(0, w), cy = vf(0, h), r = vf(30, 90), gr = x.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, 'rgba(150,160,175,.12)'); gr.addColorStop(1, 'rgba(150,160,175,0)'); x.fillStyle = gr; x.fillRect(cx - r, cy - r, 2 * r, 2 * r); }   // ghosts of old writing
      x.font = 'bold 30px "Comic Sans MS", "Marker Felt", cursive'; x.fillStyle = '#1b3f8a'; x.fillText('JOBS', 18, 40); x.fillRect(18, 46, 70, 3);
      // 29 Oct 00:xx (03:xx review: "the JOBS list is squiggles"): real marker words, letter by letter with a little tilt and bounce so it reads hand-written in any font;
      // workshop jobs only, no people's names. Own RNG (5113); the old squiggles' vf()/vr() draws are burned below so nothing after the board moves.
      { let ws = 5113; const wr = () => (ws = (ws * 16807) % 2147483647) / 2147483647, wf = (a, b) => a + (b - a) * wr();
        const JOBS = [['16ft door hinges', 0], ['Re-stitch bell tent B4', 0], ['Sharpen chisels', 0], ['Planter straps x8 !!', 1], ['New mitre saw blade', 0], ['Order M8 bolts + washers', 0], ['SWEEP UP', 2]];
        x.lineCap = x.lineJoin = 'round'; x.textBaseline = 'alphabetic';
        JOBS.forEach(([t, k], r) => { const y = 84 + r * 31, col = k === 1 ? '#b3261e' : k === 2 ? '#1d6b35' : '#1b2030'; x.fillStyle = x.strokeStyle = col; x.lineWidth = 2.6;
          x.beginPath(); x.arc(26, y - 8, 4, 0, 7); x.stroke(); let px = 40; const tilt = wf(-.025, .015);
          x.font = 'bold 23px "Marker Felt", "Segoe Print", "Comic Sans MS", "Chalkboard SE", sans-serif';
          for (const ch of t) { const cw = x.measureText(ch).width; x.save(); x.translate(px, y + wf(-1.2, 1.2) + (px - 40) * tilt); x.rotate(wf(-.07, .07)); x.globalAlpha = wf(.82, .97); x.fillText(ch, 0, 0); x.restore(); px += cw * wf(.9, 1.0); }
          if (r < 3) { x.strokeStyle = '#1b2030'; x.lineWidth = 2.4; x.beginPath(); x.moveTo(34, y - 8 + wf(-1, 1)); x.lineTo(px + 4, y - 8 + (px - 40) * tilt + wf(-2, 1)); x.stroke(); } });   // first three crossed off
        }   // (a 'done' note with an arrow was tried: the phone close-up crops the board's right side, so it read as a stray 'do')
      for (let r = 0; r < 7; r++) { let px = 40; const L = vf(160, 360); while (px < 40 + L) { const step = vf(5, 11); vf(4, 14); vf(-2, 2); px += step; if (vr() < .12) px += vf(6, 12); } }   // burn the old squiggles' draws
      x.fillStyle = '#d0201a'; x.beginPath(); x.arc(420, 30, 9, 0, 7); x.fill(); x.fillStyle = '#1f5fae'; x.beginPath(); x.arc(392, 30, 9, 0, 7); x.fill(); }) }), 0, .02, .011);
    box(wb, .5, .03, .05, STD({ color: 0xb9bcbf, metalness: .5, roughness: .4 }), .2, -.03, .03); for (const [dx, c] of [[.05, 0x1b3f8a], [.15, 0xb3261e], [.25, 0x1b1c1e]]) cyl(wb, .009, .13, STD({ color: c, roughness: .4 }), dx, .0, .035, 'x', 8);
    // 29 Oct 04:xx (03:xx review: "the calendar is a flat decal, no curl, no pin"): a wire-bound wall calendar hung on a nail. The page is a bent
    // sheet (flat at the binding, bowing off the wall towards the foot, the bottom-right corner curling up), two more pages show their edges under it,
    // a wire-o binding and a hanger loop over a round-headed nail, and a soft shadow on the OSB behind the bow. Same map and draws (vf order kept).
    const cal = grp(g, 4.75, 1.4, -2.4815, Math.PI), calSheet = (w, h, bow, curl, mat, dy, dz) => { const geo = new THREE.PlaneGeometry(w, h, 10, 20), p = geo.attributes.position;
        for (let i = 0; i < p.count; i++) { const u = p.getX(i) / (w / 2), t = (h / 2 - p.getY(i)) / h; p.setZ(i, bow * t * t + curl * Math.max(0, u) ** 2 * Math.max(0, t - .55) ** 2 / .2); } geo.computeVertexNormals();
        const m = new THREE.Mesh(geo, mat); m.position.set(0, .21 + dy, dz); cal.add(m); return m; };
    const CALPG = STD({ color: 0xf3f1ea, roughness: .8, side: THREE.DoubleSide });
    calSheet(.298, .41, .010, .006, CALPG, -.006, .0015); calSheet(.299, .415, .013, .009, CALPG, -.003, .0028);   // the pages under the top one
    calSheet(.3, .42, .016, .014, STD({ roughness: .7, side: THREE.DoubleSide, map: can(450, 630, (x, W, H) => { x.scale(3, 3); const w = W / 3, h = H / 3; x.fillStyle = '#fbfaf6'; x.fillRect(0, 0, w, h); for (let i = 0; i < 6; i++) { vf(0, w); vf(0, w); vf(10, 60); vf(0, w); }   // burn the old triangles' draws (same order), then a picture, then the month grid
      // 30 Oct 01:xx (backlog: "the picture is abstract white triangles on blue, reads as a placeholder"): a summer festival field, fixed (no RNG): sky,
      // two clouds, far and near hills, a mown field, a yurt and four bell tents getting smaller towards the hills.
      { const sk = x.createLinearGradient(0, 0, 0, 56); sk.addColorStop(0, '#5f97c4'); sk.addColorStop(1, '#d6e7ef'); x.fillStyle = sk; x.fillRect(0, 0, w, 92);
        x.fillStyle = 'rgba(255,255,255,.75)'; for (const [cx, cy, s] of [[34, 16, 1], [108, 24, .8]]) { x.beginPath(); x.ellipse(cx, cy, 13 * s, 4.5 * s, 0, 0, 7); x.ellipse(cx - 7 * s, cy + 1.5 * s, 8 * s, 3.5 * s, 0, 0, 7); x.ellipse(cx + 8 * s, cy + 1.8 * s, 9 * s, 3.2 * s, 0, 0, 7); x.fill(); }
        const hill = (y0, pts, c) => { x.fillStyle = c; x.beginPath(); x.moveTo(0, 92); x.lineTo(0, y0); for (const [a, b, c2, d] of pts) x.quadraticCurveTo(a, b, c2, d); x.lineTo(w, 92); x.closePath(); x.fill(); };
        hill(50, [[25, 40, 55, 47], [85, 53, 112, 44], [135, 38, 150, 46]], '#8aa596');   // far hills, hazy
        hill(58, [[30, 50, 70, 57], [110, 62, 150, 54]], '#6d9a4c');                     // near rise
        const fd = x.createLinearGradient(0, 60, 0, 92); fd.addColorStop(0, '#8cb85c'); fd.addColorStop(1, '#5d8c37'); x.fillStyle = fd; x.beginPath(); x.moveTo(0, 92); x.lineTo(0, 64); x.quadraticCurveTo(75, 58, 150, 63); x.lineTo(150, 92); x.fill();
        x.strokeStyle = 'rgba(255,255,255,.10)'; x.lineWidth = 3; for (let i = -3; i < 8; i++) { x.beginPath(); x.moveTo(75 + i * 6, 61); x.lineTo(75 + i * 30, 92); x.stroke(); }   // mowing stripes
        const bell = (cx, by, r) => { const hw = r, wh = r * .32, top = by - wh - r * 1.05;   // a bell tent: short wall, cone, door, pole tip, shadow
          x.fillStyle = 'rgba(30,50,20,.28)'; x.beginPath(); x.ellipse(cx + r * .25, by + r * .06, hw * 1.15, r * .16, 0, 0, 7); x.fill();
          x.fillStyle = '#f2ede0'; x.beginPath(); x.moveTo(cx - hw, by); x.lineTo(cx - hw, by - wh); x.quadraticCurveTo(cx - hw * .45, by - wh - r * .55, cx, top); x.quadraticCurveTo(cx + hw * .45, by - wh - r * .55, cx + hw, by - wh); x.lineTo(cx + hw, by); x.closePath(); x.fill();
          x.fillStyle = 'rgba(90,80,60,.22)'; x.beginPath(); x.moveTo(cx + hw * .15, top + r * .1); x.quadraticCurveTo(cx + hw * .55, by - wh - r * .5, cx + hw, by - wh); x.lineTo(cx + hw, by); x.lineTo(cx + hw * .35, by); x.closePath(); x.fill();   // shade side
          x.fillStyle = '#5b5446'; x.beginPath(); x.moveTo(cx - r * .2, by); x.lineTo(cx - r * .02, by - wh - r * .55); x.lineTo(cx + r * .16, by); x.fill();   // door
          x.strokeStyle = '#6b5a40'; x.lineWidth = Math.max(.5, r * .07); x.beginPath(); x.moveTo(cx, top); x.lineTo(cx, top - r * .18); x.stroke(); };
        const yurt = (cx, by, r) => { x.fillStyle = 'rgba(30,50,20,.28)'; x.beginPath(); x.ellipse(cx + r * .2, by + r * .05, r * 1.15, r * .14, 0, 0, 7); x.fill();
          x.fillStyle = '#e8dcc0'; x.fillRect(cx - r, by - r * .55, 2 * r, r * .55); x.fillStyle = 'rgba(90,70,40,.2)'; x.fillRect(cx + r * .3, by - r * .55, r * .7, r * .55);
          x.fillStyle = '#d9cba8'; x.beginPath(); x.moveTo(cx - r * 1.08, by - r * .55); x.lineTo(cx - r * .14, by - r * 1.05); x.lineTo(cx + r * .14, by - r * 1.05); x.lineTo(cx + r * 1.08, by - r * .55); x.closePath(); x.fill();
          x.fillStyle = '#7a5530'; x.fillRect(cx - r * .17, by - r * .45, r * .34, r * .45); };   // wall, roof, timber door
        bell(124, 66.5, 4); bell(101, 69, 5.5); yurt(36, 70, 8.5); bell(70, 75, 7.5); bell(16, 82, 9.5);   // far to near
        x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 2; x.strokeRect(4, 4, w - 8, 84); }   // a white border round the photo
      // 29 Oct 23:xx (07:xx review: "the month grid has no day numbers, the crossed-off days stop near the 22nd"): drawn at 3× (was 150 × 210 px, too soft
      // for numbers), October 2026 laid out Monday-first (the 1st is a Thursday), a weekday row, a small number in every day box, the days up to the 28th
      // crossed off in red, MOT pencilled in on the 20th and the 31st ringed. Same six vf() draws above, nothing else drawn from the RNG.
      txt(x, 'OCTOBER 2026', 11, w / 2, 106, '#222'); x.font = 'bold 5.5px Arial'; x.fillStyle = '#555'; x.textAlign = 'center'; 'MTWTFSS'.split('').forEach((d, i) => x.fillText(d, 17.5 + i * 19.1, 115.5));
      for (let k = 0; k < 35; k++) { const d = k - 2, i = k % 7, j = Math.floor(k / 7), cx = 8 + i * 19.1, cy = 118 + j * 16.8;
        if (d < 1 || d > 31) { x.fillStyle = 'rgba(0,0,0,.06)'; x.fillRect(cx, cy, 19.1, 16.8); continue; }
        x.font = 'bold 6px Arial'; x.textAlign = 'left'; x.fillStyle = i > 4 ? '#b3261e' : '#333'; x.fillText(String(d), cx + 1.6, cy + 6.4);
        if (d <= 28) { x.strokeStyle = 'rgba(179,38,30,.9)'; x.lineWidth = 1.3; x.beginPath(); x.moveTo(cx + 8, cy + 15); x.lineTo(cx + 17.5, cy + 4.5); /* 30 Oct: starts right of the number */ x.stroke(); } }
      x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = .7; for (let i = 0; i <= 7; i++) { x.beginPath(); x.moveTo(8 + i * 19.1, 118); x.lineTo(8 + i * 19.1, 202); x.stroke(); } for (let j = 0; j <= 5; j++) { x.beginPath(); x.moveTo(8, 118 + j * 16.8); x.lineTo(142, 118 + j * 16.8); x.stroke(); }
      x.font = 'italic bold 6.5px Arial'; x.fillStyle = '#1b3f8a'; x.textAlign = 'left'; x.fillText('MOT', 8 + 3 * 19.1 + 2.5, 118 + 4 * 16.8 + 14);   // the 29th, not crossed off yet (30 Oct: was 5 px under the 20th's cross-off)
      x.strokeStyle = '#1b3f8a'; x.lineWidth = .9; x.beginPath(); x.ellipse(8 + 5 * 19.1 + 9.5, 118 + 4 * 16.8 + 8.4, 8.5, 7, -.15, 0, 7); x.stroke();   // the 31st ringed
      const gw = x.createLinearGradient(0, h - 14, 0, h); gw.addColorStop(0, 'rgba(120,100,70,0)'); gw.addColorStop(1, 'rgba(120,100,70,.18)'); x.fillStyle = gw; x.fillRect(0, h - 14, w, 14); }) }), 0, .004);   // month page, thumb-worn foot
    { const WIRE = STD({ color: 0x2a2d32, metalness: .6, roughness: .3 }); for (let i = 0; i < 17; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(.005, .0012, 5, 12, Math.PI * 1.6), WIRE); r.rotation.set(0, Math.PI / 2, -Math.PI * .3); r.position.set(-.136 + i * .017, .417, .004); cal.add(r); }   // wire-o binding
      const hk = new THREE.Mesh(new THREE.TorusGeometry(.012, .0013, 5, 16, Math.PI), WIRE); hk.position.set(0, .42, .004); cal.add(hk);   // hanger loop up to the nail
      cyl(cal, .0012, .012, STEEL, 0, .432, .006, 'z', 6); cyl(cal, .0035, .0015, STEEL, 0, .432, .0125, 'z', 10);   // nail and its round head
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(.36, .48), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, map: can(64, 96, (x, w, h) => {
        const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(30,22,14,.0)'); gr.addColorStop(.25, 'rgba(30,22,14,.22)'); gr.addColorStop(.9, 'rgba(30,22,14,.55)'); gr.addColorStop(1, 'rgba(30,22,14,0)');
        x.fillStyle = gr; x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'destination-in'; const gx = x.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(.15, '#000'); gx.addColorStop(.85, '#000'); gx.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gx; x.fillRect(0, 0, w, h); }) }));
      sh.position.set(.016, .17, .0004); sh.userData.noAO = true; sh.renderOrder = 1; cal.add(sh); }   // soft shadow on the OSB under the bow
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
  { P.updateMatrixWorld(true); const surf = [], items = [], bb = new THREE.Box3(), dbg = window.__topShadow = [];
    for (const top of P.children.slice(n0)) top.traverse(o => { if (!o.isMesh || o.material.transparent) return; const b = bb.setFromObject(o).clone();
      if ((o.material === TOP || o.material === CHIP) && b.max.y - b.min.y < .05 && b.max.x - b.min.x > .25 && b.max.z - b.min.z > .2) surf.push(b); else if (b.max.y - b.min.y > .004) items.push(b); });
    const SM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    // 27 Oct 23:xx (07:xx review: "the crate and flight case on the worktop have no contact shadow"): the old bake darkened only the footprint
    // (+3 cm, 60 px/m, box-blurred), so almost all of it sat hidden under the item. Now each footprint casts a halo OUTSIDE its edge, from a
    // distance field at 160 px/m: a tight dark core (≈ 1 cm) where it meets the board plus a soft spread that grows with the item's height
    // (2.5–7 cm), the closer it sits the darker. Same sheet, same placement, no blur pass.
    for (const sf of surf) { const y = sf.max.y, PPM = 160, W = Math.max(2, Math.ceil((sf.max.x - sf.min.x) * PPM)), H = Math.max(2, Math.ceil((sf.max.z - sf.min.z) * PPM)), A = new Float32Array(W * H); let hit = 0;
      for (const b of items) { const gap = b.min.y - y; if (gap < -.012 || gap > .1 || b.max.y < y + .01 || b.max.x < sf.min.x || b.min.x > sf.max.x || b.max.z < sf.min.z || b.min.z > sf.max.z) continue;
        const ih = b.max.y - Math.max(b.min.y, y), k = Math.pow(1 - Math.max(0, gap) / .1, 2) * (ih > .08 ? .9 : .6), rC = .01, rW = Math.min(.07, Math.max(.025, .02 + ih * .15)), pad = rW * 3; hit++;
        const i0 = Math.max(0, Math.floor((b.min.x - pad - sf.min.x) * PPM)), i1 = Math.min(W - 1, Math.ceil((b.max.x + pad - sf.min.x) * PPM)), j0 = Math.max(0, Math.floor((b.min.z - pad - sf.min.z) * PPM)), j1 = Math.min(H - 1, Math.ceil((b.max.z + pad - sf.min.z) * PPM));
        for (let j = j0; j <= j1; j++) { const wz = sf.min.z + (j + .5) / PPM, dz = Math.max(b.min.z - wz, 0, wz - b.max.z);
          for (let i = i0; i <= i1; i++) { const wx = sf.min.x + (i + .5) / PPM, dx = Math.max(b.min.x - wx, 0, wx - b.max.x), d = Math.hypot(dx, dz);
            const a = k * (d <= 0 ? 1 : Math.min(1, .45 * Math.exp(-d / rC) + .6 * Math.exp(-d / rW))); if (a > .004) A[j * W + i] = 1 - (1 - A[j * W + i]) * (1 - a); } } }
      dbg.push([+sf.min.x.toFixed(2), +sf.min.z.toFixed(2), +sf.max.x.toFixed(2), +sf.max.z.toFixed(2), +y.toFixed(3), hit]); if (!hit) continue;
      const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), im = x.createImageData(W, H);
      for (let q = 0; q < W * H; q++) { im.data[q * 4] = 20; im.data[q * 4 + 1] = 14; im.data[q * 4 + 2] = 8; im.data[q * 4 + 3] = Math.min(255, A[q] * 255); }   // row 0 = low z, as the floor bake
      x.putImageData(im, 0, 0); const m = SM.clone(); m.map = new CT(c); m.map.colorSpace = THREE.SRGBColorSpace;
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(sf.max.x - sf.min.x, sf.max.z - sf.min.z), m); pl.rotation.x = -Math.PI / 2; pl.position.set((sf.min.x + sf.max.x) / 2, y + .002, (sf.min.z + sf.max.z) / 2); pl.renderOrder = 1; P.add(pl); } }
  // --- 10c. 30 Oct 02:xx (29 Oct 03:xx review, wsboard: "no contact shadow where the front bench meets the wall"): the corner where the front bench's
  //     top meets the OSB gets a baked shadow on both faces: a tight dark core at the joint (≈ 1 cm) and a soft fade (≈ 7 cm on the wall, 4.5 cm on the
  //     top), a little uneven along its length (sines, no RNG, so nothing else moves), faded out over the last 6 cm at each end. Two transparent sheets.
  // 30 Oct 03:xx (02:xx backlog: "the long aisle bench, the far-wall tool bench and the left vice bench still meet their walls with a bare light joint"):
  //     the same two sheets as a helper, run on every bench that stands against a wall. Each call builds in a frame where the wall is along local x at
  //     local z 0 and the room is local −z (the front bench's own frame), then turns it onto its wall. `cut(u, y)` masks out wall that isn't there
  //     (the aisle wall's window opening). The front bench call gives the same sheets as before (u = world x).
  { const HW = .24, DT = .14;
    const sheet = (U0, U1, W, H, f, cut) => { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), im = x.createImageData(W, H);
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const q = (j * W + i) * 4, u = i / (W - 1), wx = U0 + u * (U1 - U0), end = Math.min(1, (wx - U0) / .06, (U1 - wx) / .06);
        const wob = 1 + .14 * Math.sin(wx * 7.3) * Math.sin(wx * 2.1 + 1) + .06 * Math.sin(wx * 31);
        im.data[q] = 20; im.data[q + 1] = 14; im.data[q + 2] = 8; im.data[q + 3] = Math.min(255, Math.max(0, end) * wob * f(j / (H - 1)) * (cut ? cut(wx, j / (H - 1)) : 1) * 255); }
      x.putImageData(im, 0, 0); const t = new CT(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }); };
    const benchJoint = (px, pz, ry, U0, U1, YT, cut) => { const j = grp(P, px, 0, pz, ry), W = Math.max(64, Math.round((U1 - U0) * 80));
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(U1 - U0, HW), sheet(U0, U1, W, 96, v => { const d = (1 - v) * HW; return .62 * Math.exp(-d / .011) + .42 * Math.exp(-d / .07); }, cut && ((u, v) => cut(u, YT + HW * (1 - v)))));   // canvas row 0 = the top
      wall.rotation.y = Math.PI; wall.position.set((U0 + U1) / 2, YT + HW / 2, -.0008); wall.renderOrder = 1; j.add(wall);
      const top = new THREE.Mesh(new THREE.PlaneGeometry(U1 - U0, DT), sheet(U0, U1, W, 64, v => { const d = (1 - v) * DT; return .55 * Math.exp(-d / .009) + .34 * Math.exp(-d / .045); }));   // row 0 = into the room
      top.rotation.x = -Math.PI / 2; top.position.set((U0 + U1) / 2, YT + .0025, -DT / 2); top.renderOrder = 1; j.add(top); };
    benchJoint(0, -2.4772, 0, .5, 5.9, 1.0);   // front bench (x 0.5–5.9) on the front lining; u = world x
    benchJoint(5.9592, 0, Math.PI / 2, 2.82, 12.38, .95, (u, y) => u > 2.86 && u < 5.34 && y > 1.12 ? 0 : 1);   // long aisle bench (z −2.82…−12.38) on the aisle lining (x 5.96); u = −z; no sheet in the window opening above the 1.13 m sill
    benchJoint(.4508, 0, -Math.PI / 2, -5.68, -3.12, .95);   // left vice bench (z −3.12…−5.68) on the left lining (x 0.45); u = z
    benchJoint(0, -12.8972, Math.PI, -4.68, -1.82, .95); }   // far-wall tool bench (x 1.82–4.68) on the far wall's lining (z −12.898); u = −x
  // --- W5 (22 Oct): sawdust heaped under the mitre-saw bench and the vice, and swept against the wall foot (own RNG)
  { const SD = STD({ color: 0xd2b07a, roughness: 1 }), heap = (x, z, r, h) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), SD); m.scale.set(r * qf(.8, 1.2), h, r * qf(.8, 1.2)); m.position.set(x, 0, z); m.rotation.y = qf(0, 6); m.receiveShadow = true; P.add(m); };
    for (let i = 0; i < 7; i++) heap(3.1 + qf(-.5, .5), -6.75 + qf(-.25, .25), qf(.08, .22), qf(.012, .035));   // under the mitre saw
    for (let i = 0; i < 4; i++) heap(.95 + qf(-.2, .3), -3.55 + qf(-.3, .3), qf(.06, .15), qf(.01, .025));     // under the vice
    for (let i = 0; i < 6; i++) heap(qf(.6, .75), qf(-6, -10.5), qf(.1, .25), qf(.01, .03)); }                 // swept up against the left wall
  // --- 23 Oct 23:xx: use-wear on the small kit (tools, cases, clamps, cabinet, compressor, vice...). The 07:xx review: "tools read as clean plastic".
  // Every mapless small mesh (< .75 m) in the workshop gets a worn clone of its material, picked by what it is: paint/plastic (edge chips, rub-through,
  // grime round where hands go, fine scratches), rubber (diamond-knurl grip bump, dust in the grooves), steel (oily smudges, brushed lines, rust specks),
  // wood (grain along the length, darker where held). Big things (benches, lining) are untouched; own RNG so nothing else moves.
  { let su = 5113; const ur = () => (su = (su * 16807) % 2147483647) / 2147483647, uf = (a, b) => a + (b - a) * ur();
    const cv = (draw, srgb) => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); draw(x, 256, 256); const t = new CT(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; };
    const blot = (x, cx, cy, r, rgba) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, rgba); g.addColorStop(1, rgba.replace(/[\d.]+\)$/, '0)')); x.fillStyle = g; x.fillRect(cx - r, cy - r, 2 * r, 2 * r); };
    const edges = (x, w, h, col, a, d) => { for (const [x0, y0, x1, y1, rx, ry, rw, rh, k] of [[0, 0, 0, d, 0, 0, w, d, 1], [0, h, 0, h - d, 0, h - d, w, d, 1], [0, 0, d, 0, 0, 0, d, h, .45], [w, 0, w - d, 0, w - d, 0, d, h, .45]]) { const g = x.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, `rgba(${col},${a * k})`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.fillRect(rx, ry, rw, rh); } };   // face edges = the part's real edges (box faces, cylinder ends); the u seam weaker
    const chips = (x, w, h, n, col, edgeOnly, aM = 1) => { for (let i = 0; i < n; i++) { const e = ur() < .7 || edgeOnly; const px = e && ur() < .5 ? (ur() < .5 ? uf(0, 10) : w - uf(0, 10)) : uf(0, w), py = e ? (ur() < .5 ? uf(0, 14) : h - uf(0, 14)) : uf(0, h);
      x.fillStyle = `rgba(${col},${uf(.45, .9) * aM})`; x.beginPath(); x.moveTo(px, py); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28 + uf(-.4, .4), r = uf(1.5, 7); x.lineTo(px + Math.cos(a) * r, py + Math.sin(a) * r * uf(.5, 1)); } x.fill(); } };
    const scratches = (x, w, h, n, col, len) => { for (let i = 0; i < n; i++) { x.strokeStyle = `rgba(${col},${uf(.15, .5)})`; x.lineWidth = uf(.5, 1.4); x.beginPath(); const a = uf(0, w), b = uf(0, h), t = uf(0, 6.28), L = uf(len * .3, len); x.moveTo(a, b); x.quadraticCurveTo(a + Math.cos(t) * L * .5 + uf(-4, 4), b + Math.sin(t) * L * .5 + uf(-4, 4), a + Math.cos(t) * L, b + Math.sin(t) * L); x.stroke(); } };
    const K = {};
    K.paint = { map: cv((x, w, h) => { x.fillStyle = '#efefef'; x.fillRect(0, 0, w, h);
        for (let i = 0; i < 26; i++) blot(x, uf(0, w), uf(0, h), uf(12, 50), `rgba(70,58,44,${uf(.05, .14)})`);   // handling grime
        edges(x, w, h, '55,45,36', .24, 18); chips(x, w, h, 60, '120,112,102'); chips(x, w, h, 18, '60,52,44', true);   // dirty, rubbed edges; chips (dull primer, dark dirt)
        scratches(x, w, h, 60, '255,255,255', 40); scratches(x, w, h, 30, '60,50,40', 30);
        for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(${ur() > .4 ? '120,105,85' : '255,255,255'},${uf(.03, .14)})`; x.fillRect(uf(0, w), uf(0, h), uf(.6, 1.8), uf(.6, 1.8)); } }, true),
      rough: cv((x, w, h) => { x.fillStyle = '#c8c8c8'; x.fillRect(0, 0, w, h); for (let i = 0; i < 20; i++) blot(x, uf(0, w), uf(0, h), uf(15, 45), `rgba(255,255,255,${uf(.2, .5)})`);   // dull grime patches
        edges(x, w, h, '255,255,255', .45, 16); scratches(x, w, h, 60, '80,80,80', 40); chips(x, w, h, 60, '60,60,60'); }), bump: .6 };
    K.rubber = { map: cv((x, w, h) => { x.fillStyle = '#dcdcdc'; x.fillRect(0, 0, w, h); const n = 14, s = w / n;
        for (let i = 0; i <= n; i++) for (let j = 0; j <= n * 2; j++) { x.fillStyle = `rgba(255,250,240,${uf(.08, .22)})`; x.fillRect(i * s - 1, j * s / 2 - 1, 2.5, 2.5); }   // dust caught in the grooves
        for (let i = 0; i < 18; i++) blot(x, uf(0, w), uf(0, h), uf(10, 40), `rgba(${ur() < .5 ? '255,248,235' : '30,26,22'},${uf(.06, .16)})`); edges(x, w, h, '255,248,236', .22, 14); }, true),
      rough: cv((x, w, h) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); const n = 14, s = w / n; x.strokeStyle = 'rgba(40,40,40,.85)'; x.lineWidth = 2.2;   // diamond knurl: two sets of diagonals
        for (let i = -n; i <= 2 * n; i++) { x.beginPath(); x.moveTo(i * s, 0); x.lineTo(i * s + h, h); x.stroke(); x.beginPath(); x.moveTo(i * s, 0); x.lineTo(i * s - h, h); x.stroke(); }
        for (let i = 0; i < 10; i++) blot(x, uf(0, w), uf(0, h), uf(10, 30), `rgba(150,150,150,${uf(.2, .4)})`); }), bump: 1.4 };   // worn-smooth patches
    K.steel = { map: cv((x, w, h) => { x.fillStyle = '#f2f2f2'; x.fillRect(0, 0, w, h); for (let i = 0; i < 140; i++) { x.fillStyle = `rgba(${ur() < .5 ? '255,255,255' : '110,110,112'},${uf(.03, .08)})`; x.fillRect(0, uf(0, h), w, uf(.5, 2)); }   // brushed lines
        for (let i = 0; i < 16; i++) blot(x, uf(0, w), uf(0, h), uf(10, 40), `rgba(38,34,30,${uf(.1, .28)})`);   // oily thumb smudges
        for (let i = 0; i < 40; i++) blot(x, uf(0, w), uf(0, h), uf(1.5, 5), `rgba(130,62,28,${uf(.25, .6)})`); edges(x, w, h, '40,34,28', .3, 12); }, true),   // rust specks, dirty edges
      rough: cv((x, w, h) => { x.fillStyle = '#d0d0d0'; x.fillRect(0, 0, w, h); for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(${ur() < .5 ? '255,255,255' : '120,120,120'},${uf(.04, .14)})`; x.fillRect(0, uf(0, h), w, uf(.5, 2)); }
        for (let i = 0; i < 16; i++) blot(x, uf(0, w), uf(0, h), uf(10, 40), `rgba(255,255,255,${uf(.3, .6)})`); }), bump: .3 };
    K.wood = { map: cv((x, w, h) => { x.fillStyle = '#f0f0f0'; x.fillRect(0, 0, w, h); for (let i = 0; i < 70; i++) { x.strokeStyle = `rgba(80,48,22,${uf(.08, .25)})`; x.lineWidth = uf(.6, 2.2); x.beginPath(); let a = uf(0, w); x.moveTo(a, 0); for (let k = 1; k <= 8; k++) x.lineTo(a += uf(-2, 2), k * h / 8); x.stroke(); }   // grain along the length (v)
        const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(50,32,18,.0)'); g.addColorStop(.35, 'rgba(50,32,18,.28)'); g.addColorStop(.65, 'rgba(50,32,18,.28)'); g.addColorStop(1, 'rgba(50,32,18,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h);   // darker where it's held
        chips(x, w, h, 20, '60,38,20', true); }, true),
      rough: cv((x, w, h) => { x.fillStyle = '#e0e0e0'; x.fillRect(0, 0, w, h); for (let i = 0; i < 70; i++) { x.strokeStyle = `rgba(110,110,110,${uf(.2, .5)})`; x.lineWidth = uf(.6, 2); x.beginPath(); let a = uf(0, w); x.moveTo(a, 0); for (let k = 1; k <= 8; k++) x.lineTo(a += uf(-2, 2), k * h / 8); x.stroke(); }
        const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(.3, 'rgba(120,120,120,0)'); g.addColorStop(.5, 'rgba(120,120,120,.5)'); g.addColorStop(.7, 'rgba(120,120,120,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }), bump: .5 };   // polished where held
    K.paintL = { map: cv((x, w, h) => { x.fillStyle = '#f2f2f2'; x.fillRect(0, 0, w, h);   // 24 Oct 04:xx: light paint (grey cabinet, pulls, white kit): the dark chips read as black flecks on it, so worn-through chips go mid-grey and faint, edge grime lighter
        for (let i = 0; i < 22; i++) blot(x, uf(0, w), uf(0, h), uf(12, 50), `rgba(70,58,44,${uf(.04, .1)})`);
        edges(x, w, h, '70,60,50', .14, 16); chips(x, w, h, 50, '150,146,140', false, .7); chips(x, w, h, 14, '95,88,80', true, .35);
        scratches(x, w, h, 50, '255,255,255', 40); scratches(x, w, h, 20, '90,80,70', 24);
        for (let i = 0; i < 2000; i++) { x.fillStyle = `rgba(${ur() > .4 ? '120,105,85' : '255,255,255'},${uf(.03, .1)})`; x.fillRect(uf(0, w), uf(0, h), uf(.6, 1.8), uf(.6, 1.8)); } }, true),
      rough: K.paint.rough, bump: .45 };
    const kind = m => { if (m.metalness >= .5) return 'steel'; const hsl = {}; m.color.getHSL(hsl, THREE.SRGBColorSpace);   // sRGB hue: in linear, yellow paint (45°) reads as wood (32°)
      if (hsl.l < .2 && m.roughness >= .7) return 'rubber'; if (hsl.h > .07 && hsl.h < .11 && hsl.s > .25 && hsl.l > .2 && hsl.l < .45 && m.roughness < .75) return 'wood'; return hsl.l > .45 && hsl.s < .25 ? 'paintL' : 'paint'; };   // light greys and whites only: yellow or red tools keep their dark chips
    const uvDone = new Set(), uvFix = g => { if (uvDone.has(g)) return; uvDone.add(g); if (!/Extrude|Shape/.test(g.type) || !g.attributes.uv) return; const u = g.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i) * 6, u.getY(i) * 6); u.needsUpdate = true; };   // extrude/shape UVs are in metres: one tile per ~17 cm, or a 3 cm chip blows up to fill a saw hood
    const worn = new Map(), bb = new THREE.Box3(), sz = new THREE.Vector3(); let nw = 0; P.updateMatrixWorld(true);
    for (let i = n0; i < P.children.length; i++) P.children[i].traverse(o => { const m = o.material; if (!o.isMesh || !m || !m.isMeshStandardMaterial || Array.isArray(m) || m.map || m.transparent || m.roughness >= .95 || (m.emissive && m.emissive.getHex())) return;
      bb.setFromObject(o).getSize(sz); if (Math.max(sz.x, sz.y, sz.z) > .75) return;
      let c = worn.get(m); if (!c) { const k = K[kind(m)]; c = m.clone(); c.map = k.map; c.roughnessMap = k.rough; c.bumpMap = k.rough; c.bumpScale = k.bump; c.needsUpdate = true; worn.set(m, c); }
      uvFix(o.geometry); o.material = c; nw++; });
    console.log('wear: ' + nw + ' small parts, ' + worn.size + ' materials'); }
}

// ---------------- bake: merge each item's static meshes by material (far fewer draw calls) ----------------
function bake(root) {
  const merge = THREE_ADDONS.mergeGeometries; let before = 0, after = 0;
  for (const item of INFO) { if (item.userData.noPick) continue; const buckets = new Map(), kill = []; item.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(item.matrixWorld).invert();
    item.traverse(o => { if (o === item) return; if (o.userData.keep || o.userData.lift || o.userData.info) { o.traverse(c => { c.userData._skip = true; }); return; } });
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
