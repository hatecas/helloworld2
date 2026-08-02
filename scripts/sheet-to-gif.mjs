/**
 * 스프라이트 시트(PNG) → 미니미 애니메이션 GIF
 *
 * 도트 스프라이트는 배포처가 거의 다 '시트' 형태라 그대로는 미니미로 못 쓴다.
 * 프레임을 잘라서 기존 미니미 규격(320x240 캔버스 · 바닥 정렬)에 얹고
 * 애니메이션 GIF 로 묶는다. 외부 라이브러리 없이 GIF89a 를 직접 쓴다.
 *
 * 한 장만 뽑을 때는 이 파일을 직접 부르고,
 * 시트 여러 장을 한꺼번에 뽑을 때는 scripts/build-minimi-pack.mjs 가 이걸 가져다 쓴다.
 *
 *   npm run minimi:gif -- public/resources/images/minimi/_sheets/Greymon.png \
 *     --out greymonIcon --frames 0,1
 *
 * 옵션
 *   --out <이름>      public/resources/images/minimi/<이름>.gif 로 저장 (필수)
 *   --grid WxH        프레임 한 칸 크기. 기본 16x16
 *   --frames a,b,c    쓸 프레임 번호. 왼쪽 위부터 0. 기본 0,1
 *   --delay <1/100초> 프레임당 지속. 기본 25 (0.25초)
 *   --flip            좌우 반전. 광장 미니미는 '왼쪽' 을 보는 게 원본 기준이라,
 *                     시트가 오른쪽을 볼 때만 붙인다
 *   --scale <배수>    정수배 확대. 기본 auto (몸통이 TARGET_H 에 맞게)
 *   --dry             저장하지 않고 분석만
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readPng } from './avatar-rig.mjs';

/** 기존 미니미 GIF 73개 실측값 — 전부 이 캔버스에 바닥을 붙여 놓았다 */
export const CANVAS = { w: 320, h: 240 };
/** 캐릭터 높이. 실측 중앙값이 대략 200 이라 정수배로 떨어지는 192 를 쓴다 */
export const TARGET_H = 192;
export const OUT_DIR = 'public/resources/images/minimi';

/* ------------------------------------------------------------------ 시트 자르기 */

/** 시트를 읽고 프레임 격자를 확인한다 */
export function loadSheet(file, cellW = 16, cellH = 16) {
  const png = readPng(file);
  if (!png.alpha) throw new Error(`${file}: 읽기 실패 (${png.note})`);
  if (png.width % cellW || png.height % cellH) {
    throw new Error(`${file}: 시트 ${png.width}x${png.height} 가 격자 ${cellW}x${cellH} 로 나누어떨어지지 않는다`);
  }
  const cols = png.width / cellW;
  const rows = png.height / cellH;
  return { png, cellW, cellH, cols, rows, total: cols * rows };
}

/** 프레임 번호 → 16x16 RGBA 한 칸 */
function cellOf(sheet, n, flip) {
  const { png, cellW, cellH, cols } = sheet;
  const { width: SW, alpha: SRC } = png;
  const cx = (n % cols) * cellW;
  const cy = ((n / cols) | 0) * cellH;
  const out = Buffer.alloc(cellW * cellH * 4);
  for (let y = 0; y < cellH; y++) {
    for (let x = 0; x < cellW; x++) {
      const sx = flip ? cellW - 1 - x : x;
      const s = ((cy + y) * SW + cx + sx) * 4;
      const d = (y * cellW + x) * 4;
      out[d] = SRC[s]; out[d + 1] = SRC[s + 1]; out[d + 2] = SRC[s + 2]; out[d + 3] = SRC[s + 3];
    }
  }
  return out;
}

/** 한 칸을 캔버스 가운데·바닥에 정수배로 확대해 얹는다 */
function compose(sheet, cell, scale) {
  const { cellW, cellH } = sheet;
  const drawW = cellW * scale;
  const drawH = cellH * scale;
  const offX = ((CANVAS.w - drawW) / 2) | 0;
  const offY = CANVAS.h - drawH;
  const out = Buffer.alloc(CANVAS.w * CANVAS.h * 4); // 전부 투명
  for (let y = 0; y < drawH; y++) {
    for (let x = 0; x < drawW; x++) {
      const s = (((y / scale) | 0) * cellW + ((x / scale) | 0)) * 4;
      const d = ((offY + y) * CANVAS.w + offX + x) * 4;
      out[d] = cell[s]; out[d + 1] = cell[s + 1]; out[d + 2] = cell[s + 2]; out[d + 3] = cell[s + 3];
    }
  }
  return out;
}

