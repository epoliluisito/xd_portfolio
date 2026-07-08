# -*- coding: utf-8 -*-
import html
A="assets/"
def esc(s): return html.escape(s,quote=True)
TWIL=A+"image3.png"; PUB=A+"image2.png"
def corner():
    return f'<div class="corner"><img class="c-tw" src="{TWIL}" alt="Twilio"><img class="c-pub" src="{PUB}" alt="Publicis Production"></div>'

def hero(kicker,title,sub,img):
    return f'''<section class="module hero"><img class="bg" src="{A}{img}" alt=""><div class="scrim"></div>
  <div class="hero-in"><span class="kicker">{esc(kicker)}</span><h1 class="heading">{esc(title)}</h1><p class="hero-sub">{esc(sub)}</p></div>{corner()}</section>'''

def text(paras,big=False,kicker=""):
    if isinstance(paras,str): paras=[paras]
    k=f'<span class="kicker">{esc(kicker)}</span>' if kicker else ""
    b="".join(f"<p>{esc(p)}</p>" for p in paras)
    return f'<section class="module text{" big" if big else ""}"><div class="t-in">{k}{b}</div>{corner()}</section>'

def section(kicker,title,sub="",body=""):
    k=f'<span class="kicker">{esc(kicker)}</span>' if kicker else ""
    s=f'<p class="sec-sub">{esc(sub)}</p>' if sub else ""
    bd=f'<p class="sec-body">{esc(body)}</p>' if body else ""
    return f'<section class="module section"><div class="s-in">{k}<h2 class="heading">{esc(title)}</h2>{s}{bd}</div>{corner()}</section>'

def single(img,caption="",kicker="",contain=False):
    if isinstance(caption,str): caption=[caption] if caption else []
    ov=""
    if caption:
        k=f'<span class="kicker">{esc(kicker)}</span>' if kicker else ""
        ov='<div class="grad-bottom"></div><div class="cap">'+k+"".join(f"<p>{esc(c)}</p>" for c in caption)+'</div>'
    cls="image single"+(" contain" if contain else "")
    return f'<section class="module {cls}"><img class="bg" src="{A}{img}" alt="">{ov}{corner()}</section>'

def statement(img,title,kicker=""):
    k=f'<span class="kicker">{esc(kicker)}</span>' if kicker else ""
    return f'<section class="module image statement"><img class="bg" src="{A}{img}" alt=""><div class="scrim"></div><div class="st-in">{k}<h2 class="heading">{esc(title)}</h2></div>{corner()}</section>'

def imgtext(img,title,body,kicker="",contain=False,wide=False,pos="center",reverse=False):
    if isinstance(body,str): body=[body]
    k=f'<span class="kicker">{esc(kicker)}</span>' if kicker else ""
    h=f'<h2 class="heading small">{esc(title)}</h2>' if title else ""
    b="".join(f"<p>{esc(x)}</p>" for x in body)
    ic="it-img"+(" contain" if contain else "")
    sec="module imgtext"+(" wide" if wide else "")+(" reverse" if reverse else "")
    return f'<section class="{sec}"><div class="{ic}"><img style="object-position:{pos}" src="{A}{img}" alt=""></div><div class="it-txt">{k}{h}{b}</div>{corner()}</section>'

def framed(img,w,kicker,caption):
    if isinstance(caption,str): caption=[caption]
    k=f'<span class="kicker">{esc(kicker)}</span>' if kicker else ""
    cap='<div class="fr-cap">'+k+"".join(f"<p>{esc(c)}</p>" for c in caption)+'</div>' if caption else ""
    return f'<section class="module framed"><div class="fr-in"><img style="max-width:{w}px" src="{A}{img}" alt="">{cap}</div>{corner()}</section>'

