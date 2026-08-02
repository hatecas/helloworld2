/**
 * 아바타 에셋 정렬 검사.
 *
 *   npm run avatar:check
 *
 * 파트를 눈대중으로 그리면 반드시 어긋난다(실제로 초기 3장이 그랬다).
 * 파일마다 캔버스 크기와 '불투명 픽셀이 놓인 범위' 를 재서 규격과 맞는지 본다.
 * 파트가 늘어날수록 값을 하는 검사라 초반에 만들어 둔다.
 *
 * 기준 수치는 scripts/avatar-rig.mjs (base.png 실측값) 한 곳에서 온다.
 */
import fs from 'node:fs';
import path from 'node:path';

import { CANVAS, RIG, TOL, bounds, readPng } from './avatar-rig.mjs';

const ROOT = 'public/resources/images/avatar';

/** _old = 폐기한 초기 에셋 보관함. 렌더에 쓰지 않으므로 훑지 않는다. */
const SKIP_DIRS = new Set(['_old']);
/** 작업용 파일 — 가이드(_로 시작)와 맞춤 전 원본(.orig.png) 은 검사 대상이 아니다 */
const isWorkFile = (name) => name.startsWith('_') || name.toLowerCase().endsWith('.orig.png');

const files = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(path.join(dir, e.name));
    } else if (e.name.toLowerCase().endsWith('.png') && !isWorkFile(e.name)) {
      files.push(path.join(dir, e.name));
    }
  }
}
walk(ROOT);

if (files.length === 0) {
  console.log(`${ROOT} 에 검사할 PNG 가 없습니다.`);
  process.exit(0);
}

let bad = 0;
console.log(`규격: ${CANVAS.w}x${CANVAS.h} 투명 PNG, 캐릭터 좌우 중앙 x=${CANVAS.w / 2}\n`);

for (const file of files.sort()) {
  const cat = path.basename(path.dirname(file));
  const name = `${cat}/${path.basename(file)}`;
  const problems = [];

  let png;
  try {
    png = readPng(file);
  } catch (e) {
    console.log(`  X ${name.padEnd(30)} 읽기 실패: ${e.message}`);
    bad++;
    continue;
  }

  if (png.width !== CANVAS.w || png.height !== CANVAS.h) {
    problems.push(`캔버스 ${png.width}x${png.height} -> ${CANVAS.w}x${CANVAS.h} 이어야 함`);
  }
  if (!png.alpha) {
    console.log(`  ? ${name.padEnd(30)} ${png.note} — 알파 검사 생략`);
    if (problems.length) {
      console.log(`      ${problems.join(' / ')}`);
      bad++;
    }
    continue;
  }

  const b = bounds(png);
  if (!b) {
    console.log(`  X ${name.padEnd(30)} 전부 투명 (빈 파일)`);
    bad++;
    continue;
  }

  const cx = (b.minX + b.maxX) / 2;
  if (Math.abs(cx - CANVAS.w / 2) > TOL) {
    problems.push(`좌우 중심 x=${cx.toFixed(0)} -> ${CANVAS.w / 2} 근처여야 함`);
  }

  const rig = RIG[cat];
  if (rig) {
    if (b.minY < rig.top - TOL || b.maxY > rig.bottom + TOL) {
      problems.push(
        `세로 y=${b.minY}~${b.maxY} -> ${rig.label} 구간(${rig.top}~${rig.bottom}) 밖으로 벗어남`,
      );
    }
  } else {
    problems.push(
      `알 수 없는 폴더 '${cat}' — base/eyes/hair/top/bottom/shoes/headwear/acc 중 하나여야 함`,
    );
  }

  if (problems.length === 0) {
    console.log(`  O ${name.padEnd(30)} y=${b.minY}~${b.maxY}, 중심 x=${cx.toFixed(0)}`);
  } else {
    console.log(`  X ${name.padEnd(30)} ${problems.join('\n      ')}`);
    bad++;
  }
}

console.log('');
if (bad === 0) {
  console.log(`전부 통과 (${files.length}개)`);
} else {
  console.log(`${bad}/${files.length} 개가 규격에 안 맞습니다`);
  console.log('가이드(_guide.png)를 밑에 깔고 그 위에 그린 뒤 가이드만 끄고 export 하세요.');
}
process.exit(bad === 0 ? 0 : 1);
