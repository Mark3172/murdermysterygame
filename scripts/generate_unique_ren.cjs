const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  return (crc ^ (-1)) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crcBuf = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  chunk.writeUInt32BE(crc32(crcBuf), 8 + len);
  return chunk;
}

function writePNG(width, height, rgbaBuffer, outputPath) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = createChunk('IHDR', ihdr);

  const stride = width * 4;
  const rawScanlines = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    rawScanlines[y * (stride + 1)] = 0;
    rgbaBuffer.copy(rawScanlines, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idatData = zlib.deflateSync(rawScanlines);
  const idatChunk = createChunk('IDAT', idatData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  const png = Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
  fs.writeFileSync(outputPath, png);
  console.log('Saved PNG to:', outputPath, 'Bytes:', png.length);
  return png;
}

const FW = 24;
const FH = 34;
const sheetW = FW * 4;
const sheetH = FH * 4;
const sheetRgba = Buffer.alloc(sheetW * sheetH * 4);

// Palette for Unique Detective Ren
const PALETTE = {
  outline: '#10131a',
  hair: '#1b202c',
  hairLight: '#323c52',
  silverStreak: '#c0d0e2',
  silverStreakShadow: '#8294aa',
  skin: '#fae0cc',
  skinShadow: '#dfa68c',
  eyeIris: '#d48a24',
  coat: '#182438',
  coatLight: '#283c5e',
  coatShadow: '#0e1624',
  ascot: '#b82032',
  ascotLight: '#e0364c',
  waistcoat: '#121620',
  gold: '#d4af37',
  goldLight: '#ffe066',
  leather: '#422818',
  pants: '#181d28',
  pantsShadow: '#0f121a',
  boots: '#2c1a10',
  bootsLight: '#422618'
};

function hexToRgba(hex) {
  const h = hex.replace('#', '');
  const num = parseInt(h, 16);
  return [ (num >> 16) & 255, (num >> 8) & 255, num & 255, 255 ];
}

// Render individual frame into a FW x FH buffer
function drawFrame(dir, frame) {
  const buf = Buffer.alloc(FW * FH * 4);
  const p = (x, y, color) => {
    if (x < 0 || x >= FW || y < 0 || y >= FH) return;
    const [r, g, b, a] = hexToRgba(color);
    const idx = (y * FW + x) * 4;
    buf[idx] = r; buf[idx+1] = g; buf[idx+2] = b; buf[idx+3] = a;
  };
  const rect = (x, y, w, h, color) => {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        p(x + dx, y + dy, color);
      }
    }
  };

  const bob = (frame === 1 || frame === 3) ? 1 : 0;
  const hy = 2 + bob;
  const ty = 14 + bob;

  if (dir === 0) {
    // ────────────── FRONT (DOWN) ──────────────
    // 1. LEGS & BOOTS
    if (frame === 0 || frame === 2) {
      // Standing neutral
      rect(7, 24, 4, 4, PALETTE.pants);
      rect(13, 24, 4, 4, PALETTE.pants);
      rect(6, 28, 5, 5, PALETTE.boots);
      rect(13, 28, 5, 5, PALETTE.boots);
      p(8, 29, PALETTE.gold); p(15, 29, PALETTE.gold); // brass boot buckles
      rect(6, 33, 5, 1, PALETTE.outline);
      rect(13, 33, 5, 1, PALETTE.outline);
    } else if (frame === 1) {
      // Step left
      rect(6, 23, 4, 4, PALETTE.pants);
      rect(14, 25, 4, 3, PALETTE.pants);
      rect(5, 27, 5, 6, PALETTE.boots);
      rect(14, 28, 5, 5, PALETTE.boots);
      p(7, 28, PALETTE.gold); p(16, 29, PALETTE.gold);
      rect(5, 33, 5, 1, PALETTE.outline);
      rect(14, 33, 5, 1, PALETTE.outline);
    } else if (frame === 3) {
      // Step right
      rect(6, 25, 4, 3, PALETTE.pants);
      rect(14, 23, 4, 4, PALETTE.pants);
      rect(6, 28, 5, 5, PALETTE.boots);
      rect(14, 27, 5, 6, PALETTE.boots);
      p(8, 29, PALETTE.gold); p(15, 28, PALETTE.gold);
      rect(6, 33, 5, 1, PALETTE.outline);
      rect(14, 33, 5, 1, PALETTE.outline);
    }

    // 2. DETECTIVE TRENCH COAT & TORSO
    rect(6, ty, 12, 10, PALETTE.coat);
    rect(7, ty, 10, 1, PALETTE.coatLight);
    rect(5, ty + 9, 14, 1, PALETTE.coatShadow);
    rect(6, ty + 8, 12, 1, PALETTE.coat);

    // Flared coat hem edges during walk
    if (frame === 1) {
      rect(4, ty + 6, 2, 4, PALETTE.coat);
      p(4, ty + 5, PALETTE.outline);
    } else if (frame === 3) {
      rect(18, ty + 6, 2, 4, PALETTE.coat);
      p(19, ty + 5, PALETTE.outline);
    }

    // High coat collar & lapels
    rect(7, ty - 1, 2, 3, PALETTE.coatLight);
    rect(15, ty - 1, 2, 3, PALETTE.coatLight);

    // Crimson silk ascot / cravat at neck
    rect(11, ty, 2, 4, PALETTE.ascot);
    p(11, ty, PALETTE.ascotLight);
    p(12, ty + 1, PALETTE.ascotLight);

    // Double-breasted brass buttons
    p(9, ty + 3, PALETTE.gold);
    p(9, ty + 6, PALETTE.gold);
    p(14, ty + 3, PALETTE.gold);
    p(14, ty + 6, PALETTE.gold);

    // Diagonal leather gadget bandolier strap across chest
    p(8, ty + 1, PALETTE.leather);
    p(9, ty + 2, PALETTE.leather);
    p(10, ty + 3, PALETTE.leather);
    p(11, ty + 4, PALETTE.gold); // brass buckle
    p(12, ty + 5, PALETTE.leather);
    p(13, ty + 6, PALETTE.leather);

    // Acoustic watch chain on hip
    p(15, ty + 7, PALETTE.gold);
    p(16, ty + 7, PALETTE.gold);

    // Arms & Leather Gloves
    const lArmY = (frame === 1) ? ty - 1 : (frame === 3) ? ty + 1 : ty;
    const rArmY = (frame === 3) ? ty - 1 : (frame === 1) ? ty + 1 : ty;
    rect(4, lArmY + 1, 2, 6, PALETTE.coat);
    rect(18, rArmY + 1, 2, 6, PALETTE.coat);
    rect(4, lArmY + 6, 2, 3, PALETTE.leather); // left glove
    rect(18, rArmY + 6, 2, 3, PALETTE.leather); // right glove

    // 3. HEAD & FACE
    // Neck
    rect(10, hy + 9, 4, 3, PALETTE.skinShadow);
    // Face base
    rect(7, hy + 3, 10, 8, PALETTE.skin);
    rect(6, hy + 4, 12, 6, PALETTE.skin);
    rect(8, hy + 10, 8, 2, PALETTE.skin);
    rect(9, hy + 11, 6, 1, PALETTE.skinShadow); // jawline

    // Eyes
    p(8, hy + 6, '#ffffff'); p(9, hy + 6, '#ffffff');
    p(9, hy + 6, PALETTE.eyeIris); // left iris
    rect(8, hy + 5, 2, 1, PALETTE.outline); // left brow

    p(14, hy + 6, '#ffffff'); p(15, hy + 6, '#ffffff');
    p(14, hy + 6, PALETTE.eyeIris); // right iris
    rect(14, hy + 5, 2, 1, PALETTE.outline); // right brow

    // 4. SIGNATURE SLEEK HAIR WITH SILVER-BLUE ROGUE STREAK
    rect(6, hy, 12, 4, PALETTE.hair);
    rect(5, hy + 1, 14, 3, PALETTE.hair);
    rect(4, hy + 2, 3, 6, PALETTE.hair); // left side hair
    rect(17, hy + 2, 3, 6, PALETTE.hair); // right side hair
    rect(7, hy, 10, 1, PALETTE.hairLight); // crown highlight

    // Signature Silver Streak over left brow
    p(7, hy + 1, PALETTE.silverStreak);
    p(8, hy + 2, PALETTE.silverStreak);
    p(8, hy + 3, PALETTE.silverStreak);
    p(9, hy + 4, PALETTE.silverStreak);
    p(8, hy + 4, PALETTE.silverStreakShadow);
    p(9, hy + 5, PALETTE.silverStreakShadow);

    // Front fringe hair tufts
    p(12, hy + 3, PALETTE.hair);
    p(15, hy + 3, PALETTE.hair);
    p(16, hy + 4, PALETTE.hairLight);

    // Outer silhouette outline
    rect(7, hy - 1, 10, 1, PALETTE.outline);
    rect(4, hy + 1, 1, 7, PALETTE.outline);
    rect(19, hy + 1, 1, 7, PALETTE.outline);
  } else if (dir === 1) {
    // ────────────── BACK (UP) ──────────────
    // 1. LEGS & BOOTS
    if (frame === 0 || frame === 2) {
      rect(7, 24, 4, 4, PALETTE.pants);
      rect(13, 24, 4, 4, PALETTE.pants);
      rect(6, 28, 5, 5, PALETTE.boots);
      rect(13, 28, 5, 5, PALETTE.boots);
      rect(6, 33, 5, 1, PALETTE.outline);
      rect(13, 33, 5, 1, PALETTE.outline);
    } else if (frame === 1) {
      rect(6, 23, 4, 4, PALETTE.pants);
      rect(14, 25, 4, 3, PALETTE.pants);
      rect(5, 27, 5, 6, PALETTE.boots);
      rect(14, 28, 5, 5, PALETTE.boots);
      rect(5, 33, 5, 1, PALETTE.outline);
      rect(14, 33, 5, 1, PALETTE.outline);
    } else if (frame === 3) {
      rect(6, 25, 4, 3, PALETTE.pants);
      rect(14, 23, 4, 4, PALETTE.pants);
      rect(6, 28, 5, 5, PALETTE.boots);
      rect(14, 27, 5, 6, PALETTE.boots);
      rect(6, 33, 5, 1, PALETTE.outline);
      rect(14, 33, 5, 1, PALETTE.outline);
    }

    // 2. BACK OF TRENCH COAT
    rect(6, ty, 12, 10, PALETTE.coat);
    rect(7, ty, 10, 1, PALETTE.coatLight);
    rect(11, ty + 1, 2, 9, PALETTE.coatShadow); // center trench vent seam
    rect(5, ty + 9, 14, 1, PALETTE.coatShadow);

    // High collar back
    rect(7, ty - 1, 10, 2, PALETTE.coatLight);

    // Leather belt at back
    rect(6, ty + 5, 12, 1, PALETTE.leather);
    p(11, ty + 5, PALETTE.gold);

    // Arms
    rect(4, ty + 1, 2, 8, PALETTE.coat);
    rect(18, ty + 1, 2, 8, PALETTE.coat);
    rect(4, ty + 7, 2, 2, PALETTE.leather);
    rect(18, ty + 7, 2, 2, PALETTE.leather);

    // 3. FULL BACK OF HAIR
    rect(6, hy, 12, 11, PALETTE.hair);
    rect(5, hy + 2, 14, 8, PALETTE.hair);
    rect(7, hy + 1, 10, 2, PALETTE.hairLight);
    rect(8, hy + 4, 8, 3, PALETTE.hairLight);
    // Silver streak glimpse on back left
    p(7, hy + 2, PALETTE.silverStreak);
    p(8, hy + 3, PALETTE.silverStreak);

    rect(7, hy - 1, 10, 1, PALETTE.outline);
    rect(4, hy + 1, 1, 9, PALETTE.outline);
    rect(19, hy + 1, 1, 9, PALETTE.outline);
  } else if (dir === 2) {
    // ────────────── SIDE LEFT ──────────────
    const stride = (frame === 1) ? 2 : (frame === 3) ? -2 : 0;
    // Legs
    rect(9 - stride, 24, 5, 4, PALETTE.pants);
    rect(8 - stride, 28, 6, 5, PALETTE.boots);
    p(8 - stride, 29, PALETTE.gold);
    rect(7 - stride, 33, 7, 1, PALETTE.outline);

    // Coat profile
    rect(7, ty, 9, 10, PALETTE.coat);
    rect(6, ty - 1, 4, 3, PALETTE.coatLight); // high lapel
    rect(14, ty + 4, 3, 6, PALETTE.coatShadow); // trailing coat tail

    // Ascot glimpse
    rect(6, ty + 1, 2, 2, PALETTE.ascot);

    // Arm swing
    const armX = (frame === 1) ? 6 : (frame === 3) ? 12 : 9;
    rect(armX, ty + 1, 3, 6, PALETTE.coat);
    rect(armX, ty + 6, 3, 3, PALETTE.leather); // glove

    // Head profile
    rect(7, hy + 2, 10, 9, PALETTE.skin);
    rect(5, hy + 4, 3, 4, PALETTE.skin); // nose profile
    p(7, hy + 5, PALETTE.eyeIris); // eye
    p(8, hy + 5, '#ffffff');

    // Hair profile & silver rogue streak
    rect(8, hy, 10, 4, PALETTE.hair);
    rect(10, hy + 1, 8, 9, PALETTE.hair);
    p(6, hy + 2, PALETTE.silverStreak);
    p(7, hy + 3, PALETTE.silverStreak);
    p(7, hy + 4, PALETTE.silverStreakShadow);
  } else if (dir === 3) {
    // ────────────── SIDE RIGHT ──────────────
    const stride = (frame === 1) ? 2 : (frame === 3) ? -2 : 0;
    // Legs
    rect(10 + stride, 24, 5, 4, PALETTE.pants);
    rect(10 + stride, 28, 6, 5, PALETTE.boots);
    p(15 + stride, 29, PALETTE.gold);
    rect(10 + stride, 33, 7, 1, PALETTE.outline);

    // Coat profile
    rect(8, ty, 9, 10, PALETTE.coat);
    rect(14, ty - 1, 4, 3, PALETTE.coatLight); // high lapel
    rect(7, ty + 4, 3, 6, PALETTE.coatShadow); // trailing coat tail

    // Ascot glimpse
    rect(16, ty + 1, 2, 2, PALETTE.ascot);

    // Arm swing
    const armX = (frame === 1) ? 12 : (frame === 3) ? 6 : 9;
    rect(armX, ty + 1, 3, 6, PALETTE.coat);
    rect(armX, ty + 6, 3, 3, PALETTE.leather); // glove

    // Head profile
    rect(7, hy + 2, 10, 9, PALETTE.skin);
    rect(16, hy + 4, 3, 4, PALETTE.skin); // nose profile
    p(16, hy + 5, PALETTE.eyeIris); // eye
    p(15, hy + 5, '#ffffff');

    // Hair profile
    rect(6, hy, 10, 4, PALETTE.hair);
    rect(6, hy + 1, 8, 9, PALETTE.hair);
    rect(8, hy + 1, 6, 3, PALETTE.hairLight);
  }

  return buf;
}

