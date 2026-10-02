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

// 1. Read input PNG
const srcPath = 'C:/Users/Lenovo/.gemini/antigravity/brain/d4e44c62-e41b-4c33-8990-ff5b9e5da6ee/.user_uploaded/media_1790909864460.png';
const buf = fs.readFileSync(srcPath);

let pos = 8;
const idatChunks = [];
while (pos < buf.length) {
  const len = buf.readUInt32BE(pos);
  const type = buf.toString('ascii', pos + 4, pos + 8);
  if (type === 'IDAT') idatChunks.push(buf.slice(pos + 8, pos + 8 + len));
  pos += 12 + len;
}
const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
const srcW = 447, srcH = 447;
const srcStride = srcW * 4 + 1;
const raw = Buffer.alloc(srcW * srcH * 4);
for (let y = 0; y < srcH; y++) {
  const filterType = decompressed[y * srcStride];
  for (let x = 0; x < srcW * 4; x++) {
    const rawIdx = y * srcW * 4 + x;
    const filtIdx = y * srcStride + 1 + x;
    const xVal = decompressed[filtIdx];
    const a = x >= 4 ? raw[rawIdx - 4] : 0;
    const b = y > 0 ? raw[(y - 1) * srcW * 4 + x] : 0;
    const c = (x >= 4 && y > 0) ? raw[(y - 1) * srcW * 4 + x - 4] : 0;
    let recon = 0;
    if (filterType === 0) recon = xVal;
    else if (filterType === 1) recon = (xVal + a) & 0xff;
    else if (filterType === 2) recon = (xVal + b) & 0xff;
    else if (filterType === 3) recon = (xVal + Math.floor((a + b) / 2)) & 0xff;
    else if (filterType === 4) {
      const p = a + b - c;
      const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      let pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      recon = (xVal + pr) & 0xff;
    }
    raw[rawIdx] = recon;
  }
}

// 2. Define the exact bounding regions for the 4 directions
// Reference image mapping:
// - Top-left: Front (dir 0: down)
// - Bottom-left: Back (dir 1: up)
// - Bottom-right: Left (dir 2: left)
// - Top-right: Right (dir 3: right)
const dirBounds = [
  { dir: 'down',  x0: 61,  x1: 163, y0: 30,  y1: 193 }, // Front
  { dir: 'up',    x0: 60,  x1: 162, y0: 252, y1: 416 }, // Back
  { dir: 'left',  x0: 293, x1: 381, y0: 253, y1: 416 }, // Left
  { dir: 'right', x0: 293, x1: 384, y0: 30,  y1: 193 }  // Right
];

// Target frame size: 24 wide x 34 tall
const FW = 24;
const FH = 34;

function extractBaseFrame(box) {
  const frameRgba = Buffer.alloc(FW * FH * 4);
  const boxW = box.x1 - box.x0;
  const boxH = box.y1 - box.y0;

  const charH = 33;
  const charW = Math.round(boxW * (charH / boxH));
  const offsetX = Math.floor((FW - charW) / 2);
  const offsetY = 1;

  for (let fy = 0; fy < charH; fy++) {
    for (let fx = 0; fx < charW; fx++) {
      const sx = box.x0 + (fx + 0.5) * (boxW / charW);
      const sy = box.y0 + (fy + 0.5) * (boxH / charH);

      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const px = Math.min(srcW - 1, Math.max(0, Math.round(sx + dx)));
          const py = Math.min(srcH - 1, Math.max(0, Math.round(cy = sy + dy)));
          const idx = (py * srcW + px) * 4;
          rSum += raw[idx]; gSum += raw[idx+1]; bSum += raw[idx+2];
          count++;
        }
      }
      const r = Math.round(rSum / count);
      const g = Math.round(gSum / count);
      const b = Math.round(bSum / count);

      const isBg = Math.abs(r - 191) < 20 && Math.abs(g - 191) < 20 && Math.abs(b - 191) < 20;
      if (!isBg) {
        const outX = offsetX + fx;
        const outY = offsetY + fy;
        if (outX >= 0 && outX < FW && outY >= 0 && outY < FH) {
          const oIdx = (outY * FW + outX) * 4;
          frameRgba[oIdx] = r;
          frameRgba[oIdx + 1] = g;
          frameRgba[oIdx + 2] = b;
          frameRgba[oIdx + 3] = 255;
        }
      }
    }
  }

  return frameRgba;
}

