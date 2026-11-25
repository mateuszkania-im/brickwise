#!/usr/bin/env node
// Photos of an object -> a 3D mesh (GLB) with fal.ai Hunyuan3D v3.1 Pro (multi-view). Geometry only: colours come from the design.
//   FAL_KEY=... node scripts/photos-to-3d.mjs --front f.jpg [--left l.jpg] [--right r.jpg] [--back b.jpg] [--right-front rf.jpg] [--left-front lf.jpg] --out model.glb
//   --engine tripo --seed 42: Tripo H3.1 multiview (front, left, back, right) with fixed model/texture seeds.
//   Measured 2026-11-23: two Tripo runs with the same seed and photos gave different GLBs (2.3% of grid cells differ), so a seed does
//   NOT make generation reproducible. Always keep the generated GLB (and its .json sidecar) and build from that saved file.
// The result is saved with a JSON sidecar (request id, inputs' SHA-256), so a design can always point at the exact mesh it used.
// This step is not deterministic (a generative model); everything built from the saved GLB is.
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';

const args = process.argv.slice(2); const opt = (n) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : undefined; };
const KEY = process.env.FAL_KEY ?? process.env.FAL_API_KEY; if (!KEY) { console.error('set FAL_KEY'); process.exit(2); }
const out = opt('out'); if (!opt('front') || !out) { console.error('need --front <img> and --out <file.glb>'); process.exit(2); }
const FIELDS = { front: 'input_image_url', left: 'left_image_url', right: 'right_image_url', back: 'back_image_url', 'right-front': 'right_front_image_url', 'left-front': 'left_front_image_url', top: 'top_image_url' };
const body = { generate_type: args.includes('--textured') ? 'Normal' : 'Geometry', face_count: Number(opt('faces') ?? 200000) }; const inputs = {};
for (const [flag, field] of Object.entries(FIELDS)) { const f = opt(flag); if (!f) continue; const buf = fs.readFileSync(f);
  const mime = /\.png$/i.test(f) ? 'image/png' : /\.webp$/i.test(f) ? 'image/webp' : 'image/jpeg';
  body[field] = `data:${mime};base64,${buf.toString('base64')}`; inputs[flag] = { file: path.basename(f), sha256: crypto.createHash('sha256').update(buf).digest('hex') }; }

const H = { Authorization: `Key ${KEY}`, 'Content-Type': 'application/json' };
const TRIPO = opt('engine') === 'tripo';
let endpoint = 'fal-ai/hunyuan-3d/v3.1/pro/image-to-3d', payload = body;
if (TRIPO) {
  // fal's schema for this endpoint: image_urls is a positional list of 2 to 4 strings, "Order: [front, left, back, right]",
  // with no named fields and no documented placeholder for a missing view. So the views given must be a prefix of that order:
  // dropping a middle view would shift the rest (a back photo would be read as the left side).
  const order = ['front', 'left', 'back', 'right']; const seed = Number(opt('seed') ?? 42);
  const given = order.map((k) => Boolean(body[FIELDS[k]])); const n = given.lastIndexOf(true) + 1;
  if (given.slice(0, n).includes(false)) { console.error(`tripo reads views by position [front, left, back, right]; missing --${order[given.indexOf(false)]} before --${order[n - 1]}. Give the views in order without gaps (e.g. front+left, front+left+back), or use the default engine, which takes named views.`); process.exit(2); }
  for (const k of Object.keys(inputs)) if (!order.includes(k)) { console.error(`tripo takes only --front --left --back --right, not --${k}`); process.exit(2); }
  const urls = order.slice(0, n).map((k) => body[FIELDS[k]]);
  if (urls.length < 2) { console.error('tripo needs at least --front and --left'); process.exit(2); }
  endpoint = 'tripo3d/h3.1/multiview-to-3d';
  payload = { image_urls: urls, model_seed: seed, texture_seed: seed, texture: args.includes('--textured'), pbr: false, geometry_quality: 'standard' };
  body.generate_type = payload.texture ? 'textured' : 'geometry'; body.seed = seed;
}
const sub = await (await fetch(`https://queue.fal.run/${endpoint}`, { method: 'POST', headers: H, body: JSON.stringify(payload) })).json();
if (!sub.status_url) { console.error('submit failed:', JSON.stringify(sub).slice(0, 500)); process.exit(1); }
console.log('request', sub.request_id);
for (let t = 0; ; t++) {
  await new Promise((r) => setTimeout(r, 5000));
  const st = await (await fetch(sub.status_url, { headers: H })).json();
  if (st.status === 'COMPLETED') break;
  if (st.status !== 'IN_QUEUE' && st.status !== 'IN_PROGRESS') { console.error('failed:', JSON.stringify(st).slice(0, 500)); process.exit(1); }
  if (t > 180) { console.error('timed out'); process.exit(1); }
}
const res = await (await fetch(sub.response_url, { headers: H })).json();
const url = res.model_glb?.url ?? res.model_mesh?.url ?? res.model_urls?.glb?.url ?? res.pbr_model?.url ?? res.base_model?.url ?? res.model?.url;
if (!url) { console.error('no GLB in response:', JSON.stringify(res).slice(0, 800)); process.exit(1); }
const dl = await fetch(url);
if (!dl.ok) { console.error(`GLB download failed: HTTP ${dl.status} ${dl.statusText} from ${url}`); process.exit(1); }
const glb = Buffer.from(await dl.arrayBuffer());
if (glb.length < 12 || glb.readUInt32LE(0) !== 0x46546c67) { console.error(`downloaded file is not a GLB (${glb.length} bytes) from ${url}`); process.exit(1); }
fs.writeFileSync(out, glb);
fs.writeFileSync(out.replace(/\.glb$/, '') + '.json', JSON.stringify({ endpoint, request_id: sub.request_id, inputs, params: { generate_type: body.generate_type, face_count: body.face_count, seed: body.seed }, glb_sha256: crypto.createHash('sha256').update(glb).digest('hex') }, null, 1) + '\n');
console.log(`saved ${out} (${glb.length} bytes)`);
