// Toyota C-HR 2025, sculpture mode. The shape comes from ref/chr-sculpture-36.json: a colour grid voxelised from a 3D mesh of the
// real car (photos -> Hunyuan3D -> scripts/mesh-to-grid.mjs), 36 studs long. Grid x runs along the car with the front at x = 35
// (-> forge z, front faces +z); grid z runs across the car (-> forge x); grid y -> forge y.
//
// What is taken from the grid: the shape only. Per column (forge x, z) the top and the bottom of the grid are read, mirrored left /
// right (the mesh is slightly lopsided) and filled in between, so every surface stays where the grid puts it (within one plate /
// one stud) while the holes and loose cells of the noisy mesh disappear. The mesh texture is NOT used for colour: it came from
// press photos of a silver/black car. Colours are painted by region to match the user's blue car (ref/chr-front34.png):
// blue body; black roof, pillars, mirrors and cladding (arches, sills, bumpers); dark glass; an LED slit at the bonnet edge;
// an hourglass grille; a full-width red light bar at the rear.
//
// The voxel wheels of the grid are replaced by real wheels (56145 rim + 44309 tyre) on Technic axles through 1x2 Technic bricks
// inside the body, the same mounting as examples/toyota-chr-2025-large. The arches are cut round them.
// The body is a shell two cells thick (hidden cells dropped); exposed tops become tiles; three stacked plates of one colour in a
// brick course become a brick.

import fs from 'node:fs';

const G = JSON.parse(fs.readFileSync(new URL('./ref/chr-sculpture-36.json', import.meta.url), 'utf8'));

// footprint (w along x, d along z at rot 0) and height in plates of every part placed by hand
const DIMS = { '3700': [2, 1, 3], '3023b': [2, 1, 1], '3024': [1, 1, 1], '11477': [1, 2, 2], '54200': [1, 1, 2], '87087': [1, 1, 3], '30414': [4, 1, 3], '15573': [2, 1, 1], '3039': [2, 2, 3], '3069b': [2, 1, 1] };
// side-stud positions of SNOT bricks (x, z offsets from the footprint centre, height in plates) and tile bodies for mounting,
// the same maths as examples/toyota-chr-2025-large
const SIDE = { '30414': [[-1.5, 0.5, 1.75], [-0.5, 0.5, 1.75], [0.5, 0.5, 1.75], [1.5, 0.5, 1.75]] };
const BODY = { '2431': [[-2, -0.4, -0.5, 2, 0, 0.5], -0.4] };

