# Eco-Rider pixel bake — turns the illustrated rider sheets + bike renders into grid-true
# pixel sprites that match the procedural world. Run from the eco_rider folder: python3 pix.py
# Recipe: flatten shading (median) -> box downscale to world pixel size -> hard alpha ->
#         16-colour palette -> 3x3 majority cleanup -> 1px outline, lit edge (top/right) highlighted.
from PIL import Image, ImageFilter, ImageEnhance
from collections import deque, Counter
import numpy as np
OUT=(20,18,26,255); HI_MIX=0.45
def bake(src,frames,frame_w,target_h,ncol=16,ath=150,flatten=9,cleanup=True,contrast=1.18,sat=1.15):
    im=Image.open(src).convert('RGBA')
    im=ImageEnhance.Contrast(im).enhance(contrast); im=ImageEnhance.Color(im).enhance(sat)
    if flatten:
        rgb=im.convert('RGB').filter(ImageFilter.MedianFilter(flatten)); im=Image.merge('RGBA',(*rgb.split(),im.split()[3]))
    ch=im.height; s=target_h/ch; w=round(frame_w*s)
    sheet=Image.new('RGBA',(w*frames,target_h),(0,0,0,0))
    for i in range(frames):
        sheet.paste(im.crop((i*frame_w,0,(i+1)*frame_w,ch)).resize((w,target_h),Image.BOX),(i*w,0))
    px=sheet.load(); Wd,Ht=sheet.size
    for y in range(Ht):
        for x in range(Wd):
            r,g,b,a=px[x,y]; px[x,y]=(r,g,b,255) if a>=ath else (0,0,0,0)
    qi=sheet.convert('RGB').quantize(colors=ncol,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)
    idx=np.array(qi); pal=qi.getpalette()[:ncol*3]; pal=[tuple(pal[i*3:i*3+3]) for i in range(ncol)]
    alpha=np.array([[1 if px[x,y][3] else 0 for x in range(Wd)] for y in range(Ht)])
    if cleanup:
        new=idx.copy()
        for y in range(Ht):
            for x in range(Wd):
                if not alpha[y,x]: continue
                c=Counter()
                for dy in(-1,0,1):
                    for dx in(-1,0,1):
                        yy,xx=y+dy,x+dx
                        if 0<=yy<Ht and 0<=xx<Wd and alpha[yy,xx]: c[idx[yy,xx]]+=1
                top,n=c.most_common(1)[0]
                if n>=5 and top!=idx[y,x]: new[y,x]=top
        idx=new
    q=Image.new('RGBA',sheet.size,(0,0,0,0)); qp=q.load()
    for y in range(Ht):
        for x in range(Wd):
            if alpha[y,x]: qp[x,y]=pal[idx[y,x]]+(255,)
    outside=set()
    for i in range(frames):
        x0=i*w; dq=deque([(x,y) for x in range(x0,x0+w) for y in (0,Ht-1)]+[(x,y) for y in range(Ht) for x in (x0,x0+w-1)])
        while dq:
            x,y=dq.popleft()
            if (x,y) in outside or x<x0 or x>=x0+w or y<0 or y>=Ht or qp[x,y][3]: continue
            outside.add((x,y)); dq.extend(((x+1,y),(x-1,y),(x,y+1),(x,y-1)))
    def out(x,y): return x<0 or y<0 or x>=Wd or y>=Ht or (x,y) in outside
    o=q.copy(); op=o.load()
    for y in range(Ht):
        for x in range(Wd):
            if not qp[x,y][3]: continue
            if any(out(x+dx,y+dy) for dx,dy in((1,0),(-1,0),(0,1),(0,-1))):
                if out(x,y-1) or out(x+1,y):
                    r,g,b,_=qp[x,y]; op[x,y]=(int(r+(255-r)*HI_MIX),int(g+(255-g)*HI_MIX),int(b+(255-b)*HI_MIX),255)
                else: op[x,y]=OUT
    return o
if __name__=='__main__':
    for key,(cw,nf) in {'city':(326,13),'mini':(258,14),'monster':(367,10)}.items():
        o=bake(f'{key}_rider_sheet.png',nf,cw,57); o.save(f'{key}_rider_px.png'); print(key,o.size)
    for key in ('city','mini','monster'):
        im=Image.open(f'{key}-full.png'); th=round(68*im.height/im.width)
        o=bake(f'{key}-full.png',1,im.width,th,contrast=1.1,sat=1.1); o.save(f'{key}-menu_px.png'); print(key,'menu',o.size)
