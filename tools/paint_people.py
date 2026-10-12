#!/usr/bin/env python3
"""Paints the survivors' texture: faces, tops, sleeves, trousers, shoes and hair, in a flat, soft-shaded style.
Every pixel stores two things, so one texture serves every survivor:
  red   = shade (128 means "as is", lower is darker, higher is lighter)
  green = which of the survivor's colours to use: 0 skin, 1 top, 2 bottoms, 3 shoes, 4 hair, 5 accent, 6 ink, 7 white
The game picks the colours from each survivor's look, so a striped top, freckles or stubble follow their own colours.
Layout: 8 x 8 tiles of 256 px. Row 0 faces, row 1 tops (body), row 2 tops (sleeves), row 3 bottoms, row 4 shoes, row 5 hair.
Texture coordinates come from tools/build_people.py: u goes round the part (0.5 is the front), v goes up it (head: 0 neck, 0.6 eyes,
1 crown; body: 0 waist, 1 neck; sleeve: 0 shoulder, 0.7 wrist, 1 fingertips; legs: 0 ankle, 0.5 knee, 1 waist; shoe: u heel to toe, v sole to top).
Output: tools/out/people_tex.png. Run tools/write_assets.py afterwards."""
import os, numpy as np
from PIL import Image
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out'); os.makedirs(OUT, exist_ok=True)
N = 256; rng = np.random.default_rng(7)
u, v = np.meshgrid((np.arange(N) + 0.5)/N, (np.arange(N) + 0.5)/N)   # v grows down the image, as the game samples it
SKIN, TOP, BOT, SHOE, HAIR, ACC, INK, WHITE = range(8)

def blank(slot): return np.full((N, N), slot, np.int32), np.ones((N, N))
def grain(a=0.025): return 1 + (rng.random((N, N)) - 0.5)*2*a
def du(c): d = np.abs(u - c); return np.minimum(d, 1 - d)          # distance round the part, wrapping at the back
def ell(cu, cv, ru, rv): return (du(cu)/ru)**2 + ((v - cv)/rv)**2 < 1
def back(): return 0.9 + 0.1*np.cos((u - 0.5)*2*np.pi)               # a little darker round the back
def soft(sh, lo=0.94, hi=1.04): return sh*(lo + (hi - lo)*v)        # lighter towards the top of each part

# ---------------- faces ----------------
EU, EV = 0.066, 0.60   # where the eyes are
def face(kind):
    s, sh = blank(SKIN); sh = soft(sh, 0.9, 1.04)*back()*grain(0.012)
    # ears, jaw shadow, nose and a quiet mouth, all in skin shades
    for c in (0.25, 0.75): sh[ell(c, 0.55, 0.03, 0.08)] *= 0.9
    sh[(v < 0.38) & (du(0.5) < 0.2)] *= 0.93                                       # under the jaw
    sh[ell(0.5, 0.53, 0.012, 0.05)] *= 0.86; sh[ell(0.507, 0.56, 0.006, 0.03)] *= 1.08   # nose
    sh[ell(0.5, 0.455, 0.026, 0.009)] *= 0.55                                       # mouth
    for c in (0.5 - 0.1, 0.5 + 0.1): sh[ell(c, 0.5, 0.035, 0.05)] *= 1.04               # cheeks catch the light
    sh[ell(0.5, 0.435, 0.016, 0.008)] *= 0.92                                       # lower lip shadow
    for sgn in (-1, 1):
        cu = 0.5 + sgn*EU
        if kind == 4:   # tired: heavy lids, bags under the eyes
            m = ell(cu, EV, 0.012, 0.03) & (v < EV + 0.004); s[m] = INK; sh[ell(cu, EV - 0.045, 0.016, 0.012)] *= 0.86
        else:
            s[ell(cu, EV, 0.0135, 0.037)] = INK; s[ell(cu + 0.004, EV + 0.018, 0.004, 0.009)] = WHITE   # eye and a glint
        bw = 0.024; bv = EV + (0.075 if kind != 2 else 0.068); thick = 0.012 if kind in (2, 5) else 0.008
        m = (du(cu) < bw) & (np.abs(v - (bv - 0.012*((u - cu)*sgn*-1/bw)**2*0 + 0.006*np.cos((u - cu)/bw*1.6))) < thick)
        s[m] = HAIR; sh[m] = 0.75                                                     # brows in the hair colour
        if kind == 3:   # freckles and lashes
            for _ in range(9):
                fu = cu + sgn*(0.005 + rng.random()*0.04); fv = EV - 0.06 - rng.random()*0.05; sh[ell(fu, fv, 0.004, 0.006)] *= 0.78
            s[(du(cu + sgn*0.012) < 0.004) & (np.abs(v - (EV + 0.03)) < 0.008)] = INK
        if kind == 1 or kind == 6:   # round glasses, or dark ones
            r = ((du(cu)/0.026)**2 + ((v - EV)/0.06)**2)
            if kind == 1: s[(r < 1) & (r > 0.62)] = INK; sh[(r <= 0.62) & (s != INK)] *= 1.06
            else: s[r < 1] = INK; s[ell(cu + 0.01, EV + 0.025, 0.006, 0.01)] = WHITE
        if kind == 7 and sgn == 1:   # a scar through the brow
            m = (np.abs((u - cu) - (v - EV - 0.07)*0.35) < 0.004) & (np.abs(v - EV - 0.04) < 0.1); sh[m] *= 0.72
    if kind in (1, 6):
        s[(du(0.5) < 0.04) & (np.abs(v - EV - 0.01) < 0.006)] = INK                    # bridge
        for c in (0.5 - EU - 0.026, 0.5 + EU + 0.026): s[(du(c - (0.5 - c)*0) < 0.06) & (np.abs(v - EV - 0.012) < 0.005) & (du(0.5) > EU + 0.02) & (du(0.5) < 0.2)] = INK   # arms to the ears
    if kind == 2:   # stubble along the jaw, chin and lip
        m = (du(0.5) < 0.16) & (v < 0.5) & (v > 0.33) & ~ell(0.5, 0.455, 0.03, 0.012); dots = rng.random((N, N)) < 0.32; s[m & dots] = HAIR; sh[m & dots] = 0.8
    if kind == 5:   # a moustache
        m = ell(0.5, 0.48, 0.04, 0.012) & ~((du(0.5) < 0.004)); s[m] = HAIR; sh[m] = 0.85
    return s, sh

