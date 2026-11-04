# The Rust core

Some of the game's heaviest number crunching is written in Rust and runs in the browser as WebAssembly. Everything it does also exists in JavaScript, so the game runs the same where WebAssembly is missing or switched off (`?nowasm` in the address turns it off for testing).

## What is in it

| Export | Does | JavaScript twin |
| --- | --- | --- |
| `as_drape` | lays flat ground pieces (roads, sidewalks, parks, water) over the terrain: cuts each triangle along the height grid's cells and their diagonals, lifts every corner by the terrain under it | `drape` in `engine/world.js` |
| `as_version` | which build of the module this is | |

Measured on 24,000 triangles (`node tools/test_core.js`): JavaScript about 0.9 s, Rust about 0.23 s, with the same result to within float rounding. Loading Springfield's home square went from about 4.6 s to about 4 s in the world-building step, and the most memory used while loading went from about 1.7 GB to about 1.1 GB (the draped ground comes back as typed arrays, 4 bytes a value instead of 8).

## Files

| File | What it is |
| --- | --- |
| `rust/afterstreet-core/src/lib.rs` | the Rust source (`no_std`, no allocator: the game hands in pointers into the module's own memory) |
| `rust/afterstreet-core/wasm/mem.c` | `memcpy`, `memmove`, `memset`, `memcmp` for the build without the Rust wasm target |
| `tools/build_core.sh` | builds it and writes `engine/core_wasm.js` (the module as base64, so it loads from a drive over `file://` too) |
| `engine/core_wasm.js` | the built module; loaded by play.html before the engine |
| `tools/test_core.js` | checks the module against the JavaScript and times both |

## Building

```sh
sh tools/build_core.sh          # builds engine/core_wasm.js
cd rust/afterstreet-core && cargo test   # the Rust tests, natively
node tools/test_core.js         # same result as the JavaScript?
```

With the Rust WebAssembly target installed (`rustup target add wasm32-unknown-unknown`) the script uses cargo. Without it (this workspace cannot download it), it compiles the same Rust to LLVM IR with `rustc` for the host, removes the host-only lines and the attributes newer than the system's LLVM, and finishes with `llc` and `wasm-ld`. That works because the crate is `no_std` with no allocator and every export takes and returns only numbers and pointers.

## How the game uses it

`engine/world.js` compiles the module as the page loads. `prep3D` asks `drape` for the typed result; `coreDrape` works in batches of 1024 triangles (small memory, and the browser moves the code to its fast compiler after the first few calls), and makes a fresh instance after a big job, because WebAssembly memory never shrinks. The draped ground stays in its batches (`m.parts`) all the way to the upload.

## Next candidates

Measured at load in Springfield, after drape: the safe-house lot search (made fast in JavaScript by skipping far roads), the ground cover generator (`buildCover`), building shells, and the terrain tiles. Per frame the JavaScript is small; the time is in drawing, which view culling (0.114.92) cut by about a third.
