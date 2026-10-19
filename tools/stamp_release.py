#!/usr/bin/env python3
"""Stamp one version everywhere so an installed copy can never mix old and new files.
Run after editing the game or rebuilding map squares:  python3 tools/stamp_release.py [new_version]
 - assets/dataver.js   : DATAV = hash of every file in assets/springfield (squares are asked for as ?d=DATAV)
 - sw.js               : BUILD and DATAV constants (cache names + precache addresses)
 - play.html / README  : version text; checks they all agree
"""
import hashlib, os, re, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def rd(p): return open(os.path.join(root, p)).read()
def wr(p, s): open(os.path.join(root, p), 'w').write(s)
play = rd('play.html')
ver = sys.argv[1] if len(sys.argv) > 1 else re.search(r"var BUILD = '([\d.]+)'", play).group(1)
play = re.sub(r"var BUILD = '[\d.]+'", "var BUILD = '%s'" % ver, play)
play = re.sub(r'(id="verTxt">)[\d.]+', r'\g<1>' + ver, play)
wr('play.html', play)
h = hashlib.sha1(); d = os.path.join(root, 'assets', 'springfield')
for f in sorted(os.listdir(d)):
    h.update(f.encode()); h.update(open(os.path.join(d, f), 'rb').read())
h.update(open(os.path.join(root, 'assets', 'map.js'), 'rb').read())
dv = h.hexdigest()[:8]
wr('assets/dataver.js', "window.DATAV = '%s';\n" % dv)
sw = rd('sw.js')
sw = re.sub(r"var BUILD = '[^']*', DATAV = '[^']*'", "var BUILD = '%s', DATAV = '%s'" % (ver, dv), sw)
wr('sw.js', sw)
rm = rd('README.md'); rm = re.sub(r'Version [\d.]+\.', 'Version %s.' % ver, rm, count=1); wr('README.md', rm)
assert ("'%s'" % ver) in rd('sw.js') and ('BUILD = \'%s\'' % ver) in rd('play.html')
print('version', ver, 'map data', dv)
