"""Sculpted people: one smooth skin, a carved face, hair and beard grown as clumps, clothes as solid shells.
Built in a 1.80 m reference body (metres, y up, facing +z, feet on y = 0) and scaled to the real height on export.
Each surface is meshed with marching cubes: body at ~6 mm, head and hands at ~2.4 mm."""
import numpy as np
from sdf import V, norm, f32, sphere, ellipsoid, cone, capsule, rbox, torus, smax, smin, frame, Waves, Field

# ---------------------------------------------------------------- the two people (labelled by what they wear, never names)
SPECS = {
    'grey': dict(label='Grey tee', height=1.88, skin=(228, 184, 150), lips=(176, 112, 98),
                 hair=dict(style='swept', color=(160, 122, 80), tips=(214, 190, 150), top=.075, sides=.022),
                 beard=dict(kind='full', color=(128, 80, 48)), brows=(140, 104, 70), iris=(118, 160, 178),
                 tee=(154, 166, 155), hem=.855, trousers=(28, 29, 32), cuff=False, drawstring=False,
                 shoe=(240, 240, 236), sole=(222, 222, 216),
                 pose=dict(d1=(.40, -.915, .05), d2=(.33, -.93, .17), palm=(-.55, 0, .83), curl=.45, spread=.04)),
    'kdk': dict(label='KDK tee', height=1.80, skin=(222, 176, 140), lips=(170, 106, 92),
                hair=dict(style='messy', color=(58, 40, 28), tips=(104, 76, 52), top=.085, sides=.045),
                beard=dict(kind='stubble', color=(52, 38, 28)), brows=(50, 36, 26), iris=(84, 60, 40),
                tee=(238, 237, 233), hem=.875, trousers=(40, 41, 45), cuff=True, drawstring=True,
                shoe=(90, 94, 100), sole=(36, 37, 40),
                pose=dict(d1=(.62, -.78, .06), d2=(.80, -.30, .52), palm=(-.15, .75, .64), curl=.22, spread=.12)),
}

H0 = 1.80
EYE = dict(y=1.687, x=.032, z=.068, r=.0122)


def bb_cone(a, b, ra, rb):
    a = np.asarray(a, f32); b = np.asarray(b, f32); r = max(ra, rb)
    return np.minimum(a, b) - r, np.maximum(a, b) + r


def bb_c(c, r):
    c = np.asarray(c, f32); r = float(np.max(r))
    return c - r, c + r


