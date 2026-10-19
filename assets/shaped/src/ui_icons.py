#!/usr/bin/env python3
"""Afterstreet UI icons (19 October 2026): buttons, damage arrow, low-health vignette, the status set, and inventory icons for harvest materials, guns and ammo, in the same
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
# ---- section 10 harvest materials, guns and ammo (inventory icons) ----
W, WD, ST, STD, BL, BR = '#c8a46a', '#a8844e', '#a9b1b5', '#6f777c', '#2a2c30', '#9a5040'
I['planks'] = svg(''.join(f'<g transform="rotate(-18 64 64)"><rect x="14" y="{40 + i*16}" width="100" height="14" rx="2" fill="{W if i % 2 else WD}" {F}/></g>' for i in range(3)))
I['scrap_wood'] = svg(f'<path d="M18 80 L70 64 L74 76 L84 70 L80 84 L22 98 Z" fill="{W}" {F}/><path d="M50 40 L104 52 L100 66 L46 54 Z" fill="{WD}" {F}/><path d="M30 34 L46 30 L52 44 L34 50 Z" fill="{W}" {F}/>')
I['lumber'] = svg(f'<g transform="rotate(-25 64 64)"><rect x="8" y="58" width="112" height="16" fill="{WD}" {F}/><rect x="8" y="42" width="112" height="16" fill="{W}" {F}/><path d="M40 40 L40 76 M88 40 L88 76" fill="none" stroke="#7a6a5a" stroke-width="4"/></g>')
I['nails_handful'] = svg(''.join(f'<g transform="rotate({a} 64 64)"><path d="M{x} 30 L{x} 92" fill="none" stroke="{STD}" stroke-width="5"/><path d="M{x - 8} 30 L{x + 8} 30" fill="none" stroke="{STD}" stroke-width="6"/><path d="M{x} 92 L{x} 100" fill="none" stroke="{STD}" stroke-width="2"/></g>' for a, x in ((-30, 48), (10, 64), (40, 78), (-5, 86))))
I['steel_beam'] = svg(f'<g transform="rotate(-20 64 64)"><path d="M10 44 L118 44 L118 52 L68 52 L68 76 L118 76 L118 84 L10 84 L10 76 L60 76 L60 52 L10 52 Z" fill="{ST}" {F}/></g><path d="M74 40 L96 36 L94 46 Z" fill="#8c4a2e" stroke="none"/>')
I['rebar_bundle'] = svg(''.join(f'<path d="M12 {78 - i*8 + i*1} L116 {44 - i*8 + i*1}" fill="none" stroke="#7a4a32" stroke-width="7"/>' for i in range(5)) + '<path d="M38 48 L46 80 M84 34 L92 66" fill="none" stroke="#3d3029" stroke-width="6"/>')
I['sheet_metal'] = svg(f'<path d="M14 40 L104 30 L114 88 L24 98 Z" fill="{ST}" {F}/>' + ''.join(f'<path d="M{20 + i*15} {38 - i*1.6:.0f} L{30 + i*15} {96 - i*1.6:.0f}" fill="none" stroke="{STD}" stroke-width="3"/>' for i in range(6)))
I['concrete_chunk'] = svg(f'<path d="M20 90 L30 50 L60 34 L96 44 L108 80 L84 100 L40 104 Z" fill="#aaa69e" {F}/><path d="M60 34 L70 10 M84 42 L104 22" fill="none" stroke="#7a4a32" stroke-width="5"/><path d="M40 70 L52 62 L62 72" fill="none" opacity=".5"/>')
I['brick'] = svg(f'<path d="M14 60 L80 46 L114 60 L48 76 Z" fill="#b86a50" {F}/><path d="M14 60 L48 76 L48 100 L14 84 Z" fill="{BR}" {F}/><path d="M48 76 L114 60 L114 84 L48 100 Z" fill="#7a3c30" {F}/>')
I['glass_sheet'] = svg(f'<path d="M24 26 L100 20 L106 100 L30 106 Z" fill="#b8d4dc" {F}/><path d="M36 40 L60 36 M40 52 L80 48" fill="none" stroke="#fff6e0" stroke-width="3"/><path d="M80 80 L100 64 L104 92 Z" fill="#9cc4d0"/>')
I['wire_coil'] = svg('<ellipse cx="60" cy="64" rx="40" ry="34" fill="none" stroke="#b8743a" stroke-width="16"/><ellipse cx="60" cy="64" rx="40" ry="34" fill="none"/><ellipse cx="60" cy="64" rx="24" ry="18" fill="none"/><path d="M98 70 Q110 90 118 104" fill="none" stroke="#b8743a" stroke-width="5"/>')
I['plasterboard_scrap'] = svg(f'<path d="M20 34 L96 24 L108 66 L90 100 L28 96 Z" fill="#e8e4da" {F}/><path d="M96 24 L108 66 L114 64 L102 22 Z" fill="#c8c0b0"/>')
def gun_svg(body, rot=-20): return svg(f'<g transform="rotate({rot} 64 64)">{body}</g>')
I['pistol'] = gun_svg(f'<path d="M24 46 L104 46 L104 62 L56 62 L50 96 L30 96 L36 62 L24 62 Z" fill="{BL}" {F}/><path d="M52 62 Q56 76 64 70" fill="none"/>', -8)
I['revolver'] = gun_svg(f'<path d="M50 50 L114 50 L114 60 L50 60 Z" fill="#8f969e" {F}/><rect x="40" y="44" width="26" height="26" rx="4" fill="#5b6168" {F}/><path d="M38 58 L30 98 L50 100 L54 70 Z" fill="{W}" {F}/><path d="M40 40 L34 32" fill="none"/>', -8)
I['hunting_rifle'] = gun_svg(f'<path d="M6 74 L44 62 L56 62 L60 70 L100 64 L100 58 L60 58 L44 54 L6 60 Z" fill="{W}" {F}/><path d="M56 54 L124 50 L124 56 L56 60 Z" fill="#8f969e" {F}/><rect x="52" y="40" width="40" height="10" rx="4" fill="{BL}" {F}/><path d="M66 50 L66 54 M82 50 L82 54" fill="none"/>')
I['pump_shotgun'] = gun_svg(f'<path d="M6 76 L44 60 L60 60 L60 70 L48 70 L12 82 Z" fill="{BL}" {F}/><path d="M44 52 L72 52 L72 66 L44 66 Z" fill="{BL}" {F}/><path d="M72 54 L124 54 L124 60 L72 60 Z" fill="#5b6168" {F}/><rect x="80" y="60" width="24" height="10" rx="3" fill="#6b4526" {F}/>')
I['double_barrel'] = gun_svg(f'<path d="M6 76 L46 60 L58 60 L58 70 L46 70 L12 84 Z" fill="{W}" {F}/><path d="M46 52 L124 50 L124 62 L46 64 Z" fill="#5b6168" {F}/><path d="M50 58 L124 56" fill="none"/><path d="M58 64 L96 63 L96 70 L58 70 Z" fill="{WD}" {F}/>')
I['carbine'] = gun_svg(f'<path d="M8 72 L38 58 L38 66 L14 80 Z" fill="{BL}" {F}/><rect x="36" y="48" width="56" height="18" fill="#2a2c30" {F}/><rect x="92" y="52" width="26" height="10" fill="#3a3c40" {F}/><path d="M118 56 L126 56" fill="none" stroke-width="4"/>'
                      f'<path d="M62 66 L70 66 L80 96 L70 98 Z" fill="#5b6168" {F}/><path d="M46 66 L52 66 L48 86 L40 86 Z" fill="{BL}" {F}/>')
I['flare_gun'] = gun_svg(f'<path d="M30 46 L104 46 L104 66 L56 66 L50 98 L30 98 L36 66 L30 66 Z" fill="#d8742a" {F}/><circle cx="104" cy="56" r="10" fill="#a8541c" {F}/>', -8)
I['recurve_bow'] = svg(f'<path d="M44 10 Q84 40 70 64 Q84 88 44 118" fill="none" stroke="{WD}" stroke-width="9"/><path d="M44 10 Q84 40 70 64 Q84 88 44 118" fill="none"/><path d="M44 10 L44 118" fill="none" stroke-width="1.5"/><rect x="66" y="56" width="12" height="16" rx="3" fill="#3a2a20"/>')
I['crossbow'] = svg(f'<g transform="rotate(-30 64 64)"><rect x="10" y="58" width="96" height="12" rx="3" fill="{BL}" {F}/><path d="M96 20 Q110 64 96 108" fill="none" stroke="#5b6168" stroke-width="8"/><path d="M96 20 L54 64 L96 108" fill="none" stroke-width="1.5"/><path d="M56 60 L118 60" fill="none" stroke="#6e6a64" stroke-width="4"/></g>')
def rounds(c, tipc, n=3, long=40):
    return ''.join(f'<g transform="translate({30 + i*24} 0)"><rect x="0" y="{110 - long}" width="16" height="{long - 14}" fill="{c}" {F}/><path d="M0 {110 - long} Q8 {96 - long} 16 {110 - long} Z" fill="{tipc}"/><rect x="-1" y="96" width="18" height="6" fill="#a8823a"/></g>' for i in range(n))
I['pistol_ammo'] = svg(rounds('#c8a24a', '#6e6a64', 3, 36))
I['rifle_ammo'] = svg(rounds('#c8a24a', '#6e6a64', 3, 62))
I['shotgun_shells'] = svg(''.join(f'<g transform="translate({28 + i*26} 0)"><rect x="0" y="44" width="20" height="50" fill="#a8322a" {F}/><rect x="-1" y="90" width="22" height="12" fill="#c8a24a" {F}/></g>' for i in range(3)))
I['arrows'] = svg(''.join(f'<g transform="rotate({a} 64 64)"><path d="M64 8 L64 112" fill="none" stroke="{WD}" stroke-width="4"/><path d="M58 14 L64 2 L70 14 Z" fill="#8f969e"/><path d="M64 98 L56 116 M64 98 L72 116" fill="none" stroke="#b84a3a" stroke-width="5"/></g>' for a in (-30, 0, 30)))
I['crossbow_bolts'] = svg(''.join(f'<g transform="rotate({a} 64 64)"><path d="M64 26 L64 100" fill="none" stroke="#6e6a64" stroke-width="5"/><path d="M57 30 L64 16 L71 30 Z" fill="#8f969e"/><path d="M64 86 L72 102" fill="none" stroke="#b84a3a" stroke-width="5"/></g>' for a in (-35, 35)))
I['ammo_can'] = svg(f'<rect x="20" y="40" width="88" height="60" rx="4" fill="#5a6340" {F}/><rect x="16" y="34" width="96" height="12" rx="3" fill="#434a30" {F}/><rect x="48" y="24" width="32" height="8" rx="3" fill="{BL}"/><rect x="36" y="60" width="56" height="18" fill="#e8e0cc"/>')
I['magazine'] = svg(f'<path d="M48 20 L76 20 L88 106 L60 108 Z" fill="#434c54" {F}/><rect x="50" y="12" width="24" height="10" fill="#c8a24a"/>')
I['flare_shells'] = svg(''.join(f'<g transform="translate({30 + i*26} 0)"><rect x="0" y="44" width="20" height="52" fill="#d8742a" {F}/><rect x="0" y="38" width="20" height="10" fill="#ff6a4a"/><rect x="-1" y="92" width="22" height="10" fill="#c8a24a"/></g>' for i in range(3)))
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
