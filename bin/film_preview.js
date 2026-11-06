// Fast look at a stillage stack with the WW film and load, no whole page: about 40 s instead of 9 min. Grey room, not for BEFORE/AFTER. usage: NODE_PATH=$(npm root -g) node bin/film_preview.js out.png "cx,cy,cz,tx,ty,tz" ["cx,…" …]
const { chromium } = require('playwright'), fs = require('fs'), os = require('os'), path=require('path');
const R=path.join(__dirname,'..')+'/', V=R+'.claude/skills/photo-to-3d/scripts/hall/v3/', C=os.homedir()+'/.cache/jos3d/';
let kit=fs.readFileSync(V+'kit.js','utf8'); for(const f of ['trellis']) kit+='\n'+fs.readFileSync(R+`.claude/skills/3d-models/scripts/${f}.js`,'utf8').replace("import * as THREE from 'three';\n",'').replace(/^export /gm,'');
const src=fs.readFileSync(V+'hall3.js','utf8'); const a=src.slice(0,src.indexOf('// ---------------- the floor (15–16 Oct)'));
const i=src.indexOf('// trellis loads: folded'), j=src.indexOf('// bags\n'); const b=src.slice(i,j);
const html=`<!doctype html><body style="margin:0"><canvas id=c width=780 height=780></canvas><script type=importmap>{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/"}}</script>
<script type=module>import * as THREE from 'three'; import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'; import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
const THREE_ADDONS={mergeGeometries}; const CT=THREE.CanvasTexture; const r=new THREE.WebGLRenderer({canvas:document.getElementById('c'),antialias:true,preserveDrawingBuffer:true}); r.toneMapping=THREE.ACESFilmicToneMapping; r.toneMappingExposure=1.05; r.shadowMap.enabled=true; r.shadowMap.type=THREE.PCFSoftShadowMap;
${kit}
${a}
${b}
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x4a4a48); scene.environment=new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(),.04).texture; scene.environmentIntensity=.35;
scene.add(new THREE.HemisphereLight(0xe8eef5,0x5d5a52,1.15)); const sun=new THREE.DirectionalLight(0xfff1de,1.6); sun.position.set(12,20,10); sun.castShadow=true; sun.shadow.mapSize.setScalar(2048); Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8}); scene.add(sun);
const fl=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshStandardMaterial({color:0x8c8c88,roughness:.9})); fl.rotation.x=-Math.PI/2; fl.receiveShadow=true; scene.add(fl);
const P=new THREE.Group(); scene.add(P); const L5={sets:5,per:3,doors:1,tight:true}; trellisStillages(P,0,0,0,[L5,L5,L5]);
const cam=new THREE.PerspectiveCamera(46,1,.05,80); window.shot=c=>{cam.position.set(c[0],c[1],c[2]);cam.lookAt(c[3],c[4],c[5]);r.render(scene,cam);return document.getElementById('c').toDataURL('image/png');}; window.__ready=1;</script>`;
(async()=>{const f=path.join(os.tmpdir(),'film_prev.html'); fs.writeFileSync(f,html); const br=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']}), p=await br.newPage({viewport:{width:800,height:800}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.route(/cdn\.jsdelivr\.net/,r=>{const m=r.request().url().match(/three@[^/]+\/(.*)$/);return m?r.fulfill({path:C+'three-r180/'+m[1],contentType:'text/javascript'}):r.abort();});
await p.goto('file://'+f); await p.waitForFunction(()=>window.__ready,null,{timeout:200000}).catch(e=>console.log('timeout',errs)); let k=0; for(const c of process.argv.slice(3)){const d=await p.evaluate(c=>window.shot(c),c.split(',').map(Number)); fs.writeFileSync(process.argv[2].replace('.png',`-${k++}.png`),Buffer.from(d.split(',')[1],'base64'));} console.log(errs.slice(0,5).join('\n')); await br.close();})();
