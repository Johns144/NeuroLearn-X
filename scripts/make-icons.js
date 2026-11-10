/*
 * Draws the NeuroLearn-X logo into the PNG icons phones use for "Add to Home
 * Screen" (iPhone needs PNG; Android uses the manifest's icons). No image
 * libraries: a small rasterizer with 4×4 supersampling and a PNG encoder.
 *
 *   node scripts/make-icons.js      writes public/icons/*.png
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

// The logo on a 32-unit grid (same as the SVG in index.html).
const NODES = [[10, 10, 2.6], [22, 11, 2.6], [13, 22, 2.6], [23, 22, 2.2]];
const LINKS = [[[10, 10], [22, 11]], [[22, 11], [13, 22]], [[13, 22], [23, 22]], [[10, 10], [13, 22]]];
const TOP = [47, 125, 240], BOTTOM = [29, 87, 184]; // gradient, accent to accent-strong

function segDist(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}
function inRoundRect(x, y, size, r) {
  const cx = Math.min(Math.max(x, r), size - r), cy = Math.min(Math.max(y, r), size - r);
  return Math.hypot(x - cx, y - cy) <= r;
}

/*
 * size: output pixels. rounded: transparent corners (Android / favicon) or a
 * full square (iPhone rounds it itself). scale: share of the icon the mark
 * fills (maskable icons keep it inside the central safe zone).
 */
function draw(size, { rounded, scale }) {
  const px = Buffer.alloc(size * size * 4);
  const ss = 4, unit = (size * scale) / 32, off = (size - 32 * unit) / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let bg = 0, fg = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const X = x + (sx + 0.5) / ss, Y = y + (sy + 0.5) / ss;
          if (rounded && !inRoundRect(X, Y, size, size * 0.28)) continue;
          bg++;
          const u = (X - off) / unit, v = (Y - off) / unit;
          if (NODES.some(([cx, cy, r]) => Math.hypot(u - cx, v - cy) <= r) || LINKS.some(l => segDist(u, v, l[0], l[1]) <= 0.8)) fg++;
        }
      }
      const n = ss * ss, t = y / (size - 1), i = (y * size + x) * 4;
      const base = TOP.map((c, k) => c + (BOTTOM[k] - c) * t);
      const f = bg ? fg / bg : 0;
      for (let k = 0; k < 3; k++) px[i + k] = Math.round(base[k] * (1 - f) + 255 * f);
      px[i + 3] = Math.round(255 * bg / n);
    }
  }
  return png(size, px);
}

const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = buf => { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function png(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const out = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(out, { recursive: true });
const files = {
  'icon-192.png': draw(192, { rounded: true, scale: 0.86 }),
  'icon-512.png': draw(512, { rounded: true, scale: 0.86 }),
  'maskable-512.png': draw(512, { rounded: false, scale: 0.62 }),
  'apple-touch-icon.png': draw(180, { rounded: false, scale: 0.78 }),
  'favicon-32.png': draw(32, { rounded: true, scale: 0.92 })
};
Object.entries(files).forEach(([name, buf]) => fs.writeFileSync(path.join(out, name), buf));
console.log(`Wrote ${Object.keys(files).join(', ')} to ${out}`);
