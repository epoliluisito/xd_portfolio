# -*- coding: utf-8 -*-
import html

A = "assets/"  # relative asset path

def esc(s): return html.escape(s, quote=True)

# ---------- module builders ----------
def hero(title, subtitle):
    return f'''
<section class="module module--hero">
  <div class="hero-bg"></div>
  <div class="hero-inner">
    <h1 class="heading">{esc(title)}</h1>
    <span class="hero-sub">{esc(subtitle)}</span>
  </div>
  <div class="hero-logos">
    <img src="{A}image1.png" alt="Publicis Production">
    <img src="{A}image2.png" alt="always">
  </div>
</section>'''

def section(step, title, sub=""):
    eyebrow = f'<span class="sec-step">{esc(step)}</span>' if step else ""
    subhtml = f'<p class="sec-sub">{esc(sub)}</p>' if sub else ""
    return f'''
<section class="module module--section">
  <div class="sec-inner">
    {eyebrow}
    <h2 class="heading">{esc(title)}</h2>
    {subhtml}
  </div>
</section>'''

def text(heading, paras):
    body = "".join(f"<p>{esc(p)}</p>" for p in paras)
    h = f'<h2 class="heading">{esc(heading)}</h2>' if heading else ""
    return f'''
<section class="module module--text">
  <div class="text-inner">
    {h}
    <div class="text-body">{body}</div>
  </div>
</section>'''

def single(img, label="", sub=""):
    lab = ""
    if label:
        subl = f'<span class="cap-sub">{esc(sub)}</span>' if sub else ""
        lab = f'<div class="single-cap"><span class="cap-main heading">{esc(label)}</span>{subl}</div>'
    return f'''
<section class="module module--image single">
  <img class="full" src="{A}{img}" alt="{esc(label)}">
  {lab}
</section>'''

def grid(items, cols, heading="", note=""):
    # items: list of (img, label)
    cells = ""
    for img, label in items:
        cap = f'<span class="grid-cap">{esc(label)}</span>' if label else ""
        cells += f'<figure class="cell"><img src="{A}{img}" alt="{esc(label)}">{cap}</figure>'
    h = f'<div class="grid-head"><h2 class="heading">{esc(heading)}</h2></div>' if heading else ""
    n = f'<p class="grid-note">{esc(note)}</p>' if note else ""
    return f'''
<section class="module module--image grid-mod">
  {h}
  <div class="grid grid-{cols}">{cells}</div>
  {n}
</section>'''

def video(posters, media, heading="", sub="", note=""):
    # posters/media: lists (parallel). renders 1 or 2 players.
    players = ""
    two = len(posters) > 1
    for p, m in zip(posters, media):
        players += f'''<div class="vwrap">
      <img class="vposter" src="{A}{p}" alt="">
      <button class="playbtn" data-src="{A}{m}" aria-label="Play clip"><span></span></button>
    </div>'''
    cls = "vgrid two" if two else "vgrid one"
    ov = ""
    if heading or sub:
        subh = f'<p class="vsub">{esc(sub)}</p>' if sub else ""
        ov = f'<div class="voverlay"><h2 class="heading">{esc(heading)}</h2>{subh}</div>'
    n = f'<p class="grid-note">{esc(note)}</p>' if note else ""
    return f'''
<section class="module module--video">
  {ov}
  <div class="{cls}">{players}</div>
  {n}
</section>'''

def compare(still, poster, media, heading="", sub=""):
    subh = f'<p class="vsub">{esc(sub)}</p>' if sub else ""
    ov = f'<div class="voverlay"><h2 class="heading">{esc(heading)}</h2>{subh}</div>' if (heading or sub) else ""
    return f'''
<section class="module module--video">
  {ov}
  <div class="vgrid two compare">
    <div class="vwrap">
      <img class="vposter" src="{A}{still}" alt="Style frame">
      <span class="vtag">Style Frame</span>
    </div>
    <div class="vwrap">
      <img class="vposter" src="{A}{poster}" alt="">
      <button class="playbtn" data-src="{A}{media}" aria-label="Play clip"><span></span></button>
      <span class="vtag">Animation</span>
    </div>
  </div>
</section>'''

