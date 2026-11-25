// Build steps: every part exactly once, and every part has support (table or a part placed in an earlier or the same step).
import test from 'node:test'; import assert from 'node:assert/strict';
import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
import { Model } from '../forge/engine/model.mjs'; import * as kit from '../forge/engine/kit.mjs';
import { plan, verify } from '../forge/engine/steps.mjs'; import { resolve } from '../forge/engine/catalog.mjs';
const FIX = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/retro-computer/build.mjs');
const load = async () => { const mod = await import(pathToFileURL(FIX).href); const m = await mod.default({ Model, kit }); m.pack(); return m; };
test('plan covers every part once and is stable', async () => {
  const m = await load(); const a = plan(m); verify(m, a); const b = plan(await load());
  assert.deepEqual(a, b);
  // at most 8 parts per step, unless the step is one rigid unit (a kit such as a sign panel is placed in one go)
  assert.ok(a.every((s) => s.length >= 1 && (s.length <= 8 || new Set(s.map((i) => m.parts[i].group)).size === 1 && m.parts[s[0]].group)));
});
test('every part is held when it is placed', async () => {
  const m = await load(); const steps = plan(m); const R = m.parts.map((p) => resolve(p)); const stepOf = new Map(); steps.forEach((s, k) => s.forEach((i) => stepOf.set(i, k)));
  const touches = (i, j) => { const a = R[i].aabb, b = R[j].aabb; const ov = (k) => Math.min(a[k + 3], b[k + 3]) - Math.max(a[k], b[k]); return ov(0) > -0.01 && ov(2) > -0.01 && ov(1) > -0.05; };
  for (let i = 0; i < m.parts.length; i++) {
    if (R[i].aabb[1] < 0.05 || m.parts[i].group) continue;
    const ok = m.parts.some((_, j) => j !== i && stepOf.get(j) <= stepOf.get(i) && touches(i, j));
    assert.ok(ok, `part ${i} (${m.parts[i].id}) has nothing placed under or beside it at step ${stepOf.get(i) + 1}`);
  }
});
