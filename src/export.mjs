// Output files. Everything is written in a fixed order with fixed formatting, so two runs give byte-identical files.
import fs from 'node:fs'; import path from 'node:path';

const q = (s) => { s = String(s ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csv = (rows) => rows.map((r) => r.map(q).join(',')).join('\n') + '\n';
const xmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** one row per placed brick: which part, which colour, exactly where, in which build step */
export function placementsCsv(parts, lines) {
  const byN = new Map(); for (const l of lines) for (const n of l.placements) byN.set(n, l);
  const rows = [['n', 'step', 'ldraw_part', 'rebrickable_part', 'ldraw_colour', 'colour', 'x_ldu', 'y_ldu', 'z_ldu', 'rotation']];
  for (const p of parts) { const l = byN.get(p.n);
    rows.push([p.n + 1, p.step + 1, p.part, l?.v.rb ?? '', p.color, l?.v.colour?.name ?? '', p.pos[0], p.pos[1], p.pos[2], p.m.join(' ')]); }
  return csv(rows);
}

export function bomCsv(lines) {
  const rows = [['rebrickable_part', 'ldraw_part', 'name', 'colour', 'rebrickable_colour', 'bricklink_colour', 'quantity', 'owned', 'to_buy', 'tier', 'sets_with_it', 'last_year', 'status']];
  for (const l of lines) rows.push([l.v.rb ?? '', l.part, l.name, l.v.colour?.name ?? '', l.v.colour?.rb_id ?? '', l.v.colour?.bricklink ?? '', l.qty, l.owned ?? 0, l.need ?? l.qty, l.tier, l.v.sets ?? '', l.v.last ?? '', l.v.ok ? 'ok' : 'ERROR: ' + l.v.reason]);
  return csv(rows);
}

/** Rebrickable part-list import (Part, Color, Quantity with Rebrickable ids). Rebrickable converts it to BrickLink/BrickOwl itself. */
export function rebrickableCsv(lines) {
  const rows = [['Part', 'Color', 'Quantity']];
  for (const l of lines) if (l.v.ok && l.need) rows.push([l.v.rb, l.v.colour.rb_id, l.need]);
  return csv(rows);
}

/** lines to buy that have no BrickLink colour id: they cannot go into bricklink.xml and must be added there by hand */
export function bricklinkMissing(lines) { return lines.filter((l) => l.v.ok && l.need && !l.v.colour.bricklink); }

/** BrickLink wanted-list XML. Lines from bricklinkMissing() are left out (shopping.md lists them). Colour ids are verified; part ids are Rebrickable ids, which match BrickLink for almost all plain parts. */
export function bricklinkXml(lines) {
  const items = lines.filter((l) => l.v.ok && l.need && l.v.colour.bricklink).map((l) =>
    `  <ITEM>\n    <ITEMTYPE>P</ITEMTYPE>\n    <ITEMID>${xmlEsc(l.v.rb)}</ITEMID>\n    <COLOR>${l.v.colour.bricklink.split(' ')[0]}</COLOR>\n    <MINQTY>${l.need}</MINQTY>\n  </ITEM>`);
  return `<INVENTORY>\n${items.join('\n')}\n</INVENTORY>\n`;
}

export function writeAll(dir, files) {
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), content);
}