def closing(title):
    return f'''
<section class="module module--footer">
  <div class="foot-inner">
    <h2 class="heading big">{esc(title)}</h2>
    <div class="foot-logos">
      <img src="{A}image1.png" alt="Publicis Production">
      <img src="{A}image2.png" alt="always">
    </div>
    <p class="foot-copy">Shower Fresh &middot; Full AI Production Approach &nbsp;|&nbsp; Publicis Production &times; Always</p>
  </div>
</section>'''

# ---------- deck data ----------
M = []
M.append(hero("SHOWER FRESH", "FULL AI PRODUCTION APPROACH"))
M.append(text("", ["As a fully integrated AI studio, we leverage ever-evolving workflows to transform creative briefs into compelling films. The example on the next slide captures the full spectrum of storytelling, seamlessly blending photorealism, performance, and character consistency over time."]))
M.append(video(["image3.png"], ["media1.mp4"], "CLIENT: NIVEA — FATHER’S DAY", "The film was created as a 90-second spot. This is a 30-second cut-down, realized to illustrate consistency across cinematography, location, casting, and — most importantly — performance."))
M.append(text("HOW DID WE APPROACH IT?", ["Using full AI pipelines as a means to turn potential production constraints into creative leverage."]))
M.append(section("", "THE AI PIPELINE", "EFFICIENCY · ADAPTABILITY · CONTROL"))
M.append(section("STEP 1", "AI CASTING"))
M.append(single("image1.jpeg", "FATHER"))
M.append(single("image2.jpeg", "DAUGHTER"))
M.append(text("", ["We have full control and flexibility over every element that defines the character — such as hair, wardrobe, and age. Below is an example of character consistency across decades."]))
M.append(single("image3.jpeg", "DAUGHTER", "AGE 1"))
M.append(single("image4.jpeg", "DAUGHTER", "AGE 4"))
M.append(single("image5.jpeg", "DAUGHTER", "AGE 7"))
M.append(single("image6.jpeg", "DAUGHTER", "AGE 16"))
M.append(single("image7.jpeg", "DAUGHTER", "AGE 18"))
M.append(single("image2.jpeg", "DAUGHTER", "AGE 28"))
M.append(section("STEP 2", "AI LOCATION SCOUTING", "Locations are tailored specifically to each project’s needs."))
loc_labels = ["THE CHURCH","THE MATERNITY WARD","THE THEATRE HALL","THE HOSPITAL ROOM","THE BEDROOM — 10 y/o daughter","THE LIVING ROOM","THE KITCHEN","THE MOUNTAIN","THE BEDROOM — 15 y/o daughter"]
loc_imgs = [f"image{n}.jpeg" for n in range(8,17)]
M.append(grid(list(zip(loc_imgs, loc_labels)), 3))
M.append(section("STEP 3", "SKETCHED STORYBOARD", "Based on script, casting and location, we realize a sketched storyboard to validate the narrative while visualizing the frames."))
M.append(grid([(f"image{n}.jpeg","") for n in range(17,37)], 4))
M.append(grid([(f"image{n}.jpeg","") for n in range(37,57)], 4))
M.append(grid([(f"image{n}.jpeg","") for n in range(57,69)], 4))
M.append(section("STEP 4", "STYLE FRAMES + SHOOTING BOARD", "Once casting, location and sketched storyboard frames are in place, we proceed to create a photoreal shooting board."))
M.append(grid([(f"image{n}.jpeg","") for n in range(69,89)], 4))
M.append(grid([(f"image{n}.jpeg","") for n in range(89,109)], 4))
M.append(grid([(f"image{n}.jpeg","") for n in range(109,121)], 4))
M.append(section("STEP 5", "STYLE FRAMES ANIMATION", "The style frames created to compose the shooting board are the starting point to animate the video clips."))
M.append(compare("image121.jpeg", "image6.png", "media2.mp4", "STYLE FRAME → ANIMATION", "The style frame is the starting point — the same frame is then brought to life as a moving clip."))
M.append(section("STEP 6", "EDITING + DELIVERY", "Post-production follows a traditional pipeline; however, AI offers additional advantages, such as the flexibility to generate supplementary scenes or alternate angles to perfect the edit."))
M.append(section("", "ADAPTATION & LOCALIZATION", "The full AI production approach provides additional flexibility, like the option to easily extend the campaign to different markets."))
M.append(grid([("image122.jpeg","THE DAUGHTER"),("image123.jpeg","THE DAUGHTER (THAI)"),("image124.jpeg","THE FATHER"),("image125.jpeg","THE FATHER (THAI)")], 2))
M.append(grid([("image126.jpeg","THE HOSPITAL BEDROOM"),("image127.jpeg","THE HOSPITAL BEDROOM (THAI)"),("image128.jpeg","THE MATERNITY WARD"),("image129.jpeg","THE MATERNITY WARD (THAI)")], 2))
M.append(grid([("image130.jpeg","THE BEDROOM — 10 y/o"),("image131.jpeg","THE BEDROOM (THAI) — 10 y/o"),("image132.jpeg","THE LIVING ROOM"),("image133.jpeg","THE LIVING ROOM (THAI)")], 2))
M.append(video(["image7.png"], ["media3.mp4"], "CLIENT: NIVEA — FATHER’S DAY (THAI)", "Originally created for the EMEA market with Caucasian characters. Full AI production allowed us to also create a version for the Thai market, starting from the already-established workflows — rapidly enabling a possibility that would have implied massive consideration in a traditional setting."))
M.append(grid([(f"image{n}.jpeg","") for n in range(134,138)], 2))
M.append(section("", "ALWAYS’ BRIEF", "Replicate the Shower Fresh genematic created pre-shoot, but with new talent. P&G require that we identify a REAL talent whose likeness we create in AI with their consent. We would need to cast the hero and her friend."))
M.append(grid([("image138.jpeg",""),("image139.jpeg","")], 2, note="AI allows the flexibility of replacing characters in a film."))
M.append(text("", ["While character swap is a service we provide, what we propose here is far more powerful: the opportunity to regenerate a scene from scratch, using a different character. This may result in slight changes to the scenes, but maintains the visual storytelling intention unaltered — allowing new scope for exploration."]))
M.append(section("", "PROOF OF CONCEPT"))
M.append(single("image140.jpeg", "CHARACTER #1"))
M.append(video(["image8.png","image9.png"], ["media4.mp4","media5.mp4"], "SCENES GENERATED WITH CHARACTER #1"))
M.append(single("image141.jpeg", "CHARACTER #2"))
M.append(video(["image10.png","image11.png"], ["media6.mp4","media7.mp4"], "SCENES GENERATED WITH CHARACTER #2"))
M.append(text("", ["AI character sheets can also be generated based on real people."]))
M.append(grid([(f"image{n}.jpeg","") for n in range(142,146)], 2, heading="EMMA’S IPHONE PHOTOS"))
M.append(single("image12.png", "EMMA — AI GENERATED", "CHARACTER SHEET"))
M.append(video(["image13.png","image14.png"], ["media8.mp4","media9.mp4"], "SCENES GENERATED WITH AI EMMA"))
M.append(single("image15.png", "EMMA — AI GENERATED", "CHARACTER SHEET · ALTERED OUTFIT"))
M.append(video(["image16.png"], ["media10.mp4"], "SCENES GENERATED WITH AI EMMA", "Altered outfit"))
M.append(closing("THANK YOU"))

