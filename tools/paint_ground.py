#!/usr/bin/env python3
"""Paints the ground and indoor textures in code, in the same flat, softly shaded style as the buildings and survivors.
Every tile repeats seamlessly. Ground tiles cover 4 m of ground (the floor tiles 2 m).

Four tiles are the layers of the terrain, which the game blends by land use, slope and wetness (see docs/TERRAIN.md):
    lawn (mown grass), meadow (long grass and wild flowers), earth (bare soil and leaf litter), rock (outcrops and scree).
Their alpha channel is a height map: where it is high (tufts, leaves, rock tops), that layer shows through first, so the edges
between layers are ragged and natural instead of smooth fades.

The rest are ordinary tiles (alpha 255): road lanes, asphalt, pavement slabs, a small lawn for parks, packed dirt, gravel ballast,
water, vinyl floor tiles, wallpaper and floorboards.
Output: tools/out/ground/<name>.png. tools/build_art.py packs them into the game's texture atlas."""
import os, math, numpy as np
from PIL import Image, ImageDraw, ImageFilter
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'ground'); os.makedirs(OUT, exist_ok=True)

def tnoise(n, f, seed):
    """tileable smooth value noise, n x n pixels, f cells across"""
    r = np.random.default_rng(seed).random((f, f))
    c = np.arange(n)*f/n; i0 = np.floor(c).astype(int); t = c - i0; t = t*t*(3 - 2*t); i1 = (i0 + 1) % f
    a = r[i0][:, i0]*(1 - t)[None, :] + r[i0][:, i1]*t[None, :]
    b = r[i1][:, i0]*(1 - t)[None, :] + r[i1][:, i1]*t[None, :]
    return a*(1 - t)[:, None] + b*t[:, None]
def fbm(n, f, seed, oct=4):
    s, w, tot = np.zeros((n, n)), 1.0, 0.0
    for o in range(oct): s += tnoise(n, f*2**o, seed + o)*w; tot += w; w *= 0.5
    return s/tot
def mix(a, b, t): return a*(1 - t[..., None]) + np.array(b, float)[None, None, :]/255*t[..., None]
def base(n, col): return np.ones((n, n, 3))*np.array(col, float)/255
def sstep(e0, e1, x): t = np.clip((x - e0)/(e1 - e0), 0, 1); return t*t*(3 - 2*t)

class Stamp:
    """draws shapes that wrap around the tile edges, on a colour layer and a height layer"""
    def __init__(s, rgb, h):
        n = rgb.shape[0]; s.n = n
        s.im = Image.fromarray((np.clip(rgb, 0, 1)*255).astype(np.uint8)); s.d = ImageDraw.Draw(s.im)
        s.hm = Image.fromarray((np.clip(h, 0, 1)*255).astype(np.uint8)); s.dh = ImageDraw.Draw(s.hm)
    def each(s, x, y, r, fn):
        n = s.n
        for ox in (-n, 0, n):
            for oy in (-n, 0, n):
                if -r <= x + ox <= n + r and -r <= y + oy <= n + r: fn(x + ox, y + oy)
    def line(s, pts, col, w, h=None):
        x, y = pts[0]
        def f(X, Y):
            q = [(px - x + X, py - y + Y) for px, py in pts]
            s.d.line(q, fill=tuple(col), width=w)
            if h is not None: s.dh.line(q, fill=int(h*255), width=w)
        s.each(x, y, s.n*0.2, f)
    def poly(s, pts, col, h=None, outline=None):
        x, y = pts[0]
        def f(X, Y):
            q = [(px - x + X, py - y + Y) for px, py in pts]
            s.d.polygon(q, fill=tuple(col), outline=tuple(outline) if outline else None)
            if h is not None: s.dh.polygon(q, fill=int(h*255))
        s.each(x, y, s.n*0.25, f)
    def ell(s, x, y, rx, ry, col, h=None):
        def f(X, Y):
            s.d.ellipse([X - rx, Y - ry, X + rx, Y + ry], fill=tuple(col))
            if h is not None: s.dh.ellipse([X - rx, Y - ry, X + rx, Y + ry], fill=int(h*255))
        s.each(x, y, max(rx, ry) + 2, f)
    def out(s): return np.asarray(s.im).astype(float)/255, np.asarray(s.hm).astype(float)/255

