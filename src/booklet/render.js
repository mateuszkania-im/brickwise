// Booklet renderer (runs in headless Chromium). No animation, no randomness, fixed camera: one image per request.
// window.BW = { geo: { id: { main, deco, glass } }, inst: [[id, hex, alpha, x, y, z, m0..m8, step]], box: [minx, miny, minz, maxx, maxy, maxz] }
// URL: ?mode=step&k=K (everything up to step K; earlier steps faded) · ?mode=part&id=ID&hex=RRGGBB&a=1 (one part, for callouts) · ?mode=cover
import * as THREE from 'three';

const BW = window.BW; const Q = new URLSearchParams(location.search); const MODE = Q.get('mode') ?? 'cover';
const W = innerWidth, H = innerHeight;
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff, 0x9a948a, 1.15));
const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(-3, 8, 6); scene.add(key);
const fill = new THREE.DirectionalLight(0xffffff, 0.45); fill.position.set(6, 2, -2); scene.add(fill);

const bytes = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
function decode(g) {
  if (!g) return null; const P = new Int16Array(bytes(g.pos).buffer), N = new Int8Array(bytes(g.nrm).buffer), ib = bytes(g.idx);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(Float32Array.from(P, (v) => v / g.q), 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(Float32Array.from(N, (v) => v / 127), 3));
  if (g.col) geo.setAttribute('color', new THREE.BufferAttribute(Float32Array.from(bytes(g.col), (v) => v / 255), 3));
  geo.setIndex(new THREE.BufferAttribute(g.i32 ? new Uint32Array(ib.buffer) : new Uint16Array(ib.buffer), 1)); return geo;
}
const GEO = {}; const EDGES = {};
for (const id of Object.keys(BW.geo).sort()) { const g = BW.geo[id]; GEO[id] = { main: decode(g.main), deco: decode(g.deco), glass: decode(g.glass) };
  EDGES[id] = GEO[id].main ? new THREE.EdgesGeometry(GEO[id].main, 35) : null; }

const edgeMat = new THREE.LineBasicMaterial({ color: 0x1b1b1b, transparent: true, opacity: 0.55 });
const fadeEdge = new THREE.LineBasicMaterial({ color: 0x6b6b6b, transparent: true, opacity: 0.25 });
const newEdge = new THREE.LineBasicMaterial({ color: 0xff7a00 });
const white = new THREE.Color(0xffffff);
function addPart(id, hex, alpha, pos, m, faded, fresh = false) {
  const g = GEO[id]; const M = new THREE.Matrix4().set(m[0], m[1], m[2], pos[0], m[3], m[4], m[5], pos[1], m[6], m[7], m[8], pos[2], 0, 0, 0, 1);
  const col = new THREE.Color(hex); if (faded) col.lerp(white, 0.5);
  const trans = alpha < 1;
  const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.45, metalness: 0, transparent: trans || faded, opacity: trans ? 0.55 : 1, depthWrite: !trans });
  for (const part of [g.main, g.glass]) if (part) { const mesh = new THREE.Mesh(part, part === g.glass ? new THREE.MeshStandardMaterial({ color: 0xcfe6ef, transparent: true, opacity: 0.45, depthWrite: false }) : mat); mesh.applyMatrix4(M); mesh.renderOrder = trans ? 2 : 0; scene.add(mesh); }
  if (g.deco) { const d = new THREE.Mesh(g.deco, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })); d.applyMatrix4(M); scene.add(d); }
  if (EDGES[id]) { const e = new THREE.LineSegments(EDGES[id], faded ? fadeEdge : fresh ? newEdge : edgeMat); e.applyMatrix4(M); scene.add(e); }
}

// fixed view direction: front-left, from above (front of the model is +z)
const DIR = new THREE.Vector3(-1, 0.95, 1.25).normalize();
function frame(box, margin) {
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
  const c = new THREE.Vector3((box[0] + box[3]) / 2, (box[1] + box[4]) / 2, (box[2] + box[5]) / 2);
  cam.position.copy(c).addScaledVector(DIR, 100); cam.up.set(0, 1, 0); cam.lookAt(c); cam.updateMatrixWorld();
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; const inv = cam.matrixWorldInverse;
  for (const x of [box[0], box[3]]) for (const y of [box[1], box[4]]) for (const z of [box[2], box[5]]) { const v = new THREE.Vector3(x, y, z).applyMatrix4(inv); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
  const w = (x1 - x0) * margin, h = (y1 - y0) * margin; const aspect = W / H; let hw = w / 2, hh = h / 2; if (hw / hh > aspect) hh = hw / aspect; else hw = hh * aspect;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; cam.left = cx - hw; cam.right = cx + hw; cam.top = cy + hh; cam.bottom = cy - hh; cam.updateProjectionMatrix(); return cam;
}

/** exact box of the whole model (every part's geometry), the same for every step so the camera never moves */
function modelBox() {
  const b = new THREE.Box3(), t = new THREE.Box3();
  for (const r of BW.inst) { const g = GEO[r[0]].main ?? GEO[r[0]].deco ?? GEO[r[0]].glass; g.computeBoundingBox(); const m = r.slice(6, 15);
    t.copy(g.boundingBox).applyMatrix4(new THREE.Matrix4().set(m[0], m[1], m[2], r[3], m[3], m[4], m[5], r[4], m[6], m[7], m[8], r[5], 0, 0, 0, 1)); b.union(t); }
  return [b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z];
}

let camera;
if (MODE === 'part') {
  const id = Q.get('id'); const hex = '#' + Q.get('hex'); const a = Number(Q.get('a') ?? 1);
  addPart(id, hex, a, [0, 0, 0], [1, 0, 0, 0, 1, 0, 0, 0, 1], false);
  const b = new THREE.Box3().setFromObject(scene); camera = frame([b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z], 1.15);
} else {
  const K = MODE === 'step' ? Number(Q.get('k')) : Infinity;
  for (const r of BW.inst) { const step = r[15]; if (step > K) continue; addPart(r[0], r[1], r[2], [r[3], r[4], r[5]], r.slice(6, 15), MODE === 'step' && step < K, MODE === 'step' && step === K); }
  camera = frame(modelBox(), 1.04);
}
renderer.setClearColor(0xffffff, 0); renderer.render(scene, camera);
window.__ready = true;
