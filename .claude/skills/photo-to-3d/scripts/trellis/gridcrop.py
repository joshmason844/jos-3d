import cv2, numpy as np, sys
def gridcrop(f, x0, y0, x1, y1, step=20, s=2):
    im = cv2.imread(f)[y0:y1, x0:x1].copy(); im = cv2.resize(im, None, fx=s, fy=s, interpolation=cv2.INTER_CUBIC)
    for X in range((x0 // step + 1) * step, x1, step):
        u = int((X - x0) * s); cv2.line(im, (u, 0), (u, im.shape[0]), (0, 255, 0) if X % 100 == 0 else (0, 110, 0), 1)
        if X % 100 == 0: cv2.putText(im, str(X), (u + 2, 14), 0, .45, (0, 255, 255), 1)
    for Y in range((y0 // step + 1) * step, y1, step):
        v = int((Y - y0) * s); cv2.line(im, (0, v), (im.shape[1], v), (0, 255, 0) if Y % 100 == 0 else (0, 110, 0), 1)
        if Y % 100 == 0: cv2.putText(im, str(Y), (2, v - 2), 0, .45, (0, 255, 255), 1)
    return im
