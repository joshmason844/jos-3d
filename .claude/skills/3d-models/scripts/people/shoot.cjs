// Close-up shots of the people page for before/after checks: node shoot.cjs people.html work/shots/<tag> [face,hand]
const {chromium}=require('playwright');const path=require('path');(async()=>{
const [page,pre,only]=process.argv.slice(2);
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const C=process.env.HOME+'/.cache/jos3d/';
const p=await b.newPage({viewport:{width:700,height:700}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/cdn\.jsdelivr\.net/,r=>{const m=r.request().url().match(/three@[^/]+\/(.*)$/);return m?r.fulfill({path:C+'three-r180/'+m[1],contentType:'text/javascript'}):r.abort();});await p.route(/fonts\./,r=>r.abort());
await p.goto('file://'+path.resolve(page));await p.waitForFunction(()=>window.__ready,null,{timeout:600000});
await p.evaluate(()=>{for(const e of document.body.children)if(e.tagName!=='CANVAS'&&e.tagName!=='SCRIPT'&&!e.querySelector('canvas'))e.style.visibility='hidden';});
const shots={
 g_face:['grey',[.12,1.76,.62],[0,1.73,.04]], g_face3q:['grey',[.38,1.76,.42],[0,1.73,0]],
 g_hand:['grey',[.75,.95,.45],[.40,.90,.05]], g_hand_b:['grey',[.15,.95,.65],[.38,.9,.05]],
 k_face:['kdk',[.12,1.69,.6],[0,1.66,.04]], k_face3q:['kdk',[-.38,1.69,.42],[0,1.66,0]],
 k_hand:['kdk',[.85,1.25,.55],[.6,1.12,.17]], k_full:['kdk',[.5,1.2,3.6],[0,.95,0]]};
for(const [n,[w,c,t]] of Object.entries(shots).filter(([n])=>!only||only.split(',').some(o=>n.includes(o)))){await p.evaluate(([w,c,t])=>{__show(w);__cam(c,t);},[w,c,t]);await p.waitForTimeout(2500);await p.screenshot({path:`${pre}-${n}.png`,timeout:300000});}
console.log('errors',errs);await b.close();})();
