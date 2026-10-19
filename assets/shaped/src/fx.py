#!/usr/bin/env python3
"""Afterstreet effects and sky pack, version 1 (19 October 2026). Writes assets/shaped/fx.js.
Run: python3 assets/shaped/src/fx.py

Small pieces the game animates: each model is one to four pieces at about 1 m (sky pieces at unit size) with its origin at
the centre of its base, and notes[name] says how to scale, turn and fade it over its life. Glow pieces are drawn unlit.
Fading is the game's job (alpha or blending towards the fog colour); the shapes stay the same flat planes as every pack.
Sky pieces are billboards: turn them to face the camera and place them on the sky dome."""
import math, random
from kit import *

PALETTE = {
  'flash': '#ffd68a', 'flashCore': '#fff6d8', 'tracer': '#ffe8a8', 'spark': '#ffe0a0', 'dust': '#b8a88a', 'dustD': '#9a8c72', 'snow': '#f2f4f6', 'splash': '#a8c4d8', 'splashL': '#d8e8f2',
  'flame': '#ffb04a', 'flameCore': '#fff0b8', 'flameRed': '#e0602a', 'smoke': '#6a6660', 'smokeL': '#8a8680', 'fireball': '#ffa040', 'blast': '#d8c8a8', 'debris': '#4a4440', 'debrisL': '#7a7064',
  'flare': '#ff5a4a', 'flareCore': '#ffd0c0', 'glass': '#b8d4dc', 'chip': '#c8a87a', 'chipD': '#8a6a46', 'goo': '#3a5a2a', 'gooL': '#6a8a3a',
  'moon': '#e8e4d4', 'moonDark': '#2a3040', 'cloud': '#e8eaec', 'cloudD': '#c8ccd2', 'overcast': '#a8acb2', 'overcastD': '#8a8e96', 'storm': '#5a5e68', 'stormD': '#3a3e48',
  'rain': '#a9c4dc', 'bolt': '#e8f0ff', 'aurora1': '#5df2a0', 'aurora2': '#7a6af2'
}
G = dict(glow=True)
M = {}; NOTES = {}
def fx(name, pieces, note, cat='effects'):
    M.setdefault(cat, {})[name] = pieces; NOTES[name] = note
def ring_pts(r, n, y=0.0, jit=0.0, seed=0):
    R = random.Random(seed)
    return [(math.cos(a)*r*(1 + R.uniform(-jit, jit)), y, math.sin(a)*r*(1 + R.uniform(-jit, jit))) for a in [i*2*math.pi/n for i in range(n)]]
def star(r0, r1, n, z=0.0, c='flash', **k):
    pts = []
    for i in range(n*2):
        a = i*math.pi/n; r = r1 if i % 2 == 0 else r0
        pts.append((math.cos(a)*r, math.sin(a)*r, z))
    return flat(pts, c, (0, 0, 1), **k)
def lump(x, y, z, r, c, n=6, h=0.7, rot=0):
    return loft([[x, y - r*0.4, z, r*0.7, r*0.7], [x, y, z, r, r], [x, y + r*h*0.6, z, r*0.6, r*0.6], [x, y + r*h, z, 0, 0]], c, n=n, rot=rot, caps=[True, False])

# ================= effects =================
fx('muzzle_flash', [star(0.03, 0.09, 5, 0, 'flash', **G), tip([0, 0, 0], [0, 0, 0.22], 0.05, 0.05, 'flash', ax='z', n=5, **G), tip([0, 0, 0], [0, 0, 0.12], 0.025, 0.025, 'flashCore', ax='z', n=5, **G)],
   'At the muzzle, +Z along the barrel. Show 1-2 frames, random roll about Z, scale 0.8-1.3. Adds a short warm point light.')
fx('tracer', [loft([[0, 0, -0.6, 0.006, 0.006], [0, 0, 0.6, 0.006, 0.006]], 'tracer', ax='z', n=4, **G)], 'A 1.2 m streak along +Z; stretch along Z with speed, fade over 0.1 s.')
fx('hit_spark', [tip([0, 0, 0], [math.cos(a)*0.12, 0.05 + 0.06*(i % 2), math.sin(a)*0.12], 0.008, 0.008, 'spark', **G) for i, a in enumerate((0.3, 1.6, 2.9, 4.4))],
   'Where a metal hit lands, +Y along the surface normal. Scale 0.6-1.0, fade over 0.15 s.')
