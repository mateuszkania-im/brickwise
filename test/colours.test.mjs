// Every forge colour must map to exactly the Rebrickable colour with the same name (or a known alias), never by id coincidence.
import test from 'node:test'; import assert from 'node:assert/strict';
import { COLORS } from '../forge/engine/colors.mjs';
import { colourRow } from '../forge/engine/avail.mjs';

// forge name -> Rebrickable name, where the two catalogues name the same colour differently
const ALIAS = { 'Trans Black': 'Trans-Brown', 'Trans Light Blue': 'Trans-Light Blue', 'Trans Orange': 'Trans-Orange', 'Trans Pink': 'Trans-Pink',
  'Medium Tan': 'Warm Tan', 'Dark Purple': 'Dark Purple' };
const norm = (s) => s.toLowerCase().replace(/grey/g, 'gray').replace(/[^a-z]/g, '');

for (const name of Object.keys(COLORS)) {
  test(`colour ${name}`, () => {
    const row = colourRow(name);
    assert.ok(row, `${name} (LDraw ${COLORS[name][0]}) has no data row`);
    assert.equal(norm(row.name), norm(ALIAS[name] ?? name), `${name} (LDraw ${COLORS[name][0]}) maps to "${row.name}"`);
    assert.ok(row.bricklink, `${name} has no BrickLink colour id`);
  });
}
