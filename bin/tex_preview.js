// 31 Oct 23:xx: preview one canvas-texture builder from hall3.js in seconds, no WebGL, no 5-minute shot.
// usage: NODE_PATH=$(npm root -g) node bin/tex_preview.js <hall3.js> <const name> <out.png> [args JSON list, e.g. "[[0],[1],[2]]"] [phone scale, default .45]
// Pulls `const <name> = (...) => { ... };` out of the source by brace matching, stubs THREE/STD so the builder returns its canvas,
// and lays each call's canvas out at full size and at the phone scale (≈ how many screen px the part gets in a close-up).
const { chromium } = require('playwright'); const fs = require('fs');
const [src, name, out, argsJ, sc] = process.argv.slice(2); const s = fs.readFileSync(src, 'utf8');
const i0 = s.indexOf(`const ${name} = `); if (i0 < 0) throw new Error('not found: ' + name);
let i = s.indexOf('{', s.indexOf('=>', i0)), d = 0; for (; i < s.length; i++) { if (s[i] === '{') d++; else if (s[i] === '}' && --d === 0) break; }
if (s.slice(i + 1, i + 4) === ')()') i += 3;   // an IIFE: const X = (() => { ... })();
const fn = s.slice(i0, i + 1) + ';';
const pre = (s.match(new RegExp(`(?:const|let) [A-Z]+ = (?:null|\\[\\]);[^\\n]*?(?=const ${name})`)) || [''])[0];
(async () => { const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  await p.setContent('<body style="margin:0;background:#444"></body>');
  const n = await p.evaluate(([code, args, k]) => { const THREE = { CanvasTexture: function (c) { this.image = c; }, SRGBColorSpace: 1, RepeatWrapping: 1 }, STD = o => o;
    const f = new Function('THREE', 'STD', code.pre + code.fn + `; return ${code.name};`)(THREE, STD);
    for (const a of args) { const m = typeof f === 'function' ? f(...a) : f, c = m.map.image, row = document.createElement('div'); row.style.cssText = 'display:flex;gap:12px;align-items:flex-start;margin:6px';
      const big = document.createElement('img'); big.src = c.toDataURL(); const sm = big.cloneNode(); sm.style.width = Math.round(c.width * k) + 'px';
      row.append(big, sm); document.body.append(row); } return args.length; }, [{ pre, fn, name }, JSON.parse(argsJ || '[[]]'), +(sc || .45)]);
  await p.waitForTimeout(300); await p.screenshot({ path: out, fullPage: true }); await b.close(); console.log('previewed', n, '→', out); })();
