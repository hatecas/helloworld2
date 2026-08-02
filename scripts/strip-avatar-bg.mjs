/**
 * 배경을 투명으로 걷어낸다.
 *
 *   node scripts/strip-avatar-bg.mjs base/base.png
 *   node scripts/strip-avatar-bg.mjs hair/hair.png --skin
 *
 * 그림 도구에서 알파 없이 내보내면 투명 배경이 흰색이나 '체커보드 무늬' 로
 * 구워져 나온다. 그 상태로는 레이어를 겹칠 수 없다.
 *
 * 가장자리에서 시작해 이어진 배경색만 지운다(플러드 필).
 * 캐릭터 안쪽의 흰색(속옷 등)은 외곽선에 막혀 있어 건드리지 않는다.
 *
 * --skin 을 주면 살색 픽셀도 지운다. AI 로 "머리카락만" 을 뽑아도 거의 항상
 * 얼굴 살색이 같이 딸려 나오는데, 그 얼굴 부분을 걷어낼 때 쓴다.
 */
import fs from 'node:fs';
import path from 'node:path';

import { CANVAS, readPng, writePng } from './avatar-rig.mjs';

/**
 * 배경으로 볼 밝기 (이보다 밝고 무채색이면 배경 후보).
 * 체커보드 무늬는 가장자리 쪽이 조금 더 어둡게 나오기도 해서 넉넉히 잡는다.
 */
const BG_MIN = 220;
/** 무채색 판정 — R·G·B 차이가 이보다 작아야 한다 */
const GRAY_TOL = 12;

const arg = process.argv[2];
const dropSkin = process.argv.includes('--skin');
if (!arg) {
  console.error('사용법: node scripts/strip-avatar-bg.mjs <카테고리>/<파일>.png');
  process.exit(1);
}

const rel = arg.replace(/\\/g, '/');
const file = path.join('public/resources/images/avatar', rel);
if (!fs.existsSync(file)) {
  console.error(`${file} 가 없습니다.`);
  process.exit(1);
}

const png = readPng(file);
if (!png.alpha) {
  console.error(png.note);
  process.exit(1);
}
const { width: w, height: h } = png;
const px = Buffer.from(png.alpha);

const isBg = (i) => {
  const r = px[i];
  const g = px[i + 1];
  const b = px[i + 2];
  if (px[i + 3] === 0) return true; // 이미 투명
  if (r < BG_MIN || g < BG_MIN || b < BG_MIN) return false;
  return Math.max(r, g, b) - Math.min(r, g, b) <= GRAY_TOL;
};

// 가장자리에서 시작하는 플러드 필 (스택 방식 — 재귀는 깊이 초과가 난다)
const seen = new Uint8Array(w * h);
const stack = [];
for (let x = 0; x < w; x++) {
  stack.push(x, 0, x, h - 1);
}
for (let y = 0; y < h; y++) {
  stack.push(0, y, w - 1, y);
}

let removed = 0;
while (stack.length) {
  const y = stack.pop();
  const x = stack.pop();
  if (x < 0 || y < 0 || x >= w || y >= h) continue;
  const n = y * w + x;
  if (seen[n]) continue;
  const i = n * 4;
  if (!isBg(i)) continue;

  seen[n] = 1;
  if (px[i + 3] !== 0) {
    px[i + 3] = 0;
    removed++;
  }
  stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
}

// 살색 지우기 — 살은 빨강이 가장 세고 R>G>B 인 밝은 색이다.
// 머리카락 갈색(72,48,32 / 120,80,56)은 R 이 200 을 못 넘어 걸리지 않는다.
let skinRemoved = 0;
let edgeRemoved = 0;
if (dropSkin) {
  const isSkin = (i) => {
    const r = px[i];
    const g = px[i + 1];
    const b = px[i + 2];
    const diff = r - b;
    return r >= 200 && r > g && g > b && diff >= 40 && diff <= 120;
  };

  // 어느 칸(x)에서 살색이 어디까지 내려갔는지 기억해 둔다
  const lowestSkin = new Int32Array(w).fill(-1);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (px[i + 3] === 0 || !isSkin(i)) continue;
      px[i + 3] = 0;
      skinRemoved++;
      if (y > lowestSkin[x]) lowestSkin[x] = y;
    }
  }

  /*
   * 얼굴을 감싸던 '턱선' 지우기.
   *
   * 살색만 지우면 그 얼굴을 두르고 있던 어두운 윤곽이 남아 얼굴을 가로지르는
   * 검은 줄이 된다. 살색이 끝난 바로 아래 몇 픽셀의 어두운 선은 그 턱선이므로
   * 같이 지운다. 앞머리는 살색보다 '위' 라서 그대로 남는다.
   */
  const CHIN = 10;
  for (let x = 0; x < w; x++) {
    const from = lowestSkin[x];
    if (from < 0) continue;
    for (let y = from + 1; y <= from + CHIN && y < h; y++) {
      const i = (y * w + x) * 4;
      if (px[i + 3] === 0) continue;
      const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      if (lum > 110) break; // 어두운 선이 끝났으면 그만
      px[i + 3] = 0;
      edgeRemoved++;
    }
  }
}

const total = w * h;
console.log(`${rel}`);
console.log(`  형식     : ${png.note} (알파 채널 ${png.hadAlpha ? '있음' : '없음'})`);
console.log(`  지운 배경: ${removed.toLocaleString()} px  (전체의 ${((removed / total) * 100).toFixed(1)}%)`);
if (dropSkin) {
  console.log(`  지운 살색: ${skinRemoved.toLocaleString()} px`);
  console.log(`  지운 턱선: ${edgeRemoved.toLocaleString()} px`);
}

// 캐릭터가 남았는지 확인
let opaque = 0;
for (let i = 3; i < px.length; i += 4) if (px[i] > 8) opaque++;
console.log(`  남은 그림: ${opaque.toLocaleString()} px  (전체의 ${((opaque / total) * 100).toFixed(1)}%)`);

if (opaque === 0) {
  console.error('\n전부 지워졌습니다. 배경색 판정이 너무 넓습니다 — 파일을 그대로 둡니다.');
  process.exit(1);
}

const backup = file.replace(/\.png$/i, '.orig.png');
if (!fs.existsSync(backup)) {
  fs.copyFileSync(file, backup);
  console.log(`  원본 백업: ${path.basename(backup)}`);
}

writePng(file, w, h, px);
console.log(`\n투명 PNG 로 저장했습니다. (${w}x${h}, RGBA)`);
