"""Build both people as meshes: python3 build_people.py [out.json] [key ...]
Writes {key: {label, height, meshes: [...], eyes, cords}} for people.js to load."""
import json, sys, time
import numpy as np
from sdf import f32, V, ellipsoid, Waves
from person import Person, SPECS, H0
from mesh import region, grad, ao, pack, taubin, smooth_scalar

ORDER = ['skin', 'tee', 'trousers', 'shoe', 'sole', 'hair', 'beard', 'brow']


def mix(a, b, t):
    return a * (1 - t[:, None]) + b * t[:, None]


def blob(P, c, r):
    return np.clip(1 - np.linalg.norm((P - np.asarray(c, f32)) / np.asarray(r, f32), axis=1), 0, 1)


def colour(p, v, n, lab, occ):
    S = p.S; C = lambda t: np.asarray(t, f32)
    col = np.zeros((len(v), 3), f32)
    base = {'skin': C(S['skin']), 'tee': C(S['tee']), 'trousers': C(S['trousers']), 'shoe': C(S['shoe']), 'sole': C(S['sole']),
            'hair': C(S['hair']['color']), 'beard': C(S['beard']['color']), 'brow': C(S['brows'])}
    for i, k in enumerate(ORDER):
        col[lab == i] = base[k]
    sk = lab == 0; P = v[sk]
    if sk.any():
        red = C((205, 120, 105)); c = col[sk]
        flush = np.maximum.reduce([blob(P, (sx * .047, 1.648, .078), (.03, .022, .03)) for sx in (-1, 1)] + [blob(P, (0, 1.646, .11), (.016, .014, .02)) * 1.2,
                                   blob(P, (.078, 1.678, -.006), (.02, .04, .03)), blob(P, (-.078, 1.678, -.006), (.02, .04, .03))])
        c = mix(c, red, np.clip(flush, 0, 1) * .16)
        lip = np.maximum(blob(P, (0, 1.6115, .093), (.026, .0085, .015)), blob(P, (0, 1.6005, .093), (.023, .0095, .015)))
        c = mix(c, C(S['lips']), np.clip(lip * 2.2, 0, 1) * .6)
        # brows: an arc of hair colour above each eye
        bx = np.abs(P[:, 0]); tt = np.clip((bx - .012) / .042, 0, 1)
        arc = 1.7035 + .007 * np.sin(tt * 2.8) - .006 * tt
        brow = np.clip(1 - np.abs(P[:, 1] - arc) / (.0068 - .0028 * tt), 0, 1) * (bx > .01) * (bx < .056) * (P[:, 2] > .055)
        brow *= .75 + .25 * np.random.default_rng(2).random(len(P))
        c = mix(c, C(S['brows']), np.clip(brow * 1.3, 0, .92))
        under = np.maximum.reduce([blob(P, (sx * .032, 1.674, .08), (.016, .008, .02)) for sx in (-1, 1)])
        c = mix(c, c * .82, under)
        if S['beard']['kind'] == 'stubble':
            x, y, z = P[:, 0], P[:, 1], P[:, 2]; ax = np.abs(x)
            line = 1.648 - (.068 - np.clip(ax, .03, .068)) * .9                    # cheek line: high at the sideburns, low by the mouth
            m = (y < line) & (z > -.035)
            m = m * np.clip((y - 1.535 - np.clip(z, 0, .08) * .2) / .015, 0, 1)        # fades out down the neck
            m = m * ~((ax < .03) & (y > 1.594) & (y < 1.617) & (z > .085))       # lips stay clear
            moust = (ax < .03) & (y > 1.614) & (y < 1.628) & (z > .085)
            soft = np.clip((line - y) / .01, 0, 1) * np.clip((z + .035) / .02, 0, 1)
            t = (m * soft + moust * .8) * (.2 + .2 * np.random.default_rng(1).random(len(P)))
            c = mix(c, C(S['beard']['color']), np.clip(t, 0, .6))
        col[sk] = c
    hm = (lab == 5) | (lab == 6)
    if hm.any():
        P = v[hm]; dsk = ellipsoid(P, V(0, 1.705, -.012), V(.076, .098, .097)) if True else 0
        u = (P - V(0, 1.705, -.012)) / V(.076, .098, .097); u /= np.linalg.norm(u, axis=1, keepdims=True)
        top = np.clip(u[:, 1], 0, 1)[:, None]
        flow = (V(-.55, .25, .35) if S['hair']['style'] == 'messy' else V(0, .35, -1)) * top + V(0, -1, -.2) * (1 - top)
        flow /= np.linalg.norm(flow, axis=1, keepdims=True)
        Ps = P - .92 * (P * flow).sum(1, keepdims=True) * flow                      # squash along the flow: streaks follow the hair
        streak = Waves(23, 24, .0045)(Ps)
        t = np.clip(dsk / .03, 0, 1) ** 1.2 * (.7 + .3 * Waves(21, 14, .02)(P)) + .12 * streak
        tips = C(S['hair']['tips']) if (lab[hm] == 5).all() else C(S['hair']['tips'])
        c = col[hm]; c = mix(c, tips, np.clip(t, 0, 1)); c *= (.92 + .1 * streak)[:, None]
        col[hm] = c
    col *= occ[:, None]
    return np.clip(col, 0, 255)


