import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join, normalize } from 'path';
const ROOT = new URL('../../', import.meta.url).pathname;
const server=createServer(async(req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/')p='/index.html';
 const f=join(ROOT,normalize(p));await stat(f);
 res.writeHead(200,{'content-type':extname(f)==='.html'?'text/html':'text/javascript','cache-control':'no-store'});res.end(await readFile(f));}
 catch{res.writeHead(404);res.end('');}});
const PORT=8650+(process.pid%90); await new Promise(r=>server.listen(PORT,r));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
 args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
page.on('pageerror',e=>console.log('PAGEERROR',e.message));
await page.goto(`http://localhost:${PORT}/`,{waitUntil:'load'});
await page.waitForFunction(()=>!!window.KAKAJA,{timeout:20000});
await page.waitForTimeout(1200);
console.log(await page.evaluate(() => {
  const K=window.KAKAJA, T=K.THREE, S=K.scene;
  const lights=[]; S.traverse(o=>{ if(o.isLight) lights.push({
    type:o.type, intensity:o.intensity, visible:o.visible,
    pos:[o.position.x,o.position.y,o.position.z].map(v=>+v.toFixed(1)),
    angle:o.angle?+o.angle.toFixed(2):null, penumbra:o.penumbra??null, decay:o.decay??null,
    target:o.target?[o.target.position.x,o.target.position.y,o.target.position.z].map(v=>+v.toFixed(1)):null,
    castShadow:!!o.castShadow });});
  return JSON.stringify({
    exposure: K.renderer.toneMappingExposure,
    camTargetZ:+K.camera.position.z.toFixed(1),
    lights,
  }, null, 1);
}));
await b.close(); server.close();
