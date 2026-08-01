import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join, normalize } from 'path';
const ROOT = new URL('../../', import.meta.url).pathname;
const server=createServer(async(req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/')p='/index.html';
 const f=join(ROOT,normalize(p));await stat(f);res.writeHead(200,{'content-type':extname(f)==='.html'?'text/html':'text/javascript'});res.end(await readFile(f));}
 catch{res.writeHead(404);res.end('');}});
const PORT=8600+(process.pid%90); await new Promise(r=>server.listen(PORT,r));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
 args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await b.newPage({viewport:{width:320,height:568},deviceScaleFactor:2});
page.on('pageerror',e=>console.log('PAGEERROR',e.message));
await page.goto(`http://localhost:${PORT}/`,{waitUntil:'load'});
await page.waitForFunction(()=>!!window.KAKAJA,{timeout:20000});
await page.waitForTimeout(1000);
console.log(await page.evaluate(async () => {
  const K=window.KAKAJA, T=K.THREE;
  K.Game.seat(4); await new Promise(r=>setTimeout(r,400)); K.fitCamera();
  const sy = p => Math.round((-p.project(K.camera).y*.5+.5)*innerHeight);
  const C=K.CFG, pad=C.cam.pad, hw=C.tray.w/2*pad, hd=C.tray.d/2*pad;
  const topEl=document.getElementById('top').getBoundingClientRect();
  const botEl=document.getElementById('bottom').getBoundingClientRect();
  return JSON.stringify({
    vh: innerHeight,
    band_top_bottom: Math.round(topEl.bottom),
    band_bottom_top: Math.round(botEl.top),
    fitPoints: {
      farCorner_padded: sy(new T.Vector3(-hw,0,-hd)),
      farRim_padded:    sy(new T.Vector3(0,C.tray.rim*1.6,-hd)),
      nearCorner_padded:sy(new T.Vector3(-hw,0, hd)),
    },
    trayActual: {
      far:  sy(new T.Vector3(0,0,-C.tray.d/2)),
      near: sy(new T.Vector3(0,0, C.tray.d/2)),
      farRimTop: sy(new T.Vector3(0,C.tray.rim,-C.tray.d/2)),
    },
  }, null, 1);
}));
await b.close(); server.close();
