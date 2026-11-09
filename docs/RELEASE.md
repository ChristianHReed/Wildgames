# Releasing a version

Every change to the game goes out the same way. The steps are short on purpose; skipping one is how the offline copy once went 13 versions stale.

1. **Syntax.** `for f in engine/*.js packs/packload.js sw.js; do node --check $f; done`
2. **Smoke test.** Start a web server in the repo (`python3 -m http.server 8123`), then:
   - `node tools/smoke.js demo endless`
   - `node tools/smoke.js demo reclaim`
   - `node tools/smoke.js spring reclaim`
   - `node tools/smoke.js spring escape`
   - `node tools/smoke.js testStreet`
   - `node tools/smoke.js asmap endless path/to/a.asmap` (any Maps Builder file)

   Each prints `No faults.` or the list of faults with where they happened. Needs Playwright with Chromium. A run takes two to ten minutes without a graphics card.
3. **Look at it.** The smoke test only finds crashes. For anything that changes the picture, take a screenshot in the Test World and look.
4. **Roadmap row.** One row in `docs/ROADMAP.md` for the version: what changed, what was checked, what was not.
5. **Stamp.** `python3 tools/stamp_release.py <version>` sets the version in `play.html`, `sw.js` and `README.md`, and stops with a list if any file the pages load is missing from the offline copy's list in `sw.js`.
6. **Commit and push** to the working branch, `main` and `gh-pages`.

## What the smoke test does not cover

- Playing together (two browsers), saves moved between devices, the folder on a drive.
- Touch controls, game controllers, sound.
- Memory on a real phone: big Maps Builder squares can still run an iPhone or iPad out of memory where the test browser is fine.
- Whether anything looks right.
