#!/usr/bin/env python3
"""Paints the building fronts and roofs: one texture, made entirely in code, in the same flat, softly shaded style as the survivors.
Each 256 px tile is one bay of wall, 4 m wide and one storey (3.2 m) high, or a stretch of roof. The alpha channel says how the game uses
each pixel:  255 = wall material, tinted by the building's own colour;  128 = window glass, which may light up at night;
0 = a fixed colour (window frames, mortar, doors, signs, trims).
Building types follow how real American town buildings are put together (see docs/BUILDINGS.md): lap-sided and brick homes with
trimmed windows and shutters; one- and two-part commercial blocks with a glazed shopfront, kickplate and transom under a brick upper
storey; ribbon-windowed offices; corrugated sheds with roll-up doors; fire stations with bay doors; stone civic fronts with tall arched
windows; schools with wide window bands; clinics in pale panels; open parking decks.
Layout: 8 x 8 tiles; see TILE below. Output: tools/out/btex.png. Run tools/write_assets.py afterwards."""
import os, numpy as np
from PIL import Image
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out'); os.makedirs(OUT, exist_ok=True)
N = 256; PX, PY = N/4.0, N/3.2          # pixels per metre across and up
rng = np.random.default_rng(11)
X, Y = np.meshgrid((np.arange(N) + 0.5)/PX, (np.arange(N) + 0.5)/PY)   # metres from the left, metres down from the top of the storey
H = 3.2 - Y                                                              # metres up from the floor

class T:
    def __init__(s): s.rgb = np.ones((N, N, 3)); s.a = np.full((N, N), 255.0)
    def put(s, m, col, a=0):
        col = np.array(col, float)/255 if max(col) > 1.5 else np.array(col, float); s.rgb[m] = col; s.a[m] = a
    def shade(s, m, f): s.rgb[m] *= f
def box(x0, x1, h0, h1): return (X >= x0) & (X < x1) & (H >= h0) & (H < h1)
def noise(a): return 1 + (rng.random((N, N)) - 0.5)*2*a

# ---------------- wall materials (painted near white, the building's colour tints them) ----------------
def siding(t):
    b = (H*5) % 1                                   # 20 cm boards
    t.rgb *= (0.84 + 0.16*b)[..., None]; t.rgb[(b < 0.06)] *= 0.86; t.rgb *= noise(0.012)[..., None]
def brick(t):
    """big, soft bricks: the mortar is a lighter shade of the brick colour, so walls read as brick without shimmering at a distance"""
    row = np.floor(H/0.16); off = (row % 2)*0.25; bx = ((X + off)/0.5) % 1; by = (H/0.16) % 1
    rnd = np.random.default_rng(3).random((40, 20)); idx = (np.clip(row, 0, 39).astype(int), np.clip(np.floor((X + off)/0.5), 0, 19).astype(int))
    t.rgb *= (0.84 + 0.12*rnd[idx])[..., None]; t.rgb *= noise(0.015)[..., None]
    m = (bx < 0.035) | (by < 0.1); t.rgb[m] = np.minimum(1.0, t.rgb[m]*0 + 1.0)
def stucco(t): t.rgb *= (0.93*noise(0.03))[..., None]; t.rgb *= (0.96 + 0.04*np.cos(X*1.7 + H*0.9))[..., None]
def concrete(t):
    t.rgb *= (0.9*noise(0.02))[..., None]
    t.put((np.abs(X % 2.0) < 0.02) | (np.abs(H % 1.6) < 0.02), (150, 148, 142), 0)
def metal(t):
    r = (X/0.1) % 1; t.rgb *= (0.78 + 0.22*np.abs(np.sin(r*np.pi)))[..., None]; t.rgb *= noise(0.01)[..., None]
def stone(t):
    row = np.floor(H/0.32); off = (row % 2)*0.35; sx = ((X + off)/0.7) % 1; sy = (H/0.32) % 1
    rnd = np.random.default_rng(5).random((40, 20)); idx = (np.clip(row, 0, 39).astype(int), np.clip(np.floor((X + off)/0.7), 0, 19).astype(int))
    t.rgb *= (0.86 + 0.1*rnd[idx])[..., None]; t.rgb *= noise(0.012)[..., None]; t.rgb[(sx < 0.02) | (sy < 0.04)] *= 0.86