fx('dust_puff', [lump(0, 0.06, 0, 0.12, 'dust'), lump(0.14, 0.04, 0.05, 0.08, 'dustD', rot=20), lump(-0.12, 0.04, -0.04, 0.09, 'dust', rot=40)],
   'Landing and heavy steps. Grow from 0.5 to 1.4 and fade over 0.6 s; rises 0.1 m.')
fx('step_dust', [lump(0, 0.03, 0, 0.06, 'dust'), lump(0.07, 0.02, 0.02, 0.04, 'dustD', rot=30)], 'A footstep on dry ground. Grow 0.6 to 1.2, fade over 0.4 s.')
fx('step_snow', [lump(0, 0.03, 0, 0.06, 'snow'), lump(-0.07, 0.02, 0.02, 0.045, 'snow', rot=30)], 'A footstep in snow. Grow 0.6 to 1.2, fade over 0.5 s.')
fx('step_splash', [tip([0, 0, 0], [math.cos(a)*0.08, 0.12, math.sin(a)*0.08], 0.012, 0.012, 'splash') for a in [i*2*math.pi/6 for i in range(6)]],
   'A footstep in a puddle or shallow water. Rise and fall over 0.3 s.')
fx('water_splash', [tip([math.cos(a)*0.15, 0, math.sin(a)*0.15], [math.cos(a)*0.3, 0.4 + 0.15*(i % 2), math.sin(a)*0.3], 0.03, 0.02, 'splashL' if i % 2 else 'splash') for i, a in enumerate([i*2*math.pi/8 for i in range(8)])]
   + [lump(0, 0.05, 0, 0.12, 'splash', h=1.4)], 'Something falling in water. Scale with its size; rise 0.2 s, fall 0.3 s.')
fx('ripple', [flat(ring_pts(0.5, 12, 0.01), 'splashL', (0, 1, 0)), flat(ring_pts(0.42, 12, 0.012), 'splash', (0, 1, 0))],
   'A ring on the water surface (the inner disc hides the middle). Grow from 0.2 to 2 and fade over 1.2 s; rain makes many small ones.')
def flame(h, w, seed=0):
    R = random.Random(seed)
    return [tip([0, 0, 0], [R.uniform(-0.03, 0.03)*h, h, 0], w, w, 'flame', n=5, **G), tip([0, 0, 0], [0, h*0.6, 0.01], w*0.55, w*0.55, 'flameCore', n=5, **G),
            tip([w*0.5, 0, w*0.2], [w*0.6, h*0.55, w*0.25], w*0.4, w*0.4, 'flameRed', n=4, **G)]
fx('flame_small', flame(0.25, 0.08), 'A candle-sized flame (lantern, match). Flicker: scale Y 0.85-1.15 at random each 0.1 s.')
fx('flame_medium', flame(0.6, 0.2, 1), 'A campfire flame. Flicker: scale Y 0.8-1.2, sway the tip 5 degrees.')
fx('flame_large', flame(1.6, 0.6, 2) + [tip([-0.5, 0, -0.2], [-0.55, 1.1, -0.25], 0.3, 0.3, 'flame', n=5, **G)], 'A burning car or building. Flicker as medium; add smoke_column above.')
fx('smoke_column', [lump(0, 0.3, 0, 0.35, 'smoke', h=1.0), lump(0.15, 1.1, 0.1, 0.5, 'smokeL', h=1.0, rot=20), lump(-0.1, 2.1, -0.1, 0.7, 'smoke', h=1.0, rot=40), lump(0.2, 3.3, 0.0, 0.9, 'smokeL', h=1.0, rot=60)],
   'Rising smoke, 4 m. Scroll upward and loop; scale 1-6 for a building fire; fade the top two pieces.')
