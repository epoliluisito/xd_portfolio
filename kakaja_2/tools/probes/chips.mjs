/* Render the HUD with real scores so the chips, progress lines and colours can
   be judged at full resolution. */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join, normalize } from 'path';
const ROOT = new URL('../../', import.meta.url).pathname;
const server=createServer(async(req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/')p='/index.html';
 const f=join(ROOT,normalize(p));await stat(f);res.writeHead(200,{'content-type':extname(f)==='.html'?'text/html':'text/javascript'});res.end(await readFile(f));}
 catch{res.writeHead(404);res.end('');}});
const PORT=8770+(process.pid%90); await new Promise(r=>server.listen(PORT,r));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
 args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:3});
page.on('pageerror',e=>console.log('PAGEERROR',e.message));
await page.goto(`http://localhost:${PORT}/`,{waitUntil:'load'});
await page.waitForFunction(()=>!!window.KAKAJA,{timeout:20000});
await page.waitForTimeout(1200);
await page.evaluate(()=>{
  const K=window.KAKAJA;
  for (const el of document.querySelectorAll('.layer,#scrim')) el.style.transition='none';
  K.Game.seat(4);
  K.Game.players[0].score=10750; K.Game.players[1].score=9400;
  K.Game.players[2].score=9900; K.Game.players[3].score=1250;
  K.Game.current=2; K.Game.saved=450; K.Game.phase='IDLE';
  K.UI.buildChips(); K.UI.syncBar();
  K.UI.turn('Odile is pushing her luck'); K.UI.hint('tap to continue');
});
await page.waitForTimeout(1800);
await page.screenshot({ path:'shots/chips-top.png', clip:{x:0,y:0,width:390,height:130} });
await page.screenshot({ path:'shots/chips-bottom.png', clip:{x:0,y:690,width:390,height:154} });
// and the Kakaja ribbon
await page.evaluate(()=>window.KAKAJA.UI.flash('KAKAJA', 1650, 'gold', 60000));
await page.waitForTimeout(1600);
await page.screenshot({ path:'shots/chips-flash.png', clip:{x:0,y:300,width:390,height:220} });
await page.evaluate(()=>window.KAKAJA.UI.flash('TUTTO', -1250, 'bad', 60000));
await page.waitForTimeout(1400);
await page.screenshot({ path:'shots/chips-flash2.png', clip:{x:0,y:300,width:390,height:220} });
await b.close(); server.close();
