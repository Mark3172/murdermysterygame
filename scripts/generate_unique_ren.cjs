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

// Palette for Ren in Classic Detective Costume
const PALETTE = {
  outline: '#10131a',
  hat: '#182236',
  hatLight: '#2c3c5c',
  hatShadow: '#0c121e',
  hatBand: '#8e1a28',          // Crimson silk ribbon band
  hatBandBuckle: '#d4af37',    // Golden buckle on hat
  hair: '#1b202c',
  hairLight: '#323c52',
  silverStreak: '#c4d8ec',      // Signature silver-blue rogue streak
  silverStreakShadow: '#8498b2',
  skin: '#fae0cc',
  skinShadow: '#dfa68c',
  eyeIris: '#d48a24',          // Sharp amber detective eyes
  coat: '#182438',             // Midnight noir trenchcoat
  coatLight: '#2c3e5e',
  coatShadow: '#0c1422',
  ascot: '#b82032',            // Crimson ascot tie
  ascotLight: '#e4364c',
  waistcoat: '#121620',
  gold: '#d4af37',             // Brass & gold accents
  goldLight: '#ffe066',
  leather: '#422818',          // Leather belt & detective holster/gloves
  leatherLight: '#623c24',
  pants: '#181d28',
  pantsShadow: '#0f121a',
  boots: '#2c1a10',
  bootsLight: '#462a1c'
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
  const hy = 4 + bob;
  const ty = 14 + bob;

  if (dir === 0) {
    // ────────────── FRONT (DOWN) ──────────────
    // 1. LEGS & BOOTS
    if (frame === 0 || frame === 2) {
      rect(7, 24, 4, 4, PALETTE.pants);
      rect(13, 24, 4, 4, PALETTE.pants);
      rect(6, 28, 5, 5, PALETTE.boots);
      rect(13, 28, 5, 5, PALETTE.boots);
      p(8, 29, PALETTE.gold); p(15, 29, PALETTE.gold); // brass buckles
      rect(6, 33, 5, 1, PALETTE.outline);
      rect(13, 33, 5, 1, PALETTE.outline);
    } else if (frame === 1) {
      rect(6, 23, 4, 4, PALETTE.pants);
      rect(14, 25, 4, 3, PALETTE.pants);
      rect(5, 27, 5, 6, PALETTE.boots);
      rect(14, 28, 5, 5, PALETTE.boots);
      p(7, 28, PALETTE.gold); p(16, 29, PALETTE.gold);
      rect(5, 33, 5, 1, PALETTE.outline);
      rect(14, 33, 5, 1, PALETTE.outline);
    } else if (frame === 3) {
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

    // High coat collar & wide peaked lapels
    rect(7, ty - 1, 2, 3, PALETTE.coatLight);
    rect(15, ty - 1, 2, 3, PALETTE.coatLight);
    rect(6, ty, 2, 2, PALETTE.coatLight);
    rect(16, ty, 2, 2, PALETTE.coatLight);

    // Crimson silk ascot at neck
    rect(11, ty, 2, 4, PALETTE.ascot);
    p(11, ty, PALETTE.ascotLight);
    p(12, ty + 1, PALETTE.ascotLight);

    // Double-breasted brass buttons
    p(9, ty + 3, PALETTE.gold);
    p(9, ty + 5, PALETTE.gold);
    p(14, ty + 3, PALETTE.gold);
    p(14, ty + 5, PALETTE.gold);

    // Detective Belt with Brass Buckle
    rect(6, ty + 7, 12, 1, PALETTE.leather);
    rect(11, ty + 6, 2, 3, PALETTE.gold);      // Golden belt buckle
    p(11, ty + 7, PALETTE.leather);

    // Diagonal gadget holster bandolier
    p(8, ty + 1, PALETTE.leather);
    p(9, ty + 2, PALETTE.leather);
    p(10, ty + 3, PALETTE.leather);
    p(11, ty + 4, PALETTE.gold);              // Harness clip
    p(12, ty + 5, PALETTE.leather);

    // Magnifying glass / pocket watch chain at hip
    p(15, ty + 7, PALETTE.gold);
    p(16, ty + 8, PALETTE.gold);
    p(15, ty + 9, PALETTE.goldLight);

    // Arms & Leather Gloves
    const lArmY = (frame === 1) ? ty - 1 : (frame === 3) ? ty + 1 : ty;
    const rArmY = (frame === 3) ? ty - 1 : (frame === 1) ? ty + 1 : ty;
    rect(4, lArmY + 1, 2, 6, PALETTE.coat);
    rect(18, rArmY + 1, 2, 6, PALETTE.coat);
    rect(4, lArmY + 6, 2, 3, PALETTE.leather); // Left leather glove
    rect(18, rArmY + 6, 2, 3, PALETTE.leather); // Right leather glove

    // 3. HEAD & DETECTIVE FEDORA HAT
    // Neck
    rect(10, hy + 8, 4, 2, PALETTE.skinShadow);
    // Face base
    rect(7, hy + 4, 10, 6, PALETTE.skin);
    rect(8, hy + 8, 8, 2, PALETTE.skin);
    rect(9, hy + 9, 6, 1, PALETTE.skinShadow); // Jawline

    // Detective eyes under hat shadow
    p(8, hy + 5, '#ffffff'); p(9, hy + 5, '#ffffff');
    p(9, hy + 5, PALETTE.eyeIris); // Amber eye
    rect(8, hy + 4, 2, 1, PALETTE.outline);

    p(14, hy + 5, '#ffffff'); p(15, hy + 5, '#ffffff');
    p(14, hy + 5, PALETTE.eyeIris); // Amber eye
    rect(14, hy + 4, 2, 1, PALETTE.outline);

    // Side hair below hat
    rect(5, hy + 4, 2, 4, PALETTE.hair);
    rect(17, hy + 4, 2, 4, PALETTE.hair);

    // Signature Silver Streak curling out from beneath hat brim over left eye
    p(7, hy + 3, PALETTE.silverStreak);
    p(8, hy + 4, PALETTE.silverStreak);
    p(7, hy + 5, PALETTE.silverStreakShadow);
    p(8, hy + 6, PALETTE.silverStreak);

    // ─── CLASSIC DETECTIVE FEDORA HAT ───
    // Under-brim shadow cast across forehead
    rect(7, hy + 3, 10, 1, 'rgba(16, 24, 38, 0.6)');

    // Wide Fedora Brim (angled stylishly)
    p(3, hy + 1, PALETTE.outline);
    p(3, hy + 2, PALETTE.hat);
    rect(4, hy + 2, 16, 1, PALETTE.hatLight); // Brim highlight
    rect(4, hy + 3, 16, 1, PALETTE.hat);      // Brim body
    p(20, hy + 2, PALETTE.hat);
    p(20, hy + 1, PALETTE.outline);

    // Crimson Silk Hatband with Gold Clasp
    rect(7, hy + 1, 10, 1, PALETTE.hatBand);
    p(9, hy + 1, PALETTE.hatBandBuckle);      // Golden buckle
    p(10, hy + 1, PALETTE.goldLight);

    // Fedora Crown with Pinched Center Crease
    rect(7, hy - 4, 10, 5, PALETTE.hat);
    rect(8, hy - 4, 8, 1, PALETTE.hatLight);
    p(11, hy - 4, PALETTE.hatShadow);         // Pinched center crease
    p(12, hy - 4, PALETTE.hatShadow);
    p(11, hy - 3, PALETTE.hatShadow);
    p(12, hy - 3, PALETTE.hatShadow);

    // Crown outline
    rect(7, hy - 5, 10, 1, PALETTE.outline);
    rect(6, hy - 4, 1, 5, PALETTE.outline);
    rect(17, hy - 4, 1, 5, PALETTE.outline);
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

    // 2. BACK OF DETECTIVE TRENCH COAT
    rect(6, ty, 12, 10, PALETTE.coat);
    rect(7, ty, 10, 1, PALETTE.coatLight);
    rect(11, ty + 1, 2, 9, PALETTE.coatShadow); // Center trench vent seam
    rect(5, ty + 9, 14, 1, PALETTE.coatShadow);

    // High storm collar back
    rect(7, ty - 1, 10, 2, PALETTE.coatLight);

    // Leather trenchcoat belt at back with buckle
    rect(6, ty + 6, 12, 1, PALETTE.leather);
    rect(11, ty + 6, 2, 1, PALETTE.gold);

    // Arms & Leather Gloves
    rect(4, ty + 1, 2, 8, PALETTE.coat);
    rect(18, ty + 1, 2, 8, PALETTE.coat);
    rect(4, ty + 7, 2, 2, PALETTE.leather);
    rect(18, ty + 7, 2, 2, PALETTE.leather);

    // 3. FULL BACK OF DETECTIVE FEDORA HAT
    // Back hair below hat
    rect(7, hy + 4, 10, 4, PALETTE.hair);
    p(7, hy + 5, PALETTE.silverStreak);

    // Wide Fedora Brim (back view)
    p(3, hy + 2, PALETTE.hat);
    rect(4, hy + 2, 16, 2, PALETTE.hat);
    rect(5, hy + 3, 14, 1, PALETTE.hatShadow);
    p(20, hy + 2, PALETTE.hat);

    // Crimson Silk Hatband
    rect(7, hy + 1, 10, 1, PALETTE.hatBand);

    // Crown from behind with center crease
    rect(7, hy - 4, 10, 5, PALETTE.hat);
    rect(8, hy - 4, 8, 1, PALETTE.hatLight);
    p(11, hy - 4, PALETTE.hatShadow);
    p(12, hy - 4, PALETTE.hatShadow);
    p(11, hy - 3, PALETTE.hatShadow);
    p(12, hy - 3, PALETTE.hatShadow);

    rect(7, hy - 5, 10, 1, PALETTE.outline);
    rect(6, hy - 4, 1, 5, PALETTE.outline);
    rect(17, hy - 4, 1, 5, PALETTE.outline);
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
    rect(6, ty - 1, 4, 3, PALETTE.coatLight);    // Popped lapel
    rect(14, ty + 4, 3, 6, PALETTE.coatShadow); // Trailing coat tail

    // Ascot glimpse
    rect(6, ty + 1, 2, 2, PALETTE.ascot);

    // Belt and holster at hip
    rect(7, ty + 7, 8, 1, PALETTE.leather);
    p(8, ty + 7, PALETTE.gold);

    // Arm swing
    const armX = (frame === 1) ? 6 : (frame === 3) ? 12 : 9;
    rect(armX, ty + 1, 3, 6, PALETTE.coat);
    rect(armX, ty + 6, 3, 3, PALETTE.leather); // Glove

    // Head profile
    rect(7, hy + 4, 9, 6, PALETTE.skin);
    rect(5, hy + 5, 3, 3, PALETTE.skin);       // Nose profile
    p(7, hy + 5, PALETTE.eyeIris);             // Eye
    p(8, hy + 5, '#ffffff');

    // Hair & Silver Streak below hat
    rect(9, hy + 4, 7, 4, PALETTE.hair);
    p(6, hy + 4, PALETTE.silverStreak);
    p(7, hy + 5, PALETTE.silverStreak);
    p(6, hy + 6, PALETTE.silverStreakShadow);

    // ─── FEDORA PROFILE (Tilted Noir Brim) ───
    // Dipping front brim, raised back brim
    p(3, hy + 3, PALETTE.outline);
    rect(4, hy + 3, 4, 1, PALETTE.hat);        // Dipping front
    rect(8, hy + 2, 7, 1, PALETTE.hatLight);   // Mid brim
    rect(15, hy + 1, 3, 1, PALETTE.hat);       // Upturned rear brim
    rect(4, hy + 4, 11, 1, PALETTE.hatShadow); // Under-brim shadow

    // Crimson Band with Gold Buckle
    rect(8, hy + 1, 8, 1, PALETTE.hatBand);
    p(9, hy + 1, PALETTE.hatBandBuckle);

    // Tilted Fedora Crown
    rect(8, hy - 4, 8, 5, PALETTE.hat);
    rect(9, hy - 4, 6, 1, PALETTE.hatLight);
    p(11, hy - 4, PALETTE.hatShadow);
    rect(7, hy - 5, 8, 1, PALETTE.outline);
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
    rect(14, ty - 1, 4, 3, PALETTE.coatLight);   // Popped lapel
    rect(7, ty + 4, 3, 6, PALETTE.coatShadow);  // Trailing coat tail

    // Ascot glimpse
    rect(16, ty + 1, 2, 2, PALETTE.ascot);

    // Belt at hip
    rect(9, ty + 7, 8, 1, PALETTE.leather);
    p(15, ty + 7, PALETTE.gold);

    // Arm swing
    const armX = (frame === 1) ? 12 : (frame === 3) ? 6 : 9;
    rect(armX, ty + 1, 3, 6, PALETTE.coat);
    rect(armX, ty + 6, 3, 3, PALETTE.leather); // Glove

    // Head profile
    rect(8, hy + 4, 9, 6, PALETTE.skin);
    rect(16, hy + 5, 3, 3, PALETTE.skin);      // Nose profile
    p(16, hy + 5, PALETTE.eyeIris);            // Eye
    p(15, hy + 5, '#ffffff');

    // Hair below hat
    rect(8, hy + 4, 7, 4, PALETTE.hair);

    // ─── FEDORA PROFILE (Tilted Noir Brim - Right) ───
    p(20, hy + 3, PALETTE.outline);
    rect(16, hy + 3, 4, 1, PALETTE.hat);       // Dipping front
    rect(9, hy + 2, 7, 1, PALETTE.hatLight);   // Mid brim
    rect(6, hy + 1, 3, 1, PALETTE.hat);        // Upturned rear brim
    rect(9, hy + 4, 11, 1, PALETTE.hatShadow); // Under-brim shadow

    // Crimson Band
    rect(8, hy + 1, 8, 1, PALETTE.hatBand);

    // Tilted Fedora Crown
    rect(8, hy - 4, 8, 5, PALETTE.hat);
    rect(9, hy - 4, 6, 1, PALETTE.hatLight);
    p(12, hy - 4, PALETTE.hatShadow);
    rect(9, hy - 5, 8, 1, PALETTE.outline);
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

// Also copy to brain artifacts for preview
const brainArtifactPath = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\d4e44c62-e41b-4c33-8990-ff5b9e5da6ee\\ren_unique_detective.png';
try {
  fs.writeFileSync(brainArtifactPath, pngBuffer);
  console.log('Saved preview artifact to:', brainArtifactPath);
} catch (e) {
  console.warn('Could not write preview artifact:', e.message);
}

const base64Png = pngBuffer.toString('base64');
const rawRgbaBase64 = sheetRgba.toString('base64');

const tsExport = `// Unique 16-bit RPG Clockwork Detective Ren Sprite Sheet (Detective Costume)
export const REN_PNG_BASE64 = '${base64Png}';
export const REN_RAW_RGBA_BASE64 = '${rawRgbaBase64}';
export const REN_FRAME_WIDTH = ${FW};
export const REN_FRAME_HEIGHT = ${FH};
export const REN_SHEET_WIDTH = ${sheetW};
export const REN_SHEET_HEIGHT = ${sheetH};
`;

fs.writeFileSync(path.join(__dirname, '../src/rendering/RenSpriteData.ts'), tsExport);
console.log('Successfully generated Unique Detective Ren sprite sheet and RenSpriteData.ts');
