import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { parseLdr } from '../src/ldr.mjs';
test('MPD submodels are flattened with their transforms and colour 16 inherits', () => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'bw-')), 'm.mpd');
  fs.writeFileSync(f, ['0 FILE main.ldr', '1 4 0 0 0 1 0 0 0 1 0 0 0 1 3001.dat', '0 STEP', '1 1 100 0 0 1 0 0 0 1 0 0 0 1 sub.ldr', '0 FILE sub.ldr', '1 16 0 -24 0 1 0 0 0 1 0 0 0 1 3003.dat'].join('\n'));
  const p = parseLdr(f);
  assert.equal(p.length, 2); assert.deepEqual(p[1].pos, [100, -24, 0]); assert.equal(p[1].color, '1'); assert.equal(p[1].step, 1);
});
test('bad lines are errors, not silently skipped', () => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'bw-')), 'b.ldr'); fs.writeFileSync(f, '1 4 0 0 0 1 0 0 0 1 0 0 0 1\n');
  assert.throws(() => parseLdr(f), /bad type-1 line/);
});
test('MPD with a header before the first 0 FILE takes that first 0 FILE as the main model', () => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'bw-')), 'h.mpd');
  fs.writeFileSync(f, ['', '0 Exported by SomeEditor 2.0', '0 FILE main.ldr', '1 4 0 0 0 1 0 0 0 1 0 0 0 1 3001.dat', '1 1 0 -24 0 1 0 0 0 1 0 0 0 1 sub.ldr', '0 FILE sub.ldr', '1 16 0 0 0 1 0 0 0 1 0 0 0 1 3003.dat'].join('\n'));
  const p = parseLdr(f);
  assert.equal(p.length, 2); assert.deepEqual(p.map((x) => x.part), ['3001', '3003']); assert.equal(p[1].color, '1');
});
test('plain .ldr with blank lines and comments before the parts still parses', () => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'bw-')), 'p.ldr');
  fs.writeFileSync(f, ['', '0 My model', '0 Name: p.ldr', '1 4 0 0 0 1 0 0 0 1 0 0 0 1 3001.dat'].join('\n'));
  assert.equal(parseLdr(f).length, 1);
});
