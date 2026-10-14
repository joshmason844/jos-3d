import numpy as np, cv2, json
W,H=1512,2016; f=26/43.27*np.hypot(W,H)
K=np.array([[f,0,W/2],[0,f,H/2],[0,0,1.]])
obj=[];img=[]
def P(x,y,u,v): obj.append([x,y,0]); img.append([u,v])
for x,u in [(0,425),(1.2,898)]: P(x,0,u,1600)
P(0,.11,420,1548);P(1.2,.11,898,1548)
P(0,1.24,430,1108);P(1.2,1.24,900,1110)
P(0,1.35,430,1065);P(1.2,1.35,905,1060)
P(0,2.48,435,622);P(1.2,2.48,905,625)
obj=np.array(obj,float); img=np.array(img,float)
# world y up; OpenCV wants any frame — use world as is
ok,r,t=cv2.solvePnP(obj,img,K,None,flags=cv2.SOLVEPNP_ITERATIVE)
pr,_=cv2.projectPoints(obj,r,t,K,None); err=np.linalg.norm(pr[:,0]-img,axis=1)
R,_=cv2.Rodrigues(r); C=(-R.T@t).ravel()
print('rms px',err.mean().round(2),'cam',C.round(3))
def ray_floor(u,v,yplane=0):
    d=R.T@np.linalg.inv(K)@np.array([u,v,1.]); s=(yplane-C[1])/d[1]; return (C+s*d).round(3)
for n,uv in {'bed_front_left_floor':(1185,1650),'bed_block_right':(1390,1650),'bed_side_back':(1035,1595),'still_fl':(545,1850),'still_fr':(1170,1770),'still_br':(995,1600),'still_bl':(525,1640)}.items(): print(n,ray_floor(*uv))
# three.js camera: Rc = R^T diag(1,-1,-1)
Rc=R.T@np.diag([1,-1,-1])
json.dump({'f':f,'W':W,'H':H,'cam':C.tolist(),'R':Rc.tolist()},open('cam.json','w'))