def keep_hands(p, inside):
    """Distance-like mask: <0 means the point belongs to the hand zones (inside=True) or everywhere else (inside=False)."""
    hs = p.hands

    def fn(P):
        out = np.full(len(P), -1.0 if not inside else 1.0, f32)
        for hd in hs:
            a = hd['a']; M = hd['W'] - a * .045
            c = (P - M) @ a; radial = np.linalg.norm((P - M) - c[:, None] * a, axis=1)
            zone = (radial < .11) & (c > -.08)
            if inside:
                out = np.where(zone, -(c + .012), out)
            else:
                out = np.where(zone, np.maximum(out, c), out)
        return out
    return fn


def build(key):
    t0 = time.time(); p = Person(key); s = p.S['height'] / H0
    print(key, len(p.F.parts), 'parts')
    tee = p.gdist('tee'); hair = p.gdist('hair'); kh_out = keep_hands(p, False); kh_in = keep_hands(p, True)
    # each surface meshed on its own (clean edges where clothes end), hidden insides carved away
    plan = [('skin', (-.66, 0, -.22), (.66, 1.56, .3), .0075, lambda P: np.maximum.reduce([P[:, 1] - 1.55, kh_out(P), -(tee(P) + .008)]), 8),
            ('skin', (-.17, 1.535, -.18), (.17, 1.89, .19), .0032, lambda P: np.maximum(1.538 - P[:, 1], -(hair(P) + .004)), 3)]
    for hd in p.hands:
        c = hd['W'] + hd['a'] * .06
        plan.append(('skin', c - .135, c + .135, .0034, kh_in, 3))
    plan += [('tee', (-.44, .78, -.2), (.44, 1.57, .2), .0075, None, 8),
             ('trousers', (-.3, 0, -.2), (.3, 1.06, .2), .009, None, 8),
             ('shoe', (-.26, 0, -.16), (.26, .17, .26), .006, None, 4), ('sole', (-.26, 0, -.16), (.26, .06, .26), .006, None, 3),
             ('hair', (-.17, 1.56, -.19), (.17, 1.9, .19), .0031, None, 2),
             ]
    if p.S['beard']['kind'] == 'full':
        plan.append(('beard', (-.1, 1.53, -.06), (.1, 1.66, .13), .0027, None, 2))
    meshes = []
    for g, lo, hi, h, keep, sm in plan:
        fn = p.gdist(g)
        v, f = region(fn, np.asarray(lo, f32), np.asarray(hi, f32), h, keep)
        if not len(v): continue
        v = taubin(v, f, sm)
        n = grad(fn, v)
        fnm = np.cross(v[f[:, 1]] - v[f[:, 0]], v[f[:, 2]] - v[f[:, 0]])
        if (np.einsum('ij,ij->i', fnm, n[f].sum(1)) < 0).mean() > .5:
            f = f[:, ::-1].copy()
        lab = np.full(len(v), ORDER.index(g))
        occ = smooth_scalar(ao(p.dist, v, n, .02 if h > .005 else .007), f, 6 if h > .005 else 2)
        if g in ('tee', 'trousers'): occ = .75 + .25 * occ                          # cloth: only a hint of contact shadow
        col = colour(p, v, n, lab, occ)
        m = pack(v, f, n, col, lab, ORDER, s); m['name'] = g; meshes.append(m)
    eyes = [dict(c=(np.asarray(e['c']) * s).tolist(), r=e['r'] * s) for e in p.extras['eyes']]
    cords = (np.asarray(p.extras['cords'], f32) * s).tolist() if 'cords' in p.extras else []
    S = p.S
    print(f'{key}: {sum(m["nt"] for m in meshes)} tris in {time.time() - t0:.0f}s')
    return dict(label=S['label'], height=S['height'], meshes=meshes, eyes=eyes, iris=list(S['iris']), cords=cords,
                logo='KDK' if key == 'kdk' else None)


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'people_meshes.json'
    keys = sys.argv[2:] or list(SPECS)
    data = {}
    try:
        data = json.load(open(out))
    except Exception:
        pass
    for k in keys:
        data[k] = build(k)
    json.dump(data, open(out, 'w'))
    import gzip, base64
    gz = gzip.compress(json.dumps(data).encode(), 9)
    open(out.replace('.json', '.gz.b64'), 'w').write(base64.b64encode(gz).decode())
    print('gzipped', round(len(gz) / 1e6, 2), 'MB')
    print('wrote', out, round(len(json.dumps(data)) / 1e6, 2), 'MB')