/* ------------------------------------------------------------------ GIF89a */

/**
 * GIF 가변 길이 LZW.
 * 코드 길이를 늘리는 시점이 디코더와 어긋나면 그림 전체가 깨지므로 순서가 중요하다.
 */
function lzwEncode(pixels, minCodeSize) {
  const clear = 1 << minCodeSize;
  const eoi = clear + 1;
  let codeSize = minCodeSize + 1;
  let next = eoi + 1;
  let table = new Map();

  const out = [];
  let acc = 0;
  let accBits = 0;
  const emit = (code) => {
    acc |= code << accBits;
    accBits += codeSize;
    while (accBits >= 8) { out.push(acc & 0xff); acc >>= 8; accBits -= 8; }
  };

  emit(clear);
  let prefix = pixels[0];
  for (let i = 1; i < pixels.length; i++) {
    const k = pixels[i];
    const key = prefix * 256 + k;
    const found = table.get(key);
    if (found !== undefined) { prefix = found; continue; }
    emit(prefix);
    if (next === 4096) {
      emit(clear); // 반드시 늘어난 코드 길이 그대로 내보낸 뒤에 초기화한다
      table = new Map();
      next = eoi + 1;
      codeSize = minCodeSize + 1;
    } else {
      if (next >= 1 << codeSize) codeSize++;
      table.set(key, next++);
    }
    prefix = k;
  }
  emit(prefix);
  emit(eoi);
  if (accBits > 0) out.push(acc & 0xff);
  return Buffer.from(out);
}

/** 255 바이트짜리 서브블록으로 쪼개고 0 으로 끝낸다 */
function subBlocks(buf) {
  const parts = [];
  for (let i = 0; i < buf.length; i += 255) {
    const chunk = buf.subarray(i, i + 255);
    parts.push(Buffer.from([chunk.length]), chunk);
  }
  parts.push(Buffer.from([0]));
  return Buffer.concat(parts);
}

/** 여러 장의 RGBA 를 팔레트로 모은다. 0번은 투명으로 예약. */
function quantize(frames) {
  const seen = new Map();
  const palette = [[0, 0, 0]];
  const indexed = frames.map((rgba) => {
    const idx = Buffer.alloc(CANVAS.w * CANVAS.h);
    for (let i = 0, p = 0; p < idx.length; i += 4, p++) {
      if (rgba[i + 3] < 128) { idx[p] = 0; continue; }
      const key = (rgba[i] << 16) | (rgba[i + 1] << 8) | rgba[i + 2];
      let at = seen.get(key);
      if (at === undefined) {
        at = palette.length;
        if (at > 255) throw new Error('색이 256개를 넘는다 — 도트 시트가 맞는지 확인');
        palette.push([rgba[i], rgba[i + 1], rgba[i + 2]]);
        seen.set(key, at);
      }
      idx[p] = at;
    }
    return idx;
  });
  return { palette, indexed };
}