def grid(items,cols,kicker="",title="",contain=False):
    cells=""
    for img,label in items:
        lab=f'<span class="g-lab">{esc(label)}</span>' if label else ""
        cells+=f'<figure class="cell{" contain" if contain else ""}"><img src="{A}{img}" alt="{esc(label)}">{lab}</figure>'
    head=""
    if kicker or title:
        k=f'<span class="kicker">{esc(kicker)}</span>' if kicker else ""
        t=f'<h2 class="heading small">{esc(title)}</h2>' if title else ""
        head=f'<div class="g-head">{k}{t}</div>'
    return f'<section class="module gridmod">{head}<div class="grid g{cols}">{cells}</div>{corner()}</section>'

def closing(img,title,sub):
    return f'''<section class="module image closing"><img class="bg" src="{A}{img}" alt=""><div class="scrim"></div>
  <div class="cl-in"><h2 class="heading">{esc(title)}</h2><p class="cl-sub">{esc(sub)}</p></div>
  <span class="cl-foot">The Clarity Builder · Germany 2026</span>{corner()}</section>'''

M=[]
M.append(hero("Film Treatment · 2026","Step Into the Builder Era","The Clarity Builder — Germany","image1.jpg"))
M.append(text(["In 2025, Twilio launched its first global brand campaign: Be a Builder. In 2026, the ambition grows — moving beyond category awareness toward cultural relevance.","To expand who identifies as a builder, and to make building aspirational, not just useful."],kicker="The Campaign"))
M.append(statement("image5.jpg","Step Into the Builder Era.","The 2026 Theme"))
M.append(text(["A developer who sees infrastructure as possibility. A marketer who refuses to accept that generic is good enough. A business leader who looks at a broken customer experience and asks: why hasn’t anyone fixed this yet?"],kicker="Who is a Builder?"))
M.append(imgtext("image6.png","","A Builder has a way of moving through the world. Curious where others are passive. Restless where others accept. Certain that something better can be made."))
M.append(imgtext("image9.jpg","","Builders are defined by mindset rather than job title: they are proactive, creative, pragmatic and focused on making things work better for real people.",reverse=True))
M.append(text(["Twilio’s mission is to make builders visible — to expand who identifies with that word, and to make building feel like a cultural act, not just a technical one.","So we set out to create a series of films that place builders inside the moments that define them."],kicker="The Creative Idea"))
M.append(single("image10.jpg",["London · The Memory Builder","Paris · The Choice Builder","Berlin · The Clarity Builder","Madrid · The Momentum Builder"],kicker="Four Films · Four Cities"))
M.append(text(["Real cities. Real tensions. Decisions that matter.","Expanding who identifies as a builder doesn’t happen through definition."],big=True))
M.append(statement("image11.jpg","It happens through recognition."))
M.append(imgtext("image12.png","","The Builder is defined by his mindset — the way he sees the world, reads its frictions, and acts on them. Twilio is the environment that makes his vision executable.",kicker="Twilio as Enabler"))
M.append(imgtext("image14.jpg","","He is not in front of a screen. He is out in the world — walking, watching, reading the gap between how systems behave and how people feel. This is how he works. The city is his laboratory.",kicker="The Clarity Builder"))
M.append(imgtext("image15.jpg","","He is in his mid-thirties. European, with a background that speaks to the diversity of contemporary Berlin. He moves with quiet purpose. German in his precision — he notices things others don’t because he holds everything to a standard, out of genuine belief that systems should work properly for the people who use them.",reverse=True))
M.append(single("image16.jpg","His style: precise without being corporate, creative without being studied.","Karim Mansouri · The Builder"))
M.append(grid([("image17.jpg","01"),("image18.jpg","02"),("image19.jpg","03"),("image20.jpg","04")],2,kicker="Casting",title="Karim Mansouri"))
M.append(imgtext("image21.jpg","The Woman","Late thirties. Northern European, fair skin, dark hair pulled back without ceremony. A face that registers everything without broadcasting it. She looks like someone who expects things to work — because she always makes sure they do.",kicker="Lena Brandt"))
M.append(grid([("image22.jpg","01"),("image23.jpg","02"),("image24.jpg","03"),("image25.jpg","04")],2,kicker="Casting",title="Lena Brandt"))
M.append(imgtext("image26.png","East Berlin · Kreuzberg","Early morning. A district that carries the tension of the film in its bones — contemporary and historical at once. A place where systems, cultures and generations coexist, not always smoothly.",kicker="Setting"))
M.append(single("image27.jpg",["The streets are active but not crowded. The light is soft. The city is already running — but at a human pace.","This is the environment the Clarity Builder moves through: recognisable, specific, alive."]))
M.append(text(["Each of the four films follows a Builder moving through a recognisable real-world environment that begins to transform around them.","The storylines are built around precisely identified problems — real frictions that the Builders recognise as opportunities to create something new."],kicker="Storytelling"))
M.append(imgtext("image28.png","The Friction","Germany built its identity around precision, reliability and the belief that systems should serve people. But AI and automation are advancing faster than trust — sacrificing clarity and reassurance, leaving people unclear on who’s in control and whether value is truly being created.",kicker="Germany"))
M.append(text(["The Clarity Builder film tackles a sense of scepticism around AI and a lack of clarity around how it adds value.","Here the Builder’s task is to create systems that are understandable, accountable and trustworthy. He recognises the friction not as a technological problem, but as a human one."]))
M.append(text(["V2 structured the film around three separate moments of CX failure. V3 condensed these into a single situation. V4 removes the metaworld entirely — the Builder’s intervention no longer pulls us into an abstract space; accountability surfaces through overlay graphics, directly onto the world we’re already in.","The resolution stays grounded, visible, immediate."],kicker="Script V4"))
M.append(text(["The Clarity Builder’s intervention changes not just the outcome, but the legibility of how the outcome is reached.","A system people can see inside is a system they can begin to trust."]))
M.append(grid([("image29.jpg",""),("image30.jpg","")],2))
M.append(text(["The Clarity Builder walks through East Berlin. Above every interaction, visible only to him, a signal floats — a quiet indicator of how satisfied people are with the CX they’ve just completed."],kicker="The Film"))
M.append(text(["He passes a Packstation. A woman stands at the screen, stopped by an automated message. No explanation. No path forward."]))
M.append(text(["The Builder stops. The world slows; the light shifts — red and blue playing softly on his skin. Graphic overlays bleed into the frame. He reads the code like a map and finds the break: a node with no author, a step where accountability simply isn’t there."]))
M.append(text(["It’s only when we see things clearly that we can build something better. Together."],big=True))
M.append(text(["The code dissolves into a Twilio logo; a human face fades in inside the circle. The interface now shows a name, a role, and a button that wasn’t there before. The woman presses it. The locker opens. She takes her parcel. The Clarity Builder moves on."]))
M.append(single("image31.jpg",["Twilio marks the beginning of an era that elevates life to a dimension of possibility.","Every frame is composed to reflect not just what the world is, but what it could become."],kicker="Cinematography"))
M.append(imgtext("image32.jpg","","The AI live footage aims for a poetic, photorealistic look and feel. The goal is to humanise the Builder as much as possible — to place him in a world that feels real, observed, and true.",reverse=True))
M.append(imgtext("image33.jpg","The Zone of Creation","When the Builder enters the “zone of creation”, the cinematography shifts register. The light darkens; red and blue begin to touch his skin and the surfaces around him, sourced from no visible light. Twilio enters the live action not as a separate world, but as a colour temperature, a presence."))
M.append(single("image34.jpg",["Camera movements are smooth — no sudden cuts, no aggressive angles — following the Builder with elegance. Spherical lenses on a large format: the image breathes, with depth and weight, while we stay focused on the subject."]))
M.append(framed("image35.jpg",1024,"Formats","The film is primarily thought for a 16:9 frame. A 9:16 version is built in parallel, as per requirement."))
M.append(imgtext("image36.jpg","Visual Coherence","The film uses AI photorealistic footage and overlay graphics. The real world is Berlin — concrete, specific, recognisable. Twilio’s branding is always present: subtle but deliberate, in the way scenes are lit, environments are coloured, and motion graphics overlap the live action. The brand is not demonstrated. It is felt."))
M.append(imgtext("image37.jpg","","The graphic elements are part of the film’s core language — and a vehicle for Twilio’s visual identity. Every element belongs to the same visual universe. The result is a film where the brand and the story are inseparable.",reverse=True))
M.append(framed("image38.jpg",1117,"Graphics","Graphics are not finalized here — this slide illustrates integration."))
M.append(imgtext("image39.jpg","Sound Design","The sound world mirrors the visual logic: two registers, precisely balanced. In the live-action world, sound is naturalistic and restrained — early-morning Berlin, distant traffic, footsteps, the ambient hum of a city already moving. Nothing is heightened. Everything is observed.",kicker="Sound"))
M.append(imgtext("image40.jpg","","When the Builder enters the “zone” and the world subtly shifts, the sound shifts too. The city drops away; what replaces it is more internal, more architectural — the sound of a system made audible.",reverse=True))
M.append(imgtext("image41.jpg","Music","The music carries the film’s emotional arc without announcing it. Precise but warm, structured but human — a score that belongs to the Clarity Builder: intelligent, considered, quietly confident.",kicker="Score"))
M.append(text(["The closing beat lands on something that opens rather than resolves. The Clarity Builder moves on. The music moves with him.","Somewhere in the city, another signal is waiting."],big=True))
M.append(closing("image42.jpg","Step Into Clarity.","Step Into the Builder Era."))
modules="\n".join(M)

