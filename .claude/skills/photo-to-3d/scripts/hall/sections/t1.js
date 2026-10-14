const {chromium}=require('playwright');const path=require('path');(async()=>{
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const C=process.env.HOME+'/.cache/jos3d/';
const f=process.argv[2]||'sec1.html';
for(const [w,h] of [[1200,800],[390,844]]){const p=await b.newPage({viewport:{width:w,height:h}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED/.test(m.text()))errs.push(m.text())});
await p.route(/cdn\.jsdelivr\.net/,r=>{const m=r.request().url().match(/three@[^/]+\/(.*)$/);return m?r.fulfill({path:C+'three-r180/'+m[1],contentType:'text/javascript'}):r.abort();});await p.route(/fonts\./,r=>r.abort());
await p.goto('file://'+path.resolve(f));await p.waitForFunction(()=>window.__ready,null,{timeout:300000});await p.waitForTimeout(3000);
const shots=w>500?[['model',()=>{}],['match50',()=>{window.__match(true);window.__skin(true,.5)}],['match0',()=>{window.__skin(true,0.001)}],['skin-orbit',()=>{window.__match(false);window.__skin(true,1);window.__cam(window.__SEC.home[0].map((v,i)=>v+[3,0.5,-2][i]),window.__SEC.home[1])}],['inside',()=>{window.__skin(false);document.querySelectorAll('#bar button')[0].click();window.__cam([2.6,3.2,3.4],[.6,1.6,-.5])}]]:[['model',()=>{}],['match50',()=>{window.__match(true);window.__skin(true,.5)}]];
for(const [n,fn] of shots){await p.evaluate(fn);await p.waitForTimeout(n==='inside'?5000:3500);await p.screenshot({path:`${f.replace('.html','')}-${n}-${w}.png`,timeout:240000});}
console.log(w,'errors',errs);await p.close();}await b.close();})();
