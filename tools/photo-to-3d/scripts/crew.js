// ---------- people (test of the human models; this variant only, never the main Yard in 3D page) ----------
{ const crewG = new THREE.Group(); crewG.name = 'People'; window.__crewG = crewG; scene.add(crewG);
  (async () => { // load after the photo depth pass has run, so the floor behind them still shows the photo
    const D = await loadPeople(document.getElementById('pd').textContent);
    const place = (d, x, z, look, what, sure) => { const p = buildPerson(d); p.position.set(x, 0, z); p.rotation.y = Math.atan2(look[0] - x, look[1] - z); crewG.add(p);
      return tagIt(p, 'Person: ' + d.label.toLowerCase(), what, `${d.height.toFixed(2)} m tall`, sure); };
    place(D.grey, 2.0, 8.6, [5.54, 12.43], 'Sculpted from your video: sage tee, loose black trousers, white trainers, fair hair swept back and a full beard, arms out by the forklift. Height read against the forklift guard (2.16 m), about ±8 cm.', 'fairly sure');
    place(D.kdk, 3.5, 9.4, [5.54, 12.43], 'Sculpted from your videos: white KDK tee, charcoal joggers with a drawstring, grey trainers, messy dark hair and stubble, arms out palms up like in your new video. Height not measured yet: set to 1.80 m.', 'not sure');
    window.__crewReady = true; })(); }
