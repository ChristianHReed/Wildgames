#!/bin/sh
# Builds rust/afterstreet-core into WebAssembly and embeds it in engine/core_wasm.js (base64, so it loads from a drive over file:// too).
# With the wasm32 target installed (rustup target add wasm32-unknown-unknown) it uses cargo. Without it, it compiles the same Rust to
# LLVM IR with rustc and finishes with the system's llc and wasm-ld (the crate is no_std and uses no allocator, so nothing else is needed).
set -e
cd "$(dirname "$0")/.."
CR=rust/afterstreet-core; OUT=$(mktemp -d); EXPORTS="--export=as_drape --export=as_version --export=__heap_base"
if rustup target list --installed 2>/dev/null | grep -q '^wasm32-unknown-unknown$'; then
  (cd $CR && cargo rustc --release --target wasm32-unknown-unknown --crate-type=cdylib -- -C link-arg=--export=__heap_base)
  cp $CR/target/wasm32-unknown-unknown/release/afterstreet_core.wasm $OUT/core.wasm
else
  rustc --edition 2021 --crate-type=cdylib --crate-name afterstreet_core -C panic=abort -C opt-level=3 -C overflow-checks=off --emit=llvm-ir -o $OUT/core.ll $CR/src/lib.rs
  # the IR is written for the host; drop its target lines and the attributes newer than the system LLVM reads
  sed -E -e '/^target (datalayout|triple)/d' -e 's/ captures\([a-z_, ]*\)//g' -e 's/getelementptr inbounds nuw/getelementptr inbounds/g' -e 's/getelementptr nuw/getelementptr/g' \
    -e 's/icmp samesign/icmp/g' -e 's/"target-cpu"="[^"]*"//g' -e 's/"target-features"="[^"]*"//g' -e 's/"probe-stack"="inline-asm"//g' -e 's/ nonlazybind//g' -e 's/ uwtable//g' -e 's/ nocreateundeforpoison//g' -e '/@llvm.lifetime\./d' \
    -e 's/trunc nuw nsw/trunc/g' -e 's/trunc nuw/trunc/g' -e 's/trunc nsw/trunc/g' $OUT/core.ll > $OUT/core2.ll
  llc -mtriple=wasm32-unknown-unknown -filetype=obj -O3 $OUT/core2.ll -o $OUT/core.o
  clang --target=wasm32-unknown-unknown -O2 -fno-builtin -nostdlib -c $CR/wasm/mem.c -o $OUT/mem.o
  wasm-ld --no-entry $EXPORTS --strip-all --gc-sections --unresolved-symbols=ignore-all -o $OUT/core.wasm $OUT/core.o $OUT/mem.o
fi
node -e "
const b=require('fs').readFileSync('$OUT/core.wasm');const m=new WebAssembly.Module(b);
const im=WebAssembly.Module.imports(m);if(im.length){console.error('the module needs imports:',im);process.exit(1);}
const s='/* AfterStreet core (rust/afterstreet-core), built by tools/build_core.sh. WebAssembly, base64. Do not edit by hand. */\nwindow.AFTERSTREET_CORE_WASM = \"'+b.toString('base64')+'\";\n';
require('fs').writeFileSync('engine/core_wasm.js',s);console.log('engine/core_wasm.js:',b.length,'bytes of WebAssembly, exports',WebAssembly.Module.exports(m).map(e=>e.name).join(', '));"
rm -rf $OUT
