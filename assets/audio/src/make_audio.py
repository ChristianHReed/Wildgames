#!/usr/bin/env python3
"""Afterstreet sound effects and music, made entirely in code (no samples, nothing to license): art requests sections 9, 10.6
and 11.11 (20 October 2026). Writes, in the same form as the game's assets/sounds.js (small mono MP3s stored as text, so they
load from a drive with no web server):
  assets/audio/sounds_design.js   window.ART.sounds gets new keys (each a list of 1 to 4 variations)
  assets/audio/music_<name>.js     window.ART.music[name] = one seamless loop (day, night, horde, base) or a one-shot (chase)
  assets/audio/preview.html        plays everything
Run: python3 assets/audio/src/make_audio.py   (needs numpy, scipy and ffmpeg)"""
import os, json, base64, subprocess, tempfile, math
import numpy as np
from scipy import signal

SR = 22050
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, '..')
RNG = np.random.default_rng(20261020)

# ---------------- building blocks ----------------
def t_(d): return np.arange(int(d*SR))/SR
def noise(d): return RNG.uniform(-1, 1, int(d*SR))
def env(d, a=0.005, decay=0.2, hold=0.0):
    t = t_(d); e = np.where(t < a, t/max(a, 1e-6), np.exp(-(t - a - hold).clip(0)/max(decay, 1e-6)))
    return e
def adsr(d, a, dcy, s, r):
    t = t_(d); n = len(t); e = np.ones(n)*s
    ia, idc, ir = int(a*SR), int(dcy*SR), int(r*SR)
    ia = min(ia, n); e[:ia] = np.linspace(0, 1, ia)
    e[ia:ia + idc] = np.linspace(1, s, len(e[ia:ia + idc]))
    ir = min(ir, n)
    if ir: e[n - ir:] *= np.linspace(1, 0, ir)
    return e
def bp(x, lo, hi, order=2): b, a = signal.butter(order, [lo/(SR/2), min(hi/(SR/2), 0.99)], 'band'); return signal.lfilter(b, a, x)
def lp(x, f, order=2): b, a = signal.butter(order, min(f/(SR/2), 0.99), 'low'); return signal.lfilter(b, a, x)
def lp_var(x, fc, n=512):
    """a low-pass whose cutoff follows the curve fc (one value per sample), in short blocks"""
    out = np.zeros_like(x); zi = np.zeros(2)
    for i in range(0, len(x), n):
        b, a = signal.butter(2, min(fc[i]/(SR/2), 0.99), 'low'); out[i:i + n], zi = signal.lfilter(b, a, x[i:i + n], zi=zi)
    return out
def hp(x, f, order=2): b, a = signal.butter(order, f/(SR/2), 'high'); return signal.lfilter(b, a, x)
def sweep_bp(x, f0, f1, q=4.0):
    """a band-pass whose centre moves from f0 to f1 (done in short blocks)"""
    out = np.zeros_like(x); n = 256; zi = None
    for i in range(0, len(x), n):
        f = f0*(f1/f0)**(i/len(x)); w = f/q
        b, a = signal.butter(2, [max(20, f - w/2)/(SR/2), min(f + w/2, SR/2*0.98)/(SR/2)], 'band')
        seg, zi = signal.lfilter(b, a, x[i:i + n], zi=zi if zi is not None else signal.lfilter_zi(b, a)*0)
        out[i:i + n] = seg
    return out
def sine(f, d, ph=0.0):
    t = t_(d)
    if callable(f): return np.sin(2*np.pi*np.cumsum(f(t))/SR + ph)
    return np.sin(2*np.pi*f*t + ph)
def glide(f0, f1, d): t = t_(d); return np.sin(2*np.pi*np.cumsum(f0*(f1/f0)**(t/d))/SR)
def modal(freqs, decays, d, amps=None, strike=0.002):
    """a struck object: a sum of decaying partials"""
    t = t_(d); x = np.zeros(len(t)); amps = amps or [1.0]*len(freqs)
    for f, dc, a in zip(freqs, decays, amps): x += a*np.sin(2*np.pi*f*t + RNG.uniform(0, 6.28))*np.exp(-t/dc)
    x[:int(strike*SR)] *= np.linspace(0, 1, int(strike*SR))
    return x
def thud(f0, f1, d, dc): return glide(f0, f1, d)*env(d, 0.002, dc)
def pad(x, d):
    n = int(d*SR); return np.pad(x, (0, max(0, n - len(x))))[:n]
