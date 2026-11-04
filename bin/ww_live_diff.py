#!/usr/bin/env python3
"""What really differs between the live WW page and a fresh build, comments stripped (3 Nov 23:xx).
usage: ww_live_diff.py LIVE.html BUILT.html
Run it at the start of a WW run: live can be ahead of the repo. Prints each differing block; anything marked LIVE ONLY is code the source hasn't got."""
import re, sys, difflib
def norm(p):
    out = []
    for l in open(p, encoding='utf8').read().split('\n'):
        l = re.sub(r"/\*.*?\*/", "", re.sub(r"(?<![:'\"])\s*//[^'\"`]*$", "", l)).rstrip()
        if l.strip(): out.append(l)
    return out
a, b = norm(sys.argv[1]), norm(sys.argv[2])
for t, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
    if t == 'equal': continue
    if i2 > i1: print(f'LIVE ONLY {i2 - i1} lines: {a[i1][:110]}')
    if j2 > j1: print(f'BUILD ONLY {j2 - j1} lines: {b[j1][:110]}')
