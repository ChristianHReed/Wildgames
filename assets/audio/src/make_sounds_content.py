#!/usr/bin/env python3
"""Afterstreet sounds, content request 25 October 2026 (replaces Kenney Impact Sounds and RPG Audio): footsteps by surface, impacts, glass, doors,
cloth and metal. Made in code, nothing to license. Writes assets/audio/sounds_content.js (adds to window.ART.sounds, same form as sounds_design.js).
Run: python3 assets/audio/src/make_sounds_content.py   (needs numpy, scipy and ffmpeg)"""
import os, json
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'make_audio.py')).read()
exec(compile(src[:src.index('# ---------------- sound effects ----------------')], 'blocks', 'exec'))
exec(compile(src[src.index('def mp3(x, kbps=40):'):src.index("if __name__ == '__main__':")], 'mp3', 'exec'))
RNG = np.random.default_rng(20261025)
S = {}
def trim(x, db=-48):
    a = np.abs(x); th = a.max()*10**(db/20); idx = np.nonzero(a > th)[0]
    return x[:min(len(x), idx[-1] + int(0.03*SR))] if len(idx) else x
def add(name, *xs): S[name] = [fade(trim(norm(x, 0.8)), 0.002, 0.02) for x in xs]
def var(f, n=4): return [f(i) for i in range(n)]
def jit(a, b): return float(RNG.uniform(a, b))
# ---- footsteps: see round 4 below (rewritten 26 October 2026 after the first set sounded like knocking on a door) ----
# ---- impacts ----
def fist(i):
    d = 0.2; return mix(thud(jit(110, 140), 55, d, 0.05)*1.1, lp(noise(d), 1800)*env(d, 0.001, 0.025)*0.7, bp(noise(d), 200, 700)*env(d, 0.001, 0.03)*0.4)
def bat(i):
    d = 0.35; return mix(thud(jit(150, 190), 80, d, 0.07), modal([jit(300, 360), jit(620, 700), jit(1000, 1150)], [0.09, 0.05, 0.03], d, [0.7, 0.5, 0.3]), bp(noise(d), 500, 3000)*env(d, 0.0008, 0.02)*0.7)
def blade(i):
    d = 0.3; slice_ = sweep_bp(noise(d), jit(3500, 4500), jit(1400, 2000), 2.5)*env(d, 0.002, 0.09)
    return mix(slice_*0.9, thud(jit(130, 170), 80, d, 0.04)*0.5, modal([jit(2800, 3300)], [0.05], d, [0.2]), lp(noise(d), 900)*env(d, 0.003, 0.05)*0.35)
add('hit_fist', *var(fist, 3)); add('hit_bat', *var(bat, 3)); add('hit_blade', *var(blade, 3))
# ---- glass, doors, cloth, metal ----
def smash(i):
    d = jit(0.9, 1.2)
    return mix(hp(noise(d), 2500)*env(d, 0.0005, 0.07), *[at(modal([jit(2200, 7500)], [0.05], 0.12, [1])*jit(0.2, 0.7), jit(0, d*0.75)**1.4, d) for _ in range(40)], thud(170, 90, d, 0.04)*0.4)
add('glass_smash', *var(smash, 3))
def door(kind, i):
    if kind == 'open':
        d = 0.5; return mix(thud(jit(110, 130), 80, d, 0.04)*0.4, lp(noise(d), 700)*env(d, 0.03, 0.12)*0.3, modal([jit(90, 110)], [0.15], d, [0.4]), at(bp(noise(0.05), 1000, 4000)*env(0.05, 0.001, 0.01), 0.0, d)*0.7)
    if kind == 'close':
        d = 0.6; return mix(thud(jit(90, 110), 55, d, 0.07)*1.0, modal([jit(150, 180), jit(300, 360), jit(520, 600)], [0.14, 0.09, 0.05], d, [0.6, 0.35, 0.2]), lp(noise(d), 1500)*env(d, 0.001, 0.04)*0.6, at(bp(noise(0.04), 1500, 5000)*env(0.04, 0.0005, 0.008)*0.6, 0.06, d))
    d = jit(1.1, 1.4)
    return mix(thud(75, 40, d, 0.1)*1.3, hp(noise(d), 1500)*env(d, 0.001, 0.05)*0.6, *[at(bp(noise(0.12), jit(300, 3000), jit(3500, 7000))*env(0.12, 0.001, 0.03)*jit(0.3, 0.8), jit(0.03, 0.7)**1.5, d) for _ in range(14)], modal([jit(110, 140), jit(240, 290), jit(420, 500)], [0.3, 0.2, 0.1], d, [0.6, 0.4, 0.3]), lp(noise(d), 600)*env(d, 0.002, 0.2)*0.4)