fx('explosion_core', [lump(0, 0.0, 0, 0.6, 'fireball', h=1.4), lump(0, 0.2, 0, 0.35, 'flameCore', h=1.4)], 'The fireball. Grow 0.3 to 2.5 over 0.25 s, then darken to smoke and fade over 1 s. Glow.')
fx('explosion_ring', [flat(ring_pts(1.0, 10, 0.02, 0.15, 3), 'blast', (0, 1, 0)), flat(ring_pts(0.85, 10, 0.03, 0.1, 4), 'dust', (0, 1, 0))], 'The shockwave on the ground. Grow 0.5 to 6 over 0.4 s, fade.')
fx('explosion_debris', [hull([(x - 0.06, 0, z - 0.05), (x + 0.06, 0, z - 0.05), (x + 0.06, 0, z + 0.05), (x - 0.06, 0, z + 0.05), (x - 0.03, 0.08, z - 0.02), (x + 0.04, 0.09, z), (x + 0.02, 0.07, z + 0.03), (x - 0.04, 0.06, z + 0.02)], 'debris' if i % 2 else 'debrisL')
                        for i, (x, z) in enumerate(((0, 0), (0.3, 0.1), (-0.25, 0.2), (0.1, -0.3)))], 'Chunks thrown out: give each piece its own velocity and spin, then leave them as rubble.')
fx('flare_glow', [star(0.04, 0.16, 6, 0, 'flare', **G), star(0.02, 0.07, 6, 0.001, 'flareCore', **G)], 'Billboard at a lit flare. Pulse 0.9-1.1, with a red point light; burns 60 s.')
fx('goo_splat', [flat(ring_pts(0.4, 9, 0.008, 0.35, 5), 'goo', (0, 1, 0)), flat(ring_pts(0.16, 7, 0.01, 0.3, 6), 'gooL', (0, 1, 0))], 'Alien goo where a spit lands or an alien is hit. Stays 60 s, then fades.')
fx('glass_shards', [flat([(x, 0.005, z), (x + 0.06, 0.005, z + 0.01), (x + 0.02, 0.005, z + 0.07)], 'glass', (0, 1, 0)) for x, z in ((0, 0), (0.15, 0.05), (-0.12, 0.1), (0.05, -0.15), (-0.1, -0.08), (0.2, -0.1))],
   'Broken window glass on the floor (also thrown out as small spinning pieces). Stays; walking on it is loud.')
fx('wood_chips', [box([x, 0.01, z], [0.04, 0.012, 0.015], 'chip' if i % 2 else 'chipD') for i, (x, z) in enumerate(((0, 0), (0.08, 0.05), (-0.07, 0.06), (0.03, -0.08), (-0.05, -0.05)))],
   'Splinters from a wood hit or a broken barricade: thrown and spinning, then left on the ground.')

# ================= sky =================
def moon(phase):
    """phase 0 new to 4 full to 7 waning crescent; a disc with the dark part as a second polygon in front"""
    disc = [(math.cos(a), math.sin(a), 0) for a in [i*2*math.pi/16 for i in range(16)]]
    o = [flat(disc, 'moon', (0, 0, 1), **G)]
    k = math.cos(phase*math.pi/4)          # 1 new, 0 half, -1 full
    if k > -0.98:
        side = 1 if phase < 4 else -1      # waxing: lit on the right; the dark part is on the left
        angs = [i*math.pi/8 - math.pi/2 for i in range(9)]
        outer = [(-side*abs(math.cos(a))*1.002, math.sin(a)*1.002, 0.03) for a in angs]
        inner = [(side*k*abs(math.cos(a)), math.sin(a)*1.002, 0.03) for a in angs]
        for i in range(8):   # strips between the limb and the terminator, so a crescent of shadow stays a crescent
            q = [outer[i], outer[i + 1], inner[i + 1], inner[i]]
            q = [p for j, p in enumerate(q) if j == 0 or abs(p[0] - q[j - 1][0]) + abs(p[1] - q[j - 1][1]) > 1e-6]
            if len(q) >= 3: o.append(flat(q, 'moonDark', (0, 0, 1)))
    return o
