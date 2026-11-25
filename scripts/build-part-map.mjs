// Writes data/forge_part_map.csv: every part in the forge catalogue -> its Rebrickable id and how that was decided
// (rules in forge/engine/avail.mjs mapPart). A reviewable record; the checker uses the same function at run time.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { mapPart } = await import(path.join(ROOT, 'forge/engine/avail.mjs'));
const cat = JSON.parse(fs.readFileSync(path.join(ROOT, 'forge/engine/parts/catalog.json'), 'utf8'));
const q = (s) => (/[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
const out = ['ldraw,rb,method,name']; let mapped = 0;
for (const id of Object.keys(cat).sort()) { const m = mapPart(id); if (m.rb) mapped++; out.push([id, m.rb, m.method, q(cat[id].name)].join(',')); }
fs.writeFileSync(path.join(ROOT, 'data/forge_part_map.csv'), out.join('\n') + '\n');
console.log(`mapped ${mapped} of ${Object.keys(cat).length} catalogue parts`);
