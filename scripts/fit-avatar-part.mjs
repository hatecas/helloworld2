/**
 * 파트 이미지를 규격 자리에 맞춰 준다.
 *
 *   node scripts/fit-avatar-part.mjs eyes/round_brown.png
 *   node scripts/fit-avatar-part.mjs eyes/round_brown.png --dry   (미리보기만)
 *
 * AI 로 뽑은 파트는 크기도 위치도 제멋대로다. 그걸 사람이 포토샵으로 맞추는 대신,
 * 그림 안의 내용을 찾아서 **부위별 목표 상자**에 맞게 축소·이동시킨다.
 * 도트가 뭉개지지 않도록 최근접 이웃으로 리샘플링한다.
 *
 * 덕분에 "대충 뽑아서 넣으면 알아서 맞는" 흐름이 된다.
 */
import fs from 'node:fs';
import path from 'node:path';

import { CANVAS, bounds, readPng, writePng } from './avatar-rig.mjs';

/**
 * 부위별 목표 상자 — 이 안에 (비율 유지하며) 꽉 차게 넣는다.
 * cx/cy = 상자의 중심, w/h = 최대 크기.  base.png 실측 기준선에서 뽑았다.
 */
const TARGET = {
  eyes: { cx: 512, cy: 600, w: 215, h: 78 },
  hair: { cx: 512, cy: 530, w: 480, h: 400 },
  headwear: { cx: 512, cy: 440, w: 430, h: 250 },
  acc: { cx: 512, cy: 600, w: 270, h: 90 },
  top: { cx: 512, cy: 845, w: 330, h: 180 },
  bottom: { cx: 512, cy: 940, w: 260, h: 150 },
  shoes: { cx: 512, cy: 1005, w: 240, h: 65 },
};

/** 이보다 옅은 픽셀은 지운다 (AI 가 만든 뿌연 후광 제거 — 도트는 또렷해야 한다) */
const ALPHA_FLOOR = 40;

const arg = process.argv[2];
const dry = process.argv.includes('--dry');
if (!arg) {
  console.error('사용법: node scripts/fit-avatar-part.mjs <카테고리>/<파일>.png [--dry]');
  console.error('예:     node scripts/fit-avatar-part.mjs eyes/round_brown.png');
  process.exit(1);
}

const rel = arg.replace(/\\/g, '/');
const cat = rel.split('/')[0];
const file = path.join('public/resources/images/avatar', rel);

if (!fs.existsSync(file)) {
  console.error(`${file} 가 없습니다.`);
  process.exit(1);
}
const target = TARGET[cat];
if (!target) {
  console.error(`'${cat}' 는 맞춰줄 부위가 아닙니다. (${Object.keys(TARGET).join(', ')})`);
  process.exit(1);
}

const png = readPng(file);
if (!png.alpha) {
  console.error(`8bit RGBA PNG 가 아닙니다: ${png.note}`);
  process.exit(1);
}

const b = bounds(png, ALPHA_FLOOR);
if (!b) {
  console.error('그림이 비어 있습니다(전부 투명).');
  process.exit(1);
}

const srcW = b.maxX - b.minX + 1;
const srcH = b.maxY - b.minY + 1;
const scale = Math.min(target.w / srcW, target.h / srcH);
const dstW = Math.max(1, Math.round(srcW * scale));
const dstH = Math.max(1, Math.round(srcH * scale));
const dstX = Math.round(target.cx - dstW / 2);
const dstY = Math.round(target.cy - dstH / 2);

console.log(`${rel}`);
console.log(`  지금 : ${srcW} x ${srcH}  (x ${b.minX}~${b.maxX}, y ${b.minY}~${b.maxY})`);
console.log(`  목표 : ${dstW} x ${dstH}  (x ${dstX}~${dstX + dstW - 1}, y ${dstY}~${dstY + dstH - 1})`);
console.log(`  배율 : ${(scale * 100).toFixed(1)}%`);

if (dry) {
  console.log('\n--dry 라 파일은 그대로 둡니다.');
  process.exit(0);
}

// 최근접 이웃으로 축소해서 새 캔버스에 배치
const out = Buffer.alloc(CANVAS.w * CANVAS.h * 4);
for (let y = 0; y < dstH; y++) {
  const sy = b.minY + Math.floor((y / dstH) * srcH);
  for (let x = 0; x < dstW; x++) {
    const sx = b.minX + Math.floor((x / dstW) * srcW);
    const si = (sy * png.width + sx) * 4;
    if (png.alpha[si + 3] < ALPHA_FLOOR) continue;

    const px = dstX + x;
    const py = dstY + y;
    if (px < 0 || py < 0 || px >= CANVAS.w || py >= CANVAS.h) continue;
    const di = (py * CANVAS.w + px) * 4;
    out[di] = png.alpha[si];
    out[di + 1] = png.alpha[si + 1];
    out[di + 2] = png.alpha[si + 2];
    out[di + 3] = 255; // 반투명 가장자리를 없애 도트를 또렷하게
  }
}

/*
 * 헤어 전용 뒷정리 — 얼굴 앞을 가로지르는 머리카락 제거.
 *
 * 밥컷처럼 뒤로 넘어가는 머리는 그림 안에서 아래쪽이 이어져 있다.
 * 그대로 얹으면 그 부분이 얼굴 한가운데(입·턱)를 가로지르는 검은 줄이 된다.
 * 눈 아래로는 base 의 얼굴 안쪽에 들어온 머리카락을 지운다.
 * (옆머리는 얼굴 폭 밖이라 그대로 남는다)
 */
if (cat === 'hair') {
  const base = readPng('public/resources/images/avatar/base/base.png');
  if (base.alpha) {
    const isSkin = (i, a) => {
      const r = a[i];
      const g = a[i + 1];
      const b = a[i + 2];
      const d = r - b;
      return a[i + 3] > 128 && r >= 200 && r > g && g > b && d >= 40 && d <= 120;
    };
    const FROM_Y = 640; // 눈 아래부터
    const INSET = 6; // 턱 윤곽선은 살짝 남긴다
    let cleared = 0;
    for (let y = FROM_Y; y < CANVAS.h; y++) {
      let x0 = -1;
      let x1 = -1;
      for (let x = 0; x < CANVAS.w; x++) {
        if (isSkin((y * CANVAS.w + x) * 4, base.alpha)) {
          if (x0 < 0) x0 = x;
          x1 = x;
        }
      }
      if (x0 < 0) continue;
      for (let x = x0 + INSET; x <= x1 - INSET; x++) {
        const i = (y * CANVAS.w + x) * 4;
        if (out[i + 3] === 0) continue;
        out[i + 3] = 0;
        cleared++;
      }
    }
    if (cleared > 0) console.log(`  얼굴 앞을 덮던 머리카락 ${cleared.toLocaleString()} px 제거`);
  }
}

// 원본은 한 번만 백업해 둔다
const backup = file.replace(/\.png$/i, '.orig.png');
if (!fs.existsSync(backup)) {
  fs.copyFileSync(file, backup);
  console.log(`  원본 백업: ${path.basename(backup)}`);
}

writePng(file, CANVAS.w, CANVAS.h, out);
console.log('\n맞춤 완료. 확인:  npm run avatar:preview   →   _preview.png');