# ---------------- tops: body and sleeves ----------------
def stripes(s, sh, period=0.09, w=0.4):
    m = ((v/period) % 1) < w; s[(s == TOP) & m] = ACC
def plaid(s, sh, p=0.11):
    a = ((u*4/p/8) % 1) < 0.3; b = ((v/p) % 1) < 0.3; m = s == TOP
    s[m & (a ^ b)] = ACC; sh[m & a & b] *= 0.72; s[m & a & b] = ACC
    sh[m & ((((u*4/p/8) % 1) - 0.5)**2 < 0.0015)] *= 0.8
def dots(s, sh, p=0.07):
    gu = (u*8) % 1; gv = (v/p) % 1; row = np.floor(v/p) % 2; gu = (gu + row*0.5) % 1
    s[(s == TOP) & (((gu - 0.5)/0.18)**2 + ((gv - 0.5)/0.24)**2 < 1)] = ACC
def collar_neck(s, sh, kind):
    if kind == 'crew':
        m = (v > 0.93) | ((v > 0.86) & (du(0.5) < 0.06*np.sqrt(np.clip((v - 0.86)/0.07, 0, 1))))
        s[m & (v > 0.955)] = SKIN; sh[m & (v <= 0.955)] *= 0.82
    if kind == 'peter':
        m = (v > 0.86) & (du(0.5) < 0.16) & (((du(0.5) - 0.08)/0.085)**2 + ((v - 0.95)/0.1)**2 < 1.4); s[m] = WHITE; sh[m] = 1.0
