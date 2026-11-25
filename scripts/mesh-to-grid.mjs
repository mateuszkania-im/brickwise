#!/usr/bin/env node
// A 3D mesh (GLB) -> a stud grid: which cells (1 stud x 1 stud x 1 plate) are inside the object, at a chosen size.
//   node scripts/mesh-to-grid.mjs model.glb --length 24 [--axis auto|x|z] [--flip] --out grid.json
// --length: the object's longest horizontal extent in studs. Height follows from the mesh (1 plate = 0.4 stud).
// Output: grid.json (layers bottom-up, each a list of rows of '#'/'.'), plus side/front/top silhouettes as text, for a designer
// to build inside. Pure function of the GLB and the options: the same input always gives the same grid.
import fs from 'node:fs';

const args = process.argv.slice(2); const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const USAGE = 'usage: node scripts/mesh-to-grid.mjs <model.glb> [--length 24] [--axis auto|x|z] [--flip] [--out grid.json]';
const file = args[0]; if (!file || file.startsWith('--')) { console.error(USAGE); process.exit(2); }
const LEN = Number(opt('length', 24)); if (!Number.isInteger(LEN) || LEN < 1) { console.error(`--length must be a positive whole number of studs, got "${opt('length')}"\n${USAGE}`); process.exit(2); }
if (!['auto', 'x', 'z'].includes(opt('axis', 'auto'))) { console.error(`--axis must be auto, x or z\n${USAGE}`); process.exit(2); }
const out = opt('out', file.replace(/\.glb$/, '') + '.grid.json');

// ---- minimal GLB reader: positions and indices of every mesh primitive, with node transforms applied
function readGlb(buf) {
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('not a GLB file');
  let off = 12; let json = null; let bin = null;
  while (off < buf.length) { const len = buf.readUInt32LE(off); const type = buf.readUInt32LE(off + 4); const chunk = buf.subarray(off + 8, off + 8 + len);
    if (type === 0x4e4f534a) json = JSON.parse(chunk.toString('utf8')); else if (type === 0x004e4942) bin = chunk; off += 8 + len; }
  const acc = (i) => { const a = json.accessors[i]; const bv = json.bufferViews[a.bufferView]; const start = (bv.byteOffset ?? 0) + (a.byteOffset ?? 0);
    const n = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type]; const C = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5121: Uint8Array }[a.componentType];
    const stride = bv.byteStride; if (stride && stride !== n * C.BYTES_PER_ELEMENT) throw new Error('interleaved buffers not supported');
    return new C(bin.buffer.slice(bin.byteOffset + start, bin.byteOffset + start + a.count * n * C.BYTES_PER_ELEMENT)); };
  // node transforms (translation / rotation quaternion / scale, or matrix), applied down the scene tree
  const mat = (n) => { if (n.matrix) { const m = n.matrix; return [m[0], m[4], m[8], m[12], m[1], m[5], m[9], m[13], m[2], m[6], m[10], m[14]]; }
    const [x, y, z, w] = n.rotation ?? [0, 0, 0, 1]; const [sx, sy, sz] = n.scale ?? [1, 1, 1]; const [tx, ty, tz] = n.translation ?? [0, 0, 0];
    return [(1 - 2 * (y * y + z * z)) * sx, 2 * (x * y - z * w) * sy, 2 * (x * z + y * w) * sz, tx, 2 * (x * y + z * w) * sx, (1 - 2 * (x * x + z * z)) * sy, 2 * (y * z - x * w) * sz, ty, 2 * (x * z - y * w) * sx, 2 * (y * z + x * w) * sy, (1 - 2 * (x * x + y * y)) * sz, tz]; };
  const mul = (a, b) => { const r = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) r.push(a[i * 4] * b[j] + a[i * 4 + 1] * b[4 + j] + a[i * 4 + 2] * b[8 + j] + (j === 3 ? a[i * 4 + 3] : 0)); return r; };
  const ap = (m, v) => [0, 1, 2].map((i) => m[i * 4] * v[0] + m[i * 4 + 1] * v[1] + m[i * 4 + 2] * v[2] + m[i * 4 + 3]);
  const tris = [];
  const visit = (ni, parent) => { const n = json.nodes[ni]; const M = mul(parent, mat(n));
    if (n.mesh != null) for (const prim of json.meshes[n.mesh].primitives) { const P = acc(prim.attributes.POSITION); const I = prim.indices != null ? acc(prim.indices) : Uint32Array.from({ length: P.length / 3 }, (_, k) => k);
      for (let k = 0; k < I.length; k += 3) tris.push([0, 1, 2].map((j) => ap(M, [P[I[k + j] * 3], P[I[k + j] * 3 + 1], P[I[k + j] * 3 + 2]]))); }
    for (const c of n.children ?? []) visit(c, M); };
  const ID = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
  // without a scene, start only from nodes that are no one's child: starting from every node would visit children twice
  const childOf = new Set((json.nodes ?? []).flatMap((n) => n.children ?? []));
  const roots = json.nodes ? (json.scenes?.[json.scene ?? 0]?.nodes ?? json.nodes.map((_, i) => i).filter((i) => !childOf.has(i))) : [];
  if (json.nodes) for (const r of roots) visit(r, ID); else for (const mesh of json.meshes) for (const prim of mesh.primitives) { const P = acc(prim.attributes.POSITION); const I = prim.indices != null ? acc(prim.indices) : Uint32Array.from({ length: P.length / 3 }, (_, k) => k); for (let k = 0; k < I.length; k += 3) tris.push([0, 1, 2].map((j) => [P[I[k + j] * 3], P[I[k + j] * 3 + 1], P[I[k + j] * 3 + 2]])); }
  return tris;
}

