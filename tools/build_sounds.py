#!/usr/bin/env python3
"""Packs the game's sound effects from Kenney "Impact Sounds" and "RPG Audio" (both CC0, kenney.nl) into assets/sounds.js.
Usage: python3 tools/build_sounds.py <kenney_impact-sounds folder> <kenney_rpg-audio folder>
Each sound is turned into small mono MP3 (plays on every browser, iPhone included) and stored as text, so the game can load it
from a drive with no web server. Gunfire, alien calls, rain and wind are made by the game itself, so they need no files.
Needs ffmpeg."""
import sys, os, glob, json, base64, subprocess, tempfile
IMP, RPG = sys.argv[1], sys.argv[2]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'sounds.js')
def files(root, pat): return sorted(glob.glob(os.path.join(glob.escape(root), '**', pat), recursive=True))
G = {
    'step_concrete': files(IMP, 'footstep_concrete_00[0-4].ogg'), 'step_grass': files(IMP, 'footstep_grass_00[0-4].ogg'),
    'step_wood': files(IMP, 'footstep_wood_00[0-4].ogg'), 'step_carpet': files(IMP, 'footstep_carpet_00[0-3].ogg'), 'step_snow': files(IMP, 'footstep_snow_00[0-3].ogg'),
    'hit': files(IMP, 'impactPunch_medium_00[0-3].ogg'), 'hurt': files(IMP, 'impactSoft_heavy_00[0-2].ogg'),
    'wood_hit': files(IMP, 'impactWood_heavy_00[0-3].ogg'), 'glass': files(IMP, 'impactGlass_heavy_00[0-3].ogg'), 'plank': files(IMP, 'impactPlank_medium_00[0-2].ogg'),
    'stone': files(IMP, 'impactMining_00[0-2].ogg'), 'metal': files(IMP, 'impactMetal_light_00[0-2].ogg'), 'tin': files(IMP, 'impactTin_medium_00[0-1].ogg'),
    'door_open': files(RPG, 'doorOpen_[12].ogg'), 'door_close': files(RPG, 'doorClose_[1-4].ogg'), 'creak': files(RPG, 'creak[1-3].ogg'),
    'search': files(RPG, 'cloth[1-4].ogg') + files(RPG, 'bookFlip[1-2].ogg'), 'latch': files(RPG, 'metalLatch.ogg') + files(RPG, 'metalClick.ogg'),
    'pick': files(RPG, 'handleSmallLeather*.ogg') + files(RPG, 'dropLeather.ogg'), 'chop': files(RPG, 'chop.ogg'),
    'swing': files(RPG, 'knifeSlice*.ogg') + files(RPG, 'drawKnife[1-2].ogg'), 'pot': files(RPG, 'metalPot[1-2].ogg'),
}
out = {}
tmp = tempfile.mkdtemp()
for k, fl in G.items():
    assert fl, k
    out[k] = []
    for f in fl:
        o = os.path.join(tmp, 'x.mp3')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f, '-ac', '1', '-ar', '22050', '-b:a', '40k', o], check=True)
        out[k].append(base64.b64encode(open(o, 'rb').read()).decode())
    print(k, len(fl))
open(OUT, 'w').write('/* Afterstreet sounds: made by tools/build_sounds.py, do not edit by hand */\n(window.ART = window.ART || {}).sounds = ' + json.dumps(out, separators=(',', ':')) + ';\n')
print(round(os.path.getsize(OUT)/1e6, 2), 'MB')
