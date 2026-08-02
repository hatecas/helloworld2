/**
 * 조합 결과 미리보기 이미지 생성.
 *
 *   npm run avatar:preview            # 있는 파트를 전부 겹친다
 *
 * 각 파트가 실제로 몸에 얹혔을 때 어떻게 보이는지 한 장으로 확인한다.
 * (브라우저를 안 띄우고도 정렬을 눈으로 볼 수 있다)
 * 결과: public/resources/images/avatar/_preview.png
 */
import fs from 'node:fs';
import path from 'node:path';

import { CANVAS, readPng, writePng, over } from './avatar-rig.mjs';

const ROOT = 'public/resources/images/avatar';
const OUT = `${ROOT}/_preview.png`;

/** SPEC 의 겹치는 순서 (아래 → 위) */
const ORDER = ['base', 'bottom', 'top', 'shoes', 'eyes', 'hair', 'headwear', 'acc'];

const canvas = Buffer.alloc(CANVAS.w * CANVAS.h * 4);
const used = [];

for (const cat of ORDER) {
  const dir = path.join(ROOT, cat);
  if (!fs.existsSync(dir)) continue;
  const file = fs
    .readdirSync(dir)
    .find(
      (f) =>
        f.toLowerCase().endsWith('.png') &&
        !f.startsWith('_') &&
        !f.toLowerCase().endsWith('.orig.png'), // 맞춤 전 원본은 건너뛴다
    );
  if (!file) continue;

  const png = readPng(path.join(dir, file));
  if (png.width !== CANVAS.w || png.height !== CANVAS.h || !png.alpha) {
    console.log(`  건너뜀 ${cat}/${file} — 캔버스가 ${png.width}x${png.height}`);
    continue;
  }
  over(canvas, png.alpha, CANVAS.w, CANVAS.h);
  used.push(`${cat}/${file}`);
}

writePng(OUT, CANVAS.w, CANVAS.h, canvas);
console.log(`미리보기 생성: ${OUT}`);
console.log('겹친 순서 (아래 → 위):');
for (const u of used) console.log(`  ${u}`);