def mix(*parts, d=None):
    d = d or max(len(p) for p in parts)/SR; out = np.zeros(int(d*SR))
    for p in parts: out[:len(p)] += p[:len(out)]
    return out
def at(x, t0, d): o = np.zeros(int(d*SR)); i = int(t0*SR); n = min(len(x), len(o) - i); o[i:i + n] = x[:n]; return o
def norm(x, peak=0.9):
    m = np.max(np.abs(x)) or 1; return x/m*peak
def fade(x, a=0.003, r=0.02):
    x = x.copy(); ia, ir = int(a*SR), int(r*SR)
    if ia: x[:ia] *= np.linspace(0, 1, ia)
    if ir: x[-ir:] *= np.linspace(1, 0, ir)
    return x
def reverb(x, size=0.6, wet=0.3, loop=False):
    """a small Schroeder reverb (four combs and two all-passes); with loop the tail wraps to the start so a loop stays seamless"""
    n = len(x); tail = int(SR*2.5*size); y = np.pad(x, (0, tail)); w = np.zeros(len(y))
    for dms, g in ((29.7, 0.77), (37.1, 0.74), (41.1, 0.72), (43.7, 0.7)):
        D = int(dms*size*SR/1000*1.6); b = np.zeros(D + 1); b[0] = 1; a = np.zeros(D + 1); a[0] = 1; a[D] = -g*(0.75 + 0.25*size)
        w += signal.lfilter(b, a, y)
    for dms, g in ((5.0, 0.7), (1.7, 0.7)):
        D = int(dms*SR/1000); b = np.zeros(D + 1); b[0] = -g; b[D] = 1; a = np.zeros(D + 1); a[0] = 1; a[D] = -g
        w = signal.lfilter(b, a, w)
    w = lp(w, 5000)/4
    if loop:
        out = y[:n]*(1 - wet) + w[:n]*wet; rest = w[n:]*wet
        while len(rest): k = min(n, len(rest)); out[:k] += rest[:k]; rest = rest[k:]
        return out
    return y*(1 - wet) + w*wet
def pluck(f, d, bright=0.5, decay=0.996):
    """Karplus-Strong string, as one recursive filter: y[n] = x[n] + decay/2 (y[n-N] + y[n-N-1])"""
    N = max(2, int(SR/f)); x = np.zeros(int(d*SR)); burst = RNG.uniform(-1, 1, N)
    x[:N] = lp(burst, 1500 + 6000*bright, 1) if N > 8 else burst
    a = np.zeros(N + 2); a[0] = 1; a[N] = -decay*0.5; a[N + 1] = -decay*0.5
    return signal.lfilter([1.0], a, x)
def saw(f, d, det=0.0):
    t = t_(d); return sum(signal.sawtooth(2*np.pi*f*(1 + k*det)*t + RNG.uniform(0, 6)) for k in (-1, 0, 1))/3
def note(n): return 440.0*2**((n - 69)/12)

# ---------------- sound effects ----------------
S = {}
def trim(x, db=-48):
    """cut the silent end of a sound (a reverb tail that has died away)"""
    a = np.abs(x); th = a.max()*10**(db/20); idx = np.nonzero(a > th)[0]
    return x[:min(len(x), idx[-1] + int(0.05*SR))] if len(idx) else x
def add(name, *xs): S[name] = [fade(trim(norm(x, 0.85))) for x in xs]
# bodies
def grunt(f=130, d=0.28):
    t = t_(d); src = signal.sawtooth(2*np.pi*np.cumsum(f*(1 - 0.25*t/d))/SR)*0.6 + noise(d)*0.4
    v = bp(src, 500, 900) + 0.7*bp(src, 1100, 1500) + 0.3*bp(src, 2300, 2800)
    return v*adsr(d, 0.02, 0.06, 0.6, 0.15)
add('jump_grunt', grunt(130), grunt(150, 0.24), grunt(115, 0.3))
def land(surface):
    d = 0.35
    if surface == 'grass': return mix(thud(90, 45, d, 0.06), lp(noise(d), 900)*env(d, 0.002, 0.05)*0.8, 0.3*hp(noise(d), 3000)*env(d, 0.001, 0.03))
    if surface == 'road': return mix(thud(110, 50, d, 0.05), bp(noise(d), 600, 3000)*env(d, 0.001, 0.035)*0.9)
    if surface == 'wood': return mix(thud(140, 70, d, 0.08), modal([210, 380, 610], [0.08, 0.05, 0.03], d, [0.6, 0.4, 0.2]), bp(noise(d), 300, 1800)*env(d, 0.001, 0.03)*0.5)
    return mix(thud(100, 60, d, 0.06), modal([420, 1130, 1870, 2650], [0.25, 0.18, 0.12, 0.08], d, [0.5, 0.4, 0.3, 0.2]), hp(noise(d), 2000)*env(d, 0.001, 0.02)*0.5)
