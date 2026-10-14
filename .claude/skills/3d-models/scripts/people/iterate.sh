#!/usr/bin/env bash
# One command per people iteration: rebuild → page → close-ups → before/after sheet against the last run.
#   .claude/skills/3d-models/scripts/people/iterate.sh <tag> [--only head,hair,beard] [--fast] [--shots face,hand] [keys...]
# --only rebuilds just those meshes (ids: body,head,hand,tee,trousers,shoe,sole,hair,beard); --fast is a coarse preview (~4x quicker).
set -e
ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"; D="$ROOT/.claude/skills/3d-models/scripts"
TAG="$1"; shift; ONLY=""; SHOTS=""; KEYS=(); export PEOPLE_FAST=1
while [ $# -gt 0 ]; do case "$1" in --only) ONLY="$2"; shift 2;; --fast) PEOPLE_FAST=1.6; shift;; --shots) SHOTS="$2"; shift 2;; *) KEYS+=("$1"); shift;; esac; done
mkdir -p "$ROOT/work/shots"; LAST="$(cat "$ROOT/work/shots/LAST" 2>/dev/null || true)"
python3 "$D/sculpt/build_people.py" "$ROOT/work/people_meshes.json" "${KEYS[@]}" ${ONLY:+--only "$ONLY"} | grep -E "built|Error"
(cd "$D/people" && python3 build.py >/dev/null)
NODE_PATH="${NODE_PATH:-$(npm root -g)}" node "$D/people/shoot.cjs" "$D/people/people.html" "$ROOT/work/shots/$TAG" "$SHOTS"
[ -n "$LAST" ] && python3 "$D/people/compare.py" "$ROOT/work/shots/$LAST" "$ROOT/work/shots/$TAG" "$ROOT/work/shots/$LAST-vs-$TAG.png"
echo "$TAG" > "$ROOT/work/shots/LAST"
