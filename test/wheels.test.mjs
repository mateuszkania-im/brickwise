// Wheel mounting rule: a rim on an axle through a Technic hole passes; a rim floating at the same place fails.
import test from 'node:test'; import assert from 'node:assert/strict';
import { Model } from '../forge/engine/model.mjs'; import { check } from '../forge/engine/check.mjs';
const RZ = [0, 0, -1, 0, 1, 0, 1, 0, 0];   // quarter turn about y: an axle that runs along x now runs along z
function car(withAxle) {
  const m = new Model({ title: 't', budget: [1, 2000] });
  m.plate('2x4', 0, 0, 0, 'Black'); m.part('3700', 0, 1, 1, 'Black', 0);   // Technic brick 1x2, hole axis along z at x 1, y 1 + 1.75 plates
  const hub = [1, (1 + 1.75) * 0.4, 1.5];
  if (withAxle) m.free('3705', 'Light Bluish Gray', hub, RZ);
  m.free('56145', 'Flat Silver', [hub[0], hub[1], 3.2], RZ); m.free('56891', 'Black', [hub[0], hub[1], 3.2], RZ);
  m.pack(); return check(m);
}
const wheelErrors = (res) => res.issues.filter((x) => x.level === 'error' && /mounted|Technic hole|no rim/.test(x.msg));
test('rim on an axle through a Technic hole is mounted', () => { assert.deepEqual(wheelErrors(car(true)).map((x) => x.msg), []); });
test('rim without an axle is refused', () => { assert.ok(wheelErrors(car(false)).some((x) => /not mounted/.test(x.msg))); });
// tyre 56891 at this pose: box x -0.4..1.85 (axle along x), z 0.9..5.5, y -1.2..3.4 studs; round section centre (z 3.2, y 1.1), radius 2.3
function tyreWith(plateAt) {
  const m = new Model({ title: 't', budget: [1, 2000] });
  m.free('56891', 'Black', [1, (1 + 1.75) * 0.4, 3.2], RZ);
  m.plate('1x1', ...plateAt, 'Black');
  m.pack(); return check(m).issues.filter((x) => /passes through/.test(x.msg));
}
test('a plate in the corner of the tyre box but outside the round tyre does not collide', () => {
  assert.deepEqual(tyreWith([0, 8, 1]).map((x) => x.msg), []);   // cell x 0..1, z 1..2, y 3.2..3.6: inside the box, outside the circle
});
test('a plate inside the round tyre collides', () => {
  assert.ok(tyreWith([0, 2, 3]).length > 0);   // cell z 3..4, y 0.8..1.2: inside the circle
});