for s in ('grass', 'road', 'wood', 'metal'): add('land_' + s, land(s), land(s))
def step(kind):
    d = 0.18
    if kind == 'gravel': return mix(*[at(bp(noise(0.04), 1500, 6000)*env(0.04, 0.001, 0.008)*RNG.uniform(0.4, 1), RNG.uniform(0, 0.08), d) for _ in range(9)], lp(noise(d), 400)*env(d, 0.003, 0.03)*0.6)
    return mix(lp(noise(d), 1200)*env(d, 0.01, 0.05), *[at(hp(noise(0.03), 2500)*env(0.03, 0.001, 0.01)*0.3, RNG.uniform(0, 0.06), d) for _ in range(4)])
add('step_gravel', step('gravel'), step('gravel'), step('gravel'), step('gravel'))
# weapons
def whoosh(d=0.32, f0=400, f1=1400, q=2.5): return sweep_bp(noise(d), f0, f1, q)*np.sin(np.pi*np.linspace(0, 1, int(d*SR)))**2
add('swing_wood', whoosh(0.3, 300, 900), whoosh(0.28, 350, 1000))
add('swing_metal', whoosh(0.26, 600, 2200, 4), whoosh(0.24, 700, 2400, 4))
add('hit_wood', mix(thud(160, 90, 0.3, 0.05), modal([320, 580, 940], [0.06, 0.04, 0.025], 0.3, [0.7, 0.5, 0.3]), bp(noise(0.3), 400, 2500)*env(0.3, 0.001, 0.02)),
               mix(thud(140, 80, 0.3, 0.06), modal([290, 610, 1020], [0.06, 0.04, 0.02], 0.3, [0.7, 0.4, 0.3]), bp(noise(0.3), 400, 2500)*env(0.3, 0.001, 0.02)))
add('hit_metal', mix(modal([530, 1410, 2290, 3170, 4400], [0.3, 0.2, 0.14, 0.1, 0.06], 0.6, [0.6, 0.5, 0.35, 0.25, 0.15]), hp(noise(0.6), 2500)*env(0.6, 0.001, 0.015)),
                mix(modal([610, 1530, 2510, 3460], [0.28, 0.18, 0.12, 0.08], 0.6, [0.6, 0.5, 0.35, 0.2]), hp(noise(0.6), 2500)*env(0.6, 0.001, 0.015)))
add('pan_clang', mix(modal([392, 1060, 1720, 2480, 3600], [1.2, 0.8, 0.5, 0.3, 0.2], 1.5, [0.8, 0.6, 0.4, 0.3, 0.2]), hp(noise(1.5), 3000)*env(1.5, 0.001, 0.01)),
                mix(modal([370, 1010, 1690, 2410], [1.1, 0.7, 0.45, 0.3], 1.5, [0.8, 0.6, 0.4, 0.3]), hp(noise(1.5), 3000)*env(1.5, 0.001, 0.01)))
def flap(d=0.35):
    t = t_(d); am = 0.5 + 0.5*np.sign(np.sin(2*np.pi*(22 + 30*t)*t)); return bp(noise(d), 300, 2500)*am*np.sin(np.pi*t/d)
add('umbrella_flap', flap(), flap(0.3))
def gunshot(body, crack, tail, d=1.2):
    return mix(thud(body, 40, d, 0.08)*1.2, hp(noise(d), 1800)*env(d, 0.0005, crack), lp(noise(d), 1600)*env(d, 0.002, tail)*0.7)