CSS=r'''
:root{--bg:#0c1017;--panel:#141926;--red:#F22F46;--white:#fff;--soft:#8b93a7;--head:"Inter",system-ui,Arial,sans-serif;--body:"Inter",system-ui,Arial,sans-serif}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--white);font-family:var(--body);-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}
.heading{font-family:var(--head);font-weight:700;letter-spacing:-.01em;line-height:1.04;text-wrap:balance}
p{text-wrap:pretty}
.kicker{font-family:var(--head);font-weight:600;letter-spacing:.22em;text-transform:uppercase;font-size:12px;color:var(--red)}
.module{position:relative;min-height:100vh;width:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:9vh 7vw;border-bottom:1px solid rgba(255,255,255,.05)}
.bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.image.contain .bg{object-fit:contain;background:#0a0d14}
.scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,11,18,.42),rgba(8,11,18,.7))}
.grad-bottom{position:absolute;left:0;right:0;bottom:0;height:48%;background:linear-gradient(to top,rgba(8,11,18,.9),rgba(8,11,18,.15) 72%,transparent);z-index:2}
.corner{position:absolute;right:30px;bottom:26px;display:flex;align-items:center;gap:18px;z-index:6}
.corner .c-tw{height:22px;width:auto}
.corner .c-pub{height:38px;width:auto}
/* hero */
.hero-in{position:relative;text-align:center;z-index:3}
.hero .kicker{display:block;margin-bottom:22px}
.hero h1{font-size:clamp(40px,8vw,104px);font-weight:800;letter-spacing:-.02em;max-width:16ch;margin:0 auto}
.hero-sub{font-family:var(--head);font-weight:500;letter-spacing:.06em;font-size:clamp(14px,1.7vw,22px);color:#cfd5e2;margin-top:20px;text-wrap:balance}
/* text */
.t-in{max-width:920px;text-align:center;position:relative;z-index:2}
.t-in .kicker{display:block;margin-bottom:22px}
.t-in p{font-size:clamp(17px,1.9vw,23px);font-weight:300;line-height:1.55;color:#dfe3ec}
.t-in p+p{margin-top:16px}
.text.big .t-in p{font-size:clamp(23px,3.3vw,44px);font-weight:500;line-height:1.16;letter-spacing:-.01em;color:#fff}
/* section */
.s-in{max-width:1000px;text-align:center;position:relative;z-index:3}
.section .kicker{display:block;margin-bottom:22px}
.section h2{font-size:clamp(28px,4.6vw,62px);font-weight:700;letter-spacing:-.01em}
.sec-sub{margin-top:22px;font-weight:400;font-size:clamp(16px,1.8vw,23px);color:#e2e6ef}
.sec-body{margin-top:22px;font-size:clamp(14px,1.4vw,18px);font-weight:300;line-height:1.6;color:#aeb6c6;max-width:720px;margin-left:auto;margin-right:auto}
/* single */
.statement .st-in{position:relative;z-index:3;text-align:center;max-width:1040px}
.statement .st-in .kicker{display:block;margin-bottom:16px}
.single .cap{position:absolute;left:0;right:0;bottom:0;z-index:3;text-align:center;padding:7vh 7vw}
.single .cap .kicker{display:block;margin-bottom:14px}
.single .cap p{font-size:clamp(16px,1.9vw,24px);font-weight:300;line-height:1.42;text-shadow:0 2px 24px rgba(0,0,0,.5)}
.single .cap p+p{margin-top:8px}
.statement .st-in h2{font-size:clamp(28px,4.8vw,66px);font-weight:800;letter-spacing:-.01em;text-shadow:0 4px 34px rgba(0,0,0,.55)}
/* imgtext */
.imgtext{padding:0;display:flex;flex-direction:row;align-items:stretch}
.imgtext.reverse{flex-direction:row-reverse}
.it-img{flex:1 1 52%;position:relative;background:#0a0d14}
.it-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.it-img.contain img{object-fit:contain}
.it-txt{flex:1 1 48%;display:flex;flex-direction:column;justify-content:center;padding:9vh 6vw;background:var(--bg)}
.it-txt .kicker{margin-bottom:18px}
.it-txt h2.small{font-size:clamp(23px,2.9vw,42px);font-weight:700;letter-spacing:-.01em;margin-bottom:20px}
.it-txt p{font-size:clamp(15px,1.5vw,18px);font-weight:300;line-height:1.62;color:#cfd5e2;max-width:46ch}
.it-txt p+p{margin-top:14px}
.imgtext.wide .it-img{flex:0 0 60%}
.imgtext.wide .it-txt{flex:1 1 40%}
/* framed */
.framed{background:var(--bg);flex-direction:column}
.fr-in{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;text-align:center;gap:30px;width:100%}
.fr-in img{width:100%;max-height:68vh;height:auto;object-fit:contain;border-radius:3px;box-shadow:0 20px 60px rgba(0,0,0,.5)}
.fr-cap{max-width:820px}
.fr-cap .kicker{display:block;margin-bottom:12px}
.fr-cap p{font-size:clamp(16px,1.7vw,21px);font-weight:300;line-height:1.5;color:#dfe3ec}
/* grid */
.gridmod{flex-direction:column;justify-content:center;padding:11vh 5vw}
.g-head{text-align:center;margin-bottom:5vh}
.g-head .kicker{display:block;margin-bottom:12px}
.g-head h2.small{font-size:clamp(22px,3.2vw,40px);font-weight:700;letter-spacing:-.01em}
.grid{display:grid;gap:14px;width:100%;max-width:1500px;margin:0 auto}
.g2{grid-template-columns:repeat(2,1fr)}.g3{grid-template-columns:repeat(3,1fr)}
.cell{position:relative;overflow:hidden;background:#161c2a;border-radius:4px;aspect-ratio:16/9}
.cell img{width:100%;height:100%;object-fit:cover;transition:transform .5s ease}
.cell:hover img{transform:scale(1.04)}
.g-lab{position:absolute;left:0;bottom:0;padding:12px 14px;font-family:var(--head);font-weight:600;letter-spacing:.14em;font-size:11px;color:#fff;background:linear-gradient(to top,rgba(0,0,0,.7),transparent)}
/* closing */
.closing .cl-in{position:relative;z-index:3;text-align:center}
.closing h2{font-size:clamp(30px,5.5vw,80px);font-weight:800;letter-spacing:-.02em;text-shadow:0 4px 30px rgba(0,0,0,.55)}
.cl-sub{margin-top:16px;font-family:var(--head);font-weight:500;letter-spacing:.1em;font-size:clamp(14px,1.8vw,22px);color:#cfd5e2}
.cl-foot{position:absolute;left:30px;bottom:28px;font-family:var(--head);font-weight:600;letter-spacing:.14em;text-transform:uppercase;font-size:11px;color:var(--soft);z-index:5}
@media(max-width:820px){.imgtext{flex-direction:column}.it-img{min-height:50vh}.g3{grid-template-columns:repeat(2,1fr)}}
@media(max-width:560px){.g2,.g3{grid-template-columns:1fr}.corner .c-pub{height:30px}.corner .c-tw{height:18px}}
/* scroll reveal */
.module .kicker,.module h1,.module h2,.module p{opacity:0;transform:translateY(16px);transition:opacity .75s cubic-bezier(.2,.7,.2,1),transform .75s cubic-bezier(.2,.7,.2,1)}
.module.in .kicker,.module.in h1,.module.in h2,.module.in p{opacity:1;transform:none}
.module.in h1,.module.in h2{transition-delay:.06s}
.module.in p{transition-delay:.15s}
.module .bg,.imgtext .it-img img,.fr-in img,.cell img{opacity:0;transition:opacity 1.1s ease}
.module.in .bg,.module.in .it-img img,.module.in .fr-in img,.module.in .cell img{opacity:1}
/* tracker */
.tracker{position:fixed;right:26px;top:50%;transform:translateY(-50%);z-index:40;display:flex;flex-direction:column;align-items:center;gap:11px;font-family:var(--head)}
.tk-cur{font-size:14px;font-weight:600;color:#fff;letter-spacing:.1em}
.tk-total{font-size:11px;font-weight:500;color:var(--soft);letter-spacing:.1em}
.tk-line{position:relative;width:2px;height:118px;background:rgba(255,255,255,.2);border-radius:2px;overflow:hidden}
.tk-line i{position:absolute;left:0;top:0;width:100%;height:0;background:var(--red);transition:height .25s ease}
@media(max-width:900px){.tracker{display:none}}
'''

