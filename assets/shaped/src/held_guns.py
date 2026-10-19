# Guns, bows and ammo for the held pack (exec'd by held.py, which provides W, INFO, PALETTE, G and the kit helpers).
# Same layout as every held weapon: the grip (where the right fist closes) at the origin, the barrel along +Z, +Y up.
# Long guns run back to the shoulder along -Z; the left hand holds the fore-end at INFO[name]['offhandAt'] metres along +Z.
PALETTE.update({'orange': '#d8742a', 'orangeD': '#a8541c', 'olive': '#5a6340', 'oliveD': '#434a30', 'card': '#b89a6a', 'cardD': '#8e7450',
                'shellRed': '#a8322a', 'shellGreen': '#3f6a3a', 'lead': '#6e6a64', 'fletch': '#d8d0b8', 'fletchR': '#b84a3a', 'string': '#e0d8c4',
                'label': '#e8e0cc', 'flare': '#ff6a4a', 'flareCore': '#ffd0b8'})

def rx(p, pivot, deg):
    """turn a point about the X axis through pivot (positive tips +Z towards -Y, i.e. muzzle down)"""
    a = math.radians(deg); y, z = p[1] - pivot[1], p[2] - pivot[2]
    return [p[0], pivot[1] + y*math.cos(a) - z*math.sin(a), pivot[2] + y*math.sin(a) + z*math.cos(a)]
def barrel(z0, z1, r, y=0.04, x=0.0, c='steelD', n=6, caps=(True, True)):
    return loft([[x, y, z0, r, r], [x, y, z1, r, r]], c, ax='z', n=n, caps=list(caps))
def stock(z_butt, z_wrist, c='wood', drop=0.0, h=0.06):
    """a shoulder stock: tall and thin at the butt, narrow at the wrist just behind the grip"""
    return zfr([[0, -0.035 - drop, z_butt, 0.02, h], [0, -0.01 - drop*0.3, z_butt + 0.12, 0.018, h*0.65], [0, 0.0, z_wrist, 0.016, 0.026]], c)
def pistol_grip(c, back=0.035, down=0.1, w=0.015):
    return hull([(-w, 0.01, -0.03), (w, 0.01, -0.03), (w, 0.01, 0.015), (-w, 0.01, 0.015),
                 (-w, -down, -0.03 - back), (w, -down, -0.03 - back), (w, -down, 0.0 - back*0.6), (-w, -down, 0.0 - back*0.6)], c)
def guard(z=0.03, y=-0.012):
    return [box([0, y - 0.016, z], [0.008, 0.004, 0.06], 'black'), box([0, y - 0.006, z - 0.004], [0.006, 0.018, 0.004], 'black')]
def flash_at(y, z, s=1.0):
    return [flat([(0, y + 0.05*s*math.sin(a), z + 0.01 + 0.05*s*math.cos(a)) for a in (0, 1.2, 2.5, 3.8, 5.0)], 'flash', (0, 0, 1), **G),
            tip([0, y, z], [0, y, z + 0.12*s], 0.03*s, 0.03*s, 'flash', **G), tip([0, y, z], [0, y, z + 0.05*s], 0.015*s, 0.015*s, 'flashCore', **G)]
def rust(x, y0, z0, y1, z1, side=1):
    return flat([(x, y0, z0), (x, y1, z0 + (z1 - z0)*0.2), (x, y1, z1), (x, y0, z1 - (z1 - z0)*0.25)], 'rust', (side, 0, 0))
def tape_z(z, y, a, b, c='tape'):
    return frustum([[0, y, z - 0.012, a + 0.003, b + 0.003], [0, y, z + 0.012, a + 0.003, b + 0.003]], c, ax='z', caps=[False, False])
def gun(name, states, length, offhand=None, muzzle=None, note='', lift=0.03, roll=90, ammo=None, cap=None, rate=None):
    W[name] = states
    INFO[name] = {'length': length, 'ground': {'roll': roll, 'yaw': 0, 'lift': lift}, 'note': note}
    if offhand is not None: INFO[name]['offhandAt'] = offhand
    if muzzle: INFO[name]['muzzle'] = muzzle
    if ammo: INFO[name]['ammo'] = ammo
    if cap: INFO[name]['holds'] = cap

