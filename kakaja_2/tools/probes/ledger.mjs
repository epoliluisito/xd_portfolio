import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join, normalize } from 'path';
const ROOT = new URL('../../', import.meta.url).pathname;
const server=createServer(async(req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/')p='/index.html';
 const f=join(ROOT,normalize(p));await stat(f);res.writeHead(200,{'content-type':extname(f)==='.html'?'text/html':'text/javascript'});res.end(await readFile(f));}
 catch{res.writeHead(404);res.end('');}});
const PORT=8680+(process.pid%90); await new Promise(r=>server.listen(PORT,r));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
 args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await page.goto(`http://localhost:${PORT}/`,{waitUntil:'load'});
await page.waitForFunction(()=>!!window.KAKAJA,{timeout:20000});
await page.waitForTimeout(1200);
await page.evaluate(()=>{ const K=window.KAKAJA; K.Game.seat(2);
  // transitions stall at ~1fps in software rendering; take them out of the picture
  for (const el of document.querySelectorAll('.layer,#scrim')) el.style.transition='none'; K.Game.saved=450; K.Game.phase='IDLE'; K.UI.syncBar(); });
await page.waitForTimeout(1500);
console.log(await page.evaluate(()=>{
  let n=document.getElementById('l-saved'); const chain=[];
  while(n && n!==document.documentElement){ const c=getComputedStyle(n);
    chain.push(`${n.tagName}${n.id?'#'+n.id:''}.${n.className||''} vis=${c.visibility} op=${c.opacity}`); n=n.parentElement; }

  const el=document.getElementById('l-saved'), w=document.getElementById('ledger');
  const cs=getComputedStyle(el), cw=getComputedStyle(w);
  const r=el.getBoundingClientRect();
  return JSON.stringify({ chain, text: el.textContent, color: cs.color, fontSize: cs.fontSize,
    fontFamily: cs.fontFamily.slice(0,40), opacity: cs.opacity, visibility: cs.visibility,
    rect:[Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)],
    ledgerBg: cw.backgroundColor, ledgerFilter: cw.backdropFilter });
}));
// crop the ledger area so we can see it at full resolution
const box = await page.evaluate(()=>{const r=document.getElementById('ledger').getBoundingClientRect();
  return {x:Math.max(0,r.left-20),y:Math.max(0,r.top-14),width:r.width+40,height:r.height+28};});
await page.screenshot({ path:'shots/ledger-crop.png', clip: box });
await b.close(); server.close();
