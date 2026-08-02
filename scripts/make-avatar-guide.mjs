/**
 * 파트 작업용 가이드 이미지 생성.
 *
 *   node scripts/make-avatar-guide.mjs
 *
 * base.png 위에 기준선(머리끝·눈라인·목·어깨·허리·발바닥)을 얹은 _guide.png 를 만든다.
 * 그림 도구에서 이 파일을 맨 아래 레이어로 깔고 그 위에 파트를 그리면
 * 위치가 저절로 맞는다. 눈대중으로 맞추면 반드시 어긋난다.
 *
 * 외부 라이브러리 없이 PNG 를 직접 읽고 쓴다(zlib 은 Node 기본 제공).
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

import { CANVAS, RIG_LINES, readPng } from './avatar-rig.mjs';

const BASE = 'public/resources/images/avatar/base/base.png';
const OUT = 'public/resources/images/avatar/_guide.png';

/* ----------------------------- PNG 쓰기 ----------------------------- */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function writePng(file, width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // 필터 없음
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  fs.writeFileSync(
    file,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  );
}

/* ------------------------------ 그리기 ------------------------------ */

if (!fs.existsSync(BASE)) {
  console.error(`${BASE} 가 없습니다. base 를 먼저 만들어 주세요.`);
  process.exit(1);
}

const png = readPng(BASE);
if (png.width !== CANVAS.w || png.height !== CANVAS.h) {
  console.error(`base 캔버스가 ${png.width}x${png.height} 입니다. ${CANVAS.w}x${CANVAS.h} 여야 합니다.`);
  process.exit(1);
}

const out = Buffer.from(png.alpha); // 원본 복사

function blend(x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= CANVAS.w || y >= CANVAS.h) return;
  const i = (y * CANVAS.w + x) * 4;
  const sa = a / 255;
  const da = out[i + 3] / 255;
  const oa = sa + da * (1 - sa);
  if (oa === 0) return;
  out[i] = Math.round((r * sa + out[i] * da * (1 - sa)) / oa);
  out[i + 1] = Math.round((g * sa + out[i + 1] * da * (1 - sa)) / oa);
  out[i + 2] = Math.round((b * sa + out[i + 2] * da * (1 - sa)) / oa);
  out[i + 3] = Math.round(oa * 255);
}

/** 가로 점선 */
function hLine(y, [r, g, b], dash = 12) {
  for (let x = 0; x < CANVAS.w; x++) {
    if (Math.floor(x / dash) % 2 === 0) {
      blend(x, y, r, g, b, 210);
      blend(x, y + 1, r, g, b, 150);
    }
  }
}

/** 세로 중심선 */
function vLine(x, [r, g, b], dash = 12) {
  for (let y = 0; y < CANVAS.h; y++) {
    if (Math.floor(y / dash) % 2 === 0) {
      blend(x, y, r, g, b, 210);
      blend(x + 1, y, r, g, b, 150);
    }
  }
}

const RED = [220, 60, 60];
const BLUE = [50, 110, 220];

const lines = Object.entries(RIG_LINES).map(([key, v]) => ({ key, y: v.y, label: v.label }));

vLine(CANVAS.w / 2 - 1, BLUE);
for (const line of lines) {
  // 눈 라인만 빨강 (가장 많이 쓰는 기준이라 눈에 띄게)
  hLine(line.y, line.key.startsWith('eye') ? RED : BLUE);
}

writePng(OUT, CANVAS.w, CANVAS.h, out);

console.log(`가이드 생성: ${OUT}`);
console.log('');
console.log('기준선 (y 좌표)');
for (const l of lines) console.log(`  ${String(l.y).padStart(5)}  ${l.label}`);
console.log('');
console.log(`좌우 중심 x = ${CANVAS.w / 2}`);
console.log('');
console.log('사용법: 그림 도구에서 이 파일을 맨 아래 레이어로 깔고,');
console.log('        그 위 새 레이어에 파트를 그린 뒤 가이드 레이어만 끄고 export.');
console.log(`        캔버스는 반드시 ${CANVAS.w}x${CANVAS.h}, 배경 투명.`);
console.log('');
console.log('넣은 뒤 확인: npm run avatar:check');