def body_top(kind):
    s, sh = blank(TOP); sh = soft(sh)*back()*grain()
    sh[v < 0.05] *= 0.84                                                                            # hem
    if kind == 0: collar_neck(s, sh, 'crew')
    if kind == 1: stripes(s, sh); collar_neck(s, sh, 'crew')
    if kind == 2:
        plaid(s, sh); pl = du(0.5) < 0.012; sh[pl] *= 0.85
        for k in range(6): s[ell(0.5, 0.1 + k*0.15, 0.006, 0.014)] = WHITE                          # buttons
        m = (v > 0.86) & (du(0.5) < 0.12) & (v > 0.86 + (0.12 - du(0.5))*0.9); s[m] = TOP; sh[m] = 1.12  # pointed collar
        s[(v > 0.95)] = TOP; sh[v > 0.95] *= 0.85
    if kind == 3: dots(s, sh); collar_neck(s, sh, 'peter')
    if kind == 4:   # hoodie
        m = (du(0.5) < 0.13) & (v > 0.08) & (v < 0.36) & (du(0.5) < 0.13 - (v - 0.08)*0.12); sh[m] *= 0.9; sh[m & (np.abs(du(0.5) - (0.13 - (v - 0.08)*0.12)) < 0.006)] *= 0.75
        for c in (0.47, 0.53): s[(du(c) < 0.004) & (v > 0.72) & (v < 0.95)] = WHITE
        sh[v > 0.9] *= 0.85; sh[(v > 0.8) & (du(0.0) < 0.2)] *= 0.88; sh[v < 0.08] *= 0.9
    if kind == 5:   # open jacket over a tee
        inner = du(0.5) < 0.045 + (1 - v)*0.025; s[inner] = ACC; sh[inner] = soft(np.ones((N, N)))[inner]
        edge = np.abs(du(0.5) - (0.045 + (1 - v)*0.025)) < 0.008; sh[edge] *= 0.78
        lap = (v > 0.7) & (du(0.5) < 0.1) & (du(0.5) > 0.045 + (1 - v)*0.025) & (du(0.5) < 0.045 + (1 - v)*0.025 + (v - 0.7)*0.25); sh[lap] *= 1.12
        for c in (0.38, 0.62): sh[(du(c) < 0.05) & (np.abs(v - 0.2) < 0.004)] *= 0.7                 # pocket flaps
    if kind == 6:   # knitted jumper with a chest band
        band = (v > 0.58) & (v < 0.72); s[band] = ACC
        zig = np.abs(((u*24) % 1) - 0.5)*0.12 + 0.62; s[band & (np.abs(v - zig) < 0.012)] = WHITE
        rib = (v < 0.08); sh[rib] *= np.where(((u*96) % 1) < 0.5, 0.85, 1.0)[rib]; collar_neck(s, sh, 'crew')
        sh *= np.where(((u*64) % 1) < 0.5, 0.97, 1.0)
    if kind == 7:   # dungarees over a tee
        bib = (du(0.5) < 0.1) & (v < 0.72); s[bib] = BOT; sh[bib] = soft(np.ones((N, N)), 0.95, 1.02)[bib]
        for c in (0.42, 0.58, 0.08, 0.92):
            st = (du(c) < 0.022) & (v >= 0.6); s[st] = BOT
        for c in (0.42, 0.58): s[ell(c, 0.72, 0.012, 0.022)] = WHITE
        sh[bib & (np.abs(v - 0.45) < 0.004) & (du(0.5) < 0.07)] *= 0.75; collar_neck(s, sh, 'crew')
    return s, sh
SLEEVE = {0: 0.3, 1: 0.3, 2: 0.66, 3: 0.3, 4: 0.68, 5: 0.66, 6: 0.68, 7: 0.3}
def arm_top(kind):
    s, sh = blank(TOP); sh = sh*grain()*(0.93 + 0.07*np.cos((u - 0.75)*2*np.pi))   # light from above
    L = SLEEVE[kind]
    if kind == 1: stripes(s, sh)
    if kind == 2: plaid(s, sh)
    if kind == 3: dots(s, sh)
    if kind == 6:
        band = (v > 0.12) & (v < 0.2); s[band] = ACC
    if kind == 7: pass
    s[v > L] = SKIN; sh[v > L] = (0.95 + 0.05*np.cos((u - 0.75)*2*np.pi))[v > L]
    cuff = (v > L - 0.035) & (v <= L); sh[cuff] *= 0.82
    if kind in (4, 6): sh[cuff] *= np.where(((u*48) % 1) < 0.5, 0.88, 1.0)[cuff]
    if kind == 2: s[cuff] = TOP
    # the hand: a slightly darker palm, a line for the fingers
    hand = v > 0.7; sh[hand & (du(0.25) < 0.2)] *= 0.92; sh[hand & (np.abs(v - 0.85) < 0.006) & (du(0.75) < 0.2)] *= 0.85
    return s, sh

