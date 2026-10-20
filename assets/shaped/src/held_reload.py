# Art requests 11.4 (20 October 2026), exec'd by held.py after held_guns.py: first-person reload poses for every gun class, the
# states they need (pistol with its magazine out, flare gun broken open), a single flare shell, and arrows and bolts stuck in a target.
PALETTE.update({'flareShell': '#d8742a'})

# ---------- states the reloads need ----------
def pistol_empty():
    """slide locked back, magazine out: a dark mouth at the bottom of the grip"""
    o = [box([0, 0.03, 0.06], [0.03, 0.035, 0.19], 'polymer'), box([0, 0.054, 0.03], [0.028, 0.014, 0.19], 'black'),
         hull([(-0.014, 0.012, -0.03), (0.014, 0.012, -0.03), (0.014, 0.012, 0.02), (-0.014, 0.012, 0.02), (-0.014, -0.09, -0.06), (0.014, -0.09, -0.06), (0.014, -0.09, -0.015), (-0.014, -0.09, -0.015)], 'polymer'),
         flat([(-0.009, -0.0905, -0.055), (0.009, -0.0905, -0.055), (0.009, -0.0905, -0.022), (-0.009, -0.0905, -0.022)], 'ironD', (0, -1, 0)),
         box([0, -0.005, 0.035], [0.01, 0.006, 0.05], 'black'), box([0, -0.02, 0.06], [0.01, 0.03, 0.006], 'black'), box([0, 0.032, 0.164], [0.01, 0.02, 0.002], 'brass')]
    return o
W['pistol']['empty'] = pistol_empty()
def flare_open():
    piv = [0, 0.02, -0.02]; ang = 35
    o = [box([0, 0.02, -0.02], [0.03, 0.05, 0.06], 'orange'),
         hull([(-0.014, 0.0, -0.05), (0.014, 0.0, -0.05), (0.014, 0.0, -0.005), (-0.014, 0.0, -0.005), (-0.016, -0.09, -0.08), (0.016, -0.09, -0.08), (0.016, -0.09, -0.04), (-0.016, -0.09, -0.04)], 'orangeD'),
         box([0, 0.06, -0.045], [0.008, 0.016, 0.014], 'black')] + guard(0.0, 0.0)
    a, b2 = rx([0, 0.04, -0.02], piv, ang), rx([0, 0.04, 0.17], piv, ang)
    o.append(loft([[*a, 0.02, 0.02], [*b2, 0.02, 0.02]], 'orange', ax='z', n=6))
    o.append(flat([(a[0] - 0.012, a[1] - 0.01, a[2] - 0.001), (a[0] + 0.012, a[1] - 0.01, a[2] - 0.001), (a[0] + 0.012, a[1] + 0.014, a[2] - 0.001), (a[0] - 0.012, a[1] + 0.014, a[2] - 0.001)], 'black', (0, 0, -1)))
    return o
W['flare_gun']['open'] = flare_open()
AMMO['flare_shell'] = [loft([[0, 0.0105, -0.035, 0.0115, 0.0115], [0, 0.0105, -0.025, 0.0115, 0.0115]], 'brass', ax='z', n=6), loft([[0, 0.0105, -0.025, 0.0105, 0.0105], [0, 0.0105, 0.035, 0.0105, 0.0105]], 'flareShell', ax='z', n=6, caps=[False, True]),
                       flat([(-0.006, 0.0105, 0.0352), (0.006, 0.0105, 0.0352), (0.006, 0.019, 0.0352), (-0.006, 0.019, 0.0352)], 'flare', (0, 0, 1))]
AMMO_INFO['flare_shell'] = 'one flare shell (loose, and the one in the hand while loading)'
# stuck in a target: the target face is z = 0 facing +Z; the tip is buried, the shaft stands out along +Z
AMMO['arrow_stuck'] = [p for p in arrow(0.0, 0.62)][:1] + [flat([(0, 0.0, 0.52), (0, 0.022, 0.54), (0, 0.022, 0.61), (0, 0.0, 0.61)], 'fletchR', (1, 0, 0), both=True),
                       flat([(0, 0.0, 0.52), (0.02, -0.012, 0.54), (0.02, -0.012, 0.61), (0, 0.0, 0.61)], 'fletch', (0, 0, 1), both=True), flat([(-0.02, -0.02, 0.0005), (0.02, -0.02, 0.0005), (0.02, 0.02, 0.0005), (-0.02, 0.02, 0.0005)], 'ironD')]
