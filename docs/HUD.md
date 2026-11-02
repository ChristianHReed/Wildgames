# HUD and touch UI rules (main chat, 1 November 2026)

Sources: Apple Human Interface Guidelines (Game controls), Epic's "Designing for mobile in Fortnite", StraySpark "Game UI/UX design principles".

## Rules this game follows
1. **Earn the space.** A HUD element stays on screen only if the player needs it all the time. Health and needs stay; ammo, vehicle and status panels appear when they matter.
2. **Context changes the controls.** At most five or six controls on screen at once. On foot: move, look, swing, shoot, throw, jump, build, run, crouch. In a vehicle: brake, lights, view, get out (the stick drives). A button only shows when its action is possible (no flashlight button in daylight unless it is on, no Trunk unless you are at a car).
3. **Thumb zones.** Main actions sit in the bottom corners: movement bottom left, actions bottom right. Menus and the map go at the top. Nothing sits under the iPhone home bar or notch (safe-area insets).
4. **Size and feedback.** Frequent buttons at least 44 pt (most are 52 to 84), less used ones at least 28. Every button shows a press state that is visible round the thumb (it shrinks and glows).
5. **Hierarchy.** Critical things are big, high contrast and moving: low health and needs pulse red. Important things are medium (prompts at the crosshair). Information is small (clock, compass). Ambient things are in the world (time of day, weather).
6. **Placement.** Persistent information in the corners (vitals top left, map top right). Momentary information at the centre (prompt, crosshair). Messages at the top centre (toasts).
7. **One way to do a thing.** No prompt that repeats a button that is already on screen (the "Tap here to get out" pill is hidden on touch, because Get out is a button).

## Applied in 0.114.83
- Press states and safe-area insets on every touch button, the stick, the hotbar and the vehicle panel.
- Vehicle mode (0.114.80) plus: the speed and fuel panel moved off the stick and Brake to a compact panel above them. The objective line, stats line and gun readout are hidden while driving.
- The gun readout appears for 3 s after you shoot, switch or reload, then fades.
- The flashlight button shows only in the dark, indoors, or while the light is on.
- Food, water and rest pulse red under 22 %, health under 30 %.

## Next, if wanted
- A floating stick that appears where the left thumb lands (Apple recommends it).
- Icons instead of words on the action buttons (needs art from the content chat).
- A HUD scale setting (0.75x to 1.5x) and a high-contrast option.
- Fade the vitals panel when everything is above 60 % and nothing has changed for a while.
- Haptics on button press where the browser supports it.
