// CLI error paths: user mistakes give a clear message and exit code, not a stack trace or empty output.
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { spawnSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BW = path.join(ROOT, 'bin/brickwise.mjs');
const tmp = (name, text) => { const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'bw-cli-')), name); fs.writeFileSync(f, text); return f; };
const run = (...a) => spawnSync(process.execPath, [BW, ...a], { encoding: 'utf8' });

test('bom on a model with no parts fails with a clear error', () => {
  const r = run('bom', tmp('empty.ldr', '0 Nothing here\n0 STEP\n'));
  assert.equal(r.status, 1); assert.match(r.stderr, /has no parts/); assert.doesNotMatch(r.stderr, /\n\s+at /);
});
test('booklet on a model with no parts fails before rendering', () => {
  const r = run('booklet', tmp('empty.mpd', '0 FILE main.ldr\n0 STEP\n'));
  assert.equal(r.status, 1); assert.match(r.stderr, /has no parts/);
});
test('unknown --have set is a clean error, not a stack trace', () => {
  const r = run('bom', tmp('m.ldr', '1 4 0 0 0 1 0 0 0 1 0 0 0 1 3001.dat\n'), '--have', '99999999');
  assert.equal(r.status, 1); assert.match(r.stderr, /unknown set number\(s\): 99999999-1/); assert.doesNotMatch(r.stderr, /\n\s+at /);
});
