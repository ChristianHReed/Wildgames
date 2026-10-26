# Footsteps rebuilt (content chat, 26 October 2026)

**Problem:** walking and running sounded like knocking on a door. Cause: each step was a falling sine wave (a "thud") plus ringing partials. A struck, pitched object is a knock; a real foot has no pitch.

**What good footsteps are made of** (Krotos footstep guide, and standard game-audio practice):
1. Surface matters most; shoe second. 2. Each step has an attack (heel) and a body (toe/ball of the foot), plus a little room. 3. Clothing and gear add a faint layer. 4. Many variations, never the same clip twice running. 5. Speed changes the sound, not just the rate. 6. Fake steps are thin, repetitive, tonal, or over-processed.

**New steps** (`make_sounds_content.py`, round 4; no sine, no ringing partials):
- Heel burst, then toe burst 66-90 ms later when walking, 40-55 ms running; both filtered noise, shaped by the ground.
- A short low "weight" made of noise; for wood and tile a broad hollow band that dies in 30-50 ms, never a note.
- Ground texture: grit grains on road and tile, stalk crunch on grass, soft fibre on carpet.
- Faint cloth swish on every step and a rare tiny gear clink.
- Two early reflections on hard floors (tile most), none on grass and carpet.
- Every step draws new random values; six variations per key.
- Measured tonality (peak over median of the spectrum): road 24 -> 6 dB, wood 39 -> 12, tile 24 -> 5, grass 22 -> 10, water 15 -> 4.

**Keys** (same names, drop-in): `step_road`, `step_wood`, `step_tile`, `step_grass`, `step_carpet`, `step_water`. New: `step_gravel` (replaces the game borrowing `step_snow` at 1.35x), and a `_run` version of every one (`step_road_run` ...): harder landing, shorter heel-to-toe gap, brighter.

**For the game** (`play.html` `stepSfx`, main chat): play `<key>_run` when sprinting; keep the pitch random range (about +-6%), which is right; vary volume 0.75-1 per step; alternate left and right pan slightly if possible; for gravel use `step_gravel` instead of `step_snow`. Cadence should follow animation foot contact, not a fixed timer. Sneaking: play the walk clip at 0.4 volume and rate 0.95.
