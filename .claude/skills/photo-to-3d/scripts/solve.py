import numpy as np, json
from scipy.optimize import least_squares
W,H=1512,2016; f0=1515.0; cx,cy=W/2,H/2
P=2.8  # upright pitch: 2.7 m beam + 0.1 m frame (standard UK pallet racking)
# observations (x_px, y_px): upright index i (0 = x636, 1 = x943, 2 = x1312), level key
obs=[ (0,'L1',636,900),(0,'L2',636,712),(0,'L3',636,518),(0,'top',636,387),
      (1,'L1',943,890),(1,'L2',943,690),(1,'L3',943,490),(1,'top',943,340),
      (2,'L1',1312,890),(2,'L2',1312,682),(2,'L3',1312,468),(2,'top',1312,293),
      ]
levels=['L1','L2','L3','top']
def rot(yaw,pitch,roll):
    cy_,sy=np.cos(yaw),np.sin(yaw);cp,sp=np.cos(pitch),np.sin(pitch);cr,sr=np.cos(roll),np.sin(roll)
    Ry=np.array([[cy_,0,sy],[0,1,0],[-sy,0,cy_]]);Rx=np.array([[1,0,0],[0,cp,-sp],[0,sp,cp]]);Rz=np.array([[cr,-sr,0],[sr,cr,0],[0,0,1]])
    return Ry@Rx@Rz
def project(p,X):
    yaw,pitch,roll,tx,ty,tz=p[:6]; f=f0
    R=rot(yaw,pitch,roll); C=np.array([tx,ty,tz])          # camera centre in world (x along rack, y up, z out of rack face)
    d=(X-C)@R                                               # world → camera (camera looks down -z)
    return np.c_[cx+f*d[:,0]/-d[:,2], cy-f*d[:,1]/-d[:,2]]
def resid(p):
    hs=dict(zip(levels,p[6:10])); hs['floor']=0.0
    X=np.array([[o[0]*P,hs[o[1]],0.0] for o in obs]); uv=project(p,X)
    base=(uv-np.array([[o[2],o[3]] for o in obs])).ravel()
    # forklift: Doosan G15S overhead guard top is 2.16 m (7.09 ft) above its tyres' floor points
    R=rot(*p[:3]); C=np.array(p[3:6])
    def fh(u,v):
        d=np.array([(u-cx)/f0,-(v-cy)/f0,-1.0])@R.T; t=-C[1]/d[1]; return C+t*d
    def ht(u,v,foot):
        d=np.array([(u-cx)/f0,-(v-cy)/f0,-1.0])@R.T; a=d[[0,2]]; b=foot[[0,2]]-C[[0,2]]; t=(a@b)/(a@a); return (C+t*d)[1]
    g=[(ht(300,778,fh(330,1240))-2.16)*120,(ht(40,778,fh(100,1285))-2.16)*120]
    return np.r_[base,g]
p0=np.array([0.3,0,0, 3.0,1.5,12.0, 1.2,2.8,4.4,5.8])
r=least_squares(resid,p0)
p=r.x; hs=dict(zip(levels,p[6:10]))
err=np.abs(r.fun[:-2]).reshape(-1,2); print('rms px',np.sqrt((r.fun[:-2]**2).mean()).round(1),'max',err.max().round(1))
print('camera: yaw %.1f°, pitch %.1f°, roll %.1f°, height %.2f m, %.1f m back from rack face, %.1f m along'%(np.degrees(p[0]),np.degrees(p[1]),np.degrees(p[2]),p[4],p[5],p[3]))
print('levels (m):',{k:round(v,2) for k,v in hs.items()})
json.dump({'yaw':p[0],'pitch':p[1],'roll':p[2],'cam':[p[3],p[4],p[5]],'levels':hs,'P':P,'f':f0,'W':W,'H':H},open('cam.json','w'),indent=1)
# floor ray helper: where does a pixel hit the floor (y=0)?
def floor_hit(u,v):
    R=rot(*p[:3]); C=np.array(p[3:6]); d=np.array([(u-cx)/f0,-(v-cy)/f0,-1.0])@R.T
    t=-C[1]/d[1]; return C+t*d
for name,(u,v) in {'forklift rear-left tyre':(100,1285),'forklift rear-right tyre':(330,1240),'lattice stack front-left':(545,1150),'lattice stack front-right':(890,1195),'trestle front leg':(1130,1255),'photo bottom centre':(756,2016)}.items():
    q=floor_hit(u,v); print(f'{name:28s} x {q[0]:6.2f}  z {q[2]:6.2f}')

def height_at(u,v,foot):  # height where pixel ray passes above floor point foot (closest approach to that vertical line)
    R=rot(*p[:3]); C=np.array(p[3:6]); d=np.array([(u-cx)/f0,-(v-cy)/f0,-1.0])@R.T
    # minimise horizontal distance between ray and vertical line through foot
    a=d[[0,2]]; b=foot[[0,2]]-C[[0,2]]; t=(a@b)/(a@a); return (C+t*d)[1]
fr=floor_hit(330,1240); fl=floor_hit(100,1285)
print('guard top above right tyre: %.2f m'%height_at(300,778,fr), ' above left tyre: %.2f m'%height_at(40,778,fl))
print('rear tyre spacing (track): %.2f m'%np.linalg.norm(fr-fl))
print('Calor bottle top: %.2f m'%height_at(200,935,(fr+fl)/2), 'bottle length: %.2f m'%np.linalg.norm(floor_hit(110,1000)-floor_hit(325,960)))
