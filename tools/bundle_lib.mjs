#!/usr/bin/env node
/* Packs an open-source library (ES modules or TypeScript, any number of files) into one classic script for the Maps Builder:
     builder/lib/<name>.js  ->  (window.BLIB = window.BLIB || {}).lib_<name> = function(L){ ...modules...; L.<name> = <entry exports>; };
   Every builder library is a function installing into L, so the same code runs on the page and in the background worker, and opens
   from a USB drive. Needs the TypeScript compiler (it only transpiles each file to CommonJS; no type checking).
   Usage: node tools/bundle_lib.mjs <name> <entry file> [bare-import=path or package=folder ...] [--out file] --version <v> --repo <owner/repo> --licence <spdx>
   Example: node tools/bundle_lib.mjs flatbush ../flatbush/index.js flatqueue=../flatqueue/index.js --version 4.6.2 --repo mourner/flatbush --licence ISC */
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let ts;
try { ts = require('typescript'); } catch (e) { ts = require('/opt/node22/lib/node_modules/typescript/lib/typescript.js'); }
const args = process.argv.slice(2), opt = {}, bare = {}, pos = [];
for (let i = 0; i < args.length; i++) { if (args[i].startsWith('--')) opt[args[i].slice(2)] = args[++i]; else if (args[i].includes('=')) { const [k, v] = args[i].split('='); bare[k] = path.resolve(v); } else pos.push(args[i]); }
const [name, entry] = pos; if (!name || !entry) { console.error('usage: bundle_lib.mjs <name> <entry> [bare=path] --version v --repo r --licence l'); process.exit(1); }
const mods = new Map();   /* absolute path -> {id, code} */
function resolve(from, spec) {
  if (bare[spec]){ const b = bare[spec]; if (!fs.statSync(b).isDirectory()) return b;   /* a package folder: its package.json "main" */
    const pj = JSON.parse(fs.readFileSync(path.join(b, 'package.json'), 'utf8')); return path.join(b, pj.module || pj.main || 'index.js'); }
  for (const k in bare) if (spec.startsWith(k + '/') && fs.statSync(bare[k]).isDirectory()) return path.join(bare[k], spec.slice(k.length + 1));   /* folder mapping: pkg=dir/ for pkg/src/x.js */
  if (!spec.startsWith('.')) throw new Error('unknown bare import "' + spec + '" in ' + from + ' (pass ' + spec + '=path)');
  let p = path.resolve(path.dirname(from), spec);
  for (const c of [p, p + '.ts', p + '.js', p.replace(/\.js$/, '.ts'), path.join(p, 'index.ts'), path.join(p, 'index.js')]) if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  throw new Error('cannot find ' + spec + ' from ' + from);
}
function add(file) {
  if (mods.has(file)) return mods.get(file).id;
  const id = mods.size; const rec = { id, code: '' }; mods.set(file, rec);
  const src = fs.readFileSync(file, 'utf8');
  const out = ts.transpileModule(src, { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019, allowJs: true, esModuleInterop: false, removeComments: false } }).outputText;
  rec.code = out.replace(/require\((['"])([^'"]+)\1\)/g, (m, q, spec) => '__req(' + add(resolve(file, spec)) + ')');
  return id;
}
const main = add(path.resolve(entry));
const list = [...mods.entries()].sort((a, b) => a[1].id - b[1].id);
const head = `/* ${name} ${opt.version || ''} from https://github.com/${opt.repo || '?'} (${opt.licence || '?'} licence, full text in builder/lib/LICENSES.md).
   Packed into one classic script by tools/bundle_lib.mjs for the AfterStreet Maps Builder; the code itself is unchanged. */\n`;
let body = `(window.BLIB = window.BLIB || {}).lib_${name.replace(/[^a-z0-9_]/gi, '_')} = function(L){\n'use strict';\nvar __defs = [\n`;
body += list.map(([file, r]) => `/* ${path.basename(file)} */ function(module, exports, __req){\n${r.code}\n}`).join(',\n');
body += `\n], __cache = [];\nfunction __req(i){ if (__cache[i]) return __cache[i].exports; var m = __cache[i] = {exports:{}}; __defs[i](m, m.exports, __req); return m.exports; }\n`;
body += `L.${name.replace(/[^a-z0-9_]/gi, '_')} = __req(${main});\n};\n`;
const outFile = opt.out ? path.resolve(opt.out) : path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'builder', 'lib', name + '.js');
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, head + body);
console.log(name, mods.size, 'files ->', path.relative(process.cwd(), outFile), (fs.statSync(outFile).size / 1024).toFixed(0) + ' KB');
