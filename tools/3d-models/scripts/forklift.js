// Green Yurts' forklift: Daewoo / Doosan G15S, LPG counterbalance, 1.5 t. Built from Josh's photos (14 Oct 2026).
// Metres, Y up, forks pointing −Z, rear face at z ≈ +0.12, centred on x. Spec: 1.07 m wide, guard top 2.16 m, 2.16 m rear to fork face.
import * as THREE from 'three';

export function buildForklift({ worn = true } = {}) {
  const root = new THREE.Group(); root.name = 'Doosan G15S';
  const parts = {}; // name -> group, for labels
  const part = (name, desc) => { const g = new THREE.Group(); g.name = name; g.userData.part = { name, desc }; root.add(g); parts[name] = g; return g; };
  const tex = (w, h, draw, rep) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); } return t; };
  const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(11);
  // ---- materials ----
  const paint = tex(512, 512, (x, w, h) => { x.fillStyle = '#d6a51e'; x.fillRect(0, 0, w, h);
    if (worn) { for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${rnd() < .5 ? '60,45,20' : '235,225,190'},${rnd() * .18})`; x.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 10, 1 + rnd() * 3); }
      for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(${rnd() < .6 ? '35,30,25' : '225,220,205'},${.35 + rnd() * .4})`; x.beginPath(); x.ellipse(rnd() * w, rnd() * h, 4 + rnd() * 26, 2 + rnd() * 10, rnd() * 3, 0, 7); x.fill(); }
      const g = x.createLinearGradient(0, h * .6, 0, h); g.addColorStop(0, 'rgba(60,45,25,0)'); g.addColorStop(1, 'rgba(60,45,25,.45)'); x.fillStyle = g; x.fillRect(0, 0, w, h); } });
  const M = {
    yellow: new THREE.MeshStandardMaterial({ map: paint, roughness: .62, metalness: .1 }),
    black: new THREE.MeshStandardMaterial({ color: 0x17191c, roughness: .55, metalness: .35 }),
    satin: new THREE.MeshStandardMaterial({ color: 0x24272b, roughness: .45, metalness: .5 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x9aa1a8, roughness: .35, metalness: .85 }),
    chain: new THREE.MeshStandardMaterial({ color: 0x3a3d40, roughness: .5, metalness: .8 }),
    tyre: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: .9 }),
    rim: new THREE.MeshStandardMaterial({ color: 0x3c3f42, roughness: .5, metalness: .5 }),
    hub: new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: .5, metalness: .4 }),
    grille: new THREE.MeshStandardMaterial({ color: 0x0b0c0d, roughness: .9 }),
    seat: new THREE.MeshStandardMaterial({ color: 0x121314, roughness: .75 }),
    amber: new THREE.MeshStandardMaterial({ color: 0xff9a1a, roughness: .25, emissive: 0xff7a00, emissiveIntensity: .45, transparent: true, opacity: .9 }),
    glass: new THREE.MeshStandardMaterial({ color: 0xcfd8e0, roughness: .05, metalness: .95 }),
    wire: new THREE.MeshStandardMaterial({ color: 0xc41e1e, roughness: .5 }),
    strapY: new THREE.MeshStandardMaterial({ color: 0xd9b23a, roughness: .55 }),
  };
  const box = (p, w, h, d, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = o.receiveShadow = true; p.add(o); return o; };
  const cyl = (p, r1, r2, h, m, x, y, z, rx = 0, rz = 0, seg = 20) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); o.castShadow = o.receiveShadow = true; p.add(o); return o; };
  const decal = (p, t, w, h, x, y, z, ry) => { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: .5, polygonOffset: true, polygonOffsetFactor: -2 })); o.position.set(x, y, z); o.rotation.y = ry; p.add(o); return o; };
  const W = 1.07, HW = W / 2;

  // ---- counterweight: full-width upper block with the grille, tapered tail below, rounded top edge ----
  const cw = part('Counterweight', 'Cast-iron counterweight, about a third of the 2.75 t machine. The rear grille lets the LPG engine breathe; the slot below is the tow pin.');
  { const prof = new THREE.Shape(); // side profile in (z, y): rear face slopes in slightly, top edge rounded
    prof.moveTo(-.62, .52); prof.lineTo(.08, .52); prof.lineTo(.12, .62); prof.lineTo(.12, .96); prof.quadraticCurveTo(.12, 1.04, .04, 1.04); prof.lineTo(-.62, 1.04); prof.closePath();
    const g = new THREE.ExtrudeGeometry(prof, { depth: W, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 3, curveSegments: 10 });
    g.rotateY(-Math.PI / 2); g.translate(HW, 0, 0); const m = new THREE.Mesh(g, M.yellow); m.castShadow = m.receiveShadow = true; cw.add(m);
    // grille recess + bars, black panels either side (as in the rear photo)
    box(cw, .5, .24, .04, M.grille, 0, .76, .125); for (let i = 0; i < 7; i++) cyl(cw, .016, .016, .26, M.steel, -.21 + i * .07, .78, .14);
    for (const s of [-1, 1]) { const pan = new THREE.Shape(); pan.moveTo(0, 0); pan.lineTo(.2, 0); pan.lineTo(.2, .3); pan.lineTo(.05, .3); pan.closePath();
      const pg = new THREE.ExtrudeGeometry(pan, { depth: .012, bevelEnabled: false }); const pm = new THREE.Mesh(pg, M.black); pm.scale.x = s; pm.position.set(s * .255, .64, .131); cw.add(pm); }
    // scraped sticker patch on top band
    const stick = tex(256, 64, (x, w, h) => { x.fillStyle = 'rgba(210,214,218,.85)'; x.fillRect(0, 8, w, h - 16); x.fillStyle = 'rgba(40,40,40,.6)'; for (let i = 0; i < 30; i++) x.fillRect(rnd() * w, 8 + rnd() * (h - 16), 2 + rnd() * 30, 2); });
    decal(cw, stick, .28, .07, .03, .99, .142, 0);
    // tail: trapezoid in rear view (narrows to the bottom), rear face sloping under
    const tail = new THREE.Shape(); tail.moveTo(-HW + .02, .5); tail.lineTo(HW - .02, .5); tail.lineTo(.34, .24); tail.lineTo(-.34, .24); tail.closePath();
    const tg = new THREE.ExtrudeGeometry(tail, { depth: .5, bevelEnabled: true, bevelThickness: .015, bevelSize: .015, bevelSegments: 2 }); tg.translate(0, 0, -.42);
    const tm = new THREE.Mesh(tg, M.yellow); tm.castShadow = true; cw.add(tm);
    box(cw, .16, .07, .06, M.grille, 0, .3, .1); cyl(cw, .015, .015, .12, M.steel, 0, .3, .1); // tow pin slot
    box(cw, W - .04, .025, .02, M.black, 0, .52, .1);
    box(cw, W - .02, .05, .06, M.yellow, 0, .55, .14); } // the scuffed rear lip above the tail, as in the photo

  // ---- chassis: black lower frame, yellow body sides, step, decals ----
  const body = part('Body and chassis', 'Black steel frame with yellow side panels. The engine (Nissan H20, about 29 kW, running on LPG) sits under the seat.');
  { box(body, W - .02, .34, 1.35, M.black, 0, .42, -.98); box(body, W, .4, .78, M.yellow, 0, .82, -.62);
    for (const s of [-1, 1]) { box(body, .02, .14, .45, M.satin, s * (HW + .005), .32, -1.0); } // step plates
    const dec = tex(512, 128, (x, w, h) => { x.fillStyle = '#c8262b'; x.fillRect(0, 34, w, h - 50); x.fillStyle = '#111'; x.fillRect(0, 0, w, 34); x.fillStyle = '#e8e8e8'; x.font = 'bold 22px Arial'; x.fillText('DAEWOO', 14, 25);
      x.fillStyle = '#fff'; x.font = 'bold 64px Arial'; x.fillText('G15S', 14, 104); x.fillStyle = '#111'; x.fillRect(0, h - 16, w, 16); });
    for (const s of [-1, 1]) decal(body, dec, .3, .075, s * (HW + .012), .9, -.62, s * Math.PI / 2);
    const side = tex(512, 256, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = '#f2f2f2'; x.font = 'bold 54px Arial'; x.fillText('Forklift', 20, 80); x.fillText('012…', 20, 150);
      x.strokeStyle = '#f2f2f2'; x.lineWidth = 8; x.beginPath(); x.arc(400, 128, 90, 0, 7); x.stroke(); x.font = 'bold 110px Georgia'; x.fillText('G', 360, 165); });
    for (const s of [-1, 1]) decal(body, side, .44, .22, s * (HW + .002), .46, -1.12, s * Math.PI / 2);
    // hood top / engine cover and the cowl
    box(body, W - .06, .05, .62, M.yellow, 0, 1.04, -.72); box(body, W - .1, .28, .22, M.black, 0, 1.0, -1.32); }

  // ---- wheels: drive wheels at the front, steer wheels at the back (counterbalance layout) ----
  const wh = part('Wheels', 'Pneumatic tyres: big drive wheels at the front under the mast, smaller steer wheels at the back under the counterweight. The yellow hubs are just visible in your photo.');
  const wheel = (r, wd, x, z) => { const prof = [], n = 14; for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + Math.PI * i / n; prof.push(new THREE.Vector2(r * .62 + Math.cos(a) * r * .38, Math.sin(a) * wd / 2)); }
    const t = new THREE.Mesh(new THREE.LatheGeometry(prof, 36), M.tyre); t.rotation.z = Math.PI / 2; t.position.set(x, r, z); t.castShadow = true; wh.add(t);
    const rim = cyl(wh, r * .58, r * .58, wd * .8, M.rim, x, r, z, 0, Math.PI / 2, 28); const hub = cyl(wh, r * .22, r * .22, wd * .86, M.hub, x, r, z, 0, Math.PI / 2, 16);
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; cyl(wh, .012, .012, wd * .9, M.steel, x, r + Math.cos(a) * r * .32, z + Math.sin(a) * r * .32, 0, Math.PI / 2, 6); } };
  for (const s of [-1, 1]) { wheel(.33, .2, s * .43, -1.55); wheel(.25, .17, s * .41, -.18); }
  for (const s of [-1, 1]) { const fen = new THREE.Mesh(new THREE.CylinderGeometry(.36, .36, .22, 24, 1, true, Math.PI * .1, Math.PI * .75), M.black); fen.rotation.z = Math.PI / 2; fen.position.set(s * .43, .33, -1.55); body.add(fen); }

  // ---- overhead guard: black box-section posts, slatted roof, "FTD 8548" up the rear posts ----
  const og = part('Overhead guard', 'Steel cage over the driver: stops falling loads. Its top is 2.16 m off the floor (spec), which is what scales the whole yard model. The plate number FTD 8548 runs up the rear posts.');
  { const rearZ = -.32, frontZ = -1.32, top = 2.13;
    for (const s of [-1, 1]) { box(og, .07, top - 1.0, .06, M.black, s * (HW - .06), (1.0 + top) / 2, rearZ);
      const fp = box(og, .06, top - 1.1, .06, M.black, s * (HW - .07), (1.1 + top) / 2, frontZ + .05); fp.rotation.x = -.06; }
    box(og, W - .04, .06, .06, M.black, 0, top, rearZ); box(og, W - .04, .06, .06, M.black, 0, top, frontZ); for (const s of [-1, 1]) box(og, .06, .06, 1.06, M.black, s * (HW - .06), top, (rearZ + frontZ) / 2);
    for (let i = 0; i < 6; i++) box(og, .03, .03, 1.0, M.black, -.38 + i * .152, top + .015, (rearZ + frontZ) / 2);
    const reg = tex(64, 512, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = '#e9cf63'; x.font = 'bold 52px Arial'; 'FTD8548'.split('').forEach((ch, i) => x.fillText(ch, 14, 60 + i * 66)); });
    for (const s of [-1, 1]) decal(og, reg, .055, .45, s * (HW - .06) + s * .036, 1.55, rearZ, s * Math.PI / 2);
    // beacon on a bracket at the back, round mirror on the left rear post, red wiring
    const bc = part('Beacon', 'Orange rotating beacon: shows the truck is live.');
    box(bc, .1, .04, .14, M.black, -.08, top + .05, rearZ - .02); cyl(bc, .055, .062, .1, M.amber, -.08, top + .12, rearZ - .02); cyl(bc, .065, .065, .02, M.black, -.08, top + .07, rearZ - .02);
    const mr = part('Mirror', 'Round convex mirror on the left rear post.');
    box(mr, .02, .14, .02, M.black, -HW + .02, 1.88, rearZ + .02); cyl(mr, .055, .055, .02, M.black, -HW - .03, 1.86, rearZ + .03, Math.PI / 2); cyl(mr, .048, .048, .022, M.glass, -HW - .03, 1.86, rearZ + .04, Math.PI / 2);
    const wire = new THREE.CatmullRomCurve3([[-.45, 1.9, rearZ], [-.3, 2.06, rearZ - .02], [-.08, 2.1, rearZ - .02], [.2, 2.02, rearZ - .02], [.4, 1.95, rearZ]].map(p => new THREE.Vector3(...p)));
    const wm = new THREE.Mesh(new THREE.TubeGeometry(wire, 30, .005, 5), M.wire); og.add(wm); }

  // ---- driver: seat, steering wheel, levers ----
  const cab = part('Seat and controls', 'Suspension seat, steering wheel and the hydraulic levers (lift, tilt) on the cowl.');
  { box(cab, .46, .09, .44, M.seat, 0, 1.12, -.78); const back = box(cab, .46, .42, .08, M.seat, 0, 1.35, -.54); back.rotation.x = -.18;
    const col = cyl(cab, .03, .03, .5, M.black, 0, 1.3, -1.18, -.55); const sw = new THREE.Mesh(new THREE.TorusGeometry(.16, .018, 8, 32), M.black); sw.position.set(0, 1.5, -1.03); sw.rotation.x = Math.PI / 2 - .55; cab.add(sw);
    for (let i = 0; i < 3; i++) { cyl(cab, .008, .008, .22, M.steel, .2 + i * .06, 1.22, -1.3, .25); const knob = new THREE.Mesh(new THREE.SphereGeometry(.022, 10, 8), M.black); knob.position.set(.2 + i * .06, 1.33, -1.27); cab.add(knob); } }

  // ---- LPG: Calor bottle in its yellow cradle on the counterweight, valve shroud on the right ----
  const lpg = part('Calor gas bottle', '18 kg Calor LPG cylinder fuelling the engine, clamped in a yellow cradle with two straps. The steel shroud on the right end protects the valve.');
  { const calor = tex(512, 256, (x, w, h) => { x.fillStyle = '#c42f28'; x.fillRect(0, 0, w, h); for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(${rnd() < .5 ? '90,20,15' : '230,120,110'},${rnd() * .25})`; x.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 14, 1 + rnd() * 3); }
      x.save(); x.translate(200, 128); x.rotate(-Math.PI / 2); x.fillStyle = '#f4ece6'; x.font = 'bold 40px Arial'; x.fillText('CALOR', -62, 14); x.restore();
      x.strokeStyle = '#f4ece6'; x.lineWidth = 9; x.beginPath(); x.arc(290, 128, 40, .4, 5.9); x.stroke(); x.beginPath(); x.arc(290, 128, 18, .4, 5.9); x.stroke(); });
    const bm = new THREE.MeshStandardMaterial({ map: calor, roughness: .5, metalness: .15 }); const r = .155, L = .62, y = 1.27, z = -.12;
    const b = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 32), bm); b.rotation.z = Math.PI / 2; b.rotation.x = Math.PI; b.position.set(-.04, y, z); b.castShadow = true; lpg.add(b);
    for (const s of [-1, 1]) { const cap = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), bm); cap.scale.y = .35; cap.rotation.z = -s * Math.PI / 2; cap.position.set(-.04 + s * L / 2, y, z); lpg.add(cap); }
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .16, 24, 1, true), M.steel); sh.rotation.z = Math.PI / 2; sh.position.set(-.04 + L / 2 + .12, y, z); sh.material.side = THREE.DoubleSide; lpg.add(sh);
    cyl(lpg, .03, .03, .08, M.steel, -.04 + L / 2 + .09, y, z, 0, Math.PI / 2, 10); const hose = new THREE.CatmullRomCurve3([[.42, y, z], [.5, y - .1, z - .05], [.48, 1.06, z - .2]].map(p => new THREE.Vector3(...p))); lpg.add(new THREE.Mesh(new THREE.TubeGeometry(hose, 12, .012, 6), M.black));
    for (const dx of [-.22, .14]) { const st = new THREE.Mesh(new THREE.TorusGeometry(r + .01, .012, 6, 28), M.strapY); st.rotation.y = Math.PI / 2; st.position.set(dx, y, z); st.scale.set(1, 1, 2.5); lpg.add(st); box(lpg, .05, .04, .05, M.strapY, dx, y + r + .02, z); }
    box(lpg, .55, .03, .26, M.strapY, -.04, 1.07, z); for (const dx of [-.22, .14]) { box(lpg, .04, .12, .26, M.strapY, dx, 1.13, z); } }

  // ---- mast, carriage and forks ----
  const mast = part('Mast and forks', 'Two-stage mast: outer channels, inner channels running on rollers, lift cylinder and chains, carriage, load backrest and two 1.07 m forks. Lift is roughly 3 m.');
  { const mz = -1.82, mh = 1.99;
    for (const s of [-1, 1]) { const x0 = s * .33; box(mast, .1, mh, .02, M.satin, x0, mh / 2 + .05, mz + .05); box(mast, .02, mh, .1, M.satin, x0 + s * .05, mh / 2 + .05, mz); box(mast, .1, mh, .02, M.satin, x0, mh / 2 + .05, mz - .05);
      const xi = s * .25; box(mast, .07, mh - .05, .015, M.black, xi, mh / 2 + .08, mz + .04); box(mast, .015, mh - .05, .07, M.black, xi - s * .035, mh / 2 + .08, mz); box(mast, .07, mh - .05, .015, M.black, xi, mh / 2 + .08, mz - .04);
      for (let k = 0; k < 44; k++) box(mast, .025, .03, .012, M.chain, s * .14, .35 + k * .036, mz + .02); }
    for (const y of [.12, 1.05, mh]) box(mast, .76, .07, .08, M.satin, 0, y, mz); cyl(mast, .045, .045, 1.6, M.steel, 0, .95, mz + .07); cyl(mast, .055, .055, 1.0, M.satin, 0, .6, mz + .07);
    cyl(mast, .07, .07, .06, M.black, 0, mh + .02, mz + .02, 0, Math.PI / 2); // chain sheave
    for (const s of [-1, 1]) { const tc = cyl(mast, .035, .035, .55, M.satin, s * .4, .78, -1.58, Math.PI / 2 - .25); }
    const car = new THREE.Group(); car.position.set(0, .08, mz - .09); mast.add(car);
    box(car, .9, .1, .05, M.black, 0, .1, 0); box(car, .9, .1, .05, M.black, 0, .42, 0);
    for (let i = 0; i < 6; i++) box(car, .025, .6, .025, M.black, -.38 + i * .152, .78, 0); box(car, .9, .04, .04, M.black, 0, 1.08, 0); // load backrest
    for (const s of [-1, 1]) { const f = new THREE.Group(); f.position.set(s * .25, 0, 0); car.add(f);
      box(f, .1, .5, .045, M.black, 0, .27, -.03); const blade = new THREE.Shape(); blade.moveTo(0, 0); blade.lineTo(1.07, 0); blade.lineTo(1.07, .012); blade.lineTo(.2, .04); blade.lineTo(0, .04); blade.closePath();
      const bg = new THREE.ExtrudeGeometry(blade, { depth: .1, bevelEnabled: false }); bg.rotateY(Math.PI / 2); bg.translate(-.05, 0, -.05); const bl = new THREE.Mesh(bg, M.black); bl.castShadow = true; f.add(bl); bl.position.y = -.08; } }

  root.userData.parts = parts; root.userData.spec = { width: 1.07, guard: 2.16, lengthToForkFace: 2.16, forks: 1.07, capacity: '1.5 t at 500 mm', weight: '2.75 t', engine: 'Nissan H20 LPG, 28.7 kW' };
  return root;
}
