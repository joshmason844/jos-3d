---
description: Turn photos of a space into a measured 3D page (one photo, or a set for photogrammetry)
argument-hint: "<photo(s)> [what to find out]"
---
Photos: $ARGUMENTS

- One photo: photo-to-3d skill. `solve.py` (camera) → `annotate.py` (marked photo, green lines on real edges) → `model.js` → `bake.py` → `build.py`.
- Several photos of the same thing: multi-photo-3d skill, `python3 .claude/skills/multi-photo-3d/scripts/sfm.py photos/<set> work/<set> --a4 --dense`.
- Every count comes with a marked-up photo as evidence. Put inputs in `photos/` and generated data in `work/` (both git-ignored).