def panel(t):
    t.rgb *= 0.95; t.put((np.abs(X % 1.333) < 0.015) | (np.abs(H % 3.2 - 1.6) < 0.015), (170, 172, 174), 0)

# ---------------- windows, doors and trims ----------------
GLASS_TOP, GLASS_BOT = np.array([150, 186, 206])/255, np.array([62, 92, 116])/255
def glass(t, m, x0, x1, h0, h1, refl=True):
    f = np.clip((H - h0)/max(0.01, h1 - h0), 0, 1)[..., None]; c = GLASS_BOT*(1 - f) + GLASS_TOP*f
    if refl: c = c + 0.12*((((X - x0) + (H - h0)*0.6) % 1.4) < 0.22)[..., None]
    t.rgb[m] = c[m]; t.a[m] = 128
def window(t, cx, h0, h1, w, frame=(246, 244, 238), mull=True, shutters=None, sill=True, lintel=None):
    x0, x1 = cx - w/2, cx + w/2; fr = 0.07
    if shutters is not None:
        for sx in (x0 - 0.36, x1 + 0.04):
            m = box(sx, sx + 0.32, h0, h1); t.put(m, shutters, 0); t.shade(m & (((H - h0)/0.12 % 1) < 0.25), 0.82)
    t.put(box(x0 - fr, x1 + fr, h0 - fr, h1 + fr), frame, 0)
    glass(t, box(x0, x1, h0, h1), x0, x1, h0, h1)
    if mull:
        t.put(box(cx - 0.025, cx + 0.025, h0, h1), frame, 0); t.put(box(x0, x1, (h0 + h1)/2 - 0.025, (h0 + h1)/2 + 0.025), frame, 0)
    if sill: t.put(box(x0 - 0.12, x1 + 0.12, h0 - 0.12, h0 - fr), tuple(int(v*0.88) for v in frame), 0)
    if lintel: t.put(box(x0 - 0.1, x1 + 0.1, h1 + fr, h1 + 0.24), lintel, 0)
def arch_window(t, cx, h0, h1, w, frame, keystone):
    x0, x1 = cx - w/2, cx + w/2; r = w/2; hc = h1 - r
    shape = (box(x0, x1, h0, hc) | (((X - cx)**2 + ((H - hc)*1.0)**2 < r*r) & (H >= hc)))
    outer = (box(x0 - 0.1, x1 + 0.1, h0 - 0.1, hc) | (((X - cx)**2 + (H - hc)**2 < (r + 0.1)**2) & (H >= hc)))
    t.put(outer, frame, 0); glass(t, shape, x0, x1, h0, h1); t.put(shape & (np.abs(X - cx) < 0.025), frame, 0)
    t.put(shape & (np.abs(H - (h0 + hc)/2) < 0.025), frame, 0); t.put(box(cx - 0.09, cx + 0.09, h1 - 0.02, h1 + 0.16), keystone, 0)
    t.put(box(x0 - 0.15, x1 + 0.15, h0 - 0.16, h0 - 0.08), keystone, 0)

# ---------------- the tiles ----------------
TILE = {}
def tile(name, idx, fn): TILE[name] = (idx, fn)
SHUT = [(62, 88, 70), (52, 62, 84), (110, 52, 46)]
def house_win(t, sh): siding(t); window(t, 2.0, 0.95, 2.25, 0.95, shutters=sh)
tile('siding_win_green', 0, lambda t: house_win(t, SHUT[0]))
tile('siding_win_blue', 1, lambda t: house_win(t, SHUT[1]))
tile('siding_win', 2, lambda t: house_win(t, None))
tile('brick_house_win', 3, lambda t: (brick(t), window(t, 2.0, 0.95, 2.25, 0.95, shutters=SHUT[2], lintel=(226, 218, 204))))
tile('brick_win', 4, lambda t: (brick(t), window(t, 2.0, 0.95, 2.3, 1.05, frame=(232, 228, 220), lintel=(214, 206, 190))))
def storefront(t):
    brick(t); x0, x1 = 0.28, 3.72
    t.put(box(x0, x1, 0, 0.45), (58, 48, 44), 0); t.shade(box(x0, x1, 0, 0.45) & ((X*4) % 1 < 0.06), 0.8)          # kickplate
    t.put(box(x0, x1, 0.45, 3.2), (44, 40, 38), 0); glass(t, box(x0 + 0.05, x1 - 0.05, 0.5, 2.55), x0, x1, 0.5, 2.55)    # display window
    glass(t, box(x0 + 0.05, x1 - 0.05, 2.68, 3.05), x0, x1, 2.68, 3.05, refl=False)                                  # transom
    for k in range(1, 6): t.put(box(x0 + k*(x1 - x0)/6 - 0.02, x0 + k*(x1 - x0)/6 + 0.02, 2.68, 3.05), (44, 40, 38), 0)
    t.put(box(2.0 - 0.03, 2.0 + 0.03, 0.5, 2.55), (44, 40, 38), 0)