AMMO['bolt_stuck'] = [barrel(0.0, 0.3, 0.005, 0.0, c='lead', n=4), flat([(0, 0.0, 0.24), (0, 0.02, 0.26), (0, 0.02, 0.3), (0, 0.0, 0.3)], 'fletchR', (1, 0, 0), both=True),
                      flat([(-0.018, -0.018, 0.0005), (0.018, -0.018, 0.0005), (0.018, 0.018, 0.0005), (-0.018, 0.018, 0.0005)], 'ironD')]
AMMO_INFO.update({'arrow_stuck': 'an arrow that hit: tip buried, shaft out along +Z from a surface at z = 0 (turn +Z to the hit surface normal); picked up as one arrow',
                  'bolt_stuck': 'the same for a crossbow bolt'})

# ---------- first-person reload poses (view space: eye at the origin looking +Z, viewer's right is -X) ----------
RSH, LSH = [-0.28, -0.42, -0.08], [0.28, -0.44, -0.08]
def arm_to(side, f, out=0.06, drop=0.08):
    """an arm from its shoulder to a fist at f: the wrist sits just behind the fist, the elbow bends down and out"""
    sh = RSH if side == 'r' else LSH; sg = -1 if side == 'r' else 1
    wr = [f[0], f[1], f[2] - 0.05]; el = [(sh[0] + wr[0])/2 + sg*out, (sh[1] + wr[1])/2 - drop, (sh[2] + wr[2])/2]
    return arm(sh, el, wr) + fist(f)
def pose(right, left, weapon, state, wpos, wrot, note, item=None, dy=0.08):
    up = lambda p: [p[0], p[1] + dy, p[2]] if p else p
    right, left, wpos = up(right), up(left), up(wpos)
    if item: item = dict(item, pos=up(item['pos']))
    P = {'right': arm_to('r', right) if right else [], 'left': arm_to('l', left) if left else [],
         'weapon': {'name': weapon, 'state': state, 'pos': wpos, 'rot': wrot}, 'note': note}
    if item: P['item'] = item
    return P
