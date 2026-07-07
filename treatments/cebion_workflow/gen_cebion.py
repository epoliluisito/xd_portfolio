# -*- coding: utf-8 -*-
import html
A="assets/"
def esc(s): return html.escape(s,quote=True)

def hero():
    return f'''
<section class="module module--hero">
  <div class="hero-bg"></div>
  <div class="hero-inner">
    <img class="hero-logo" src="{A}kv_logo.png" alt="Cebion">
    <h1 class="heading">AI PRODUCTION<br>WORKFLOW</h1>
    <span class="hero-sub">FAMILY PLANS &nbsp;·&nbsp; JUNE 2026</span>
  </div>
  <div class="hero-credit">VML &nbsp;×&nbsp; P&amp;G Personal Health Care</div>
</section>'''

def text(heading,paras):
    b="".join(f"<p>{esc(p)}</p>" for p in paras)
    h=f'<h2 class="heading red">{esc(heading)}</h2>' if heading else ""
    return f'<section class="module module--text"><div class="text-inner">{h}<div class="text-body">{b}</div></div></section>'

def section(step,title,sub="",tool=""):
    eb=f'<span class="sec-step">{esc(step)}</span>' if step else ""
    sb=f'<p class="sec-sub">{esc(sub)}</p>' if sub else ""
    tl=f'<div class="toolpill"><span class="tp-k">TOOL</span> {esc(tool)}</div>' if tool else ""
    return f'<section class="module module--section"><div class="sec-inner">{eb}<h2 class="heading">{esc(title)}</h2>{sb}{tl}</div></section>'

def moment(img,kicker,title,body=""):
    bg=f'<img class="moment-bg" src="{A}{img}" alt="">' if img else ""
    bd=f'<p class="moment-body">{esc(body)}</p>' if body else ""
    return f'''<section class="module module--moment">{bg}<div class="moment-scrim"></div>
  <div class="moment-inner"><span class="moment-kick">{esc(kicker)}</span><h2 class="heading">{esc(title)}</h2>{bd}</div></section>'''

def single(img,label="",sub=""):
    lab=""
    if label:
        sl=f'<span class="cap-sub">{esc(sub)}</span>' if sub else ""
        lab=f'<div class="single-cap"><span class="cap-main heading">{esc(label)}</span>{sl}</div>'
    return f'<section class="module module--image single"><img class="full" src="{A}{img}" alt="{esc(label)}">{lab}</section>'

def compare(still,motion,heading,sub=""):
    sh=f'<p class="vsub">{esc(sub)}</p>' if sub else ""
    return f'''<section class="module module--video"><div class="voverlay"><h2 class="heading">{esc(heading)}</h2>{sh}</div>
  <div class="vgrid two compare">
    <div class="vwrap"><img class="vposter" src="{A}{still}"><span class="vtag">Style Frame</span></div>
    <div class="vwrap"><img class="vposter" src="{A}{motion}"><span class="vtag gold">Motion · Seedance 2.0</span><div class="motionbadge">▶</div></div>
  </div></section>'''

def grid(items,cols,heading="",note=""):
    cells=""
    for img,label in items:
        cap=f'<span class="grid-cap">{esc(label)}</span>' if label else ""
        cells+=f'<figure class="cell"><img src="{A}{img}" alt="{esc(label)}">{cap}</figure>'
    h=f'<div class="grid-head"><h2 class="heading red">{esc(heading)}</h2></div>' if heading else ""
    n=f'<p class="grid-note">{esc(note)}</p>' if note else ""
    return f'<section class="module module--image grid-mod">{h}<div class="grid grid-{cols}">{cells}</div>{n}</section>'

def tools():
    return f'''<section class="module module--tools">
  <div class="tools-head"><span class="sec-step dark">THE AI STACK</span><h2 class="heading">THE TOOLS BEHIND EVERY FRAME</h2>
  <p class="tools-sub">A lean stack takes each scene from still to motion — pack-accurate imagery, then lifelike movement.</p></div>
  <div class="tools-flow">
    <div class="tool-col">
      <span class="tc-label">IMAGES &nbsp;·&nbsp; STILLS</span>
      <div class="tcard"><span class="tc-name">GPT2</span><span class="tc-role">Ideation, casting &amp; concepting</span></div>
      <div class="tcard"><span class="tc-name">Nano Banana Pro</span><span class="tc-role">Photoreal style frames &amp; pack-accurate product</span></div>
    </div>
    <div class="tool-arrow" aria-hidden="true">→</div>
    <div class="tool-col">
      <span class="tc-label">VIDEO &nbsp;·&nbsp; MOTION</span>
      <div class="tcard hero-tool"><span class="tc-name">Seedance 2.0</span><span class="tc-role">Style frames animated into finished clips</span></div>
    </div>
  </div>
</section>'''

