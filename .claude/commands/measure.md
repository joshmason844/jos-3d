---
description: Real sizes from one photo with a bank card or A4 sheet in shot
argument-hint: "<photo path> [card|a4]"
---
Use the photo-measure skill on: $ARGUMENTS

`measure.py detect` finds the card/sheet, then `measure.py measure <img> <out> --ref ... --ref-mm ... --seg ...` (see SKILL.md). Send back the photo marked up with every size and its ±. No photos of people go into this repo.
