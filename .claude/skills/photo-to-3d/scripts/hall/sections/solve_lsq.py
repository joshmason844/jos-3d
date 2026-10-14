import numpy as np, json, sys
from scipy.optimize import least_squares
from scipy.spatial.transform import Rotation as Rot
def solve(obj,img,W=1512,H=2016,hcam=1.45,wh=40.,out='cam.json',extra=None):
    f=26/43.27*np.hypot(W,H); K=np.array([[f,0,W/2],[0,f,H/2],[0,0,1.]])
    def proj(p,X):
        R=Rot.from_euler('yxz',p[:3]).as_matrix()  # camera-to-world
        Xc=(X-p[3:6])@R; Xc=Xc*np.array([1,-1,-1]); uv=(K@Xc.T).T; return uv[:,:2]/uv[:,2:]
    def res(p): return np.concatenate([(proj(p,obj)-img).ravel(),[wh*(p[4]-hcam)]])
    best=None
    for yaw in np.linspace(-1,1,9):
        p0=np.array([yaw,0,0,0.6,hcam,5.]); r=least_squares(res,p0)
        if best is None or r.cost<best.cost: best=r
    p=best.x; e=np.linalg.norm(proj(p,obj)-img,axis=1)
    R=Rot.from_euler('yxz',p[:3]).as_matrix()
    print('rms',e.mean().round(2),'max',e.max().round(1),'cam',p[3:6].round(2))
    json.dump({'f':f,'W':W,'H':H,'cam':p[3:6].tolist(),'R':R.tolist()},open(out,'w'))
    def floor(u,v,y=0):
        d=R@(np.linalg.inv(K)@np.array([u,v,1.])*np.array([1,-1,-1])); s=(y-p[4])/d[1]; return (p[3:6]+s*d).round(2)
    return floor
if __name__=='__main__':
    obj=np.array([[0,.99,0],[1.2,.99,0],[0,0,0],[1.2,0,0],[0,1.77,0],[1.2,1.77,0]],float)
    img=np.array([[952,1260],[1290,1260],[957,1505],[1295,1480],[940,1040],[1265,1040]],float)
    fl=solve(obj,img)
    for n,uv in {'redrack_front_post_base':(1220,1400),'redrack2':(1460,1390),'purple_foot_L':(551,1539),'purple_foot_R':(833,1559),'blue_foot':(225,1590)}.items(): print(n,fl(*uv))
