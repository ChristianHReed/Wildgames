# Siege Party 3D

A small real-time strategy game in the style of Age of Empires. Play up to four computers,
share one screen, or link several devices. It is a separate game from Afterstreet and shares no code with it; everything it needs is in this folder.
This is the 3D version: low-poly models, a tilted camera, sunlight and shadows. The painted,
flat-looking version of the same game is next door in [`../siege-party`](../siege-party); it is
also used here when a browser cannot draw 3D (WebGL 2), or when the address ends in `?flat`.

**To play:** download `index.html` and open it in a browser. It is one
self-contained page with nothing to install. Served from a web address it can also
be added to the Home Screen and opens without a connection.

## What is in it

- You against one to four computers, on Easy, Normal or Hard
- Two players at the two ends of one screen; three or four on an iPad-sized screen or larger
- Local online play on separate devices (up to ten players, computers fill the rest)
- Four peoples, each with its own look and a small strength
- Alliances between players
- Gathering, building where you tap, walls and gates
- Docks, fishing boats, transports, galleys and bombard ships
- Village, Town and Castle ages that unlock buildings, units and upgrades
- Towns that change look with each age; a Market for trading and Castles that work like a second Hall
- No overall population limit: homes house Folk, barracks house soldiers
- Map sizes up to 256×384, a new random map every game, previewed as a little 3D board
- A map maker with a 3D preview: start from a picture, an empty field or a random map; paint land, water, trees, road, gold, stone, berries and fish with three brush sizes; zoom in; undo and redo; choose how many resources the game adds; save up to two maps of your own
- Eight zoom levels with − and +, two-finger pinch, or the mouse wheel
- Sound made in code: wind, rustling leaves, water and birdsong, and the knocks and clinks of work and battle

## Playing on separate devices

One device hosts and runs the game. Friends join with a **quick word** (needs
internet; the free public relay ntfy.sh passes the two connection codes across,
so anyone who guessed the word could read them, and they include network
addresses) or by **copying and pasting** an invite code and a reply code.
The devices then talk directly (WebRTC). Keep the host's game open on screen.

The in-game help on the home page explains the controls.

## Changing it

| Path | What it is |
|---|---|
| `src/game/content.ts` | Costs and stats for units, buildings and upgrades |
| `src/game/sim.ts` | Game rules |
| `src/game/ai.ts` | Computer opponents and difficulty |
| `src/game/commands.ts` | Player actions, including those sent from other devices |
| `src/game/map.ts`, `mapgen.ts` | Maps: random, built-in and your own |
| `src/ui/net.ts`, `sync.ts`, `lobby.ts` | Playing on separate devices |
| `src/ui/3d/` | The 3D view: models, ground and water, shaders, camera and touch |
| `src/ui/sound.ts`, `src/game/audio.ts` | Sounds, all made in code |
| `src/ui/` | The painted view, touch controls and menus |
| `manifest.webmanifest`, `sw.js`, icons | Home Screen and offline copy |

After editing, rebuild `index.html` (needs Node.js):

```sh
cd siege-party-3d
npm install
npm run build
```

The game logic began as a Grok-generated project and was finished with Claude.
