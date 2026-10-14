import cv2, numpy as np
from geo import *
im=cv2.imread('yard.jpg'); ov=im.copy()
G=(138,255,61); B=(255,180,22); Y=(102,183,226); Wt=(255,243,234)
def lab(img,txt,pt,col,scale=.62,anchor='l'):
    (tw,th),_=cv2.getTextSize(txt,cv2.FONT_HERSHEY_SIMPLEX,scale,2); x,y=int(pt[0]),int(pt[1])
    if anchor=='r': x-=tw+12
    if anchor=='c': x-=tw//2+6
    cv2.rectangle(img,(x,y-th-10),(x+tw+12,y+6),(22,10,5),-1); cv2.rectangle(img,(x,y-th-10),(x+tw+12,y+6),col,1)
    cv2.putText(img,txt,(x+6,y-2),cv2.FONT_HERSHEY_SIMPLEX,scale,col,2,cv2.LINE_AA)
def P(X): return tuple(int(v) for v in proj(np.array(X,float)))
def seg(a,b,col,t=3): cv2.line(ov,P(a),P(b),col,t,cv2.LINE_AA)
# racking: uprights and beam levels on the face (z=0), bays 0–8.4 m
for x in (0,2.8,5.6): seg((x,0,0),(x,6.09,0),G,2)
for h in (1.64,3.26,4.88): seg((0,h,0),(8.4,h,0),G,2)
# dimension: one bay width, at floor-ish height
seg((2.8,6.35,0),(5.6,6.35,0),B,3); lab(ov,'bay: 2.7 m beam',(P((4.2,6.35,0))[0],P((4.2,6.35,0))[1]-14),B,anchor='c')
# heights on the x=0 upright
for h,t in ((1.64,'1.6 m'),(3.26,'3.3 m'),(4.88,'4.9 m'),(6.09,'rack top 6.1 m')):
    cv2.circle(ov,P((0,h,0)),6,G,-1); lab(ov,t,(P((0,h,0))[0]-10,P((0,h,0))[1]+6),G,anchor='r')
lab(ov,'black crates ~1.2 x 1.5 m each',P((1.4,2.55,0)),Wt,anchor='c')
# yurt lattice (khana) stack and benches
seg((1.28,0,4.25),(3.67,0,4.45),Y,3); lab(ov,'khana stack 2.4 m long, 0.95 m high',(P((2.5,0,4.35))[0],P((2.5,0,4.35))[1]+40),Y,anchor='c')
lab(ov,'bench 0.98 m',(P((5.1,0.98,5.5))[0],P((5.1,0.98,5.5))[1]-12),Y,anchor='c')
# forklift check against the spec
lab(ov,'forklift guard 2.16 m (Doosan spec) sets the scale',(20,750),B)
# clear floor
seg((1.5,0,7.0),(7.0,0,7.0),G,2); seg((1.5,0,7.0),(1.5,0,11.5),G,2); seg((7.0,0,7.0),(7.0,0,11.5),G,2)
lab(ov,'clear floor ~5.5 x 4.5 m',P((4.2,0,8.6)),G,anchor='c')
out=cv2.addWeighted(ov,0.92,im,0.08,0)
lab(out,'camera 1.6 m high, 12.4 m from racking, 20 deg to it  |  fit 4 px  |  sizes +/- ~5%',(18,1990),Wt,.55)
cv2.imwrite('yard-measured.jpg',out,[cv2.IMWRITE_JPEG_QUALITY,88])
