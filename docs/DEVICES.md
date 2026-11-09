# Who can play Afterstreet: devices and accessibility

Written 8 November 2026 (game version 0.119.0). This is the guide to which devices the game is meant to run on, how to start it on each, what works and what does not, and what the game offers players who need it to be easier to see, hear or control. It is honest about testing: almost none of the devices below have been tried yet, and the "Tested" column says so.

## The rule this guide follows

Afterstreet is open source and meant to travel on a drive. So:

1. **Open standards only.** The game needs a web browser with WebGL. It must run in a free, open browser (Firefox or Chromium), not only in Chrome, Edge or Safari.
2. **Nothing to sign up for, nothing to buy, no store.** No accounts, no app store needed. A store build may exist as an extra, never as the only way in.
3. **Browser-specific features are extras, never requirements.** Saving straight into the drive's folders works only in Chrome, Edge and other Chromium browsers. Every other browser must still be able to keep and move progress.
4. **Anyone can host or package it.** The game is plain files, so anyone can copy it onto any drive, put it on any web host, or wrap it for a device. The official site (GitHub Pages) is a convenience, not the only home.
5. **Cheap and old hardware counts.** The most important part of "play on anything" is a low detail setting that really works on a cheap phone or an old laptop.

## What the game needs

| Need | Detail |
| --- | --- |
| A browser with WebGL 1 | Every current browser has it. WebGL 2 is not needed. |
| JavaScript from about 2017 or newer | Any browser updated since 2018. |
| WebAssembly | Optional. The heavy map work runs faster with it; without it the same work runs in plain JavaScript. |
| Storage | About 250 MB for the whole folder (game, art, packs). Each map you make adds a few MB. Saves are small. |
| Memory (estimate) | 2 GB of RAM for the demo town and small maps on Low detail; 4 GB for a city centre square; 8 GB to be comfortable. Measured on a desktop: the densest Springfield square peaks near 550 MB of page memory while it loads and settles near 250 MB. Phones close a page well before they run out of RAM, so phones need the Low setting. |
| Controls | Keyboard and mouse, a touch screen, or a game controller (0.120.0; menus too). |

## Devices

**Tiers.** A: what the game is built for. B: should run, with limits noted. C: might run; untested, community help welcome. Not supported: cannot run it, or only with a different game.

| Tier | Device | How to start | Where saves live | Controls | Tested |
| --- | --- | --- | --- | --- | --- |
| A | Windows 10/11, macOS, Linux computer: Chrome, Edge, Chromium, Brave | Double-click `play.html` on the drive. | On the drive, after **Connect game folder** (Settings). | Keyboard and mouse | Chrome on Linux, automated only |
| A | Same computers: Firefox | Double-click `play.html` (or open it with Firefox). | In the browser on that computer. **Export saves** puts them in a file you keep on the drive; **Import saves** on another computer. | Keyboard and mouse | Not yet |
| A | Chromebook | Open the drive in Files, open `play.html` in Chrome. | On the drive (Connect game folder). | Keyboard, trackpad, touch on touch models | Not yet |
| B | Android phone or tablet (Chrome or Firefox) | Open the game's website once, press **Save for offline** on your map, then add it to the home screen. Opening `play.html` from a USB drive does not work reliably on Android. | In the browser; Export saves to move them. | Touch (Move buttons to suit your hands) | Not yet |
| B | iPhone and iPad (Safari) | Open the game's website once, **Save for offline**, then Share > Add to Home Screen. iOS cannot open a game from a drive. | In the browser; Export saves to move them. | Touch | The owner's iPhone. City-centre squares crashed the page until 0.117.5. Use Low detail. |
| B | Steam Deck and Windows handhelds (ROG Ally, Legion Go) | Desktop mode, open `play.html` from the drive or SD card in a browser. | On the drive with a Chromium browser, else Export saves. | Touch screen now; the built-in controller needs gamepad support (not built yet). | Not yet |
| B | Raspberry Pi 5 (Raspberry Pi OS, Chromium) | Open `play.html` from the drive; a kiosk launcher can start it at boot for a home-made handheld. | On the drive (Chromium). | Keyboard and mouse, touch screen; a controller needs gamepad support. | Not yet |
| B | Laptops and mini PCs from about 2015 with 4 GB | As for computers, with Low detail. | As for computers. | Keyboard and mouse | Not yet |
| C | Raspberry Pi 4 (4 GB or more) | As for Pi 5, Low detail, small maps. | As for Pi 5. | As for Pi 5 | Not yet |
| C | Xbox (Edge browser) | Open the game's website in Edge. | In the browser. | Needs gamepad support. | Not yet |
| C | Older Android phones (2 GB) | As for Android, Low detail, the demo town or a Neighborhood-size map. | In the browser. | Touch | Not yet |
| C | Linux retro handhelds without a desktop (2 GB) | A PortMaster port with WPE WebKit (`cog`), a stretch goal. | In the launcher's storage on the SD card. | Built-in controller (needs gamepad support). | Not yet |
| Not supported | Nintendo Switch, PlayStation, most smart TVs and TV sticks | No usable browser with WebGL and storage. | | | |
| Not supported | E-ink readers, feature phones, microcontroller handhelds (ESP32 and the like), Internet Explorer | No WebGL, or far too little memory. | | | |