// Assemble full sprite sheet: 4 directions x 4 frames
for (let d = 0; d < 4; d++) {
  for (let f = 0; f < 4; f++) {
    const fBuf = drawFrame(d, f);
    const startX = f * FW;
    const startY = d * FH;
    for (let y = 0; y < FH; y++) {
      for (let x = 0; x < FW; x++) {
        const srcIdx = (y * FW + x) * 4;
        if (fBuf[srcIdx + 3] > 0) {
          const dstIdx = ((startY + y) * sheetW + (startX + x)) * 4;
          sheetRgba[dstIdx] = fBuf[srcIdx];
          sheetRgba[dstIdx + 1] = fBuf[srcIdx + 1];
          sheetRgba[dstIdx + 2] = fBuf[srcIdx + 2];
          sheetRgba[dstIdx + 3] = fBuf[srcIdx + 3];
        }
      }
    }
  }
}

const outPath = path.join(__dirname, '../public/assets/characters/ren.png');
const pngBuffer = writePNG(sheetW, sheetH, sheetRgba, outPath);

const base64Png = pngBuffer.toString('base64');
const rawRgbaBase64 = sheetRgba.toString('base64');

const tsExport = `// Unique 16-bit RPG Clockwork Detective Ren Sprite Sheet
export const REN_PNG_BASE64 = '${base64Png}';
export const REN_RAW_RGBA_BASE64 = '${rawRgbaBase64}';
export const REN_FRAME_WIDTH = ${FW};
export const REN_FRAME_HEIGHT = ${FH};
export const REN_SHEET_WIDTH = ${sheetW};
export const REN_SHEET_HEIGHT = ${sheetH};
`;

fs.writeFileSync(path.join(__dirname, '../src/rendering/RenSpriteData.ts'), tsExport);
console.log('Successfully generated Unique Detective Ren sprite sheet and RenSpriteData.ts');
