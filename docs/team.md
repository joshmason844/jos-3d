# The team

How the overnight runs are staffed. Josh set the hierarchy on 15 Oct 2026 and told the team to change the order or roles themselves if a better setup exists. The huddle (below) is where that happens; this file is the result.

## Roles (Josh, 15 Oct evening: leaner, to save usage)
| Role             | Model                                  | Does                                                                                   |
|------------------|----------------------------------------|----------------------------------------------------------------------------------------|
| Boss + builder   | Opus 5.5 (the run itself)              | Plans, picks page and item, decides, and does the hands-on build: BEFORE shots, source change, rebuild, AFTER shots, fixes, scorecard and backlog lines. Holds the blind key, ships, and is the only one who publishes or messages Josh. No separate builder agent |
| Researcher       | Sonnet                                 | Only when an item needs a technique the skill's SKILL.md doesn't hold: one question in, one page back. Changes no files |
| Checker          | Haiku                                  | Error report on every build: console log and page-error list, every BEFORE/AFTER shot for blank or black canvases, missing models, overlapping or off-screen labels, page over 16 MB, failed feature test. Writes `work/review/errors.md` (PASS/FAIL + one line per problem). A FAIL goes back to the build first |
| Reviewer         | Opus 5.5, fresh each time              | Hired only on every 5th run of the night (5th, 10th, …) and on anything shown to Josh (before/after picture, 07:xx summary). Reviews every build shipped since the last review, blind (X/Y in an order only the boss knows), against docs/standard.md |

## Who builds what (Josh, 15 Oct late)
- **Opus 5.5 (bulk worker): detail and placement.** Section by section, get every item in its right spot and built in detail from the scan and photos: rack contents bay by bay, stacks, labels, what's really on each shelf.
- **Floor and ceiling jobs** (Josh's note, 15 Oct late, wanted them handed to Sonnet and the simplest tweaks to Haiku): the overnight brief (Josh, 15 Oct evening) says no builder agents and Sonnet changes no files, and it overrides this file where they differ. So on overnight runs Opus builds floor and ceiling items too, as its own run, one item per run; Haiku still checks them. If Josh wants Sonnet building them, the overnight brief needs changing first.
- **Locked, leave alone:** things that are already good and in the right place. Don't rebuild them, only nudge position if the scan says so. Locked now: the forklift, cardboard boxes / ply crates / totes / jerry cans (yard builders), crown crates and their covers, the trellis, pallets.

## Order
1. Boss reads the docs and picks the page and item. Items under "Josh's requests" in the backlog always come first.
2. Researcher, only if needed.
3. Boss builds and shoots.
4. Checker (Haiku) writes the error report; a FAIL goes back to the build first.
5. Ship rule: checker PASS, no line of the standard drops, AFTER beats BEFORE. On non-review runs the boss scores it honestly and marks the scorecard "self-scored, review due". For a Josh's-request feature: checker PASS and the headless test proves it works.
6. On review runs, the fresh Opus reviewer scores all builds since the last review. If it finds a shipped build made things worse, the next run reverts it.
7. Boss writes the records, commits, publishes. One "Meeting:" line in the scorecard is enough for the team meeting.

## Huddle
On the first run of each night (23:xx), before any work, the boss weighs in one line each: is there a better order, or a role another model would do better? The boss decides, updates this file and logs it below. Changes start that run. (Kept in the boss's head now; no agents hired for it.)

## Log
- 15 Oct: first huddle (Opus and Sonnet asked). Agreed: research moves up front and gets a size limit; the review goes blind; ship becomes a rule; the builder drafts the records. Not taken: a minimum +0.5 gain to ship (recent good runs gained 0.1–0.4) and swapping in Sonnet reviewers (it would make the scores even less consistent between runs). Still open: saved anchor images so reviewers mark the same way from night to night.
- 15 Oct (Josh): Haiku joins as the checker. It writes an error report on every build before the expensive review.
- 15 Oct (Josh): Josh's requests jump the queue. First two: merge the yard model into the workshop warehouse, then a yard planner on it.
- 15 Oct evening (Josh, to save usage): Fable steps out of the overnight runs. Opus 5.5 is boss and builder in one; Sonnet only for research the skill doesn't hold; Haiku checks every build; a fresh Opus reviewer only every 5th run and on anything shown to Josh. Non-review runs ship on checker PASS plus the boss's honest look, marked "self-scored, review due".
- 15 Oct, 23:0x huddle (night of 15–16 Oct): no further change. Parked idea: a fixed set of camera poses per page saved in the repo, so self-scores and the 5th-run review compare the exact same shots.
- 15 Oct late (Josh): Opus is the bulk worker on detail and placement, section by section; floor and ceiling jobs go to Sonnet (simplest tweaks to Haiku); things already good and in place (forklift, boxes, crates, trellis, pallets) are locked.
- 16 Oct, 00:0x (run 2): brought "Who builds what" back in line with the overnight brief: floor/ceiling items are built by Opus on overnight runs, not handed to Sonnet (the brief says no builder agents, Sonnet changes no files). Josh to say if he wants that changed.
