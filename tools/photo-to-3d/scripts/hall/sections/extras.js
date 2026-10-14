// ---- kit between the detailed sections (from the walk-round photos, placed by eye) ----
{
  const canvas16 = (key, range) => { const front = STD({ map: tex(1024, 680, (x, w, h) => { fabric(x, w, h, '#8c2a2b'); x.fillStyle = '#f2e8e2'; x.font = '500 62px Arial'; x.fillText('16ft CANVAS', 40, 92); x.font = '500 54px Arial'; x.fillText(range, 40, 156); drawBadge(x, w / 2 + 70, h / 2 + 10, 210, '#f2e8e2', '#8c2a2b'); }), roughness: .85 });
    const side = STD({ map: tex(512, 340, (x, w, h) => { fabric(x, w, h, '#8c2a2b'); drawBadge(x, w / 2, h / 2, 120, '#f2e8e2', '#8c2a2b'); }), roughness: .85 }); return [side, side, side, side, front, side]; };
  const ranges = ['1–5', '6–10', '11–15', '16–20', '21–25', '26–30', '31–35', '36–40', '41–45', '46–50'];
  const stack = (x, z, ry, cols) => { const g = grp(scene, x, 0, z, ry); let r = 0; cols.forEach(([cx, n]) => { for (let i = 0; i < n; i++) { const c = coverMesh(1.2, .8, 1.0, canvas16('16_' + r, ranges[r++ % ranges.length])); c.position.set(cx, i * .84 + .44, 0); g.add(c); for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, .07, .05, .07, M.red, cx + sx * .55, i * .84, sz * .45); } }); return g; };
  const a = stack(14.6, 33.5, Math.PI, [[0, 5], [1.25, 4], [2.5, 5]]); tag(a, '16 ft canvas crates (red)', 'Red covers marked "16ft CANVAS" with number ranges on the front (11–15, 41–45, 16–20, 1–5, 36–40, 21–25 read off the photos): the 16 ft yurt canvases, five to a crate, stacked four or five high in the far corner.', '≈ 1.2 × 1.0 × 0.84 m each', [1, 2, 15, 17, 19, 25, 39], 'sure');
  const b = stack(18.6, 30.8, -Math.PI / 2, [[0, 5], [1.25, 4]]); tag(b, '16 ft canvas crates (red, wall)', 'More "16ft CANVAS" crates along the right wall at the far end.', '', [2, 15, 25], 'fairly sure');
  // 12 ft crowns, two high, near the door
  const K12 = { w: 1.2, d: 1.0, h: 1.1, n: 12, D: .9, mats: coverMats('c12', '#1d6658', '#eef0e6', '12FT CROWN × 12', { labelSize: 70 }) };
  const c12 = grp(scene, 13.1, 0, 16.4, Math.PI / 2); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) EXTRA_CRATES.push(crownCrate(c12, K12, j * 1.05, i * 1.24, 0));
  tag(c12, '12 ft crown crates', 'Green covers "12FT CROWN × 12": twelve 12 ft crowns per crate, two high.', '1.2 × 1.0 × 1.24 m each', [1, 3, 11, 16, 19], 'sure');
  // white crates (contents not seen)
  const wm = coverMats('white', '#efeee9', '#161616', null, { window: false });
  const w = grp(scene, 16.3, 0, 16.2, Math.PI / 2); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { pallet(w, 1.2, 1.0, i * 1.2); const c = coverMesh(1.22, 1.04, 1.02, wm); c.position.set(j * 1.25, i * 1.2 + .144 + .52, 0); w.add(c); w.children[w.children.length - 2].position.x = j * 1.25; }
  tag(w, 'White crates (contents?)', 'White covers with the black Green Yurts badge, two high. The label side was out of shot in every photo: tell me what is in them.', '≈ 1.2 × 1.0 × 1.2 m each', [1, 3, 11, 16, 19], 'not sure');
  // ovens, black covers
  const om = coverMats('oven', '#1c1d20', '#e9e9e6', 'OVEN', { labelSize: 70 });
  const o = grp(scene, 2.2, 0, 6.6, Math.PI / 2); for (let i = 0; i < 3; i++) { pallet(o, 1.2, 1.0, i * 1.2); const c = coverMesh(1.22, 1.04, 1.02, om); c.position.y = i * 1.2 + .144 + .52; o.add(c); }
  tag(o, 'Oven crates', 'Black covers marked "OVEN", three high: the wood-fired ovens.', '≈ 1.2 × 1.0 × 1.2 m each', [10], 'sure');
  // floor panels: dark hardwood faces, battens below
  const fp = grp(scene, 12.6, 0, 20.4, .1); for (const s of [0, 1]) { let y = 0; for (let i = 0; i < 20; i++) { box(fp, 1.95 - rnd() * .2, .035, 1.15 - rnd() * .15, STD({ map: grain(['#5a3a26', '#6a4430', '#4e3322'][i % 3], '30,20,10') }), s * 1.3 - .65 + (rnd() - .5) * .08, y, (rnd() - .5) * .08); box(fp, 1.8, .012, .06, M.pallet, s * 1.3 - .65, y + .035, .4); y += .048; } }
  tag(fp, 'Floor panels', 'Yurt floor sections: dark hardwood-faced panels with battens underneath, stacked about twenty high and strapped.', '≈ 2.0 × 1.2 m', [1, 11, 16, 19, 50, 54], 'fairly sure');
  // IBC tanks
  const ib = grp(scene, 18.4, 0, 13.6); for (let i = 0; i < 3; i++) { pallet(ib, 1.2, 1.0, i * 1.16); box(ib, 1.1, .95, .95, STD({ color: 0xe8e6dc, roughness: .4, transparent: true, opacity: .9 }), 0, i * 1.16 + .15, 0); const cage = new THREE.Mesh(new THREE.BoxGeometry(1.16, .98, 1.0, 6, 5, 5), new THREE.MeshStandardMaterial({ color: 0x9a9fa3, wireframe: true, metalness: .6 })); cage.position.y = i * 1.16 + .64; ib.add(cage); }
  tag(ib, 'IBC water tanks', 'Caged 1,000 L IBC tanks, three high against the wall.', '1.2 × 1.0 × 1.15 m each', [3, 60], 'sure');
}