function encodeGif(indexed, palette, delayCs) {
  const bits = Math.max(2, Math.ceil(Math.log2(Math.max(2, palette.length))));
  const parts = [];

  const header = Buffer.alloc(13);
  header.write('GIF89a', 0, 'ascii');
  header.writeUInt16LE(CANVAS.w, 6);
  header.writeUInt16LE(CANVAS.h, 8);
  header[10] = 0x80 | ((bits - 1) << 4) | (bits - 1); // 전역 팔레트 있음
  header[11] = 0; // 배경 = 투명
  header[12] = 0;
  parts.push(header);

  const gct = Buffer.alloc((1 << bits) * 3);
  palette.forEach((c, i) => { gct[i * 3] = c[0]; gct[i * 3 + 1] = c[1]; gct[i * 3 + 2] = c[2]; });
  parts.push(gct);

  // 무한 반복
  parts.push(Buffer.concat([
    Buffer.from([0x21, 0xff, 0x0b]),
    Buffer.from('NETSCAPE2.0', 'ascii'),
    Buffer.from([0x03, 0x01, 0x00, 0x00, 0x00]),
  ]));

  for (const idx of indexed) {
    const gce = Buffer.alloc(8);
    gce[0] = 0x21; gce[1] = 0xf9; gce[2] = 0x04;
    gce[3] = (2 << 2) | 1; // 폐기 방법 2(배경으로 되돌림) + 투명색 사용
    gce.writeUInt16LE(delayCs, 4);
    gce[6] = 0; // 투명 색 번호
    gce[7] = 0;
    parts.push(gce);

    const desc = Buffer.alloc(10);
    desc[0] = 0x2c;
    desc.writeUInt16LE(0, 1); desc.writeUInt16LE(0, 3);
    desc.writeUInt16LE(CANVAS.w, 5); desc.writeUInt16LE(CANVAS.h, 7);
    desc[9] = 0;
    parts.push(desc);

    parts.push(Buffer.from([bits]));
    parts.push(subBlocks(lzwEncode(idx, bits)));
  }

  parts.push(Buffer.from([0x3b]));
  return Buffer.concat(parts);
}

/* ------------------------------------------------------------------ 바깥에서 쓰는 것 */

/**
 * 시트에서 프레임을 골라 미니미 GIF 한 장을 만든다.
 * @returns {{ gif: Buffer, scale: number, colors: number }}
 */
export function sheetToGif(sheet, { frames, delay = 25, flip = false, scale = 'auto' }) {
  for (const n of frames) {
    if (n < 0 || n >= sheet.total) throw new Error(`프레임 ${n} 은 범위 밖 (0~${sheet.total - 1})`);
  }
  const s = scale === 'auto' ? Math.max(1, Math.floor(TARGET_H / sheet.cellH)) : Number(scale);
  const composed = frames.map((n) => compose(sheet, cellOf(sheet, n, flip), s));
  const { palette, indexed } = quantize(composed);
  return { gif: encodeGif(indexed, palette, delay), scale: s, colors: palette.length };
}

/** 위와 같되 파일까지 쓴다 */
export function writeMinimiGif(sheetFile, outName, opts = {}) {
  const sheet = loadSheet(sheetFile, opts.cellW ?? 16, opts.cellH ?? 16);
  const { gif, scale, colors } = sheetToGif(sheet, opts);
  const outPath = path.join(OUT_DIR, `${outName}.gif`);
  if (!opts.dry) fs.writeFileSync(outPath, gif);
  return { outPath, bytes: gif.length, scale, colors, total: sheet.total };
}

/* ------------------------------------------------------------------ CLI */

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  const argv = process.argv.slice(2);
  const VALUED = new Set(['out', 'grid', 'frames', 'delay', 'scale']);

  const opts = new Map();
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { rest.push(a); continue; }
    const name = a.slice(2);
    if (VALUED.has(name)) opts.set(name, argv[++i]);
    else opts.set(name, true);
  }
  const flag = (name, fallback) => opts.get(name) ?? fallback;

  const input = rest[0];
  const outName = flag('out', null);
  if (!input || !outName) {
    console.error('사용법: node scripts/sheet-to-gif.mjs <시트.png> --out <이름> [--frames 0,1] [--flip]');
    process.exit(1);
  }

  const [cellW, cellH] = String(flag('grid', '16x16')).split('x').map(Number);
  const r = writeMinimiGif(input, outName, {
    cellW,
    cellH,
    frames: String(flag('frames', '0,1')).split(',').map((s) => Number(s.trim())),
    delay: Number(flag('delay', '25')),
    flip: opts.get('flip') === true,
    scale: flag('scale', 'auto'),
    dry: opts.get('dry') === true,
  });
  console.log(`${input} — 프레임 ${r.total}장 중 선택, ${r.scale}배 확대, 색 ${r.colors}개`);
  console.log(`${opts.get('dry') ? '(--dry) ' : '저장: '}${r.outPath} — ${r.bytes}B`);
}
