// Known facts about real parts: these must never change silently.
import test from 'node:test'; import assert from 'node:assert/strict';
import { lookup, lookupLdraw, mapPart } from '../forge/engine/avail.mjs';
test('plain parts in common colours are buyable', () => {
  for (const [id, c] of [['3001', 'Red'], ['3023b', 'Black'], ['3070b', 'White'], ['41539', 'Light Bluish Gray']]) assert.ok(lookup(id, c).ok, `${id} ${c}`);
});
test('combinations that were never produced are refused', () => {
  for (const [id, c] of [['41539', 'Reddish Brown'], ['3622', 'Trans Black'], ['3069b', 'Flat Silver'], ['3666', 'Trans Clear']]) assert.equal(lookup(id, c).ok, false, `${id} ${c}`);
});
test('refusals name colours that do exist', () => { const v = lookup('41539', 'Reddish Brown'); assert.ok(v.alternatives.some((a) => a.colour === 'Dark Bluish Gray')); });
test('LDraw colour codes map by meaning, not by number', () => {
  assert.equal(lookupLdraw('3001', '330').colour.name, 'Olive Green');   // Rebrickable id 326
  assert.equal(lookupLdraw('3001', '326').colour?.name ?? 'none', 'Yellowish Green');   // LDraw 326, Rebrickable 158
  assert.equal(lookupLdraw('3024', '315').colour.name, 'Flat Silver');   // via data/colour_overrides.csv
});
test('part id mapping', () => {
  assert.deepEqual([mapPart('3023b').rb, mapPart('3023b').method], ['3023', 'suffix']);
  assert.equal(mapPart('92903').rb, '6005');
  assert.equal(mapPart('3070bpta').rb, '3070bpr0063');
  assert.equal(mapPart('973p01').rb, '');   // printed minifig torsos: no verified mapping, refused
});
