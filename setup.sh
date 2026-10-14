#!/usr/bin/env bash
# One-off: fetch Three.js r180 (and Spark for splats) into ~/.cache/jos3d. npm and CDNs are often blocked; plain git to GitHub works.
set -e
C="${JOS3D_CACHE:-$HOME/.cache/jos3d}"; mkdir -p "$C"
[ -f "$C/three-r180/build/three.module.js" ] || { git clone -q -c advice.detachedHead=false --depth 1 --branch r180 --filter=blob:none --sparse https://github.com/mrdoob/three.js "$C/three-r180" && (cd "$C/three-r180" && git sparse-checkout set build examples/jsm); }
[ -f "$C/spark/dist/spark.module.js" ] || { git clone -q --depth 1 --filter=blob:none --sparse https://github.com/sparkjsdev/spark "$C/spark" && (cd "$C/spark" && git sparse-checkout set dist); }
pip install --break-system-packages -q numpy scipy opencv-python-headless scikit-image pillow 2>/dev/null || pip install -q numpy scipy opencv-python-headless scikit-image pillow
echo "Ready. Headless tests need Playwright + Chromium (npm i -g playwright)."
