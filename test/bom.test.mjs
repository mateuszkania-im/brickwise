import test from 'node:test'; import assert from 'node:assert/strict';
import { ownedParts, subtractOwned, bom, estimate } from '../src/bom.mjs';
const P = (n, part, color) => ({ n, part, color, pos: [0, 0, 0], m: [1, 0, 0, 0, 1, 0, 0, 0, 1], step: 0 });
test('owned sets are subtracted per part and colour', () => {
  const { have, sets } = ownedParts(['60337']);   // Express Passenger Train
  assert.equal(sets[0].set, '60337-1');
  const lines = subtractOwned(bom([P(0, '3023', '0'), P(1, '3023', '0'), P(2, '3001', '4')]), have);
  const black = lines.find((l) => l.part === '3023'); assert.equal(black.owned + black.need, 2);
  assert.ok(have.size > 50);
});
test('unknown set numbers are an error', () => { assert.throws(() => ownedParts(['99999999']), /unknown set/); });
test('estimate is a pure function', () => {
  const lines = subtractOwned(bom([P(0, '3001', '4'), P(1, '3001', '4'), P(2, '3024', '15')]), new Map());
  assert.deepEqual(estimate(lines), estimate(lines)); assert.equal(estimate(lines).pieces, 3);
});
test('lines without a BrickLink colour id are left out of bricklink.xml and reported', async () => {
  const { bricklinkXml, bricklinkMissing } = await import('../src/export.mjs');
  const line = (rb, bl) => ({ part: rb, qty: 2, need: 2, name: 'Brick', v: { ok: true, rb, colour: { name: 'Pearl Lime', rb_id: 1086, bricklink: bl } } });
  const lines = [line('3001', '34'), line('3003', '')];
  assert.deepEqual(bricklinkMissing(lines).map((l) => l.v.rb), ['3003']);
  const xml = bricklinkXml(lines); assert.match(xml, /<ITEMID>3001</); assert.doesNotMatch(xml, /<ITEMID>3003</);
});