DOC=f'''<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Twilio — The Clarity Builder · Germany · Film Treatment 2026</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>{CSS}</style></head>
<body><main>{modules}</main>
<div class="tracker"><span class="tk-cur">01</span><span class="tk-line"><i></i></span><span class="tk-total">00</span></div>
<script>
(function(){{
 var mods=[].slice.call(document.querySelectorAll('main > section'));
 var total=mods.length, cur=document.querySelector('.tk-cur'), tot=document.querySelector('.tk-total'), fill=document.querySelector('.tk-line i');
 tot.textContent=('0'+total).slice(-2);
 function pad(n){{return ('0'+n).slice(-2);}}
 if(!('IntersectionObserver' in window)){{mods.forEach(function(m){{m.classList.add('in');}});return;}}
 var rev=new IntersectionObserver(function(es){{es.forEach(function(e){{if(e.isIntersecting)e.target.classList.add('in');}});}},{{threshold:.12}});
 var spy=new IntersectionObserver(function(es){{es.forEach(function(e){{if(e.isIntersecting)cur.textContent=pad(mods.indexOf(e.target)+1);}});}},{{rootMargin:'-48% 0px -48% 0px'}});
 mods.forEach(function(m){{rev.observe(m);spy.observe(m);}});
 window.addEventListener('scroll',function(){{var h=document.documentElement.scrollHeight-window.innerHeight;var p=h>0?window.scrollY/h:0;fill.style.height=(Math.max(0,Math.min(1,p))*100)+'%';}},{{passive:true}});
}})();
</script>
</body></html>'''
open("/sessions/gifted-festive-mccarthy/mnt/outputs/twilio_germany/index.html","w").write(DOC)
print("modules:",len(M),"bytes:",len(DOC))
