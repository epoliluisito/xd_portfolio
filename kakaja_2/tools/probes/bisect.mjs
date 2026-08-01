/* Render the same die under lighting variants and read the pixels back in the
   same task, so drawImage still sees the drawing buffer. */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join, normalize } from 'path';
const ROOT = new URL('../../', import.meta.url).pathname;
const server=createServer(async(req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/')p='/index.html';
 const f=join(ROOT,normalize(p));await stat(f);res.writeHead(200,{'content-type':extname(f)==='.html'?'text/html':'text/javascript'});res.end(await readFile(f));}
 catch{res.writeHead(404);res.end('');}});
const PORT=8670+(process.pid%90); await new Promise(r=>server.listen(PORT,r));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
 args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
page.on('pageerror',e=>console.log('PAGEERROR',e.message));
await page.goto(`http://localhost:${PORT}/`,{waitUntil:'load'});
await page.waitForFunction(()=>!!window.KAKAJA,{timeout:20000});
await page.waitForTimeout(1200);
console.log(await page.evaluate(() => {
  const K=window.KAKAJA, T=K.THREE;
  K.Game.seat(2); K.Game.state='IDLE'; K.UI.show('hud'); K.Game.busy=true;
  const set=K.__ensure(1);
  const d=set[0];
  // Lay the die flat (local +Y up = axis 2) and print a 5 on that face.
  d.body.type=K.CANNON.Body.STATIC; d.body.collisionResponse=false;
  d.body.position.set(0, K.CFG.die.size/2, -1.35);
  d.body.quaternion.set(0,0,0,1); d.body.sleep();
  d.group.visible=true; d.setLabel(K.__sim.labelFor(2, 5, Math.random), 5);
  d.sync(); d.setLook();

  const lights={}; K.scene.traverse(o=>{ if(o.isLight) lights[o.type]=lights[o.type]||[], lights[o.type].push(o); });
  const lamp=lights.SpotLight[0], saved=lights.SpotLight[1];
  const dir=lights.DirectionalLight[0], hemi=lights.HemisphereLight[0];

  const cv=document.createElement('canvas');
  const ctx=cv.getContext('2d',{willReadFrequently:true});
  const p=d.group.position.clone().project(K.camera);
  const cx=(p.x*.5+.5)*innerWidth, cy=(-p.y*.5+.5)*innerHeight;
  const meas=(label)=>{
    K.renderer.render(K.scene,K.camera);
    const src=K.renderer.domElement;
    cv.width=src.width; cv.height=src.height;
    ctx.drawImage(src,0,0);
    const dpr=src.width/innerWidth, s=24;
    const im=ctx.getImageData(Math.round(cx*dpr-s/2),Math.round(cy*dpr-s/2),s,s).data;
    const lum=[]; for(let i=0;i<s*s;i++) lum.push(.299*im[i*4]+.587*im[i*4+1]+.114*im[i*4+2]);
    lum.sort((a,c)=>a-c);
    return `${label}: median ${lum[Math.floor(lum.length*.5)].toFixed(0)}  p95 ${lum[Math.floor(lum.length*.95)].toFixed(0)}`;
  };
  const out=[];
  out.push(meas('as-shipped                '));
  const e0=K.renderer.toneMappingExposure;
  K.renderer.toneMappingExposure=1.12; out.push(meas('exposure back to 1.12     '));
  K.renderer.toneMappingExposure=e0;
  const a0=lamp.angle,p0=lamp.penumbra,i0=lamp.intensity;
  lamp.angle=0.62; lamp.penumbra=0.72; lamp.intensity=2600; out.push(meas('lamp back to old cone     '));
  lamp.angle=a0; lamp.penumbra=p0; lamp.intensity=i0;
  const nb=lamp.shadow.normalBias; lamp.shadow.normalBias=0; out.push(meas('normalBias off            '));
  lamp.shadow.normalBias=nb;
  const cs=lamp.castShadow; lamp.castShadow=false; out.push(meas('lamp shadow off           '));
  lamp.castShadow=cs;
  lamp.intensity=i0*2; out.push(meas('lamp intensity x2         ')); lamp.intensity=i0;
  const env=K.scene.environment; K.scene.environment=null; out.push(meas('environment off           ')); K.scene.environment=env;
  return out.join('\n') + `\n  camera dist to die: ${K.camera.position.distanceTo(d.group.position).toFixed(1)}  lamp y ${lamp.position.y}`;
}));
await b.close(); server.close();