## Custom and home-made handhelds

Three kinds, each with its own way in:

| Kind | Examples | How it runs the game | What it needs from the game | Outlook |
| --- | --- | --- | --- | --- |
| Android handhelds | Retroid Pocket, AYN Odin, Anbernic's Android models | Chrome or Firefox: the website and Save for offline, like an Android phone. | Gamepad support, including menus. | Tier B once gamepads work. |
| Single-board-computer handhelds | Home-made Raspberry Pi 5 or CM5 builds, the uConsole | Raspberry Pi OS Lite with the `cage` kiosk and Chromium in kiosk mode, starting `play.html` at boot: no desktop, straight into the game. | Gamepad support, a Handheld detail preset, a launch kit in `launch/`. | Tier B on a Pi 5 with 4 GB or more; Pi 4 is the floor. |
| Linux retro handhelds without a desktop | Anbernic, Miyoo, Powkiddy running ROCKNIX, Knulli, muOS or ArkOS | No browser on board. The open WPE WebKit engine and its `cog` launcher draw straight to the screen, packaged as a PortMaster port. | Gamepad support, menus that fit 640x480, the lowest detail, small maps. | Stretch goal: 2 GB models maybe; 1 GB models likely too small. |

Everything here is open source: `cage`, Chromium, WPE WebKit and PortMaster.

## Scrutiny of the earlier plan

