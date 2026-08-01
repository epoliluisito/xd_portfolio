/* Where do the LATER throws of a turn land? Those use 1-3 dice and are the
   ones the player has to tap. */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join, normalize } from 'path';
const ROOT = new URL('../../', import.meta.url).pathname;
const server = createServer(async (req,res)=>{ try{ let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/')p='/index.html';
  const f=join(ROOT,normalize(p)); await stat(f);
  res.writeHead(200,{'content-type':extname(f)==='.html'?'text/html':'text/javascript'}); res.end(await readFile(f)); }
  catch{ res.writeHead(404); res.end(''); } });
const PORT=8400+(process.pid%90); await new Promise(r=>server.listen(PORT,r));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});

for (const dev of [{n:'iPhone 390x844',w:390,h:844},{n:'iPhone SE 320x568',w:320,h:568},{n:'desktop 1512x857',w:1512,h:857}]){
  const page=await b.newPage({viewport:{width:dev.w,height:dev.h},deviceScaleFactor:2});
  page.on('pageerror',e=>console.log('PAGEERROR',e.message));
  await page.goto(`http://localhost:${PORT}/`,{waitUntil:'load'});
  await page.waitForFunction(()=>!!window.KAKAJA,{timeout:20000});
  await page.waitForTimeout(1200);
  const out = await page.evaluate(async () => {
    const K=window.KAKAJA, G=K.Game;
    G.seat(4); G.busy=true; await new Promise(r=>setTimeout(r,150));
    const swallowed=(x,y)=>{const el=document.elementFromPoint(x,y); return !!(el&&el.closest('#hud'));};
    const bottomTop = document.getElementById('bottom').getBoundingClientRect().top;
    const res={};
    for (const nd of [1,2,3,4,5,6]){
      const ys=[]; let blocked=0, tot=0;
      for(let t=0;t<70;t++){
        // vary power the way a real swipe does
        const sw = Math.random()<0.5 ? null : {power:0.65+Math.random()*0.85, dx:(Math.random()-.5)*0.8};
        const set=K.__ensure(6).slice(0,nd);
        const th=K.__sim.beginThrow(K.sim, { seed:(Math.random()*2**32)>>>0, n:nd,
          power: sw ? sw.power : 1, skew: sw ? sw.dx : 0 });
        let steps=0;
        while(!th.done && steps++<4000) K.__sim.stepThrow(K.sim, th);
        set.forEach(d=>d.sync());
        for(const d of set){
          const p=d.group.position.clone().project(K.camera);
          const sx=(p.x*.5+.5)*innerWidth, sy=(-p.y*.5+.5)*innerHeight;
          const e=d.group.position.clone(); e.x+=K.CFG.die.size/2;
          const r=Math.abs(((e.project(K.camera).x)*.5+.5)*innerWidth-sx);
          ys.push(sy); tot++;
          const pts=[[0,0],[0,-r],[0,r],[-r,0],[r,0]];
          if(pts.some(([dx,dy])=>swallowed(sx+dx,sy+dy))) blocked++;
        }
      }
      const q=(a,p)=>a.slice().sort((x,y)=>x-y)[Math.floor(a.length*p)];
      res[nd]={p50:Math.round(q(ys,.5)),p90:Math.round(q(ys,.9)),max:Math.round(Math.max(...ys)),
               blocked, tot, pct:+(100*blocked/tot).toFixed(1)};
    }
    return {res, bottomTop:Math.round(bottomTop), vh:innerHeight};
  });
  console.log(`\n=== ${dev.n} — bottom UI band starts at y=${out.bottomTop} of ${out.vh}`);
  for(const [nd,r] of Object.entries(out.res))
    console.log(`  ${nd} dice:  median y ${String(r.p50).padStart(3)}  p90 ${String(r.p90).padStart(3)}  lowest ${String(r.max).padStart(3)}   blocked ${r.blocked}/${r.tot} (${r.pct}%)`);
  await page.close();
}
await b.close(); server.close();
