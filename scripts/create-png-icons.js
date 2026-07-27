import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// --- Minimal PNG encoder (no external deps) ---------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(6, 9); // color type RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  const ihdr = chunk('IHDR', ihdrData);

  // Raw scanlines: filter byte 0 (None) + RGBA bytes per row.
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * stride, y * stride + stride);
  }
  const idatData = zlib.deflateSync(raw, { level: 9 });
  const idat = chunk('IDAT', idatData);

  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// --- Icon drawing -------------------------------------------------------------
// Simple "ID card" glyph on a flat rounded-square background, representing
// CPF/CNPJ autofill: a card with an avatar placeholder and text lines.

const BG_COLOR = [37, 99, 235, 255]; // blue-600
const CARD_COLOR = [255, 255, 255, 255];
const AVATAR_COLOR = [147, 181, 246, 255]; // light blue
const LINE_COLOR = [191, 205, 233, 255]; // slate-ish light

function roundedRectSDF(px, py, cx, cy, hw, hh, r) {
  const dx = Math.abs(px - cx) - (hw - r);
  const dy = Math.abs(py - cy) - (hh - r);
  const ax = Math.max(dx, 0);
  const ay = Math.max(dy, 0);
  const outside = Math.sqrt(ax * ax + ay * ay) - r;
  return Math.max(dx, dy) < 0 && dx < r && dy < r ? outside : outside;
}

function insideRoundedRect(px, py, cx, cy, hw, hh, r) {
  return roundedRectSDF(px, py, cx, cy, hw, hh, r) <= 0;
}

function insideCircle(px, py, cx, cy, radius) {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= radius * radius;
}

function blend(dst, src, alpha) {
  if (alpha <= 0) return dst;
  if (alpha >= 1) return src;
  return [
    dst[0] * (1 - alpha) + src[0] * alpha,
    dst[1] * (1 - alpha) + src[1] * alpha,
    dst[2] * (1 - alpha) + src[2] * alpha,
    dst[3] * (1 - alpha) + src[3] * alpha,
  ];
}

function drawIcon(size) {
  const SS = 4; // supersampling factor for anti-aliasing
  const hi = size * SS;
  const rgba = Buffer.alloc(size * size * 4);

  // Shape definitions in normalized [0,1] space.
  const bg = { cx: 0.5, cy: 0.5, hw: 0.46, hh: 0.46, r: 0.14 };
  const card = { cx: 0.5, cy: 0.5, hw: 0.34, hh: 0.225, r: 0.06 };
  const avatar = { cx: card.cx - 0.17, cy: card.cy - 0.02, r: 0.09 };
  const lines = [
    { cx: card.cx + 0.09, cy: card.cy - 0.09, hw: 0.15, hh: 0.028 },
    { cx: card.cx + 0.09, cy: card.cy + 0.01, hw: 0.15, hh: 0.028 },
    { cx: card.cx + 0.02, cy: card.cy + 0.11, hw: 0.22, hh: 0.028 },
  ];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      let samples = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = (x + (sx + 0.5) / SS) / size;
          const py = (y + (sy + 0.5) / SS) / size;

          let color = [0, 0, 0, 0]; // transparent outside the badge

          if (insideRoundedRect(px, py, bg.cx, bg.cy, bg.hw, bg.hh, bg.r)) {
            color = BG_COLOR;
          }
          if (insideRoundedRect(px, py, card.cx, card.cy, card.hw, card.hh, card.r)) {
            color = CARD_COLOR;
          }
          if (insideCircle(px, py, avatar.cx, avatar.cy, avatar.r)) {
            color = AVATAR_COLOR;
          }
          for (const line of lines) {
            if (insideRoundedRect(px, py, line.cx, line.cy, line.hw, line.hh, line.hh)) {
              color = LINE_COLOR;
            }
          }

          r += color[0];
          g += color[1];
          b += color[2];
          a += color[3];
          samples++;
        }
      }

      const idx = (y * size + x) * 4;
      rgba[idx] = Math.round(r / samples);
      rgba[idx + 1] = Math.round(g / samples);
      rgba[idx + 2] = Math.round(b / samples);
      rgba[idx + 3] = Math.round(a / samples);
    }
  }

  return rgba;
}

const iconsDir = path.resolve(process.cwd(), 'public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

for (const size of [16, 48, 128]) {
  const rgba = drawIcon(size);
  const png = encodePNG(size, size, rgba);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), png);
}

console.log('PNG icons generated successfully.');
