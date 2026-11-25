// The whole chain from a saved design: two runs and the golden manifest must be byte-identical.
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { spawnSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIX = path.join(ROOT, 'test/fixtures/retro-computer');
const run = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'bw-e2e-')); fs.copyFileSync(path.join(FIX, 'build.mjs'), path.join(d, 'build.mjs'));
  const r = spawnSync(process.execPath, [path.join(ROOT, 'bin/brickwise.mjs'), 'make', d, '--title', 'Retro computer (test fixture)'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr); return fs.readFileSync(path.join(d, 'out/MANIFEST.sha256'), 'utf8'); };
test('make is deterministic end to end', { timeout: 900000 }, () => {
  const a = run(); const b = run();
  assert.equal(a, b, 'two runs differ');
  assert.equal(a, fs.readFileSync(path.join(FIX, 'MANIFEST.golden'), 'utf8'), 'differs from the golden manifest');
});