modules = "\n".join(M)

CSS = r'''
:root{
  --bg:#cbc4e6; --fg:#282142; --muted:#5f5880; --accent:#6b4fc4;
  --heading:"Archivo","Arial Narrow",Arial,sans-serif;
  --body:"Poppins","Helvetica Neue",Arial,sans-serif;
}
*{margin:0;padding:0;box-sizing:border-box}
html{background:var(--bg);scroll-behavior:smooth}
body{background:var(--bg);color:var(--fg);font-family:var(--body);-webkit-font-smoothing:antialiased;overflow-x:hidden}
img{max-width:100%;display:block}
.heading{font-family:var(--heading);font-weight:900;font-stretch:125%;text-transform:uppercase;letter-spacing:.06em;line-height:.98}
/* fixed margin overlay */
.edge{position:fixed;inset:0;pointer-events:none;z-index:50}
.edge span{position:absolute;font-family:var(--heading);font-weight:900;font-stretch:125%;text-transform:uppercase;font-size:11px;letter-spacing:.35em;color:rgba(40,33,66,.5)}
.edge .l{left:22px;top:50%;transform:translateY(-50%) rotate(180deg);writing-mode:vertical-rl}
.edge .r{right:22px;top:50%;transform:translateY(-50%);writing-mode:vertical-rl}
.module{position:relative;min-height:100vh;width:100%;display:flex;overflow:hidden;border-bottom:1px solid rgba(40,33,66,.10)}
/* HERO */
.module--hero{align-items:center;justify-content:center}
.module--hero .hero-bg{position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 18%,#e4dff5 0%,#c3bce0 68%)}
.hero-inner{position:relative;text-align:center;padding:0 6vw}
.module--hero h1{font-size:clamp(48px,11vw,168px);color:var(--fg)}
.hero-sub{display:block;margin-top:26px;font-family:var(--heading);font-weight:900;font-stretch:125%;text-transform:uppercase;letter-spacing:.3em;font-size:clamp(11px,1.4vw,18px);color:var(--accent)}
.hero-logos{position:absolute;bottom:6vh;left:0;right:0;display:flex;justify-content:center;gap:60px;align-items:center}
.hero-logos img{height:44px;width:auto;filter:brightness(0);opacity:.82}
/* SECTION */
.module--section{align-items:center;justify-content:center;background:#bfb7de}
.sec-inner{text-align:center;padding:0 8vw;max-width:1100px}
.sec-step{display:block;font-family:var(--heading);font-weight:900;font-stretch:125%;letter-spacing:.4em;font-size:14px;color:var(--accent);margin-bottom:26px}
.module--section h2{font-size:clamp(34px,6.5vw,92px);color:var(--fg)}
.sec-sub{margin-top:30px;font-size:clamp(15px,1.5vw,20px);line-height:1.7;color:var(--muted);font-weight:300;max-width:720px;margin-left:auto;margin-right:auto}
/* TEXT */
.module--text{align-items:center;justify-content:center;background:var(--bg)}
.text-inner{max-width:920px;padding:12vh 8vw;text-align:center}
.module--text h2{font-size:clamp(28px,4.5vw,60px);color:var(--fg);margin-bottom:48px}
.text-body p{font-size:clamp(16px,1.7vw,23px);line-height:1.85;color:#3a3358;font-weight:400}
.text-body p+p{margin-top:22px}
/* SINGLE IMAGE */
.module--image.single{align-items:stretch}
.single .full{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.single-cap{position:absolute;left:0;right:0;bottom:0;padding:6vh 6vw;background:linear-gradient(to top,rgba(0,0,0,.8),transparent);display:flex;flex-direction:column;gap:8px}
.cap-main{font-size:clamp(24px,4vw,56px);color:#fff}
.cap-sub{font-family:var(--heading);font-weight:900;font-stretch:125%;letter-spacing:.28em;font-size:clamp(11px,1.2vw,15px);color:var(--accent);text-transform:uppercase}
/* GRID */
.grid-mod{flex-direction:column;justify-content:center;align-items:center;padding:9vh 4vw;background:var(--bg)}
.grid-head{width:100%;text-align:center;margin-bottom:5vh}
.grid-head h2{font-size:clamp(24px,4vw,54px);color:var(--fg)}
.grid{display:grid;gap:14px;width:100%;max-width:1500px}
.grid-2{grid-template-columns:repeat(2,1fr)}
.grid-3{grid-template-columns:repeat(3,1fr)}
.grid-4{grid-template-columns:repeat(4,1fr)}
.cell{position:relative;overflow:hidden;background:#b4abd8}
.cell img{width:100%;aspect-ratio:16/9;object-fit:cover;transition:transform .5s ease}
.cell:hover img{transform:scale(1.04)}
.grid-cap{position:absolute;left:0;bottom:0;right:0;padding:14px 14px 12px;font-family:var(--heading);font-weight:900;font-stretch:110%;text-transform:uppercase;letter-spacing:.14em;font-size:12px;color:#fff;background:linear-gradient(to top,rgba(0,0,0,.82),transparent)}
.grid-note{margin-top:5vh;text-align:center;color:var(--muted);font-weight:300;font-size:clamp(15px,1.6vw,21px);max-width:760px}
/* VIDEO */
.module--video{align-items:center;justify-content:center;background:var(--bg);flex-direction:column;padding:8vh 4vw}
.voverlay{text-align:center;margin-bottom:4vh;z-index:3}
.voverlay h2{font-size:clamp(22px,3.4vw,46px);color:var(--fg)}
.vsub{margin-top:16px;color:var(--muted);font-weight:300;font-size:clamp(14px,1.5vw,19px);max-width:780px;margin-left:auto;margin-right:auto;line-height:1.6}
.vgrid{display:grid;gap:16px;width:100%;max-width:1500px}
.vgrid.one{grid-template-columns:1fr;max-width:1200px}
.vgrid.two{grid-template-columns:repeat(2,1fr)}
.vwrap{position:relative;aspect-ratio:16/9;overflow:hidden;background:#0a0a0a}
.vposter{width:100%;height:100%;object-fit:cover}
.vtag{position:absolute;top:14px;left:14px;z-index:3;font-family:var(--heading);font-weight:900;font-stretch:110%;text-transform:uppercase;letter-spacing:.18em;font-size:11px;color:#fff;background:rgba(40,33,66,.72);padding:7px 12px;border-radius:2px;backdrop-filter:blur(2px)}
.vgrid.compare .vwrap{background:#b4abd8}
.playbtn{position:absolute;inset:0;margin:auto;width:88px;height:88px;border-radius:50%;border:2px solid rgba(255,255,255,.9);background:rgba(0,0,0,.28);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .25s,transform .25s;backdrop-filter:blur(2px)}
.playbtn:hover{background:rgba(0,0,0,.55);transform:scale(1.06)}
.playbtn span{display:block;width:0;height:0;border-left:22px solid #fff;border-top:14px solid transparent;border-bottom:14px solid transparent;margin-left:6px}
video.playing{width:100%;height:100%;object-fit:cover;position:absolute;inset:0;background:#000}
/* FOOTER */
.module--footer{align-items:center;justify-content:center;background:#bfb7de}
.foot-inner{text-align:center;padding:0 6vw}
.module--footer h2.big{font-size:clamp(44px,9vw,140px);color:var(--fg)}
.foot-logos{display:flex;justify-content:center;gap:56px;align-items:center;margin-top:8vh}
.foot-logos img{height:46px;width:auto;filter:brightness(0);opacity:.82}
.foot-copy{margin-top:6vh;color:var(--muted);font-size:13px;letter-spacing:.05em;font-weight:300}
@media(max-width:900px){
  .grid-3,.grid-4{grid-template-columns:repeat(2,1fr)}
  .vgrid.two{grid-template-columns:1fr}
  .edge{display:none}
  .playbtn{width:64px;height:64px}
}
@media(max-width:560px){
  .grid-2{grid-template-columns:1fr}
}
'''