add('gun_pistol', reverb(gunshot(150, 0.02, 0.12), 0.5, 0.25), reverb(gunshot(160, 0.018, 0.1), 0.5, 0.25))
add('gun_rifle', reverb(gunshot(110, 0.03, 0.25, 1.6), 0.8, 0.3))
add('gun_shotgun', reverb(gunshot(80, 0.04, 0.35, 1.8), 0.8, 0.3))
def click(f=3200, d=0.05): return bp(noise(d), f*0.6, min(f*1.6, 10000))*env(d, 0.0003, 0.004) + modal([f], [0.01], d, [0.5])
add('dry_click', click(2800), click(3100))
add('reload_click', mix(click(2200, 0.25), at(click(3000, 0.1), 0.09, 0.25)), mix(click(2000, 0.25), at(click(2900, 0.1), 0.11, 0.25)))
add('mag_in', mix(thud(300, 200, 0.2, 0.03), at(click(2600, 0.1), 0.02, 0.2)))
add('gun_rack', mix(bp(noise(0.5), 800, 4000)*env(0.5, 0.01, 0.05), at(click(1800, 0.1), 0.1, 0.5), at(bp(noise(0.2), 900, 4000)*env(0.2, 0.01, 0.04), 0.22, 0.5), at(click(2400, 0.1), 0.32, 0.5)))
add('bolt_cycle', mix(click(2000, 0.6), at(bp(noise(0.15), 1000, 5000)*env(0.15, 0.01, 0.04), 0.08, 0.6), at(click(2600, 0.1), 0.25, 0.6), at(bp(noise(0.15), 1000, 5000)*env(0.15, 0.01, 0.04), 0.33, 0.6), at(click(1800, 0.1), 0.48, 0.6)))
add('shell_insert', mix(bp(noise(0.12), 1200, 5000)*env(0.12, 0.005, 0.03), at(click(1500, 0.08), 0.06, 0.15)))
add('arrow_release', mix(modal([110, 220], [0.08, 0.05], 0.3, [0.8, 0.3]), whoosh(0.3, 900, 2500, 3)*0.6))
add('arrow_thunk', mix(thud(220, 120, 0.3, 0.03), modal([180, 410], [0.12, 0.06], 0.3, [0.4, 0.3])), mix(thud(200, 110, 0.3, 0.03), modal([170, 390], [0.12, 0.06], 0.3, [0.4, 0.3])))
add('crossbow_shot', mix(click(1500, 0.4), modal([140, 280, 520], [0.15, 0.08, 0.05], 0.4, [0.8, 0.4, 0.2]), whoosh(0.3, 1000, 3000, 3)*0.5))
add('flare_pop', reverb(mix(thud(200, 80, 1.5, 0.04), hp(noise(1.5), 1500)*env(1.5, 0.001, 0.02), at(bp(noise(1.2), 2000, 7000)*env(1.2, 0.05, 0.6)*0.4, 0.05, 1.5)), 0.6, 0.3))
# aliens: swarmer chitters high, stalker shrieks, giant groans low, spitter gurgles, clinger clicks
def creature(base, kind, d):
    t = t_(d)
    if kind == 'idle':   f = base*(1 + 0.08*np.sin(2*np.pi*3*t)); a = adsr(d, 0.1, 0.2, 0.6, 0.3)
    elif kind == 'notice': f = base*(1 + 0.6*t/d); a = adsr(d, 0.02, 0.1, 0.8, 0.2)
    elif kind == 'attack': f = base*(1.6 - 0.8*t/d); a = adsr(d, 0.005, 0.05, 0.9, 0.1)
    else: f = base*(1.2 - 0.7*t/d); a = adsr(d, 0.01, 0.2, 0.5, 0.6)
    car = np.sin(2*np.pi*np.cumsum(f)/SR + 2.5*np.sin(2*np.pi*np.cumsum(f*1.48)/SR))
    rough = 1 + 0.6*np.sin(2*np.pi*(31 + 20*np.sin(2*np.pi*0.7*t))*t)
    return (car*rough + 0.3*bp(noise(d), 200, 3000))*a
ALIENS = {'swarmer': (620, 0.4), 'stalker': (330, 0.9), 'giant': (70, 1.6), 'spitter': (210, 0.8), 'clinger': (900, 0.35)}
for nm, (f, d) in ALIENS.items():
    for kind in ('idle', 'notice', 'attack', 'die'):
        x = creature(f, kind, d*(1.4 if kind == 'die' else 1)); x2 = creature(f*1.07, kind, d*(1.4 if kind == 'die' else 1))
        if nm == 'clinger': x = mix(x*0.5, *[at(click(4000, 0.03), RNG.uniform(0, d*0.8), d) for _ in range(6)]); x2 = mix(x2*0.5, *[at(click(4200, 0.03), RNG.uniform(0, d*0.8), d) for _ in range(6)])
        if nm == 'spitter' and kind == 'attack': x = mix(x, at(lp(noise(0.3), 700)*env(0.3, 0.01, 0.1), d*0.6, d + 0.3))
        add('alien_%s_%s' % (nm, kind), reverb(x, 0.4, 0.15), reverb(x2, 0.4, 0.15))
