/**
 * 이미 애니메이션 GIF 로 배포되는 도트 스프라이트 → 미니미 규격 GIF
 *
 * 시트(PNG)가 아니라 GIF 로 받은 것들(마리오·요시·피카츄 …)을 붙일 때 쓴다.
 * 받은 그대로는 못 쓴다 — 캔버스 크기가 제각각이고(48x44 부터 500x696 까지),
 * 기존 미니미는 전부 320x240 캔버스에 바닥을 붙여 놓았기 때문이다.
 *
 *   npm run minimi:from-gif -- public/.../mario.gif --out marioIcon
 *
 * 하는 일
 *   1. 원본 픽셀 배율을 찾는다. 도트 그림을 4배로 키워 배포한 것들이 많은데,
 *      그걸 모르고 다시 줄이면 픽셀이 뭉개진다. 정수배로 딱 떨어지는지 검사해서 되돌린다.
 *   2. 여백을 걷어내고 캐릭터만 남긴다.
 *   3. 정수배로 키워 캔버스 가운데·바닥에 얹는다 (기존 미니미와 같은 자리).
 *   4. 원본 프레임 지속을 그대로 살려 다시 묶는다.
 *
 * 옵션
 *   --out <이름>   public/resources/images/minimi/<이름>.gif (필수)
 *   --bg [허용오차] 배경 제거. 투명 정보 없이 흰 배경째로 구워진 GIF 에 쓴다.
 *                  가장자리에서 번져 나가므로 눈·장갑 같은 안쪽 흰색은 남는다. 기본 오차 24
 *   --max <n>      쓸 프레임 수 상한. 넘으면 고르게 솎아낸다. 기본 24
 *   --delay <n>    프레임 지속을 이 값으로 덮어쓴다(1/100초). 원본이 0 일 때 필요
 *   --flip         좌우 반전 (광장 기준은 '왼쪽 보기')
 *   --height <n>   캐릭터 높이 목표. 기본 192
 *   --dry          저장하지 않고 분석만
 */
import fs from 'node:fs';
import path from 'node:path';

import { readGif, opaqueBounds, writeGif } from './gif.mjs';

const CANVAS = { w: 320, h: 240 };
const TARGET_H = 192;
const OUT_DIR = 'public/resources/images/minimi';

/* ------------------------------------------------------------------ 원본 배율 찾기 */

/**
 * 원본 도트 한 칸이 몇 px 인지 잰다.
 *
 * 처음엔 'sxs 칸이 전부 같은 색이면 s배 확대' 로 봤는데 거의 안 걸렸다. 도트 그림을
 * 500px 같은 어중간한 크기로 늘려 올린 게 많아서 블록 폭이 7px·8px 로 들쭉날쭉하다.
 * 다음엔 픽셀이 바뀌는 자리(격자 좌표)를 그대로 쓰려 했는데, 걷기 애니메이션처럼
 * 프레임마다 내용이 다르면 프레임끼리 격자가 어긋나 흔들렸다.
 *
 * 그래서 좌표가 아니라 **배율 하나만** 구한다. 앞 열과 똑같은 열이 몇 개씩 이어지는지
 * 세어 가장 흔한 길이를 그 프레임의 배율로 보고, 프레임들의 중앙값을 쓴다.
 * 정수배가 아니어도(7.8배 같은) 소수로 그대로 들고 간다.
 *
 * @returns {number} 1 이면 확대되지 않은 원본 크기
 */
export function pixelScale(rgba, w, box) {
  const sameCol = (x1, x2) => {
    for (let y = 0; y < box.h; y++) {
      const a = ((box.y + y) * w + x1) * 4;
      const b = ((box.y + y) * w + x2) * 4;
      for (let c = 0; c < 4; c++) if (rgba[a + c] !== rgba[b + c]) return false;
    }
    return true;
  };
  const sameRow = (y1, y2) => {
    for (let x = 0; x < box.w; x++) {
      const a = (y1 * w + box.x + x) * 4;
      const b = (y2 * w + box.x + x) * 4;
      for (let c = 0; c < 4; c++) if (rgba[a + c] !== rgba[b + c]) return false;
    }
    return true;
  };

  /**
   * 한 축의 배율을 추정한다.
   *
   * 최빈값을 '개수' 로 뽑으면 안 된다. 늘릴 때 블록 사이에 1px 짜리 전환 줄이 끼는
   * 그림이 있는데(mario 는 17,1,17,1 … 이었다), 그러면 1px 이 개수로 이겨 버린다.
   * 그림을 실제로 얼마나 덮고 있는지(길이 x 개수)로 가중하면 17 이 이긴다.
   */
  const axisScale = (n, same) => {
    const runs = [];
    let len = 1;
    for (let i = 1; i < n; i++) {
      if (same(i, i - 1)) len++;
      else { runs.push(len); len = 1; }
    }
    runs.push(len);
    if (runs.length < 3) return 1; // 표본이 너무 적으면 판단하지 않는다

    const covered = new Map();
    for (const r of runs) covered.set(r, (covered.get(r) ?? 0) + r);
    let mode = 1;
    let best = -1;
    for (const [r, px] of covered) if (px > best || (px === best && r < mode)) { mode = r; best = px; }
    if (mode < 2) return 1; // 원본 크기

    // 전환 줄을 뺀 '진짜 칸' 수로 나눠야 배율이 소수까지 맞는다 (17 이 아니라 17.86)
    const real = runs.filter((r) => r >= mode / 2).length;
    return real > 0 ? n / real : mode;
  };

  const sx = axisScale(box.w, (i, j) => sameCol(box.x + i, box.x + j));
  const sy = axisScale(box.h, (i, j) => sameRow(box.y + i, box.y + j));
  // 가로세로 중 하나만 크면 확대가 아니라 그림이 그런 것이다
  return Math.min(sx, sy) >= 2 ? (sx + sy) / 2 : 1;
}

