// mesh-to-grid on a known box: a 2 x 1 x 1 box at 4 studs long must fill a 4 x 2 x 5-plate grid completely, twice the same.
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { spawnSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function boxGlb(f, extra = {}) {
  const P = new Float32Array([0, 0, 0, 2, 0, 0, 2, 1, 0, 0, 1, 0, 0, 0, 1, 2, 0, 1, 2, 1, 1, 0, 1, 1]);
  const I = new Uint16Array([0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2, 0, 4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5]);
  const bin = Buffer.concat([Buffer.from(P.buffer), Buffer.from(I.buffer)]); const pad = (b, c) => Buffer.concat([b, Buffer.alloc((4 - (b.length % 4)) % 4, c)]);
  const json = { asset: { version: '2.0' }, buffers: [{ byteLength: bin.length }], bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: P.byteLength }, { buffer: 0, byteOffset: P.byteLength, byteLength: I.byteLength }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 8, type: 'VEC3' }, { bufferView: 1, componentType: 5123, count: 36, type: 'SCALAR' }], meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }], ...extra };
  const J = pad(Buffer.from(JSON.stringify(json)), 0x20), B = pad(bin, 0); const h = Buffer.alloc(12); h.writeUInt32LE(0x46546c67, 0); h.writeUInt32LE(2, 4); h.writeUInt32LE(12 + 8 + J.length + 8 + B.length, 8);
  const c = (t, b) => { const x = Buffer.alloc(8); x.writeUInt32LE(b.length, 0); x.writeUInt32LE(t, 4); return Buffer.concat([x, b]); };
  fs.writeFileSync(f, Buffer.concat([h, c(0x4e4f534a, J), c(0x004e4942, B)]));
}
test('box voxelises exactly and deterministically', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'bw-mesh-')); const g = path.join(d, 'box.glb'); boxGlb(g);
  const run = (o) => { const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts/mesh-to-grid.mjs'), g, '--length', '4', '--out', o], { encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); return fs.readFileSync(o, 'utf8'); };
  const a = run(path.join(d, 'a.json')), b = run(path.join(d, 'b.json')); assert.equal(a.replace(/"source":[^,]*/, ''), b.replace(/"source":[^,]*/, ''));
  const j = JSON.parse(a); assert.deepEqual([j.length_studs, j.width_studs, j.height_plates], [4, 2, 5]);
  assert.ok(j.layers.every((l) => l.every((r) => r === '####')));
});

const grid = (args) => spawnSync(process.execPath, [path.join(ROOT, 'scripts/mesh-to-grid.mjs'), ...args], { encoding: 'utf8' });
test('GLB without scenes: a mesh in a child node is voxelised once, not twice', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'bw-mesh-')); const g = path.join(d, 'child.glb');
  boxGlb(g, { nodes: [{ children: [1] }, { mesh: 0 }] });   // node 0 is the parent, node 1 (the box) its child; no "scenes"
  const r = grid([g, '--length', '4', '--out', path.join(d, 'c.json')]); assert.equal(r.status, 0, r.stderr);
  const j = JSON.parse(fs.readFileSync(path.join(d, 'c.json'), 'utf8'));
  assert.ok(j.layers.every((l) => l.every((row) => row === '####')), 'doubled triangles cancel out under even-odd and leave the box hollow');
});
test('mesh-to-grid: missing file and bad --length give usage errors', () => {
  const r0 = grid([]); assert.equal(r0.status, 2); assert.match(r0.stderr, /usage:/);
  for (const bad of ['0', '-3', '2.5', 'abc']) { const r = grid(['x.glb', '--length', bad]); assert.equal(r.status, 2, bad); assert.match(r.stderr, /--length must be a positive whole number/); }
  const r1 = grid(['x.glb', '--length']); assert.equal(r1.status, 2); assert.match(r1.stderr, /--length/);
});
test('mesh-colours: a palette larger than the index alphabet fails clearly', { skip: spawnSync('python3', ['-c', 'import numpy, PIL']).status !== 0 && 'numpy/Pillow not installed' }, () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'bw-col-'));
  const r = spawnSync('python3', [path.join(ROOT, 'scripts/mesh-colours.py'), path.join(d, 'none.glb'), path.join(d, 'none.json'), '--palette', Array(62).fill('Black').join(','), '--out', path.join(d, 'o.json')], { encoding: 'utf8' });
  assert.notEqual(r.status, 0); assert.match(r.stderr, /at most 61 fit/);
  const src = fs.readFileSync(path.join(ROOT, 'scripts/mesh-colours.py'), 'utf8'); const chars = /PALETTE_CHARS = '([^']+)'/.exec(src)[1];
  assert.ok(!chars.includes('i') && !chars.includes('.'), 'palette characters must not collide with interior or empty markers');
  assert.equal(new Set(chars).size, chars.length);
});
test('photos-to-3d --engine tripo refuses a gap in the positional view order', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'bw-p3d-')); const img = path.join(d, 'a.jpg'); fs.writeFileSync(img, 'x');
  const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts/photos-to-3d.mjs'), '--engine', 'tripo', '--front', img, '--back', img, '--out', path.join(d, 'o.glb')], { encoding: 'utf8', env: { ...process.env, FAL_KEY: 'test-no-network' } });
  assert.equal(r.status, 2, r.stderr); assert.match(r.stderr, /missing --left before --back/);
});
