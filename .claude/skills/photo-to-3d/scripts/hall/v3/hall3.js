// ===== Main hall v3: one clean model, everything in its place (metres) =====
// Frame: the roller door is at z = 0 and the hall runs to z = -39. x runs 0 (left wall as you walk in) to 20 (right wall). y up.
// Front of every stack faces the aisle. Built from Josh's 60 photos and 2 walk-round videos; sizes from crates (1.2 × 1.0 m), stillages (2.32 × 1.35 m) and the forklift (2.16 m guard).
const HW = 20, HL = 39, EAVE = 6.0, RIDGE = 7.7, BAY = 6.5, DOOR = { x0: 6.85, x1: 12.35, h: 5.5 };
const LEFT = Math.PI / 2, RIGHT = -Math.PI / 2, FAR = 0;   // ry that turns a stack's front to face the aisle from the left wall / right wall / far wall
const ZONES = [];                                          // { name, items: [groups] } for the zone buttons
let ZONE = null; const zone = name => { ZONE = { name, items: [] }; ZONES.push(ZONE); };
const T = (obj, name, what, size, sure = 'sure') => { tag(obj, name, what, size, [], sure); if (ZONE) ZONE.items.push(obj); return obj; };

// ---------------- materials ----------------
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
  film: new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .13, roughness: .1, side: THREE.DoubleSide, depthWrite: false }),
};
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
  const d0 = HW - DOOR.x1, d1 = HW - DOOR.x0;
  panel(g, [[0, d0, flat(0), gab], [d0, d1, flat(DOOR.h), gab], [d1, HW, flat(0), gab]], HW, RIDGE, gab, { p: [HW, 0, 0], ry: Math.PI });
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
    if (lv.film !== false) { const f = new THREE.Mesh(new THREE.BoxGeometry(2.36, top + .04, 1.41), MX.film); f.position.y = (top + .04) / 2; f.userData.keep = true; s.add(f); }
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