# ---------- revolver: six-sided cylinder, wooden grip ----------
def revolver(state):
    cx = 0.04 if state == 'open' else 0.0
    o = [barrel(0.05, 0.2, 0.009, 0.035, c='steel'), box([0, 0.047, 0.12], [0.008, 0.006, 0.16], 'steelD'),
         box([0, 0.027, -0.005], [0.024, 0.05, 0.11], 'steel'),
         loft([[cx, 0.03, 0.0, 0.023, 0.023], [cx, 0.03, 0.048, 0.023, 0.023]], 'steelD', ax='z', n=6),
         hull([(-0.014, 0.0, -0.06), (0.014, 0.0, -0.06), (0.014, 0.0, -0.02), (-0.014, 0.0, -0.02),
               (-0.016, -0.1, -0.1), (0.016, -0.1, -0.1), (0.016, -0.1, -0.055), (-0.016, -0.1, -0.055)], 'wood'),
         box([0, 0.058, -0.055], [0.008, 0.02, 0.016], 'steelD'), box([0, 0.054, 0.195], [0.003, 0.008, 0.006], 'black')] + guard(0.01, 0.002)
    if state == 'worn': o += [rust(0.0245, 0.01, -0.04, 0.04, 0.03), tape_z(-0.07, -0.04, 0.016, 0.02)]
    if state == 'open': o += [box([cx, 0.0, 0.025], [0.003, 0.03, 0.006], 'steel')]
    return o
gun('revolver', {'new': revolver('new'), 'worn': revolver('worn'), 'open': revolver('open'), 'flash': flash_at(0.035, 0.2, 0.9)},
    0.3, muzzle=[0, 0.035, 0.2], ammo='pistol_round', cap=6, note='one hand; open = cylinder swung out to +X for reloading; no shell is thrown')

# ---------- hunting rifle: bolt action, wood stock, scope ----------
def hunting_rifle(state):
    o = [stock(-0.42, -0.02), zfr([[0, 0.0, -0.02, 0.017, 0.026], [0, 0.005, 0.38, 0.019, 0.022], [0, 0.015, 0.44, 0.014, 0.014]], 'wood'),
         pistol_grip('wood', 0.03, 0.07), box([0, 0.038, 0.07], [0.026, 0.028, 0.2], 'steelD'), barrel(0.17, 0.68, 0.01, 0.04, c='steel'),
         loft([[0, 0.086, -0.04, 0.017, 0.017], [0, 0.086, 0.0, 0.012, 0.012], [0, 0.086, 0.15, 0.012, 0.012], [0, 0.086, 0.19, 0.02, 0.02]], 'black', ax='z', n=6),
         box([0, 0.062, 0.02], [0.012, 0.022, 0.014], 'black'), box([0, 0.062, 0.13], [0.012, 0.022, 0.014], 'black'),
         box([0, -0.064, -0.42], [0.042, 0.13, 0.016], 'black')] + guard(0.04, -0.012)
    if state == 'bolt_open': o += [box([-0.03, 0.06, 0.0], [0.03, 0.01, 0.01], 'steel'), box([-0.045, 0.072, 0.0], [0.016, 0.016, 0.016], 'steel'), box([0, 0.038, -0.03], [0.016, 0.016, 0.06], 'steel')]
    else: o += [box([-0.04, 0.036, 0.03], [0.03, 0.01, 0.01], 'steel'), box([-0.055, 0.03, 0.03], [0.016, 0.016, 0.016], 'steel')]
    if state == 'worn': o += [rust(0.027, 0.03, 0.0, 0.05, 0.14), tape_z(0.3, 0.005, 0.019, 0.022), tape_z(-0.25, -0.03, 0.02, 0.05, 'tapeD'), rust(0.0105, 0.035, 0.4, 0.045, 0.6)]
    return o
