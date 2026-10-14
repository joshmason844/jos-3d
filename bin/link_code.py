"""Stamp a page with a link to its source on GitHub: python3 bin/link_code.py page.html <repo path> [<repo path> ...]
Adds a small fixed "code ↗" tab (top-right corner) and an HTML comment naming the source, replacing any earlier stamp."""
import re, sys
BASE = 'https://github.com/joshmason844/jos-3d/tree/main/'
page, paths = sys.argv[1], sys.argv[2:]
s = open(page, encoding='utf-8').read()
s = re.sub(r'<!-- jos-3d source:.*?<!-- /jos-3d -->\n?', '', s, flags=re.S)
url = BASE + paths[0]
stamp = (f'<!-- jos-3d source: {" , ".join(paths)} -->\n'
         f'<a id="jos3dCode" href="{url}" target="_blank" rel="noopener" title="Source code for this page: {paths[0]}" '
         'style="position:fixed;right:0;top:env(safe-area-inset-top);z-index:20;font:500 10px/1 \'IBM Plex Mono\',ui-monospace,monospace;'
         'letter-spacing:.08em;text-transform:uppercase;color:#9fb4cc;background:rgba(11,21,48,.78);border:1px solid rgba(159,180,204,.3);padding:3px 7px;text-decoration:none">code ↗</a>\n'
         '<!-- /jos-3d -->\n')
s = s.replace('</body>', stamp + '</body>', 1) if '</body>' in s else s + stamp
open(page, 'w', encoding='utf-8').write(s); print('stamped', page, '→', url)
