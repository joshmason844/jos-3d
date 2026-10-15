# jos-3d: how to work here

Josh's 3D toolkit for Green Yurts kit and spaces. Open this folder in Claude Code and the tools are skills (`.claude/skills/`) and slash commands (`.claude/commands/`).

## Rules
- **No paid credits, no free trials, no ArtCraft (Josh, 15 Oct 2026).** Only our own code, free open-source libraries and free public data. Never sign up for, spend on or call a paid or free-trial service, and never use ArtCraft's apps, API or models.
- **Public repo.** Never commit keys, tokens, passwords, crew names or photos of people. People are labelled by clothes only.
- People never go into the main Yard in 3D page.
- Don't post or send anything without Josh's yes.
- Every count from a photo comes with a marked-up photo as evidence. Unsure items get an orange "not sure" tag, never a guess dressed up as fact.
- Each build should beat the last one: log it in `docs/scorecard.md`.

## How the work is staffed
Every chat and run works as the team in `docs/team.md`: Fable as CEO, Opus 5.5 builds, Sonnet researches, Haiku writes the error report, a fresh Opus reviews. Josh wants this in all chats, not just the overnight runs.

## Commands
| Command     | What it does                                              |
|-------------|-----------------------------------------------------------|
| `/hall`     | Rebuild the Main hall (v3 remodel or the five sections)   |
| `/measure`  | Real sizes from one photo with a card or A4 sheet in shot |
| `/photo-3d` | Photos of a space → solved camera → measured 3D page      |
| `/scan`     | iPhone scan (splat, GLB, PLY) → page to spin and measure  |
| `/render`   | Stills and turntables of any page or model                |
| `/people`   | Sculpt or rebuild the 3D people                           |

## Build and test
- First time: `./setup.sh` (Three.js r180 + Spark into `~/.cache/jos3d`, Python libs) and `npm i` (Playwright). On Windows run it from Git Bash.
- Each page has a `build.py` next to its source. It writes the HTML and stamps a "code ↗" link back to that folder on GitHub (`bin/link_code.py`).
- Headless check: Playwright + Chromium with SwiftShader; requests to jsdelivr are routed to the local cache. Zero page errors, then look at the screenshot.
- Inputs go in `photos/`, generated data in `work/` (both git-ignored).
- Publishing to claude.ai artifacts only works from the Claude app. On the laptop, open the HTML file in a browser. `docs/pages.md` lists every page, its artifact and its source.

## Josh's kit facts
- 16 ft yurt = 4 trellis sections + a double door. 14 ft = 3 trellis per door, 5 doors per 14 ft stillage.
- Pole stillages: red = 16 and 12 ft, blue = 14 ft. Pole lengths (Josh, 15 Oct): a 16 ft yurt's poles are 8 ft (2.44 m), 14 ft = 7 ft (2.13 m), 12 ft = 6 ft (1.83 m). Half the yurt size; replaces the old geometry guess (2.3 / 2.0 / 1.7 m).
- Bags: green = Emperors, grey and beige = bells, pink = unknown. Tags: lime = good, red = bad.
- Black ribbed boxes strapped in pairs on the racking = planters.
- White crates = safari tents. 6×6 = marquee. Timber blocks on the racking = yurt doors.
- Crates 1.2 × 1.0 m, 1.24 m a level. Crowns: 12 ft ×4, 14 ft ×7, 16 ft ×7 crates. 16 ft canvas in the far corner and along the right wall.
- The "Main hall" is the workshop warehouse, called **WW** for short: use "WW" in messages and "Workshop warehouse (WW)" in page titles.
- Mezzanine on the left as you walk in, about 8 × 4 m, sewing room on top.
- The yard bay (orange racking, planters, workbench) is part of the WW, along its right side. LiDAR scan (15 Oct) is private: off-season-reset `scans/`. Never put scans in this public repo.
