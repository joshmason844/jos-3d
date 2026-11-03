#!/usr/bin/env python3
"""WW publish copy: live page + the new block(s) from a fresh build, so the live page's keycaps and edited comments stay.
usage: ww_publish_copy.py LIVE.html BUILT.html OUT.html
Drops the artifact wrapper (first line, last </body></html>), then inserts every run of 5+ lines the build has and the live page hasn't,
at the matching spot. Smaller differences (comment edits, version tags) keep the live line. Prints what went in; check it before publishing."""
import sys, difflib
live, built, out = sys.argv[1:4]
a = open(live, encoding='utf8').read().split('\n'); b = open(built, encoding='utf8').read().split('\n')
if a[-1] == '</body></html>' and a[0].startswith('<!doctype html><html><head><meta charset=utf8>'): a = a[1:-1]
res, added = [], 0
for t, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
    res += a[i1:i2]
    if (j2 - j1) - (i2 - i1) >= 5:   # a block the live page hasn't got: keep the build's new lines, before the live ones they displaced
        keep = (j2 - j1) - (i2 - i1); res[len(res) - (i2 - i1):len(res) - (i2 - i1)] = b[j1:j1 + keep]; added += keep; print('added', keep, 'lines at', j1 + 1, b[j1][:90])
open(out, 'w', encoding='utf8').write('\n'.join(res)); print(added, 'lines added;', round(len('\n'.join(res).encode()) / 1e6, 2), 'MB')