/* ------------------------------------------------------------------ 배경 제거 */

/**
 * 가장자리에서 번져 나가며 배경색을 지운다.
 *
 * 투명 정보 없이 흰 배경째 구워진 GIF 가 있다(mario.gif). 색만 보고 다 지우면
 * 눈·장갑 같은 안쪽 흰색까지 날아가므로, 가장자리에 닿아 있는 덩어리만 지운다.
 * (avatar:bg 가 쓰는 방법과 같다)
 */
function stripBackground(rgba, w, h, tol) {
  // 테두리에서 가장 많이 나온 색을 배경으로 본다
  const tally = new Map();
  const add = (x, y) => {
    const o = (y * w + x) * 4;
    const k = (rgba[o] << 16) | (rgba[o + 1] << 8) | rgba[o + 2];
    tally.set(k, (tally.get(k) ?? 0) + 1);
  };
  for (let x = 0; x < w; x++) { add(x, 0); add(x, h - 1); }
  for (let y = 0; y < h; y++) { add(0, y); add(w - 1, y); }
  let bg = 0;
  let best = -1;
  for (const [k, n] of tally) if (n > best) { best = n; bg = k; }
  const br = (bg >> 16) & 255, bgc = (bg >> 8) & 255, bb = bg & 255;

  const near = (o) =>
    rgba[o + 3] >= 128 &&
    Math.abs(rgba[o] - br) <= tol &&
    Math.abs(rgba[o + 1] - bgc) <= tol &&
    Math.abs(rgba[o + 2] - bb) <= tol;

  const seen = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) { stack.push(x, 0, x, h - 1); }
  for (let y = 0; y < h; y++) { stack.push(0, y, w - 1, y); }

  let removed = 0;
  while (stack.length) {
    const y = stack.pop();
    const x = stack.pop();
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const p = y * w + x;
    if (seen[p]) continue;
    const o = p * 4;
    if (!near(o)) continue;
    seen[p] = 1;
    rgba[o + 3] = 0;
    removed++;
    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }
  return removed;
}

/* ------------------------------------------------------------------ 인자 */

const argv = process.argv.slice(2);
const VALUED = new Set(['out', 'max', 'delay', 'height']);
/** --bg 는 값을 줘도 되고 안 줘도 된다 (--bg / --bg 40) */
const OPTIONAL_VALUE = new Set(['bg']);
const opts = new Map();
const rest = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith('--')) { rest.push(a); continue; }
  const name = a.slice(2);
  if (VALUED.has(name)) opts.set(name, argv[++i]);
  else if (OPTIONAL_VALUE.has(name) && argv[i + 1] && !argv[i + 1].startsWith('--')) {
    opts.set(name, argv[++i]);
  } else opts.set(name, true);
}
const input = rest[0];
const outName = opts.get('out');
if (!input || !outName) {
  console.error('사용법: node scripts/gif-to-minimi.mjs <입력.gif> --out <이름> [--max 24] [--flip]');
  process.exit(1);
}

const maxFrames = Number(opts.get('max') ?? 24);
const forcedDelay = opts.has('delay') ? Number(opts.get('delay')) : null;
const targetH = Number(opts.get('height') ?? TARGET_H);
const flip = opts.get('flip') === true;
const dry = opts.get('dry') === true;

/* ------------------------------------------------------------------ 변환 */

const src = readGif(input);

/** 모든 프레임을 합친 경계 — 프레임마다 자르면 캐릭터가 덜덜 떨린다 */
function unionBounds() {
  let box = null;
  for (const fr of src.frames) {
    const b = opaqueBounds(fr.rgba, src.width, src.height);
    if (!b) continue;
    box = box
      ? {
          x: Math.min(box.x, b.x), y: Math.min(box.y, b.y),
          w: Math.max(box.x + box.w, b.x + b.w) - Math.min(box.x, b.x),
          h: Math.max(box.y + box.h, b.y + b.h) - Math.min(box.y, b.y),
        }
      : b;
  }
  if (!box) throw new Error(`${input}: 불투명한 픽셀이 없다`);
  return box;
}

