#!/usr/bin/env python3
"""Afterstreet UI icons (19 October 2026): buttons, damage arrow, low-health vignette and the status set, in the same
field-journal style as assets/weapons/*.svg (128 x 128, ink outline #3d3029 at 2.5, flat fills, the 'cel' shade and rim,
a soft ground shadow). Writes assets/ui/*.svg and assets/ui/preview.html. Run: python3 assets/shaped/src/ui_icons.py"""
import os
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, '..', '..', 'ui'); os.makedirs(OUT, exist_ok=True)
INK = '#3d3029'
DEFS = ('<defs><filter id="cel" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feMorphology in="SourceAlpha" operator="erode" radius="1.6" result="in"/>'
        '<feOffset in="in" dx="-7" dy="-8" result="o"/><feComposite in="in" in2="o" operator="out" result="band"/><feFlood flood-color="#5b2f3a" flood-opacity=".26"/>'
        '<feComposite in2="band" operator="in" result="shade"/><feOffset in="in" dx="2.5" dy="3" result="o2"/><feComposite in="in" in2="o2" operator="out" result="rimA"/>'
        '<feFlood flood-color="#fff6e0" flood-opacity=".75"/><feComposite in2="rimA" operator="in" result="rim"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="shade"/><feMergeNode in="rim"/></feMerge></filter></defs>')
def svg(body, shadow=True):
    sh = '<ellipse cx="64" cy="118" rx="44" ry="6" fill="%s" opacity=".14"/>' % INK if shadow else ''
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">' + DEFS + sh +
            '<g stroke="%s" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">' % INK + body + '</g></svg>')
F = 'filter="url(#cel)"'
I = {}
# ---- buttons ----
I['jump'] = svg(f'<path d="M64 14 L92 46 L76 46 L76 74 L52 74 L52 46 L36 46 Z" fill="#e0a040" {F}/><path d="M30 98 Q64 84 98 98" fill="none"/><path d="M40 108 L88 108" fill="none" opacity=".5"/>')
I['build'] = svg(f'<g transform="rotate(-35 64 64)"><rect x="58" y="40" width="12" height="70" rx="5" fill="#b08c62" {F}/><path d="M38 22 L90 22 L90 44 L38 44 Z" fill="#8f969e" {F}/></g>'
                 f'<path d="M20 100 L56 100 L56 86 L20 86 Z" fill="#c8a87a" {F}/><path d="M24 86 L24 74 L52 74 L52 86" fill="#a8885a" {F}/>')
I['back'] = svg(f'<path d="M58 24 L18 60 L58 96 L58 74 Q92 74 108 102 Q104 50 58 46 Z" fill="#e8dfc6" {F}/>')
I['damage_arrow'] = svg(f'<path d="M64 10 L104 70 L80 64 L64 118 L48 64 L24 70 Z" fill="#b8322a" {F}/>', shadow=False)
# ---- status ----
I['bleeding'] = svg(f'<path d="M64 12 Q92 52 92 76 A28 28 0 0 1 36 76 Q36 52 64 12 Z" fill="#a8322a" {F}/><path d="M52 74 Q52 88 62 94" fill="none" stroke="#fff6e0" opacity=".7"/>')
I['infected'] = svg(f'<circle cx="64" cy="64" r="30" fill="#7a9a3a" {F}/>' + ''.join(f'<path d="M{64 + 30*c:.0f} {64 + 30*s:.0f} L{64 + 46*c:.0f} {64 + 46*s:.0f}" fill="none"/><circle cx="{64 + 50*c:.0f}" cy="{64 + 50*s:.0f}" r="6" fill="#7a9a3a"/>'
                    for c, s in ((1, 0), (-1, 0), (0, 1), (0, -1), (0.7, 0.7), (-0.7, 0.7), (0.7, -0.7), (-0.7, -0.7))) + '<circle cx="56" cy="58" r="6" fill="#4c6a24"/><circle cx="72" cy="72" r="5" fill="#4c6a24"/>')
I['broken_leg'] = svg(f'<path d="M50 10 L64 10 L68 54 L56 54 Z" fill="#e8dfc6" {F}/><path d="M56 62 L68 62 L70 104 L84 104 L84 116 L58 116 Z" fill="#e8dfc6" {F}/>'
                      '<path d="M50 56 L58 50 L64 58 L72 52 L78 58" fill="none" stroke="#b8322a" stroke-width="4"/>')
I['wet'] = svg(f'<path d="M44 20 Q62 50 62 64 A18 18 0 0 1 26 64 Q26 50 44 20 Z" fill="#6a9ac0" {F}/><path d="M86 44 Q100 66 100 76 A14 14 0 0 1 72 76 Q72 66 86 44 Z" fill="#6a9ac0" {F}/>'
               f'<path d="M64 80 Q74 96 74 102 A10 10 0 0 1 54 102 Q54 96 64 80 Z" fill="#8ab8d8" {F}/>')
