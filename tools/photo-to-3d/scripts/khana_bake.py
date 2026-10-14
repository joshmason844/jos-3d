import cv2, numpy as np, base64, json
faces = {  # photo, quad TL TR BR BL (px), output size (px) ~ 500 px per metre
  'front': ('front.jpg', [(150, 555), (1815, 555), (1815, 1218), (150, 1218)], (1200, 500)),
  'back':  ('back.jpg',  [(202, 605), (1774, 605), (1774, 1290), (202, 1290)], (1200, 500)),
  'endA':  ('end.jpg',   [(450, 383), (1480, 383), (1480, 1088), (450, 1088)], (700, 500)),
  'endB':  ('corner.jpg',[(262, 564), (1532, 564), (1532, 1310), (262, 1310)], (700, 500)),
}
out = {}
for k, (f, q, (w, h)) in faces.items():
    im = cv2.imread(f); M = cv2.getPerspectiveTransform(np.float32(q), np.float32([[0, 0], [w, 0], [w, h], [0, h]]))
    t = cv2.warpPerspective(im, M, (w, h), flags=cv2.INTER_CUBIC)
    ok, b = cv2.imencode('.jpg', t, [cv2.IMWRITE_JPEG_QUALITY, 84]); out[k] = 'data:image/jpeg;base64,' + base64.b64encode(b).decode(); cv2.imwrite(f'kb_{k}.jpg', t)
json.dump(out, open('kbake.json', 'w')); print({k: len(v) // 1024 for k, v in out.items()}, 'KB')
cv2.imwrite('kb_all.jpg', np.vstack([np.hstack([cv2.resize(cv2.imread('kb_front.jpg'), (600, 250)), cv2.resize(cv2.imread('kb_back.jpg'), (600, 250))]), np.hstack([cv2.resize(cv2.imread('kb_endA.jpg'), (600, 250)), cv2.resize(cv2.imread('kb_endB.jpg'), (600, 250))])]))