// ---------------- the layout ----------------
function layout() {
  const P = scene;
  // ===== door end, left: workshop under the mezzanine, racking with the mezzanine store over it, IBCs =====
  zone('Door end · left');
  { const g = grp(P, 0, 0, -2.3); const MW = 6.0, ML = 10.6;   // LiDAR (15 Oct): left as you walk in, 6.1 m deep off the left wall × 10.6 m long, front 2.45 m in from the door wall (Josh guessed 8 × 4)
    box(g, MW, .22, ML, MX.steel, MW / 2, 3.0, -ML / 2 - .1); for (const [x, z] of [[.3, -.3], [MW - .1, -.3], [MW - .1, -ML / 2], [MW - .1, -ML], [.3, -ML]]) box(g, .14, 3.0, .14, MX.steel, x, 0, z);
    box(g, MW, 3.0, .05, MX.osb, MW / 2, 0, -.15); box(g, .05, 3.0, ML - .2, MX.osb, MW, 0, -ML / 2 - .1);   // workshop walls
    box(g, .04, .9, 1.6, STD({ color: 0x8aa0ad, metalness: .4, roughness: .1 }), MW + .04, 1.2, -1.1); box(g, .04, .9, 1.6, STD({ color: 0x8aa0ad, metalness: .4, roughness: .1 }), MW + .04, 1.2, -9.5);   // windows clear of the yellow racking (scan: racking z -5.25…-10.85)
    box(g, .06, 2.0, .9, MX.osb, MW + .04, 0, -2.4);   // door near the front, where the scan shows the way in                                                         // door
    box(g, MW, 2.4, .05, MX.osb, MW / 2, 3.22, -.15); box(g, .05, .62, ML - .2, MX.osb, MW, 3.22, -ML / 2 - .1); box(g, .05, .5, ML - .2, MX.osb, MW, 5.12, -ML / 2 - .1);   // sewing room walls, open in the middle so you can see in
    for (const [dy, h] of [[3.84, .06], [5.1, .06]]) box(g, .1, h, 2.7, MX.timber, MW + .03, dy, -4.0); for (const dz of [-5.32, -2.68]) box(g, .1, 1.3, .06, MX.timber, MW + .03, 3.84, dz);   // open front onto the aisle
    // the sewing room up top (Josh): long cutting tables, industrial machines, rolls of canvas, strip lights
    { const sw = grp(g, 0, 3.22, 0), TOP = STD({ color: 0xe9e6dc, roughness: .6 }), LEG = STD({ color: 0x5b5f63, metalness: .5, roughness: .4 });
      for (const [x, z, L] of [[1.3, -2.4, 3.2], [1.3, -6.0, 2.4]]) { box(sw, 1.2, .04, L, TOP, x, .86, z); for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(sw, .05, .86, .05, LEG, x + sx * .55, 0, z + sz * (L / 2 - .1)); }
      for (let i = 0; i < 2; i++) { const t = new THREE.Mesh(new THREE.BoxGeometry(1.2, .02, 2.2), STD({ color: [0xcbb998, 0x3f5a46][i], roughness: .95 })); t.position.set(1.3, .91 + i * .02, -2.4 + i * .3); t.rotation.y = (rnd() - .5) * .1; t.castShadow = true; sw.add(t); }   // canvas laid out on the cutting table
      for (const z of [-4.4, -5.0]) { box(sw, .55, .74, 1.1, STD({ color: 0x3c3f44, roughness: .5 }), 3.1, 0, z); box(sw, .55, .04, 1.1, TOP, 3.1, .74, z);
        const mc = grp(sw, 3.1, .78, z); box(mc, .18, .1, .45, STD({ color: 0x2b4a7a, roughness: .35, metalness: .2 }), 0, 0, 0); box(mc, .12, .26, .1, STD({ color: 0x2b4a7a, roughness: .35, metalness: .2 }), 0, .1, -.17); box(mc, .12, .1, .4, STD({ color: 0x2b4a7a, roughness: .35, metalness: .2 }), 0, .32, -.02); cyl(mc, .008, .14, M.steel, 0, .22, .17); }
      for (let i = 0; i < 6; i++) { const c = cyl(sw, .12, 1.5, STD({ color: [0xd8cdb4, 0x3f5a46, 0xcbb998, 0xece8df][i % 4], roughness: .95 }), .45, .12 + Math.floor(i / 3) * .24, -6.6 - (i % 3) * .26, 'x', 16); }   // canvas rolls
      for (let i = 0; i < 3; i++) bag(sw, 2.9, 0, -6.8 - i * .45, .45, .34, .55, '#3e5240', '#9cff3a');
      for (const z of [-2, -4, -6]) { box(sw, .12, .04, 1.4, STD({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: .8 }), 1.6, 2.3, z); } }
    for (let i = 0; i < 3; i++) box(g, 1.1, .2, .9, MX.ply, 1.2, 3.22 + i * .21, -6.4);
    T(g, 'Workshop + sewing room', 'Measured from Josh\'s LiDAR scan (15 Oct): about 6.1 × 10.6 m. On the left as you walk in: a boxed-in workshop under a steel mezzanine (OSB walls, windows and a door onto the aisle, bench and tool wall inside). Up on the mezzanine is the sewing room: long cutting tables with canvas laid out, industrial sewing machines, rolls of canvas and a few bags waiting for repair.', '≈ 8 × 4 m (Josh) · deck ≈ 3 m up', 'sure'); }
  { const r = racking(P, 6.65, -5.25, LEFT, 2, [.15, 1.35, 2.55, 3.75], 2.8, 1.1, MX.yellow, rackFill);   // LiDAR: against the workshop wall, front at x 7.2
    const lad = grp(P, 7.5, 0, -11.2); lad.rotation.z = -.1; for (const s of [-1, 1]) box(lad, .08, 4.4, .05, MX.yellow, 0, 0, s * .22); for (let i = 0; i < 13; i++) box(lad, .05, .04, .44, MX.alu, 0, .3 + i * .32, 0);
    T(r, 'Yellow racking: flight cases + tubs', 'Pallet racking with yellow beams on the outside of the workshop wall, facing the aisle (placed from the LiDAR scan): ply flight cases with latches, clear storage tubs, boxes and blue crates; a yellow fibreglass ladder at the end.', '2 bays × 2.8 m (scan) · beams at 1.35 / 2.55 / 3.75 m', 'fairly sure'); }
  { const g = grp(P, 6.75, 0, -14.2, LEFT);   // LiDAR let y = 0; for (let i = 0; i < 3; i++) { pallet(g, 1.2, 1.0, y); box(g, 1.1, .95, .95, STD({ color: 0xe8e6dc, roughness: .35, transparent: true, opacity: .9 }), 0, y + .15, 0); const cage = new THREE.Mesh(new THREE.BoxGeometry(1.16, .98, 1.0, 6, 5, 5), new THREE.MeshStandardMaterial({ color: 0x9a9fa3, wireframe: true, metalness: .6 })); cage.position.y = y + .64; g.add(cage); y += 1.16; }
    T(g, 'IBC water tanks', 'Caged 1,000 litre IBC tanks, three high, just past the yellow racking.', '1.2 × 1.0 × 1.15 m each'); }
  // ===== door end, right: orange racking, black crate tower, trellis leaning, low floor-panel stack =====
  zone('Door end · right');
  { const r = racking(P, 18.95, -14.2, RIGHT, 5, [.15, 1.55, 3.03], 2.77, 1.1, MX.orange, rackFill);   // LiDAR: uprights at z -14.2, -11.43, -8.63, -5.9, -3.13, -0.35
    T(r, 'Orange racking (yard bay)', 'Pallet racking with orange beams down the right wall from the door: the yard bay. Bays and beam heights measured from Josh\'s LiDAR scan (15 Oct).', '5 bays × 2.77 m · beams 1.55 / 3.03 m · front 1.55 m off the wall'); }
  { const r = racking(P, 18.1, -1.2, Math.PI, 1, [.15, 2.15, 3.05], 2.9, 1.1, MX.orange, rackFill);   // LiDAR: one bay along the door wall, x 15.2–18.1
    T(r, 'Orange racking (door wall)', 'One bay of orange racking along the door wall, in the corner with the right-wall run (from the LiDAR scan).', '1 bay × 2.9 m · beams 2.15 / 3.05 m', 'fairly sure'); }
  { const r = racking(P, 13.6, -15.4, FAR, 2, [.15, 1.35, 3.0], 2.45, 1.1, MX.yellow, rackFill);   // LiDAR: across the hall at the back of the yard bay, x 13.6–18.5, front at z -14.85
    T(r, 'Yellow racking (back of the yard bay)', 'A short run of yellow-beam racking across the hall at the back of the yard bay, facing the door (from the LiDAR scan).', '2 bays × ≈2.45 m · beams ≈1.35 / 3.0 m', 'fairly sure'); }
  { const g = plainStack(P, coverMats('bedx', '#1c1d20', '#e9e9e6', null, { window: false }), 7.6, -1.8, RIGHT, [[0, 3]], 1.2, 1.1, 1.0); g.scale.setScalar(1);
    const film = new THREE.Mesh(new THREE.BoxGeometry(1.3, 3.95, 1.1), MX.film); film.position.y = 1.97; film.userData.keep = true; g.add(film);
    T(g, 'Black crate tower', 'Three black Green Yurts crates stacked and cling-filmed together beside the door (the LiDAR scan shows a tall pile left of the roller door, x 4.9–8.2; black kit barely shows on LiDAR), with a flight case on wheels and a stack of trays next to it.', '≈ 3.9 m tall', 'not sure'); }
  { const g = grp(P, 14.6, 0, -1.6, -.3); for (let i = 0; i < 6; i++) { const s = trellisSection({ seed: 700 + i, weathered: .4 }); s.setOpen(s.minOpen); const h = grp(g, 0, 0, i * .1); h.rotation.x = -.3; h.add(s); s.position.set(-s.userData.cx, s.userData.end0, 0); }
    T(g, 'Trellis stood on end', 'Folded trellis sections stood up and leaning, next to the doorway.', '≈ 2.5 m tall'); }
  { const g = grp(P, 14.0, 0, -3.45, .05); for (let i = 0; i < 9; i++) { box(g, 1.95, .04, 1.1, STD({ map: grain(['#5a3a26', '#6a4430', '#4e3322'][i % 3], '30,20,10') }), (rnd() - .5) * .08, i * .048, 0); box(g, 1.8, .01, .06, M.pallet, 0, i * .048 + .04, .4); }
    T(g, 'Floor panels (low stack)', 'A short stack of dark hardwood-faced yurt floor panels by the aisle.', '≈ 2.0 × 1.1 m'); }
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
  { const g = poleStillage(P, .75, -18.6, LEFT, [.5, .5, .5, .5, .5, .5, .5, .5, .5], Array(9).fill('r14'), M.blue, 1.15, 2.2); T(g, 'Pole stillages (blue): 14 ft', 'Blue pole stillages stacked nine high (about 4.5 m): the 14 ft yurt roof poles, strapped in bundles.', 'poles ≈ 2.0 m (worked out from the yurt size) · 0.5 m a level'); }
  { const g = grp(P, .8, 0, -21.6, LEFT); const cv = canvasStack(g, 14, 0, 0, 0, [[0, 1, ['13–17']]]); const cage = grp(g, 0, .84, 0); poleLevel(cage, 0, .76, M.red, 1.2, 1.0, true); lump(cage, 0, .08, 0, 1.0, .55, .85, MX.white);
    const up = canvasStack(g, 14, -.15, -.45, 0, [[0, 3, ['28–32', '18–22', '8–12']]]); up.position.y = 1.6;
    T(g, '14 ft canvas crates', 'Red covers marked "14ft CANVAS" with number ranges (13–17, 28–32, 18–22, 8–12…): 14 ft yurt canvases, five to a crate, numbered so a set goes out together; a red mesh cage of bulk bags between them.', '≈ 1.2 × 1.0 × 0.84 m each'); }
  { const g = trellisStillages(P, 3.4, -21.9, LEFT + .03, [{ sets: 5, per: 3, doors: 1 }, { sets: 5, per: 3, doors: 1 }, { sets: 5, per: 3, doors: 1 }]);   // Josh: 5 doors per stillage, 3 trellis each
    T(g, '14 ft trellis + door stillages', 'Purple stillages three high next to the 14 ft canvas. A 14 ft yurt is 3 trellis sections per door, and each stillage holds 5 doors with their trellis: 15 sections, the folded trellis laid two side by side with each door flat on its set, cling-filmed.', 'stillages 2.32 × 1.35 m · 5 yurts each · ≈ 3.1 m tall'); }
  { const g = poleStillage(P, .75, -25.4, LEFT, [.5, .5, .5, .5, .5, .5], ['r16', 'r16', 'r16', 'r12', 'r12', 'r12'], M.red, 1.15, 2.4); T(g, 'Pole stillages (red): 16 ft + 12 ft', 'Red pole stillages six high along the left wall: the 16 ft and 12 ft yurt roof poles, strapped in bundles.', 'poles ≈ 2.3 m (16 ft) and 1.7 m (12 ft), worked out from the yurt sizes'); }
  { const g = crownStack(P, K12, 7.2, -15.6, Math.PI, [[0, 1], [1, 1]]); const top = crownCrate(g, K12, .66, 1.24, 0); top.userData.level = 1; CRATES.push(top);   // 3 here + 1 by the door = 4 counted (photo 11)
    const byDoor = crownStack(P, K12, 6.3, -2.6, Math.PI / 2, [[0, 1]]); T(byDoor, '12 ft crown crate (by the door)', 'A single "12FT CROWN × 12" crate near the roller door.', '1.2 × 1.0 × 1.24 m');
    T(g, '12 ft crown crates', 'Green covers "12FT CROWN × 12": twelve 12 ft yurt crowns per crate, out in the middle of the hall.', '1.2 × 1.0 × 1.24 m each'); }
  { const g = plainStack(P, coverMats('white', '#efeee9', '#161616', null, { window: false }), 4.4, -15.6, Math.PI, [[0, 2], [1, 2]], 1.2, 1.04, 1.0); T(g, 'Safari tent crates', 'White covers with the black Green Yurts badge, two high: the safari tents (Josh).', '≈ 1.2 × 1.0 × 1.2 m each'); }
  { const g = grp(P, 9.4, 0, -14.3); pallet(g, 2.2, 1.15); box(g, 2.2, 1.05, 1.15, [MX.ply, MX.ply, MX.ply, MX.ply, STD({ map: tex(512, 256, (x, w, h) => { x.drawImage(MX.ply.map.image, 0, 0, w, h); drawBadge(x, w / 2, h / 2, 100, 'rgba(30,25,20,.8)', 'rgba(0,0,0,0)'); }) }), MX.ply], 0, .144, 0); bag(g, .3, 1.2, 0, 1.0, .18, .4, '#3fae86');
    T(g, 'Plywood crate (GY badge)', 'Big ply crate with clips and the Green Yurts badge burnt on, a rolled green canvas on top. Moved out of the workshop footprint the LiDAR scan measured; spot not scanned.', '≈ 2.2 × 1.15 × 1.2 m', 'not sure'); }
  { const g = grp(P, 8.4, 0, -12.2); for (let i = 0; i < 14; i++) box(g, 1.25, .06, .85, STD({ map: tex(128, 128, (x, w, h) => { x.fillStyle = '#d9dbd9'; x.fillRect(0, 0, w, h); x.strokeStyle = '#4b4f52'; x.lineWidth = 3; for (let k = -w; k < w * 2; k += 18) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + h, h); x.moveTo(k + h, 0); x.lineTo(k, h); x.stroke(); } }) }), (rnd() - .5) * .05, .144 + i * .06, 0); pallet(g, 1.2, 1.0);
    T(g, 'Rugs (folded, strapped)', 'Grey and white diamond-pattern yurt floor rugs folded flat on a pallet. Moved out of the workshop footprint the LiDAR scan measured; spot not scanned.', '≈ 1.25 × 0.85 m', 'not sure'); }
  { const g = grp(P, 7.3, 0, -19.8, .1); for (const s of [0, 1]) for (let i = 0; i < 20; i++) { box(g, 1.95 - rnd() * .2, .035, 1.15 - rnd() * .15, STD({ map: grain(['#5a3a26', '#6a4430', '#4e3322'][i % 3], '30,20,10') }), s * 1.3 - .65 + (rnd() - .5) * .08, i * .048, (rnd() - .5) * .08); }
    T(g, 'Floor panels', 'Yurt floor sections: dark hardwood-faced panels with battens underneath, about twenty high, strapped.', '≈ 2.0 × 1.2 m'); }
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
