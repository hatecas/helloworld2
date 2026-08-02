/**
 * base 의 머리 크기를 조정해 등신을 맞춘다.
 *
 *   node scripts/resize-avatar-head.mjs ref2.png 2.5
 *   node scripts/resize-avatar-head.mjs ref2.png 2.5 --out public/resources/images/avatar/base/base.png
 *
 * 생성 AI 는 "2.5등신" 같은 지시를 잘 못 듣는다. 몇 번을 다시 뽑느니
 * 잘 나온 그림의 머리만 줄여서 원하는 비율로 맞추는 게 빠르고 확실하다.
 *
 * 목 위치(가장 좁은 곳)를 찾아 머리를 잘라내고, 턱 끝을 고정한 채
 * 최근접 이웃으로 축소해 다시 붙인다. 몸은 손대지 않는다.
 */
import fs from 'node:fs';

import { bounds, readPng, writePng } from './avatar-rig.mjs';

const [, , inFile, headsArg, ...rest] = process.argv;
if (!inFile || !headsArg) {
  console.error('사용법: node scripts/resize-avatar-head.mjs <파일> <등신> [--out <저장경로>]');
  console.error('예:     node scripts/resize-avatar-head.mjs ref2.png 2.5');
  process.exit(1);
}
const heads = Number(headsArg);
if (!Number.isFinite(heads) || heads < 1.2 || heads > 8) {
  console.error('등신은 1.2 ~ 8 사이 숫자로 주세요.');
  process.exit(1);
}
const outIdx = rest.indexOf('--out');
const outFile = outIdx >= 0 ? rest[outIdx + 1] : inFile.replace(/\.png$/i, `.${heads}head.png`);

const png = readPng(inFile);
if (!png.alpha) {
  console.error(png.note);
  process.exit(1);
}
const { width: w, height: h, alpha: src } = png;
const b = bounds(png, 40);

const rowAt = (y) => {
  let a = -1;
  let z = -1;
  for (let x = 0; x < w; x++) {
    if (src[(y * w + x) * 4 + 3] > 128) {
      if (a < 0) a = x;
      z = x;
    }
  }
  return a < 0 ? null : { a, z, wid: z - a + 1 };
};

// 목 = 캐릭터 위쪽 절반에서 가장 좁아지는 곳
let neck = -1;
let neckW = Infinity;
for (
  let y = b.minY + Math.round((b.maxY - b.minY) * 0.3);
  y < b.minY + Math.round((b.maxY - b.minY) * 0.75);
  y++
) {
  const r = rowAt(y);
  if (r && r.wid < neckW) {
    neckW = r.wid;
    neck = y;
  }
}

const headH = neck - b.minY;
const bodyH = b.maxY - neck;
// 원하는 등신 N 에서: 전체 = N × 머리, 전체 = 머리 + 몸  →  머리 = 몸 / (N - 1)
const wantHead = Math.round(bodyH / (heads - 1));
const scale = wantHead / headH;

console.log(`${inFile}`);
console.log(`  지금  머리 ${headH}px + 몸 ${bodyH}px = ${headH + bodyH}px  →  ${((headH + bodyH) / headH).toFixed(2)}등신`);
console.log(`  목표  머리 ${wantHead}px + 몸 ${bodyH}px = ${wantHead + bodyH}px  →  ${heads}등신`);
console.log(`  머리 배율 ${(scale * 100).toFixed(0)}%`);

if (scale >= 1) {
  console.error('\n머리를 키우는 방향입니다. 지금은 줄이는 것만 지원합니다.');
  process.exit(1);
}

// 몸만 남긴다 (목 아래)
const out = Buffer.alloc(w * h * 4);
for (let y = neck; y <= b.maxY; y++) {
  for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (src[i + 3] === 0) continue;
    out.set(src.subarray(i, i + 4), i);
  }
}

// 머리를 축소해 턱 끝(neck)에 맞춰 다시 붙인다
const headCx = Math.round((b.minX + b.maxX) / 2);
const srcHeadW = b.maxX - b.minX + 1;
const dstHeadW = Math.max(1, Math.round(srcHeadW * scale));
const dstHeadH = Math.max(1, Math.round(headH * scale));
const dstX0 = headCx - Math.round(dstHeadW / 2);
const dstY0 = neck - dstHeadH;

for (let y = 0; y < dstHeadH; y++) {
  const sy = b.minY + Math.floor((y / dstHeadH) * headH);
  for (let x = 0; x < dstHeadW; x++) {
    const sx = b.minX + Math.floor((x / dstHeadW) * srcHeadW);
    const si = (sy * w + sx) * 4;
    if (src[si + 3] < 40) continue;
    const px = dstX0 + x;
    const py = dstY0 + y;
    if (px < 0 || py < 0 || px >= w || py >= h) continue;
    const di = (py * w + px) * 4;
    out[di] = src[si];
    out[di + 1] = src[si + 1];
    out[di + 2] = src[si + 2];
    out[di + 3] = 255;
  }
}

fs.mkdirSync(outFile.replace(/[\\/][^\\/]+$/, ''), { recursive: true });
writePng(outFile, w, h, out);
console.log(`\n저장: ${outFile}`);