gun('hunting_rifle', {'new': hunting_rifle('new'), 'worn': hunting_rifle('worn'), 'bolt_open': hunting_rifle('bolt_open'), 'flash': flash_at(0.04, 0.68, 1.1)},
    1.1, offhand=0.28, muzzle=[0, 0.04, 0.68], ammo='rifle_round', cap=5, note='two hands, butt to the shoulder; bolt_open between shots (throws a rifle_case to +X); scope line is y = 0.086')

# ---------- pump shotgun: black polymer, tube under the barrel, sliding fore-end ----------
def pump(state):
    k = -0.09 if state == 'pumped' else 0.0
    o = [stock(-0.4, -0.02, 'polymer'), pistol_grip('polymer', 0.035, 0.08), box([0, 0.03, 0.08], [0.03, 0.062, 0.2], 'black'),
         barrel(0.18, 0.64, 0.012, 0.046), barrel(0.18, 0.56, 0.01, 0.014, c='black'),
         zfr([[0, 0.012, 0.25 + k, 0.022, 0.02], [0, 0.012, 0.42 + k, 0.022, 0.02]], 'handle'),
         box([0, 0.06, 0.63], [0.004, 0.006, 0.006], 'brass'), box([0, 0.018, 0.56], [0.026, 0.02, 0.016], 'black')] + guard(0.04, -0.03)
    if state == 'worn': o += [tape_z(0.33, 0.012, 0.022, 0.02, 'tapeD'), rust(0.0301, 0.0, 0.0, 0.03, 0.12), rust(0.0121, 0.04, 0.45, 0.052, 0.6)]
    return o
gun('pump_shotgun', {'new': pump('new'), 'worn': pump('worn'), 'pumped': pump('pumped'), 'flash': flash_at(0.046, 0.64, 1.4)},
    1.04, offhand=0.33, muzzle=[0, 0.046, 0.64], ammo='shotgun_shell', cap=5, note='two hands; pumped = fore-end pulled back (throws a shotgun_hull to +X)')

# ---------- double-barrel shotgun: side by side, wood, breaks open ----------
def double(state):
    piv = [0, 0.02, 0.15]; ang = 28 if state == 'open' else 0
    def R(p): return rx(p, piv, ang)
    o = [stock(-0.4, -0.02), pistol_grip('wood', 0.04, 0.07), box([0, 0.025, 0.07], [0.04, 0.05, 0.16], 'steel')]
    for x in (0.012, -0.012):
        a, b = R([x, 0.04, 0.15]), R([x, 0.04, 0.66])
        o.append(loft([[*a, 0.012, 0.012], [*b, 0.012, 0.012]], 'steelD', ax='z', n=6))
    a, b = R([0, 0.018, 0.16]), R([0, 0.018, 0.4])
    o.append(frustum([[*a, 0.022, 0.014], [*b, 0.02, 0.012]], 'wood', ax='z'))
    o += guard(0.03, -0.022) + [box([0, 0.06, -0.01], [0.018, 0.012, 0.02], 'steelD')]
    if state == 'worn': o += [tape_z(-0.2, -0.02, 0.02, 0.045), rust(0.0405, 0.01, 0.0, 0.04, 0.12)]
    return o
gun('double_barrel', {'new': double('new'), 'worn': double('worn'), 'open': double('open'), 'flash': flash_at(0.04, 0.66, 1.5)},
    1.06, offhand=0.28, muzzle=[0, 0.04, 0.66], ammo='shotgun_shell', cap=2, note='two hands; open = barrels tipped 28 degrees down about (0, 0.02, 0.15) for loading, two shotgun_hull fall out')

