import json, numpy as np
c=json.load(open('cam.json')); f=c['f']; W,H=c['W'],c['H']; cx,cy=W/2,H/2
def rot(yaw,pitch,roll):
    cy_,sy=np.cos(yaw),np.sin(yaw);cp,sp=np.cos(pitch),np.sin(pitch);cr,sr=np.cos(roll),np.sin(roll)
    return np.array([[cy_,0,sy],[0,1,0],[-sy,0,cy_]])@np.array([[1,0,0],[0,cp,-sp],[0,sp,cp]])@np.array([[cr,-sr,0],[sr,cr,0],[0,0,1]])
R=rot(c['yaw'],c['pitch'],c['roll']); C=np.array(c['cam'])
def ray(u,v): return np.array([(u-cx)/f,-(v-cy)/f,-1.0])@R.T
def floor(u,v): d=ray(u,v); t=-C[1]/d[1]; return C+t*d
def on_z(u,v,z): d=ray(u,v); t=(z-C[2])/d[2]; return C+t*d   # plane z = const (rack face z=0)
def up_from(u,v,foot): d=ray(u,v); a=d[[0,2]]; b=np.asarray(foot)[[0,2]]-C[[0,2]]; t=(a@b)/(a@a); return (C+t*d)[1]
def proj(X): d=(np.asarray(X,float)-C)@R; return np.c_[cx+f*d[...,0]/-d[...,2], cy-f*d[...,1]/-d[...,2]] if np.ndim(X)>1 else (cx+f*d[0]/-d[2], cy-f*d[1]/-d[2])