def closing():
    return f'''<section class="module module--footer">
  <div class="foot-inner"><img class="foot-logo" src="{A}kv_logo.png" alt="Cebion">
    <h2 class="heading big">WITH A STRONGER IMMUNE SYSTEM,<br>NOTHING CAN STOP US.</h2>
    <p class="foot-copy">Cebion &middot; Family Plans &nbsp;|&nbsp; VML &times; P&amp;G Personal Health Care</p>
  </div></section>'''

M=[]
M.append(hero())
M.append(text("",["This is how we turn the Cebion campaign brief into finished film. A fully AI-driven production pipeline — fast, flexible and endlessly adaptable — that transforms scripts and social ideas into photoreal, on-brand content across every format and market."]))
M.append(moment("frame15.png","COMMUNICATION IDEA","With a stronger immune system, nothing can stop us.","Everyday moments, elevated — the same warmth and energy of a live shoot, produced entirely with AI."))
M.append(section("","THE AI PIPELINE","Six steps take us from brief to delivery — each stage feeding cleanly into the next."))
M.append(tools())
M.append(section("STEP 1","AI CASTING","Families, kids and adults — cast to brief. Real-talent likeness can be recreated in AI, with consent.","GPT2 · Nano Banana Pro"))
M.append(grid([("frame02.png","THE MOTHER"),("frame01.png","THE FAMILY"),("frame03.png","THE COMPANION"),("frame06.png","THE HERO PRODUCT")],2))
M.append(section("STEP 2","LOCATION SCOUTING","Homes, offices and seasonal exteriors — every set tailored to the scene, no location fees or travel.","GPT2 · Nano Banana Pro"))
M.append(grid([("frame08.png","LIVING ROOM"),("frame10.png","THE DOORWAY"),("frame01.png","AUTUMN EXTERIOR"),("frame09.png","WINTER SCENE")],2))
M.append(section("STEP 3","SKETCHED STORYBOARD","We validate the narrative frame by frame before committing to photoreal — fast iteration, aligned early."))
M.append(grid([("frame05.png",""),("frame07.png",""),("frame11.png",""),("frame12.png",""),("frame08.png",""),("frame02.png","")],3))
M.append(section("STEP 4","STYLE FRAMES + SHOOTING BOARD","Photoreal, pack-accurate frames become the shooting board — the exact look we then animate.","Nano Banana Pro · GPT2"))
M.append(grid([("frame05.png","GUMMIES · CLOSE"),("frame07.png","IN HAND"),("frame11.png","PRODUCT"),("frame06.png","#1 VITAMIN C"),("frame12.png","ORANGE FLAVOUR"),("frame08.png","ON TABLE")],3))
M.append(moment("frame14.png","SIGNATURE TRANSITION","THE BIG JUICY C","Bubbles form our iconic C and carry us into the next scene — a hero device generated and animated end-to-end."))
M.append(section("STEP 5","STYLE FRAMES ANIMATION","Every style frame is brought to life as motion — natural movement, consistent with the still it came from.","Seedance 2.0"))
M.append(compare("frame08.png","frame08.png","STYLE FRAME → MOTION","The same pack-accurate frame, animated into a finished shot."))
M.append(section("STEP 6","EDIT + DELIVERY","Traditional post finishes the job — with AI on hand to generate supplementary scenes, angles or cut-downs on demand."))
M.append(section("","ADAPTATION & FORMATS","One workflow, every placement — 9:16, 1:1 and 16:9 social assets, seasonal variants and market adaptations from the same established look."))
M.append(grid([("frame13.png","AUTUMN · FAMILY"),("frame02.png","OFFICE · DAY"),("frame09.png","WINTER · FEAR"),("frame15.png","EVENING · CALM")],2,note="Social-first assets, built to travel across every feed and format."))
M.append(closing())
modules="\n".join(M)

