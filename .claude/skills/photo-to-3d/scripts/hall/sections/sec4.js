// ===== Section 4: pole stillages (red post pallets) — fitted to photo 44 (4.8 px, rough: motion blur) =====
// Frame: x right (0 = front-left post of the right-hand tower), y up, z toward the camera; tower fronts at z = 0. Racks run 2.4 m back.
function section(ROOT) {
  const W = 1.05, D = 2.4;
  const ALU = STD({ color: 0xc9cdd1, metalness: .75, roughness: .32 }), JUTE = STD({ map: tex(256, 256, (x, w, h) => { x.fillStyle = '#b8945e'; x.fillRect(0, 0, w, h); for (let i = 0; i < h; i += 6) { x.fillStyle = `rgba(90,60,30,${.2 + rnd() * .2})`; x.fillRect(0, i, w, 2); } for (let i = 0; i < w; i += 6) { x.fillStyle = `rgba(255,235,190,${.08 + rnd() * .1})`; x.fillRect(i, 0, 2, h); } for (let i = 0; i < h; i += 40) { x.fillStyle = 'rgba(60,40,20,.35)'; x.fillRect(0, i, w, 5); } }, [2, 2]), roughness: 1 });
  const WHITE = STD({ color: 0xe9e7e0, roughness: .9 }), BLACK = STD({ color: 0x1d1f22, roughness: .5 }), BLUE = STD({ color: 0x23356e, roughness: .8 });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v3 = new THREE.Vector3(), sc = new THREE.Vector3();
  // a bundle of tubes or poles running along z (instanced), each with a little jitter and tilt
  function tubes(p, n, x0, x1, y0, rows, len, r, mat, opt = {}) {
    const geo = opt.hollow ? (() => { const s = new THREE.Shape(); s.absarc(0, 0, r, 0, Math.PI * 2); const h = new THREE.Path(); h.absarc(0, 0, r * .82, 0, Math.PI * 2, true); s.holes.push(h); const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false, curveSegments: 12 }); g.translate(0, 0, -.5); return g; })() : (() => { const g = new THREE.CylinderGeometry(r, r, 1, 10); g.rotateX(Math.PI / 2); return g; })();
    const im = new THREE.InstancedMesh(geo, mat, n), per = Math.ceil(n / rows), col = new THREE.Color();
    for (let i = 0; i < n; i++) { const row = Math.floor(i / per), k = i % per; e.set((rnd() - .5) * (opt.tilt || .03), (rnd() - .5) * (opt.yaw || .04), 0); q.setFromEuler(e);
      v3.set(x0 + (k + .5) / per * (x1 - x0) + (rnd() - .5) * r, y0 + r + row * r * 1.9, (opt.z || 0) + (rnd() - .5) * (opt.zj || .3)); sc.set(1, 1, len * (.85 + rnd() * .3)); m4.compose(v3, q, sc); im.setMatrixAt(i, m4);
      if (opt.tint) { const t = .85 + rnd() * .3; im.setColorAt(i, col.setRGB(t, t * .93, t * .8)); } }
    im.castShadow = im.receiveShadow = true; p.add(im); return im; }
  function rolls(p, n, x0, x1, y0, len, r, z = 0) { for (let i = 0; i < n; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 18), JUTE); c.rotation.x = Math.PI / 2; c.position.set(x0 + (i + .5) / n * (x1 - x0), y0 + r, z + (rnd() - .5) * .3); c.castShadow = true; p.add(c); const end = new THREE.Mesh(new THREE.CircleGeometry(r, 18), STD({ map: tex(64, 64, (x, w, h) => { x.fillStyle = '#9c7a48'; x.fillRect(0, 0, w, h); x.strokeStyle = '#5e4424'; x.lineWidth = 2; for (let k = 4; k < 32; k += 4) { x.beginPath(); x.arc(32, 32, k, 0, 7); x.stroke(); } }) })); end.position.set(c.position.x, c.position.y, c.position.z + len / 2 + .001); p.add(end); } }
  function folded(p, x, y, z, w, h, d, mat) { const g = new THREE.BoxGeometry(w, h, d, 6, 4, 6), pp = g.attributes.position; for (let i = 0; i < pp.count; i++) pp.setY(i, pp.getY(i) + (rnd() - .5) * h * .25 * (pp.getY(i) > 0 ? 1 : 0)); g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); m.position.set(x, y + h / 2, z); m.castShadow = m.receiveShadow = true; p.add(m); return m; }
  function crate(p, x, y, z, w, h, d, ry = 0, label) { const g = grp(p, x, y, z, ry); const lid = label ? STD({ map: tex(256, 128, (c, W, H) => { c.fillStyle = '#1d1f22'; c.fillRect(0, 0, W, H); c.fillStyle = '#eee'; c.font = 'italic 26px Comic Sans MS, cursive'; c.fillText(label, 20, 60); c.font = 'italic 16px Comic Sans MS, cursive'; c.fillText('+ extra bedouin bits', 30, 92); }) }) : BLACK;
    box(g, w, h, d, [BLACK, BLACK, BLACK, BLACK, lid, BLACK], 0, 0, 0); box(g, w + .03, .04, d + .03, BLACK, 0, h - .02, 0); return g; }
  // a red post pallet level: base frame, mesh floor optional, four posts with cone tops
  function level(p, y, h, mesh) { const s = grp(p, W / 2, y, -D / 2);
    for (const sx of [-1, 1]) { box(s, .06, .07, D, M.red, sx * (W / 2 - .03), 0, 0); for (const sz of [-1, 1]) { box(s, .06, h - .02, .06, M.red, sx * (W / 2 - .03), 0, sz * (D / 2 - .03)); const c = new THREE.Mesh(new THREE.ConeGeometry(.06, .1, 8), M.red); c.position.set(sx * (W / 2 - .03), h - .05, sz * (D / 2 - .03)); s.add(c); } }
    for (const sz of [-1, 1]) box(s, W, .07, .06, M.red, 0, 0, sz * (D / 2 - .03)); box(s, W - .1, .015, D - .1, STD({ color: 0x5e2420, metalness: .4 }), 0, .06, 0);
    if (mesh) { const mm = new THREE.MeshStandardMaterial({ map: tex(256, 256, (x, w, hh) => { x.strokeStyle = '#6a2420'; x.lineWidth = 2; for (let i = 0; i < w; i += 12) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, hh); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); } }), transparent: true, alphaTest: .5, side: THREE.DoubleSide });
      for (const sz of [-1, 1]) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(W, h - .1), mm); pl.position.set(0, h / 2, sz * D / 2); s.add(pl); } for (const sx of [-1, 1]) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(D, h - .1), mm); pl.rotation.y = Math.PI / 2; pl.position.set(sx * W / 2, h / 2, 0); s.add(pl); } }
    return s; }
  // ---- right-hand tower ----
  { const g = grp(ROOT, 0, 0, 0); const L = [[0, 1.7], [1.7, .5], [2.2, 1.0], [3.2, 1.13]];
    L.forEach(([y, h], i) => level(g, y, h, i === 2));
    const sL = grp(g, W / 2, 0, -D / 2);
    tubes(sL, 26, -.45, .45, .02, 3, 3.6, .05, M.pole, { tint: true, z: 1.2, zj: .5, tilt: .08 }); folded(sL, 0, .35, .8, .95, .35, 1.8, STD({ color: 0x8a6a3a, roughness: .95 }));
    crate(sL, -.05, .72, .9, .75, .38, .5, .1);
    for (const xx of [-.15, .2]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.075, .075, 3.2, 14), M.pole); c.rotation.x = Math.PI / 2 - .05; c.position.set(xx, .09, 1.9); c.castShadow = true; sL.add(c); const plate = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .01, 20), ALU); plate.rotation.x = Math.PI / 2; plate.position.set(xx, .09, 3.5); sL.add(plate); }
    tubes(sL, 14, -.45, .45, 1.77, 2, 3.0, .03, ALU, { hollow: true, z: .4, tilt: .12, yaw: .1 });
    rolls(sL, 3, -.4, .4, 2.28, 1.6, .16); folded(sL, 0, 2.6, .2, .9, .3, 1.6, JUTE); folded(sL, .05, 2.28, -.6, .7, .35, .7, BLUE);
    tubes(sL, 10, -.45, .1, 3.28, 2, 3.0, .03, ALU, { hollow: true, z: .3, tilt: .2 }); rolls(sL, 1, .1, .45, 3.28, 1.2, .2);
    tubes(sL, 22, -.55, .55, 4.35, 2, 4.2, .07, M.pole, { tint: true, z: .4 });
    tag(g, 'Pole stillages: tower', 'Red post pallets stacked four high. Top: yurt roof poles (round timber, about 4 m). Then grey aluminium tubes with snap hooks, jute matting rolls and a blue bag, a mesh-sided level of folded coir/jute rugs, and on the bottom a bundle of round timber poles (centre poles with steel base plates on the ends) under a canvas wrap and a black crate.', `${W} × ${D} m post pallets · ≈ 4.5 m to the top poles`, [41, 42, 43, 44, 45, 46, 47, 48], 'fairly sure'); }
  // ---- left-hand tower ----
  { const g = grp(ROOT, -2.3, 0, .2); [[0, .95], [.95, 1.0], [1.95, 1.05], [3.0, 1.2]].forEach(([y, h], i) => level(g, y, h, i === 0));
    const s = grp(g, W / 2, 0, -D / 2);
    folded(s, 0, .1, .2, .85, .65, 1.8, WHITE); const ply = box(s, .45, .4, .02, STD({ map: tex(128, 128, (x, w, h) => { x.fillStyle = '#c6a273'; x.fillRect(0, 0, w, h); x.fillStyle = '#2a2420'; x.font = 'bold 44px Arial'; x.fillText('6×6', 22, 80); }) }), -.2, .3, 1.21);
    tubes(s, 18, -.45, .45, .97, 2, 3.2, .035, ALU, { hollow: true, z: .3 }); crate(s, .05, 1.2, .2, .7, .35, .55);
    rolls(s, 2, -.45, -.05, 1.97, 1.4, .17); folded(s, .2, 2.0, .5, .5, .45, 1.0, JUTE); crate(s, .1, 2.45, .3, .7, .38, .55); tubes(s, 16, -.45, .45, 2.86, 1, 3.4, .035, ALU, { hollow: true, z: .3 });
    folded(s, -.1, 3.05, .3, .8, .4, 1.4, WHITE); tubes(s, 14, -.45, .45, 3.5, 2, 3.4, .035, ALU, { hollow: true, z: .6 }); rolls(s, 3, -.45, .45, 4.2, 2.0, .16);
    tag(g, 'Pole stillages: left tower', 'Four red post pallets: a mesh cage at the bottom with white canvas and a ply board marked "6×6" (a 6 × 6 m structure\'s kit), then aluminium tubes, black crates, jute/coir matting rolls and white bulk bags, with more tubes and rolled matting on top.', `${W} × ${D} m post pallets · ≈ 4.5 m`, [41, 42, 43, 44, 45, 46, 47, 48], 'fairly sure'); }
  // floor: loose aluminium tubes and a black crate in front of the left tower
  { const g = grp(ROOT, -2.0, 0, 1.0); tubes(g, 16, -.5, .3, 0, 2, 2.6, .035, ALU, { hollow: true, yaw: .5, tilt: .05 }); crate(g, .05, 0, 1.1, .78, .36, .58, -.2);
    tag(g, 'Loose tubes + black crate', 'Aluminium tubes left on the floor at the foot of the left tower and a black lidded crate in the walkway.', '', [42, 43, 44, 46, 47], 'sure'); }
  // ---- right: third tower with the Double Bedouin box, angled tubes; tent stakes bundle on the floor ----
  { const g = grp(ROOT, 1.7, 0, -.8); [[0, 1.0], [1.0, 1.05], [2.05, 1.05], [3.1, 1.1]].forEach(([y, h]) => level(g, y, h));
    const s = grp(g, W / 2, 0, -D / 2); crate(s, 0, 2.1, .6, .75, .32, .55, .4, 'Double Bedouin');
    tubes(s, 12, -.4, .4, 1.62, 2, 2.6, .045, ALU, { hollow: true, z: .9, tilt: .35, yaw: .3 }); rolls(s, 2, -.2, .4, 1.1, 1.0, .18, .4); tubes(s, 14, -.45, .45, 3.15, 2, 3.0, .05, ALU, { hollow: true, z: .3 });
    tag(g, 'Pole stillages: right (Double Bedouin)', 'A third red stack holding a black crate marked "Double Bedouin + extra bedouin bits", aluminium tubes sticking out at an angle, and coir mat rolls.', '', [44, 45, 46, 47, 48, 49], 'sure');
    const st = grp(ROOT, 1.95, 0, .45, -.15); const n = 80, geo = new THREE.BoxGeometry(.035, .035, 1), im = new THREE.InstancedMesh(geo, M.pole, n), c = new THREE.Color();
    for (let i = 0; i < n; i++) { e.set(.1 + (rnd() - .5) * .04, (rnd() - .5) * .05, 0); q.setFromEuler(e); v3.set(-.3 + (i % 16) * .04, .02 + Math.floor(i / 16) * .036 + (i % 16) * .012, 0); sc.set(1, 1, 1.0 + rnd() * .2); m4.compose(v3, q, sc); im.setMatrixAt(i, m4); const t = .7 + rnd() * .3; im.setColorAt(i, c.setRGB(t * .9, t * .75, t * .5)); }
    im.castShadow = true; st.add(im); for (let i = 0; i < 16; i++) box(st, .036, .036, .05, STD({ color: 0xd23a3a }), -.3 + i * .04, .02 + i * .012, -.55);
    box(st, .7, .01, .03, STD({ color: 0x3a7bd5 }), 0, .2, 0);
    tag(st, 'Tent stakes (timber, red tips)', 'A strapped bundle of square timber stakes with red-painted tips, leaning on the right-hand stack.', '≈ 1.0–1.2 m', [44, 45, 46, 47, 48, 49, 50], 'sure'); }
  // ---- behind: the green bag racks ----
  { const g = grp(ROOT, -1.6, 0, -6.2); g.userData.shell = true; for (let c = 0; c < 3; c++) for (let lv = 0; lv < 5; lv++) { const s = grp(g, c * 1.3, lv * .82, 0);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(s, .05, .8, .05, M.lime, sx * .6, 0, sz * .5); box(s, 1.25, .05, 1.05, M.lime, 0, 0, 0);
      for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.5, 12, 8), STD({ color: [0xd9bfa7, 0xe3cbb6, 0xb38f5c][(c + lv + k) % (lv === 2 && c === 1 ? 3 : 2)], roughness: .95 })); b.scale.set(.45, .32, .55); b.position.set(-.4 + (k % 3) * .4, .2 + Math.floor(k / 3) * .3, (rnd() - .5) * .3); g.add(b); b.position.add(s.position); const t = new THREE.Mesh(new THREE.PlaneGeometry(.05, .08), STD({ color: 0x9cff3a, emissive: 0x9cff3a, emissiveIntensity: .15, side: THREE.DoubleSide })); t.position.copy(b.position).add(new THREE.Vector3(0, 0, .28)); g.add(t); } }
    tag(g, 'Bag racks behind (pink/beige, lime tags)', 'The lime-green post pallets of beige and pink canvas bags with lime tags, seen through the gap between the pole stacks (and a level of mustard bags).', '', [41, 42, 43, 44], 'fairly sure'); }
  { const wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), STD({ color: 0xbfc5c9, roughness: .7 })); wall.position.set(0, 3.5, -7.2); wall.userData.shell = true; ROOT.add(wall); }
  return { home: [[-.08, 1.68, 5.01], [-.4, 2.0, -.8]], floor: 12, photo: { n: 44, cam: __CAM1__ } };
}
