# Launchers

Small scripts that open the game from the drive in whatever browser is installed. Chromium-family browsers (Chromium, Edge, Chrome, Brave) open it in an app window with no address bar; Firefox opens it normally; otherwise the system's default browser does. No browser is bundled.

| File | For |
| --- | --- |
| `play-windows.bat` | Windows: double-click to play. |
| `play-mac.command` | macOS: double-click to play (the first time, right-click > Open). |
| `play-linux.sh` | Linux, Raspberry Pi: run to play. `KIOSK=1 ./play-linux.sh` for full screen with nothing else, for a Pi or a home-made handheld. |
| `bench-windows.bat`, `bench-linux.sh` | The unattended benchmark: plays a fixed tour of Springfield (about two and a half minutes), sends the result to `benchmarks/` in the repo and closes. Give the device a name: `bench-windows.bat "HP Envy"`. |

## Benchmark on a test device, unattended
1. Copy the game folder onto the device (or the drive it plays from).
2. Once, in the browser the launcher will use: open `play.html`, Menu > Report a bug > Sending settings: put in the repository and a GitHub token with Contents: read and write. It stays in that browser on that device.
3. Run `bench-windows.bat "Beelink mini"` (or `./bench-linux.sh "Beelink mini"`). It needs no one at the screen. To run it every night: Windows Task Scheduler > Create Basic Task > Start a program > this file, with the name as the argument; Linux: a cron line.
4. Results arrive in `benchmarks/`; `node tools/benchreport.js` turns them into `docs/BENCHMARKS.md`.

On an iPhone or iPad: open the game's website with `play.html?bench` on the end; the result shows on screen with Send and Download.

Benchmark address options: `&q=0`, `1` or `2` for Low, Normal or High detail; `&quick=1` for shorter stages; `&send=1` to send without asking; `&close=1` to close the tab when done; `&label=name`. Nothing the benchmark does is saved to your game.