/*
 * 배율은 배경을 지우기 '전' 에 잰다.
 *
 * 지운 뒤에 재면 마리오처럼 흰 배경째 구워진 그림에서 값이 틀린다. 배경을 지우면
 * 캐릭터 가장자리의 블록이 일부만 남아 반복 구조가 깨지기 때문이다.
 * 지우기 전에는 배경도 같은 배율로 늘어나 있어 구조가 온전하다.
 */
const scales = src.frames
  .map((fr) => pixelScale(fr.rgba, src.width, unionBounds()))
  .sort((a, b) => a - b);
const srcScale = scales[scales.length >> 1]; // 중앙값 — 프레임 하나가 튀어도 흔들리지 않는다

if (opts.has('bg')) {
  const tol = opts.get('bg') === true ? 24 : Number(opts.get('bg'));
  let total = 0;
  for (const fr of src.frames) total += stripBackground(fr.rgba, src.width, src.height, tol);
  const all = src.width * src.height * src.frames.length;
  console.log(`  배경 제거: ${total}px (${((total / all) * 100).toFixed(1)}%), 허용오차 ${tol}`);
}

const box = unionBounds();
const nativeW = Math.max(1, Math.round(box.w / srcScale));
const nativeH = Math.max(1, Math.round(box.h / srcScale));

/*
 * 세로는 targetH 에, 가로는 캔버스 안에 들어와야 한다.
 * 1배보다 크면 정수배로 (도트가 고르게 커진다), 원본이 너무 크면 어쩔 수 없이 줄인다.
 */
const fit = Math.min(targetH / nativeH, (CANVAS.w - 8) / nativeW);
const up = fit >= 1 ? Math.floor(fit) : fit;
const drawW = Math.round(nativeW * up);
const drawH = Math.round(nativeH * up);

// 프레임이 너무 많으면 고르게 솎아낸다 (원본이 100장 넘는 것도 있다)
let picked = src.frames;
let dropped = 0;
if (picked.length > maxFrames) {
  const step = picked.length / maxFrames;
  picked = Array.from({ length: maxFrames }, (_, i) => src.frames[Math.floor(i * step)]);
  dropped = src.frames.length - picked.length;
}

const offX = ((CANVAS.w - drawW) / 2) | 0;
const offY = CANVAS.h - drawH;

const out = picked.map((fr) => {
  const buf = Buffer.alloc(CANVAS.w * CANVAS.h * 4); // 전부 투명
  for (let y = 0; y < drawH && offY + y < CANVAS.h; y++) {
    for (let x = 0; x < drawW && offX + x < CANVAS.w; x++) {
      if (offX + x < 0) continue;
      // 캔버스 좌표 → 원본 도트 칸 → 원본 픽셀 좌표 (칸 가운데를 찍는다)
      const nx = Math.min(nativeW - 1, (x / up) | 0);
      const ny = Math.min(nativeH - 1, (y / up) | 0);
      const gx = flip ? nativeW - 1 - nx : nx;
      const sx = Math.min(box.x + box.w - 1, box.x + (((gx + 0.5) * srcScale) | 0));
      const sy = Math.min(box.y + box.h - 1, box.y + (((ny + 0.5) * srcScale) | 0));
      const s = (sy * src.width + sx) * 4;
      if (fr.rgba[s + 3] < 128) continue;
      const d = ((offY + y) * CANVAS.w + offX + x) * 4;
      buf[d] = fr.rgba[s]; buf[d + 1] = fr.rgba[s + 1];
      buf[d + 2] = fr.rgba[s + 2]; buf[d + 3] = 255;
    }
  }
  return buf;
});

// GIF 지속 0 은 '가능한 한 빨리' 라 브라우저마다 다르게 잡는다. 최소 2 로 올린다.
const delays = picked.map((fr) => forcedDelay ?? (fr.delay >= 2 ? fr.delay : 10));

const { gif, colors } = writeGif(CANVAS.w, CANVAS.h, out, delays);
const outPath = path.join(OUT_DIR, `${outName}.gif`);
if (!dry) fs.writeFileSync(outPath, gif);

console.log(
  `${path.basename(input).padEnd(22)} ${`${src.width}x${src.height}`.padEnd(9)} ${String(src.frames.length).padStart(3)}프레임` +
    ` → 실제 도트 ${`${nativeW}x${nativeH}`.padEnd(8)}${srcScale > 1 ? `(${srcScale.toFixed(1)}배로 늘려 놨던 것)` : '(원본 크기)'}` +
    ` → ${typeof up === 'number' && up >= 1 ? `${up}배` : `${up.toFixed(2)}배`} ${drawW}x${drawH} @(${offX},${offY})`,
);
console.log(
  `  ${dry ? '(--dry) ' : ''}${outPath} — ${picked.length}프레임` +
    `${dropped ? ` (${dropped}장 솎아냄)` : ''}, 색 ${colors}개, ${(gif.length / 1024).toFixed(1)}K`,
);
