// Bill of materials: from the flat part list to purchasable lines, with availability, owned-set subtraction and a price estimate.
// Pure functions of the model and the pinned data, so the output is the same on every run.
import fs from 'node:fs'; import path from 'node:path'; import zlib from 'node:zlib'; import { fileURLToPath } from 'node:url';
import { db, lookupLdraw, tier, parseCsv } from '../forge/engine/avail.mjs';

const DATA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data');
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** group placed parts into lines (part + colour), each with its verdict */
export function bom(parts) {
  const lines = new Map();
  for (const p of parts) { const k = `${p.part}|${p.color}`; if (!lines.has(k)) lines.set(k, { part: p.part, ldColor: p.color, qty: 0, placements: [] }); const l = lines.get(k); l.qty++; l.placements.push(p.n); }
  const out = [...lines.values()].map((l) => { const v = lookupLdraw(l.part, l.ldColor); return { ...l, v, tier: tier(v), name: db().names.get(v.rb) ?? l.part }; });
  return out.sort((a, b) => cmp(a.v.rb ?? a.part, b.v.rb ?? b.part) || cmp(a.v.colour?.rb_id ?? a.ldColor, b.v.colour?.rb_id ?? b.ldColor));
}

/** parts of owned sets, keyed "rbPart|rbColour" -> quantity. Set numbers without "-1" get it added. */
export function ownedParts(setNums) {
  if (!setNums.length) return { have: new Map(), sets: [] };
  const want = new Set(setNums.map((s) => (/-\d+$/.test(s) ? s : s + '-1')));
  const sets = parseCsv(fs.readFileSync(path.join(DATA, 'sets.csv'), 'utf8')).filter((s) => want.has(s.set));
  const missing = [...want].filter((s) => !sets.some((x) => x.set === s));
  if (missing.length) throw new Error(`unknown set number(s): ${missing.join(', ')}`);
  const text = zlib.gunzipSync(fs.readFileSync(path.join(DATA, 'set_parts.csv.gz'))).toString('utf8');
  const have = new Map();
  for (const line of text.split('\n')) { const c = line.indexOf(','); if (c < 0) continue; const s = line.slice(0, c); if (!want.has(s)) continue;
    const [, part, color, q] = line.split(','); const k = `${part}|${color}`; have.set(k, (have.get(k) ?? 0) + Number(q)); }
  return { have, sets };
}

/** subtract owned parts; returns lines with .need (to buy) and .owned (taken from your sets) */
export function subtractOwned(lines, have) {
  const left = new Map(have);
  return lines.map((l) => { if (!l.v.ok) return { ...l, owned: 0, need: l.qty };
    const k = `${l.v.rb}|${l.v.colour.rb_id}`; const h = left.get(k) ?? 0; const used = Math.min(h, l.qty); if (used) left.set(k, h - used);
    return { ...l, owned: used, need: l.qty - used }; });
}

// Price estimate in PLN per piece, by commonness tier. These are rules of thumb from BrickLink EU averages, not live prices:
// a live price needs a marketplace API (see docs/pricing.md). Low and high bound the realistic range for new parts.
export const PRICE_PLN = { common: [0.15, 0.40], regular: [0.30, 0.80], uncommon: [0.60, 1.80], rare: [1.50, 5.00] };
export const SHIPPING_PLN = { perStore: [15, 45] };

export function estimate(lines) {
  let lo = 0, hi = 0, pieces = 0; const byTier = {};
  for (const l of lines) { if (!l.v.ok || !l.need) continue; const [a, b] = PRICE_PLN[l.tier]; lo += a * l.need; hi += b * l.need; pieces += l.need; byTier[l.tier] = (byTier[l.tier] ?? 0) + l.need; }
  const lots = lines.filter((l) => l.v.ok && l.need).length;
  const stores = lots ? Math.min(12, Math.max(1, Math.ceil(lots / 40))) : 0;
  const ship = [stores * SHIPPING_PLN.perStore[0], stores * SHIPPING_PLN.perStore[1]];
  const r = (v) => Math.round(v);
  return { pieces, lots, byTier, parts: [r(lo), r(hi)], stores, shipping: ship, total: [r(lo + ship[0]), r(hi + ship[1])] };
}