I['cold'] = svg(''.join(f'<path d="M64 64 L{64 + 46*c:.0f} {64 + 46*s:.0f}" fill="none" stroke-width="7" stroke="#8ab8d8"/>' for c, s in ((1, 0), (-1, 0), (0.5, 0.87), (-0.5, 0.87), (0.5, -0.87), (-0.5, -0.87)))
                + ''.join(f'<path d="M64 64 L{64 + 46*c:.0f} {64 + 46*s:.0f}" fill="none"/>' for c, s in ((1, 0), (-1, 0), (0.5, 0.87), (-0.5, 0.87), (0.5, -0.87), (-0.5, -0.87))) + f'<circle cx="64" cy="64" r="10" fill="#e8f2f6" {F}/>')
I['hot'] = svg(f'<circle cx="64" cy="60" r="24" fill="#e0a040" {F}/>' + ''.join(f'<path d="M{64 + 32*c:.0f} {60 + 32*s:.0f} L{64 + 44*c:.0f} {60 + 44*s:.0f}" fill="none" stroke-width="4"/>'
                for c, s in ((1, 0), (-1, 0), (0, -1), (0.7, 0.7), (-0.7, 0.7), (0.7, -0.7), (-0.7, -0.7))) + '<path d="M44 104 Q54 96 64 104 Q74 112 84 104" fill="none" stroke="#b8322a"/>')
I['hungry'] = svg(f'<path d="M30 54 L98 54 Q98 98 64 104 Q30 98 30 54 Z" fill="#c8bca8" {F}/><path d="M26 54 L102 54" fill="none"/><path d="M84 18 L84 46 M78 18 L78 34 Q78 40 84 40 Q90 40 90 34 L90 18" fill="none"/>'
                  '<path d="M46 74 Q64 66 82 74" fill="none" opacity=".5"/>')
I['thirsty'] = svg(f'<path d="M50 14 L78 14 L78 26 Q92 34 92 52 L92 108 Q92 114 86 114 L42 114 Q36 114 36 108 L36 52 Q36 34 50 26 Z" fill="#c8dce6" {F}/>'
                   '<path d="M40 96 L88 96 L88 108 L40 108 Z" fill="#6a9ac0"/><rect x="48" y="8" width="32" height="10" rx="2" fill="#3e5a7a"/>')
I['tired'] = svg(f'<path d="M84 22 A40 40 0 1 0 104 80 A32 32 0 1 1 84 22 Z" fill="#e8dfc6" {F}/><path d="M20 26 L36 26 L20 44 L36 44" fill="none"/><path d="M38 52 L48 52 L38 64 L48 64" fill="none"/>')
I['sick'] = svg(f'<circle cx="64" cy="62" r="40" fill="#a8b86a" {F}/><path d="M44 52 L56 56 M84 52 L72 56" fill="none"/><path d="M46 84 Q52 76 58 84 Q64 92 70 84 Q76 76 82 84" fill="none"/>'
                '<path d="M92 74 Q100 86 100 92 A8 8 0 0 1 84 92 Q84 86 92 74 Z" fill="#8ab8d8"/>')
# ---- low-health vignette: a full-screen overlay (stretch to the screen; the middle stays clear) ----
VIG = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100" preserveAspectRatio="none" width="1600" height="1000"><defs><radialGradient id="v" cx="50%" cy="50%" r="72%">'
       '<stop offset="55%" stop-color="#5a0e0c" stop-opacity="0"/><stop offset="85%" stop-color="#5a0e0c" stop-opacity=".45"/><stop offset="100%" stop-color="#2a0606" stop-opacity=".8"/></radialGradient></defs>'
       '<rect width="160" height="100" fill="url(#v)"/>'
       + ''.join(f'<path d="M{x} {y} Q{x + dx*0.5:.1f} {y + dy*0.5 + 3:.1f} {x + dx} {y + dy}" stroke="#2a0606" stroke-width="0.6" fill="none" opacity=".45"/>' for x, y, dx, dy in ((0, 12, 14, 6), (0, 70, 16, -4), (160, 20, -15, 7), (160, 80, -13, -6), (40, 0, 4, 10), (120, 100, -5, -10)))
       + '</svg>')
for k, v in I.items(): open(os.path.join(OUT, k + '.svg'), 'w').write(v)
open(os.path.join(OUT, 'low_health_vignette.svg'), 'w').write(VIG)
cards = ''.join(f'<figure><img src="{k}.svg" alt=""><figcaption>{k.replace("_", " ")}</figcaption></figure>' for k in I)
open(os.path.join(OUT, 'preview.html'), 'w').write('<!doctype html><meta charset="utf-8"><title>UI icons</title><style>body{margin:0;padding:16px;background:#e8dfc6;font:13px system-ui;color:#3d3029}'
    'main{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:12px}figure{margin:0;background:#f4ecd8;border:1.5px solid #3d3029;border-radius:10px;padding:8px;text-align:center}'
    'img{width:96px;height:96px}.vig{position:relative;height:220px;margin-top:16px;border-radius:10px;overflow:hidden;background:#6d7a4f}.vig img{position:absolute;inset:0;width:100%;height:100%}</style>'
    f'<main>{cards}</main><div class="vig"><img src="low_health_vignette.svg" alt=""></div>')
print(len(I) + 1, 'icons written to', os.path.relpath(OUT))