def jit(c, a, r): return [int(max(0, min(255, v + r.uniform(-a, a)))) for v in c]
def save(name, rgb, alpha=None):
    a = np.full(rgb.shape[:2], 255, np.uint8) if alpha is None else (np.clip(alpha, 0, 1)*255).astype(np.uint8)
    Image.fromarray(np.dstack([(np.clip(rgb, 0, 1)*255).astype(np.uint8), a]), 'RGBA').save(os.path.join(OUT, name + '.png'))

def blades(st, r, n, count, cols, lmin, lmax, wid, hmin=0.55, lean=0.35):
    """short painted grass strokes, mostly upright in the picture so the ground reads as grass from any side"""
    for _ in range(count):
        x, y = r.uniform(0, n), r.uniform(0, n); l = r.uniform(lmin, lmax); a = -math.pi/2 + r.uniform(-lean, lean)
        st.line([(x, y), (x + math.cos(a)*l*0.5 + r.uniform(-1, 1), y + math.sin(a)*l*0.5), (x + math.cos(a)*l, y + math.sin(a)*l)],
                jit(cols[r.integers(len(cols))], 10, r), wid, r.uniform(hmin, 1.0))

# ---------------- terrain layers ----------------
def lawn(n=1024, seed=1):
    r = np.random.default_rng(seed)
    m = fbm(n, 4, seed); m2 = fbm(n, 16, seed + 9)
    rgb = mix(base(n, (112, 150, 70)), (88, 128, 58), sstep(0.45, 0.7, m))
    rgb = mix(rgb, (140, 170, 84), sstep(0.55, 0.8, m2)*0.6)
    h = 0.35 + 0.3*m2
    st = Stamp(rgb, h)
    blades(st, r, n, n*6, [(96, 138, 62), (128, 164, 78), (150, 182, 92), (82, 120, 56)], n*0.012, n*0.024, max(2, n//340))
    for _ in range(n//20):  # clover and tiny daisies
        x, y = r.uniform(0, n), r.uniform(0, n)
        if r.random() < 0.7: st.ell(x, y, n*0.006, n*0.005, jit((118, 160, 84), 8, r), 0.8)
        else: st.ell(x, y, n*0.0035, n*0.0035, (236, 232, 214), 0.9)
    c, hh = st.out(); return c, np.clip(hh, 0, 1)

def meadow(n=1024, seed=2):
    r = np.random.default_rng(seed)
    m = fbm(n, 4, seed); m2 = fbm(n, 12, seed + 5)
    rgb = mix(base(n, (132, 146, 70)), (164, 160, 86), sstep(0.5, 0.75, m))
    rgb = mix(rgb, (104, 128, 60), sstep(0.55, 0.8, m2)*0.7)
    st = Stamp(rgb, 0.25 + 0.25*m2)
    blades(st, r, n, n*3, [(120, 146, 66), (150, 164, 80), (104, 130, 60)], n*0.015, n*0.03, max(2, n//340))
    for _ in range(n//4):                                   # tufts: a clump of long blades
        cx, cy = r.uniform(0, n), r.uniform(0, n); dry = r.random() < 0.3
        cols = [(196, 182, 104), (176, 164, 92), (214, 198, 124)] if dry else [(116, 146, 66), (142, 168, 78), (98, 128, 58), (168, 180, 90)]
        for _ in range(9):
            x = cx + r.uniform(-n*0.012, n*0.012); l = r.uniform(n*0.03, n*0.06); a = -math.pi/2 + r.uniform(-0.6, 0.6)
            st.line([(x, cy), (x + math.cos(a)*l*0.5, cy + math.sin(a)*l*0.5), (x + math.cos(a)*l + r.uniform(-3, 3), cy + math.sin(a)*l)],
                    jit(cols[r.integers(len(cols))], 10, r), max(2, n//300), r.uniform(0.7, 1.0))
    FL = [(240, 236, 222), (238, 200, 72), (170, 128, 196), (226, 120, 86)]
    for _ in range(n//10):                                  # wild flowers, in drifts
        x, y = r.uniform(0, n), r.uniform(0, n)
        if m[int(y) % n, int(x) % n] < 0.45: continue
        c = FL[r.integers(len(FL))]; rr = n*r.uniform(0.004, 0.007)
        st.ell(x, y, rr, rr, c, 1.0); st.ell(x, y, rr*0.4, rr*0.4, (232, 190, 70) if c[0] > 230 and c[2] > 200 else (250, 240, 200), 1.0)
    return st.out()

def earth(n=1024, seed=3):
    r = np.random.default_rng(seed)
    m = fbm(n, 5, seed); m2 = fbm(n, 20, seed + 3)
    rgb = mix(base(n, (124, 96, 66)), (100, 76, 54), sstep(0.45, 0.7, m))
    rgb = mix(rgb, (146, 118, 82), sstep(0.6, 0.8, m2)*0.6)
    st = Stamp(rgb, 0.2 + 0.3*m2)
    LV = [(176, 118, 56), (150, 92, 50), (196, 150, 72), (128, 86, 52), (162, 136, 76)]
    for _ in range(n*2):                                    # leaf litter
        x, y = r.uniform(0, n), r.uniform(0, n); a = r.uniform(0, math.pi); l = n*r.uniform(0.006, 0.012); w = l*0.5
        ca, sa = math.cos(a), math.sin(a)
        pts = [(x + ca*l, y + sa*l), (x - sa*w, y + ca*w), (x - ca*l, y - sa*l), (x + sa*w, y - ca*w)]
        st.poly(pts, jit(LV[r.integers(len(LV))], 12, r), r.uniform(0.5, 1.0))
    for _ in range(n//24):                                  # twigs
        x, y = r.uniform(0, n), r.uniform(0, n); a = r.uniform(0, math.pi); l = n*r.uniform(0.02, 0.05)
        st.line([(x, y), (x + math.cos(a)*l, y + math.sin(a)*l)], jit((88, 64, 44), 8, r), max(2, n//260), 0.9)
    for _ in range(n//16):                                  # pebbles
        x, y = r.uniform(0, n), r.uniform(0, n); rr = n*r.uniform(0.004, 0.009)
        st.ell(x, y, rr, rr*0.8, jit((150, 140, 126), 14, r), 0.95)
    return st.out()

def rock(n=1024, seed=4):
    """fractured limestone: irregular plates split by cracks (a Voronoi pattern), lit from one side, with grit and lichen"""
    r = np.random.default_rng(seed); m = fbm(n, 6, seed); m2 = fbm(n, 24, seed + 2)
    k = 22; pts = r.random((k, 2))*n; Y, X = np.mgrid[0:n, 0:n].astype(float)
    wx = (fbm(n, 5, seed + 7) - 0.5)*n*0.08; wy = (fbm(n, 5, seed + 8) - 0.5)*n*0.08   # wobble the cracks
    Xw, Yw = X + wx, Y + wy
    d1 = np.full((n, n), 1e9); d2 = np.full((n, n), 1e9); idx = np.zeros((n, n), int); gx = np.zeros((n, n)); gy = np.zeros((n, n))
    for i, (px, py) in enumerate(pts):
        for ox in (-n, 0, n):
            for oy in (-n, 0, n):
                dx = Xw - (px + ox); dy = Yw - (py + oy); d = np.hypot(dx, dy)
                closer = d < d1
                d2 = np.where(closer, d1, np.minimum(d2, d)); 
                gx = np.where(closer, dx, gx); gy = np.where(closer, dy, gy); idx = np.where(closer, i, idx); d1 = np.where(closer, d, d1)
    edge = d2 - d1                                         # distance to the nearest crack
    tone = 0.9 + 0.12*r.random(k)[idx]
    rgb = base(n, (176, 170, 156))*tone[..., None]
    rgb *= (0.9 + 0.16*m2)[..., None]
    rgb = mix(rgb, (150, 146, 136), sstep(0.45, 0.7, fbm(n, 10, seed + 9))*0.6)   # weathered mottling
    crack = sstep(n*0.006, n*0.001, edge); rgb = rgb*(1 - crack[..., None]*0.3)
    rgb = mix(rgb, (122, 112, 96), sstep(0.62, 0.78, m)*0.5)        # earthy grit in the hollows
    h = np.clip(0.55 + 0.4*sstep(0, n*0.05, edge) - 0.45*crack, 0, 1)
    st = Stamp(rgb, h)
    for _ in range(n//30):                                  # lichen
        x, y = r.uniform(0, n), r.uniform(0, n); rr = n*r.uniform(0.004, 0.014)
        st.ell(x, y, rr, rr*0.8, jit((170, 170, 132), 8, r), None)
    return st.out()

# ---------------- ordinary ground ----------------
def asphalt(n=512, seed=5):
    r = np.random.default_rng(seed); m = fbm(n, 4, seed); m2 = fbm(n, 30, seed + 1, 2)
    rgb = mix(base(n, (104, 100, 98)), (88, 86, 86), sstep(0.45, 0.75, m))
    rgb *= (0.93 + 0.14*m2)[..., None]
    sp = r.random((n, n)); rgb[sp > 0.985] *= 1.25; rgb[sp < 0.012] *= 0.8
    st = Stamp(rgb, np.zeros((n, n)))
    for _ in range(2):                                      # a crack or two, mended with tar
        x, y = r.uniform(0, n), r.uniform(0, n); pts = [(x, y)]
        for q in range(6): x += r.uniform(-n*0.06, n*0.06); y += r.uniform(n*0.01, n*0.05); pts.append((x, y))
        st.line(pts, (66, 64, 64), max(2, n//180))
    return st.out()[0]

def lanes(n=1024, seed=6):
    """across = the road's width (0 to 1), down = 8 m along it: white edge lines, a double yellow centre line"""
    a = np.array(Image.fromarray((asphalt(n, seed)*255).astype(np.uint8)))
    im = Image.fromarray(a); d = ImageDraw.Draw(im); w = n*0.012
    for x in (0.045, 0.955): d.rectangle([n*x - w, 0, n*x + w, n], fill=(226, 222, 210))
    for x in (0.488, 0.512): d.rectangle([n*x - w*0.8, 0, n*x + w*0.8, n], fill=(214, 172, 60))
    rgb = np.asarray(im).astype(float)/255; rgb *= (0.95 + 0.08*fbm(n, 12, seed + 4))[..., None]; return rgb

def sidewalk(n=512, seed=7):
    """concrete slabs about 1.3 m square with tooled joints, the odd stain and a cracked slab"""
    r = np.random.default_rng(seed); m = fbm(n, 6, seed)
    rgb = base(n, (204, 198, 186))*(0.94 + 0.08*m)[..., None]
    k = 3; c = n//k; rnd = r.random((k, k))
    for j in range(k):
        for i in range(k): rgb[j*c:(j + 1)*c, i*c:(i + 1)*c] *= 0.95 + 0.07*rnd[j, i]
    sp = r.random((n, n)); rgb[sp > 0.99] *= 0.9
    st = Stamp(rgb, np.zeros((n, n))); jw = max(2, n//170)
    for q in range(k):
        st.line([(q*c, 0), (q*c, n)], (164, 158, 148), jw); st.line([(0, q*c), (n, q*c)], (164, 158, 148), jw)
    x, y = c*1.3, c*0.2; st.line([(x, y), (x + c*0.2, y + c*0.3), (x + c*0.1, y + c*0.6)], (170, 164, 154), 2)
    st.ell(c*2.4, c*1.6, c*0.18, c*0.12, (190, 182, 168))
    return st.out()[0]

def dirt(n=512, seed=8):
    r = np.random.default_rng(seed); m = fbm(n, 5, seed); m2 = fbm(n, 20, seed + 1)
    rgb = mix(base(n, (196, 170, 128)), (176, 150, 112), sstep(0.45, 0.7, m)); rgb *= (0.94 + 0.1*m2)[..., None]
    st = Stamp(rgb, np.zeros((n, n)))
    for _ in range(n//5):
        x, y = r.uniform(0, n), r.uniform(0, n); rr = n*r.uniform(0.003, 0.008)
        st.ell(x, y, rr, rr*0.8, jit((160, 148, 130), 16, r))
    return st.out()[0]

def gravel(n=512, seed=9):
    r = np.random.default_rng(seed); rgb = base(n, (126, 120, 112))*(0.9 + 0.12*fbm(n, 8, seed))[..., None]
    st = Stamp(rgb, np.zeros((n, n)))
    for _ in range(n*3):
        x, y = r.uniform(0, n), r.uniform(0, n); rr = n*r.uniform(0.006, 0.013); g = r.uniform(120, 190)
        st.ell(x, y, rr, rr*r.uniform(0.6, 0.9), jit((int(g), int(g*0.96), int(g*0.9)), 8, r))
    return st.out()[0]

def water(n=512, seed=10):
    """the game scrolls two copies of this over each other, so it only needs soft ripples, not reflections"""
    r = np.random.default_rng(seed); m = fbm(n, 4, seed)
    rgb = mix(base(n, (120, 168, 186)), (96, 146, 170), sstep(0.4, 0.7, m))
    st = Stamp(rgb, np.zeros((n, n)))
    for _ in range(n//6):
        x, y = r.uniform(0, n), r.uniform(0, n); l = n*r.uniform(0.03, 0.08)
        st.line([(x, y), (x + l*0.5, y - n*0.004), (x + l, y)], (176, 210, 220) if r.random() < 0.6 else (86, 132, 156), max(2, n//220))
    return st.out()[0]

# ---------------- indoors ----------------
def floortile(n=512, seed=11):
    """vinyl tiles, 33 cm (six across 2 m), in two quiet tones laid as a checker, with fine grout"""
    r = np.random.default_rng(seed); k = 6; c = n/k; Y, X = np.mgrid[0:n, 0:n]
    ch = ((np.floor(X/c) + np.floor(Y/c)) % 2).astype(bool)
    rgb = base(n, (226, 218, 200)); rgb[ch] = np.array((196, 190, 176))/255
    g = ((X % c) < 2) | ((Y % c) < 2); rgb[g] = np.array((168, 160, 148))/255
    return rgb

def wallpaper(n=512, seed=12):
    """2 m of wall: soft stripes with a small sprig between, over a painted skirting board at the floor (the bottom of the picture)"""
    r = np.random.default_rng(seed); Y, X = np.mgrid[0:n, 0:n]
    rgb = base(n, (232, 222, 200))
    s = (X % (n/8)) < n/32; rgb[s] = np.array((212, 202, 178))/255
    st = Stamp(rgb, np.zeros((n, n)))
    for i in range(8):
        for j in range(6):
            x = (i + 0.75)*n/8; y = (j + 0.5)*n/6*0.9 + (i % 2)*n/12*0.9
            st.ell(x, y, n*0.007, n*0.012, (170, 180, 140)); st.ell(x, y - n*0.012, n*0.005, n*0.005, (196, 140, 120))
    rgb = st.out()[0]; sk = Y > n*0.9; rgb[sk] = np.array((188, 160, 122))/255; rgb[(Y > n*0.895) & (Y < n*0.905)] = np.array((150, 124, 92))/255
    return rgb

def wood(n=512, seed=13):
    """floorboards about 15 cm wide (13 across 2 m) with staggered joints and soft grain"""
    r = np.random.default_rng(seed); k = 13; c = n/k; Y, X = np.mgrid[0:n, 0:n]
    col = np.floor(X/c).astype(int) % k; rnd = r.random((k, 4)); off = rnd[:, 0]*n
    seg = np.floor(((Y + off[col]) % n)/(n/2)).astype(int)
    tone = 0.88 + 0.14*rnd[col, 1 + seg]
    grain = np.sin((X % c)/c*math.pi*3 + fbm(n, 6, seed)*9)*0.03
    rgb = base(n, (196, 150, 104))*(tone + grain)[..., None]
    rgb[(X % c) < 2] = np.array((128, 92, 62))/255
    j = ((Y + off[col]) % (n/2)) < 2; rgb[j] = np.array((140, 100, 66))/255
    return rgb

for name, fn in [('lawn', lawn), ('meadow', meadow), ('earth', earth), ('rock', rock)]:
    c, h = fn(); save(name, c, h)
for name, fn in [('asphalt', asphalt), ('sidewalk', sidewalk), ('dirt', dirt), ('gravel', gravel), ('water', water), ('floortile', floortile),
                 ('wallpaper', wallpaper), ('wood', wood)]:
    save(name, fn())
save('lanes', lanes())
c, h = lawn(512, 21); save('grass', c)          # the small lawn used for parks and verges drawn as shapes
print('painted', len(os.listdir(OUT)), 'tiles into', OUT)