tile('storefront', 5, storefront)
def upper_comm(t):
    brick(t)
    for cx in (1.15, 2.85): window(t, cx, 0.8, 2.45, 0.72, frame=(236, 230, 214), mull=False, lintel=(222, 212, 192))
    t.put(box(0, 4, 0.8, 2.45) & (np.abs(X - 1.15) < 0.36) & (np.abs(H - 1.85) < 0.022), (236, 230, 214), 0)
    t.put(box(0, 4, 0.8, 2.45) & (np.abs(X - 2.85) < 0.36) & (np.abs(H - 1.85) < 0.022), (236, 230, 214), 0)
tile('comm_upper', 6, upper_comm)
def ribbon(t):
    concrete(t); glass(t, box(0, 4, 1.0, 2.6), 0, 4, 1.0, 2.6)
    for k in range(5): t.put(box(k - 0.03, k + 0.03, 1.0, 2.6), (60, 64, 70), 0)
    t.put(box(0, 4, 0.95, 1.0), (60, 64, 70), 0); t.put(box(0, 4, 2.6, 2.65), (60, 64, 70), 0)
tile('office_ribbon', 7, ribbon)
def lobby(t):
    t.put(box(0, 4, 0, 3.2), (52, 56, 62), 0); glass(t, box(0.05, 3.95, 0.12, 3.0), 0, 4, 0.12, 3.0)
    for k in (1, 2, 3): t.put(box(k - 0.03, k + 0.03, 0.12, 3.0), (52, 56, 62), 0)
    t.put(box(0, 4, 2.3, 2.35), (52, 56, 62), 0)
tile('glass_lobby', 8, lobby)
def shed(t): metal(t); window(t, 2.0, 1.0, 2.2, 0.9, frame=(90, 96, 100), mull=True, sill=False)
tile('metal_win', 9, shed)
def rollup(t):
    metal(t); x0, x1 = 0.2, 3.8; t.put(box(x0 - 0.08, x1 + 0.08, 0, 2.9), (70, 76, 80), 0)
    m = box(x0, x1, 0, 2.8); t.put(m, (206, 208, 204), 0); t.shade(m & (((H/0.16) % 1) < 0.18), 0.82); t.shade(m & (H < 0.3), 0.9)
    t.put(box(x0, x1, 2.8, 2.9), (90, 96, 100), 0)
tile('rollup', 10, rollup)
def firebay(t):
    brick(t); x0, x1 = 0.2, 3.8; t.put(box(x0 - 0.12, x1 + 0.12, 0, 3.0), (176, 44, 38), 0)
    m = box(x0, x1, 0, 2.9); t.put(m, (236, 234, 228), 0); t.shade(m & (((H/0.48) % 1) < 0.06), 0.8)
    for k in range(5): glass(t, box(x0 + 0.2 + k*0.7, x0 + 0.62 + k*0.7, 1.75, 2.1), 0, 4, 1.75, 2.1, refl=False)
tile('firebay', 11, firebay)
tile('stone_arch', 12, lambda t: (stone(t), arch_window(t, 2.0, 0.7, 2.95, 1.0, (236, 232, 222), (216, 208, 190))))
def school(t):
    brick(t); x0, x1 = 0.35, 3.65; t.put(box(x0 - 0.08, x1 + 0.08, 0.92, 2.68), (234, 230, 222), 0); glass(t, box(x0, x1, 1.0, 2.6), x0, x1, 1.0, 2.6)
    for k in (1, 2): t.put(box(x0 + k*(x1 - x0)/3 - 0.04, x0 + k*(x1 - x0)/3 + 0.04, 1.0, 2.6), (234, 230, 222), 0)
    t.put(box(x0, x1, 2.0, 2.05), (234, 230, 222), 0); t.put(box(x0 - 0.15, x1 + 0.15, 0.82, 0.92), (210, 204, 192), 0)
