// Stadio Diego Armando Maradona (Naples), microscale: 1 stud = 6 m, 1 plate = 2.4 m.
// The outline comes from ref/footprint.json (OpenStreetMap): 'P' pitch, 'T' track + apron, 'S' stands, '.' outside.
// Grid: x, z studs; y plates (3 = one brick). Front = +z. Every height below is relative to the top of the base (g).
import fs from 'node:fs';
let lookup;   // part+colour availability, passed in by the toolkit (build({ lookup }))

const FP = JSON.parse(fs.readFileSync(new URL('./ref/footprint.json', import.meta.url), 'utf8'));
const W = FP.width, D = FP.depth, ROWS = FP.rows;
const at = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? '.' : ROWS[z][x]);
const key = (x, z) => `${x},${z}`;
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// small deterministic hash noise for the seat pixel pattern
function hash(x, z, s = 0) { let h = (x * 374761393 + z * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

// ---- plain part sizes, filtered per colour so that every part placed can be bought in that colour
const SIZES = {
  plate: ['16x16', '8x16', '8x8', '6x16', '6x12', '6x10', '6x8', '6x6', '4x12', '4x10', '4x8', '4x6', '4x4', '2x12', '2x10', '2x8', '2x6', '2x4', '2x3', '2x2', '1x12', '1x10', '1x8', '1x6', '1x4', '1x3', '1x2', '1x1'],
  tile: ['2x4', '2x3', '2x2', '1x8', '1x6', '1x4', '1x3', '1x2', '1x1'],
  brick: ['2x10', '2x8', '2x6', '2x4', '2x3', '2x2', '1x12', '1x10', '1x8', '1x6', '1x4', '1x3', '1x2', '1x1'],
};
const IDS = {
  plate: { '1x1': '3024', '1x2': '3023b', '1x3': '3623', '1x4': '3710', '1x6': '3666', '1x8': '3460', '1x10': '4477', '1x12': '60479', '2x2': '3022', '2x3': '3021', '2x4': '3020', '2x6': '3795', '2x8': '3034', '2x10': '3832', '2x12': '2445', '4x4': '3031', '4x6': '3032', '4x8': '3035', '4x10': '3030', '4x12': '3029', '6x6': '3958', '6x8': '3036', '6x10': '3033', '6x12': '3028', '6x16': '3027', '8x8': '41539', '8x16': '92438', '16x16': '91405' },
  brick: { '1x1': '3005', '1x2': '3004', '1x3': '3622', '1x4': '3010', '1x6': '3009', '1x8': '3008', '1x10': '6111', '1x12': '6112', '2x2': '3003', '2x3': '3002', '2x4': '3001', '2x6': '2456', '2x8': '3007', '2x10': '3006' },
  tile: { '1x1': '3070b', '1x2': '3069b', '1x3': '63864', '1x4': '2431', '1x6': '6636', '1x8': '4162', '2x2': '3068b', '2x3': '26603', '2x4': '87079' },
};
const sizeCache = new Map();
function sizesFor(kind, color, maxArea = Infinity) {
  const k = `${kind}|${color}|${maxArea}`;
  if (!sizeCache.has(k)) sizeCache.set(k, SIZES[kind].filter((s) => lookup(IDS[kind][s], color).ok).map((s) => s.split('x').map(Number)).filter(([a, b]) => a * b <= maxArea));
  return sizeCache.get(k);
}

/** Pack a set of cells (keys "x,z") in one layer with plates or tiles of one colour, using only buyable sizes. Largest pieces first. */
function pack(m, cells, y, color, kind = 'plate', maxArea = Infinity, ids = null) {
  const free = new Set(cells); const sizes = ids ? Object.keys(ids).map((s) => s.split('x').map(Number)).filter(([a, b]) => lookup(ids[`${a}x${b}`], color).ok) : sizesFor(kind, color, maxArea);
  const list = [...free].map((s) => s.split(',').map(Number)).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  for (const [x, z] of list) {
    if (!free.has(key(x, z))) continue;
    let best = null;
    for (const [a, b] of sizes) for (const [w, d] of a === b ? [[a, b]] : [[b, a], [a, b]]) {
      let ok = true; for (let i = 0; i < w && ok; i++) for (let k = 0; k < d; k++) if (!free.has(key(x + i, z + k))) { ok = false; break; }
      if (ok && (!best || w * d > best[0] * best[1])) best = [w, d];
    }
    const [w, d] = best;
    for (let i = 0; i < w; i++) for (let k = 0; k < d; k++) free.delete(key(x + i, z + k));
    if (ids) m.part(ids[w <= d ? `${w}x${d}` : `${d}x${w}`], x, y, z, color, w >= d ? 0 : 1);
    else m.sized(kind, `${w}x${d}`, x, y, z, color, w >= d ? 0 : 1);
  }
}

/** Pack a roof layer so that every plate covers at least one anchor cell (a cell with a support under it). Plates are grown from the
 *  anchors inward; cells that cannot be reached from a free anchor are left out. Returns the cells actually covered. */
function packAnchored(m, cells, isAnchor, first, y, color) {
  const free = new Set(cells); const sizes = sizesFor('plate', color); const kept = new Set();
  const sorted = (arr) => arr.map((s) => s.split(',').map(Number)).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  // cells in `first` are covered first, by a plate that must also reach an anchor; then every anchor gets the largest plate around it
  for (const [ax, az] of [...sorted([...free].filter(first)), ...sorted([...free].filter(isAnchor))]) {
    if (!free.has(key(ax, az))) continue;
    let best = null;
    for (const [a, b] of sizes) for (const [w, d] of a === b ? [[a, b]] : [[b, a], [a, b]]) for (let ox = 0; ox < w; ox++) for (let oz = 0; oz < d; oz++) {
      const x = ax - ox, z = az - oz; let ok = true, anchored = false;
      for (let i = 0; i < w && ok; i++) for (let k = 0; k < d; k++) { const kk = key(x + i, z + k); if (!free.has(kk)) { ok = false; break; } if (isAnchor(kk)) anchored = true; }
      if (ok && anchored && (!best || w * d > best[0] * best[1])) best = [w, d, x, z];
    }
    if (!best) continue;
    const [w, d, x, z] = best;
    for (let i = 0; i < w; i++) for (let k = 0; k < d; k++) { free.delete(key(x + i, z + k)); kept.add(key(x + i, z + k)); }
    m.sized('plate', `${w}x${d}`, x, y, z, color, w >= d ? 0 : 1);
  }
  return kept;
}

// the 48 x 40 base: two layers of large plates, the top layer offset by 8 studs so it bonds the bottom one
function base(m, color) {
  const layer = (y, xs, zs) => { for (let i = 0; i + 1 < xs.length; i++) for (let k = 0; k + 1 < zs.length; k++) {
    const w = xs[i + 1] - xs[i], d = zs[k + 1] - zs[k]; m.sized('plate', `${w}x${d}`, xs[i], y, zs[k], color, w >= d ? 0 : 1); } };
  layer(0, [0, 16, 32, 48], [0, 16, 32, 40]);
  layer(1, [0, 8, 24, 40, 48], [0, 8, 24, 40]);
  return 2;
}

// 3 x 5 pixel letters for the NAPOLI lettering on the main stand ('#' = white seat). I is one stud wide, N five.
const FONT = {
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#'],   // N needs five columns for a diagonal over five rows
  A: ['###', '#.#', '###', '#.#', '#.#'],
  P: ['##.', '#.#', '##.', '#..', '#..'],
  O: ['###', '#.#', '#.#', '#.#', '###'],
  L: ['#..', '#..', '#..', '#..', '###'],
  I: ['#', '#', '#', '#', '#'],
};

export default function build({ Model, kit, lookup: availability }) {
  lookup = availability;
  const m = new Model({ title: 'Stadio Diego Armando Maradona', subtitle: 'Naples, microscale: 1 stud = 6 m', budget: [1000, 2000], view: [12, 40] });
  let g; m.section('base', () => { g = base(m, 'Dark Bluish Gray'); });

  // ---- distances: every stand cell's distance to the track/pitch and to the outside (Euclidean, cell centres)
  const inner = [], outer = [];
  for (let z = -1; z <= D; z++) for (let x = -1; x <= W; x++) { const c = at(x, z); if (c === 'T' || c === 'P') inner.push([x, z]); else if (c === '.') outer.push([x, z]); }
  const dist = (x, z, pts) => { let b = Infinity; for (const [px, pz] of pts) { const d = (px - x) ** 2 + (pz - z) ** 2; if (d < b) b = d; } return Math.sqrt(b); };
  const S = new Map();
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (at(x, z) === 'S') {
    const rim = N4.some(([dx, dz]) => at(x + dx, z + dz) === '.');
    const dIn = dist(x, z, inner), dOut = dist(x, z, outer);
    S.set(key(x, z), { x, z, rim, dIn, dOut, u: rim ? 1 : dIn / (dIn + dOut - 1) });
  }
  const cx = W / 2 - 0.5, cz = D / 2 - 0.5;

  // ---- the section, from the photos: the open lower bowl (u < EDGE) rises from the track to the roof edge; everything beyond is under the
  // big opaque roof, which sits at plate ROOF on the hidden upper tiers and the outer wall. The first ring under the roof is the upper
  // tier in shade (Dark Blue), with floodlights along the roof edge.
  const EDGE = 0.55, ROOF = 15;
  for (const c of S.values()) {
    if (c.u < EDGE) { c.kind = 'seat'; c.h = 2 + Math.round((c.u / EDGE) * 7); }
    else { c.kind = c.rim ? 'rim' : 'covered'; c.h = ROOF; }
  }

  // ---- NAPOLI in white on the long stand facing the camera (the back, -z), over the five open rows nearest the roof edge
  const white = new Set(); let letterBand = [0, 0]; let debugRows = [];
  {
    const word = 'NAPOLI'; const width = [...word].reduce((s, ch) => s + FONT[ch][0].length, 0) + word.length - 1;
    // per column, the five open seat rows nearest the roof edge (they follow the curve of the stand, so every letter keeps its
    // full height even where the roof edge comes forward)
    // one set of rows for the whole word: the five open rows nearest the roof edge on the centre column. Where the roof edge curves
    // forward over those rows at the ends of the word, the edge is pulled back so every letter keeps all five rows (the real roof edge
    // is nearly straight along the main stand)
    let x0 = Math.round(cx - width / 2 + 0.5);
    const col = Math.round(cx); const rows = [];
    for (let z = 0; z < cz; z++) { const c = S.get(key(col, z)); if (c?.kind === 'seat' && c.dIn >= 1.5) rows.push(z); }
    const fixed = rows.slice(0, 5); const rowsAt = () => fixed;
    for (let x = x0 - 1; x <= x0 + width; x++) for (let z = fixed[0]; z <= fixed.at(-1); z++) { const c = S.get(key(x, z));
      if (c && c.kind !== 'seat') { c.kind = 'seat'; c.h = 2 + Math.round((Math.min(c.u, EDGE) / EDGE) * 7); } }
    debugRows = fixed;
    for (const ch of word) { const f = FONT[ch];
      f.forEach((row, r) => [...row].forEach((p, i) => { const rows = rowsAt(x0 + i); if (p === '#' && rows[r] != null) white.add(key(x0 + i, rows[r])); }));
      x0 += f[0].length + 1; }
    letterBand = [Math.round(cx - width / 2 + 0.5) - 1, x0];
  }

  if (debugRows.length < 5) m.warnings.push(`NAPOLI has only ${debugRows.length} rows`);
  for (const c of S.values()) if (c.kind === 'covered' && N4.some(([dx, dz]) => S.get(key(c.x + dx, c.z + dz))?.kind === 'seat')) c.kind = 'shade';
  // ---- 28 steel lattice pylons round the outside, evenly spaced along the rim, each on the first outside cell beyond it
  const rims = [...S.values()].filter((c) => c.rim).map((c) => ({ ...c, a: Math.atan2(c.z - cz, c.x - cx) })).sort((p, q) => p.a - q.a);
  let len = 0; const cum = rims.map((c, i) => (len += i ? Math.hypot(c.x - rims[i - 1].x, c.z - rims[i - 1].z) : 0));
  len += Math.hypot(rims[0].x - rims.at(-1).x, rims[0].z - rims.at(-1).z);
  const pylons = [];
  for (let k = 0; k < 28; k++) {
    const target = (k + 0.5) * len / 28; let i = cum.findIndex((v) => v >= target); if (i < 0) i = rims.length - 1;
    const r = rims[i]; const ox = r.x - cx, oz = r.z - cz;
    let spot = N4.map(([dx, dz]) => [r.x + dx, r.z + dz, dx * ox + dz * oz]).filter(([x, z]) => x >= 0 && z >= 0 && x < W && z < D && at(x, z) === '.').sort((p, q) => q[2] - p[2])[0];
    if (!spot) spot = [r.x, r.z];   // the plan ends at the rim here: the pylon takes the place of that bit of the outer wall
    if (!pylons.some((p) => p.x === spot[0] && p.z === spot[1])) pylons.push({ x: spot[0], z: spot[1], inWall: S.has(key(spot[0], spot[1])) });
  }
  const pylonAt = new Set(pylons.map((p) => key(p.x, p.z)));
  const pylonCells = new Set(pylonAt);   // grows when a pylon takes a second stud
  // radial frames: every third rim cell along the perimeter is a concrete frame in the open undercroft
  const frame = new Set(rims.filter((c, i) => i % 3 === 0).map((c) => key(c.x, c.z)));

  // ---- concrete and steel under the roof and under the seats (the box packer merges neighbouring cells into big bricks)
  for (const c of S.values()) { c.walk = c.kind === 'seat' && c.dIn < 1.5 && !white.has(key(c.x, c.z)); c.seatBrick = c.kind === 'seat' && !c.walk && !(c.z < cz && c.x >= letterBand[0] - 1 && c.x <= letterBand[1]) && (c.h - 1) % 3 === 2; }   // no tall seat bricks under the lettering: their faces would smear the letters
  const supTop = (c) => (c.kind === 'seat' ? (c.seatBrick ? c.h - 3 : c.h - 1) : c.kind === 'shade' ? 12 : ROOF);
  const steel = new Set();
  m.section('bowl', () => {
    for (const c of S.values()) {
      if (pylonAt.has(key(c.x, c.z))) continue;
      const top = supTop(c); const q = Math.floor(top / 3) * 3;
      let qn = q; for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = S.get(key(c.x + dx, c.z + dz)); if (n) qn = Math.min(qn, Math.floor(supTop(n) / 3) * 3); }
      const wall = c.rim || c.dIn < 1.5;     // these go down to the base; the rest is hollow
      for (let y = 0; y < q; y += 3) {
        if (!wall && y + 3 <= qn - 6) continue;
        let color = 'Light Bluish Gray';
        if (c.rim) color = y < 6 ? 'Black' : y < 9 ? 'Light Bluish Gray' : 'Dark Bluish Gray';   // dark open undercroft, the concrete ring beam, steel above
        else if (c.kind === 'shade' && y >= 6) color = 'Dark Blue';
        if (c.rim && y === 9) { steel.add(key(c.x, c.z)); continue; }
        m.box(c.x, g + y, c.z, 1, 1, 3, color);
      }
      if (top > q) m.box(c.x, g + q, c.z, 1, 1, top - q, 'Light Bluish Gray', { kind: 'plate' });
    }
  });
  m.section('facade', () => pack(m, steel, g + 9, 'Dark Bluish Gray', 'brick', Infinity, { '1x2': '2877', '1x1': '3005' }));

  // ---- the shaded upper tier under the roof edge: two Dark Blue plates, then floodlights / black plates right under the roof
  const screens = new Set();
  for (const side of [-1, 1]) for (const zc of [cz - 4, cz + 4]) {
    const ring = [...S.values()].filter((c) => c.kind === 'shade' && Math.sign(c.x - cx) === side && Math.abs(c.z - zc) <= 1.5);
    for (const c of ring) screens.add(key(c.x, c.z));
  }
  m.section('shade', () => {
    const sh = [...S.values()].filter((c) => c.kind === 'shade');
    const blue = new Set(sh.filter((c) => !screens.has(key(c.x, c.z))).map((c) => key(c.x, c.z)));
    const black = new Set(sh.filter((c) => screens.has(key(c.x, c.z))).map((c) => key(c.x, c.z)));
    // the upper tier in shade: mostly Dark Blue with Blue pixels, screens are black panels in the curves
    for (const y of [12, 13]) {
      const lit = new Set([...blue].filter((k) => { const [x, z] = k.split(',').map(Number); return hash(x, z, y) < 0.3; }));
      pack(m, new Set([...blue].filter((k) => !lit.has(k))), g + y, 'Dark Blue'); pack(m, lit, g + y, 'Blue'); pack(m, black, g + y, 'Black');
    }
    const lights = new Set(sh.filter((c, i) => (c.x * 3 + c.z * 5) % 4 === 0 && !screens.has(key(c.x, c.z))).map((c) => key(c.x, c.z)));
    for (const k of lights) { const [x, z] = k.split(',').map(Number); m.part('6141', x, g + 14, z, 'Trans Clear'); }   // floodlights under the roof edge
    pack(m, new Set(sh.map((c) => key(c.x, c.z)).filter((k) => !lights.has(k))), g + 14, 'Black');
  });

  // ---- seats: a mosaic of blues and white, NAPOLI in white; the first row over the track is a grey walkway
  const nearLetters = (c) => c.z < cz && c.x >= letterBand[0] - 1 && c.x <= letterBand[1];
  const seatMix = (c) => { if (white.has(key(c.x, c.z))) return 'White';
    const r = hash(c.x, c.z, 7);
    if (nearLetters(c)) return 'Blue';                                       // one calm blue behind the letters so they read
    return r < 0.5 ? 'Blue' : r < 0.72 ? 'Dark Blue' : r < 0.92 ? 'Medium Blue' : 'White'; };
  m.section('seats', () => {
    const groups = new Map(); const add = (y, color, kind, k) => { const gk = `${y}|${color}|${kind}`; if (!groups.has(gk)) groups.set(gk, new Set()); groups.get(gk).add(k); };
    for (const [k, c] of S) {
      if (c.kind !== 'seat') continue;
      if (c.walk) add(c.h - 1, 'Light Bluish Gray', 'tile', k);
      else if (c.seatBrick) add(c.h - 3, seatMix(c), 'brick', k);
      else add(c.h - 1, seatMix(c), nearLetters(c) ? 'tile' : 'plate', k);   // the lettered stand is finished smooth with tiles, like a banner
    }
    for (const [gk, cells] of groups) { const [y, color, kind] = gk.split('|'); pack(m, cells, g + +y, color, kind); }
  });

  // ---- the roof: one opaque grey ring on the hidden tiers and the outer wall; plates underneath, tiles on top in radial stripes
  // (light and medium grey panels between the pylons), quarter-round tiles on the corners of both edges so the ellipse reads smooth
  m.section('roof', () => {
    const roof = new Set([...S.values()].filter((c) => c.kind !== 'seat' && !pylonAt.has(key(c.x, c.z))).map((c) => key(c.x, c.z)));
    pack(m, roof, g + ROOF, 'Light Bluish Gray', 'plate');
    // fine radial ribs: thin Dark Bluish Gray lines traced outwards from the centre across the ring, Light Bluish Gray panels between
    const ribs = new Set();
    // one rib per pylon bay (28), traced as a 1-stud line: one cell per step along whichever axis the ray runs most along
    for (let k = 0; k < 28; k++) { const a = (k + 0.5) * 2 * Math.PI / 28; const dx = Math.cos(a) * (W / D), dz = Math.sin(a);
      const n = Math.max(Math.abs(dx), Math.abs(dz));
      for (let t = 0; t < 40; t++) { const x = Math.round(cx + (t * dx) / n), z = Math.round(cz + (t * dz) / n); if (roof.has(key(x, z))) ribs.add(key(x, z)); } }
    const stripe = (x, z) => (ribs.has(key(x, z)) ? 'Dark Bluish Gray' : 'Light Bluish Gray');
    const has = (x, z) => roof.has(key(x, z));
    const corner = new Map();
    for (const k of roof) { const [x, z] = k.split(',').map(Number);
      const l = !has(x - 1, z), r = !has(x + 1, z), b = !has(x, z - 1), f = !has(x, z + 1);
      // rot of 25269: 0 rounds (+x,+z), 1 (+x,-z), 2 (-x,-z), 3 (-x,+z)
      const rot = r && f ? 0 : r && b ? 1 : l && b ? 2 : l && f ? 3 : -1;
      if (rot >= 0 && !((l && r) || (b && f))) corner.set(k, rot); }
    const groups = new Map();
    for (const k of roof) { if (corner.has(k)) continue; const [x, z] = k.split(',').map(Number); const c = stripe(x, z); if (!groups.has(c)) groups.set(c, new Set()); groups.get(c).add(k); }
    for (const [color, cells] of groups) pack(m, cells, g + ROOF + 1, color, 'tile');
    for (const [k, rot] of corner) { const [x, z] = k.split(',').map(Number); m.part('25269', x, g + ROOF + 1, z, stripe(x, z), rot); }
  });

  // ---- pylons: 28 slender dark steel masts (1x1 round bricks), evenly spaced round the ellipse just outside the facade
  m.section('pylons', () => {
    for (const p of pylons) {
      for (let y = 0; y < 18; y += 3) m.part('3062b', p.x, g + y, p.z, 'Dark Bluish Gray');   // slender steel mast, ground to above the roof
      m.part('6141', p.x, g + 18, p.z, 'Dark Bluish Gray');
    }
  });

  // ---- pitch (darker green stripes, white markings), the blue track, a narrow grey apron at the foot of the stands
  m.section('field', () => {
    const P = []; for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (at(x, z) === 'P') P.push([x, z]);
    const x0 = Math.min(...P.map((p) => p[0])), x1 = Math.max(...P.map((p) => p[0])), z0 = Math.min(...P.map((p) => p[1])), z1 = Math.max(...P.map((p) => p[1]));
    const xm = Math.round((x0 + x1) / 2), zm = (z0 + z1) / 2;
    const lines = new Set();
    for (let x = x0; x <= x1; x++) { lines.add(key(x, z0)); lines.add(key(x, z1)); }
    for (let z = z0; z <= z1; z++) { lines.add(key(x0, z)); lines.add(key(x1, z)); lines.add(key(xm, z)); }
    for (const [gx, dir] of [[x0, 1], [x1, -1]]) {
      const zA = Math.floor(zm) - 2, zB = Math.ceil(zm) + 2;
      for (let i = 1; i <= 2; i++) { lines.add(key(gx + dir * i, zA)); lines.add(key(gx + dir * i, zB)); }
      for (let z = zA; z <= zB; z++) lines.add(key(gx + dir * 2, z));
    }
    const circle = new Map([[-1, -0.5, 2], [1, -0.5, 1], [1, 0.5, 0], [-1, 0.5, 3]].map(([dx, dz, r]) => [key(xm + dx, zm + dz), r]));
    const groups = new Map(); const add = (color, k) => { if (!groups.has(color)) groups.set(color, new Set()); groups.get(color).add(k); };
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      const c = at(x, z), k = key(x, z);
      if (c === 'T') add(N4.some(([dx, dz]) => at(x + dx, z + dz) === 'S') ? 'Light Bluish Gray' : 'Medium Blue', k);
      else if (circle.has(k)) m.part('25269', x, g, z, 'White', circle.get(k));
      else if (c === 'P') add(lines.has(k) ? 'White' : Math.floor((x - x0) / 2) % 2 ? 'Green' : 'Dark Green', k);
    }
    for (const [color, cells] of groups) pack(m, cells, g, color, 'tile');
  });

  // ---- the forecourt round the bowl, and a few trees in the corners of the plot
  m.section('forecourt', () => {
    const paved = new Set(), spots = [];
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      if (at(x, z) !== '.' || pylonCells.has(key(x, z))) continue;
      let near = Infinity; for (const c of rims) near = Math.min(near, Math.hypot(c.x - x, c.z - z));
      if (near < 2.3) paved.add(key(x, z)); else if (near > 3.2) spots.push([x, z]);
    }
    // the real forecourt is dark asphalt parking: the Dark Bluish Gray base is left as it is (no paving tiles), only a kerb of
    // grey tiles right along the pylons' feet on the front side
    pack(m, new Set([...paved].filter((k) => +k.split(',')[1] > cz + 12)), g, 'Light Bluish Gray', 'tile');
    const trees = [];
    for (const [x, z] of spots.sort((p, q) => hash(p[0], p[1], 3) - hash(q[0], q[1], 3))) {
      if (trees.some(([tx, tz]) => Math.abs(tx - x) < 2 && Math.abs(tz - z) < 2)) continue;
      const corner = `${x < cx}${z < cz}`; if (trees.filter((t) => t[2] === corner).length >= 5) continue;
      trees.push([x, z, corner]);
      if (hash(x, z, 5) < 0.5) m.part('4589', x, g, z, 'Green');
      else { m.part('3062b', x, g, z, 'Reddish Brown'); m.part('4589', x, g + 3, z, 'Green'); }
    }
  });

  return m;
}
