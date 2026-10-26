"""Tyres and rims of the vehicle kit. Every tyre is modelled with radius 1 and width 1 (x from -0.5 to 0.5), centred, turning about x; every rim likewise with radius 1 (the rim's own radius).
Rim detail (spokes, nuts, bolts) is drawn on the +x face only, as on the stock wheels: put the wheel on the right side as it is and turn it half a turn about y on the left.
Draw a wheel as: tyre scaled (w, r, r), then the rim scaled (w, r*rimFrac, r*rimFrac) where w and r are the vehicle's wheelW and wheelR times the tyre's wMul and rMul."""
from kitreg import *

def tyre_model(n, lug, chamfer=0.88, extra=None, c='tyre'):
    K = ring_k(n, lug) if lug else None
    def ring(x, r, k=None):
        o = [x, 0, 0, r, r]
        if k: o.append(k)
        return o
    o = [loft([ring(-0.5, chamfer), ring(-0.44, 1.0, K), ring(0.44, 1.0, K), ring(0.5, chamfer)], c, ax='x', n=n)]
    if extra: o += extra
    return o
def chain_bands():
    return [loft([[x - 0.035, 0, 0, 1.04, 1.04], [x + 0.035, 0, 0, 1.04, 1.04]], 'steelL', ax='x', n=8) for x in (-0.22, 0.22)]
def sidewall_band():
    return [loft([[0.49, 0, 0, 0.92, 0.92], [0.505, 0, 0, 0.92, 0.92]], 'oliveD', ax='x', n=8)]

# name: (rMul, wMul, rimFrac, pieces, grip, note)
TY = {
 'road':        (1.00, 1.00, 0.66, tyre_model(10, None), {'road': 1.0, 'dirt': 0.6, 'mud': 0.35, 'snow': 0.3, 'sand': 0.4, 'wet': 0.85}, 'smooth touring tyre: quiet, best on tarmac'),
 'all_terrain': (1.12, 1.15, 0.58, tyre_model(12, 0.90), {'road': 0.9, 'dirt': 0.9, 'mud': 0.65, 'snow': 0.55, 'sand': 0.6, 'wet': 0.8}, 'blocky tread: copes with most things, a little louder'),
 'mud_terrain': (1.30, 1.35, 0.50, tyre_model(10, 0.78), {'road': 0.7, 'dirt': 1.0, 'mud': 1.0, 'snow': 0.6, 'sand': 0.7, 'wet': 0.6}, 'huge lugs: climbs mud and rocks, whines on tarmac, needs a lift on most bodies'),
 'snow':        (1.00, 1.05, 0.62, tyre_model(12, 0.94), {'road': 0.75, 'dirt': 0.6, 'mud': 0.4, 'snow': 1.0, 'sand': 0.3, 'wet': 0.8}, 'soft siped winter tyre'),
 'snow_chains': (1.02, 1.00, 0.66, tyre_model(10, None, extra=chain_bands()), {'road': 0.6, 'dirt': 0.7, 'mud': 0.7, 'snow': 1.0, 'sand': 0.3, 'wet': 0.6}, 'a road tyre with chains: best grip on snow and ice, rough and slow on tarmac'),
 'slick':       (1.00, 1.25, 0.70, tyre_model(10, None, chamfer=0.92), {'road': 1.2, 'dirt': 0.3, 'mud': 0.1, 'snow': 0.1, 'sand': 0.2, 'wet': 0.4}, 'wide and smooth: fastest on dry tarmac, hopeless off it'),
 'heavy':       (1.08, 1.20, 0.60, tyre_model(12, 0.86), {'road': 0.9, 'dirt': 0.8, 'mud': 0.6, 'snow': 0.5, 'sand': 0.5, 'wet': 0.75}, 'truck tyre: carries more and wears slower'),
 'sand':        (1.15, 1.60, 0.50, tyre_model(10, None, chamfer=0.82), {'road': 0.6, 'dirt': 0.9, 'mud': 0.6, 'snow': 0.6, 'sand': 1.0, 'wet': 0.5}, 'wide soft balloon tyre that floats on sand and soft ground'),
 'military':    (1.30, 1.25, 0.52, tyre_model(10, 0.80, extra=sidewall_band()), {'road': 0.7, 'dirt': 1.0, 'mud': 0.9, 'snow': 0.7, 'sand': 0.8, 'wet': 0.65}, 'big lugs and a reinforced sidewall: shrugs off punctures (half the chance)'),
 'solid':       (0.97, 0.90, 0.72, tyre_model(10, None, chamfer=0.95, c='steelD'), {'road': 0.8, 'dirt': 0.6, 'mud': 0.3, 'snow': 0.3, 'sand': 0.3, 'wet': 0.6}, 'puncture-proof solid rubber: never goes flat, rides hard'),
}
for k, (rm, wm, rf, ps, gr, nt) in TY.items():
    reg('tyres', k, ps, rMul=rm, wMul=wm, rimFrac=rf, grip=gr, note=nt)

