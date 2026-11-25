// Build-step planner. Deterministic: the same model always gives the same steps.
// A part can be placed once it stands on the table or is held by a part already placed (studs into anti-studs, either way).
// Parts held from below come first; a part that only hangs from above waits until what holds it is there.
// Each step takes the lowest layer that can be placed, at most MAX parts, in a fixed order (z, x, part, colour, index).
import { resolve, part as partDef } from './catalog.mjs';

const EPS = 0.06;
export const MAX_PER_STEP = 8;

/** stud links between parts: below[j] = parts j sits on, above[i] = parts sitting on i */
function links(parts, R) {
  const below = parts.map(() => new Set()), above = parts.map(() => new Set());
  const byBottom = new Map(); R.forEach((r, i) => { if (r.free) return; const y = parts[i].y; if (!byBottom.has(y)) byBottom.set(y, []); byBottom.get(y).push(i); });
  R.forEach((r, i) => { for (const [sx, sz, sy] of r.studs) { if (Math.abs(sy - Math.round(sy)) > 0.02) continue; const list = byBottom.get(Math.round(sy)); if (!list) continue;
    for (const j of list) { if (j === i) continue; const f = R[j].female;
      if (f.some(([x, z]) => Math.abs(x - sx) < EPS && Math.abs(z - sz) < EPS) || tube(f, sx, sz)) { below[j].add(i); above[i].add(j); } } } });
  return { below, above };
}
const tube = (f, x, z) => [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].every(([a, b]) => f.some(([fx, fz]) => Math.abs(fx - (x + a)) < EPS && Math.abs(fz - (z + b)) < EPS));

/** returns steps: arrays of part indices, in build order */
export function plan(model) {
  const parts = model.parts; const R = parts.map((p) => resolve(p)); const { below, above } = links(parts, R);
  // rigid groups (kits: minifigures, signs) are placed as one unit
  const unitOf = parts.map((p, i) => i); const members = new Map();
  parts.forEach((p, i) => { if (!p.group) return; if (!members.has(p.group)) members.set(p.group, []); members.get(p.group).push(i); });
  for (const list of members.values()) for (const i of list) unitOf[i] = list[0];
  const units = new Map(); parts.forEach((p, i) => { const u = unitOf[i]; if (!units.has(u)) units.set(u, []); units.get(u).push(i); });
  const bottom = (u) => Math.min(...units.get(u).map((i) => R[i].aabb[1]));
  const key = (u) => { const i = units.get(u)[0]; const p = parts[i]; const a = R[i].aabb; return [Math.round(bottom(u) * 1000), Math.round(a[2] * 100), Math.round(a[0] * 100), p.id, p.color, i]; };
  const cmp = (a, b) => { const x = key(a), y = key(b); for (let k = 0; k < x.length; k++) { if (x[k] < y[k]) return -1; if (x[k] > y[k]) return 1; } return 0; };

  const placed = new Set(); const steps = [];
  const isPlaced = (i) => placed.has(unitOf[i]);
  const heldFromBelow = (u) => units.get(u).some((i) => R[i].aabb[1] < 0.05 || [...below[i]].some((j) => unitOf[j] !== u && isPlaced(j)));
  const heldAtAll = (u) => heldFromBelow(u) || units.get(u).some((i) => [...above[i]].some((j) => unitOf[j] !== u && isPlaced(j)));
  while (placed.size < units.size) {
    const open = [...units.keys()].filter((u) => !placed.has(u));
    let ready = open.filter(heldFromBelow);
    if (!ready.length) ready = open.filter(heldAtAll);
    if (!ready.length) ready = open;   // loose parts (a car parked on a base): they still go in, lowest first
    ready.sort(cmp);
    const level = key(ready[0])[0]; const step = []; let count = 0;
    for (const u of ready) { if (key(u)[0] !== level) break; const n = units.get(u).length; if (count && count + n > MAX_PER_STEP) break; step.push(u); count += n; }
    for (const u of step) placed.add(u);
    steps.push(step.flatMap((u) => units.get(u)).sort((a, b) => a - b));
  }
  return merge(steps, parts, R);
}

/** sanity: every part exactly once */
export function verify(model, steps) {
  const seen = new Array(model.parts.length).fill(0); for (const s of steps) for (const i of s) seen[i]++;
  const bad = seen.map((n, i) => [n, i]).filter(([n]) => n !== 1);
  if (bad.length) throw new Error(`step plan error: ${bad.length} parts placed ${bad[0][0]} times (first: #${bad[0][1]} ${partDef(model.parts[bad[0][1]].id)?.name})`);
}

/** join consecutive small steps (order is kept, so every part still has its support) while a step stays <= MAX parts
 *  and spans at most one brick (3 plates) of height, as printed manuals do */
function merge(steps, parts, R) {
  const out = []; let cur = null; let lo = 0, hi = 0;
  for (const s of steps) {
    const sLo = Math.min(...s.map((i) => parts[i].y ?? 0)), sHi = Math.max(...s.map((i) => parts[i].y ?? 0));
    if (cur && cur.length + s.length <= MAX_PER_STEP && Math.max(hi, sHi) - Math.min(lo, sLo) <= 3) { cur.push(...s); lo = Math.min(lo, sLo); hi = Math.max(hi, sHi); continue; }
    if (cur) out.push(cur); cur = [...s]; lo = sLo; hi = sHi;
  }
  if (cur) out.push(cur);
  return out;
}
