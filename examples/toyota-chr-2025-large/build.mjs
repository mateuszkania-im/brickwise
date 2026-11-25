// Toyota C-HR (2nd generation, 2025) at about 1:15: 36 studs long, 15 wide (17 over the mirrors), 32 plates tall. Front at +z.
//
// Ground truth: ref/chr-grid-36.json, a voxel grid made from a 3D mesh of the car (layers[y][row][gx]).
// Orientation: grid FRONT is gx = 35 (low nose, bonnet), tailgate gx = 0, so forge z = gx; grid row r -> forge x = r - 1
// (rows 1..15 are the body, rows 0 / 16 hold only the mirrors); grid y -> y. The grid is noisy (a mesh made from photos), so the
// body is not copied cell by cell: the heights below are read from the symmetrised grid (see brief.md) and written as profiles,
// each within about one plate / one stud of the grid surface.
//
// Method: a voxel map (one stud x one plate cells) filled inside the profiles and coloured by rule (blue body, black cladding,
// black roof and pillars, glass); hidden cells are dropped so the body is a shell two studs thick at the sides; exposed tops become
// tiles; the staircase edges are replaced by real slopes (bonnet curves, windscreen cheese slopes, rear glass curves, rounded roof
// edges); the grille, badges and number plates are mounted on side studs (SNOT); the wheels ride on Technic axles.

import fs from 'node:fs';
const GRID = JSON.parse(fs.readFileSync(new URL('./ref/chr-grid-36.json', import.meta.url), 'utf8'));

// footprint (w along x, d along z at rot 0) and height in plates of every part placed by hand
const DIMS = {
  '61678': [1, 4, 3], '11477': [1, 2, 2], '54200': [1, 1, 2], '3700': [2, 1, 3], '87087': [1, 1, 3], '30414': [4, 1, 3],
  '3623': [3, 1, 1], '3023b': [2, 1, 1], '3024': [1, 1, 1], '3005': [1, 1, 3], '3065': [2, 1, 3], '3069b': [2, 1, 1],
  '3070b': [1, 1, 1], '11211': [2, 1, 3], '3020': [4, 2, 1], '3710': [4, 1, 1], '3021': [3, 2, 1],
};
// tile bodies for SNOT mounting (from the part catalogue: x0, y0, z0, x1, y1, z1 in studs, and the bottom face)
const BODY = { '98138': [[-0.5, -0.4, -0.5, 0.5, 0, 0.5], -0.4], '63864': [[-1.5, -0.4, -0.5, 1.5, 0, 0.5], -0.4],
  '3069b': [[-1, -0.4, -0.5, 1, 0, 0.5], -0.4], '2412b': [[-1, -0.4, -0.5, 1, 0, 0.5], -0.4] };

