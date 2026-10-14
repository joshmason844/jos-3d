// needs: trellis
// ===== Section 2: 14 ft canvas crates, rafter racks (red and blue), trellis stillage tower — fitted to photo 27 (5.4 px) =====
// Frame: x right along the bottom canvas crate's front (0 = its left edge), y up, z toward the camera; that crate's front at z = 0.
function section(ROOT) {
  // canvas crate cover: red, label + number range, badge, notches at the bottom where the stillage feet show
  const canvasMats = (key, range) => { const front = STD({ map: tex(1024, 680, (x, w, h) => { fabric(x, w, h, '#8c2a2b'); x.fillStyle = '#f2e8e2'; x.font = '500 62px Arial'; x.fillText('14ft CANVAS', 40, 92); x.font = '500 54px Arial'; x.fillText(range, 40, 156);
        x.fillStyle = 'rgba(235,235,235,.5)'; x.fillRect(46, 215, 150, 90); drawBadge(x, w / 2 + 70, h / 2 + 10, 210, '#f2e8e2', '#8c2a2b');
        x.fillStyle = '#1a1414'; for (const nx of [150, 420, 600, 870]) x.fillRect(nx, h - 60, 70, 60); }), roughness: .85 });
      const side = STD({ map: tex(512, 340, (x, w, h) => { fabric(x, w, h, '#8c2a2b'); drawBadge(x, w / 2, h / 2, 120, '#f2e8e2', '#8c2a2b'); }), roughness: .85 });
      const top = STD({ map: tex(128, 128, (x, w, h) => fabric(x, w, h, '#7d2526')), roughness: .85 });
      return [side, side, top, top, front, side]; };
  const canvasCrate = (p, range, x, y, z, w = 1.2, h = .76, d = 1.0) => { const g = grp(p, x, y, z);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, .07, .06, .07, M.red, sx * (w / 2 - .05), 0, sz * (d / 2 - .05));            // stillage feet under the cover
    const c = coverMesh(w, h - .05, d, canvasMats('c' + range, range)); c.position.y = .05 + (h - .05) / 2; g.add(c); return g; };
  // ---- bottom crate, red mesh cage of bulk bags on it, three more canvas crates on top ----
  { const g = grp(ROOT, .6, 0, -.5);
    canvasCrate(g, '13–17', 0, 0, 0, 1.2, .79);
    const cage = grp(g, 0, .79, 0), w = 1.2, d = 1.0, h = .76;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(cage, .05, h, .05, M.red, sx * (w / 2 - .025), 0, sz * (d / 2 - .025));
    for (const yy of [0, h - .05]) { for (const sz of [-1, 1]) box(cage, w, .05, .05, M.red, 0, yy, sz * (d / 2 - .025)); for (const sx of [-1, 1]) box(cage, .05, .05, d, M.red, sx * (w / 2 - .025), yy, 0); }
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w - .05, h - .05), new THREE.MeshStandardMaterial({ map: tex(256, 160, (x, W, H) => { x.strokeStyle = '#5a1e1e'; x.lineWidth = 2; for (let i = 0; i < W; i += 10) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); } for (let i = 0; i < H; i += 10) { x.beginPath(); x.moveTo(0, i); x.lineTo(W, i); x.stroke(); } }), transparent: true, alphaTest: .5, side: THREE.DoubleSide }));
    for (const sz of [-1, 1]) { const m = mesh.clone(); m.position.set(0, h / 2, sz * d / 2); cage.add(m); }
    for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.5, 16, 10), STD({ color: [0xe6e1d4, 0xd9d3c4, 0xb9c0c6][i], roughness: .95 })); b.scale.set(.55, .3, .85); b.position.set(-.27 + (i % 2) * .54, .2 + Math.floor(i / 2) * .3, 0); b.castShadow = true; cage.add(b); }
    tag(g, '14 ft canvas crates + bulk-bag cage', 'Red covers marked "14ft CANVAS" with number ranges (13–17 on the floor; 28–32, 18–22, 8–12 above): the 14 ft yurt canvases, five to a crate, numbered so a set goes out together. A red mesh cage of white bulk bags sits between them.', '≈ 1.2 × 1.0 × 0.76 m per crate', [27, 39], 'sure');
    const up = grp(ROOT, .4, 1.55, -.95); [['28–32', 0], ['18–22', .73], ['8–12', 1.46]].forEach(([r, y]) => canvasCrate(up, r, 0, y, 0, 1.13, .72));
    tag(up, '14 ft canvas crates (3 high)', 'Three more "14ft CANVAS" crates stacked on the cage: 28–32 at the bottom, 18–22, then 8–12 on top.', '', [27, 39], 'sure'); }
  const DOOR14 = STD({ roughness: .7, map: tex(512, 280, (x, w, h) => { x.fillStyle = '#c4873f'; x.fillRect(0, 0, w, h); for (let i = 0; i < w; i += 48) { x.fillStyle = 'rgba(90,50,20,.45)'; x.fillRect(i, 0, 3, h); }
    x.strokeStyle = '#7a4a1e'; x.lineWidth = 14; x.strokeRect(7, 7, w - 14, h - 14); x.fillStyle = '#141414'; for (const yy of [50, h - 50]) x.fillRect(20, yy - 6, 170, 12); x.fillRect(w - 50, h / 2 - 25, 10, 50); }) });
  // ---- purple trellis stillages, three high, each a folded trellis load (real slats + knots) wrapped in film ----
  { const g = grp(ROOT, -1.0, 0, -.25); const L = 2.3, Dd = 1.35, step = 1.02;
    for (let lv = 0; lv < 3; lv++) { const s = grp(g, 0, lv * step, 0);
      for (const sz of [-1, 1]) box(s, L, .07, .07, M.purple, 0, .05, sz * (Dd / 2 - .04));
      for (const sx of [-1, 1]) { box(s, .07, .07, Dd, M.purple, sx * (L / 2 - .04), .05, 0); for (const sz of [-1, 1]) box(s, .07, .98, .07, M.purple, sx * (L / 2 - .04), 0, sz * (Dd / 2 - .04)); }
      // 14 ft yurt sets: 3 trellis sections per door. Each stillage holds two sets: 2 sections side by side, 1 on top, the door laid flat over them
      let y = .14;
      for (let set = 0; set < 2; set++) { for (let k = 0; k < 3; k++) { const sec = trellisSection({ perLayer: 13, holes: 11, s: .235, end: .07, design: 45, seed: 300 + lv * 9 + set * 3 + k, weathered: .25 }); sec.setOpen(sec.minOpen);
          const lay = new THREE.Group(); lay.rotation.x = -Math.PI / 2; const spin = new THREE.Group(); spin.rotation.z = -Math.PI / 2; lay.add(spin); spin.add(sec);
          sec.position.set(-sec.userData.cx, -sec.userData.height / 2 + sec.userData.end0, 0); const row = k < 2 ? 0 : 1;
          lay.position.set((rnd() - .5) * .1, y + row * .052, k < 2 ? (k - .5) * (sec.userData.width + .05) : (rnd() - .5) * .3); s.add(lay); }
        y += 2 * .052;
        const door = new THREE.Mesh(new THREE.BoxGeometry(1.95, .045, 1.0), [M.pallet, M.pallet, DOOR14, M.pallet, M.pallet, M.pallet]); door.position.set((rnd() - .5) * .05, y + .022, (rnd() - .5) * .1); door.castShadow = door.receiveShadow = true; s.add(door); y += .06; }
      const wrap = new THREE.Mesh(new THREE.BoxGeometry(L + .1, .52, Dd + .06), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .12, roughness: .15 })); wrap.position.y = .38; s.add(wrap); }
    tag(g, '14 ft trellis + door stillages', 'Purple stillages stacked three high next to the 14 ft canvas crates. A 14 ft yurt is 3 trellis sections per door: each stillage holds two sets, the folded trellis (every crossing tied with cord) with the door laid flat on top, cling-filmed.', 'stillages 2.32 × 1.35 m · ≈ 3.1 m tall', [22, 26, 27, 34], 'sure'); }
  // ---- post-pallet racks of yurt rafters: red ones behind on the right, blue ones on the left ----
  const rafterRack = (p, mat, x, z, levels, w = 1.15, d = 2.6, step = .52, ry = 0) => { const g = grp(p, x, 0, z, ry);
    for (let lv = 0; lv < levels; lv++) { const s = grp(g, 0, lv * step, 0);
      for (const sx of [-1, 1]) { box(s, .06, .06, d, mat, sx * (w / 2 - .03), .04, 0); for (const sz of [-1, 1]) { box(s, .06, step - .02, .06, mat, sx * (w / 2 - .03), 0, sz * (d / 2 - .1)); box(s, .1, .04, .1, mat, sx * (w / 2 - .03), step - .06, sz * (d / 2 - .1)); } }
      for (const sz of [-1, 1]) box(s, w, .06, .06, mat, 0, .04, sz * (d / 2 - .1));
      const n = 34 + Math.floor(rnd() * 12), poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(.022, .026, 1, 8), M.pole, n), m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), c = new THREE.Color();
      for (let i = 0; i < n; i++) { const len = 2.9 + rnd() * .5; m4.compose(new THREE.Vector3(-w / 2 + .08 + (i % 12) * ((w - .16) / 11) + (rnd() - .5) * .02, .1 + .03 + Math.floor(i / 12) * .048, (rnd() - .5) * .2), q, new THREE.Vector3(1, len, 1)); poles.setMatrixAt(i, m4); const t = .85 + rnd() * .25; poles.setColorAt(i, c.setRGB(t, t * .93, t * .82)); }
      poles.castShadow = poles.receiveShadow = true; s.add(poles);
      const strap = box(s, w - .05, .006, .03, STD({ color: 0x3a7bd5 }), 0, .27, .4); }
    return g; };
  { const g = grp(ROOT); rafterRack(g, M.red, 2.5, -2.1, 6, 1.15, 2.6, .5, Math.PI / 2);
    tag(g, 'Pole stillages (red)', 'Red pole stillages stacked six high next to the 14 ft stillages, full of yurt roof poles (round timber, about 3 m) strapped in bundles.', '≈ 1.15 m wide × 6 high (≈ 3 m)', [2, 15, 25, 27], 'sure'); }
  { const g = grp(ROOT); rafterRack(g, M.blue, -2.95, -1.05, 9, 1.15, 2.6, .5);
    tag(g, 'Pole stillages (blue)', 'Blue pole stillages stacked nine high on the left: more yurt roof poles, bundled and strapped.', '≈ 4.5 m tall', [27], 'sure'); }
  // ---- the back wall: white liner, timber rail, steel column ----
  { const g = grp(ROOT); g.userData.shell = true; const wall = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), STD({ color: 0xe9ecee, roughness: .7 })); wall.position.set(0, 3, -2.8); g.add(wall);
    box(g, 12, .12, .08, STD({ map: grain('#c79a5c', '120,80,40') }), 0, 4.1, -2.75); box(g, .3, 6, .2, STD({ color: 0x1e3a2c }), -.4, 0, -2.7); }
  return { home: [[-1.33, 1.6, 5.07], [-.2, 1.5, -.8]], floor: 10, photo: { n: 27, cam: __CAM1__ } };
}