# house sounds
add('door_slam', reverb(mix(thud(90, 50, 0.8, 0.08), modal([140, 260, 470], [0.2, 0.12, 0.06], 0.8, [0.6, 0.4, 0.2]), lp(noise(0.8), 2000)*env(0.8, 0.001, 0.03)), 0.6, 0.25))
def creak(d=0.9, f0=180, f1=260):
    t = t_(d); f = f0*(f1/f0)**(t/d)*(1 + 0.03*np.sin(2*np.pi*7*t)); pulses = (np.sin(2*np.pi*np.cumsum(f)/SR) > 0.95).astype(float)
    return bp(pulses + 0.05*noise(d), 300, 3500)*np.sin(np.pi*t/d)**0.5
add('door_creak', creak(), creak(1.1, 150, 230))
add('drawer', mix(bp(noise(0.5), 300, 2500)*np.sin(np.pi*np.linspace(0, 1, int(0.5*SR)))*0.7, at(thud(200, 120, 0.2, 0.03), 0.45, 0.6)), mix(bp(noise(0.45), 350, 2600)*np.sin(np.pi*np.linspace(0, 1, int(0.45*SR)))*0.7, at(thud(190, 120, 0.2, 0.03), 0.4, 0.6)))
add('lid', mix(creak(0.5, 300, 420)*0.6, at(thud(150, 90, 0.3, 0.05), 0.5, 0.8)))
def drag(d=1.2):
    t = t_(d); judder = 0.6 + 0.4*np.abs(np.sin(2*np.pi*(9 + 3*np.sin(2*np.pi*0.8*t))*t)); return bp(noise(d), 120, 900)*judder*adsr(d, 0.05, 0.1, 0.9, 0.15) + 0.3*lp(noise(d), 120)
add('furniture_drag', drag(), drag(1.0))
# loops: built so the end runs into the start (cross-faded)
def loopify(x, xf=0.25):
    n = int(xf*SR); y = x[:-n].copy(); y[:n] = y[:n]*np.linspace(0, 1, n) + x[-n:]*np.linspace(1, 0, n); return y
def hum(d=4.0):
    t = t_(d); mains = sum(np.sin(2*np.pi*50*k*t)/k for k in (1, 2, 3, 4, 6))
    putt = (np.sin(2*np.pi*12.5*t) > 0.6).astype(float); eng = lp(putt + 0.2*noise(d), 300)
    return mains*0.4 + eng*0.9 + 0.1*bp(noise(d), 800, 2500)
S['generator_hum'] = [norm(loopify(hum(4.25)), 0.7)]
def rain(d, roof):
    x = 0.4*bp(noise(d), 800, 8000)
    n = int(d*(260 if roof else 60))
    for _ in range(n):
        drop = modal([RNG.uniform(1800, 4200)], [0.006 if not roof else 0.02], 0.05, [1]) if roof else hp(noise(0.02), 3000)*env(0.02, 0.0005, 0.003)
        x += at(drop*RNG.uniform(0.1, 0.5), RNG.uniform(0, d - 0.06), d)
    return x
S['rain_roof'] = [norm(loopify(rain(6.25, True)), 0.7)]; S['rain_outside'] = [norm(loopify(rain(6.25, False)), 0.6)]
def crackle(d):
    x = 0.25*lp(noise(d), 500)
    for _ in range(int(d*14)): x += at(bp(noise(0.03), 1500, 7000)*env(0.03, 0.0005, 0.006)*RNG.uniform(0.3, 1), RNG.uniform(0, d - 0.04), d)
    for _ in range(int(d*2)): x += at(click(RNG.uniform(1500, 3000), 0.06)*RNG.uniform(0.8, 1.5), RNG.uniform(0, d - 0.07), d)
    return x
S['fire_crackle'] = [norm(loopify(crackle(5.25)), 0.7)]
# 10.6 breaking things and power
add('wood_crack', mix(*[at(bp(noise(0.05), 600, 5000)*env(0.05, 0.0005, 0.012), 0.012*i + RNG.uniform(0, 0.01), 0.7) for i in range(14)], thud(130, 60, 0.7, 0.12), modal([240, 520], [0.15, 0.08], 0.7, [0.4, 0.2])),
                  mix(*[at(bp(noise(0.05), 600, 5000)*env(0.05, 0.0005, 0.012), 0.015*i + RNG.uniform(0, 0.01), 0.7) for i in range(10)], thud(120, 60, 0.7, 0.12)))