add('door_open', *var(lambda i: door('open', i), 3)); add('door_close', *var(lambda i: door('close', i), 3)); add('door_smash', *var(lambda i: door('smash', i), 3))
def cloth(i):
    d = jit(0.25, 0.4); am = 0.5 + 0.5*np.sin(2*np.pi*jit(7, 14)*t_(d) + jit(0, 6)); return bp(noise(d), 1500, 7000)*env(d, 0.04, 0.09)*(0.4 + 0.6*am) + lp(noise(d), 500)*env(d, 0.05, 0.07)*0.2
add('cloth_rustle', *var(cloth, 4))
def clang(i):
    d = 0.7; f = jit(520, 640); return mix(modal([f, f*2.71, f*5.1, f*7.9], [0.35, 0.22, 0.14, 0.08], d, [0.7, 0.55, 0.35, 0.2]), hp(noise(d), 2200)*env(d, 0.0008, 0.02)*0.8, thud(jit(200, 260), 120, d, 0.02)*0.3)
add('metal_clang', *var(clang, 3))
# ---- round 2 (26 October 2026): the nine the game still makes itself ----
def snow(i):
    d = 0.3; crunch = (RNG.random(int(d*SR)) > 0.992)*RNG.standard_normal(int(d*SR))
    return mix(lp(noise(d), 1300)*env(d, 0.03, 0.07)*0.55, hp(lp(crunch, 7000), 1800)*env(d, 0.004, 0.11)*2.2, thud(jit(70, 90), 45, d, 0.04)*0.35)
add('step_snow', *var(snow, 4))
def hurt(i):
    d = 0.35; return mix(thud(jit(55, 70), 35, d, 0.1)*1.1, lp(noise(d), 700)*env(d, 0.002, 0.07)*0.8, bp(noise(d), 150, 500)*env(d, 0.004, 0.05)*0.4)
add('hurt_body', *var(hurt, 3))
def plank(i):
    d = 0.35; f = jit(220, 370); return mix(modal([f, f*1.9, f*3.1], [0.07, 0.04, 0.025], d, [0.7, 0.4, 0.2]), bp(noise(d), 800, 3500)*env(d, 0.001, 0.025)*0.7, thud(jit(110, 140), 70, d, 0.03)*0.4)
add('plank_knock', *var(plank, 3))
def stone(i):
    d = 0.25; return mix(hp(noise(d), 1500)*env(d, 0.0005, 0.02)*1.2, modal([jit(900, 1500)], [0.025], d, [0.4]), thud(jit(130, 160), 80, d, 0.02)*0.5)
add('stone_clack', *var(stone, 3))
def tin(i):
    d = 0.45; f = jit(900, 1500); return mix(modal([f*m for m in (1, 2.4, 4.1, 6.7)], [0.12, 0.08, 0.05, 0.03], d, [0.7, 0.45, 0.3, 0.2]), hp(noise(d), 4000)*env(d, 0.0005, 0.008))
add('tin_ping', *var(tin, 2))
def creak(i):
    d = jit(0.7, 1.2); t = t_(d); f0, f1 = jit(120, 180), jit(200, 340); w = jit(4, 9)
    f = f0 + (f1 - f0)*np.linspace(0, 1, len(t))**0.8 + 10*np.sin(2*np.pi*w*t + jit(0, 6)); ph = 2*np.pi*np.cumsum(f)/SR
    s = np.sign(np.sin(ph))*0.5 + np.sin(ph)*0.5 + 0.3*np.sin(2.01*ph)
    return bp(s + 0.4*noise(d), 200, 1800)*np.sin(np.pi*np.linspace(0, 1, len(t)))**0.7
add('creak_wood', *var(creak, 3))
def latch(i):
    def c(f): return mix(hp(noise(0.03), 1800)*env(0.03, 0.0003, 0.006), modal([f], [0.012], 0.06, [0.6]))
    d = 0.22; return mix(at(c(jit(2200, 2600)), 0, d), at(c(jit(1500, 1800)), jit(0.08, 0.13), d))