export default function build({ Model }) {
  const m = new Model({ title: 'Toyota C-HR 2025 (large)', subtitle: 'second-generation coupe crossover, blue with a black roof, about 1:15',
    budget: [600, 2000], view: [35, 14] });
  const W = 15, L = 36;
  const BLUE = 'Blue', BLK = 'Black', GLASS = 'Trans-Black', LED = 'Trans-Clear', TAIL = 'Trans-Red', SILVER = 'Flat Silver';
  const TRANS = new Set([GLASS, LED, TAIL]);
  const hx = (x) => Math.min(x, W - 1 - x);                      // 0 at the outer skin, 7 on the centre line

  // ---------------------------------------------------------------- profiles (read from the grid, see brief.md)
  // roof top R(z) (plates): peak 32 over the front door (z 15..20), 31 over the rear door (z 10..14), the spoiler lip at 32 over
  // z 8..9, then a long rear glass falling to the light bar at z 0 (side photo: spoiler 9 studs from the tail, glass down to
  // 25 plates at the tail). Grid: 32 over gx 8..16, 31 at 6..7 and 17..19, 29-26 over gx 5..0.
  const R = (z) => (z >= 15 && z <= 20 ? 32 : z >= 10 && z <= 14 ? 31 : 0);
  // outer skin (x = 0 / 14) top cell: the character line rises from the front door (13) to the rear haunch (20, flush with the
  // beltline); the front fender stands at 19. Above the line the upper door is set in by one stud: the C-HR's diamond-shaped
  // side sculpting (grid row 1 is 13-20).
  const T0 = (z) => (z <= 9 ? 20 : z <= 22 ? Math.round(20 - ((z - 9) * 7) / 13) : 19);
  // top cell of the body under the glass: beltline at 21 plates (photo: 70 % of the height), glass 21..28 = a quarter of the
  // car's height (the grid puts the shoulder at 25, but its rows mix in the door frame; the photo wins here)
  const BELT = 20;
  // plan: the corners are rounded front and rear (grid rows narrow to 9-13 at gx 33-35)
  const zMin = (h) => (h === 0 ? 1 : 0);
  const zMax = (h) => (h === 0 ? 33 : 35);                       // the face is flat across, only the outer skin is set back

  // ---------------------------------------------------------------- wheels
  // 44309 street tyre (43.2 mm = 13.5 plates) on the 56145 rim; axles at z 6 and 28 (wheelbase 22 studs = 2.66 m, grid wheels at
  // gx 4-9 and 25-31); hub 6.75 plates up, so the Technic brick sits at y 5 (hole 1.75 plates above its bottom).
  const AX = [6, 28], HUB = 6.75, RT = 2.7;                      // hub height in plates, tyre radius in studs
  const dist = (y, z, a) => Math.hypot(z + 0.5 - a, (y + 0.5 - HUB) * 0.4);
  const near = (y, z) => Math.min(...AX.map((a) => dist(y, z, a)));
  const inBox = (h, y, z) => h >= 1 && h <= 3 && y <= 13 && AX.some((a) => z >= a - 3 && z <= a + 2);   // the tyre's bounding box
  const archOpen = (h, y, z) => (h === 0 ? near(y, z) < RT + 0.4 : inBox(h, y, z));

  // ---------------------------------------------------------------- solid volume S
  // the empty cabin behind the glass; a black bow at the B-pillar (z 14) carries the roof between the two roof levels
  const cabin = (h, y, z) => h >= 4 && z >= 10 && z <= 20 && z !== 14 && y > BELT && y <= R(z) - 4;
  const inS = (x, y, z) => {
    if (x < 0 || x >= W || y < 4 || z < 0 || z >= L) return false;
    const h = hx(x);
    if (z < zMin(h) || z > zMax(h)) return false;
    if (archOpen(h, y, z)) return false;
    if (h === 0) return y <= (z >= 23 ? 19 : T0(z));
    if (z >= 26) {                                               // bonnet: wings (h 1-2) one plate above the centre, then curves
      if (h <= 2) return y <= (z <= 29 ? 22 : z <= 31 ? 20 : 17);
      return y <= (z <= 29 ? 21 : z <= 31 ? 19 : 16);
    }
    if (h === 1) return y <= (z <= 1 ? 24 : BELT);
    if (y <= BELT) return true;
    // above the beltline (h >= 2, z <= 25)
    if (z === 0) return y <= 24;                                 // tail: light bar and the ledge over it
    if (z <= 4) return y <= 23;                                  // boot under the lower rear glass curve
    if (z <= 8) return y <= 26;                                  // boot under the upper rear glass curve
    if (z === 9) return y <= 29;                                 // C-pillar block that carries the spoiler
    if (z <= 20) {                                               // glass plane (h 2), inner wall (h 3), roof slab over the cabin
      if (cabin(h, y, z)) return false;
      return h <= 3 ? y <= R(z) - 3 : y <= R(z) - 1;             // the rounded edge over h 2-3 is a curved slope (placed by hand)
    }
    // windscreen columns z 21..25: black under the cheese slopes (bases 30, 28, 26, 24, 22)
    return y < 30 - (z - 21) * 2;
  };

  // ---------------------------------------------------------------- colour rules
  const glassAt = (h, y, z) => {                                 // side windows, in the glass plane h = 2
    if (h !== 2 || y <= BELT) return false;
    const top = R(z) - 4;
    if (z >= 15 && z <= 20) return y <= top;                     // front door glass
    if (z >= 21 && z <= 23) return y <= 27 - 2 * (z - 21);        // front quarter glass, its top edge following the A-pillar
    if (z >= 11 && z <= 13) return y >= (z === 13 ? 21 : z === 12 ? 22 : 24) && y <= top;   // rear door glass, lower edge rising...
    if (z === 10) return y === top;                              // ...into a sharp point at the big black C-pillar
    return false;                                                // A-, B- (z 14) and C-pillars black
  };
  // the hammerhead face, painted on the front-most cell of each (x, y): K black, B blue, L LED, G grille (recessed)
  // (measured on chr-front.jpg: black C intakes at the corners up to the lamps, a blue blade falling from the inner end of each
  // lamp to the bumper, the grille between the blades, the thin LED slit under the bonnet edge hooking down at its inner end)
  const frontPaint = (h, y) => {
    if (y <= 5) return BLK;                                      // lower bumper lip
    // The hammerhead: the LED slit runs from the corner (17-18) down and in (16-17, 15-16) and hooks down at its inner end
    // (13-15). Two body-colour strokes leave that hook: one under the lamp out to the corner, one (the blade) down and out to the
    // bumper. Between them a black triangular intake points inwards: together a sideways "<", the C-HR's arrow face.
    if (h === 0) return y <= 14 ? BLK : y <= 16 ? BLUE : y <= 18 ? LED : BLUE;
    if (h === 1) return y <= 7 ? BLUE : y <= 13 ? BLK : y <= 15 ? BLUE : LED;
    if (h === 2) return y <= 9 ? BLUE : y <= 12 ? BLK : y <= 14 ? BLUE : y <= 16 ? LED : BLUE;
    if (h === 3) return y === 6 ? BLK : y <= 9 ? 'G' : y <= 12 ? BLUE : y <= 15 ? LED : BLUE;
    return y === 6 || y === 13 ? BLK : y <= 12 ? 'G' : BLUE;     // grille in a black frame, then the bar with the badge
  };
  const rearPaint = (h, y) => {
    if (y <= 10) return h === 1 && y === 9 ? TAIL : h >= 2 && y === 7 ? 'Light Bluish Gray' : BLK;   // bumper, reflectors, trim
    if (h === 1 && y <= 13) return BLK;                          // the black bumper sweeps up at the corners (the rear "C")
    if (y === 22 || y === 23) return TAIL;                       // full-width thin light bar
    if (y > 23) return BLK;
    if (h >= 5 && y >= 15 && y <= 18) return BLK;                // black recess round the number plate
    return BLUE;                                                 // tailgate
  };
  const colour = (x, y, z) => {
    const h = hx(x);
    if (glassAt(h, y, z)) return GLASS;
    if (z === zMax(h) && z >= 33 && y <= 19) return frontPaint(h, y);
    if (h === 0 && z >= 31 && (y === 17 || y === 18)) return LED; // the lamp wraps round onto the side
    if (z === zMin(h) && h >= 1 && y <= 24) return rearPaint(h, y);
    if (h === 1 && z === 1 && (y === 22 || y === 23)) return TAIL;   // the light bar wraps round the rear corner
    if (y > BELT && z <= 25) return BLK;                         // roof, pillars, inner walls, spoiler, rear glass base
    if (h >= 2 && z <= 25 && y >= BELT - 1) return BLK;          // cabin floor seen through the glass
    if (y <= 7) return BLK;                                      // sills and floor pan
    if (h <= 3 && y <= 15 && near(y, z) < RT + (h === 0 ? 1.3 : 2.2)) return BLK;   // arch cladding and dark wheel wells
    if (h === 0 && z <= 2 && y <= 12) return BLK;                // rear bumper corner
    if (h === 0 && z >= 32 && y <= 15) return BLK;               // front bumper corner: the C intake wraps round
    return BLUE;
  };

  // ---------------------------------------------------------------- voxel map
  const V = new Map();
  const key = (x, y, z) => `${x},${y},${z}`;
  for (let x = 0; x < W; x++) for (let y = 4; y <= 31; y++) for (let z = 0; z < L; z++) if (inS(x, y, z)) V.set(key(x, y, z), { c: colour(x, y, z), k: 'plate' });
  const OCC = new Set();                                         // cells taken by hand-placed parts
  const SUP = new Set();                                         // cells that carry a hand-placed part: always kept
  const P = (id, x, y, z, c, rot = 0) => {
    const [w0, d0, h] = DIMS[id]; const [w, d] = rot % 2 ? [d0, w0] : [w0, d0];
    for (let i = 0; i < w; i++) for (let k = 0; k < d; k++) {
      for (let j = 0; j < h; j++) { V.delete(key(x + i, y + j, z + k)); OCC.add(key(x + i, y + j, z + k)); }
      SUP.add(key(x + i, y - 1, z + k));
    }
    return m.part(id, x, y, z, c, rot);
  };
  const both = (x) => [x, W - 1 - x];                            // a column and its mirror

  // ---------------------------------------------------------------- SNOT helpers (same maths as the toolkit's sign/panel)
  const studsOf = (host, list) => list.map(([sx, sz, sy]) => { const s = host.rot === 2 ? -1 : 1; const [fw, fd] = [DIMS[host.id][0], DIMS[host.id][1]];
    return { p: [host.x + fw / 2 + s * sx, (host.y + sy) * 0.4, host.z + fd / 2 + s * sz], n: [0, 0, s] }; });
  const SIDE = { '87087': [[0, 0.5, 1.75]], '30414': [[-1.5, 0.5, 1.75], [-0.5, 0.5, 1.75], [0.5, 0.5, 1.75], [1.5, 0.5, 1.75]], '11211': [[-0.5, 0.5, 1.75], [0.5, 0.5, 1.75]] };
  const mount = (stud, id, color, fx = 0, fz = 0) => {
    const n = stud.n; const right = [n[2], 0, -n[0]];
    const M = [right[0], n[0], 0, 0, 0, -1, right[2], n[2], 0];
    const [b, base] = BODY[id]; const bc = [(b[0] + b[3]) / 2 + fx, base, (b[2] + b[5]) / 2 + fz];
    const w = [M[0] * bc[0] + M[1] * bc[1] + M[2] * bc[2], M[3] * bc[0] + M[4] * bc[1] + M[5] * bc[2], M[6] * bc[0] + M[7] * bc[1] + M[8] * bc[2]];
    return m.free(id, color, [stud.p[0] - w[0], stud.p[1] - w[1], stud.p[2] - w[2]], M);
  };
  const sideBrick = (id, x, y, z, c, rot) => { const host = P(id, x, y, z, c, rot); return studsOf(host, SIDE[id]); };

  // ---------------------------------------------------------------- front: hex grille, number plate, badge
  m.section('front', () => {
    // the grille is recessed one stud: black side-stud bricks at z 34 with their studs bare read as the hexagon mesh
    for (let x = 3; x <= 11; x++) for (let y = 7; y <= 12; y++) if (frontPaint(hx(x), y) === 'G') V.delete(key(x, y, 35));
    m.rigid(() => {
      const row1 = [...sideBrick('30414', 3, 7, 34, BLK, 0), ...sideBrick('87087', 7, 7, 34, BLK, 0), ...sideBrick('30414', 8, 7, 34, BLK, 0)];
      mount(row1.find((s) => Math.abs(s.p[0] - 7.5) < 0.01), '63864', 'White');            // number plate on the centre stud
    });
    sideBrick('30414', 4, 10, 34, BLK, 0); sideBrick('87087', 8, 10, 34, BLK, 0); sideBrick('11211', 9, 10, 34, BLK, 0);
    // bridging plates: the bumper lip, the bar over the grille and the deck under the nose each tie the face (z 35) to the body
    P('3020', 3, 5, 34, BLK, 0); P('3020', 7, 5, 34, BLK, 0); P('3023b', 11, 5, 34, BLK, 1);
    P('3021', 4, 13, 34, BLK, 0); P('3021', 8, 13, 34, BLK, 0);
    for (const x of [3, 11]) P('3623', x, 16, 32, BLUE, 1);
    for (const x of [4, 6, 8]) P('3020', x, 16, 32, BLUE, 1);
    P('3710', 10, 16, 32, BLUE, 1);
    // Toyota badge: a silver round tile on a blue side-stud brick in the bar under the bonnet lip
    m.rigid(() => { const [s] = sideBrick('87087', 7, 13, 35, BLUE, 0); mount(s, '98138', SILVER); });
  });

  // ---------------------------------------------------------------- bonnet: raised wings, lower centre, curved nose
  m.section('bonnet', () => {
    for (let x = 3; x <= 11; x++) { P('11477', x, 20, 30, BLUE, 0); P('61678', x, 17, 32, BLUE, 0); }
    // wings (h 1-2) one plate above the centre all the way to the nose: the bonnet crease
    for (const x of [...both(1), ...both(2)]) { P('11477', x, 21, 30, BLUE, 0); P('61678', x, 18, 32, BLUE, 0); }
    // front fenders: a cheese slope eases the step from the fender top (20) up to the wing (23)
    for (let z = 26; z <= 31; z++) { P('54200', 0, 20, z, BLUE, 3); P('54200', 14, 20, z, BLUE, 1); }
  });

  // ---------------------------------------------------------------- windscreen and A-pillars: cheese slopes, 2 plates per stud
  m.section('windscreen', () => {
    for (let x = 2; x <= 12; x++) for (let z = 21; z <= 25; z++) P('54200', x, 30 - (z - 21) * 2, z, hx(x) === 2 ? BLK : GLASS, 0);
  });

  // ---------------------------------------------------------------- roof: rounded edges, rear glass, spoiler
  m.section('roof', () => {
    for (let z = 10; z <= 20; z++) { const y = R(z) - 2; P('11477', 2, y, z, BLK, 3); P('11477', 11, y, z, BLK, 1); }
    // rear glass: two 4-stud curves from the spoiler (z 8, 30 plates) down to the light bar (z 1, 24)
    for (let x = 2; x <= 12; x++) { P('61678', x, 27, 5, BLK, 2); P('61678', x, 24, 1, BLK, 2); }
    // spoiler: plates reaching back over the top of the rear glass, tiles on top one plate above the roof
    for (let x = 2; x <= 12; x++) { P('3023b', x, 30, 8, BLK, 1); P('3069b', x, 31, 8, BLK, 1); }
  });

  // ---------------------------------------------------------------- mirrors at the foot of the A-pillars
  m.section('mirrors', () => {
    // a short arm on the door top, the head one stud proud of the set-in upper door, its back rounded towards the rear
    P('3023b', 0, 21, 22, BLK, 0); P('3023b', 0, 22, 22, BLK, 1); P('11477', 0, 23, 22, BLK, 2);
    P('3023b', 13, 21, 22, BLK, 0); P('3023b', 14, 22, 22, BLK, 1); P('11477', 14, 23, 22, BLK, 2);
  });

  // ---------------------------------------------------------------- rear: number plate, badge
  m.section('rear', () => {
    m.rigid(() => { const s = sideBrick('11211', 6, 16, 0, BLK, 2); sideBrick('87087', 8, 16, 0, BLK, 2);
      mount({ p: [7.5, (16 + 1.75) * 0.4, 0], n: [0, 0, -1] }, '63864', 'White'); void s; });
    m.rigid(() => { const [s] = sideBrick('87087', 7, 19, 0, BLUE, 2); mount(s, '98138', SILVER); });
  });

  // ---------------------------------------------------------------- wheels: Technic brick in the floor, axle 3, rim + tyre
  m.section('wheels', () => {
    for (const a of AX) for (const side of [0, 1]) m.rigid(() => {
      P('3700', side ? 10 : 4, 5, a - 1, BLK, 1);
      m.free('4519', BLK, [side ? 11.5 : 3.5, HUB * 0.4, a], [1, 0, 0, 0, 1, 0, 0, 0, 1]);
      const M = side ? [0, 0, 1, 0, 1, 0, -1, 0, 0] : [0, 0, -1, 0, 1, 0, 1, 0, 0];
      const ox = side ? 12.65 : 2.35;
      m.free('56145', SILVER, [ox, HUB * 0.4, a], M);
      m.free('44309', BLK, [ox, HUB * 0.4, a], M);
    });
  });

  // ---------------------------------------------------------------- shell: keep visible cells, decks and supports
  const filled = (x, y, z) => V.has(key(x, y, z)) || OCC.has(key(x, y, z));
  const solid = (x, y, z) => inS(x, y, z) || OCC.has(key(x, y, z));
  const N6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const visible = new Set();
  for (const [k] of V) { const [x, y, z] = k.split(',').map(Number); if (N6.some(([a, b, c]) => !solid(x + a, y + b, z + c))) visible.add(k); }
  // the shell is two cells thick (a visible cell and the cell behind it), so its plates overlap and bond in every direction
  const keep = new Set();
  for (const [k] of V) { const [x, y, z] = k.split(',').map(Number);
    if (visible.has(k) || N6.some(([a, b, c]) => visible.has(key(x + a, y + b, z + c))) || hx(x) <= 1 || y === 4 || y === BELT - 1 || SUP.has(k)) keep.add(k); }
  // a kept cell with nothing kept under it gets the cell below kept too (one level: tiles and slopes need a plate under them)
  // (up to three levels down, so a lone column reaches a layer where the plates around it bond it in)
  for (let pass = 0; pass < 3; pass++) for (const k of [...keep]) { const [x, y, z] = k.split(',').map(Number); const b = key(x, y - 1, z); if (V.has(b)) keep.add(b); }
  for (const k of [...V.keys()]) if (!keep.has(k)) V.delete(k);
  // exposed tops become tiles
  for (const [k, v] of V) { const [x, y, z] = k.split(',').map(Number); if (!TRANS.has(v.c) && y > 4 && !solid(x, y + 1, z)) v.k = 'tile'; }   // only real outside tops

  // three plates of one colour stacked in a brick course become a brick (fewer, stronger parts in the shell)
  for (const [k, v] of V) { const [x, y, z] = k.split(',').map(Number); if ((y - 5) % 3 !== 0 || y < 5) continue;
    const cells = [0, 1, 2].map((j) => V.get(key(x, y + j, z)));
    if (cells.every((c) => c && c.k === 'plate' && !TRANS.has(c.c) && c.c === cells[0].c)) cells.forEach((c) => (c.k = 'brick')); }

  // ---------------------------------------------------------------- pack: opaque cells as box() volumes, trans cells by hand
  const transCells = [];
  m.section('body', () => {
    for (const [k, v] of V) { const [x, y, z] = k.split(',').map(Number); if (TRANS.has(v.c)) { transCells.push([x, y, z, v.c]); continue; } m.box(x, y, z, 1, 1, 1, v.c, { kind: v.k }); }
    const T = new Map(transCells.map(([x, y, z, c]) => [key(x, y, z), c])); const done = new Set();
    const is = (x, y, z, c) => T.get(key(x, y, z)) === c && !done.has(key(x, y, z));
    for (const [x, y, z, c] of transCells.sort((a, b) => a[1] - b[1] || a[0] - b[0] || a[2] - b[2])) {
      const k = key(x, y, z); if (done.has(k)) continue;
      const course = (zz) => [0, 1, 2].every((j) => is(x, y + j, zz, c));
      if (c === GLASS && course(z)) {                            // side glass: bricks where three plates of glass stack
        const pair = course(z + 1);
        for (const zz of pair ? [z, z + 1] : [z]) for (let j = 0; j < 3; j++) done.add(key(x, y + j, zz));
        m.part(pair ? '3065' : '3005', x, y, z, c, pair ? 1 : 0); continue;
      }
      if (is(x, y, z + 1, c)) { done.add(k); done.add(key(x, y, z + 1)); m.part('3023b', x, y, z, c, 1); }
      else if (is(x + 1, y, z, c)) { done.add(k); done.add(key(x + 1, y, z)); m.part('3023b', x, y, z, c, 0); }
      else { done.add(k); m.part('3024', x, y, z, c); }
    }
  });
  return m;
}