def crumble(d=1.4, lo=200, hi=3000, n=40):
    return mix(lp(noise(d), 300)*adsr(d, 0.02, 0.3, 0.4, 0.6), *[at(bp(noise(0.08), lo, hi)*env(0.08, 0.001, 0.02)*RNG.uniform(0.2, 1), RNG.uniform(0, d*0.8)**1.3, d) for _ in range(n)])
add('brick_crumble', reverb(crumble(1.4, 300, 3500, 45), 0.5, 0.2), reverb(crumble(1.2, 300, 3500, 38), 0.5, 0.2))
add('concrete_crack', reverb(mix(hp(noise(0.8), 1500)*env(0.8, 0.0005, 0.03), thud(80, 40, 0.8, 0.15)*1.2, crumble(0.8, 150, 2000, 20)*0.6), 0.6, 0.25))
def scream(d=1.6):
    t = t_(d); f = 380*(1 + 0.35*np.sin(2*np.pi*0.6*t)) + 60*np.sin(2*np.pi*11*t)
    x = sum(np.sin(2*np.pi*np.cumsum(f*k)/SR)/k**0.8 for k in (1, 2.76, 5.4, 8.9))
    return bp(x, 200, 6000)*adsr(d, 0.1, 0.3, 0.7, 0.5) + 0.4*modal([140, 430], [0.4, 0.2], d, [1, 0.6])
add('steel_bend', reverb(scream(), 0.7, 0.3), reverb(scream(1.3), 0.7, 0.3))
def shatter(d=1.0):
    return mix(hp(noise(d), 2500)*env(d, 0.0005, 0.06), *[at(modal([RNG.uniform(2500, 7000)], [0.05], 0.12, [1])*RNG.uniform(0.2, 0.7), RNG.uniform(0, d*0.7)**1.5, d) for _ in range(30)], thud(160, 80, d, 0.04)*0.5)
add('glass_break', shatter(), shatter(0.9))
def crash(heavy):
    d = 2.0 if heavy else 1.2
    x = mix(thud(70 if heavy else 110, 35, d, 0.15 if heavy else 0.08)*1.3, lp(noise(d), 2500)*env(d, 0.002, 0.25 if heavy else 0.12),
            modal([310, 880, 1460, 2210], [0.4, 0.25, 0.15, 0.1], d, [0.5, 0.4, 0.3, 0.2]), shatter(d)*(0.6 if heavy else 0.4), crumble(d, 200, 3000, 30 if heavy else 12)*0.6)
    return reverb(x, 0.7, 0.25)
add('car_crash_light', crash(False)); add('car_crash_heavy', crash(True))
add('plug_in', mix(click(1400, 0.3), at(modal([60, 120], [0.15, 0.1], 0.3, [0.3, 0.2]), 0.02, 0.3)))
add('breaker_trip', mix(click(1200, 0.6)*1.2, at(bp(noise(0.3), 300, 2000)*env(0.3, 0.001, 0.04), 0.0, 0.6), at(modal([50, 100, 150], [0.15, 0.1, 0.08], 0.5, [0.5, 0.4, 0.2])*env(0.5, 0.001, 0.03), 0.02, 0.6)))
def klaxon(d=3.0):
    t = t_(d); gate = (np.sin(2*np.pi*1.5*t) > 0).astype(float); f = 440 + 110*(np.sin(2*np.pi*1.5*t) > 0.5)
    x = signal.square(2*np.pi*np.cumsum(f)/SR)*0.5 + signal.sawtooth(2*np.pi*np.cumsum(f*1.5)/SR)*0.3
    return lp(x, 2500)*gate*adsr(d, 0.01, 0.1, 0.9, 0.3)
add('klaxon', reverb(klaxon(), 0.9, 0.35))
def plant_start(d=8.0):
    t = t_(d); f = 40 + 360*(1 - np.exp(-t/2.8)); whine = sum(np.sin(2*np.pi*np.cumsum(f*k)/SR)/k for k in (1, 2, 3, 7))
    rumble = lp(noise(d), 150)*(0.3 + 0.7*(1 - np.exp(-t/1.5)))
    clunks = mix(at(thud(80, 40, 0.6, 0.1), 0.2, d), at(thud(70, 35, 0.6, 0.1), 1.1, d))
    return mix(whine*adsr(d, 0.5, 0.5, 0.8, 1.0)*0.5, rumble*1.2, clunks, at(klaxon(2.5)*0.4, 0.0, d))
