#!/usr/bin/env python3
"""Colour a stud grid from a textured mesh: every surface cell takes the colour of the nearest mesh surface, snapped to the
closest colour (CIELAB) from a palette of real brick colours. Pure function of its inputs: same files, same output.

  python3 -I scripts/mesh-colours.py textured.glb grid.json --palette "Blue,Black,Dark Bluish Gray,White" --shell 2 --out sculpture.json

grid.json must come from scripts/mesh-to-grid.mjs run on the SAME mesh with the same --length (the cell geometry is recomputed
here the same way). Output: layers[y][z][x] with one character per cell: '.' empty, 'i' for interior cells inside the shell (left
hollow by a sculpture build), and otherwise the palette index as one character of PALETTE_CHARS below (digits, then a-z without
'i', then A-Z: up to 61 colours). Needs numpy and Pillow.
"""
import argparse, io, json, struct, sys
from pathlib import Path
import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('glb'); ap.add_argument('grid'); ap.add_argument('--palette', required=True); ap.add_argument('--shell', type=int, default=2)
ap.add_argument('--out', required=True)
a = ap.parse_args()
ROOT = Path(__file__).resolve().parent.parent

# ---- palette: names -> RGB from the pinned data/colors.csv
import csv
rgb = {}
with open(ROOT / 'data' / 'colors.csv', newline='') as f:
    for r in csv.DictReader(f): rgb[r['name'].lower()] = r['rgb']
names = [n.strip() for n in a.palette.split(',') if n.strip()]
# one character per palette index; never '.' (empty) or 'i' (interior), so every cell reads back unambiguously
PALETTE_CHARS = '0123456789abcdefghjklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
if not names: sys.exit('--palette is empty')
if len(names) > len(PALETTE_CHARS): sys.exit(f'--palette has {len(names)} colours; at most {len(PALETTE_CHARS)} fit in one character per cell')
for n in names:
    if n.lower() not in rgb: sys.exit(f'unknown colour "{n}" (names as in data/colors.csv)')
pal = np.array([[int(rgb[n.lower()][k:k + 2], 16) for k in (0, 2, 4)] for n in names], dtype=float)

def to_lab(c):
    c = c / 255.0; c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)
pal_lab = to_lab(pal)

# ---- GLB: positions (node transforms applied), uvs, indices, base colour texture
b = Path(a.glb).read_bytes()
if struct.unpack('<I', b[:4])[0] != 0x46546C67: sys.exit('not a GLB')
off, js, bin_ = 12, None, None
while off < len(b):
    ln, ty = struct.unpack('<II', b[off:off + 8]); ch = b[off + 8:off + 8 + ln]
    if ty == 0x4E4F534A: js = json.loads(ch)
    elif ty == 0x004E4942: bin_ = ch
    off += 8 + ln
def acc(i):
    A = js['accessors'][i]; bv = js['bufferViews'][A['bufferView']]; n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[A['type']]
    dt = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8}[A['componentType']]
    st = bv.get('byteOffset', 0) + A.get('byteOffset', 0)
    return np.frombuffer(bin_, dtype=dt, count=A['count'] * n, offset=st).reshape(-1, n) if n > 1 else np.frombuffer(bin_, dtype=dt, count=A['count'], offset=st)
def node_m(n):
    if 'matrix' in n: return np.array(n['matrix'], float).reshape(4, 4).T
    x, y, z, w = n.get('rotation', [0, 0, 0, 1]); sx, sy, sz = n.get('scale', [1, 1, 1]); t = n.get('translation', [0, 0, 0])
    R = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
    M = np.eye(4); M[:3, :3] = R * np.array([sx, sy, sz]); M[:3, 3] = t; return M
