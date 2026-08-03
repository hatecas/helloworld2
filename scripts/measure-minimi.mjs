/**
 * 미니미 그림에서 '실제로 보이는 캐릭터'의 크기와 위치를 재서
 * lib/minimi/sizes.generated.ts 로 뽑아낸다.
 *
 *   npm run minimi:sizes
 *
 * 왜 필요한가:
 *   미니미 100종은 전부 320x240 캔버스지만, 그 안에 그려진 캐릭터의 크기가
 *   96px(발록) ~ 240px(스톤골렘)로 2.5배까지 차이 난다. 발 밑 여백도 0~67px 로
 *   달라서 어떤 미니미는 땅에서 떠 보인다. 광장에서 전부 같은 폭으로 그리니
 *   누구는 거인, 누구는 콩알로 보이고 점프 퀘스트에서는 밸런스 문제가 된다.
 *
 * 어떻게:
 *   GIF 첫 프레임의 불투명 영역(알파 > 16)의 경계상자를 구해
 *     - 보이는 높이 → 목표 높이에 맞추는 배율
 *     - 아래 여백  → 발을 바닥에 붙이는 보정
 *     - 가로 중심  → 좌우 치우침 보정
 *   을 계산한다. 원본 GIF 는 건드리지 않는다(상점·미니룸·프로필이 같은 파일을 쓴다).
 *   화면에서 transform 으로만 보정하므로 다른 화면은 영향받지 않는다.
 *
 * 이모트(Happy/Roar/Sleep)는 자세가 달라 경계상자도 다르다.
 * 배율은 '평소 모습' 것을 그대로 쓰고(동작할 때 몸이 커지면 이상하다)
 * 발높이·중심만 그 그림 기준으로 잡는다.
 */
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const dir = resolve(root, 'public/resources/images/minimi');
const out = resolve(root, 'lib/minimi/sizes.generated.ts');

/** 캔버스 높이에 대한 목표 캐릭터 높이 비율. 전부 이 높이로 보이게 맞춘다. */
const TARGET_H = 0.72;
/** 도트 그림을 너무 키우거나 줄이면 뭉개지므로 배율에 상한을 둔다 */
const SCALE_MIN = 0.7;
const SCALE_MAX = 1.9;

/** 이모트 파일 이름에 붙는 말 — 평소 모습 파일을 되찾는 데 쓴다 */
const EMOTE_SUFFIXES = ['Happy', 'Roar', 'Sleep'];

const round = (n) => Math.round(n * 1000) / 1000;

/** 불투명 영역의 경계상자 (캔버스 크기에 대한 비율로) */
async function measure(file) {
  const { data, info } = await sharp(resolve(dir, file), { animated: false })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: W, height: H, channels: C } = info;
  let minX = W;
  let minY = H;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * C + 3] <= 16) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  // 전부 투명한 그림 (있을 리 없지만 0 나누기 방지)
  if (maxX < 0) return { h: 1, w: 1, b: 0, t: 0, cx: 0 };

  return {
    /** 보이는 높이 (0~1) */
    h: (maxY - minY + 1) / H,
    /** 보이는 폭 (0~1) */
    w: (maxX - minX + 1) / W,
    /** 아래 여백 (0~1) — 발을 바닥에 붙이려면 이만큼 내려야 한다 */
    b: (H - 1 - maxY) / H,
    /** 위 여백 (0~1) — 이름표를 머리 바로 위에 붙이는 데 쓴다 */
    t: minY / H,
    /** 가로 중심이 캔버스 중심에서 벗어난 정도 (-0.5 ~ 0.5) */
    cx: (minX + maxX + 1) / 2 / W - 0.5,
  };
}

/** greymonHappyIcon.gif → greymonIcon.gif (이모트가 아니면 자기 자신) */
function baseFileOf(file) {
  for (const suffix of EMOTE_SUFFIXES) {
    if (file.endsWith(`${suffix}Icon.gif`)) {
      return `${file.slice(0, -`${suffix}Icon.gif`.length)}Icon.gif`;
    }
  }
  return file;
}

const files = readdirSync(dir)
  .filter((f) => f.endsWith('.gif'))
  .sort();

const boxes = new Map();
for (const file of files) boxes.set(file, await measure(file));

const entries = [];
for (const file of files) {
  const box = boxes.get(file);
  const base = boxes.get(baseFileOf(file)) ?? box;
  const scale = Math.min(SCALE_MAX, Math.max(SCALE_MIN, TARGET_H / base.h));
  entries.push([
    file,
    {
      scale: round(scale),
      w: round(box.w),
      b: round(box.b),
      t: round(box.t),
      cx: round(box.cx),
    },
  ]);
}

const lines = [
  '/**',
  ' * 자동 생성 파일 — 직접 고치지 말 것.',
  ' *   npm run minimi:sizes   (scripts/measure-minimi.mjs)',
  ' *',
  ' * 미니미 그림마다 캔버스 안 캐릭터의 크기·발높이·가로중심이 달라서,',
  ' * 광장/인내의 숲에서 같은 크기로 보이도록 보정하는 값이다.',
  ' *   scale : 캐릭터를 목표 높이로 맞추는 배율 (이모트도 평소 모습 배율을 따른다)',
  ' *   w     : 보이는 폭 비율 — 그림자 크기를 캐릭터에 맞추는 데 쓴다',
  ' *   b     : 캔버스 아래 여백 비율 — 발을 바닥에 붙이려면 이만큼 내린다',
  ' *   t     : 캔버스 위 여백 비율 — 이름표를 머리 바로 위에 붙이는 데 쓴다',
  ' *   cx    : 가로 중심이 캔버스 중심에서 벗어난 정도',
  ' */',
  '',
  'export interface MinimiFit {',
  '  scale: number;',
  '  w: number;',
  '  b: number;',
  '  t: number;',
  '  cx: number;',
  '}',
  '',
  `/** 목표 캐릭터 높이 (캔버스 높이에 대한 비율) — 생성 시점 값 */`,
  `export const MINIMI_TARGET_H = ${TARGET_H};`,
  '',
  '/** 파일 이름 → 보정값 */',
  'export const MINIMI_FIT: Record<string, MinimiFit> = {',
  ...entries.map(
    ([file, fit]) =>
      `  '${file}': { scale: ${fit.scale}, w: ${fit.w}, b: ${fit.b}, t: ${fit.t}, cx: ${fit.cx} },`,
  ),
  '};',
  '',
];

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, lines.join('\n'), 'utf8');

const scales = entries.map(([, f]) => f.scale);
console.log(`lib/minimi/sizes.generated.ts 생성 완료 (${entries.length}개 그림)`);
console.log(`배율 범위: ${Math.min(...scales)} ~ ${Math.max(...scales)}`);