function generateWalkFrames(baseFrame, dir) {
  const frames = [
    Buffer.from(baseFrame),
    Buffer.alloc(FW * FH * 4),
    Buffer.from(baseFrame),
    Buffer.alloc(FW * FH * 4)
  ];

  for (let y = 0; y < FH; y++) {
    for (let x = 0; x < FW; x++) {
      const srcIdx = (y * FW + x) * 4;
      if (baseFrame[srcIdx + 3] === 0) continue;

      if (dir === 'down' || dir === 'up') {
        const bob = (y < 23) ? 1 : 0;
        let legShiftX1 = 0, legShiftY1 = 0;
        if (y >= 23) {
          if (x < 12) { legShiftY1 = -1; legShiftX1 = -1; }
          else { legShiftY1 = 1; legShiftX1 = 0; }
        }
        const ny1 = Math.min(FH - 1, Math.max(0, y + bob + legShiftY1));
        const nx1 = Math.min(FW - 1, Math.max(0, x + legShiftX1));
        const outIdx1 = (ny1 * FW + nx1) * 4;
        frames[1][outIdx1] = baseFrame[srcIdx];
        frames[1][outIdx1+1] = baseFrame[srcIdx+1];
        frames[1][outIdx1+2] = baseFrame[srcIdx+2];
        frames[1][outIdx1+3] = 255;

        let legShiftX3 = 0, legShiftY3 = 0;
        if (y >= 23) {
          if (x >= 12) { legShiftY3 = -1; legShiftX3 = 1; }
          else { legShiftY3 = 1; legShiftX3 = 0; }
        }
        const ny3 = Math.min(FH - 1, Math.max(0, y + bob + legShiftY3));
        const nx3 = Math.min(FW - 1, Math.max(0, x + legShiftX3));
        const outIdx3 = (ny3 * FW + nx3) * 4;
        frames[3][outIdx3] = baseFrame[srcIdx];
        frames[3][outIdx3+1] = baseFrame[srcIdx+1];
        frames[3][outIdx3+2] = baseFrame[srcIdx+2];
        frames[3][outIdx3+3] = 255;
      } else {
        const bob = (y < 23) ? 1 : 0;
        let footShift = (dir === 'right') ? 1 : -1;
        const ny1 = Math.min(FH - 1, Math.max(0, y + bob));
        const nx1 = Math.min(FW - 1, Math.max(0, x + (y >= 24 ? footShift : 0)));
        const outIdx1 = (ny1 * FW + nx1) * 4;
        frames[1][outIdx1] = baseFrame[srcIdx];
        frames[1][outIdx1+1] = baseFrame[srcIdx+1];
        frames[1][outIdx1+2] = baseFrame[srcIdx+2];
        frames[1][outIdx1+3] = 255;

        const ny3 = Math.min(FH - 1, Math.max(0, y + bob));
        const nx3 = Math.min(FW - 1, Math.max(0, x - (y >= 24 ? footShift : 0)));
        const outIdx3 = (ny3 * FW + nx3) * 4;
        frames[3][outIdx3] = baseFrame[srcIdx];
        frames[3][outIdx3+1] = baseFrame[srcIdx+1];
        frames[3][outIdx3+2] = baseFrame[srcIdx+2];
        frames[3][outIdx3+3] = 255;
      }
    }
  }

  return frames;
}

const sheetW = FW * 4;
const sheetH = FH * 4;
const sheetRgba = Buffer.alloc(sheetW * sheetH * 4);

dirBounds.forEach((box, dirIdx) => {
  const baseFrame = extractBaseFrame(box);
  const frames = generateWalkFrames(baseFrame, box.dir);

  frames.forEach((fBuf, fIdx) => {
    const startX = fIdx * FW;
    const startY = dirIdx * FH;
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
  });
});

const outPath = path.join(__dirname, '../public/assets/characters/ren.png');
const pngBuffer = writePNG(sheetW, sheetH, sheetRgba, outPath);

const base64Png = pngBuffer.toString('base64');
const rawRgbaBase64 = sheetRgba.toString('base64');

const tsExport = `// Auto-generated 16-bit RPG Ren sprite sheet from reference
export const REN_PNG_BASE64 = '${base64Png}';
export const REN_RAW_RGBA_BASE64 = '${rawRgbaBase64}';
export const REN_FRAME_WIDTH = ${FW};
export const REN_FRAME_HEIGHT = ${FH};
export const REN_SHEET_WIDTH = ${sheetW};
export const REN_SHEET_HEIGHT = ${sheetH};
`;

fs.writeFileSync(path.join(__dirname, '../src/rendering/RenSpriteData.ts'), tsExport);
console.log('Successfully generated RenSpriteData.ts with Raw RGBA and PNG base64');