add('latch_click', *var(latch, 2))
def pick(i):
    d = 0.22; return mix(bp(noise(d), 300, 2200)*env(d, 0.01, 0.05)*0.8, thud(jit(85, 100), 50, d, 0.03)*0.4)
add('pick_up_item', *var(pick, 3))
def swing(i):
    d = jit(0.3, 0.4); n = noise(d); t = np.linspace(0, 1, len(n)); fc = 700 + 2500*np.sin(np.pi*t)
    return lp_var(hp(n, 400), fc, 256)*np.sin(np.pi*t)**1.5
add('swing_air', *var(swing, 3))
# ---- round 3 (26 October 2026): digging, by hand and by machine ----
def grains(d, n, f0, f1, amp=1.0, spread=1.0):
    """n tiny gritty ticks scattered over d seconds: a scatter of soil, sand or gravel"""
    return mix(*[at(bp(noise(0.03), jit(f0, f1), jit(f1, f1*1.6))*env(0.03, 0.0004, 0.01)*jit(0.2, 1.0)*amp, jit(0.0, d*spread), d) for _ in range(n)])
def dig_soil(i):
    d = 0.45; return mix(thud(jit(70, 95), 45, d, 0.07)*0.7, lp(noise(d), 900)*env(d, 0.01, 0.14)*0.75, grains(d, 24, 1500, 3500, 0.4, 0.8))
add('dig_soil', *var(dig_soil, 4))
def dig_gravel(i):
    d = 0.55; return mix(grains(d, 60, 2000, 5200, 0.55, 0.9), lp(noise(d), 1800)*env(d, 0.02, 0.2)*0.4, thud(jit(90, 120), 55, d, 0.04)*0.35)
add('dig_gravel', *var(dig_gravel, 3))
def dig_stone(i):
    d = 0.4; f = jit(1800, 2600); return mix(modal([f, f*1.52, f*2.3], [0.04, 0.03, 0.02], d, [0.55, 0.35, 0.2]), hp(noise(d), 2500)*env(d, 0.0004, 0.03)*0.9, grains(d, 14, 3000, 6000, 0.4, 0.5), thud(jit(110, 150), 70, d, 0.03)*0.45)
add('dig_stone', *var(dig_stone, 3))
def fill_soil(i):
    d = 0.6; return mix(thud(jit(60, 80), 38, d, 0.12)*0.8, lp(noise(d), 600)*env(d, 0.02, 0.25)*0.65, grains(d, 36, 1200, 3200, 0.35, 0.9))
add('fill_soil', *var(fill_soil, 3))
def soil_toss(i):
    d = 0.5; n = noise(d); t = np.linspace(0, 1, len(n)); sw = lp_var(hp(n, 500), 900 + 1800*np.sin(np.pi*t), 256)*np.sin(np.pi*np.minimum(1, t*2))**1.2*0.35
    return mix(sw, at(grains(0.3, 28, 1400, 3600, 0.4, 1.0), 0.2, d))
add('soil_toss', *var(soil_toss, 3))
def bucket_scoop(i):
    d = jit(0.9, 1.1); n = noise(d); t = np.linspace(0, 1, len(n)); gr = lp_var(hp(n, 250), 500 + 1500*np.sin(np.pi*t), 256)*np.sin(np.pi*np.minimum(1, t*3))**1.2*0.8
    return mix(gr, thud(jit(45, 60), 30, d, 0.15)*0.9, grains(d, 50, 1000, 3200, 0.35, 0.95), modal([jit(160, 210)], [0.3], d, [0.25]))
add('bucket_scoop', *var(bucket_scoop, 3))
def bucket_dump(i):
    d = jit(1.1, 1.4); return mix(lp(noise(d), 700)*env(d, 0.05, 0.5)*0.8, grains(d, 80, 900, 3000, 0.4, 0.85), thud(jit(40, 55), 28, d, 0.2)*0.9, at(thud(jit(70, 90), 40, 0.4, 0.06)*0.6, 0.35, d))
