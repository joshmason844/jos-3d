---
description: Sculpt or rebuild the 3D people (SDF meshes, labelled by clothes only)
argument-hint: "[what to change]"
---
Use the 3d-models skill (people): $ARGUMENTS

1. `python3 .claude/skills/3d-models/scripts/sculpt/build_people.py` → `work/people_meshes.gz.b64`.
2. `cd .claude/skills/3d-models/scripts/people && python3 build.py` → `people.html`.
- Label people by clothes only. Never names, never photos of people in this repo. People never go into the main Yard in 3D page.