add('plant_start', reverb(plant_start(), 0.9, 0.3))
def street_hum(d=4.0):
    t = t_(d); x = sum(np.sin(2*np.pi*60*k*t)/k for k in (1, 2, 3, 5)) + 0.2*bp(noise(d), 2000, 6000)
    swell = 1 - np.exp(-t/1.2); buzz = (np.sin(2*np.pi*120*t) > 0.97).astype(float)*0.2
    return (x + buzz)*swell*adsr(d, 0.01, 0.1, 1.0, 0.8)
add('power_on_hum', reverb(street_hum(), 0.8, 0.3))

# ---------------- music ----------------
# scales: MIDI note numbers. Everything is written in bars of 4 beats; a loop is a whole number of bars so it repeats seamlessly.
def drum_kick(d=0.4): return thud(110, 40, d, 0.12)
def drum_snare(d=0.3): return mix(bp(noise(d), 1200, 6000)*env(d, 0.001, 0.06), sine(190, d)*env(d, 0.001, 0.04)*0.6)
def drum_hat(d=0.08): return hp(noise(d), 6000)*env(d, 0.0005, 0.015)
def soft_pad(notes, d, bright=900, det=0.004):
    x = sum(saw(note(n), d, det) for n in notes)/len(notes); return lp(x, bright)*adsr(d, d*0.25, d*0.2, 0.8, d*0.3)
def bell(n, d=2.0): f = note(n); return modal([f, f*2.76, f*5.4], [d*0.5, d*0.25, d*0.12], d, [1, 0.4, 0.15])
def place_all(events, total):
    out = np.zeros(int(total*SR))
    for t0, x in events:
        i = int(t0*SR) % len(out); n = len(x)
        if i + n <= len(out): out[i:i + n] += x
        else: k = len(out) - i; out[i:] += x[:k]; out[:n - k] += x[k:]   # wraps round: seamless loops
    return out
