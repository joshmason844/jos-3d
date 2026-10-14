---
description: Rebuild the Main hall in 3D (v3 remodel or the five photo-fitted sections) and check it headless
argument-hint: "[v3 | sections | <what changed>]"
---
Use the photo-to-3d skill. Main hall work: $ARGUMENTS

- v3 remodel (default): edit `.claude/skills/photo-to-3d/scripts/hall/v3/hall3.js`, then `cd` there and run `python3 build.py` → `hall3.html` (already stamped with its "code ↗" link).
- Sections: `cd .claude/skills/photo-to-3d/scripts/hall/sections && python3 build.py sec<1-5> "Title" "H1" "blurb"`, then `python3 combine.py` for the merged hall.
- Check it: `NODE_PATH=$(npm root -g) node t3.js 1200 800 '[["front","0",3000]]'` and look at `r-front.png`. No page errors allowed.
- Keep Josh's kit facts (CLAUDE.md). Unsure items get the orange "not sure" tag, never a guess dressed as fact.
- Log the build in `docs/scorecard.md`. If running in the Claude app, republish to the Main hall artifact in `docs/pages.md`.
