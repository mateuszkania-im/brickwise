// Toyota C-HR 2025 (2nd generation), blue with a black roof, display scale about 1:16.
//
// Scale comes from the wheels: the biggest road wheel in the catalogue (56145 rim + 44309 tyre, 43.2 mm) is the real 720 mm wheel,
// so 1 stud = 128 mm of car: 34 studs long, 14 wide, 31 plates tall, wheelbase 21. That keeps the wheels at the real share of the
// side (the earlier builds put these wheels under a 36-stud body, which is why they sat like a sedan).
//
// The shape is drawn by hand from the side and front photos (ref/chr-side.jpg and ref/chr-front.jpg with a stud grid laid over
// them), not from the mesh grid: the mesh was noisy and every bump of it became pixel noise. Here every surface is a straight
// line in plates and studs, so the colour bands (sill, arch mouldings, beltline, lights) are clean.
//
// Coordinates: x 1..14 across (x 0 / 15 only for the mirrors), z 0 (tail) .. 33 (nose), y in plates. Front faces +z.
// The body is a voxel map (one cell = 1 stud x 1 plate) painted by region; the visible shell is packed into plates, exposed tops
// into tiles; slopes, curved slopes, SNOT plates, wheels and mirrors are real parts placed over it.

// footprint (w along x, d along z at rot 0) and height in plates of every part placed by hand
const DIMS = { '3700': [2, 1, 3], '3023b': [2, 1, 1], '3024': [1, 1, 1], '11477': [1, 2, 2], '54200': [1, 1, 2], '30414': [4, 1, 3],
  '3297': [4, 3, 3], '3298': [2, 3, 3], '4286': [1, 3, 3], '3039': [2, 2, 3], '3040b': [1, 2, 3], '3020': [4, 2, 1], '3710': [4, 1, 1],
  '15573': [2, 1, 1], '11211': [2, 1, 3], '3069b': [2, 1, 1], '85984': [2, 1, 2], '15068': [2, 2, 2] };
const DIM = (id, rot) => { const [w, d, h] = DIMS[id]; return rot % 2 ? [d, w, h] : [w, d, h]; };