for p in range(8): fx('moon_%d' % p, moon(p), 'Moon phase %d of 8 (0 new, 4 full). Unit radius: scale to about 3 degrees of sky. Billboard.' % p, 'sky')
def cloud(kind, seed):
    R = random.Random(seed); o = []
    if kind == 'fair':
        for i in range(6): o.append(lump(R.uniform(-1.2, 1.2), 0, R.uniform(-0.5, 0.5), R.uniform(0.4, 0.8), 'cloud' if i % 2 else 'cloudD', h=0.9, rot=R.uniform(0, 60)))
    elif kind == 'overcast':
        o.append(hull([(-3, 0, -2), (3, 0, -2), (3, 0, 2), (-3, 0, 2), (-2.6, 0.5, -1.7), (2.7, 0.6, -1.6), (2.5, 0.5, 1.8), (-2.8, 0.55, 1.7)], 'overcast'))
        for i in range(5): o.append(lump(R.uniform(-2.4, 2.4), 0.3, R.uniform(-1.4, 1.4), R.uniform(0.6, 1.0), 'overcastD', h=0.6, rot=R.uniform(0, 60)))
    else:
        o.append(frustum([[0, 0, 0, 1.6, 1.4], [0, 3.0, 0, 1.0, 0.9], [0, 4.0, 0, 2.6, 1.8], [0, 4.4, 0, 2.4, 1.6]], 'storm'))
        for i in range(4): o.append(lump(R.uniform(-1.4, 1.4), R.uniform(0.2, 2.5), R.uniform(-0.8, 0.8), R.uniform(0.7, 1.1), 'stormD', h=0.8, rot=R.uniform(0, 60)))
    return o
fx('cloud_fair', cloud('fair', 1), 'A fair-weather cloud, about 3 m at unit scale: scale 20-40, drift slowly.', 'sky')
fx('cloud_overcast', cloud('overcast', 2), 'An overcast sheet, 6 m at unit scale: scale 40-80; many side by side make a lid of cloud.', 'sky')
fx('cloud_storm', cloud('storm', 3), 'A thunderhead with an anvil top, 4.4 m tall: scale 60-120 on the horizon.', 'sky')
fx('rain_streak', [flat([(-0.004, 0, 0), (0.004, 0, 0), (0.004, 0.5, 0), (-0.004, 0.5, 0)], 'rain', (0, 0, 1)), flat([(0, 0, -0.004), (0, 0, 0.004), (0, 0.5, 0.004), (0, 0.5, -0.004)], 'rain', (1, 0, 0))],
   'One raindrop streak, 0.5 m, two crossed planes. Fall 12 m/s, tilt with the wind.', 'sky')
fx('snow_flake', [star(0.006, 0.02, 6, 0, 'snow')], 'A snowflake billboard. Fall 1 m/s with a slow side-to-side drift.', 'sky')
bolt = [(0, 10, 0), (0.6, 7.5, 0), (-0.2, 6.8, 0), (0.8, 4.0, 0), (0.1, 3.4, 0), (0.6, 0, 0)]
fx('lightning', [flat([(x - 0.08, y, 0), (x + 0.08, y, 0), (bolt[i + 1][0] + 0.08, bolt[i + 1][1], 0), (bolt[i + 1][0] - 0.08, bolt[i + 1][1], 0)], 'bolt', (0, 0, 1), **G) for i, (x, y, z) in enumerate(bolt[:-1])]
   + [flat([(0.8, 4.0, 0), (1.4, 2.8, 0), (1.3, 2.7, 0), (0.7, 3.9, 0)], 'bolt', (0, 0, 1), **G)], 'A 10 m bolt at unit scale: scale 30-80, show 2-4 frames with the screen flash.', 'sky')
aur = []
for j, (c, z) in enumerate((('aurora1', 0.0), ('aurora2', 0.6), ('aurora1', 1.2))):
    xs = [i*1.0 - 4 for i in range(9)]
    for i in range(8):
        y0 = 0.4*math.sin(i*0.9 + j); y1 = 0.4*math.sin((i + 1)*0.9 + j)
        aur.append(flat([(xs[i] + 0.3*j, 2 + y0 + 0.4*j, z), (xs[i + 1] + 0.3*j, 2 + y1 + 0.4*j, z), (xs[i + 1] + 0.3*j, 3.6 + y1*3 + 0.6*((i + j) % 3), z), (xs[i] + 0.3*j, 3.6 + y0*3 + 0.6*((i + j + 2) % 3), z)], c, (0, 0, 1), **G))
fx('aurora', aur, 'Faint curtains for the final-night event, 8 m wide at unit scale: scale 50-100 low on the north sky, sway slowly, draw at 30-50% strength.', 'sky')

pack = {'name': 'fx', 'version': 1, 'style': 'flat planes and points, glowing where they give light', 'units': 'metres', 'palette': PALETTE,
        'about': __doc__.split('\n', 2)[2], 'flatModels': True, 'models': M, 'notes': NOTES}
out, st = write_pack('fx', pack, __file__)
for k, v in st.items(): print(k, v)
