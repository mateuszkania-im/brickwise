// LDraw reader. Every type-1 line is one placed part: colour code, position (LDU), 3x3 rotation, part file.
// Submodels (MPD "0 FILE") are flattened with their transforms, so the result is always a flat list of real parts.
import fs from 'node:fs';

const round = (v, d = 3) => { const r = Math.round(v * 10 ** d) / 10 ** d; return Object.is(r, -0) ? 0 : r; };
const mul = (a, b) => [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]));
const apply = (m, p) => [0, 1, 2].map((r) => m[r * 3] * p[0] + m[r * 3 + 1] * p[1] + m[r * 3 + 2] * p[2]);
const I = [1, 0, 0, 0, 1, 0, 0, 0, 1];

/** split an .ldr/.mpd into named files; a plain .ldr is one file */
// Lines before the first "0 FILE" (blank lines, "0 Exported by ..." headers) are a header, not a model: in an MPD the
// first "0 FILE" is the main model, unless parts (type-1 lines) come before it. A file with no "0 FILE" is one plain model.
function files(text, name) {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  if (!lines.some((l) => /^0\s+FILE\s+/i.test(l))) return { out: new Map([[name, lines]]), main: name };
  const out = new Map(); let cur = null; let first = null;
  for (const line of lines) {
    const f = /^0\s+FILE\s+(.+)$/i.exec(line);
    if (f) { cur = f[1].trim().toLowerCase(); out.set(cur, []); first ??= cur; continue; }
    if (/^0\s+NOFILE/i.test(line)) { cur = null; continue; }
    if (cur === null && first === null && line.startsWith('1 ')) { cur = name; out.set(cur, []); first = cur; }
    if (cur !== null) out.get(cur).push(line);
  }
  return { out, main: first };
}

/**
 * Parse an LDraw model into a flat, ordered list of parts.
 * Each part: { n, part, color, pos: [x,y,z] (LDU), m: [9], step } — step = index of the 0 STEP block it was in (0-based);
 * parts of a submodel take the step of the line that inserts the submodel.
 * Colour 16 (inherit) takes the colour of the submodel reference.
 */
export function parseLdr(file) {
  const text = fs.readFileSync(file, 'utf8');
  const { out, main } = files(text, '__main__');
  const parts = []; const seen = [];
  const walk = (name, M, P, inheritColor, depth, parentStep = null) => {
    if (depth > 16) throw new Error(`submodel nesting too deep at ${name}`);
    if (seen.includes(name)) throw new Error(`submodel ${name} references itself`);
    seen.push(name); let step = 0;
    for (const line of out.get(name)) {
      if (/^0\s+(STEP|ROTSTEP)\b/i.test(line)) { step++; continue; }
      if (!line.startsWith('1 ')) continue;
      const t = line.split(/\s+/); if (t.length < 15) throw new Error(`bad type-1 line: ${line}`);
      let color = t[1] === '16' ? inheritColor : t[1];
      const p = t.slice(2, 5).map(Number); const m = t.slice(5, 14).map(Number); const ref = t.slice(14).join(' ').toLowerCase().replace(/\\/g, '/');
      if ([...p, ...m].some((v) => !Number.isFinite(v))) throw new Error(`non-numeric value in: ${line}`);
      const wp = apply(M, p).map((v, k) => v + P[k]); const wm = mul(M, m);
      if (out.has(ref)) { walk(ref, wm, wp, color, depth + 1, parentStep ?? step); continue; }
      parts.push({ n: parts.length, part: ref.replace(/\.dat$/, ''), color: String(color), pos: wp.map((v) => round(v)), m: wm.map((v) => round(v, 5)), step: parentStep ?? step });
    }
    seen.pop();
  };
  walk(main, I, [0, 0, 0], '16', 0);
  return parts;
}