const tris = readGlb(fs.readFileSync(file));
const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
for (const t of tris) for (const v of t) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], v[k]); hi[k] = Math.max(hi[k], v[k]); }
const ext = hi.map((h, k) => h - lo[k]);
// length axis: the longer horizontal one (y is up in glTF)
const axis = opt('axis', 'auto') === 'auto' ? (ext[0] >= ext[2] ? 'x' : 'z') : opt('axis');
const L = axis === 'x' ? 0 : 2, Wd = axis === 'x' ? 2 : 0;
const s = LEN / ext[L];                                   // studs per mesh unit
const nx = LEN, nz = Math.ceil(ext[Wd] * s - 1e-9), ny = Math.ceil(ext[1] * s / 0.4 - 1e-9);
const flip = args.includes('--flip');

// inside test: cast a ray along the width axis through the cell centre and count crossings (even-odd)
// triangles bucketed by the length cell they span, so each ray only tests the triangles it can hit
const buckets = Array.from({ length: nx }, () => []);
for (const t of tris) { const as = t.map((v) => (v[L] - lo[L]) * s); const i0 = Math.max(0, Math.floor(Math.min(...as) - 0.5)), i1 = Math.min(nx - 1, Math.ceil(Math.max(...as) + 0.5)); for (let i = i0; i <= i1; i++) buckets[i].push(t); }
function crossings(a, b, i) {   // a = length coord, b = height coord (mesh units), i = length cell; returns sorted width coords where the line crosses the surface
  const hits = [];
  for (const t of buckets[i]) {
    const [p, q, r] = t.map((v) => [v[L], v[1], v[Wd]]);
    const d = (q[0] - p[0]) * (r[1] - p[1]) - (r[0] - p[0]) * (q[1] - p[1]); if (Math.abs(d) < 1e-12) continue;
    const u = ((a - p[0]) * (r[1] - p[1]) - (r[0] - p[0]) * (b - p[1])) / d; const v = ((q[0] - p[0]) * (b - p[1]) - (a - p[0]) * (q[1] - p[1])) / d;
    if (u < 0 || v < 0 || u + v > 1) continue;
    hits.push(p[2] + u * (q[2] - p[2]) + v * (r[2] - p[2]));
  }
  return hits.sort((m, n) => m - n);
}
const layers = [];
for (let y = 0; y < ny; y++) {
  const rows = Array.from({ length: nz }, () => Array(nx).fill('.'));
  const b = lo[1] + (y + 0.5) * 0.4 / s;
  for (let i = 0; i < nx; i++) {
    const a = lo[L] + (i + 0.5) / s; const h = crossings(a, b, i);
    for (let k = 0; k + 1 < h.length; k += 2) for (let j = 0; j < nz; j++) { const w = lo[Wd] + (j + 0.5) / s; if (w >= h[k] && w <= h[k + 1]) rows[j][flip ? nx - 1 - i : i] = '#'; }
  }
  layers.push(rows.map((r) => r.join('')));
}
const side = []; for (let y = ny - 1; y >= 0; y--) side.push(Array.from({ length: nx }, (_, i) => (layers[y].some((r) => r[i] === '#') ? '#' : '.')).join(''));
const front = []; for (let y = ny - 1; y >= 0; y--) front.push(Array.from({ length: nz }, (_, j) => (layers[y][j].includes('#') ? '#' : '.')).join(''));
const top = Array.from({ length: nz }, (_, j) => Array.from({ length: nx }, (_, i) => (layers.some((l) => l[j][i] === '#') ? '#' : '.')).join(''));
const res = { source: file.split('/').pop(), length_studs: nx, width_studs: nz, height_plates: ny, length_axis: axis, flipped: flip,
  note: 'layers[y][z][x]: y = plate layer from the ground up, z = row across the width, x = along the length. Silhouettes: side (x across, top row = highest), front (z across), top (z rows, x columns).',
  side, front, top, layers };
fs.writeFileSync(out, JSON.stringify(res, null, 1) + '\n');
console.log(`grid ${nx} x ${nz} studs x ${ny} plates (length along mesh ${axis}${flip ? ', flipped' : ''}) -> ${out}\n\nSIDE\n${side.join('\n')}\n\nFRONT\n${front.join('\n')}\n\nTOP\n${top.join('\n')}`);