add('bucket_dump', *var(bucket_dump, 3))
def hydraulic(i):
    d = 1.0; t = t_(d); f = 130 + 70*np.sin(np.pi*np.linspace(0, 1, len(t))); ph = 2*np.pi*np.cumsum(f)/SR
    return (0.5*np.sin(ph) + 0.25*np.sin(2*ph) + 0.1*np.sin(3.03*ph))*np.sin(np.pi*np.linspace(0, 1, len(t)))**0.6*0.7 + bp(noise(d), 600, 2200)*0.08
add('hydraulic_whine', *var(hydraulic, 2))
def rubble_drop(i):
    d = jit(1.0, 1.3); return mix(thud(jit(45, 65), 28, d, 0.18)*1.0, hp(noise(d), 1200)*env(d, 0.001, 0.25)*0.5, *[at(modal([jit(500, 1600)], [0.04], 0.15, [0.4]) , jit(0.02, 0.6), d) for _ in range(8)], grains(d, 40, 1500, 5000, 0.5, 0.8))
add('rubble_drop', *var(rubble_drop, 3))
def blade_push(i):
    d = jit(1.3, 1.6); n = noise(d); t = np.linspace(0, 1, len(n)); return mix(lp(n, 500)*env(d, 0.15, 0.4)*0.9, grains(d, 70, 900, 2800, 0.4, 0.95), thud(jit(40, 55), 28, d, 0.3)*0.5)
add('blade_push', *var(blade_push, 2))
# ---- round 4 (26 October 2026): footsteps rebuilt. The first set used a falling sine (a "thud") plus ringing partials, which is what a knock on a door is.
# A real step has no pitch. It is a foot landing in two parts (heel, then the ball of the foot and toes, 60 to 90 ms later when walking, 35 to 50 ms running),
# a soft burst of filtered noise each, with a grain texture that belongs to the ground, a little cloth and gear movement, and a very short room. Every step
# draws new random values, and the four-to-eight variations are all different lengths, so the ear never hears one clip twice in a row. ----
def _tex(kind, d):
    """the ground's own texture, a scatter of tiny ticks"""
    if kind == 'road': return grains(d, 14, 3000, 7500, 0.5, 0.25)
    if kind == 'grass': return grains(d, 10, 1800, 4200, 0.35, 0.8)
    if kind == 'wood': return grains(d, 5, 1500, 3500, 0.2, 0.3)
    if kind == 'tile': return grains(d, 4, 4000, 8000, 0.3, 0.12)
    if kind == 'carpet': return grains(d, 6, 1200, 2800, 0.12, 0.4)
    return np.zeros(int(d*SR))
GROUND = {  # heel cut-off Hz, heel decay s, toe cut-off, toe decay, floor boom (Hz, 0 = none, boom level), room echo level, brightness of grit
    'road':   dict(hl=2600, hd=0.020, tl=3600, td=0.018, boom=(110, 0.35), echo=0.10, tex=1.0),
    'grass':  dict(hl=1100, hd=0.045, tl=2400, td=0.060, boom=(90, 0.25), echo=0.0, tex=0.9),
    'wood':   dict(hl=1500, hd=0.030, tl=2200, td=0.024, boom=(170, 0.85), echo=0.12, tex=0.6),
    'tile':   dict(hl=5200, hd=0.012, tl=6200, td=0.010, boom=(130, 0.18), echo=0.38, tex=1.0),
    'carpet': dict(hl=520, hd=0.034, tl=760, td=0.040, boom=(80, 0.18), echo=0.0, tex=0.5)}