def disc(r, w, c, n=8, x=0.0): return loft([[x - w/2, 0, 0, r, r], [x + w/2, 0, 0, r, r]], c, ax='x', n=n)
X = 0.531      # the +x face of a rim, a hair proud
def quad(pts, c): return flat([(X, y, z) for y, z in pts], c, (1, 0, 0))
def spoke_flat(a, r0, r1, t0, t1, c):
    ca, sa = math.cos(a), math.sin(a)
    return quad([(r0*ca - t0*sa, r0*sa + t0*ca), (r0*ca + t0*sa, r0*sa - t0*ca), (r1*ca + t1*sa, r1*sa - t1*ca), (r1*ca - t1*sa, r1*sa + t1*ca)], c)
def spokes(n, r0, r1, t0, t1, c, rot=0.0): return [spoke_flat(rot + i*2*math.pi/n, r0, r1, t0, t1, c) for i in range(n)]
def nuts(r, n, c, s=0.06):
    return [quad([(r*math.cos(a) - s, r*math.sin(a) - s), (r*math.cos(a) + s, r*math.sin(a) - s), (r*math.cos(a) + s, r*math.sin(a) + s), (r*math.cos(a) - s, r*math.sin(a) + s)], c) for a in [i*2*math.pi/n for i in range(n)]]
RIMS = {
 'steel':       ([disc(1.0, 1.02, 'rimSteel'), disc(0.78, 1.05, 'rimSteelD'), disc(0.3, 1.08, 'hubD', 6)] + nuts(0.55, 5, 'steelD'), 'plain pressed-steel wheel'),
 'steel_rust':  ([disc(1.0, 1.02, 'rust'), disc(0.78, 1.05, 'rustD'), disc(0.3, 1.08, 'hubD', 6)] + nuts(0.55, 5, 'rustD'), 'the same, rusted: what a wreck rolls on'),
 'alloy5':      ([disc(1.0, 1.02, 'alloy'), disc(0.82, 1.03, 'alloyD'), disc(0.22, 1.08, 'alloy', 6)] + spokes(5, 0.2, 0.95, 0.12, 0.2, 'alloy'), 'five-spoke light alloy'),
 'alloy_dark':  ([disc(1.0, 1.02, 'alloyD'), disc(0.82, 1.03, 'black'), disc(0.22, 1.08, 'steelL', 6)] + spokes(6, 0.2, 0.95, 0.1, 0.16, 'alloyD'), 'six-spoke blacked-out alloy'),
 'chrome_dish': ([disc(1.0, 1.04, 'chrome'), disc(0.7, 1.02, 'alloyD'), disc(0.2, 1.1, 'chrome', 6)] + spokes(8, 0.18, 0.92, 0.05, 0.08, 'chrome'), 'deep-dish chrome: shows off'),
 'beadlock':    ([disc(1.0, 1.06, 'steelL'), disc(0.86, 1.02, 'steelD'), disc(0.26, 1.08, 'steelL', 6)] + nuts(0.93, 12, 'black', 0.05) + spokes(4, 0.2, 0.84, 0.1, 0.12, 'steelL'), 'bolted bead-lock ring: for the hardest tyres'),
 'wire':        ([disc(1.0, 1.0, 'chrome'), disc(0.88, 1.04, 'black'), disc(0.2, 1.1, 'chrome', 6)] + spokes(12, 0.2, 0.95, 0.02, 0.02, 'chrome'), 'old-fashioned wire wheel'),
}
for k, (ps, nt) in RIMS.items():
    reg('rims', k, ps, note=nt)

