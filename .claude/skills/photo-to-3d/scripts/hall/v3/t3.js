const {chromium}=require('playwright');const path=require('path');(async()=>{
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const C=process.env.HOME+'/.cache/jos3d/';
const W=+(process.argv[2]||1200),H=+(process.argv[3]||800);const shots=JSON.parse(process.argv[4]||'[]');
const p=await b.newPage({viewport:{width:W,height:H}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED/.test(m.text()))errs.push(m.text());else if(/baked/.test(m.text()))console.log(m.text())});
await p.route(/cdn\.jsdelivr\.net/,r=>{const m=r.request().url().match(/three@[^/]+\/(.*)$/);return m?r.fulfill({path:C+'three-r180/'+m[1],contentType:'text/javascript'}):r.abort();});await p.route(/fonts\./,r=>r.abort());
const t0=Date.now();await p.goto('file://'+path.resolve('hall3.html'));await p.waitForFunction(()=>window.__ready,null,{timeout:600000});console.log('ready s',(Date.now()-t0)/1000);
for(const [n,js,wait] of shots){await p.evaluate(js);await p.waitForTimeout(wait||4000);await p.screenshot({path:`r-${n}.png`,timeout:400000});console.log('shot',n,(Date.now()-t0)/1000);}
console.log('errors',errs);await b.close();})();
