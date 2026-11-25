// The derived data tables must be exactly the pinned build outputs.
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { fileURLToPath } from 'node:url';
const DATA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data');
test('data files match data/OUTPUTS.sha256', () => {
  for (const line of fs.readFileSync(path.join(DATA, 'OUTPUTS.sha256'), 'utf8').trim().split('\n')) {
    const [hash, file] = line.split(/\s+/);
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(DATA, file))).digest('hex'), hash, file);
  }
});
