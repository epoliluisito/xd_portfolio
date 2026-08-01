import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join, normalize } from 'path';
const ROOT = new URL('../../', import.meta.url).pathname;
const MIME = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript' };
const server = createServer(async (req,res)=>{ try{ let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/')p='/index.html';
  const f=join(ROOT,normalize(p)); await stat(f); res.writeHead(200,{'content-type':MIME[extname(f)]||'application/octet-stream'}); res.end(await readFile(f)); }
  catch(e){ res.writeHead(404); res.end('nope'); } });
await new Promise(r=>server.listen(8099,r));
const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport:{width:390,height:844} });
p.on('console', m=>console.log('CONSOLE', m.type(), m.text()));
p.on('pageerror', e=>console.log('PAGEERROR', e.message, '\n', e.stack));
p.on('requestfailed', r=>console.log('REQFAIL', r.url(), r.failure()?.errorText));
await p.goto('http://localhost:8099/?debug=1', {waitUntil:'load'});
await p.waitForTimeout(3000);
console.log('BOOT:', await p.evaluate(()=>document.getElementById('boot')?.textContent||'(gone)'));
await b.close(); server.close();
