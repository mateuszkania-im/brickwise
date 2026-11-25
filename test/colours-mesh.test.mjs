// mesh-colours.py must give the same colour grid on every run (runs only where the textured C-HR mesh exists locally).
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { spawnSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REF = path.join(ROOT, 'examples/toyota-chr-2025/ref');
const GLB = path.join(REF, 'chr-mesh-textured.glb');
test('mesh colouring is deterministic and matches the committed grid', { skip: !fs.existsSync(GLB) && 'textured mesh not present (it is not committed)' }, () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'bw-col-'));
  const run = (o) => { const r = spawnSync('python3', [path.join(ROOT, 'scripts/mesh-colours.py'), GLB, path.join(REF, 'chr-grid-36-tex.json'), '--palette', 'Blue,Dark Blue,Black,Dark Bluish Gray,Light Bluish Gray,White,Red', '--shell', '2', '--out', o], { encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); return fs.readFileSync(o, 'utf8'); };
  const a = run(path.join(d, 'a.json')), b = run(path.join(d, 'b.json'));
  assert.equal(a, b);
  assert.equal(a, fs.readFileSync(path.join(REF, 'chr-sculpture-36.json'), 'utf8'));
});
