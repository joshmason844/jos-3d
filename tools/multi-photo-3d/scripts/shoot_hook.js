// Paste into a photo-to-3d page's module (before window.__ready) to render ground-truth test photos with shoot_test_set.js.
window.__shot = (pos, tgt) => {
  setMode('model'); bell.visible = false; selBox.visible = false;
  if (!window.__a4) { const a = new THREE.Mesh(new THREE.PlaneGeometry(.297, .21), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); a.rotation.x = -Math.PI / 2; a.rotation.z = .4; a.position.set(3.4, .006, 7.2); scene.add(a); window.__a4 = a; }
  camera.position.fromArray(pos); controls.target.fromArray(tgt); camera.lookAt(controls.target); camera.updateMatrixWorld(); renderer.render(scene, camera);
  return { img: renderer.domElement.toDataURL('image/jpeg', .93), fov: camera.fov, w: renderer.domElement.width, h: renderer.domElement.height, mw: camera.matrixWorld.elements };
};