# ---------------- bottoms ----------------
def legs(kind):
    s, sh = blank(BOT); sh = soft(sh, 0.92, 1.02)*back()*grain(0.03)
    if kind in (0, 5, 2, 4):
        tw = ((u*90 + v*60) % 1) < 0.5; sh *= np.where(tw, 0.98, 1.02)                               # twill
        for c in (0.25, 0.75): sh[(du(c) < 0.004)] *= 1.12                                            # side seams
        belt = v > 0.95; s[belt] = INK; sh[belt] = 1.0; s[(v > 0.95) & (du(0.5) < 0.02)] = WHITE
        if kind != 4:
            for c in (0.38, 0.62): m = (np.abs(v - (0.9 - (du(c) / 0.08)**2*0.06)) < 0.005) & (du(c) < 0.07); sh[m] *= 0.75   # pocket curves
        sh[v < 0.03] *= 1.1
    if kind == 1:   # shorts and socks
        sk = v < 0.56; s[sk] = SKIN; sh[sk] = (0.94 + 0.06*v)[sk]; sh[(v >= 0.56) & (v < 0.59)] *= 0.82
        so = v < 0.1; s[so] = WHITE; s[(v > 0.07) & (v < 0.085)] = ACC
        belt = v > 0.95; sh[belt] *= 0.8
    if kind == 2:   # cargo pockets
        for c in (0.25, 0.75):
            p = (du(c) < 0.07) & (v > 0.56) & (v < 0.74); sh[p] *= 0.93; sh[p & ((np.abs(v - 0.74) < 0.008) | (np.abs(du(c) - 0.07) < 0.005))] *= 0.75
            fl = (du(c) < 0.075) & (v > 0.7) & (v < 0.76); sh[fl] *= 1.08
        sh[np.abs(v - 0.5) < 0.004] *= 0.85
    if kind == 3:   # skirt to the knee, socks below
        sk = v < 0.5; s[sk] = SKIN; sh[sk] = (0.94 + 0.06*v)[sk]
        pleat = (v >= 0.5) & (((u*28) % 1) < 0.08); sh[pleat] *= 0.82; sh[(v >= 0.5) & (v < 0.53)] *= 0.85
        so = v < 0.12; s[so] = WHITE; sh[so] = 1.0
    if kind == 4:   # track pants: two stripes down each side
        for c in (0.25, 0.75):
            for o in (-0.018, 0.018): s[du(c + o) < 0.006] = ACC
        sh[v < 0.05] *= 0.85; sh[(v > 0.92) & (v <= 0.95)] *= 0.85
    if kind == 5:   # rolled cuffs
        roll = (v > 0.04) & (v < 0.12); sh[roll] = 1.18; sh[np.abs(v - 0.08) < 0.006] *= 0.8
    return s, sh

# ---------------- shoes ----------------
def shoe(kind):
    s, sh = blank(SHOE if kind else ACC); sh = sh*grain(0.02)*(0.9 + 0.12*v)
    if kind == 0:   # trainers
        s[v < 0.24] = WHITE; sh[v < 0.06] *= 0.85
        s[(u > 0.8) & (v < 0.45)] = WHITE
        for k in range(4): s[(np.abs(u - (0.5 + k*0.07)) < 0.012) & (v > 0.66)] = WHITE
        s[(u < 0.1) & (v > 0.5)] = WHITE
    if kind == 1:   # boots
        s[v < 0.16] = INK; sh[v < 0.16] = 1.0
        for k in range(5): s[(np.abs(u - (0.42 + k*0.07) - (v - 0.8)*0.05) < 0.008) & (v > 0.62)] = INK
        sh[np.abs(v - 0.2) < 0.006] *= 0.8
    if kind == 2:   # rain boots
        s[v < 0.14] = INK; sh[v < 0.14] = 1.0; sh[(u > 0.2) & (u < 0.3) & (v > 0.4)] *= 1.15
    return s, sh

# ---------------- hair ----------------
def hair():
    s, sh = blank(HAIR); streak = rng.random(N*2)
    for x in range(N):
        sh[:, x] *= 0.9 + 0.16*streak[x]
    sh *= np.clip(0.8 + 0.35*v, 0.8, 1.12); sh[(v > 0.78) & (v < 0.86)] *= 1.08
    for _ in range(140):
        x = rng.integers(0, N); y0 = rng.integers(0, N - 40); s_ = slice(y0, y0 + rng.integers(15, 40)); sh[s_, x] *= 0.8
    return s, sh

atlas = np.zeros((2048, 2048, 4), np.uint8); atlas[..., 3] = 255
def put(row, col, sv):
    s, sh = sv; y, x = row*N, col*N
    atlas[y:y+N, x:x+N, 0] = np.clip(np.round(sh*128), 0, 255); atlas[y:y+N, x:x+N, 1] = s*32 + 16
for k in range(8): put(0, k, face(k))
for k in range(8): put(1, k, body_top(k)); put(2, k, arm_top(k))
for k in range(6): put(3, k, legs(k))
for k in range(3): put(4, k, shoe(k))
put(5, 0, hair())
Image.fromarray(atlas, 'RGBA').save(os.path.join(OUT, 'people_tex.png'), optimize=True)
# a preview in sample colours, to look at while painting
pal = np.array([[224, 172, 130], [58, 102, 196], [43, 47, 56], [91, 59, 38], [74, 48, 32], [233, 218, 176], [28, 23, 20], [244, 239, 230]], float)
prev = pal[atlas[..., 1]//32]*(atlas[..., 0:1]/128.0)
print('painted', os.path.getsize(os.path.join(OUT, 'people_tex.png'))//1024, 'KB')