JS = r'''
document.querySelectorAll('.playbtn').forEach(function(btn){
  btn.addEventListener('click',function(){
    var src=btn.getAttribute('data-src');
    var wrap=btn.parentElement;
    var v=document.createElement('video');
    v.src=src; v.controls=true; v.autoplay=true; v.className='playing'; v.playsInline=true;
    v.onerror=function(){
      wrap.querySelector('.vposter').style.opacity=.4;
      var n=document.createElement('div');
      n.textContent='Clip not bundled — drop '+src+' into the assets folder to enable playback.';
      n.style.cssText='position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px;color:#fff;font:300 14px/1.5 var(--body);background:rgba(0,0,0,.6)';
      wrap.appendChild(n);
    };
    wrap.appendChild(v); btn.style.display='none';
  });
});
'''

DOC = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Shower Fresh — Full AI Production Approach</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;800;900&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>{CSS}</style>
</head>
<body>
<div class="edge" aria-hidden="true">
  <span class="l">Publicis Production &nbsp;&times;&nbsp; Always</span>
  <span class="r">Shower Fresh &nbsp;&middot;&nbsp; AI Production</span>
</div>
<main class="main">
{modules}
</main>
<script>{JS}</script>
</body>
</html>
'''

with open("/sessions/gifted-festive-mccarthy/mnt/outputs/shower_fresh_treatment/index.html","w") as f:
    f.write(DOC)
print("modules:", len(M))
print("bytes:", len(DOC))