tile('school_band', 13, school)
def clinic(t):
    panel(t); x0, x1 = 0.8, 3.2; t.put(box(x0 - 0.06, x1 + 0.06, 0.94, 2.26), (120, 140, 160), 0); glass(t, box(x0, x1, 1.0, 2.2), x0, x1, 1.0, 2.2)
    t.put(box(1.97, 2.03, 1.0, 2.2), (120, 140, 160), 0)
tile('clinic_panel', 14, clinic)
def deck(t):
    concrete(t); t.put(box(0.25, 3.75, 0.95, 2.65), (34, 36, 40), 0); t.shade(box(0.25, 3.75, 0.95, 2.65) & (H > 2.4), 0.6)
    t.put(box(0.25, 3.75, 0.95, 1.0), (120, 118, 112), 0)
tile('parking_deck', 15, deck)
def rustic(t):
    stone(t); t.shade(((H/0.32) % 1) < 0.12, 0.85); window(t, 2.0, 0.95, 2.4, 1.0, frame=(232, 226, 212), lintel=(210, 202, 186))
tile('stone_base', 16, rustic)
tile('stucco_win', 17, lambda t: (stucco(t), window(t, 2.0, 0.95, 2.25, 1.0, frame=(80, 76, 72))))
def church(t):
    siding(t); arch_window(t, 2.0, 0.8, 3.0, 0.8, (246, 244, 238), (226, 222, 214))
tile('clapboard_arch', 18, church)
def apt(t): brick(t); window(t, 1.2, 0.95, 2.35, 0.85, frame=(232, 228, 220), lintel=(212, 204, 188)); window(t, 2.8, 0.95, 2.35, 0.85, frame=(232, 228, 220), lintel=(212, 204, 188))
tile('apt_pair', 19, apt)
tile('siding_apt', 20, lambda t: (siding(t), window(t, 1.2, 0.95, 2.25, 0.85, mull=False), window(t, 2.8, 0.95, 2.25, 0.85, mull=False)))
tile('metal_high', 21, lambda t: (metal(t), [glass(t, box(0.4 + k*1.2, 1.2 + k*1.2, 2.3, 2.8), 0, 4, 2.3, 2.8, refl=False) for k in range(3)]))
# plain walls, for short stretches with no window
tile('plain_siding', 24, siding); tile('plain_brick', 25, brick); tile('plain_stucco', 26, stucco); tile('plain_concrete', 27, concrete)
tile('plain_metal', 28, metal); tile('plain_stone', 29, stone); tile('plain_panel', 30, panel)
# roofs: painted light, tinted by the roof colour
def shingles(t):
    row = np.floor(Y/0.25); off = (row % 2)*0.18; sx = ((X + off)/0.36) % 1; sy = (Y/0.25) % 1
    rnd = np.random.default_rng(9).random((20, 20)); idx = (np.clip(row, 0, 19).astype(int), np.clip(np.floor((X + off)/0.36), 0, 19).astype(int))
    t.rgb *= (0.78 + 0.18*rnd[idx])[..., None]; t.rgb[sy > 0.86] *= 0.7; t.rgb[sx < 0.04] *= 0.8
def membrane(t): t.rgb *= (0.86*noise(0.06))[..., None]; t.rgb[(np.abs(X % 2) < 0.02) | (np.abs(Y % 3.2) < 0.02)] *= 0.85
def seam(t): r = (X/0.5) % 1; t.rgb *= (0.86 + 0.1*(r > 0.5))[..., None]; t.rgb[r < 0.04] *= 0.75
tile('roof_shingle', 32, shingles); tile('roof_flat', 33, membrane); tile('roof_metal', 34, seam)

atlas = np.zeros((2048, 2048, 4), np.uint8)
for name, (idx, fn) in TILE.items():
    t = T(); fn(t); y, x = (idx // 8)*N, (idx % 8)*N
    atlas[y:y+N, x:x+N, :3] = np.clip(np.round(t.rgb*255), 0, 255); atlas[y:y+N, x:x+N, 3] = np.round(t.a)
Image.fromarray(atlas, 'RGBA').save(os.path.join(OUT, 'btex.png'), optimize=True)
print('tiles', len(TILE), os.path.getsize(os.path.join(OUT, 'btex.png'))//1024, 'KB')
print({k: v[0] for k, v in TILE.items()})