# ---------- carbine: boxy semi-automatic rifle with a curved magazine ----------
def carbine(state):
    o = [box([0, 0.04, 0.08], [0.03, 0.07, 0.32], 'polymer'), box([0, 0.082, 0.08], [0.018, 0.014, 0.3], 'black'),
         zfr([[0, 0.03, -0.08, 0.015, 0.03], [0, 0.0, -0.38, 0.02, 0.062]], 'black'), pistol_grip('black', 0.03, 0.1),
         zfr([[0, 0.045, 0.24, 0.024, 0.028], [0, 0.045, 0.48, 0.022, 0.026]], 'polymer'), barrel(0.48, 0.62, 0.008, 0.045),
         box([0, 0.095, 0.46], [0.006, 0.05, 0.012], 'black'), box([0.01, 0.096, -0.06], [0.006, 0.018, 0.02], 'black'), box([-0.01, 0.096, -0.06], [0.006, 0.018, 0.02], 'black')] + guard(0.03, -0.0)
    if state != 'empty':
        o.append(hull([(-0.012, 0.006, 0.07), (0.012, 0.006, 0.07), (0.012, 0.006, 0.13), (-0.012, 0.006, 0.13),
                       (-0.012, -0.17, 0.12), (0.012, -0.17, 0.12), (0.012, -0.17, 0.17), (-0.012, -0.17, 0.17)], 'steelD'))
    if state == 'worn': o += [tape_z(0.36, 0.045, 0.024, 0.028, 'tapeD'), rust(0.0305, 0.02, 0.0, 0.05, 0.12), tape_z(-0.25, 0.012, 0.018, 0.048)]
    return o
gun('carbine', {'new': carbine('new'), 'worn': carbine('worn'), 'empty': carbine('empty'), 'flash': flash_at(0.045, 0.62, 1.1)},
    1.0, offhand=0.36, muzzle=[0, 0.045, 0.62], ammo='rifle_round', cap=20, note='two hands; empty = magazine out (show a carbine_magazine in the left hand while reloading); throws a rifle_case to +X each shot')

# ---------- flare gun: stubby orange signal pistol ----------
def flare_gun(state):
    o = [barrel(-0.02, 0.17, 0.02, 0.04, c='orange', n=6), box([0, 0.02, -0.02], [0.03, 0.05, 0.06], 'orange'),
         hull([(-0.014, 0.0, -0.05), (0.014, 0.0, -0.05), (0.014, 0.0, -0.005), (-0.014, 0.0, -0.005),
               (-0.016, -0.09, -0.08), (0.016, -0.09, -0.08), (0.016, -0.09, -0.04), (-0.016, -0.09, -0.04)], 'orangeD'),
         box([0, 0.06, -0.045], [0.008, 0.016, 0.014], 'black')] + guard(0.0, 0.0)
    if state == 'worn': o += [flat([(0.0201, 0.03, 0.04), (0.0201, 0.05, 0.06), (0.0201, 0.045, 0.12), (0.0201, 0.025, 0.1)], 'chip', (1, 0, 0))]
    return o
gun('flare_gun', {'new': flare_gun('new'), 'worn': flare_gun('worn'),
                  'flash': [tip([0, 0.04, 0.17], [0, 0.04, 0.3], 0.035, 0.035, 'flare', **G), tip([0, 0.04, 0.17], [0, 0.04, 0.22], 0.018, 0.018, 'flareCore', **G)]},
    0.2, muzzle=[0, 0.04, 0.17], ammo='flare_shell', cap=1, note='one hand; fires the flare that fx.flare_glow already draws')

# ---------- recurve bow and arrows: held upright at the grip, arrow along +Z ----------
def arrow(z0=-0.62, z1=0.12, x=0.0, y=0.0):
    return [barrel(z0, z1 - 0.04, 0.0045, y, x, 'wood', 4), tip([x, y, z1 - 0.04], [x, y, z1], 0.008, 0.008, 'steel', ax='z'),
            flat([(x, y, z0 + 0.01), (x, y + 0.022, z0 + 0.03), (x, y + 0.022, z0 + 0.1), (x, y, z0 + 0.1)], 'fletchR', (1, 0, 0), both=True),
            flat([(x, y, z0 + 0.01), (x + 0.02, y - 0.012, z0 + 0.03), (x + 0.02, y - 0.012, z0 + 0.1), (x, y, z0 + 0.1)], 'fletch', (0, 0, 1), both=True)]
