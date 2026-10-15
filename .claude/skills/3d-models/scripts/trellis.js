// Yurt trellis stack: five timber stillages, each holding one 16 ft yurt's trellis: 4 sections, folded, two side by side on each of two layers (Josh, 14 Oct 2026). Built from Josh's photos (14 Oct 2026).
// Metres, Y up, long side along X, front face at +Z. Every cradle, slat, knot and cord is its own placed piece.
import * as THREE from 'three';

export const TRELLIS_FIT = { L: 2.32, D: 1.35, pitch: 0.197, block: 0.11, stack: 0.99, dx: [0.001, -0.002, 0.010, 0.006, -0.015], perCradle: 4, across: 2, gap: .06,
  section: { perLayer: 13, holes: 11, s: .235, end: .07, design: 45 } }; // cradle sizes from the front-photo solve; section from the opened-out photo

// ---- one trellis (khana) section: two layers of slats crossing, a cord knot at every crossing. Opens like a concertina. ----
// Node (u, v) sits at s·(sinθ·(u − v), cosθ·(u + v)). Front-layer slats are lines of constant v, back-layer slats constant u.
// Clipped to a rectangle at the design opening, so edge slats are shorter, as on the real ones.
export function trellisSection({ perLayer = 13, holes = 11, s = .235, end = .07, design = 45, seed = 1, weathered = .15 } = {}) {
  const rnd = (q => () => (q = (q * 16807) % 2147483647) / 2147483647)(seed * 977 + 3), d = design * Math.PI / 180, SW = .045, ST = .018;
  const nodes = []; for (let u = -60; u <= 60; u++) for (let v = -60; v <= 60; v++) { const j = u + v, k = u - v; if (j < 0 || j > holes - 1) continue; nodes.push([u, v, k]); }
  // keep a band of k so each layer ends up with perLayer slats
  const kMin = -perLayer, kMax = perLayer - (holes - 1) % 2; const inside = nodes.filter(n => n[2] >= kMin && n[2] <= kMax);
  const A = new Map(), B = new Map(); for (const [u, v] of inside) { (A.get(v) || A.set(v, []).get(v)).push(u); (B.get(u) || B.set(u, []).get(u)).push(v); }
  const slats = []; for (const [v, us] of A) if (us.length > 1) slats.push({ layer: 0, fixed: v, a: Math.min(...us), b: Math.max(...us) });
  for (const [u, vs] of B) if (vs.length > 1) slats.push({ layer: 1, fixed: u, a: Math.min(...vs), b: Math.max(...vs) });
  const tones = [[.5, .36, .22], [.45, .33, .21], [.4, .32, .24], [.36, .32, .28], [.55, .41, .26], [.42, .3, .19]]; // weathered pine, matched to the photos
  const g = new THREE.Group(); g.name = 'Trellis section';
  const slatMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .88 });
  const sm = new THREE.InstancedMesh(new THREE.BoxGeometry(SW, 1, ST), slatMat, slats.length); sm.castShadow = sm.receiveShadow = true;
  const kg = new THREE.SphereGeometry(.0095, 10, 6); kg.scale(1.3, 1, .8); const km = new THREE.InstancedMesh(kg, new THREE.MeshStandardMaterial({ color: 0x4a4036, roughness: .45 }), inside.length * 2); // raised cord knot with a sheen, so close up it reads as a knot, not a drilled hole
  const col = new THREE.Color(); slats.forEach((sl, i) => { const t = tones[Math.floor(rnd() * tones.length)], w = rnd() < weathered ? .6 : 1; col.setRGB(t[0] * w + (1 - w) * .52, t[1] * w + (1 - w) * .52, t[2] * w + (1 - w) * .52, THREE.SRGBColorSpace); sm.setColorAt(i, col); sl.jit = (rnd() - .5) * .02; });
  g.add(sm, km);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), P3 = (u, v, th) => new THREE.Vector3(s * Math.sin(th) * (u - v), s * Math.cos(th) * (u + v), 0);
  g.setOpen = deg => { const th = deg * Math.PI / 180; let ki = 0;
    slats.forEach((sl, i) => { const p0 = sl.layer ? P3(sl.fixed, sl.a, th) : P3(sl.a, sl.fixed, th), p1 = sl.layer ? P3(sl.fixed, sl.b, th) : P3(sl.b, sl.fixed, th);
      const dir = p1.clone().sub(p0).normalize(), len = p0.distanceTo(p1) + 2 * end + sl.jit, mid = p0.clone().add(p1).multiplyScalar(.5);
      mid.z = sl.layer ? -ST / 2 - .0005 : ST / 2 + .0005; e.set(0, 0, Math.atan2(-dir.x, dir.y)); q.setFromEuler(e); m4.compose(mid, q, new THREE.Vector3(1, len, 1)); sm.setMatrixAt(i, m4); });
    for (const [u, v] of inside) { const p = P3(u, v, th); for (const z of [ST + .0065, -ST - .0065]) { m4.makeTranslation(p.x, p.y, z); km.setMatrixAt(ki++, m4); } }
    sm.instanceMatrix.needsUpdate = km.instanceMatrix.needsUpdate = true; if (sm.instanceColor) sm.instanceColor.needsUpdate = true;
    const xs = inside.map(([u, v]) => s * Math.sin(th) * (u - v)); g.userData.width = Math.max(...xs) - Math.min(...xs) + SW; g.userData.cx = (Math.max(...xs) + Math.min(...xs)) / 2; g.userData.end0 = end * Math.cos(th); g.userData.height = s * Math.cos(th) * (holes - 1) + 2 * end * Math.cos(th);
    sm.computeBoundingSphere(); km.computeBoundingSphere(); g.userData.open = deg; };
  g.minOpen = Math.asin(SW * 1.08 / (2 * s)) * 180 / Math.PI; // folded shut: neighbouring slats touching
  g.userData.counts = { slats: slats.length, knots: inside.length, perLayer: [...A.values()].filter(x => x.length > 1).length };
  g.setOpen(design); return g;
}

