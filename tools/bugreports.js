#!/usr/bin/env node
/* Builds docs/BUG_REPORTS.md from bugreports/*.json (open reports, newest first). `node tools/bugreports.js done <id> [<id>...]` moves fixed reports to bugreports/done/ first. */
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..'), dir = path.join(root, 'bugreports');
const args = process.argv.slice(2);
if (args[0] === 'done') { fs.mkdirSync(path.join(dir, 'done'), { recursive: true }); for (const id of args.slice(1)) for (const ext of ['.json', '.jpg']) { const f = path.join(dir, id + ext); if (fs.existsSync(f)) fs.renameSync(f, path.join(dir, 'done', id + ext)); } }
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().reverse() : [];
let out = '# Bug reports\n\nMade by `node tools/bugreports.js` from `bugreports/`. Reports come from the game (Menu > Report a bug). When one is fixed: `node tools/bugreports.js done <id>`.\n\n' + (files.length ? files.length + ' open.\n\n' : 'None open.\n\n');
for (const f of files) {
  let r; try { r = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { continue; }
  const s = r.state || {};
  out += `## ${r.id}\n\n**Note:** ${(r.note || '(no note)').replace(/\n/g, '  \n')}\n\n![screenshot](../bugreports/${r.id}.jpg)\n\n`
    + `- When: ${r.when}\n- Build: ${s.build}  Mode: ${s.mode || '-'}  Map: ${s.map || '-'}\n- Place: x ${s.x}, y ${s.y}${s.lat ? `, ${s.lat}, ${s.lon}` : ''}  ${s.inside ? '(inside)' : ''}\n`
    + `- Vehicle: ${s.vehicle || 'none'}  Weapon: ${s.weapon || '-'}  Health: ${s.hp}  View: ${s.view}  Touch: ${s.touch}  Screen: ${s.screen}\n- Device: ${s.ua}\n`
    + (s.errors && s.errors.length ? '- Errors:\n' + s.errors.map(e => '  - `' + e + '`').join('\n') + '\n' : '') + '\n';
}
fs.writeFileSync(path.join(root, 'docs', 'BUG_REPORTS.md'), out); console.log(files.length + ' open report(s) -> docs/BUG_REPORTS.md');