def bow(state):
    pull = -0.6 if state == 'drawn' else -0.12
    bend = 0.05 if state == 'drawn' else 0.0
    o = [box([0, 0, 0], [0.026, 0.12, 0.036], 'grip')]
    tips = []
    for sg in (1, -1):
        p0, p1, p2 = [0, sg*0.06, 0.0], [0, sg*0.42, -0.06 - bend], [0, sg*0.62 - sg*bend, 0.0 - bend*1.6]
        o += [seg(p0, p1, 0.012, 0.016, 0.01, 0.008, 'woodD', ax='y'), seg(p1, p2, 0.01, 0.008, 0.006, 0.005, 'woodD', ax='y')]
        tips.append(p2)
    nock = [0, 0, pull]
    o += [seg(t, nock, 0.002, 0.002, 0.002, 0.002, 'string', caps=(False, False)) for t in tips]
    if state == 'drawn': o += arrow(-0.62, 0.12, 0.016, 0.0)
    if state == 'worn': o += [tape_z(0.0, 0.0, 0.016, 0.06), flat([(0.007, 0.3, -0.04), (0.007, 0.34, -0.05), (0.007, 0.36, -0.045)], 'chip', (1, 0, 0))]
    return o
gun('recurve_bow', {'new': bow('new'), 'worn': bow('worn'), 'drawn': bow('drawn')},
    1.24, ammo='arrow', cap=1, roll=0, lift=0.02, note='held upright in the left hand in real life; here the grip is at the origin so it uses the same hand point. drawn = string at the cheek with an arrow nocked (silent, the aliens do not hear it)')

# ---------- crossbow ----------
def crossbow(state):
    loaded = state == 'loaded'
    o = [zfr([[0, -0.02, -0.34, 0.018, 0.05], [0, 0.0, -0.04, 0.016, 0.026], [0, 0.02, 0.38, 0.016, 0.018]], 'black'), pistol_grip('polymer', 0.03, 0.08),
         box([0, 0.042, 0.18], [0.01, 0.006, 0.4], 'steelD'), box([0, 0.03, 0.4], [0.06, 0.04, 0.04], 'polymer'),
         box([0, 0.065, 0.0], [0.024, 0.02, 0.06], 'polymer')] + guard(0.02, -0.01)
    tips = []
    for sg in (1, -1):
        p0, p1 = [sg*0.03, 0.03, 0.4], [sg*0.3, 0.03, 0.34 if loaded else 0.38]
        o.append(seg(p0, p1, 0.028, 0.01, 0.014, 0.007, 'steelD', ax='x', caps=(False, True))); tips.append(p1)
    nz = 0.02 if loaded else 0.36
    o += [seg(t, [0, 0.048, nz], 0.002, 0.002, 0.002, 0.002, 'string', caps=(False, False)) for t in tips]
    o += [box([0, 0.112, 0.36], [0.006, 0.03, 0.008], 'black'), loft([[0, 0.1, -0.02, 0.012, 0.012], [0, 0.1, 0.06, 0.012, 0.012]], 'black', ax='z', n=6)]
    if loaded: o += [barrel(0.03, 0.42, 0.005, 0.054, c='lead', n=4), tip([0, 0.054, 0.42], [0, 0.054, 0.46], 0.009, 0.009, 'steel', ax='z'),
                     flat([(0, 0.054, 0.04), (0, 0.074, 0.06), (0, 0.074, 0.1), (0, 0.054, 0.1)], 'fletchR', (1, 0, 0), both=True)]
    if state == 'worn': o += [tape_z(-0.2, -0.01, 0.018, 0.04), rust(0.0105, 0.04, 0.05, 0.046, 0.25)]
    return o
gun('crossbow', {'new': crossbow('new'), 'worn': crossbow('worn'), 'loaded': crossbow('loaded')},
    0.8, offhand=0.22, ammo='crossbow_bolt', cap=1, note='two hands; new = string forward (unloaded), loaded = string cocked with a bolt on the rail; silent')

