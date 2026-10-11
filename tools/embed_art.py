#!/usr/bin/env python3
"""Embeds tools/out/{atlas.png,icons.png,springfield.lbmap.json,models.txt} into play.html between the ART markers."""
import base64, os
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'); p = os.path.join(R, 'play.html'); s = open(p).read()
def put(key, data):
    global s
    a, b = '<!--ART:%s-->' % key, '<!--/ART:%s-->' % key; i, j = s.index(a) + len(a), s.index(b)
    s = s[:i] + data + s[j:]
put('atlas', base64.b64encode(open(os.path.join(R, 'tools/out/atlas.png'), 'rb').read()).decode())
put('icons', base64.b64encode(open(os.path.join(R, 'tools/out/icons.png'), 'rb').read()).decode())
m = open(os.path.join(R, 'tools/out/springfield.lbmap.json')).read()
assert '</script' not in m and '<!--' not in m
put('map', m)
put('models', open(os.path.join(R, 'tools/out/models.txt')).read())
put('creatures', open(os.path.join(R, 'tools/out/creatures.txt')).read())
open(p, 'w').write(s); print('play.html', round(len(s)/1e6, 2), 'MB')
