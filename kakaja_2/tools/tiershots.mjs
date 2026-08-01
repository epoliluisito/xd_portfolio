import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join, normalize } from 'path';
const ROOT = new URL('../', import.meta.url).pathname;
const server=createServer(async(req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/')p='/index.html';
 const f=join(ROOT,normalize(p));await stat(f);res.writeHead(200,{'content-type':extname(f)==='.html'?'text/html':'text/javascript'});res.end(await readFile(f));}
 catch{res.writeHead(404);res.end('');}});
await new Promise(r=>server.listen(8911,r));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
 args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
for (const q of ['high','low']){
  const p=await b.newPage({viewport:{width:390,height:844}});
  await p.goto(`http://localhost:8911/?q=${q}`,{waitUntil:'load'});
  await p.waitForFunction(()=>!!window.KAKAJA,{timeout:30000});
  await p.click('#scr-title [data-go="setup"]'); await p.waitForTimeout(400);
  await p.click('#scr-setup [data-go="start"]'); await p.waitForTimeout(600);
  await p.evaluate(()=>{ const K=window.KAKAJA; K.Game.busy=false; K.showValues([1,5,2,3,4,6]); });
  await p.waitForTimeout(9000);
  await p.screenshot({path:`shots/tier-${q}.png`});
  await p.close();
}
await b.close(); server.close();