# ---- bike and motorbike wheels: tyre and rim in one model, radius 1, width 1, scaled by the bike's wheelSize. Both faces are seen, so both are drawn ----
def spokes2(n, r0, r1, t, c, rot=0.0):
    out = []
    for sx in (1, -1):
        for i in range(n):
            a = rot + i*2*math.pi/n; ca, sa = math.cos(a), math.sin(a)
            pts = [(r0*ca - t*sa, r0*sa + t*ca), (r0*ca + t*sa, r0*sa - t*ca), (r1*ca + t*sa, r1*sa - t*ca), (r1*ca - t*sa, r1*sa + t*ca)]
            out.append(flat([(sx*X, y, z) for y, z in pts], c, (sx, 0, 0)))
    return out
def bike_wheel(n, lug, rimf, rimw, rimc, tyrec='tyre', spoke=0, spc='steelL', hubc='hubD'):
    K = ring_k(n, lug) if lug else None
    def ring(x, r, k=None):
        o = [x, 0, 0, r, r]
        if k: o.append(k)
        return o
    o = [loft([ring(-0.5, 0.9), ring(-0.42, 1.0, K), ring(0.42, 1.0, K), ring(0.5, 0.9)], tyrec, ax='x', n=n), disc(rimf, 1.03, rimc, 10), disc(rimf*0.86, 1.04, 'black' if not spoke else 'tyreD', 10), disc(0.14, 1.08, hubc, 6)]
    if spoke: o += spokes2(spoke, 0.14, rimf*0.9, 0.025 if spoke > 6 else 0.05, spc)
    return o
BW = {
 'road':        (1.00, 0.85, bike_wheel(10, None, 0.82, 0.6, 'steelL', spoke=16), {'road': 1.0, 'dirt': 0.5, 'mud': 0.3, 'snow': 0.4, 'wet': 0.8}, 'thin road tyre'),
 'gravel':      (1.02, 1.15, bike_wheel(10, 0.92, 0.8, 0.6, 'steelL', spoke=16), {'road': 0.85, 'dirt': 0.8, 'mud': 0.5, 'snow': 0.5, 'wet': 0.75}, 'a bit wider with a light tread'),
 'mtb':         (1.05, 1.5, bike_wheel(10, 0.82, 0.76, 0.6, 'steelD', spoke=12, spc='steelD'), {'road': 0.7, 'dirt': 1.0, 'mud': 0.85, 'snow': 0.6, 'wet': 0.65}, 'knobbly mountain-bike tyre'),
 'fat':         (1.10, 3.2, bike_wheel(10, 0.86, 0.62, 0.7, 'steelD'), {'road': 0.65, 'dirt': 0.9, 'mud': 0.8, 'snow': 1.0, 'sand': 1.0, 'wet': 0.6}, 'fat bike tyre: floats on snow and sand'),
 'moto_road':   (1.00, 1.00, bike_wheel(10, None, 0.74, 0.7, 'alloy', spoke=5, spc='alloy'), {'road': 1.0, 'dirt': 0.45, 'mud': 0.25, 'snow': 0.25, 'wet': 0.8}, 'motorbike road tyre on a cast wheel'),
 'moto_knobby': (1.06, 1.10, bike_wheel(10, 0.78, 0.7, 0.7, 'steelL', spoke=16), {'road': 0.6, 'dirt': 1.0, 'mud': 0.95, 'snow': 0.6, 'wet': 0.55}, 'trail tyre on a spoked wheel'),
}
for k, (rm, wm, ps, gr, nt) in BW.items():
    reg('bike_wheels', k, ps, rMul=rm, wMul=wm, grip=gr, note=nt)
