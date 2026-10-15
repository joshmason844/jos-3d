// Dump the baked floor texture of a built multi-photo page top-down. usage: NODE_PATH=$(npm root -g) node floortex.js <page.html> <out.png>
const { chromium } = require('playwright'); const path=require('path'); const fs=require('fs');
const C = process.env.HOME + '/.cache/jos3d/';
(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:400,height:400}});
await p.route(/cdn\.jsdelivr\.net/, r => { const m = r.request().url().match(/three@[^/]+\/(.*)$/); return m ? r.fulfill({ path: C + 'three-r180/' + m[1], contentType: 'text/javascript' }) : r.abort(); });
await p.route(/fonts\./, r => r.abort());
await p.goto('file://'+path.resolve(process.argv[2])); await p.waitForFunction(()=>window.__ready,null,{timeout:300000});
const d=await p.evaluate(()=>window.__floorCanvas.toDataURL());fs.writeFileSync(process.argv[3],Buffer.from(d.split(',')[1],'base64'));await b.close();})();
