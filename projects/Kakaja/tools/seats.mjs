/* Does turn order matter under the "round completes, highest total wins" rule? */
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join, normalize } from 'path';
const ROOT = new URL('../', import.meta.url).pathname;
const server = createServer(async (req,res)=>{ try{ let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/')p='/index.html';
  const f=join(ROOT,normalize(p)); await stat(f);
  res.writeHead(200,{'content-type':extname(f)==='.html'?'text/html':'text/javascript'}); res.end(await readFile(f)); }
  catch{ res.writeHead(404); res.end(''); } });
const PORT=8800+(process.pid%90); await new Promise(r=>server.listen(PORT,r));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await b.newPage({viewport:{width:390,height:844}});
page.on('pageerror',e=>console.log('PAGEERROR',e.message));
await page.goto(`http://localhost:${PORT}/`,{waitUntil:'load'});
await page.waitForFunction(()=>!!window.KAKAJA,{timeout:20000});

const out = await page.evaluate(async () => {
  const K=window.KAKAJA, R=K.RULES; if(!K.AI.ready) K.AI.build();
  const roll=n=>{const c=[0,0,0,0,0,0,0];for(let i=0;i<n;i++)c[1+(Math.random()*6|0)]++;return c;};
  function turn(need,bold){ let n=6,s=0,g=0;
    for(;;){ const c=roll(n); const d=K.AI.decide(c,n,s,{need,bold});
      if(!d) return 0; s+=d.keep.score; const left=n-d.keep.n;
      if(!d.roll) return s; n=left===0?6:left; if(++g>60) return s; } }
  const rows={};
  for (const NP of [2,3,4]){
    const wins=new Array(NP).fill(0); let crossedFirstButLost=new Array(NP).fill(0), M=1500;
    for(let m=0;m<M;m++){
      const P=Array.from({length:NP},()=>({score:0,bold:1}));   // identical skill
      let w=null,round=0,firstCrosser=null;
      while(w===null&&round<250){ round++;
        for(let i=0;i<NP;i++){
          let need=R.target; for(const q of P) if(q.score>=R.target&&q.score+1>need) need=q.score+1;
          const anyDone=P.some(q=>q.score>=R.target);
          P[i].score+=turn(anyDone?need-P[i].score:null,P[i].bold);
          if(firstCrosser===null&&P[i].score>=R.target) firstCrosser=i;
        }
        const done=P.map((q,i)=>({q,i})).filter(x=>x.q.score>=R.target);
        if(done.length) w=done.reduce((a,c)=>c.q.score>a.q.score?c:a).i;
      }
      wins[w]++;
      if(firstCrosser!==null&&firstCrosser!==w) crossedFirstButLost[firstCrosser]++;
    }
    rows[NP]={ wins:wins.map(v=>+(100*v/M).toFixed(1)), fair:+(100/NP).toFixed(1),
               lostAfterCrossing:crossedFirstButLost.map(v=>+(100*v/M).toFixed(1)) };
  }
  return rows;
});
console.log('win rate by seat, all players equally skilled (1500 matches each):');
for(const [np,r] of Object.entries(out)){
  console.log(`  ${np} players (fair share ${r.fair}%):  ${r.wins.map((v,i)=>`seat${i+1} ${v}%`).join('   ')}`);
  console.log(`     crossed the target first yet lost:  ${r.lostAfterCrossing.map((v,i)=>`seat${i+1} ${v}%`).join('   ')}`);
}
await b.close(); server.close();
