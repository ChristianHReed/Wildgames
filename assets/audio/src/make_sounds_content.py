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
# ---- footsteps: one clip is one step, 0.12 to 0.25 s ----
def st_grass(i):
    d = 0.22; return mix(lp(noise(d), jit(700, 1100))*env(d, 0.012, 0.05), bp(noise(d), 2500, 7000)*env(d, 0.02, 0.04)*0.25, thud(jit(80, 100), 50, d, 0.04)*0.35)
def st_road(i):
    d = 0.16; return mix(thud(jit(130, 160), 70, d, 0.025)*0.7, bp(noise(d), 800, 4500)*env(d, 0.001, 0.02)*0.7, hp(noise(d), 4500)*env(d, 0.001, 0.008)*0.25)
def st_wood(i):
    d = 0.22; return mix(thud(jit(120, 150), 70, d, 0.045)*0.8, modal([jit(190, 240), jit(360, 440), jit(650, 780)], [0.07, 0.05, 0.03], d, [0.6, 0.4, 0.25]), bp(noise(d), 300, 2200)*env(d, 0.001, 0.02)*0.45)
def st_tile(i):
    d = 0.2; return mix(bp(noise(d), 1500, 6500)*env(d, 0.0008, 0.012)*0.8, modal([jit(1900, 2300), jit(3100, 3600)], [0.04, 0.025], d, [0.4, 0.25]), thud(jit(160, 190), 90, d, 0.02)*0.45)
def st_carpet(i):
    d = 0.2; return mix(lp(noise(d), jit(450, 650))*env(d, 0.015, 0.04), thud(jit(70, 90), 45, d, 0.035)*0.5)
def st_water(i):
    d = 0.35; sp = mix(*[at(bp(noise(0.05), jit(900, 2200), jit(2600, 4200))*env(0.05, 0.002, 0.015)*jit(0.25, 0.7), jit(0.0, 0.2), d) for _ in range(9)])
    return mix(lp(noise(d), 1400)*env(d, 0.015, 0.09)*0.6, sp, thud(jit(110, 140), 60, d, 0.05)*0.4)
for k, f in (('grass', st_grass), ('road', st_road), ('wood', st_wood), ('tile', st_tile), ('carpet', st_carpet), ('water', st_water)): add('step_' + k, *var(f, 4))
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
if __name__ == '__main__':
    out = {k: [mp3(v) for v in vs] for k, vs in S.items()}
    P = os.path.join(OUT, 'sounds_content.js')
    open(P, 'w').write('/* Afterstreet content sounds made in code: assets/audio/src/make_sounds_content.py, do not edit by hand. Adds to window.ART.sounds. */\n'
        '(function(){ var A = (window.ART = window.ART || {}); A.sounds = A.sounds || {}; var S = ' + json.dumps(out, separators=(',', ':')) + '; for (var k in S) A.sounds[k] = S[k]; })();\n')
    print(len(out), 'keys', round(os.path.getsize(P)/1e6, 2), 'MB'); print({k: [round(len(v)/SR, 2) for v in vs] for k, vs in S.items()})