def footstep(kind, run=False, i=0):
    g = GROUND[kind]; d = 0.34 if not run else 0.26
    gap = jit(0.040, 0.055) if run else jit(0.066, 0.090)       # heel to toe
    lv = 1.0 if run else jit(0.75, 0.95)                          # a run lands harder
    def burst(cut, dec, amp, dur=0.14, att=0.0015):
        n = noise(dur); n = lp(n, cut*jit(0.85, 1.15), 2) + 0.35*lp(n, cut*0.35, 1)   # body under the bite, no pitch
        return hp(n, 80)*env(dur, att, dec*jit(0.8, 1.25))*amp
    heel = burst(g['hl']*(1.25 if run else 1.0), g['hd'], 1.0*lv)
    toe = burst(g['tl'], g['td'], jit(0.45, 0.65)*lv*(1.1 if run else 1.0))
    # weight: low noise, not a sine, so it pushes without ringing
    weight = lp(noise(0.09), 200 if kind != 'wood' else 320, 2)*env(0.09, 0.003, 0.028)*(0.5 if run else 0.35)*lv
    parts = [at(heel, 0, d), at(toe, gap, d), at(weight, 0.002, d)]
    fb, fl = g['boom']
    if fl > 0:    # floors that ring a little under the foot: a broad band of noise, dying fast, never a note
        hollow = bp(noise(0.16), fb*jit(0.8, 1.25), fb*jit(1.8, 2.6), 2)*env(0.16, 0.004, 0.05 if kind == 'wood' else 0.03)*fl*lv
        parts.append(at(hollow, 0.001, d))
    tex = _tex(kind, 0.09)*g['tex']*lv; parts += [at(tex, 0.0, d), at(tex*0.6, gap, d)]
    # cloth and gear: a slow rustle that swells just after the heel, and a rare small clink
    cl = bp(noise(0.22), 500, 3200, 2)*(np.sin(np.pi*np.linspace(0, 1, int(0.22*SR)))**2)*(0.06 if kind != 'tile' else 0.04)
    parts.append(at(cl, jit(0.0, 0.03), d))
    if RNG.random() < 0.25: parts.append(at(modal([jit(3200, 5200)], [0.02], 0.08, [1])*0.04, jit(0.02, 0.16), d))
    x = mix(*parts, d=d)
    if g['echo']:   # a short room: two faint early reflections
        for dl, a in ((jit(0.011, 0.016), 0.55), (jit(0.024, 0.034), 0.3)):
            x = x + np.concatenate([np.zeros(int(dl*SR)), lp(x, 3500, 1)[:len(x) - int(dl*SR)]])*g['echo']*a
    return x
for k in GROUND:
    add('step_' + k, *[footstep(k, False, i) for i in range(6)])
    add('step_%s_run' % k, *[footstep(k, True, i) for i in range(6)])
def step_wet(run=False):
    d = 0.4; gap = jit(0.04, 0.07)
    sp = mix(*[at(bp(noise(0.06), jit(700, 2400), jit(2800, 4500))*env(0.06, 0.002, 0.02)*jit(0.25, 0.8), jit(0.0, 0.2), d) for _ in range(12)], d=d)
    return mix(at(lp(noise(0.2), 1500, 2)*env(0.2, 0.01, 0.07)*0.7, 0, d), at(lp(noise(0.2), 900, 2)*env(0.2, 0.012, 0.08)*0.45, gap, d), sp*(1.0 if run else 0.8), lp(noise(0.1), 220, 2)*env(0.1, 0.004, 0.03)*0.35)
add('step_water', *[step_wet(False) for _ in range(5)]); add('step_water_run', *[step_wet(True) for _ in range(5)])
def step_loose(run=False):   # gravel, dry leaves, broken ground: a scatter that gets crunched, then pushed aside
    d = 0.4; gap = jit(0.05, 0.08)
    a = grains(0.12, 26, 1800, 6000, 0.8, 1.0); b = grains(0.12, 18, 1500, 5000, 0.6, 1.0)
    return mix(at(a, 0, d), at(b, gap, d), at(lp(noise(0.16), 900, 2)*env(0.16, 0.003, 0.04)*0.55, 0, d), at(lp(noise(0.1), 200, 2)*env(0.1, 0.003, 0.03)*0.35, 0.002, d), d=d)
add('step_gravel', *[step_loose() for _ in range(6)]); add('step_gravel_run', *[step_loose(True) for _ in range(6)])
if __name__ == '__main__':
    out = {k: [mp3(v) for v in vs] for k, vs in S.items()}
    P = os.path.join(OUT, 'sounds_content.js')
    open(P, 'w').write('/* Afterstreet content sounds made in code: assets/audio/src/make_sounds_content.py, do not edit by hand. Adds to window.ART.sounds. */\n'
        '(function(){ var A = (window.ART = window.ART || {}); A.sounds = A.sounds || {}; var S = ' + json.dumps(out, separators=(',', ':')) + '; for (var k in S) A.sounds[k] = S[k]; })();\n')
    print(len(out), 'keys', round(os.path.getsize(P)/1e6, 2), 'MB'); print({k: [round(len(v)/SR, 2) for v in vs] for k, vs in S.items()})