export function buildTrellisStack(o = {}) {
  const P = { ...TRELLIS_FIT, ...o };
  const root = new THREE.Group(); root.name = 'Trellis stack'; root.userData.cradles = [];
  const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(o.seed || 21);
  const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const grain = (base, dark) => tex(256, 64, (x, w, h) => { x.fillStyle = base; x.fillRect(0, 0, w, h); for (let i = 0; i < 26; i++) { x.strokeStyle = `rgba(${dark},${.12 + rnd() * .2})`; x.lineWidth = 1 + rnd() * 2; x.beginPath(); const y = rnd() * h; x.moveTo(0, y); x.bezierCurveTo(w * .3, y + (rnd() - .5) * 10, w * .7, y + (rnd() - .5) * 10, w, y + (rnd() - .5) * 6); x.stroke(); }
    for (let i = 0; i < 3; i++) { x.fillStyle = `rgba(${dark},.5)`; x.beginPath(); x.ellipse(rnd() * w, rnd() * h, 3, 2, 0, 0, 7); x.fill(); } });
  const M = {
    cradle: new THREE.MeshStandardMaterial({ map: grain('#c89a5e', '120,75,35'), roughness: .8 }),
    rail: new THREE.MeshStandardMaterial({ map: grain('#b98c58', '105,70,35'), roughness: .82 }),
    slat: new THREE.MeshStandardMaterial({ map: grain('#ffffff', '60,45,30'), roughness: .9 }),
    knot: new THREE.MeshStandardMaterial({ color: 0x141414, roughness: .7 }),
    cord: new THREE.MeshStandardMaterial({ color: 0x1b1d20, roughness: .75 }),
    hole: new THREE.MeshBasicMaterial({ color: 0x2a1a0c }),
    blue: new THREE.MeshStandardMaterial({ color: 0x2f5f8f, roughness: .6 }),
  };
  const box = (p, w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; p.add(b); return b; };
  // slat: 45 × 18 mm with rounded ends (stadium plan), extruded by its thickness
  const holeGeo = new THREE.CircleGeometry(.007, 10);
  const numTex = txt => tex(128, 96, (x, w, h) => { x.fillStyle = '#d6a05a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 10; i++) { x.strokeStyle = 'rgba(120,70,25,.3)'; x.beginPath(); const y = rnd() * h; x.moveTo(0, y); x.lineTo(w, y + 4); x.stroke(); }
    x.save(); x.translate(w / 2, h / 2); x.rotate(-Math.PI / 2 * (txt.length > 2 ? 1 : 1)); x.fillStyle = '#3b2512'; x.font = `bold ${txt.length > 2 ? 34 : 50}px "Comic Sans MS", Arial`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 0, 2); x.restore(); });

  for (let k = 0; k < 5; k++) {
    const num = 11 + k, cr = new THREE.Group(); cr.name = `Stillage ${num}`; root.add(cr); root.userData.cradles.push(cr);
    const yBase = P.stack - .07 - (4 - k) * P.pitch - P.block; cr.position.set(P.dx[k], yBase, 0);
    // frame: four corner end-blocks (the numbered ones), long front/back rails, end boards, two cross bearers
    const bw = .09, bd = .07, h = P.block;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(cr, bw, h, bd, M.cradle, sx * (P.L / 2 - bw / 2), h / 2, sz * (P.D / 2 - bd / 2));
    for (const sz of [-1, 1]) { box(cr, P.L - 2 * bw, .075, .035, M.rail, 0, .0375, sz * (P.D / 2 - .0175));
      for (let i = 0; i < 7; i++) { const hl = new THREE.Mesh(holeGeo, M.hole); hl.position.set(-P.L / 2 + .3 + i * (P.L - .6) / 6, .04, sz * (P.D / 2 + .0005)); hl.rotation.y = sz > 0 ? 0 : Math.PI; cr.add(hl); } }
    for (const sx of [-1, 1]) box(cr, .035, .075, P.D - 2 * bd, M.rail, sx * (P.L / 2 - .0175), .0375, 0);
    for (const zz of [-.35, .35]) box(cr, P.L - .1, .045, .07, M.rail, 0, .0225, zz);
    // numbers on the end blocks: left ends 11–15, right ends "16ft" (bottom one 11), as written in marker on the real ones
    for (const [sx, txt] of [[-1, String(num)], [1, k === 0 ? '11' : '16ft']]) { const lab = new THREE.Mesh(new THREE.PlaneGeometry(bd * .92, h * .9), new THREE.MeshStandardMaterial({ map: numTex(txt), roughness: .8 }));
      lab.position.set(sx * (P.L / 2 + .0005), h / 2, P.D / 2 - bd / 2); lab.rotation.y = sx * Math.PI / 2; cr.add(lab); }
    // the bundle: real trellis sections (see trellisSection) folded shut and laid flat, slats running along X
    for (let sct = 0; sct < P.perCradle; sct++) { const sec = trellisSection({ ...P.section, seed: 100 + k * 7 + sct, weathered: k === 4 ? .4 : .15 });
      sec.setOpen(sec.minOpen); const lay = new THREE.Group(); lay.rotation.x = -Math.PI / 2; const spin = new THREE.Group(); spin.rotation.z = -Math.PI / 2; lay.add(spin); spin.add(sec);
      sec.position.set(-sec.userData.cx, -sec.userData.height / 2 + sec.userData.end0, 0); // centre the folded bundle on the cradle
      const row = Math.floor(sct / P.across), col = sct % P.across, wz = sec.userData.width + P.gap; // halves side by side with a visible gap
      lay.position.set((rnd() - .5) * .08, h + .02 + row * .052, (col - (P.across - 1) / 2) * wz + (rnd() - .5) * .015); cr.add(lay); cr.userData.sections = (cr.userData.sections || []).concat(sec); }
    const rows = 2 * Math.ceil(P.perCradle / P.across), ST = .018;
    // tie cords: run along the top of the bundle, then hang down the front and curl on the floor
    const cords = 3 + Math.floor(rnd() * 3);
    for (let c = 0; c < cords; c++) { const x0 = -P.L / 2 + .25 + rnd() * (P.L - .5), topY = h + rows * (ST + .003) + .006, front = rnd() < .75 ? 1 : -1;
      const pts = [[x0 - .3 - rnd() * .3, topY, (rnd() - .5) * .8], [x0, topY, front * P.D * .35], [x0 + (rnd() - .5) * .05, topY - .01, front * (P.D / 2 + .03)],
        [x0 + (rnd() - .5) * .1, -yBase * .5, front * (P.D / 2 + .05 + rnd() * .05)], [x0 + (rnd() - .5) * .15, -yBase + .006, front * (P.D / 2 + .1 + rnd() * .2)], [x0 + (rnd() - .5) * .35, -yBase + .006, front * (P.D / 2 + .2 + rnd() * .35)]]
        .map(p => new THREE.Vector3(...p));
      const cm = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), 40, .003, 5), M.cord); cm.castShadow = true; cr.add(cm); }
    cr.userData.part = { name: `Stillage ${num} · 16 ft yurt`, desc: `Timber stillage ${num} (${P.L.toFixed(2)} × ${P.D.toFixed(2)} m frame, end blocks marked "${num}" and "${k === 0 ? '11' : '16ft'}") holding folded 16 ft yurt trellis: two layers of 45 × 18 mm slats crossing, a cord knot at every crossing. One 16 ft yurt per stillage: 4 trellis sections, folded, two side by side on each of two layers (about 100 slats). Sits ${(P.dx[k] * 100).toFixed(1)} cm ${P.dx[k] >= 0 ? 'right' : 'left'} of the stack line in your photo.` };
  }
  root.userData.spec = { cradle: `${P.L} × ${P.D} m`, levels: 5, pitch: P.pitch, height: P.stack, section: P.section };
  return root;
}