export default function build({ Model }) {
  const m = new Model({ title: 'Toyota C-HR 2025', subtitle: '2nd-generation coupe-crossover, blue with a black roof, about 1:16',
    budget: [600, 2500], view: [-40, 7] });
  const X0 = 1, X1 = 14, L = 34;
  const BLUE = 'Blue', BLK = 'Black', GLASS = 'Dark Blue', LED = 'White', TAIL = 'Trans-Red', SILVER = 'Flat Silver', MESH = 'Dark Bluish Gray';
  const WS = GLASS;                                                 // privacy glass: solid Dark Blue reads as the real near-black tinted glass (Trans-Black renders beige and shows the cabin)
  const hx = (x) => Math.min(x - X0, X1 - x);                      // 0 = outer skin, 6 = centre

  // ------------------------------------------------------------------ wheels: geometry first, the arches are cut round them
  const AX = [6, 27], HUB = 6.75, RT = 2.7;                        // axles on stud lines z 6 / 27, hub 6.75 plates up, tyre radius in studs
  const rectDist = (y, z, a) => { const cz = Math.max(z, Math.min(a, z + 1)), cy = Math.max(y * 0.4, Math.min(HUB * 0.4, (y + 1) * 0.4));
    return Math.hypot(cz - a, cy - HUB * 0.4); };
  const near = (y, z) => Math.min(...AX.map((a) => Math.hypot(z + 0.5 - a, (y + 0.5 - HUB) * 0.4)));
  const archOpen0 = (h, y, z) => h <= 2 && AX.some((a) => rectDist(y, z, a) < RT + 0.35 || (y + 0.5 <= HUB && Math.abs(z + 0.5 - a) < 3.05));
  // a cell under an open cell (below the hub) is open too: no stubs left standing at the foot of the arch
  const archOpen = (h, y, z) => { for (let yy = y; yy <= Math.max(y, 7); yy++) if (archOpen0(h, yy, z)) return true; return false; };

  // ------------------------------------------------------------------ profiles (from the photos, in plates)
  // beltline (bottom of the side glass): flat along the front door, kicking up along the rear door into the C-pillar point
  const belt = (z) => (z >= 13 ? 22 : z === 12 ? 23 : z === 11 ? 23 : z === 10 ? 24 : 25);
  // bonnet top surface, z 23 (cowl) .. 33 (nose)
  const TB = { 23: 23, 24: 23, 25: 23, 26: 21, 27: 21, 28: 21, 29: 21, 30: 21, 31: 20, 32: 20, 33: 20 };
  // top (exclusive) of every column
  const top = (x, z) => {
    const h = hx(x);
    if (z >= 23) return TB[z] - (h === 0 ? 1 : 0);
    if (h === 0) {                                                   // outer skin: shoulder
      if (z >= 9) return belt(z);
      if (z >= 6) return 25;                                         // C-pillar haunch, falling with the rear glass
      if (z >= 4) return 24;
      if (z >= 2) return 23;
      return 21;                                                     // tail corners
    }
    // inner columns. The glasshouse steps in twice (tumblehome): h 1 carries the lower glass up to 25 plates, h 2 the upper glass
    // and the roof edge, so the roof is 10 studs wide over a 14-stud body
    if (z >= 21) return 26;                                          // windscreen lower course (y 23..25) is a part
    if (z >= 18) return h === 1 ? 26 : z === 18 ? 30 : 29;          // upper course (y 26..28, h >= 2); roof plate on it at z 18
    if (z >= 9) return h === 1 ? 25 : h === 2 ? 30 : 31;             // roof plate at 29, centre tiles at 30
    if (z === 8) return h === 1 ? 25 : 30;                           // the roof falls towards the spoiler (a curved slope rolls it)
    if (z === 7) return h === 1 ? 25 : 29;
    if (z >= 5) return h === 1 ? 27 : 29;
    if (z >= 3) return 27;                                           // rear glass upper course (part, z 3..5); spoiler plate at 27 over z 3..6
    if (z >= 1) return 24;                                           // rear glass lower course (part, z 1..3)
    return 21;                                                       // z 0: the light bar, its top tiled: a red lip under the glass
  };
  const BOT = 4;                                                     // ground clearance 4 plates (13 mm = 500 mm... the body sill sits at 4.5 on the car)
  const corner = (x, y, z) => (hx(x) === 0 && ((z === 33 && y >= 7) || (z === 0 && y >= 6)));   // rounded corners

  const inS = (x, y, z) => x >= X0 && x <= X1 && z >= 0 && z < L && y >= BOT && y < top(x, z) && !archOpen(hx(x), y, z) && !corner(x, y, z);
  const zFront = (x, y) => { for (let z = L - 1; z >= 0; z--) if (inS(x, y, z)) return z; return -1; };
  const zRear = (x, y) => { for (let z = 0; z < L; z++) if (inS(x, y, z)) return z; return L; };

  // ------------------------------------------------------------------ the face (front), h 0..6 from the corner to the centre line
  // W LED blade, R recessed black lamp housing, C recessed LED segment (Trans-Clear), B blue, K black, G grille (recessed one
  // stud), A silver badge. Rows 18..19 of the centre are rolled forward by curved slopes (the bonnet falls to the blade).
  const FACE = {
    19: 'BBBBBBB',
    18: 'BBBBBBB',
    17: 'WWWWWBB',                                                   // LED blade under the rolled bonnet edge, running in to its point,
    16: 'WRRRBBB',                                                   // two plates thick at the outer corner; slim dark lamp housing under it
    15: 'CRCRBBA',                                                   // with a row of LED segments; badge on the centre line
    14: 'RRRRBBB',
    13: 'KKKBBBB',
    12: 'KKKBGGG',                                                   // the fang: a thin blue blade running diagonally from under
    11: 'KKBGGGG',                                                   // the lamp's inner end down and out to the bumper corner,
    10: 'KKBGGGG',                                                   // black C corner outside it, the big dark grille inside
    9: 'KBGGGGG',
    8: 'KBGGGGG',
    7: 'KKKGGGG',
    6: 'KKKKKKK',
    5: 'KKKKKKK',
    4: 'KKKKKKK',
  };
  const FC = { W: LED, B: BLUE, K: BLK, G: 'G', R: 'R', C: 'C', A: SILVER };
  // the back, h 0..6. P = tailgate panel, recessed one stud under the overhanging light bar
  const REAR = {
    20: 'QQQQQQQ',                                                   // full-width light bar under the rear glass: one plate of red,
    19: 'QBBBBBB',                                                   // tiled on top so it also reads from above; the ends hook down
    18: 'QBBBBBA',                                                   // at the corners; badge
    17: 'BBPPPPP',
    16: 'BBPPPPP', 15: 'BBPPPPP', 14: 'BBPPPPP', 13: 'BBPPPPP',
    12: 'RRKKKKK',                                                   // reflectors in the black bumper
    10: 'LKKKKKK',                                                   // silver diffuser trim, a U rising at the corners
    9: 'KLKKKKK',
    8: 'KKLLLLL',
  };
  const RC = { R: TAIL, Q: 'Red', B: BLUE, P: 'P', K: BLK, A: SILVER, L: 'Light Bluish Gray' };

  // arch moulding: every cell within one stud / two plates of the arch opening
  const ring = (h, y, z) => { for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) if (archOpen(h, y + dy, z + dz) && y + dy >= BOT) return true; return false; };
  const sideGlass = (h, y, z) => z >= 9 && z !== 14 && y >= belt(z) &&
    ((h === 1 && y <= 25 && z <= 20) || (h === 2 && y >= 25 && y <= 28 && z <= 17));

  const colour = (x, y, z) => {
    const h = hx(x);
    if (z >= 31 && y <= 19 && z === zFront(x, y)) return FC[FACE[y][h]];
    if (z <= 1 && y <= 20 && z === zRear(x, y)) { const r = REAR[y]; return r ? RC[r[h]] : y >= 13 ? BLUE : BLK; }
    if (h === 0 && z === 31 && y >= 14 && y <= 17) return y >= 16 ? LED : BLK;   // blade and housing wrap round the corner
    if (h === 0 && z >= 30 && y >= 7 && y <= 15) return BLK;       // the black C corner wraps onto the side
    if (h === 0 && z <= 2 && y === 20) return 'Red';                // the light bar wraps round onto the side
    if (h === 0 && z <= 1 && y === 19) return 'Red';
    if (h === 0 && z === 1 && y === 18) return 'Red';
    if (sideGlass(h, y, z)) return GLASS;
    if (y >= 22 && h >= 1 && z >= 23) return BLUE;                 // the bonnet runs up to the windscreen
    if (y >= 22 && h >= 1) return BLK;                              // pillars, roof, spoiler
    if (h === 0 && y >= 22) return z >= 9 ? BLUE : BLK;
    if (y <= 6) return BLK;                                         // sills, bumpers
    if (h === 0 && y >= 16 && y <= 17 && AX.some((a) => z >= a - 4 && z < a + 4)) return BLUE;   // behind the moulding tiles: blue shows round their curve
    if (h <= 2 && ring(h, y, z)) return BLK;
    if (h === 3 && AX.some((q) => Math.abs(z + 0.5 - q) < 4) && y <= 16) return BLK;   // dark wheel-well walls                        // arch mouldings: an even band round the cut, dark wells
    return BLUE;
  };

  // ------------------------------------------------------------------ voxel map
  const V = new Map(); const key = (x, y, z) => `${x},${y},${z}`;
  for (let x = X0; x <= X1; x++) for (let y = BOT; y < 32; y++) for (let z = 0; z < L; z++) if (inS(x, y, z)) V.set(key(x, y, z), { c: colour(x, y, z), k: 'plate' });

  // face cells bond into the body: the cell behind takes the same colour (when hidden) and the two are one 1x2 plate on odd layers
  for (const [k, v] of V) { const [x, y, z] = k.split(',').map(Number); if (['G', 'R', 'C', 'P'].includes(v.c) || y < 5) continue;
    const front = y <= 19 && z >= 31 && z === zFront(x, y), rear = z <= 1 && y <= 20 && z === zRear(x, y);
    if (!front && !rear) continue;
    const zb = front ? z - 1 : z + 1, b = V.get(key(x, y, zb)); if (!b) continue;
    if (b.c !== v.c && (!inS(x - 1, y, zb) || !inS(x + 1, y, zb) || !inS(x, y + 1, zb))) continue;
    if (v.c === TAIL) { b.c = 'Red'; continue; }                   // solid red behind the Trans-Red bar: it glows instead of going dark
    b.c = v.c; v.pb = key(x, y, zb); }

  // grille and intake pockets: one stud deep, the back wall black (grille) or dark grey (pockets)
  const REC = new Set();
  const BACK = { G: BLK, R: BLK, C: 'Trans-Clear', P: BLUE };
  for (const [k, v] of [...V]) { if (!BACK[v.c]) continue; const [x, y, z] = k.split(',').map(Number);
    if ((v.c === 'R' || v.c === 'C') && z < 33) { v.c = BACK[v.c]; continue; }   // the corner column is already one stud back
    V.delete(k); REC.add(k); const zb = v.c === 'P' ? z + 1 : z - 1; const b = V.get(key(x, y, zb));
    if (b) { b.c = BACK[v.c]; delete b.pb; } }

  const OCC = new Set(), SUP = new Set(), CARRY = new Set();   // SUP: cells touching a part (kept); CARRY: cells under a part (keep studs)
  const P = (id, x, y, z, c, rot = 0) => {
    const [w, d, hh] = DIM(id, rot);
    for (let i = 0; i < w; i++) for (let k = 0; k < d; k++) {
      for (let j = 0; j < hh; j++) { V.delete(key(x + i, y + j, z + k)); OCC.add(key(x + i, y + j, z + k)); }
      SUP.add(key(x + i, y - 1, z + k)); SUP.add(key(x + i, y + hh, z + k)); CARRY.add(key(x + i, y - 1, z + k));
    }
    return m.part(id, x, y, z, c, rot);
  };
  const fill = (x, y, z, c) => { if (!OCC.has(key(x, y, z))) V.set(key(x, y, z), { c, k: 'plate' }); };

  // ------------------------------------------------------------------ wheels: Technic brick in the floor, axle 3, rim + tyre
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

  // ------------------------------------------------------------------ windscreen: two courses of 33-degree slopes, A-pillars
  // lower course y 23 over z 20..22, upper course y 26 over z 18..20: one straight surface from the cowl (23 plates at z 23) to the
  // roof (29 plates at z 18). A-pillars in the outer glass columns (x 2 / 13) are 1-wide slopes of the same angle.
  m.section('windscreen', () => {
    // lower course x 2..13 (pillars at 2 / 13), upper course one stud narrower each side (pillars at 3 / 12): a trapezoid screen
    P('4286', 2, 23, 20, BLK, 0); P('4286', 13, 23, 20, BLK, 0);
    P('3298', 3, 23, 20, WS, 0); P('3297', 5, 23, 20, WS, 0); P('3297', 9, 23, 20, WS, 0);
    P('4286', 3, 26, 18, BLK, 0); P('4286', 12, 26, 18, BLK, 0);
    P('3297', 4, 26, 18, WS, 0); P('3297', 8, 26, 18, WS, 0);
    // the hollow under the upper course is the dark cabin
    for (let x = 2; x <= 13; x++) for (const z of [18, 19]) for (let y = 22; y < 26; y++) if (!V.has(key(x, y, z))) fill(x, y, z, hx(x) === 1 && y >= 22 ? GLASS : BLK);
  });

  // ------------------------------------------------------------------ rear glass: two courses of 45-degree Trans-Black slopes
  m.section('rear', () => {
    // 33-degree slopes: lower course y 21 over z 0..2, upper course y 24 over z 2..4, one raked surface from the light bar (21) to the
    // spoiler (27); the C-pillars in the outer glass columns are 1-wide slopes of the same angle
    for (const [y, z] of [[21, 1], [24, 3]]) {
      P('4286', 2, y, z, BLK, 2); P('4286', 13, y, z, BLK, 2);
      P('3298', 3, y, z, GLASS, 2); P('3297', 5, y, z, GLASS, 2); P('3297', 9, y, z, GLASS, 2);
    }

    // the spoiler: black plates over the top of the rear glass, two studs of overhang, tiled
    for (let x = 3; x <= 11; x += 2) P('3020', x, 27, 3, BLK, 1);
  });

  // ------------------------------------------------------------------ mirrors at the foot of the A-pillars
  m.section('mirrors', () => {
    P('3023b', 0, 22, 21, BLK, 0); P('3023b', 0, 23, 21, BLK, 1); P('11477', 0, 24, 21, BLK, 2);
    P('3023b', 14, 22, 21, BLK, 0); P('3023b', 15, 23, 21, BLK, 1); P('11477', 15, 24, 21, BLK, 2);
  });

  // ------------------------------------------------------------------ SNOT number plates
  const SIDE30414 = [[-1.5, 0.5, 1.75], [-0.5, 0.5, 1.75], [0.5, 0.5, 1.75], [1.5, 0.5, 1.75]];
  const studsOf = (host) => SIDE30414.map(([sx, sz, sy]) => { const sg = host.rot === 2 ? -1 : 1;
    return { p: [host.x + 2 + sg * sx, (host.y + sy) * 0.4, host.z + 0.5 + sg * sz], n: [0, 0, sg] }; });
  const mount = (stud, id, color, fx = 0) => {
    const n = stud.n; const right = [n[2], 0, -n[0]];
    const M = [right[0], n[0], 0, 0, 0, -1, right[2], n[2], 0];
    const bc = [fx, -0.4, 0];
    const w = [M[0] * bc[0] + M[1] * bc[1] + M[2] * bc[2], M[3] * bc[0] + M[4] * bc[1] + M[5] * bc[2], M[6] * bc[0] + M[7] * bc[1] + M[8] * bc[2]];
    return m.free(id, color, [stud.p[0] - w[0], stud.p[1] - w[1], stud.p[2] - w[2]], M);
  };
  m.section('lights', () => {
    // the bonnet rolls forward over the face: curved slopes on the centre of the nose, the blade tucked under their front edge
    for (let x = 2; x <= 13; x++) P('11477', x, 18, 32, BLUE, 0);
  });
  m.section('front', () => {
    m.rigid(() => { const host = P('30414', 6, 8, 32, BLK, 0); const st = studsOf(host);
      mount(st.find((q) => Math.abs(q.p[0] - 7.5) < 0.01), '2431', 'White', -0.5); });
  });
  m.section('rear', () => {
    m.rigid(() => { const host = P('30414', 6, 14, 1, BLUE, 2); const st = studsOf(host);
      mount(st.find((q) => Math.abs(q.p[0] - 8.5) < 0.01), '2431', 'White', -0.5); });
  });

  // ------------------------------------------------------------------ arch mouldings with a round outline
  // Black tiles on side-stud bricks stand one plate proud of the body over the top of each arch: a band of 1x1 tiles over the
  // crown and a 2x2 corner-round tile at each shoulder, so the moulding's outer edge is a curve, not a staircase of plates.
  // The matrix picks which world corner the tile's rounded corner lands on: up and away from the wheel.
  const placeAt = (id, color, M, lc, wc) => m.free(id, color, [wc[0] - (M[0] * lc[0] + M[1] * lc[1] + M[2] * lc[2]),
    wc[1] - (M[3] * lc[0] + M[4] * lc[1] + M[5] * lc[2]), wc[2] - (M[6] * lc[0] + M[7] * lc[1] + M[8] * lc[2])], M);
  m.section('arches', () => {
    for (const a of AX) for (const side of [-1, 1]) {
      const xc = side < 0 ? X0 : X1, face = side < 0 ? X0 : X1 + 1, wx = face + side * 0.2, rot = side < 0 ? 3 : 1;
      const n = [side, 0, 0], right = [0, 0, -side];                // right as seen looking at the face
      const Mflat = [right[0], n[0], 0, 0, 0, -1, right[2], n[2], 0];
      const Mup = [0, n[0], right[0], 1, 0, 0, 0, n[2], right[2]];            // local x -> up, local z -> right
      const Mback = [-right[0], n[0], 0, 0, 0, 1, -right[2], n[2], 0];        // local x -> -right, local z -> up
      // crown: 1x4 side-stud brick, four 1x1 tiles (y 15.5 .. 18)
      m.rigid(() => { P('30414', xc, 15, a - 2, BLK, rot);
        for (let z = a - 2; z < a + 2; z++) placeAt('3070b', BLK, Mflat, [0, -0.2, 0], [wx, 16.75 * 0.4, z + 0.5]); });
      // shoulders: 1x2 side-stud brick, a 2x2 corner-round tile hanging from it (y 13 .. 18)
      for (const [z0, high] of [[a - 4, false], [a + 2, true]]) m.rigid(() => { P('11211', xc, 15, z0, BLK, rot);
        // the round corner must be up and away from the wheel: towards -z on the rear shoulder, +z on the front one
        const wantPlusZ = high; const rightIsPlusZ = right[2] > 0;
        const M = (wantPlusZ === rightIsPlusZ) ? Mup : Mback;
        placeAt('27925', BLK, M, [0.5, -0.2, 0.5], [wx, 15.5 * 0.4, z0 + 1]); });
    }
  });

  // ------------------------------------------------------------------ door sculpt: the C-HR's diagonal crease
  // the lower door stands one plate proud (blue 1x4 tiles on side-stud bricks), its top edge stepping up towards the rear:
  // low behind the front wheel, high at the rear door, the line that runs from the front arch up into the rear haunch
  m.section('doors', () => {
    for (const side of [-1, 1]) {
      const xc = side < 0 ? X0 : X1, wx = (side < 0 ? X0 : X1 + 1) + side * 0.2, rot = side < 0 ? 3 : 1;
      const n = [side, 0, 0], right = [0, 0, -side];
      const Mflat = [right[0], n[0], 0, 0, 0, -1, right[2], n[2], 0];
      for (const [y, z0, z1] of [[7, 10, 22], [10, 10, 18]]) for (let z = z0; z < z1; z += 4)
        m.rigid(() => { P('30414', xc, y, z, BLUE, rot); placeAt('2431', BLUE, Mflat, [0, -0.2, 0], [wx, (y + 1.75) * 0.4, z + 2]); });
    }
  });

  // ------------------------------------------------------------------ shell: keep visible cells and the cell behind them
  const solidS = (x, y, z) => inS(x, y, z) || OCC.has(key(x, y, z)) || V.has(key(x, y, z));
  const N6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const visible = new Set();
  for (const [k] of V) { const [x, y, z] = k.split(',').map(Number); if (N6.some(([a, b, c]) => !solidS(x + a, y + b, z + c) || REC.has(key(x + a, y + b, z + c)))) visible.add(k); }
  // keep the visible skin and two cells behind it (three cells round the wheel wells, so the arch ceilings tie into the floor)
  const keep = new Set([...visible, ...[...V.keys()].filter((k) => SUP.has(k))]);
  const wellZone = (x, z) => hx(x) <= 4 && AX.some((a) => Math.abs(z + 0.5 - a) < 4.5);
  for (let ring = 0; ring < 3; ring++) for (const k of [...keep]) { const [x, y, z] = k.split(',').map(Number);
    if (ring === 2 && !wellZone(x, z)) continue;
    for (const [a, b, c] of N6) { const n = key(x + a, y + b, z + c); if (V.has(n)) keep.add(n); } }
  for (let pass = 0; pass < 3; pass++) for (const k of [...keep]) { const [x, y, z] = k.split(',').map(Number); const b = key(x, y - 1, z); if (V.has(b)) keep.add(b); }
  for (const k of [...V.keys()]) if (!keep.has(k)) V.delete(k);
  // hidden cells next to glass are the dark cabin
  for (const [k, v] of V) { if (visible.has(k)) continue; const [x, y, z] = k.split(',').map(Number); if (y >= 22 && hx(x) >= 2) v.c = BLK; }

  // exposed tops become tiles; a cell carrying a part keeps its studs
  const solid2 = (x, y, z) => V.has(key(x, y, z)) || OCC.has(key(x, y, z));
  for (const [k, v] of V) { const [x, y, z] = k.split(',').map(Number); if ((!solid2(x, y + 1, z) || REC.has(key(x, y + 1, z))) && !CARRY.has(k)) v.k = 'tile'; }
  // spoiler: tiles on its plates
  for (let x = 3; x <= 12; x++) for (let z = 3; z <= 6; z++) V.set(key(x, 28, z), { c: BLK, k: 'tile' });

  const topOf = (x, z) => { for (let y = 32; y >= 0; y--) if (solid2(x, y, z)) return y; return -1; };
  // the bonnet falls 2 plates at z 26: a row of curved slopes rolls it down from the cowl to the front half
  m.section('bonnet', () => {
    for (let x = X0; x <= X1; x++) { const t = topOf(x, 26);
      if (topOf(x, 25) !== t + 2 || topOf(x, 27) !== t) continue;
      for (const z of [26, 27]) V.get(key(x, t, z)).k = 'plate';
      P('11477', x, t + 1, 26, BLUE, 0); }
  });
  // curved slopes on 1-plate steps (roof edges, bonnet sides)
  m.section('curves', () => {
    for (const [dx, dz, rot] of [[1, 0, 1], [-1, 0, 3], [0, 1, 0], [0, -1, 2]]) for (let x = X0; x <= X1; x++) for (let z = 0; z < L; z++) {
      const t = topOf(x, z); if (t < 12) continue;
      const x2 = x + dx, z2 = z + dz;
      if (topOf(x2, z2) !== t - 1 || topOf(x - dx, z - dz) < t || topOf(x2 + dx, z2 + dz) > t - 2) continue;
      const cells = [key(x, t, z), key(x, t - 1, z), key(x2, t - 1, z2)];
      const v1 = V.get(cells[0]), v2 = V.get(cells[2]);
      if (!cells.every((k) => V.has(k) && !CARRY.has(k)) || !V.has(key(x, t - 2, z)) || !V.has(key(x2, t - 2, z2))) continue;
      if (v1.c !== v2.c || ![BLK, BLUE].includes(v1.c)) continue;
      V.get(key(x, t - 2, z)).k = 'plate'; V.get(key(x2, t - 2, z2)).k = 'plate';
      for (const k of cells) V.delete(k);
      P('11477', Math.min(x, x2), t - 1, Math.min(z, z2), v1.c, rot);
    }
  });

  // face pairs: forced on odd layers
  const kindOf = (c) => (c.k === 'tile' ? 't' : 'p');
  const tryPair = (k) => { const v = V.get(k), b = v && v.pb && V.get(v.pb);
    if (!b || v.u || b.u || kindOf(v) !== kindOf(b) || v.c !== b.c) return false; v.u = b.u = `pair ${k}`; return true; };
  for (const [k] of [...V]) { const [x, y, z] = k.split(',').map(Number); if (y % 2 === 1 && V.get(k).pb && !tryPair(k)) tryPair(key(x, y - 1, z)); }

  m.section('body', () => {
    for (const [k, v] of V) { const [x, y, z] = k.split(',').map(Number); m.box(x, y, z, 1, 1, 1, v.c, { kind: v.k, ...(v.u ? { unit: v.u } : {}) }); }
  });
  return m;
}
