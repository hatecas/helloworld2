/**
 * _sheets 의 시트 전부를 미니미 GIF 로 뽑는다 (평소 모습 + 특수 동작).
 *
 *   npm run minimi:pack           전부 다시 만든다
 *   npm run minimi:pack -- greymon patamon    이름에 걸리는 것만
 *
 * 무엇을 어느 프레임으로 뽑을지는 lib/minimi/dot-pack.ts 한 곳에 있다.
 * 프레임을 바꾸고 싶으면 거기만 고치고 이걸 다시 돌리면 된다.
 */
import path from 'node:path';

import { DOT_ACTIONS, DOT_MINIMI, SHEET_DIR, iconName } from '../lib/minimi/dot-pack.ts';
import { loadSheet, sheetToGif, OUT_DIR } from './sheet-to-gif.mjs';
import fs from 'node:fs';

const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const dry = process.argv.includes('--dry');

const targets = only.length
  ? DOT_MINIMI.filter((m) => only.some((o) => m.id.toLowerCase().includes(o.toLowerCase())))
  : DOT_MINIMI;

if (targets.length === 0) {
  console.error(`걸리는 미니미가 없다: ${only.join(', ')}`);
  process.exit(1);
}

let files = 0;
let bytes = 0;
const problems = [];

for (const m of targets) {
  const sheetFile = path.join(SHEET_DIR, m.sheet);
  let sheet;
  try {
    sheet = loadSheet(sheetFile);
  } catch (e) {
    problems.push(`${m.id}: ${e.message}`);
    continue;
  }

  const made = [];
  for (const action of DOT_ACTIONS) {
    try {
      const { gif, colors } = sheetToGif(sheet, { frames: action.frames, delay: action.delay });
      const out = path.join(OUT_DIR, `${iconName(m.id, action.suffix)}.gif`);
      if (!dry) fs.writeFileSync(out, gif);
      made.push(`${action.label} ${(gif.length / 1024).toFixed(1)}K/${colors}색`);
      files++;
      bytes += gif.length;
    } catch (e) {
      problems.push(`${m.id} ${action.label}: ${e.message}`);
    }
  }
  console.log(`${m.name.padEnd(14)} ${m.id.padEnd(18)} ${made.join('  ')}`);
}

console.log(
  `\n${targets.length}종 · ${files}개 파일 · ${(bytes / 1024).toFixed(0)}KB${dry ? ' (--dry, 저장 안 함)' : ''}`,
);
if (problems.length) {
  console.error(`\n문제 ${problems.length}건:`);
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