def song_day():
    bpm = 84; beat = 60/bpm; bars = 42; total = bars*4*beat
    prog = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 67]]   # Cmaj7 Am7 Fmaj7 G
    scale = [72, 74, 76, 79, 81, 84]
    ev = []
    for b in range(bars):
        ch = prog[(b//2) % 4]; t0 = b*4*beat
        if b % 2 == 0: ev.append((t0, soft_pad(ch, 8*beat, 800)*0.35))
        ev.append((t0, pluck(note(ch[0] - 12), 2.5, 0.3)*0.5))
        for k in range(8):
            if RNG.random() < (0.55 if 4 <= b < bars - 4 else 0.3): ev.append((t0 + k*beat/2, pluck(note(RNG.choice(ch) + 12), 1.4, 0.6)*0.28))
        if b % 4 == 3 and b > 4: ev.append((t0 + 2*beat, bell(RNG.choice(scale), 3.0)*0.18))
    return reverb(place_all(ev, total), 0.9, 0.35, loop=True)
def song_night():
    bpm = 64; beat = 60/bpm; bars = 32; total = bars*4*beat
    ev = []
    drone = (saw(note(38), total, 0.003)*0.5 + saw(note(45), total, 0.004)*0.3)
    t = t_(total); drone = lp_var(drone, 220 + 140*(0.5 + 0.5*np.sin(2*np.pi*t/total*2)))*0.6
    ev.append((0, drone))
    motif = [62, 63, 58, 57]
    for b in range(bars):
        t0 = b*4*beat
        ev.append((t0, thud(55, 40, 1.2, 0.35)*0.5)); ev.append((t0 + 2.5*beat, thud(55, 40, 0.8, 0.2)*0.25))
        if b % 4 in (1, 3): ev.append((t0 + beat, bell(motif[(b//2) % 4] + 12, 3.5)*0.12))
        if b % 8 == 6: ev.append((t0, sweep_bp(noise(4*beat), 300, 2400, 6)*adsr(4*beat, 2*beat, beat, 0.5, beat)*0.15))
    return reverb(place_all(ev, total), 1.0, 0.45, loop=True)
def song_horde():
    bpm = 132; beat = 60/bpm; bars = 64; total = bars*4*beat
    ev = []; riff = [45, 45, 48, 45, 50, 45, 48, 44]
    for b in range(bars):
        t0 = b*4*beat
        for k in range(4): ev.append((t0 + k*beat, drum_kick()*0.9))
        for k in (1, 3): ev.append((t0 + k*beat, drum_snare()*0.6))
        for k in range(8): ev.append((t0 + k*beat/2, drum_hat()*0.25))
        for k in range(8):
            n = riff[k] + (0 if (b//4) % 2 == 0 else 3); x = lp(saw(note(n), beat/2*0.9, 0.006), 700 + 300*((b % 8)/8))*env(beat/2*0.9, 0.003, 0.12)
            ev.append((t0 + k*beat/2, x*0.45))
        if b % 8 == 4: ev.append((t0, soft_pad([57, 60, 64], 8*beat, 1400)*0.25))
    return reverb(place_all(ev, total), 0.6, 0.18, loop=True)
def song_base():
    bpm = 76; beat = 60/bpm; bars = 38; total = bars*4*beat
    prog = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]   # Am F C G, warm and slow
    ev = []
    for b in range(bars):
        ch = prog[b % 4]; t0 = b*4*beat
        ev.append((t0, soft_pad(ch, 4*beat, 700, 0.003)*0.3)); ev.append((t0, pluck(note(ch[0] - 12), 3.0, 0.25)*0.45))
        for k, n in enumerate([ch[0], ch[1], ch[2], ch[1]]*2): ev.append((t0 + k*beat/2, pluck(note(n + 12), 1.6, 0.45)*0.22))
    return reverb(place_all(ev, total), 0.9, 0.35, loop=True)
def song_chase():
    bpm = 150; beat = 60/bpm; total = 8*beat*2 + 1.5
    ev = []
    for k in range(16):
        ev.append((k*beat/2, drum_kick(0.3)*0.9)); ev.append((k*beat/2 + beat/4, drum_hat()*0.4))
        ev.append((k*beat/2, lp(saw(note(40 + k), beat/2*0.9, 0.01), 900)*env(beat/2*0.9, 0.002, 0.1)*0.5))
    ev.append((8*beat, mix(drum_snare(1.2), thud(60, 30, 1.5, 0.4), soft_pad([52, 55, 58, 61], 1.5, 2000)*0.6)))
    return reverb(place_all(ev, total), 0.7, 0.25)
def sting(up):
    d = 4.0; ch = [60, 64, 67, 72] if up else [57, 60, 63, 66]
    ev = [(i*0.18, bell(n + 12, 3.0)*0.5) for i, n in enumerate(ch if up else ch[::-1])] + [(0, soft_pad(ch, d, 1200 if up else 600)*0.4)]
    return reverb(place_all(ev, d + 1.5), 0.9, 0.4)
add('sting_night', sting(False)); add('sting_dawn', sting(True))
MUSIC = {'day': song_day, 'night': song_night, 'horde': song_horde, 'base': song_base, 'chase': song_chase}

# ---------------- write ----------------
def mp3(x, kbps=40):
    tmp = tempfile.mkdtemp(); w = os.path.join(tmp, 'x.wav'); o = os.path.join(tmp, 'x.mp3')
    from scipy.io import wavfile
    wavfile.write(w, SR, (np.clip(x, -1, 1)*32000).astype(np.int16))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', w, '-ac', '1', '-ar', str(SR), '-b:a', '%dk' % kbps, o], check=True)
    return base64.b64encode(open(o, 'rb').read()).decode()
if __name__ == '__main__':
    import sys
    only = sys.argv[1:]
    if not only or 'sfx' in only:
        out = {k: [mp3(v) for v in vs] for k, vs in S.items()}
        open(os.path.join(OUT, 'sounds_design.js'), 'w').write('/* Afterstreet sounds made in code: assets/audio/src/make_audio.py, do not edit by hand. Adds to window.ART.sounds. */\n'
            '(function(){ var A = (window.ART = window.ART || {}); A.sounds = A.sounds || {}; var S = ' + json.dumps(out, separators=(',', ':')) + '; for (var k in S) A.sounds[k] = S[k]; })();\n')
        print('sounds:', len(out), 'keys', round(os.path.getsize(os.path.join(OUT, 'sounds_design.js'))/1e6, 2), 'MB')
    if not only or 'music' in only:
        for k, fn in MUSIC.items():
            if len(only) > 1 and k not in only: continue
            x = norm(fn(), 0.8)
            if k == 'chase': x = fade(trim(x), 0.003, 0.3)
            b64 = mp3(x, 48)
            open(os.path.join(OUT, 'music_%s.js' % k), 'w').write('/* Afterstreet music made in code: assets/audio/src/make_audio.py */\n(window.ART = window.ART || {}); (window.ART.music = window.ART.music || {}).%s = %s; (window.ART.musicLoop = window.ART.musicLoop || {}).%s = %s;\n' % (k, json.dumps(b64), k, 'null' if k == 'chase' else round(len(x)/SR, 4)))
            print('music', k, round(len(x)/SR, 1), 's', round(len(b64)/1e6, 2), 'MB')
