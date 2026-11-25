// Every example with a MANIFEST.golden is rebuilt from its saved design in a fresh folder and must match byte for byte.
// Slow (renders every booklet page). Skip with BW_FAST=1.
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { spawnSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EX = path.join(ROOT, 'examples');
const sets = fs.readdirSync(EX).filter((d) => fs.existsSync(path.join(EX, d, 'MANIFEST.golden'))).sort();
for (const name of sets) {
  test(`example ${name} rebuilds identically`, { skip: process.env.BW_FAST === '1', timeout: 1800000 }, () => {
    const src = path.join(EX, name); const d = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'bw-ex-')), name);
    fs.mkdirSync(path.join(d, 'ref'), { recursive: true }); fs.copyFileSync(path.join(src, 'build.mjs'), path.join(d, 'build.mjs'));
    for (const f of fs.readdirSync(path.join(src, 'ref')).filter((f) => f.endsWith('.json'))) fs.copyFileSync(path.join(src, 'ref', f), path.join(d, 'ref', f));
    const golden = fs.readFileSync(path.join(src, 'MANIFEST.golden'), 'utf8');
    const titleArg = fs.readFileSync(path.join(src, 'TITLE'), 'utf8').trim();   // the booklet title the golden was made with
    const r = spawnSync(process.execPath, [path.join(ROOT, 'bin/brickwise.mjs'), 'make', d, '--title', titleArg], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.equal(fs.readFileSync(path.join(d, 'out/MANIFEST.sha256'), 'utf8'), golden);
  });
}
