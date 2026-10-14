const {chromium}=require('playwright');const path=require('path');const fs=require('fs');(async()=>{
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const C=process.env.HOME+'/.cache/jos3d/';
const p=await b.newPage({viewport:{width:1200,height:900},deviceScaleFactor:1});await p.route(/cdn\.jsdelivr\.net/,r=>{const m=r.request().url().match(/three@[^/]+\/(.*)$/);return m?r.fulfill({path:C+'three-r180/'+m[1],contentType:'text/javascript'}):r.abort();});await p.route(/fonts\./,r=>r.abort());
await p.goto('file://'+path.resolve('yard-3d.html'));await p.waitForFunction(()=>window.__ready,null,{timeout:120000});await p.waitForTimeout(3000);
const out='../sfm/shots/';const cams=[];const N=24;
for(let i=0;i<N;i++){const t=i/(N-1);const x=-1.0+9.0*t, z=10.2+Math.sin(t*Math.PI)*0.8, y=1.55+0.15*Math.sin(i*1.7);
 const pos=[x,y,z], tgt=[x*0.7+1.2+0.6*Math.sin(i), 1.6, 1.0];
 const r=await p.evaluate(([a,b])=>window.__shot(a,b),[pos,tgt]);fs.writeFileSync(out+`img${String(i).padStart(2,'0')}.jpg`,Buffer.from(r.img.split(',')[1],'base64'));cams.push({pos,tgt,fov:r.fov,w:r.w,h:r.h,mw:r.mw});if(i===0)fs.writeFileSync(out+'a4.json',JSON.stringify(r.a4));}
fs.writeFileSync(out+'truth.json',JSON.stringify(cams));console.log('shots',N,cams[0].w,cams[0].h,cams[0].fov);await b.close();})();