RELOAD = {
  # pistol: the magazine drops (left hand low with a fresh one), then the left hand pushes it into the grip
  'pistol_mag_out': pose([-0.1, -0.24, 0.36], [0.06, -0.38, 0.32], 'pistol', 'empty', [-0.1, -0.24, 0.36], [-15, 12, 28],
                         'tip the pistol in, the left hand comes up with a full magazine', {'model': 'ammo.pistol_magazine', 'pos': [0.06, -0.37, 0.36], 'rot': [10, 0, -20]}),
  'pistol_mag_in': pose([-0.1, -0.22, 0.36], [-0.07, -0.33, 0.33], 'pistol', 'empty', [-0.1, -0.22, 0.36], [-15, 12, 28],
                        'the left fist slaps the magazine up into the grip; then go back to aim (state new)', {'model': 'ammo.pistol_magazine', 'pos': [-0.085, -0.335, 0.335], 'rot': [-15, 12, 28]}),
  # carbine: magazine out and in, gun canted
  'carbine_mag_out': pose([-0.14, -0.22, 0.3], [0.05, -0.42, 0.36], 'carbine', 'empty', [-0.14, -0.22, 0.3], [-6, 8, 30],
                          'cant the carbine, the empty magazine falls, the left hand brings a full one', {'model': 'ammo.carbine_magazine', 'pos': [0.05, -0.41, 0.4], 'rot': [0, 0, -15]}),
  'carbine_mag_in': pose([-0.14, -0.22, 0.3], [-0.12, -0.36, 0.41], 'carbine', 'empty', [-0.14, -0.22, 0.3], [-6, 8, 30],
                         'the magazine goes into the well; then state new and back to fpLong', {'model': 'ammo.carbine_magazine', 'pos': [-0.115, -0.33, 0.4], 'rot': [-6, 8, 30]}),
  # pump shotgun: rack (fore-end back), and one shell at a time into the loading port under the gun
  'shotgun_rack': pose([-0.14, -0.21, 0.32], [-0.13, -0.24, 0.57], 'pump_shotgun', 'pumped', [-0.14, -0.21, 0.32], [-4, 2, 0],
                       'pull the fore-end back (state pumped) and push it forward again (state new): 0.35 s'),
  'shotgun_load': pose([-0.1, -0.26, 0.3], [-0.04, -0.33, 0.45], 'pump_shotgun', 'new', [-0.1, -0.26, 0.3], [-8, 10, 75],
                       'the gun rolled on its side; the left thumb pushes a shell into the port, one per 0.5 s', {'model': 'ammo.shotgun_shell', 'pos': [-0.06, -0.31, 0.44], 'rot': [0, 0, 75]}),
  # double barrel: broken open, two shells
  'double_open': pose([-0.12, -0.24, 0.32], [-0.05, -0.31, 0.5], 'double_barrel', 'open', [-0.12, -0.24, 0.32], [-6, 6, 0],
                      'broken open; the left hand drops two shells into the chambers', {'model': 'ammo.shotgun_shell', 'pos': [-0.12, -0.17, 0.46], 'rot': [-70, 0, 0]}),
  # hunting rifle: bolt up and back, a round pressed in, bolt home
  'rifle_bolt': pose([-0.18, -0.15, 0.31], [-0.13, -0.24, 0.6], 'hunting_rifle', 'bolt_open', [-0.14, -0.21, 0.32], [-4, 2, 0],
                     'the right hand works the bolt (state bolt_open, then new): 0.6 s per round', {'model': 'ammo.rifle_round', 'pos': [-0.15, -0.17, 0.35], 'rot': [0, 0, 0]}),
  # revolver: cylinder out, rounds one by one
  'revolver_load': pose([-0.06, -0.24, 0.34], [0.0, -0.22, 0.42], 'revolver', 'open', [-0.06, -0.24, 0.34], [-35, 0, 35],
                        'cylinder swung out towards the middle; the left hand loads rounds one at a time', {'model': 'ammo.pistol_round', 'pos': [-0.01, -0.2, 0.39], 'rot': [-35, 0, 35]}),
  # flare gun: broken open, a shell in
  'flare_open': pose([-0.08, -0.24, 0.36], [0.0, -0.22, 0.4], 'flare_gun', 'open', [-0.08, -0.24, 0.36], [-20, 8, 22],
                     'broken open; the left hand slides a flare shell into the barrel', {'model': 'ammo.flare_shell', 'pos': [-0.06, -0.2, 0.38], 'rot': [-55, 8, 22]}),
  # bow: nock an arrow (bow upright in the left hand), then draw (state drawn, right fist by the cheek)
  'bow_nock': pose([0.06, -0.2, 0.4], [0.07, -0.18, 0.55], 'recurve_bow', 'new', [0.07, -0.18, 0.55], [0, 0, -8],
                   'the bow held upright in the left fist; the right hand nocks an arrow on the string', {'model': 'ammo.arrow', 'pos': [0.085, -0.18, 0.2], 'rot': [0, 0, 0]}),
  'bow_draw': pose([0.03, -0.12, 0.08], [0.04, -0.12, 0.68], 'recurve_bow', 'drawn', [0.04, -0.12, 0.68], [0, 0, -4],
                   'drawn: left arm straight, right fist at the cheek; release to fire', dy=0.0),
  # crossbow: nose down, both hands pull the string to the latch, then a bolt goes on the rail
  'crossbow_cock': pose([-0.07, -0.34, 0.5], [0.07, -0.34, 0.5], 'crossbow', 'new', [0.0, -0.5, 0.62], [38, 0, 0],
                        'nose down (a foot in the stirrup), both hands haul the string back; then state loaded and back to fpLong', dy=0.12),
}
FP_RELOAD_RULE = ('fpReload[name]: right and left arms (view space, like fp), the weapon (name, state, pos, rot in degrees, three.js Euler XYZ) and sometimes an item '
                  '(a model from held.ammo in the left hand, same pos/rot rules). Play the poses of a gun in order and blend between them: pistol_mag_out -> pistol_mag_in; '
                  'carbine_mag_out -> carbine_mag_in; shotgun_load (repeat) -> shotgun_rack; double_open; rifle_bolt (repeat per round); revolver_load (repeat); '
                  'flare_open; bow_nock -> bow_draw; crossbow_cock. The note on each says what happens.')
