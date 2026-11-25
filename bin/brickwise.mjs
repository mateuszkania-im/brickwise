#!/usr/bin/env node
// brickwise: from a brick model (LDraw .ldr/.mpd) to a verified parts list, a shopping list and build instructions.
//
//   brickwise bom <model.ldr> [--have 42115,60337-1] [--out <dir>]
//       checks that every part exists in its colour, subtracts the sets you own, estimates the cost in PLN and writes
//       placements.csv, bom.csv, rebrickable.csv, bricklink.xml and shopping.md. Exit code 1 if any part cannot be bought.
//   brickwise make <set dir> [--have 42115,60337-1] [--title <text>]
//       the whole chain from a saved design (forge build.mjs): build + check, parts list, shopping files, booklet, MANIFEST.sha256.
//       Stops with exit code 1 at the first error (check failure or a part that cannot be bought).
//   brickwise booklet <model.ldr> [--title <text>] [--out <dir>]
//       renders a step-by-step instruction booklet (instructions.pdf + images) from the 0 STEP blocks of the model.
import path from 'node:path'; import fs from 'node:fs'; import crypto from 'node:crypto'; import { spawnSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
import { parseLdr } from '../src/ldr.mjs';
import { bom, ownedParts, subtractOwned, estimate, PRICE_PLN } from '../src/bom.mjs';
import { placementsCsv, bomCsv, rebrickableCsv, bricklinkXml, bricklinkMissing, writeAll } from '../src/export.mjs';

const [cmd, file, ...rest] = process.argv.slice(2);
const opt = (name) => { const i = rest.indexOf('--' + name); return i >= 0 ? rest[i + 1] : undefined; };

function fail(msg) { console.error(`brickwise: ${msg}`); process.exit(1); }
/** parse a model; a model without a single part is an error (a wrong file or an MPD the reader could not follow) */
function readModel(f) { const parts = parseLdr(f); if (!parts.length) fail(`${f} has no parts (no type-1 lines in its main model)`); return parts; }
/** owned sets from --have; an unknown set number is a user error, not a crash */
function readOwned() { const have = (opt('have') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  try { return ownedParts(have); } catch (e) { if (/unknown set/.test(e.message)) fail(`--have: ${e.message} (Rebrickable set numbers, e.g. 42115 or 42115-1)`); throw e; } }

function usage() { console.error('usage:\n  brickwise bom <model.ldr> [--have 42115,60337-1] [--out <dir>]\n  brickwise booklet <model.ldr> [--title <text>] [--out <dir>]\n  brickwise make <set dir> [--have sets] [--title <text>]'); process.exit(2); }

if (cmd === 'bom') {
  if (!file) usage();
  const parts = readModel(file);
  const owned = readOwned();
  const lines = subtractOwned(bom(parts), owned.have);
  const est = estimate(lines);
  const bad = lines.filter((l) => !l.v.ok);
  const out = opt('out') ?? path.join(path.dirname(file), 'brickwise');
  const md = shoppingMd(file, parts, lines, owned.sets, est, bad);
  writeAll(out, { 'placements.csv': placementsCsv(parts, lines), 'bom.csv': bomCsv(lines), 'rebrickable.csv': rebrickableCsv(lines), 'bricklink.xml': bricklinkXml(lines), 'shopping.md': md });
  process.stdout.write(md + `\nfiles: ${out}\n`);
  process.exit(bad.length ? 1 : 0);
} else if (cmd === 'make') {
  // the whole chain from a saved design: build + check (0 errors) -> parts list + shopping files -> booklet -> manifest of hashes
  if (!file) usage();
  const setDir = path.resolve(file); const outDir = path.join(setDir, 'out'); const bw = path.join(outDir, 'brickwise');
  const forge = path.join(path.dirname(fileURLToPath(import.meta.url)), '../forge/bin/lego.mjs');
  const b = spawnSync(process.execPath, [forge, 'build', setDir], { encoding: 'utf8' }); process.stdout.write(b.stdout.split('\n').slice(0, 1).join('\n') + '\n');
  if (b.status !== 0) { process.stderr.write(b.stdout + b.stderr); console.error('make: the design does not pass the check. Fix it first.'); process.exit(1); }
  const model = path.join(outDir, 'model.ldr'); const parts = readModel(model);
  const owned = readOwned();
  const lines = subtractOwned(bom(parts), owned.have); const bad = lines.filter((l) => !l.v.ok);
  if (bad.length) { console.error(`make: ${bad.length} part lines cannot be bought:\n` + bad.map((l) => `  ${l.part} colour ${l.ldColor}: ${l.v.reason}`).join('\n')); process.exit(1); }
  const est = estimate(lines);
  writeAll(bw, { 'placements.csv': placementsCsv(parts, lines), 'bom.csv': bomCsv(lines), 'rebrickable.csv': rebrickableCsv(lines), 'bricklink.xml': bricklinkXml(lines), 'shopping.md': shoppingMd(model, parts, lines, owned.sets, est, bad) });
  const { booklet } = await import('../src/booklet/booklet.mjs');
  const title = opt('title') ?? (fs.readFileSync(model, 'utf8').split('\n')[0].replace(/^0\s*/, '') || path.basename(setDir));
  const r = await booklet(model, bw, { title });
  const hash = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
  const files = ['model.ldr', 'parts.csv', 'brickwise/placements.csv', 'brickwise/bom.csv', 'brickwise/rebrickable.csv', 'brickwise/bricklink.xml', 'brickwise/shopping.md', 'brickwise/instructions.pdf'];
  fs.writeFileSync(path.join(outDir, 'MANIFEST.sha256'), files.map((f) => `${hash(path.join(outDir, f))}  ${f}`).join('\n') + '\n');
  console.log(`make: OK · ${parts.length} bricks · ${r.steps} steps · ${r.pages} pages · cost ${est.total[0]}-${est.total[1]} PLN\n  view:    ${path.join(outDir, 'set.html')}\n  booklet: ${r.pdf}\n  buy:     ${path.join(bw, 'shopping.md')}\n  hashes:  ${path.join(outDir, 'MANIFEST.sha256')}`);
} else if (cmd === 'booklet') {
  if (!file) usage();
  const { booklet } = await import('../src/booklet/booklet.mjs');
  readModel(file);
  const out = opt('out') ?? path.join(path.dirname(file), 'brickwise');
  const r = await booklet(file, out, { title: opt('title') });
  console.log(`${r.steps} steps on ${r.pages} pages -> ${r.pdf}`);
} else usage();

function shoppingMd(file, parts, lines, sets, est, bad) {
  const L = [];
  L.push(`# Shopping list: ${path.basename(file)}`, '');
  L.push(`${parts.length} bricks in ${lines.length} part/colour lines.`);
  if (sets.length) L.push(`Taken from your sets: ${sets.map((s) => `${s.set} ${s.name}`).join('; ')}. ${lines.reduce((a, l) => a + (l.owned ?? 0), 0)} bricks covered.`);
  L.push(`To buy: ${est.pieces} bricks in ${est.lots} lines.`, '');
  if (bad.length) { L.push(`## Cannot be bought (${bad.length} lines). Fix these in the design first`, '');
    for (const l of bad) L.push(`- ${l.part} in LDraw colour ${l.ldColor} (${l.qty}x): ${l.v.reason}${l.v.alternatives?.length ? `. Exists in: ${l.v.alternatives.map((a) => a.colour).join(', ')}` : ''}`);
    L.push(''); }
  L.push('## Cost estimate (PLN)', '');
  L.push(`| | low | high |`, `|---|---|---|`);
  L.push(`| bricks | ${est.parts[0]} | ${est.parts[1]} |`, `| shipping (about ${est.stores} store${est.stores === 1 ? '' : 's'}) | ${est.shipping[0]} | ${est.shipping[1]} |`, `| **total** | **${est.total[0]}** | **${est.total[1]}** |`, '');
  L.push(`By commonness: ${Object.entries(est.byTier).sort().map(([k, v]) => `${k} ${v}`).join(', ')}. Price per brick by tier: ${Object.entries(PRICE_PLN).map(([k, [a, b]]) => `${k} ${a}-${b}`).join(', ')} PLN.`);
  L.push('This is an estimate from commonness, not a live price. The real price shows up in the marketplace cart.', '');
  L.push('## How to buy', '');
  L.push('- **Rebrickable** (most reliable ids): rebrickable.com > My LEGO > Part Lists > Import > `rebrickable.csv`, then "Buy Parts" sends it to BrickLink or BrickOwl.');
  L.push('- **BrickLink**: bricklink.com > Wanted > Upload > paste `bricklink.xml`, then "Buy All" and filter stores by EU location.');
  const noBl = bricklinkMissing(lines);
  if (noBl.length) { L.push('', `**Warning:** ${noBl.length} line${noBl.length === 1 ? ' is' : 's are'} not in \`bricklink.xml\` because the colour has no BrickLink id. Add ${noBl.length === 1 ? 'it' : 'them'} to the wanted list by hand (the Rebrickable import has ${noBl.length === 1 ? 'it' : 'them'}):`, '');
    for (const l of noBl) L.push(`- ${l.v.rb} ${l.name}, ${l.v.colour.name} (Rebrickable colour ${l.v.colour.rb_id}): ${l.need}x`); }
  L.push('- LEGO® bricks or compatible bricks from other manufacturers both work; the ids above are LEGO element designs.');
  return L.join('\n') + '\n';
}
