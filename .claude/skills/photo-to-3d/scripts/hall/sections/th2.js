const {chromium}=require('playwright');const path=require('path');(async()=>{
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const C=process.env.HOME+'/.cache/jos3d/';
for(const [w,h] of [[1200,800],[390,844]]){const p=await b.newPage({viewport:{width:w,height:h}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED/.test(m.text()))errs.push(m.text())});
await p.route(/cdn\.jsdelivr\.net/,r=>{const m=r.request().url().match(/three@[^/]+\/(.*)$/);return m?r.fulfill({path:C+'three-r180/'+m[1],contentType:'text/javascript'}):r.abort();});await p.route(/fonts\./,r=>r.abort());
await p.goto('file://'+path.resolve('hall2.html'));await p.waitForFunction(()=>window.__ready,null,{timeout:400000});await p.waitForTimeout(3000);
const shots=w>500?[['door',()=>window.__view('door')],['top',()=>window.__view('top')],['far',()=>window.__view('far')],['s3',()=>window.__sec(2)],['s1in',()=>{window.__sec(0);window.__inside()}]]:[['door',()=>window.__view('door')]];
for(const [n,fn] of shots){await p.evaluate(fn);await p.waitForTimeout(4500);await p.screenshot({path:`h2-${n}-${w}.png`,timeout:300000});}
console.log(w,'errors',errs);await p.close();}await b.close();})();
