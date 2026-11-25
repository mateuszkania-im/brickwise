// Instruction booklet: model.ldr (with 0 STEP blocks) -> step images, part callouts and a PDF, in the style of a printed manual.
// Determinism: fixed camera, fixed sizes, software rendering (SwiftShader), pixel ratio 1, sorted inputs, fixed PDF metadata.
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import { parseLdr } from '../ldr.mjs';
import { lookupLdraw, db } from '../../forge/engine/avail.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const GEO_DIR = path.join(ROOT, 'forge/engine/parts/geo');
const FIXED_DATE = new Date('2026-01-01T00:00:00Z');
const BROWSER_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-rasterization', '--force-color-profile=srgb', '--font-render-hinting=none'];
const PAGE_W = 1754, PAGE_H = 1240;   // A4 landscape at 150 dpi

/** LDraw colour code -> [hex, alpha] from the pinned LDConfig */
function ldconfig() {
  const map = new Map();
  for (const line of fs.readFileSync(path.join(ROOT, 'data/LDConfig.ldr'), 'utf8').split('\n')) {
    const m = /!COLOUR\s+(\S+)\s+CODE\s+(\d+)\s+VALUE\s+#([0-9A-Fa-f]{6})(?:.*ALPHA\s+(\d+))?/.exec(line);
    if (m) map.set(m[2], { name: m[1].replace(/_/g, ' '), hex: '#' + m[3].toUpperCase(), alpha: m[4] ? Number(m[4]) / 255 : 1 });
  }
  return map;
}

/** LDraw (LDU, y down) -> render space (studs, y up), as the forge viewer does */
function toStuds(p) {
  const s = [1, -1, -1]; const m = p.m.map((v, k) => v * s[Math.floor(k / 3)] * s[k % 3]);
  return { pos: [p.pos[0] / 20, -p.pos[1] / 20, -p.pos[2] / 20], m };
}

const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