CSS=r'''
:root{--paper:#fff8ef;--ink:#2b1a0f;--orange:#f26722;--orange2:#f7931e;--gold:#ffc000;--red:#e1251b;--navy:#17357e;--muted:#9a7b64;
--head:"Fredoka","Poppins",Arial,sans-serif;--body:"Mulish","Helvetica Neue",Arial,sans-serif}
*{margin:0;padding:0;box-sizing:border-box}
html{background:var(--paper);scroll-behavior:smooth}
body{background:var(--paper);color:var(--ink);font-family:var(--body);-webkit-font-smoothing:antialiased;overflow-x:hidden}
img{max-width:100%;display:block}
.heading{font-family:var(--head);font-weight:700;text-transform:uppercase;letter-spacing:.01em;line-height:1.0}
.heading.red{color:var(--red)}
.module{position:relative;min-height:100vh;width:100%;display:flex;overflow:hidden}
/* hero */
.module--hero{align-items:center;justify-content:center}
.hero-bg{position:absolute;inset:0;background:linear-gradient(140deg,#f9a01f 0%,#f2711f 55%,#e85614 100%)}
.hero-bg::after{content:"";position:absolute;inset:0;background:radial-gradient(60% 60% at 50% 30%,rgba(255,255,255,.18),transparent 70%)}
.hero-inner{position:relative;text-align:center;padding:0 6vw}
.hero-logo{width:min(560px,74vw);margin:0 auto 5vh;filter:drop-shadow(0 8px 26px rgba(120,40,0,.35))}
.module--hero h1{font-size:clamp(44px,9vw,132px);color:#fff;text-shadow:0 4px 20px rgba(120,40,0,.28)}
.hero-sub{display:block;margin-top:24px;font-family:var(--head);font-weight:600;letter-spacing:.24em;font-size:clamp(12px,1.4vw,17px);color:#fff5e2}
.hero-credit{position:absolute;bottom:5vh;left:0;right:0;text-align:center;color:#fff;opacity:.9;font-weight:600;letter-spacing:.14em;font-size:12px;text-transform:uppercase}
/* text */
.module--text{align-items:center;justify-content:center;background:var(--paper)}
.text-inner{max-width:940px;padding:14vh 8vw;text-align:center}
.module--text h2{font-size:clamp(26px,4vw,52px);margin-bottom:44px}
.text-body p{font-size:clamp(17px,1.8vw,25px);line-height:1.8;color:#4a3323;font-weight:400}
.text-body p+p{margin-top:22px}
/* section (orange band) */
.module--section{align-items:center;justify-content:center;background:linear-gradient(135deg,#f4802a,#ec5817)}
.sec-inner{text-align:center;padding:0 8vw;max-width:1050px}
.sec-step{display:inline-block;font-family:var(--head);font-weight:600;letter-spacing:.28em;font-size:14px;color:var(--gold);margin-bottom:22px}
.sec-step.dark{color:var(--red)}
.module--section h2{font-size:clamp(36px,6.5vw,96px);color:#fff}
.sec-sub{margin:28px auto 0;font-size:clamp(16px,1.6vw,21px);line-height:1.65;color:#fff2df;font-weight:400;max-width:720px}
.toolpill{display:inline-flex;align-items:center;gap:10px;margin-top:34px;background:var(--gold);color:var(--navy);font-family:var(--head);font-weight:600;letter-spacing:.04em;font-size:14px;padding:10px 20px;border-radius:40px}
.toolpill .tp-k{background:var(--navy);color:#fff;font-size:10px;letter-spacing:.16em;padding:3px 8px;border-radius:20px}
/* moment (full-bleed) */
.module--moment{align-items:center;justify-content:center}
.moment-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.moment-scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(180,60,10,.62),rgba(140,40,0,.72))}
.moment-inner{position:relative;text-align:center;padding:0 8vw;max-width:1000px}
.moment-kick{display:inline-block;font-family:var(--head);font-weight:600;letter-spacing:.28em;font-size:13px;color:var(--gold);margin-bottom:24px}
.module--moment h2{font-size:clamp(32px,5.6vw,84px);color:#fff;text-shadow:0 4px 24px rgba(80,20,0,.4)}
.moment-body{margin:28px auto 0;max-width:680px;font-size:clamp(16px,1.6vw,21px);line-height:1.65;color:#fff4e6;font-weight:400}
/* single */
.single{align-items:stretch}
.single .full{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.single-cap{position:absolute;left:0;right:0;bottom:0;padding:6vh 6vw;background:linear-gradient(to top,rgba(60,20,0,.82),transparent);display:flex;flex-direction:column;gap:8px}
.cap-main{font-size:clamp(24px,4vw,56px);color:#fff}
.cap-sub{font-family:var(--head);font-weight:600;letter-spacing:.2em;font-size:clamp(11px,1.2vw,15px);color:var(--gold);text-transform:uppercase}
/* grid */
.grid-mod{flex-direction:column;justify-content:center;align-items:center;padding:11vh 5vw;background:var(--paper)}
.grid-head{width:100%;text-align:center;margin-bottom:6vh}
.grid-head h2{font-size:clamp(24px,4vw,54px)}
.grid{display:grid;gap:16px;width:100%;max-width:1480px}
.grid-2{grid-template-columns:repeat(2,1fr)}.grid-3{grid-template-columns:repeat(3,1fr)}
.cell{position:relative;overflow:hidden;background:#f3ddc4;border-radius:10px;box-shadow:0 10px 26px rgba(150,80,20,.13)}
.cell img{width:100%;aspect-ratio:16/10;object-fit:cover;transition:transform .5s ease}
.cell:hover img{transform:scale(1.05)}
.grid-cap{position:absolute;left:0;bottom:0;right:0;padding:14px;font-family:var(--head);font-weight:600;text-transform:uppercase;letter-spacing:.1em;font-size:12px;color:#fff;background:linear-gradient(to top,rgba(60,20,0,.8),transparent)}
.grid-note{margin-top:6vh;text-align:center;color:var(--muted);font-weight:600;font-size:clamp(15px,1.6vw,20px);max-width:760px}
/* video / compare */
.module--video{align-items:center;justify-content:center;background:var(--paper);flex-direction:column;padding:9vh 5vw}
.voverlay{text-align:center;margin-bottom:5vh}
.voverlay h2{font-size:clamp(24px,3.6vw,50px);color:var(--red)}
.vsub{margin-top:16px;color:var(--muted);font-weight:600;font-size:clamp(15px,1.5vw,19px)}
.vgrid{display:grid;gap:18px;width:100%;max-width:1400px;grid-template-columns:repeat(2,1fr)}
.vwrap{position:relative;aspect-ratio:16/9;overflow:hidden;border-radius:12px;background:#f3ddc4;box-shadow:0 12px 30px rgba(150,80,20,.16)}
.vposter{width:100%;height:100%;object-fit:cover}
.vtag{position:absolute;top:14px;left:14px;font-family:var(--head);font-weight:600;text-transform:uppercase;letter-spacing:.14em;font-size:11px;color:#fff;background:rgba(60,20,0,.72);padding:7px 12px;border-radius:30px}
.vtag.gold{background:var(--gold);color:var(--navy)}
.motionbadge{position:absolute;inset:0;margin:auto;width:78px;height:78px;border-radius:50%;background:rgba(242,103,34,.85);border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:26px;padding-left:5px}
/* tools */
.module--tools{flex-direction:column;justify-content:center;align-items:center;background:linear-gradient(135deg,#ffc000,#ffb01f);padding:12vh 5vw}
.tools-head{text-align:center;max-width:900px;margin-bottom:7vh}
.tools-head h2{font-size:clamp(28px,4.4vw,60px);color:var(--navy)}
.tools-sub{margin-top:22px;font-size:clamp(16px,1.6vw,20px);color:#7a4a12;font-weight:600;line-height:1.6}
.tools-flow{display:flex;align-items:center;justify-content:center;gap:26px;flex-wrap:wrap;max-width:1200px;width:100%}
.tool-col{display:flex;flex-direction:column;gap:16px;flex:1;min-width:260px}
.tc-label{font-family:var(--head);font-weight:600;letter-spacing:.16em;font-size:12px;color:var(--red);text-align:center;margin-bottom:4px}
.tcard{background:#fff;border-radius:16px;padding:26px 24px;text-align:center;box-shadow:0 14px 34px rgba(150,80,20,.2)}
.tcard.hero-tool{background:var(--navy)}
.tc-name{display:block;font-family:var(--head);font-weight:700;font-size:clamp(22px,2.6vw,34px);color:var(--orange)}
.tcard.hero-tool .tc-name{color:var(--gold)}
.tc-role{display:block;margin-top:10px;font-size:14px;color:#6a5142;font-weight:600;line-height:1.5}
.tcard.hero-tool .tc-role{color:#dfe6f5}
.tool-arrow{font-family:var(--head);font-weight:700;font-size:48px;color:var(--red);flex:0 0 auto}
@media(max-width:820px){.tool-arrow{transform:rotate(90deg)}}
/* footer */
.module--footer{align-items:center;justify-content:center;background:linear-gradient(140deg,#f2711f,#e0500f)}
.foot-inner{text-align:center;padding:0 6vw}
.foot-logo{width:min(440px,66vw);margin:0 auto 7vh;filter:drop-shadow(0 8px 22px rgba(120,40,0,.3))}
.module--footer h2.big{font-size:clamp(26px,4.4vw,64px);color:#fff;line-height:1.06;text-shadow:0 3px 18px rgba(100,30,0,.3)}
.foot-copy{margin-top:6vh;color:#fff2df;font-size:13px;letter-spacing:.06em;font-weight:600}
@media(max-width:760px){.grid-3{grid-template-columns:repeat(2,1fr)}.vgrid{grid-template-columns:1fr}.grid-2{grid-template-columns:1fr}}
'''

DOC=f'''<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cebion — AI Production Workflow</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Mulish:wght@300;400;600;700&display=swap" rel="stylesheet">
<style>{CSS}</style></head>
<body><main class="main">
{modules}
</main></body></html>'''
open("/sessions/gifted-festive-mccarthy/mnt/outputs/cebion_workflow/index.html","w").write(DOC)
print("modules:",len(M),"bytes:",len(DOC))