# ---------- casings thrown out on a shot (show for half a second, then drop) ----------
W['pistol']['shell'] = [loft([[0, 0, -0.01, 0.0045, 0.0045], [0, 0, 0.01, 0.0045, 0.0045]], 'brass', ax='z', n=6)]
CASES = {
  'pistol_case': W['pistol']['shell'],
  'rifle_case': [loft([[0, 0, -0.025, 0.006, 0.006], [0, 0, 0.012, 0.006, 0.006], [0, 0, 0.02, 0.0035, 0.0035], [0, 0, 0.028, 0.0035, 0.0035]], 'brass', ax='z', n=6)],
  'shotgun_hull': [loft([[0, 0, -0.03, 0.0105, 0.0105], [0, 0, -0.02, 0.0105, 0.0105]], 'brass', ax='z', n=6, caps=[True, False]),
                   loft([[0, 0, -0.02, 0.0095, 0.0095], [0, 0, 0.035, 0.0095, 0.0095]], 'shellRed', ax='z', n=6, caps=[False, True])],
}

# ---------- ammo: loose single rounds, boxes, magazines, arrows (on the ground: origin at the centre of the base, front +Z) ----------
def rnd(x, z, kind, up=False, yaw=0.0):
    """one round lying on its side (or standing up)"""
    if kind == 'shotgun_shell':
        L, r, cb = 0.065, 0.0095, 'shellRed'
        if up: return [cyl([x, 0.006, z], [0.021, 0.012, 0.021], 'brass'), cyl([x, 0.012 + L/2, z], [0.019, L - 0.012, 0.019], cb)]
        return [loft([[x, r, z - L/2, r + 0.001, r + 0.001], [x, r, z - L/2 + 0.012, r + 0.001, r + 0.001]], 'brass', ax='z', n=6), loft([[x, r, z - L/2 + 0.012, r, r], [x, r, z + L/2, r, r]], cb, ax='z', n=6, caps=[False, True])]
    L, r = (0.075, 0.006) if kind == 'rifle_round' else (0.03, 0.0048)
    if up: return [cyl([x, L*0.33, z], [r*2, L*0.66, r*2], 'brass'), loft([[x, L*0.66, z, r*0.9, r*0.9], [x, L, z, 0, 0]], 'lead', n=6, caps=[False, False])]
    return [loft([[x, r, z - L/2, r, r], [x, r, z + L*0.16, r, r]], 'brass', ax='z', n=6, caps=[True, False]), loft([[x, r, z + L*0.16, r*0.85, r*0.85], [x, r, z + L/2, 0, 0]], 'lead', ax='z', n=6, caps=[False, False])]
def card_box(w, h, d, c, band, label=True):
    o = [box([0, h/2, 0], [w, h, d], c), flat([(-w/2, h + 0.0005, -d*0.15), (w/2, h + 0.0005, -d*0.15), (w/2, h + 0.0005, d*0.15), (-w/2, h + 0.0005, d*0.15)], band, (0, 1, 0)),
         flat([(-w/2, h*0.2, d/2 + 0.0005), (w/2, h*0.2, d/2 + 0.0005), (w/2, h*0.8, d/2 + 0.0005), (-w/2, h*0.8, d/2 + 0.0005)], band, (0, 0, 1))]
    if label: o.append(flat([(-w*0.3, h*0.35, d/2 + 0.001), (w*0.3, h*0.35, d/2 + 0.001), (w*0.3, h*0.65, d/2 + 0.001), (-w*0.3, h*0.65, d/2 + 0.001)], 'label', (0, 0, 1)))
    return o
def mag(w, h, d, curve=0.0, c='steelD'):
    return [hull([(-w/2, 0, -d/2), (w/2, 0, -d/2), (w/2, 0, d/2), (-w/2, 0, d/2),
                  (-w/2, h, -d/2 + curve), (w/2, h, -d/2 + curve), (w/2, h, d/2 + curve), (-w/2, h, d/2 + curve)], c),
            box([0, h + 0.004, curve], [w*0.7, 0.008, d*0.8], 'brass')]
