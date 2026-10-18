#!/usr/bin/env python3
"""Draws the clothing icons (0.40) into slots 31-40, and the seed packet (0.43) into slot 41, of the HUD icon strip, in the same flat outlined style as the lantern,
radio, generator and truck parts. Run after build_art.py and build_vehicles.py (each of them rewrites the strip up to its own slots).
Slot 6 (the design pack's rain jacket) is used for the rain jacket; the winter coat gets its own icon here.
Usage: python3 tools/draw_clothes.py"""
import os
from PIL import Image, ImageDraw
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
INK = (61, 48, 41, 255); LW = 14
def canvas():
    im = Image.new('RGBA', (384, 384)); d = ImageDraw.Draw(im); d.ellipse([40, 330, 344, 364], fill=(61, 48, 41, 60)); return im, d
def col(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (255,)
def jacket(body, trim, collar=None, zip_=True, fur=False):
    im, d = canvas()
    d.polygon([(110, 70), (274, 70), (340, 140), (318, 300), (286, 296), (290, 180), (270, 330), (114, 330), (94, 180), (98, 296), (66, 300), (44, 140)], fill=body, outline=INK)
    d.line([(110, 70), (274, 70), (340, 140), (318, 300), (286, 296), (290, 180), (270, 330), (114, 330), (94, 180), (98, 296), (66, 300), (44, 140), (110, 70)], fill=INK, width=LW, joint='curve')
    if fur: d.rounded_rectangle([104, 52, 280, 104], 26, fill=(235, 221, 197, 255), outline=INK, width=10)
    elif collar: d.polygon([(130, 70), (192, 140), (254, 70)], fill=collar, outline=INK); d.line([(130, 70), (192, 140), (254, 70)], fill=INK, width=10)
    if zip_: d.line([(192, 140 if collar or fur else 80), (192, 326)], fill=INK, width=8)
    d.rectangle([116, 300, 268, 326], fill=trim)
    return im
def sweater():
    im = jacket(col('7a8a5e'), col('5e6c48'), zip_=False)
    d = ImageDraw.Draw(im); d.ellipse([150, 56, 234, 104], fill=col('5e6c48'), outline=INK, width=10)
    for y in (170, 210): d.line([(110, y), (274, y)], fill=col('9aa87c'), width=10)
    return im
def beanie():
    im, d = canvas()
    d.chord([70, 70, 314, 330], 180, 360, fill=col('4f6f7a'), outline=INK, width=LW)
    d.rounded_rectangle([60, 190, 324, 270], 20, fill=col('3e5a63'), outline=INK, width=LW)
    for x in range(90, 300, 34): d.line([(x, 202), (x, 258)], fill=col('5f8590'), width=8)
    d.ellipse([160, 26, 224, 90], fill=col('d9603a'), outline=INK, width=10)
    return im
def cap():
    im, d = canvas()
    d.chord([70, 110, 290, 330], 180, 360, fill=col('8a5a3a'), outline=INK, width=LW)
    d.polygon([(200, 214), (350, 214), (330, 250), (200, 250)], fill=col('6e4630'), outline=INK); d.line([(200, 214), (350, 214), (330, 250), (200, 250)], fill=INK, width=10)
    d.line([(70, 220), (290, 220)], fill=INK, width=LW); d.ellipse([168, 96, 192, 120], fill=INK)
    return im
def helmet():
    im, d = canvas()
    d.chord([64, 70, 320, 330], 180, 360, fill=col('d9a845'), outline=INK, width=LW)
    d.rounded_rectangle([40, 196, 344, 238], 14, fill=col('c08e30'), outline=INK, width=LW)
    d.rounded_rectangle([170, 70, 214, 200], 12, fill=col('e8c060'), outline=INK, width=10)
    return im
def gloves():
    im, d = canvas()
    for ox, fl in ((0, False), (130, True)):
        pts = [(70, 320), (70, 150), (90, 110), (110, 150), (110, 96), (132, 80), (152, 96), (152, 150), (172, 120), (194, 140), (176, 230), (170, 320)]
        if fl: pts = [(384 - 90 - x + 20 - 130 + ox + 110, y) for x, y in pts]
        else: pts = [(x + ox, y) for x, y in pts]
        d.polygon(pts, fill=col('8a6a48'), outline=INK); d.line(pts + [pts[0]], fill=INK, width=LW, joint='curve')
        xs = [p[0] for p in pts]; d.rectangle([min(xs) + 4, 280, max(xs) - 30, 320], fill=col('6b4f34'))
    return im
def trousers(c1, c2):
    im, d = canvas()
    pts = [(104, 60), (280, 60), (300, 330), (218, 330), (192, 150), (166, 330), (84, 330)]
    d.polygon(pts, fill=c1, outline=INK); d.line(pts + [pts[0]], fill=INK, width=LW, joint='curve')
    d.rectangle([104, 60, 280, 92], fill=c2); d.line([(104, 92), (280, 92)], fill=INK, width=8)
    return im
def boots():
    im, d = canvas()
    for ox in (0, 150):
        pts = [(50 + ox, 90), (130 + ox, 90), (136 + ox, 230), (196 + ox, 260), (200 + ox, 320), (46 + ox, 320)]
        d.polygon(pts, fill=col('5a4028'), outline=INK); d.line(pts + [pts[0]], fill=INK, width=LW, joint='curve')
        d.rectangle([46 + ox, 296, 200 + ox, 320], fill=col('2e2420')); d.line([(56 + ox, 130), (124 + ox, 130)], fill=col('c9a24a'), width=8)
    return im
def seeds():
    im, d = canvas()
    d.rounded_rectangle([86, 40, 298, 330], 14, fill=col('e9dab0'), outline=INK, width=LW)
    d.rectangle([86, 40, 298, 92], fill=col('7a9a4a')); d.line([(86, 92), (298, 92)], fill=INK, width=8)
    d.ellipse([140, 150, 244, 254], fill=col('d9603a'), outline=INK, width=10)          # a tomato on the front
    d.polygon([(192, 140), (172, 160), (212, 160)], fill=col('5f9a3e'))
    for x, y in [(120, 290), (150, 300), (230, 296), (262, 286)]: d.ellipse([x - 9, y - 6, x + 9, y + 6], fill=col('a8743e'))
    return im
ICONS = [lambda: jacket(col('8a6f5a'), col('6e5646'), fur=True), beanie, cap, helmet, sweater,
         lambda: jacket(col('4a3a32'), col('2e2420'), collar=col('3a2c26')), gloves,
         lambda: trousers(col('5d6670'), col('454c54')), lambda: trousers(col('c9b8a0'), col('a8987e')), boots, seeds]
for s in ('lite', 'full'):
    p = os.path.join(OUT, s, 'icons.png')
    if not os.path.exists(p): continue
    old = Image.open(p).convert('RGBA'); new = Image.new('RGBA', (96*42, 96)); new.paste(old.crop((0, 0, min(old.width, 96*31), 96)), (0, 0))
    for k, f in enumerate(ICONS): new.paste(f().resize((96, 96), Image.LANCZOS), ((31 + k)*96, 0))
    new.save(p, optimize=True)
print('icons: clothes in slots 31-40, seed packet in 41')
