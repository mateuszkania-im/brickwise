// Part + colour availability, ID mapping and commonness, from the pinned data tables in brickwise/data.
// Every lookup is a pure function of those files, so the same model always gets the same verdict.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { COLORS } from './colors.mjs';

const DATA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data');

/** minimal CSV parser: commas, double-quoted fields, "" escapes */
export function parseCsv(text) {
  const rows = []; let row = []; let cur = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; continue; }
    if (ch === '"') q = true; else if (ch === ',') { row.push(cur); cur = ''; }
    else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; } else if (ch !== '\r') cur += ch;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  const [head, ...body] = rows; return body.map((r) => Object.fromEntries(head.map((h, k) => [h, r[k] ?? ''])));
}
const read = (f) => parseCsv(fs.readFileSync(path.join(DATA, f), 'utf8'));

let DB = null;
export function db() {
  if (DB) return DB;
  const colors = read('colors.csv');
  const byLdraw = new Map(); for (const c of colors) for (const code of c.ldraw.split(' ').filter(Boolean)) if (!byLdraw.has(code)) byLdraw.set(code, c);
  const byRb = new Map(colors.map((c) => [c.rb_id, c]));
  for (const o of read('colour_overrides.csv')) { const c = byRb.get(o.rb); if (!c) throw new Error(`colour override ${o.ldraw} -> ${o.rb}: unknown Rebrickable colour`); byLdraw.set(o.ldraw, c); }
  const pc = new Map(); for (const r of read('part_colors.csv')) { if (!pc.has(r.part)) pc.set(r.part, new Map()); pc.get(r.part).set(r.rb_color, { sets: +r.num_sets, last: +r.max_year }); }
  const names = new Map(read('parts.csv').map((r) => [r.part, r.name]));
  const overrides = new Map(read('forge_part_overrides.csv').map((r) => [r.ldraw, r.rb]));
  const rels = read('part_rels.csv');
  DB = { colors, byLdraw, byRb, pc, names, overrides, rels, mapCache: new Map() };
  return DB;
}

/** forge colour name -> data colour row (via the LDraw code), or null */
export function colourRow(name) {
  const e = Object.entries(COLORS).find(([n]) => norm(n) === norm(name)); if (!e) return null;
  return db().byLdraw.get(String(e[1][0])) ?? null;
}
const norm = (s) => String(s).toLowerCase().replace(/grey/g, 'gray').replace(/[^a-z]/g, '');

/**
 * Verdict for one part id (LDraw/forge id) in one colour name.
 * { ok, rb, bl, colour, sets, last, reason, alternatives }
 */
export function lookup(id, colourName) { return lookupRow(id, colourRow(colourName), colourName); }
/** same, with an LDraw colour code (as in .ldr files) */
export function lookupLdraw(id, code) { return lookupRow(id, db().byLdraw.get(String(code)) ?? null, `LDraw colour ${code}`); }

/**
 * LDraw part id -> Rebrickable part id, and how it was decided. Rules, in order: exact id; id without a mould suffix (a-d);
 * manual override (data/forge_part_overrides.csv); a mould/alternate relation. Anything else is unmapped.
 */
export function mapPart(id) {
  const D = db(); id = String(id).toLowerCase(); if (D.mapCache.has(id)) return D.mapCache.get(id);
  let rb = '', method = 'unmapped'; const bare = id.replace(/[a-d]$/, '');
  if (D.pc.has(id)) { rb = id; method = 'exact'; }
  else if (bare !== id && D.pc.has(bare)) { rb = bare; method = 'suffix'; }
  else if (D.overrides.has(id)) { rb = D.overrides.get(id); method = 'override'; if (!D.pc.has(rb)) throw new Error(`override ${id} -> ${rb}: ${rb} has no colours in the data`); }
  else { const r = D.rels.find((x) => (x.child === id && D.pc.has(x.parent)) || (x.parent === id && D.pc.has(x.child))); if (r) { rb = r.child === id ? r.parent : r.child; method = 'relation-' + r.rel; } }
  const res = { ldraw: id, rb, method }; D.mapCache.set(id, res); return res;
}

function lookupRow(id, c, colourLabel) {
  const D = db(); const m = mapPart(id);
  if (!m.rb) return { ok: false, reason: `part ${id} has no verified Rebrickable mapping, so it cannot be bought reliably`, alternatives: [] };
  if (!c) return { ok: false, rb: m.rb, reason: `${colourLabel} has no verified mapping`, alternatives: [] };
  const inColours = D.pc.get(m.rb);
  const hit = inColours?.get(c.rb_id);
  const alternatives = inColours ? [...inColours].map(([rc, v]) => ({ colour: D.byRb.get(rc)?.name ?? rc, ...v })).sort((a, b) => b.sets - a.sets || (a.colour < b.colour ? -1 : 1)).slice(0, 6) : [];
  if (!hit) return { ok: false, rb: m.rb, colour: c, reason: `${m.rb} "${D.names.get(m.rb) ?? ''}" was never produced in ${c.name}`, alternatives };
  return { ok: true, rb: m.rb, bl: c.bricklink, colour: c, sets: hit.sets, last: hit.last, alternatives };
}

/** commonness tier from how many sets contain the part in that colour and when it was last made */
export function tier(v) {
  if (!v.ok) return 'unavailable';
  if (v.sets >= 200 && v.last >= 2018) return 'common';
  if (v.sets >= 20 && v.last >= 2012) return 'regular';
  if (v.sets >= 3) return 'uncommon';
  return 'rare';
}