export async function booklet(file, outDir, { title } = {}) {
  const parts = parseLdr(file); const colours = ldconfig();
  if (!parts.length) throw new Error(`${file} has no parts, nothing to draw`);
  const missingGeo = [...new Set(parts.map((p) => p.part))].filter((id) => !fs.existsSync(path.join(GEO_DIR, id + '.json')));
  if (missingGeo.length) throw new Error(`no render geometry for: ${missingGeo.join(', ')} (only parts in the forge catalogue can be drawn for now)`);
  const unknownColour = [...new Set(parts.map((p) => p.color))].filter((c) => !colours.has(c));
  if (unknownColour.length) throw new Error(`unknown LDraw colour code(s): ${unknownColour.join(', ')}`);
  const nSteps = Math.max(...parts.map((p) => p.step)) + 1;

  const geo = {}; for (const id of [...new Set(parts.map((p) => p.part))].sort()) geo[id] = JSON.parse(fs.readFileSync(path.join(GEO_DIR, id + '.json'), 'utf8'));
  const inst = parts.map((p) => { const t = toStuds(p); const c = colours.get(p.color); return [p.part, c.hex, c.alpha, ...t.pos, ...t.m, p.step]; });

  const imgDir = path.join(outDir, 'images'); fs.mkdirSync(imgDir, { recursive: true });
  const renderJs = fs.readFileSync(path.join(ROOT, 'src/booklet/dist/render.js'), 'utf8');
  const html = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:transparent}canvas{display:block}</style><canvas id="c"></canvas><script>window.BW=${JSON.stringify({ geo, inst })}</script><script>${renderJs.replace(/<\/script/g, '<\\/script')}</script>`;
  const htmlFile = path.join(outDir, '.render.html'); fs.writeFileSync(htmlFile, html);

  const browser = await chromium.launch({ args: BROWSER_ARGS });
  const shoot = async (query, w, h, out) => {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(htmlFile).href + '?' + query); await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
    const buf = await page.screenshot({ omitBackground: true }); await page.close(); fs.writeFileSync(out, buf); return buf;
  };

  // lines (part + colour) for callouts, in a fixed order
  const lines = new Map();
  for (const p of parts) { const k = `${p.part}|${p.color}`; if (!lines.has(k)) lines.set(k, { part: p.part, color: p.color, n: 0, perStep: new Map() }); const l = lines.get(k); l.n++; l.perStep.set(p.step, (l.perStep.get(p.step) ?? 0) + 1); }
  const lineList = [...lines.values()].sort((a, b) => (a.part < b.part ? -1 : a.part > b.part ? 1 : Number(a.color) - Number(b.color)));
  const partImg = new Map();
  for (const l of lineList) { const c = colours.get(l.color); const f = path.join(imgDir, `part-${l.part}-${l.color}.png`);
    await shoot(`mode=part&id=${encodeURIComponent(l.part)}&hex=${c.hex.slice(1)}&a=${c.alpha}`, 220, 220, f); partImg.set(`${l.part}|${l.color}`, f); }
  await shoot('mode=cover', 1500, 1000, path.join(imgDir, 'cover.png'));
  for (let k = 0; k < nSteps; k++) await shoot(`mode=step&k=${k}`, 1660, 1000, path.join(imgDir, `step-${String(k + 1).padStart(3, '0')}.png`));

  // pages: cover, steps (2 per page), parts list
  const b64 = (f) => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
  const css = `body{margin:0;width:${PAGE_W}px;height:${PAGE_H}px;background:#fff;font-family:Helvetica,Arial,sans-serif;color:#1b1b1b;position:relative;overflow:hidden}
    .num{font-size:64px;font-weight:700} .callout{display:inline-flex;flex-wrap:wrap;gap:6px 14px;background:#e9f2fb;border:2px solid #9fbfe0;border-radius:10px;padding:8px 14px;max-width:1100px}
    .co{display:flex;flex-direction:column;align-items:center;font-size:22px;font-weight:700} .co img{width:110px;height:110px;object-fit:contain}
    .foot{position:absolute;bottom:18px;right:34px;font-size:22px;color:#777}`;
  const pages = [];
  pages.push(`<style>${css}</style><div style="padding:50px 70px"><div style="font-size:72px;font-weight:700">${esc(title ?? path.basename(path.dirname(file)))}</div>
    <div style="font-size:28px;color:#555;margin-top:8px">${parts.length} pieces · ${nSteps} steps · buildable with LEGO® bricks or compatible bricks</div>
    <img src="${b64(path.join(imgDir, 'cover.png'))}" style="display:block;margin:30px auto 0;width:1500px;height:1000px;object-fit:contain"></div>`);
  const stepPage = (k) => { const used = lineList.filter((l) => l.perStep.has(k));
    return `<style>${css}</style><div style="display:flex;flex-direction:column;height:${PAGE_H}px;padding:24px 46px 40px;box-sizing:border-box"><div style="display:flex;align-items:flex-start;gap:28px"><span class="num">${k + 1}</span>
      <span class="callout">${used.map((l) => `<span class="co"><img src="${b64(partImg.get(`${l.part}|${l.color}`))}"><span>${l.perStep.get(k)}x</span></span>`).join('')}</span></div>
      <img src="${b64(path.join(imgDir, `step-${String(k + 1).padStart(3, '0')}.png`))}" style="flex:1;min-height:0;object-fit:contain;align-self:center;width:100%"></div><div class="foot">${pages.length + 1}</div>`; };
  for (let k = 0; k < nSteps; k++) pages.push(stepPage(k));
  const perPage = 42;
  for (let s = 0; s < lineList.length; s += perPage) {
    pages.push(`<style>${css}</style><div style="padding:40px 60px"><div style="font-size:40px;font-weight:700;margin-bottom:20px">Parts list</div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:14px">${lineList.slice(s, s + perPage).map((l) => {
      const v = lookupLdraw(l.part, l.color); return `<div style="display:flex;flex-direction:column;align-items:center;font-size:18px;text-align:center"><img src="${b64(partImg.get(`${l.part}|${l.color}`))}" style="width:120px;height:120px;object-fit:contain"><b style="font-size:24px">${l.n}x</b><span>${esc(v.rb ?? l.part)}</span><span style="color:#666">${esc(v.colour?.name ?? colours.get(l.color).name)}</span></div>`; }).join('')}</div></div><div class="foot">${pages.length + 1}</div>`);
  }

  const pdf = await PDFDocument.create({ updateMetadata: false });
  pdf.setTitle(title ?? 'Instructions'); pdf.setProducer('brickwise'); pdf.setCreator('brickwise'); pdf.setCreationDate(FIXED_DATE); pdf.setModificationDate(FIXED_DATE);
  const pageImgs = [];
  for (let i = 0; i < pages.length; i++) {
    const page = await browser.newPage({ viewport: { width: PAGE_W, height: PAGE_H }, deviceScaleFactor: 1 });
    await page.setContent(pages[i]); await page.evaluate(() => Promise.all([...document.images].map((im) => im.decode())));
    const buf = await page.screenshot(); await page.close(); const f = path.join(imgDir, `page-${String(i + 1).padStart(3, '0')}.png`); fs.writeFileSync(f, buf); pageImgs.push(f);
    const png = await pdf.embedPng(buf); const pg = pdf.addPage([842, 595]); pg.drawImage(png, { x: 0, y: 0, width: 842, height: 595 });
  }
  await browser.close(); fs.rmSync(htmlFile);
  const bytes = await pdf.save({ useObjectStreams: false });
  fs.writeFileSync(path.join(outDir, 'instructions.pdf'), bytes);
  const manifest = fs.readdirSync(imgDir).sort().map((f) => `${sha(fs.readFileSync(path.join(imgDir, f)))}  images/${f}`);
  manifest.push(`${sha(bytes)}  instructions.pdf`);
  fs.writeFileSync(path.join(outDir, 'booklet.sha256'), manifest.join('\n') + '\n');
  return { steps: nSteps, pages: pages.length, pdf: path.join(outDir, 'instructions.pdf') };
}
