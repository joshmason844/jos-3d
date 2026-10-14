---
description: Sculpt or rebuild the 3D people (SDF meshes, labelled by clothes only)
argument-hint: "[what to change]"
---
Use the 3d-models skill (people): $ARGUMENTS

Loop (each round ~1–2 min): `.claude/skills/3d-models/scripts/people/iterate.sh <tag> [--only head,hair,beard] [--fast] [--shots face,hand]`, then look at `work/shots/<last>-vs-<tag>.png`. Ship only a full (not --fast) build.
- Label people by clothes only. Never names, never photos of people in this repo. People never go into the main Yard in 3D page.
