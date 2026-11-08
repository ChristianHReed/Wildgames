#!/usr/bin/env node
/* Builds docs/BENCHMARKS.md from benchmarks/*.json: one table per device, newest run first, and the stage figures. */
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..'), dir = path.join(root, 'benchmarks');
const runs = (fs.existsSync(dir) ? fs.readdirSync(dir) : []).filter(f => f.endsWith('.json')).map(f => { try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { return null; } }).filter(r => r && r.stages);
runs.sort((a, b) => (b.when || '').localeCompare(a.when || ''));
const dev = {}; runs.forEach(r => { const k = (r.device && r.device.label) || 'unnamed device'; (dev[k] = dev[k] || []).push(r); });
const Q = ['Low', 'Normal', 'High'];
let out = '# Benchmarks\n\nMade by `node tools/benchreport.js` from `benchmarks/`. Each run is the fixed Springfield tour (`play.html?bench`). fps is the average; 95% is the frame time 95 in 100 frames beat; update and draw are the game\'s own work per frame on the processor; calls and triangles are what is drawn per frame.\n\n';
if (!runs.length) out += 'No results yet.\n';
for (const k of Object.keys(dev)) {
  out += '## ' + k + '\n\n';
  for (const r of dev[k].slice(0, 5)) {
    const d = r.device || {};
    out += `**${r.when.slice(0, 16).replace('T', ' ')}** · build ${r.build} · ${Q[+d.quality] || d.quality} detail · ${d.view} at ${d.dpr}x · ${d.gpu || ''}${d.file ? ' · from the drive' : ''}\n\n`;
    out += 'Loading: ' + (r.loads || []).map(l => `${l.load} ${l.seconds} s`).join(', ') + '\n\n';
    out += '| Stage | fps | 95% ms | worst ms | frames over 50 ms | update ms | draw ms | calls | triangles | memory MB |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n';
    for (const s of r.stages) out += `| ${s.stage} | ${s.fps} | ${s.p95} | ${s.worst} | ${s.long} | ${s.updMs} | ${s.drawMs} | ${s.calls} | ${Math.round(s.tris / 1000)}k | ${s.heapMB == null ? '-' : s.heapMB} |\n`;
    out += '\n';
  }
}
fs.writeFileSync(path.join(root, 'docs', 'BENCHMARKS.md'), out); console.log(runs.length + ' run(s) -> docs/BENCHMARKS.md');