The plan before this guide (from the review of DeepSeek's answer) was: gamepad support, a saves story, detail presets per device, launchers, an Android app through Capacitor, and iPhone through the website. Checked against the rules above:

- **Gamepad support: keep, first.** It is an open web standard that works in every browser, and it opens the Steam Deck, Windows handhelds, Pi handhelds, mini PCs on a TV and the Xbox.
- **Saves: keep, but not built on Chrome alone.** Connect game folder is a Chromium feature, so it cannot be the answer. The open answer: the game offers to export a save file when you quit or leave a map in any browser that cannot write to the drive, and offers to import it at the start, so the drive still carries your progress. Chromium browsers keep writing straight to the drive.
- **Detail presets: keep, and make them the heart of it.** A first-start check (memory, screen, touch) picks Low, Normal or High, and Low is tested on the weakest tier-B device. This is what decides who can actually play.
- **Launchers: keep, changed.** They must open whatever browser is installed, preferring Firefox or Chromium, and fall back to the system's default browser. They are small scripts kept in the open (`launch/`), never a bundled browser.
- **Android app through Capacitor: demoted.** The website plus Save for offline already plays offline on Android with no store and no signing. A packaged app stays optional: if someone builds it, it should go on F-Droid (open-source app store) as well as anywhere else, built from this repository.
- **iPhone and iPad through the website: keep.** It is the only way in on iOS. Its limit is memory, so Low detail and smaller maps are the advice, and the crash fixes of 0.117 must hold.
- **Added: anyone can host it.** Because the game is static files, the guide says how to put a copy on any web host (or a home server on a home network) so a household or school can play without the official site.

## Player accessibility

What the game has now:

| For | In the game |
| --- | --- |
| Reading the buttons | Words on buttons, not icons. |
| Seeing the controls | Screen controls and readouts size (four sizes, Settings). High-contrast screen controls (Settings). |
| Hands and grip | Move buttons: every touch button, the stick and the readouts (speed and fuel, health, map, hotbar, menu) can be put anywhere, with separate layouts for upright and sideways. Floating stick: put your thumb anywhere on the left side. Run and Crouch toggle on touch. Hold actions show their progress on the button. |
| Feeling it | Short vibration on button presses (Android). |
| Keyboard | WASD or arrow keys to turn, every action on a key. |
| Pace | Sleeping skips the night. The game saves on its own every few seconds of play. |
| Reporting problems | Menu > Report a bug sends a picture and a note, with the device and browser, so device problems can be fixed. |

What is missing, in the order it should be built:

1. ~~Game controller (gamepad) support~~ built in 0.120.0, menus included, with a line in words saying which button does what.
2. **Rebinding keys and controller buttons.**
3. **Captions for sounds that matter:** an alien behind you, a raid starting, a door breaking, each as a short line with a direction.
4. **Colour-blind safe signals:** health and needs bars and map markers also differ by shape or label, not only by red and green.
5. **Text size** for the start page, the menus and the messages (the screen controls already scale).
6. **Hold or toggle** choice for every hold action (search, pry, take apart, drink), and a slower double-tap time.
7. **Less motion:** turn off head bob, screen shake and the sway of the held item.
8. **Pause in single player** whenever a menu is open.
9. **Start page for screen readers:** labels on every start-page control (the 3D game itself cannot be read by a screen reader).

## Order of work for "play anywhere"

1. ~~Gamepad support~~ (0.120.0).
2. Detail presets chosen on first start, and a Low setting tested on a tier-B device.
3. Saves on the drive in every browser (export on quit, import on start, where the browser cannot write the folder).
4. ~~Launch scripts in `launch/`~~ (0.120.0: Windows, macOS, Linux and Pi kiosk; untested on real machines yet).
5. A "Host your own copy" section in the README.
6. Captions, colour-blind signals, text size, rebinding, hold or toggle, less motion.
7. Optional: an Android package, built openly and offered on F-Droid.

## Device test log

The owner's test devices are an iPhone 11 and an iPad Pro (main), a Beelink mini PC and an older HP Envy laptop (unattended benchmarks). How to run the benchmark: `launch/README.md`. Results: `docs/BENCHMARKS.md`.

When someone plays on a device, the result goes here (a bug report from the game carries the device and browser).

| Date | Device | Browser | Map | Detail | Result |
| --- | --- | --- | --- | --- | --- |
| Nov 2026 | iPhone (owner's) | Safari | Springfield E0 S1 | Low | Crashed the page on loading the city centre until 0.117.5; retest needed. |
| Nov 2026 | iPhone 11 (owner's main test device) | Safari | `play.html?bench` | Low | Waiting for the first run. |
| Nov 2026 | iPad Pro (owner's main test device) | Safari | `play.html?bench` | Low, Normal | Waiting for the first run. |
| Nov 2026 | Beelink mini PC | launcher `bench-windows.bat` or `bench-linux.sh` | unattended | Normal | Waiting for the first run. |
| Nov 2026 | HP Envy laptop (older) | launcher, unattended | unattended | Low, Normal | Waiting for the first run. |
| Nov 2026 | Linux desktop (automated) | Chromium | Springfield, Test World, demo town | Low, Normal | Runs; used for every change. |
