# Art requests section 11 (20 October 2026), exec'd by survivor.py: long guns in third person, carrying furniture, work poses,
# a quiver worn on the back and a fishing rod.
PALETTE.update({'quiverC': '#5a3a26', 'quiverD': '#3e2818', 'arrowS': '#b08c62', 'fletchQ': '#b84a3a', 'rodC': '#3a3a3e', 'reelC': '#8f969e', 'lineC': '#d8d4c8'})
EXTRA_NPC = {
  'quiver': {'spine_03': [frustum([[0.07, 1.08, -0.15, 0.045, 0.04], [-0.07, 1.46, -0.16, 0.05, 0.045]], 'quiverC'),
                          frustum([[0.075, 1.07, -0.15, 0.048, 0.043], [0.06, 1.12, -0.15, 0.048, 0.043]], 'quiverD', caps=[False, False]),
                          flat([(-0.12, 1.42, -0.085), (-0.09, 1.44, -0.085), (0.13, 1.1, -0.088), (0.1, 1.08, -0.088)], 'quiverD', (0, 0, -1)),
                          *[p for dx in (-0.03, 0.0, 0.025) for p in (seg([-0.07 + dx, 1.44, -0.16], [-0.1 + dx, 1.62, -0.165], 0.004, 0.004, 0.004, 0.004, 'arrowS'),
                                                                       flat([(-0.1 + dx, 1.56, -0.165), (-0.11 + dx, 1.57, -0.19), (-0.115 + dx, 1.63, -0.19), (-0.1 + dx, 1.62, -0.165)], 'fletchQ', (1, 0, 0), both=True))]]},
  'fishing_rod': {'hand_r': [frustum([[-0.212, 0.837, -0.18, 0.014, 0.014], [-0.212, 0.837, 0.05, 0.012, 0.012]], 'hatBrown'),
                             frustum([[-0.212, 0.837, 0.05, 0.009, 0.009], [-0.212, 0.9, 1.9, 0.003, 0.003]], 'rodC', caps=[False, True]),
                             cyl([-0.212, 0.8, -0.06], [0.03, 0.06, 0.06], 'reelC', ax='x'),
                             seg([-0.212, 0.9, 1.9], [-0.212, -0.4, 2.0], 0.0015, 0.0015, 0.0015, 0.0015, 'lineC', caps=(False, False))]},
}
CLIPS.update({
  # a long gun (held.js: hunting_rifle, pump_shotgun, double_barrel, carbine, crossbow) in third person: put it on the grip as usual, then turn it by heldTurn[clip]
  'carry_long': [F(upperarm_r=[-24, 0, -12], lowerarm_r=[-62, 30, 0], upperarm_l=[-38, 0, -18], lowerarm_l=[-96, -28, 0], spine_03=[-3, 0, 0])],
  'aim_long':   [F(upperarm_r=[-62, 0, -40], lowerarm_r=[-40, 50, 0], upperarm_l=[-78, 0, -8], lowerarm_l=[-18, 0, 0], spine_03=[2, -12, 0], Head=[6, 6, 0])],
  'carry_furniture': [F(upperarm_2=[-62, 0, 10], lowerarm_2=[-38, 0, 0], spine_03=[-10, 0, 0], spine_01=[-4, 0, 0]),
                      F(upperarm_2=[-62, 0, 10], lowerarm_2=[-38, 0, 0], spine_03=[-10, 0, 0], spine_01=[-4, 0, 0], thigh_l=[-18, 0, 0], thigh_r=[12, 0, 0], calf_r=[16, 0, 0]),
                      F(upperarm_2=[-62, 0, 10], lowerarm_2=[-38, 0, 0], spine_03=[-10, 0, 0], spine_01=[-4, 0, 0]),
                      F(upperarm_2=[-62, 0, 10], lowerarm_2=[-38, 0, 0], spine_03=[-10, 0, 0], spine_01=[-4, 0, 0], thigh_r=[-18, 0, 0], thigh_l=[12, 0, 0], calf_l=[16, 0, 0])],
  'work_chop': [F(upperarm_2=[-168, 0, 4], lowerarm_2=[-24, 0, 0], spine_01=[-6, 0, 0], spine_03=[-6, 0, 0], Head=[10, 0, 0]),
                F(root=[0, -0.08, 0], upperarm_2=[-58, 0, 6], lowerarm_2=[-6, 0, 0], spine_01=[26, 0, 0], spine_03=[12, 0, 0], thigh_2=[-22, 0, 0], calf_2=[30, 0, 0], foot_2=[-8, 0, 0], Head=[-10, 0, 0])],
  'fish': [F(upperarm_r=[-46, 0, -6], lowerarm_r=[-48, 12, 0], upperarm_l=[-40, 0, 14], lowerarm_l=[-80, -30, 0], Head=[10, 0, 0]),
           F(upperarm_r=[-150, 0, -14], lowerarm_r=[-46, 0, 0], upperarm_l=[-40, 0, 14], lowerarm_l=[-80, -30, 0], spine_03=[-8, 0, 0], Head=[-6, 0, 0])],
  'keep_watch': [F(upperarm_r=[-118, 0, 22], lowerarm_r=[-118, 0, 0], Head=[-6, 22, 0], spine_03=[0, 8, 0]),
                 F(upperarm_r=[-118, 0, 22], lowerarm_r=[-118, 0, 0], Head=[-6, -24, 0], spine_03=[0, -8, 0])],
})
HELD_TURN = {'attack_dig': [78, 0, 0], 'carry_long': [0, 0, -90], 'aim_long': [52, 0, 0], 'work_chop': [0, 0, 0], 'fish': [0, 0, 0]}
CLIP_RULE += (' New in section 11: carry_long (a long gun held across the chest) and aim_long (shouldered); carry_furniture (arms out in front, 4 walking frames: '
              'put the carried piece at carryAt on spine_03); work_chop (2 frames, axe from held.js in the right hand, 0.9 s, looping, beside a stump or a log), '
              'fish (hold, cast; with parts.npc.fishing_rod), keep_watch (2 frames looking left and right with a hand shading the eyes, 3 s each). '
              'For carry_long and aim_long the gun sits on the usual grip and is then turned by heldTurn[clip] degrees about the grip (Euler XYZ as three.js: matrix Rx Ry Rz).')
CARRY_AT = {'bone': 'spine_03', 'pos': [0, 1.12, 0.42], 'note': 'centre of a carried furniture piece in model space at rest; it rides on spine_03. Scale small pieces 1, medium pieces stay 1 but sit 0.1 m lower.'}
SLING = {'bone': 'spine_03', 'pos': [0.0, 1.2, -0.15], 'rot': [-90, 32, 0], 'forward': [0.53, 0.848, 0], 'up': [0, 0, -1], 'note': 'a long gun not in use, slung across the back muzzle up over the left shoulder: put its grip here; its +Z (muzzle) points along forward and its +Y (top) along up; rot is the same turn as Euler degrees in the order three.js uses (XYZ: matrix Rx Ry Rz).'}
