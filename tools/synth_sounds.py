#!/usr/bin/env python3
"""Makes the few sound effects the content chat's set does not cover (snow steps, body hurt, planks, stone, tin, creaks, latch, pick-up, swing) in code and packs them into assets/sounds.js.
Each sound is turned into small mono MP3 (plays on every browser, iPhone included) and stored as text, so the game can load it
from a drive with no web server. Gunfire, alien calls, rain and wind are made by the game itself, so they need no files.
Usage: python3 tools/synth_sounds.py     (needs numpy, scipy and ffmpeg)"""
import os, json, base64, subprocess, tempfile, wave
import numpy as np
from scipy.signal import butter, lfilter
SR = 22050
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'sounds.js')
def rng(seed): return np.random.default_rng(seed)
def T(d): return np.arange(int(d*SR))/SR
def noise(r, d): return r.standard_normal(int(d*SR))
def lp(x, f, o=2): b, a = butter(o, min(f, SR*0.45)/(SR/2)); return lfilter(b, a, x)
def hp(x, f, o=2): b, a = butter(o, f/(SR/2), 'high'); return lfilter(b, a, x)
def bp(x, f0, f1, o=2): b, a = butter(o, [f0/(SR/2), min(f1, SR*0.45)/(SR/2)], 'band'); return lfilter(b, a, x)
def env(n, att, dec): t = np.arange(n)/SR; return np.minimum(1, t/max(att, 1e-4))*np.exp(-t/dec)
def tone(f, d, dec, r=None, fm=0): t = T(d); return np.sin(2*np.pi*f*t + fm*np.sin(2*np.pi*7*t))*np.exp(-t/dec)
def norm(x, peak=0.8): x = x - x.mean(); m = np.abs(x).max() or 1; return x/m*peak
def fade(x): n = min(len(x)//8, 400); x = x.copy(); x[-n:] *= np.linspace(1, 0, n); return x
def mix(*xs):
    n = max(len(x) for x in xs); o = np.zeros(n)
    for x in xs: o[:len(x)] += x
    return o
def delayed(x, d, n=None): return np.concatenate([np.zeros(int(d*SR)), x])
def thump(r, f=90, d=0.18, dec=0.05): t = T(d); return np.sin(2*np.pi*(f*(1 + 1.2*np.exp(-t/0.02)))*t)*np.exp(-t/dec)
def step(kind):
    def mk(r):
        n = noise(r, 0.28)
        if kind == 'concrete': y = mix(lp(n, 3200)*env(len(n), 0.002, 0.03), thump(r, 110, 0.12, 0.03)*0.7, hp(n, 2500)*env(len(n), 0.001, 0.008)*0.5)
        elif kind == 'grass': y = mix(bp(n, 300, 3000)*env(len(n), 0.025, 0.07)*(1 + 0.5*lp(noise(r, 0.28), 30)), thump(r, 70, 0.14, 0.03)*0.4)
        elif kind == 'wood': y = mix(thump(r, 130, 0.2, 0.05)*0.9, bp(n, 600, 2200)*env(len(n), 0.002, 0.025)*0.6, tone(170 + 40*r.random(), 0.2, 0.06)*0.4)
        elif kind == 'carpet': y = mix(lp(n, 900)*env(len(n), 0.01, 0.05), thump(r, 70, 0.14, 0.035)*0.5)
        else:
            c = (r.random(len(n)) > 0.985)*r.standard_normal(len(n)); y = mix(lp(n, 1500)*env(len(n), 0.03, 0.08)*0.5, hp(lp(c, 6000), 1500)*env(len(n), 0.002, 0.1)*2)
        return y
    return mk
def hit(r): n = noise(r, 0.3); return mix(thump(r, 100, 0.25, 0.06), lp(n, 1800)*env(len(n), 0.001, 0.03)*0.7)
def hurt(r): n = noise(r, 0.35); return mix(thump(r, 60, 0.3, 0.1)*1.1, lp(n, 700)*env(len(n), 0.002, 0.07)*0.8)
def wood_hit(r):
    f = 150 + 120*r.random(); n = noise(r, 0.4); return mix(bp(n, f, f*3)*env(len(n), 0.001, 0.06), tone(f*1.0, 0.4, 0.09)*0.8, tone(f*2.3, 0.3, 0.05)*0.4, thump(r, 80, 0.2, 0.04)*0.5)
def plank(r):
    f = 220 + 150*r.random(); n = noise(r, 0.35); return mix(tone(f, 0.35, 0.07)*0.7, tone(f*1.9, 0.3, 0.04)*0.4, bp(n, 800, 3500)*env(len(n), 0.001, 0.025)*0.7)
def stone(r): n = noise(r, 0.25); return mix(hp(n, 1500)*env(len(n), 0.0005, 0.02)*1.2, tone(900 + 600*r.random(), 0.2, 0.025)*0.4, thump(r, 140, 0.1, 0.02)*0.5)
def metal(r):
    f = 500 + 500*r.random(); return mix(*[tone(f*m, 0.7, 0.28/(1 + i*0.5))*(0.6/(1 + i*0.4)) for i, m in enumerate((1, 2.76, 5.4, 8.9, 13.3))], hp(noise(r, 0.05), 3000)*env(int(0.05*SR), 0.0005, 0.01))
def tin(r):
    f = 900 + 600*r.random(); return mix(*[tone(f*m, 0.45, 0.12/(1 + i*0.4))*(0.7/(1 + i*0.5)) for i, m in enumerate((1, 2.4, 4.1, 6.7))], hp(noise(r, 0.04), 4000)*env(int(0.04*SR), 0.0005, 0.008))
def glass(r):
    n = noise(r, 0.9); o = hp(n, 2500)*env(len(n), 0.0005, 0.07)
    for k in range(14):
        f = 2500 + 5500*r.random(); o = mix(o, delayed(tone(f, 0.25, 0.04 + 0.05*r.random())*(0.3 + 0.5*r.random()), 0.01 + 0.5*r.random()**2))
    return o
def creak_core(r, d, f0, f1, wob=6):
    t = T(d); f = f0 + (f1 - f0)*np.linspace(0, 1, len(t))**0.8 + 10*np.sin(2*np.pi*wob*t + r.random()*6)
    ph = 2*np.pi*np.cumsum(f)/SR; s = (np.sign(np.sin(ph))*0.5 + np.sin(ph)*0.5) + 0.3*np.sin(2.01*ph)
    return bp(s + 0.4*noise(r, d), 200, 1800)*np.sin(np.pi*np.linspace(0, 1, len(t)))**0.7
def door_open(r): c = creak_core(r, 0.55 + 0.2*r.random(), 150 + 50*r.random(), 260 + 80*r.random()); return mix(delayed(thump(r, 100, 0.12, 0.03)*0.5, 0.0), delayed(c*0.5, 0.05), delayed(hp(noise(r, 0.03), 2500)*env(int(0.03*SR), 0.0005, 0.005)*0.6, 0.0))
def door_close(r):
    n = noise(r, 0.35); return mix(thump(r, 75, 0.3, 0.08)*1.1, lp(n, 900)*env(len(n), 0.001, 0.05)*0.8, delayed(hp(noise(r, 0.04), 2500)*env(int(0.04*SR), 0.0005, 0.008)*0.7, 0.04))
def creak(r): return creak_core(r, 0.7 + 0.5*r.random(), 120 + 60*r.random(), 200 + 150*r.random(), 4 + 5*r.random())
def search(r):
    d = 0.35 + 0.2*r.random(); n = noise(r, d); a = np.abs(lp(noise(r, d), 14)); a /= a.max() + 1e-9
    return bp(n, 500, 4500)*a*np.sin(np.pi*np.linspace(0, 1, len(n)))**0.5
def latch(r):
    c = lambda f: mix(hp(noise(r, 0.03), 1800)*env(int(0.03*SR), 0.0003, 0.006), tone(f, 0.06, 0.012)*0.6)
    return mix(c(2200 + 400*r.random()), delayed(c(1500 + 300*r.random()), 0.08 + 0.05*r.random()))
def pick(r): d = 0.22; n = noise(r, d); return mix(bp(n, 300, 2200)*env(len(n), 0.01, 0.05)*0.8, thump(r, 90, 0.12, 0.03)*0.4)
def chop(r): return mix(wood_hit(r)*0.9, delayed(bp(noise(r, 0.12), 1000, 5000)*np.hanning(int(0.12*SR)), 0.0)*0.0)
def swing(r):
    d = 0.3 + 0.1*r.random(); n = noise(r, d); t = np.linspace(0, 1, len(n)); f = 700 + 2500*np.sin(np.pi*t)
    out = np.zeros(len(n)); w = 400
    for i in range(0, len(n) - w, w//2):
        seg = bp(n[i:i + w + 50], max(300, f[i]*0.7), f[i]*1.4, 1)[:w]*np.hanning(w); out[i:i + w] += seg
    return out*np.sin(np.pi*t)
def pot(r):
    f = 380 + 120*r.random(); return mix(*[tone(f*m, 0.8, 0.35/(1 + i*0.6))*(0.7/(1 + i*0.5)) for i, m in enumerate((1, 2.02, 3.1, 4.7, 6.4))], hp(noise(r, 0.04), 2500)*env(int(0.04*SR), 0.0005, 0.01)*0.6)
G = {'step_snow': (step('snow'), 4), 'hurt': (hurt, 3), 'plank': (plank, 3), 'stone': (stone, 3), 'tin': (tin, 2), 'creak': (creak, 3), 'latch': (latch, 2), 'pick': (pick, 3), 'swing': (swing, 3)}
# everything else the game asks for comes from the content chat's set (assets/audio/sounds_content.js), by the names in SNDA in play.html
out = {}; tmp = tempfile.mkdtemp(); seed = 100
for k, (fn, n) in G.items():
    out[k] = []
    for i in range(n):
        seed += 1; y = fade(norm(fn(rng(seed)), 0.85)); w = os.path.join(tmp, 'x.wav'); o = os.path.join(tmp, 'x.mp3')
        with wave.open(w, 'wb') as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes((np.clip(y, -1, 1)*32000).astype('<i2').tobytes())
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', w, '-ac', '1', '-ar', str(SR), '-b:a', '40k', o], check=True)
        out[k].append(base64.b64encode(open(o, 'rb').read()).decode())
    print(k, n)
open(OUT, 'w').write('/* Afterstreet sounds: made by tools/synth_sounds.py, do not edit by hand */\n(window.ART = window.ART || {}).sounds = ' + json.dumps(out, separators=(',', ':')) + ';\n')
print(round(os.path.getsize(OUT)/1e6, 2), 'MB')