class Person:
    def __init__(self, key):
        self.key = key; self.S = SPECS[key]; self.F = Field(); self.extras = {}
        self.rng = np.random.default_rng(sum(map(ord, key)) * 7919)
        self.build()

    # -- helpers that register a part with its own bounding box
    def C(self, g, a, b, ra, rb, k=0, sub=False):
        lo, hi = bb_cone(a, b, ra, rb); a = np.asarray(a, f32); b = np.asarray(b, f32)
        self.F.add(g, lambda P, a=a, b=b: cone(P, a, b, ra, rb), lo, hi, k, sub=sub)

    def E(self, g, c, r, k=0, R=None, sub=False):
        lo, hi = bb_c(c, r); c = np.asarray(c, f32); r = np.asarray(r, f32)
        self.F.add(g, lambda P, c=c, r=r: ellipsoid(P, c, r, R), lo, hi, k, sub=sub)

    def build(self):
        S = self.S
        self.torso(); self.arms(); self.head(); self.hair(); self.beard_and_brows()
        self.tee(); self.trousers(); self.shoes()

    # ------------------------------------------------------------ skin: torso, neck, arms, hands
    def torso(self):
        g = 'skin'
        self.E(g, (0, .95, 0), (.15, .1, .1))
        self.E(g, (0, 1.1, .005), (.13, .13, .092), .06)
        self.E(g, (0, 1.29, 0), (.148, .14, .1), .06)
        for sx in (-1, 1):
            self.E(g, (sx * .062, 1.315, .055), (.068, .048, .042), .03)
            self.C(g, (0, 1.5, -.03), (sx * .155, 1.45, -.025), .045, .035, .04)       # trapezius
            self.E(g, (sx * .19, 1.425, -.005), (.054, .062, .054), .03)              # deltoid
        self.C(g, (-.165, 1.445, -.02), (.165, 1.445, -.02), .05, .05, .05)
        self.C(g, (0, 1.42, -.022), (0, 1.62, -.014), .056, .047, .035)               # neck
        self.E(g, (0, 1.545, .036), (.012, .014, .01), .012)                          # Adam's apple

    def arms(self):
        P = self.S['pose']; g = 'skin'; self.hands = []
        for sx in (-1, 1):
            d1 = norm((sx * P['d1'][0], P['d1'][1], P['d1'][2])); d2 = norm((sx * P['d2'][0], P['d2'][1], P['d2'][2]))
            S = V(sx * .185, 1.435, -.01); E = S + .29 * d1; W = E + .255 * d2
            self.C(g, S, E, .047, .036, .03)
            self.E(g, S + .14 * d1 + V(0, 0, .012), (.036, .075, .036), .02, R=self._along(d1))           # biceps
            self.C(g, E, W, .037, .025, .02)
            self.E(g, E + .075 * d2, (.034, .06, .03), .02, R=self._along(d2))
            n = norm((sx * P['palm'][0], P['palm'][1], P['palm'][2])); n = norm(n - (n @ d2) * d2)
            t = -sx * np.cross(d2, n); t = norm(t)                                   # thumb side
            self.hand(W, d2, n, t, P['curl'], P['spread'])
            self.hands.append(dict(W=W, a=d2, E=E, sx=sx))
            if sx == 1: self.S1, self.E1 = S, E
            self.extras.setdefault('sleeve', []).append(dict(S=S.tolist(), d1=d1.tolist()))
        self.d1s = [norm((sx * P['d1'][0], P['d1'][1], P['d1'][2])) for sx in (-1, 1)]

    @staticmethod
    def _along(a):
        """Rotation whose local y axis is a (for ellipsoids stretched along a limb)."""
        a = norm(a); up = V(0, 0, 1) if abs(a[2]) < .9 else V(1, 0, 0)
        x = norm(np.cross(a, up)); z = np.cross(x, a)
        return np.stack([x, a, z], 1).astype(f32)

    def hand(self, W, a, n, t, curl, spread):
        g = 'skin'
        R = np.stack([t, a, n], 1).astype(f32)
        self.E(g, W + a * .048, (.041, .05, .0155), .02, R=R)                        # palm
        self.E(g, W + a * .03 - n * .004 + t * .02, (.022, .03, .016), .015, R=R)    # thumb pad (thenar)
        lens = [.074, .082, .077, .061]
        for i in range(4):
            off = .025 - i * .0168; sp = (i - 1.5) * spread * .5
            dirA = norm(a + t * sp); base = W + a * .088 + t * off
            L = lens[i]; r0 = .0098 - i * .0006
            p1 = base + dirA * L * .45
            dirB = norm(dirA * np.cos(curl) - n * np.sin(curl)); p2 = p1 + dirB * L * .33
            dirC = norm(dirA * np.cos(curl * 1.8) - n * np.sin(curl * 1.8)); p3 = p2 + dirC * L * .24
            self.C(g, base - dirA * .01, p1, r0, r0 * .92, .006)
            self.C(g, p1, p2, r0 * .92, r0 * .84, .004)
            self.C(g, p2, p3, r0 * .84, r0 * .72, .003)
        td = norm(a * .55 + t * .8 + n * .3); b0 = W + a * .022 + t * .026 - n * .004
        b1 = b0 + td * .035; td2 = norm(td * .8 + a * .4 - n * .15); b2 = b1 + td2 * .03
        self.C(g, b0, b1, .0125, .0108, .01); self.C(g, b1, b2, .0108, .0088, .004)

    # ------------------------------------------------------------ the head: carved, not stacked
    def head(self):
        g = 'skin'; ex, ey, ez = EYE['x'], EYE['y'], EYE['z']
        self.E(g, (0, 1.705, -.012), (.076, .098, .097), .03)                          # cranium
        self.E(g, (0, 1.672, .03), (.063, .06, .056), .04)                             # mid face
        self.E(g, (0, 1.622, .018), (.053, .06, .061), .04)                            # lower face
        for sx in (-1, 1):
            self.C(g, (sx * .054, 1.64, -.022), (sx * .024, 1.578, .056), .019, .016, .025)   # jaw line
            self.E(g, (sx * .048, 1.664, .058), (.02, .012, .016), .025)                      # cheekbone
            self.E(g, (sx * .078, 1.678, -.006), (.011, .031, .021), .008, R=self._rotx(-.18))  # ear
            self.E(g, (sx * .088, 1.68, -.004), (.006, .02, .013), .004, R=self._rotx(-.18), sub=True)
            self.E(g, (sx * ex, ey + .002, .083), (.0175, .0155, .016), .01, sub=True)         # eye socket
        self.E(g, (0, 1.575, .068), (.023, .019, .018), .02)                           # chin
        self.C(g, (-.044, 1.705, .082), (.044, 1.705, .082), .011, .011, .02)          # brow ridge
        self.C(g, (0, 1.699, .086), (0, 1.65, .1), .007, .0095, .012)                   # nose bridge
        self.E(g, (0, 1.646, .0995), (.0108, .0105, .011), .008)                       # nose tip
        for sx in (-1, 1):
            self.E(g, (sx * .0132, 1.6415, .0915), (.0075, .007, .0075), .007)         # nostril wings
            self.E(g, (sx * .0082, 1.6355, .0985), (.0035, .0022, .004), .002, sub=True)
        self.E(g, (0, 1.6115, .0858), (.0205, .0038, .0058), .006)                    # upper lip
        self.E(g, (0, 1.601, .0838), (.018, .0048, .0066), .006)                       # lower lip
        self.E(g, (0, 1.6062, .095), (.021, .001, .012), .001, sub=True)               # mouth line
        # eyelids: shells round each eyeball, cut to above / below the opening
        for sx in (-1, 1):
            c = V(sx * ex, ey, ez)
            lo, hi = bb_c(c, .016)
            self.F.add('skin', lambda P, c=c: smax(sphere(P, c, .0137), (c[1] + .0008) - P[:, 1], .002), lo, hi, .004)
            self.F.add('skin', lambda P, c=c: smax(sphere(P, c, .0132), P[:, 1] - (c[1] - .0064), .002), lo, hi, .004)
        self.extras['eyes'] = [dict(c=[sx * ex, ey, ez], r=EYE['r']) for sx in (-1, 1)]

    @staticmethod
    def _rotx(a):
        c, s = np.cos(a), np.sin(a)
        return np.array([[1, 0, 0], [0, c, -s], [0, s, c]], f32)

    # ------------------------------------------------------------ hair as clumps grown from the scalp
    def hair(self):
        h = self.S['hair']; rng = self.rng; cc = V(0, 1.705, -.012); rr = V(.076, .098, .097)
        style = h['style']; n = 1100 if style == 'messy' else 1000
        self.hair_base(h)
        for i in range(n):
            u = rng.normal(size=3); u /= np.linalg.norm(u)
            thr = (-.05 + .37 * min(max(u[2] / .6, 0), 1)) if u[2] > 0 else (-.05 - .6 * min(-u[2] / .7, 1))
            if u[1] < thr:
                continue
            p0 = cc + u * rr * .97
            nrm = norm(u / rr)                                                     # surface normal
            top = max(0, u[1]); front = max(0, u[2])
            if style == 'messy':   # tousled: up and over to one side on top, falling round the sides
                flow = V(-.45, .45, -.55) * top + V(0, -.8, -.6) * (1 - top) + V(0, .6, -.2) * front + rng.normal(size=3) * .32
                L = (h['sides'] + (h['top'] - h['sides']) * top) * rng.uniform(.75, 1.2); lift = .22 + .3 * top
                droop = .9
            else:                  # swept: long top lifted up and back, short sides
                flow = V(0, .3, -1) * top + V(0, -.5, -.8) * (1 - top) + V(0, .45, 0) * front + rng.normal(size=3) * .1
                L = (h['sides'] + (h['top'] - h['sides']) * top ** 1.5) * rng.uniform(.85, 1.1); lift = .2 + .7 * top * (.3 + front)
                droop = .45
            if style == 'messy' and front > .5: L *= .55                          # short at the front, off the face
            flow = norm(flow - (flow @ nrm) * nrm)
            r0 = (.0072 if style == 'messy' else .0062) * rng.uniform(.85, 1.15)
            p1 = p0 + norm(flow + nrm * lift) * L * .45
            f2 = norm(flow - nrm * .2 * droop + V(0, -1, 0) * .35 * droop); p2 = p1 + f2 * L * .35
            f3 = norm(f2 + V(0, -1, 0) * .5 * droop + rng.normal(size=3) * .3); p3 = p2 + f3 * L * .25
            self.C('hair', p0 - nrm * .004, p1, r0, r0 * .85, .007)
            self.C('hair', p1, p2, r0 * .85, r0 * .55, .005)
            self.C('hair', p2, p3, r0 * .55, r0 * .2, .003)

    def hair_base(self, h):
        """A thin cap of hair over the whole hair region so no scalp shows between clumps."""
        cc = V(0, 1.705, -.012); rr = V(.076, .098, .097); th = .007 if h['style'] == 'messy' else .005

        def fn(P):
            q = (P - cc) / rr; u = q / np.maximum(np.linalg.norm(q, axis=1, keepdims=True), 1e-6)
            thr = np.where(u[:, 2] > 0, -.05 + .37 * np.clip(u[:, 2] / .6, 0, 1), -.05 - .6 * np.clip(-u[:, 2] / .7, 0, 1)) + .04
            d = ellipsoid(P, cc, rr + th)
            return smax(d, (thr - u[:, 1]) * .09, .006)
        self.F.add('hair', fn, cc - rr - .02, cc + rr + .02)

    def beard_and_brows(self):
        b = self.S['beard']; rng = self.rng
        if b['kind'] != 'full':
            return
        # full beard: a solid layer over the jaw and chin (no skin through the gaps) ...
        bc = V(0, 1.618, .016); br = V(.064, .068, .072)

        def base(P):
            x, y, z = P[:, 0], P[:, 1], P[:, 2]; ax = np.abs(x)
            line = 1.652 - (.07 - np.clip(ax, .03, .07)) * .75                    # top edge: high at the sideburns, down to the mouth corners
            d = np.minimum(ellipsoid(P, bc, br), ellipsoid(P, V(0, 1.575, .07), V(.032, .028, .027)))   # jaw + chin
            d = smax(d, y - line, .006)                                            # nothing above the cheek line
            d = smax(d, -(z + .03), .01)                                           # front and sides only
            lips = ellipsoid(P, V(0, 1.606, .094), V(.024, .0085, .022))
            return smax(d, -lips, .004)
        self.F.add('beard', base, bc - br - .02, bc + br + .02)
        # ... then short clumps on top of it, pointing down and forward
        cc = V(0, 1.618, .02); rr = V(.068, .072, .076)
        for i in range(700):
            u = rng.normal(size=3); u /= np.linalg.norm(u)
            p = cc + u * rr
            if u[2] < -.25 or p[1] > 1.648 - .0 or p[1] < 1.545: continue
            if p[1] > 1.63 - 0.9 * (abs(p[0]) - .03) and abs(p[0]) > .03 and p[1] > 1.625 + (.065 - abs(p[0])) * .5: continue
            if abs(p[0]) < .024 and 1.598 < p[1] < 1.615: continue                 # leave the lips clear
            if abs(p[0]) < .045 and p[1] > 1.624: continue                         # no beard over the nose
            nrm = norm(u / rr); flow = norm(V(0, -1, .25) - (V(0, -1, .25) @ nrm) * nrm + rng.normal(size=3) * .25)
            L = rng.uniform(.007, .014); r0 = rng.uniform(.0036, .0048)
            p1 = p + norm(flow + nrm * .6) * L * .6; p2 = p1 + norm(flow + rng.normal(size=3) * .4) * L * .5
            self.C('beard', p - nrm * .003, p1, r0, r0 * .7, .004); self.C('beard', p1, p2, r0 * .7, r0 * .3, .003)
        for sx in (-1, 1):   # moustache
            for j in range(6):
                x = sx * (.004 + j * .0045); p = V(x, 1.6185 - j * .0012, .095 - j * .0015)
                self.C('beard', p, p + V(sx * .006, -.006, .002), .0042, .0028, .004)

    # ------------------------------------------------------------ clothes: solid shells over the body
    def tee(self):
        g = 'tee'; S = self.S; hem = S['hem']
        self.E(g, (0, 1.29, 0), (.172, .148, .122))
        self.C(g, (-.175, 1.445, -.02), (.175, 1.445, -.02), .07, .07, .05)
        self.E(g, (0, 1.1, 0), (.166, .21, .121), .06)                                  # hangs straight, boxy
        self.E(g, (0, .97, 0), (.168, .13, .12), .05)
        for sx, d1 in zip((-1, 1), self.d1s):
            Sh = V(sx * .17, 1.425, -.012)
            self.C(g, Sh, Sh + .17 * d1, .071, .064, .045)
        W = Waves(7 if self.key == 'kdk' else 9, 12, .16)
        Wc = Waves(3, 8, .05)
        d1s = self.d1s

        def post(P, d):   # cut hem, sleeves and neck, add folds
            d = smax(d, (hem + .004 * np.sin(P[:, 0] * 20)) - P[:, 1], .01)
            for sx, d1 in zip((-1, 1), d1s):
                Sh = V(sx * .175, 1.44, -.012); end = Sh + .165 * d1; tt = (P - Sh) @ d1
                radial = np.linalg.norm((P - Sh) - tt[:, None] * d1, axis=1)
                near = (tt > .09) & (radial < .11)
                d = np.where(near, smax(d, (P - end) @ d1, .004), d)
            neck = cone(P, V(0, 1.43, -.01), V(0, 1.62, 0), .058, .058)
            front = ellipsoid(P, V(0, 1.475, .065), V(.05, .03, .045))
            d = smax(d, -np.minimum(neck, front), .006)
            return d - .0028 * W(P) - .0008 * Wc(P)
        self.post = getattr(self, 'post', {}); self.post['tee'] = post
        # crew-neck rib
        Rm = self._rotx(.2)
        self.F.add('tee', lambda P: torus(P, V(0, 1.462, -.006), .066, .0075, Rm), (-.09, 1.42, -.1), (.09, 1.5, .1), .006)

    def trousers(self):
        g = 'trousers'; S = self.S
        self.E(g, (0, .93, 0), (.172, .13, .12))
        for sx in (-1, 1):
            hip = V(sx * .088, .9, 0); knee = V(sx * .105, .5, .016); ank = V(sx * .118, .12, 0)
            self.C(g, hip, knee, .094, .072, .045)
            self.C(g, knee, ank, .07, .058, .03)
            if S['cuff']:
                self.C(g, ank + V(0, .015, 0), ank + V(0, -.05, -.004), .056, .05, .012)
            else:
                self.C(g, ank, ank + V(0, -.055, .006), .058, .062, .01)
        W = Waves(11, 14, .14, aniso=(.4, 1.6, .4)); Wb = Waves(12, 10, .06, aniso=(.3, 2, .3))
        cuff = S['cuff']

        def post(P, d):
            d = smax(d, P[:, 1] - 1.02, .01)
            bunch = np.clip((.32 - P[:, 1]) / .2, 0, 1) if cuff else np.clip((.25 - P[:, 1]) / .2, 0, 1) * .5
            return d - .0025 * W(P) - .004 * bunch * Wb(P)
        self.post['trousers'] = post
        if S['drawstring']:
            self.extras['cords'] = [[[sx * .012, S['hem'] + .01, .118], [sx * .016, S['hem'] - .045, .121], [sx * .02, S['hem'] - .095, .118]] for sx in (-1, 1)]

    def shoes(self):
        for sx in (-1, 1):
            R = self._roty(sx * .12)
            o = V(sx * .118, 0, .0)
            T = lambda p, o=o, R=R: o + R @ V(*p)
            self.E('shoe', T((0, .058, -.06)), (.045, .052, .055), .0)
            self.E('shoe', T((0, .054, .03)), (.054, .05, .08), .03)
            self.E('shoe', T((.002, .04, .132)), (.049, .034, .058), .03)
            self.C('shoe', T((0, .07, -.04)), T((0, .1, -.015)), .05, .052, .02)
            c = T((0, .0145, .035)); lo, hi = bb_c(c, .17); Rt = R.T.copy()
            self.F.add('sole', lambda P, c=c, Rt=R: rbox(P, c, (.047, .0145, .148), .02, Rt), lo, hi)

    @staticmethod
    def _roty(a):
        c, s = np.cos(a), np.sin(a)
        return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]], f32)

    # ------------------------------------------------------------ evaluation
    def groups(self, P, only=None):
        G = self.F.eval_groups(P, only=only)
        for k, fn in getattr(self, 'post', {}).items():
            if k in G:
                G[k] = fn(P, G[k])
        return G

    def gdist(self, g):
        return lambda P: self.groups(P, {g})[g]

    def dist(self, P):
        G = self.groups(P)
        return np.min(np.stack(list(G.values())), axis=0)