export default function build({ Model }) {
  const m = new Model({ title: 'Toyota C-HR 2025', subtitle: 'sculpture from a 3D mesh of the real car, blue with a black roof, about 1:12',
    budget: [600, 2500], view: [35, 16] });
  const X0 = 1, X1 = 14, L = 36;                                  // body columns x 1..14 (grid rows 1..14), z 0..35
  const BLUE = 'Blue', BLK = 'Black', GLASS = 'Trans-Black', LED = 'Trans-Clear', TAIL = 'Trans-Red', GRILLE = 'Black';
  const SILVER = 'Flat Silver';
  const BRICKS = false;                                            // plates only: they overlap and bond in every layer
  const hx = (x) => Math.min(x - X0, X1 - x);                     // 0 at the outer skin, 6 on the centre line

  // ---------------------------------------------------------------- wheels (geometry first: the arches are cut from the shape)
  // grid wheels touch the ground at gx 6-7 and 27-28 -> axles on the stud lines z 7 and 28 (wheelbase 21 studs).
  // 44309 tyre is 13.5 plates across: hub 6.75 plates up, so the Technic brick (hole 1.75 plates above its bottom) sits at y 5.
  const AX = [7, 28], HUB = 6.75, RT = 2.7;                       // hub height in plates, tyre radius in studs
  const dist = (y, z, a) => Math.hypot(z + 0.5 - a, (y + 0.5 - HUB) * 0.4);
  const near = (y, z) => Math.min(...AX.map((a) => dist(y, z, a)));
  // round arches: the tyre fills x 1.0-3.7 on the left (cells h 0..2). The checker treats it as a cylinder on its axle, so a
  // cell in that slice is cut only when its nearest point comes within RT + CLR of the hub: the arch hugs the tyre with about
  // a third of a stud of clearance, stepped one plate at a time round the curve.
  const CLR = 0.35;
  const rectDist = (y, z, a) => { const cz = Math.max(z, Math.min(a, z + 1)), cy = Math.max(y * 0.4, Math.min(HUB * 0.4, (y + 1) * 0.4));
    return Math.hypot(cz - a, cy - HUB * 0.4); };
  // below the hub the arch is open straight down (no thin stubs left hanging under the curve)
  const archOpen = (h, y, z) => h <= 2 && AX.some((a) => rectDist(y, z, a) < RT + CLR || (y + 0.5 <= HUB && Math.abs(z + 0.5 - a) < 3));

  // ---------------------------------------------------------------- shape from the grid: top / bottom per column
  const filledG = (r, gx, y) => G.layers[y][r][gx] !== '.';
  const gridWheel = (r, gx, y) => y <= 5 && (r <= 2 || r >= 13) && ((gx >= 3 && gx <= 11) || (gx >= 24 && gx <= 32));
  const TOP = {}, BOT = {};
  const ck = (x, z) => `${x},${z}`;
  for (let x = X0; x <= X1; x++) for (let z = 0; z < L; z++) {
    const ys = [];
    for (const r of [x, 15 - x]) for (let y = 0; y < G.layers.length; y++) if (filledG(r, z, y) && !gridWheel(r, z, y)) ys.push(y);
    if (!ys.length) continue;
    TOP[ck(x, z)] = Math.max(...ys); BOT[ck(x, z)] = Math.min(...ys);
  }
  for (let x = X0; x <= X1; x++) for (let z = 0; z < L; z++) {
    const k = ck(x, z); if (TOP[k] === undefined) continue;
    const h = hx(x);
    // the mirror stalk in the outer row (grid rows 1/14 at gx 22) is rebuilt by hand
    if (h === 0 && z >= 21 && z <= 23) TOP[k] = Math.min(TOP[k], 21);
    // the grid's own arches and wheel wells (bottom 10-12 between the wheels' cells) are replaced by the cut arches;
    // elsewhere the body bottom is the floor line at 5-6
    if (z >= 3 && z <= 32 && BOT[k] > 6) BOT[k] = 6;
    if (z >= 3 && z <= 32 && BOT[k] < 5) BOT[k] = 5;              // single mesh cells hanging under the floor line
    // thin stubs under the nose (top at 7-8, nothing above them) are mesh noise of the bumper lip
    if (z >= 33 && TOP[k] <= 8) delete TOP[k];
  }
  const inShape = (x, y, z) => { const k = ck(x, z); return TOP[k] !== undefined && y >= BOT[k] && y <= TOP[k]; };
  const inS = (x, y, z) => {
    if (x < X0 || x > X1 || y < 0 || z < 0 || z >= L) return false;
    if (!inShape(x, y, z)) return false;
    return !archOpen(hx(x), y, z);
  };
  const T = (x, z) => TOP[ck(x, z)] ?? -1;

  // front-most / rear-most filled cell for each (x, y): the faces that get painted
  const zFront = (x, y) => { for (let z = L - 1; z >= 0; z--) if (inS(x, y, z)) return z; return -1; };
  const zRear = (x, y) => { for (let z = 0; z < L; z++) if (inS(x, y, z)) return z; return L; };

  // ---------------------------------------------------------------- colour by region
  // beltline: the window sill is at 22 plates along the front door and rises along the rear door into the sharp C-pillar point
  const belt = (z) => (z >= 14 ? 22 : z >= 9 ? 22 + (14 - z) : 99);
  const sideGlass = (h, y, z) => {
    if (h < 1 || h > 2 || y < belt(z) || y > 28) return false;
    if (z === 14) return false;                                   // B-pillar
    if (z >= 15 && z <= 21) return true;                          // front door glass
    if (z === 22) return y <= 24;                                 // small quarter light under the A-pillar
    return z >= 9 && z <= 13;                                     // rear door glass, lower edge rising
  };
  // the hammerhead face, painted on the front-most cell of each (x, y), by distance h from the side (0..6)
  // L = LED, B = blue, K = black (corner intakes, bumper), G = grille. Rows from y 16 down to y 5.
  // the grille G is h >= g(y): narrow at the top (between the lamps' inner ends), widest at the bumper; each blue blade is the two
  // cells just outside it, so the blades run from the lamps down and out to the corners; black intakes K outside the blades
  const gOf = { 12: 4, 11: 3, 10: 3, 9: 2, 8: 2 };
  const FACE = {
    16: 'BBBBBBB',
    15: 'LLLBBBB',                                                // the LED slit under the bonnet edge...
    14: 'LKLLLBB',                                                // ...stepping down towards the centre, dark lamp under it
    13: 'LKKKBBB',                                                // the C: the slit hooks down round the corner
    7: 'KKKKKKK',                                                 // black lower bumper
  };
  for (const [y, g] of Object.entries(gOf)) FACE[y] = [0, 1, 2, 3, 4, 5, 6].map((h) => (h >= g ? 'G' : h >= g - 2 ? 'B' : 'K')).join('');
  const FC = { L: LED, B: BLUE, K: BLK, G: 'G' };               // G: recessed one stud, see the grille below
  const frontPaint = (h, y) => (y <= 7 ? BLK : y >= 17 ? BLUE : FC[FACE[y][h]]);
  const rearPaint = (h, y) => {
    if (y <= 13) return BLK;                                     // black bumper
    if (h <= 1 && y >= 18 && y <= 22) return TAIL;                // red corner lamps
    if (y === 22) return TAIL;                                    // full-width light bar
    if (y > 22) return BLK;                                       // rear glass / spoiler
    return BLUE;                                                  // tailgate
  };
  const colour = (x, y, z) => {
    const h = hx(x);
    if (y >= 6 && y <= 16 && z === zFront(x, y) && z >= 30) return frontPaint(h, y);
    if (z === zRear(x, y) && z <= 3 && y >= 6) return rearPaint(h, y);
    if (h === 0 && y === 21 && z === zRear(x, y)) return TAIL;    // the corner lamp wraps round onto the side
    if (sideGlass(h, y, z)) return GLASS;
    if (h >= 2 && z >= 19 && z <= 25 && y >= 22) return GLASS;    // windscreen (painted only where it is visible)
    if (h === 0 && z >= 32 && y >= 13 && y <= 15) return LED;     // the LED's C wraps round onto the side
    if (h === 0 && y >= 22 && z >= 13) return BLUE;               // the door tops and front wing stay body colour up to the glass
    if (y >= 22 && z <= 25) return BLK;                           // roof, pillars, spoiler, rear glass base
    if (y <= 7) return BLK;                                       // sills and floor pan
    if (h <= 2 && near(y, z) < RT + 1.55) return BLK;            // arch cladding ring following the curve, dark wheel wells
    if (h === 0 && z >= 31 && y <= 12) return BLK;                // front corner intakes wrap round onto the side
    if (z <= 3 && y <= 13) return BLK;                            // rear bumper (and the cells behind its face, so plates bond through)
    return BLUE;
  };

  // ---------------------------------------------------------------- voxel map
  const V = new Map();
  const key = (x, y, z) => `${x},${y},${z}`;
  for (let x = X0; x <= X1; x++) for (let y = 0; y < 34; y++) for (let z = 0; z < L; z++) if (inS(x, y, z)) V.set(key(x, y, z), { c: colour(x, y, z), k: 'plate' });
  // the windscreen paint only holds on its visible skin; the cells behind it are the black cabin
  for (const [k, v] of V) { const [x, y, z] = k.split(',').map(Number);
    if (v.c === GLASS && [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].every(([a, b, c]) => V.has(key(x + a, y + b, z + c)))) v.c = BLK; }

  // the faces are thin columns of 1x1 cells in changing colours: the cell behind each face cell takes the same colour, and on
  // every other layer the two are forced into one 1x2 plate front to back (a packing unit of their own), so the face bonds into
  // the body; the layers between stay free for long plates across the car
  for (const [k, v] of V) { const [x, y, z] = k.split(',').map(Number); if (v.c === 'G' || y < 6) continue;
    const front = y <= 16 && z >= 30 && z === zFront(x, y), rear = z <= 3 && z === zRear(x, y);
    if (!front && !rear) continue;
    const zb = front ? z - 1 : z + 1, b = V.get(key(x, y, zb)); if (!b) continue;
    // a cell behind the face that shows on the side keeps its own colour (no red or LED spilling onto the flanks)
    if (b.c !== v.c && (!inS(x - 1, y, zb) || !inS(x + 1, y, zb) || !inS(x, y + 1, zb))) continue;
    b.c = v.c; v.pb = key(x, y, zb); }

  // grille: the face cells of the hourglass are removed so the grille sits one stud back, dark, in the shadow of the blades
  const REC = new Set();
  for (const [k, v] of [...V]) { if (v.c !== 'G') continue; const [x, y, z] = k.split(',').map(Number);
    V.delete(k); REC.add(k); const b = V.get(key(x, y, z - 1)); if (b) b.c = GRILLE; }

  const OCC = new Set();                                          // cells taken by hand-placed parts
  const SUP = new Set();                                          // cells that carry or clamp a hand-placed part: always kept
  const P = (id, x, y, z, c, rot = 0) => {
    const [w0, d0, hh] = DIMS[id]; const [w, d] = rot % 2 ? [d0, w0] : [w0, d0];
    for (let i = 0; i < w; i++) for (let k = 0; k < d; k++) {
      for (let j = 0; j < hh; j++) { V.delete(key(x + i, y + j, z + k)); OCC.add(key(x + i, y + j, z + k)); }
      SUP.add(key(x + i, y - 1, z + k)); SUP.add(key(x + i, y + hh, z + k));
    }
    return m.part(id, x, y, z, c, rot);
  };

  // ---------------------------------------------------------------- wheels: Technic brick in the floor, axle 3, rim + tyre
  m.section('wheels', () => {
    for (const a of AX) for (const side of [0, 1]) m.rigid(() => {
      P('3700', side ? 11 : 4, 5, a - 1, BLK, 1);
      m.free('4519', BLK, [side ? 12.5 : 3.5, HUB * 0.4, a], [1, 0, 0, 0, 1, 0, 0, 0, 1]);
      const M = side ? [0, 0, 1, 0, 1, 0, -1, 0, 0] : [0, 0, -1, 0, 1, 0, 1, 0, 0];
      const ox = side ? 13.65 : 2.35;
      m.free('56145', SILVER, [ox, HUB * 0.4, a], M);
      m.free('44309', BLK, [ox, HUB * 0.4, a], M);
    });
  });

  // ---------------------------------------------------------------- mirrors at the foot of the A-pillars (grid: rows 0/15, gx 22)
  m.section('mirrors', () => {
    // an arm plate on the door top reaching one stud out, the head on it, rounded towards the rear
    P('3023b', 0, 22, 22, BLK, 0); P('3023b', 0, 23, 22, BLK, 1); P('11477', 0, 24, 22, BLK, 2);
    P('3023b', 14, 22, 22, BLK, 0); P('3023b', 15, 23, 22, BLK, 1); P('11477', 15, 24, 22, BLK, 2);
  });

  // ---------------------------------------------------------------- SNOT helpers (same maths as the toolkit's sign/panel)
  const studsOf = (host, list) => list.map(([sx, sz, sy]) => { const sg = host.rot === 2 ? -1 : 1; const [fw, fd] = [DIMS[host.id][0], DIMS[host.id][1]];
    return { p: [host.x + fw / 2 + sg * sx, (host.y + sy) * 0.4, host.z + fd / 2 + sg * sz], n: [0, 0, sg] }; });
  const mount = (stud, id, color, fx = 0, fz = 0) => {
    const n = stud.n; const right = [n[2], 0, -n[0]];
    const M = [right[0], n[0], 0, 0, 0, -1, right[2], n[2], 0];
    const [b, base] = BODY[id]; const bc = [(b[0] + b[3]) / 2 + fx, base, (b[2] + b[5]) / 2 + fz];
    const w = [M[0] * bc[0] + M[1] * bc[1] + M[2] * bc[2], M[3] * bc[0] + M[4] * bc[1] + M[5] * bc[2], M[6] * bc[0] + M[7] * bc[1] + M[8] * bc[2]];
    return m.free(id, color, [stud.p[0] - w[0], stud.p[1] - w[1], stud.p[2] - w[2]], M);
  };

  // ---------------------------------------------------------------- front details: number plate in the grille, badge on the nose
  m.section('front', () => {
    // a 1x4 brick with side studs at the back of the grille recess (z 34) carries a white 1x4 tile: the number plate
    m.rigid(() => { const host = P('30414', 6, 8, 34, BLK, 0); const st = studsOf(host, SIDE['30414']);
      mount(st.find((q) => Math.abs(q.p[0] - 7.5) < 0.01), '2431', 'White', -0.5); });
    // Toyota badge: a silver round tile on a jumper plate on the centre line of the nose (one plate over the grid's top)
    P('15573', 7, 16, 35, BLUE, 0); m.part('98138', 7.5, 17, 35, SILVER, 0);
  });

  // ---------------------------------------------------------------- windscreen: one slanted surface of 2x2 Trans-Black slopes
  // grid tops of the windscreen columns (inner rows): 28, 27, 26, 25, 23, 22 over z 21..26; three rows of 45-degree 2x2 slopes
  // (3 plates over 2 studs) with their high edges at 29, 26 and 23 follow that line within about one plate. The stud row at the
  // top of each slope gets a Trans-Black 1x2 tile, so no bare studs show and the glass reads as one slanted surface.
  m.section('windscreen', () => {
    for (let x = 3; x <= 11; x += 2) for (const [z, y] of [[21, 26], [23, 23], [25, 20]]) {
      for (let i = 0; i < 2; i++) for (let k = 0; k < 2; k++) { const c = V.get(key(x + i, y - 1, z + k)); if (c) c.c = BLK; }   // dark under the glass
      for (let i = 0; i < 2; i++) for (let k = 0; k < 2; k++) for (let yy = y; yy < 34; yy++) V.delete(key(x + i, yy, z + k));   // grid cells over the glass line
      P('3039', x, y, z, GLASS, 0); P('3069b', x, y + 3, z, GLASS, 0);
    }
  });

  // ---------------------------------------------------------------- shell: keep visible cells and the cell behind them
  const solid = (x, y, z) => V.has(key(x, y, z)) || OCC.has(key(x, y, z));
  const solidS = (x, y, z) => inS(x, y, z) || OCC.has(key(x, y, z));
  const N6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const visible = new Set();
  for (const [k] of V) { const [x, y, z] = k.split(',').map(Number); if (N6.some(([a, b, c]) => !solidS(x + a, y + b, z + c))) visible.add(k); }
  const keep = new Set();
  for (const [k] of V) { const [x, y, z] = k.split(',').map(Number);
    if (visible.has(k) || N6.some(([a, b, c]) => visible.has(key(x + a, y + b, z + c))) || SUP.has(k)) keep.add(k); }
  for (let pass = 0; pass < 3; pass++) for (const k of [...keep]) { const [x, y, z] = k.split(',').map(Number); const b = key(x, y - 1, z); if (V.has(b)) keep.add(b); }
  for (const k of [...V.keys()]) if (!keep.has(k)) V.delete(k);

  // exposed tops become tiles (nothing sits on them); a cell carrying a hand-placed part keeps its studs
  for (const [k, v] of V) { const [x, y, z] = k.split(',').map(Number); if ((!solidS(x, y + 1, z) || REC.has(key(x, y + 1, z))) && !SUP.has(k)) v.k = 'tile'; }   // (also the floor of the grille recess)

  // a blade tip left between two recessed grille rows holds only sideways: a 1x2 plate ties it to the cell behind it
  m.section('front', () => {
    for (const [k, v] of [...V]) { const [x, y, z] = k.split(',').map(Number);
      if (z < 33 || V.has(key(x, y, z + 1)) || V.has(key(x, y + 1, z)) || V.has(key(x, y - 1, z)) || !V.has(key(x, y, z - 1))) continue;
      P('3023b', x, y, z - 1, v.c, 1);
    }
  });

  // windscreen treads: flat Trans-Black tiles render pale from above and turn the windscreen into a light staircase; the
  // flat treads are black (like the glass frit) and only the sloped faces stay dark glass
  const treadDark = (x, y, z) => z >= 19 && z <= 25 && hx(x) >= 2 && y >= 22;

  // curved slopes: a 1-plate staircase (column tops t, t-1, then lower) becomes 1x2 curved slopes (11477, 2 plates over 2 studs),
  // one per pair of columns, so rear glass, roof edges and bonnet sides read as one slanted surface. The slope fills the two
  // top cells of the high column and the top cell of the low one, rising at most one plate over the grid at its thin end.
  const topOf = (x, z) => { for (let y = 33; y >= 0; y--) if (solidS(x, y, z)) return y; return -1; };
  m.section('curves', () => {
    for (const [dx, dz, rot] of [[0, -1, 2], [0, 1, 0], [1, 0, 1], [-1, 0, 3]]) for (let x = X0; x <= X1; x++) for (let z = 0; z < L; z++) {
      const t = topOf(x, z); if (t < 10) continue;
      const x2 = x + dx, z2 = z + dz;
      if (topOf(x2, z2) !== t - 1 || topOf(x - dx, z - dz) < t || topOf(x2 + dx, z2 + dz) > t - 2) continue;
      const cells = [key(x, t, z), key(x, t - 1, z), key(x2, t - 1, z2)];
      const v1 = V.get(cells[0]), v2 = V.get(cells[2]);
      if (!cells.every((k) => V.has(k) && !SUP.has(k)) || !V.has(key(x, t - 2, z)) || !V.has(key(x2, t - 2, z2))) continue;
      const c1 = v1.c === GLASS ? BLK : v1.c, c2 = v2.c === GLASS ? BLK : v2.c;
      if (c1 !== c2 || ![BLK, BLUE].includes(c1)) continue;       // only inside one paint area, in colours the part comes in
      V.get(key(x, t - 2, z)).k = 'plate'; V.get(key(x2, t - 2, z2)).k = 'plate';
      for (const k of cells) V.delete(k);
      P('11477', Math.min(x, x2), t - 1, Math.min(z, z2), c1, rot);
    }
  });

  // slopes: where a column's top cell stands two or more plates above its neighbour, the top two plates become a 1x1 cheese slope
  // falling towards that neighbour. The slope fills the same two cells, so the shape stays inside the grid; the staircase edges
  // of bonnet, nose, windscreen, roof and rear glass read as smooth surfaces.
  const DIRS = [[0, 1, 0], [0, -1, 2], [1, 0, 1], [-1, 0, 3]];      // [dx, dz, rot]: rot faces the low side
  const tops = [...V].filter(([k, v]) => v.k === 'tile').map(([k]) => k.split(',').map(Number));
  m.section('slopes', () => {
    for (const [x, y, z] of tops) {
      const top = V.get(key(x, y, z)), mid = V.get(key(x, y - 1, z)), under = V.get(key(x, y - 2, z));
      if (y - 1 <= 7 || !top || !mid || !under || SUP.has(key(x, y, z)) || SUP.has(key(x, y - 1, z))) continue;
      const d = DIRS.find(([dx, dz]) => !solidS(x + dx, y, z + dz) && !solidS(x + dx, y - 1, z + dz));
      if (!d) continue;
      // a slope on a single-stud peak (low on two opposite sides) would look like a spike: leave it a tile
      if (!solidS(x - d[0], y, z - d[1]) && !solidS(x - d[0], y - 1, z - d[1])) continue;
      const c = top.c === GLASS || mid.c === GLASS ? GLASS : top.c;
      under.k = 'plate';
      P('54200', x, y - 1, z, c, d[2]);
    }
  });

  for (const [k, v] of V) { const [x, y, z] = k.split(',').map(Number); if (v.k === 'tile' && v.c === GLASS && treadDark(x, y, z)) v.c = BLK; }

  // three plates of one colour stacked in a brick course become a brick (fewer, stronger parts in the shell)
  for (const [k, v] of V) { const [x, y, z] = k.split(',').map(Number); if ((y - 6) % 3 !== 0 || y < 6) continue;
    const cells = [0, 1, 2].map((j) => V.get(key(x, y + j, z)));
    if (BRICKS && cells.every((c) => c && c.k === 'plate' && c.c === cells[0].c)) cells.forEach((c) => (c.k = 'brick')); }

  // face pairs (see above): forced on odd layers; where the two cells differ in kind (a tile on top) the layer below is used
  const kindOf = (c) => (c.k === 'tile' ? 't' : 'p');
  const tryPair = (k) => { const v = V.get(k), b = v && v.pb && V.get(v.pb);
    if (!b || v.u || b.u || kindOf(v) !== kindOf(b) || v.c !== b.c) return false; v.u = b.u = `pair ${k}`; return true; };
  for (const [k] of [...V]) { const [x, y, z] = k.split(',').map(Number); if (y % 2 === 1 && V.get(k).pb && !tryPair(k)) tryPair(key(x, y - 1, z)); }

  m.section('body', () => {
    for (const [k, v] of V) { const [x, y, z] = k.split(',').map(Number); m.box(x, y, z, 1, 1, 1, v.c, { kind: v.k, ...(v.u ? { unit: v.u } : {}) }); }
  });
  return m;
}