AMMO = {
  'pistol_round': rnd(0, 0, 'pistol_round'), 'rifle_round': rnd(0, 0, 'rifle_round'), 'shotgun_shell': rnd(0, 0, 'shotgun_shell'),
  'pistol_box': card_box(0.1, 0.034, 0.07, 'card', 'blue'),
  'rifle_box': card_box(0.11, 0.05, 0.075, 'cardD', 'shellGreen'),
  'shotgun_box': card_box(0.12, 0.07, 0.1, 'shellRed', 'label'),
  'pistol_magazine': mag(0.018, 0.11, 0.032, 0.0, 'black'),
  'carbine_magazine': mag(0.024, 0.17, 0.06, 0.05),
  'ammo_can': [box([0, 0.09, 0], [0.28, 0.18, 0.14], 'olive'), box([0, 0.186, 0], [0.29, 0.016, 0.15], 'oliveD'), box([0.0, 0.2, 0], [0.12, 0.012, 0.02], 'black'),
               box([0.145, 0.15, 0], [0.012, 0.04, 0.05], 'oliveD'), flat([(-0.1, 0.06, 0.0705), (0.1, 0.06, 0.0705), (0.1, 0.12, 0.0705), (-0.1, 0.12, 0.0705)], 'label', (0, 0, 1))],
  'flare_shells': card_box(0.09, 0.05, 0.06, 'orange', 'label', False) + [cyl([x, 0.06, z], [0.024, 0.02, 0.024], 'flare') for x in (-0.024, 0.024) for z in (-0.014, 0.014)],
  'arrow': [{**p, 'p': [p['p'][0], p['p'][1] + 0.006, p['p'][2] + 0.25]} for p in arrow(-0.62, 0.12)],
  'arrow_bundle': [p for i, (x, y) in enumerate(((0, 0.006), (0.012, 0.006), (-0.012, 0.006), (0.006, 0.016), (-0.006, 0.016))) for p in arrow(-0.62, 0.12, x, y)] + [tape_z(-0.2, 0.012, 0.02, 0.012, 'leather')],
  'quiver': [frustum([[0, 0.0, 0, 0.045, 0.04], [0, 0.55, 0, 0.055, 0.05]], 'leather', caps=[True, False]), box([0, 0.3, -0.05], [0.02, 0.5, 0.008], 'grip')]
            + [p for x, z in ((0.015, 0.01), (-0.02, 0.0), (0.0, -0.02)) for p in [loft([[x, 0.5, z, 0.0045, 0.0045], [x, 0.66, z, 0.0045, 0.0045]], 'wood', n=4),
               flat([(x, 0.58, z), (x + 0.022, 0.6, z), (x + 0.022, 0.66, z), (x, 0.66, z)], 'fletchR', (0, 0, 1), both=True)]],
  'crossbow_bolt': [barrel(-0.18, 0.18, 0.005, 0.006, c='lead', n=4), tip([0, 0.006, 0.18], [0, 0.006, 0.22], 0.009, 0.009, 'steel', ax='z'),
                    flat([(0, 0.006, -0.18), (0, 0.026, -0.16), (0, 0.026, -0.12), (0, 0.006, -0.12)], 'fletchR', (1, 0, 0), both=True)],
  'loose_pile': rnd(0.0, 0.0, 'pistol_round') + rnd(0.03, 0.02, 'pistol_round') + rnd(-0.02, 0.03, 'rifle_round') + rnd(0.02, -0.04, 'shotgun_shell') + rnd(-0.04, -0.02, 'pistol_round', True),
}
AMMO_INFO = {
  'pistol_round': 'fits pistol and revolver', 'rifle_round': 'fits hunting rifle and carbine', 'shotgun_shell': 'fits pump and double-barrel shotguns',
  'pistol_box': '20 pistol rounds', 'rifle_box': '20 rifle rounds', 'shotgun_box': '10 shells', 'pistol_magazine': 'full pistol magazine (pick up = 12 rounds)',
  'carbine_magazine': 'full carbine magazine (20 rounds)', 'ammo_can': 'military can: a large mixed find (police station, gun shop, army truck)',
  'flare_shells': 'four flare shells', 'arrow': 'one arrow, can be picked back up after a shot', 'arrow_bundle': 'five arrows', 'quiver': 'worn on the back or found: holds arrows',
  'crossbow_bolt': 'one bolt, reusable', 'loose_pile': 'a few mixed rounds spilled on the ground (searched drawers, dead survivors)',
}