P_all, UV_all, I_all, tex = [], [], [], None
def visit(ni, parent):
    global tex
    n = js['nodes'][ni]; M = parent @ node_m(n)
    if 'mesh' in n:
        for prim in js['meshes'][n['mesh']]['primitives']:
            P = acc(prim['attributes']['POSITION']).astype(float); P = (np.c_[P, np.ones(len(P))] @ M.T)[:, :3]
            UV = acc(prim['attributes']['TEXCOORD_0']).astype(float); I = acc(prim['indices']).astype(np.int64).reshape(-1, 3)
            base = sum(len(p) for p in P_all); P_all.append(P); UV_all.append(UV); I_all.append(I + base)
            mat = js['materials'][prim['material']] if 'material' in prim else None
            if tex is None and mat and 'baseColorTexture' in mat.get('pbrMetallicRoughness', {}):
                img = js['images'][js['textures'][mat['pbrMetallicRoughness']['baseColorTexture']['index']]['source']]
                bv = js['bufferViews'][img['bufferView']]; tex = np.asarray(Image.open(io.BytesIO(bin_[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']])).convert('RGB'), dtype=float)
    for c in n.get('children', []): visit(c, M)
# roots as in mesh-to-grid.mjs: the scene's nodes, or without a scene every node that is no one's child
_child = {c for n in js.get('nodes', []) for c in n.get('children', [])}
_roots = js['scenes'][js.get('scene', 0)]['nodes'] if js.get('scenes') else [i for i in range(len(js.get('nodes', []))) if i not in _child]
for r in _roots: visit(r, np.eye(4))
if tex is None: sys.exit('the mesh has no base colour texture (generate it with photos-to-3d.mjs --textured)')
P = np.vstack(P_all); UV = np.vstack(UV_all); I = np.vstack(I_all)

# ---- surface samples: 7 barycentric points per triangle -> position + texture colour
W = np.array([[1/3, 1/3, 1/3], [2/3, 1/6, 1/6], [1/6, 2/3, 1/6], [1/6, 1/6, 2/3], [1/2, 1/2, 0], [0, 1/2, 1/2], [1/2, 0, 1/2]])
pos = np.einsum('sk,tkd->tsd', W, P[I]).reshape(-1, 3); uv = np.einsum('sk,tkd->tsd', W, UV[I]).reshape(-1, 2)
h, w_ = tex.shape[:2]; px = np.clip((uv[:, 0] % 1.0) * (w_ - 1), 0, w_ - 1).round().astype(int); py = np.clip((uv[:, 1] % 1.0) * (h - 1), 0, h - 1).round().astype(int)
col = tex[py, px]

# ---- the grid's cell centres, recomputed exactly as mesh-to-grid.mjs does
G = json.loads(Path(a.grid).read_text()); nx, nz, ny = G['length_studs'], G['width_studs'], G['height_plates']
lo, hi = P.min(0), P.max(0); ext = hi - lo
L = 0 if G['length_axis'] == 'x' else 2; Wd = 2 if L == 0 else 0
s = nx / ext[L]
filled = np.array([[[c == '#' for c in row] for row in layer] for layer in G['layers']])   # [y][z][x]
if filled.shape != (ny, nz, nx): sys.exit('grid shape does not match')
pad = np.pad(filled, 1); surf = filled & ~(pad[:-2, 1:-1, 1:-1] & pad[2:, 1:-1, 1:-1] & pad[1:-1, :-2, 1:-1] & pad[1:-1, 2:, 1:-1] & pad[1:-1, 1:-1, :-2] & pad[1:-1, 1:-1, 2:])
# shell: cells within `shell` steps of the surface (6-neighbour erosion)
inner = filled.copy()
for _ in range(a.shell):
    p2 = np.pad(inner, 1); inner = inner & p2[:-2, 1:-1, 1:-1] & p2[2:, 1:-1, 1:-1] & p2[1:-1, :-2, 1:-1] & p2[1:-1, 2:, 1:-1] & p2[1:-1, 1:-1, :-2] & p2[1:-1, 1:-1, 2:]
shell = filled & ~inner
ys, zs, xs = np.nonzero(shell)
centre = np.zeros((len(ys), 3)); centre[:, 1] = lo[1] + (ys + 0.5) * 0.4 / s
xi = (nx - 1 - xs) if G.get('flipped') else xs
centre[:, L] = lo[L] + (xi + 0.5) / s; centre[:, Wd] = lo[Wd] + (zs + 0.5) / s
# samples bucketed into the same cells; each shell cell takes the median colour of the samples in its 3x3x3 neighbourhood,
# widening to 5x5x5 when there are none (no k-d tree needed, fully deterministic)
cell = np.empty((len(pos), 3), dtype=np.int64)
cell[:, 0] = np.floor((pos[:, 1] - lo[1]) * s / 0.4); cell[:, 2] = np.floor((pos[:, L] - lo[L]) * s); cell[:, 1] = np.floor((pos[:, Wd] - lo[Wd]) * s)
if G.get('flipped'): cell[:, 2] = nx - 1 - cell[:, 2]
order = np.lexsort((cell[:, 2], cell[:, 1], cell[:, 0])); cell, colo = cell[order], col[order]
keys = (cell[:, 0] * 10000 + cell[:, 1]) * 10000 + cell[:, 2]
starts = {}; uk, first, cnt = np.unique(keys, return_index=True, return_counts=True)
for k_, f_, c_ in zip(uk.tolist(), first.tolist(), cnt.tolist()): starts[k_] = (f_, c_)
def gather(y, z, x, r):
    out = []
    for dy in range(-r, r + 1):
        for dz in range(-r, r + 1):
            for dx in range(-r, r + 1):
                k_ = ((y + dy) * 10000 + (z + dz)) * 10000 + (x + dx)
                if k_ in starts: f_, c_ = starts[k_]; out.append(colo[f_:f_ + c_])
    return np.vstack(out) if out else None
med = np.zeros((len(ys), 3))
for n_, (y, z, x) in enumerate(zip(ys.tolist(), zs.tolist(), xs.tolist())):
    g = None
    for r in (1, 2, 3, 5):
        g = gather(y, z, x, r)
        if g is not None: break
    med[n_] = np.median(g, axis=0) if g is not None else pal[0]
c_lab = to_lab(med)
best = np.argmin(((c_lab[:, None, :] - pal_lab[None, :, :]) ** 2).sum(-1), axis=1)
out = np.full(filled.shape, '.', dtype='<U1'); out[inner] = 'i'; out[ys, zs, xs] = np.array([PALETTE_CHARS[k] for k in best])
res = {'source': Path(a.glb).name, 'grid': Path(a.grid).name, 'palette': names, 'shell': a.shell,
       'note': "layers[y][z][x] like the grid; '.' empty, 'i' interior (hollow), other characters index the palette",
       'counts': {names[k]: int((best == k).sum()) for k in range(len(names))},
       'layers': [[''.join(r) for r in layer] for layer in out]}
Path(a.out).write_text(json.dumps(res, indent=1) + '\n')
print(json.dumps(res['counts']), '->', a.out)
