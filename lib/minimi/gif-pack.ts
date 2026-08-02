/**
 * GIF 로 받아서 규격만 맞춘 미니미.
 *
 * 시트(PNG)로 오는 [[dot-pack]] 과 달리, 이쪽은 처음부터 애니메이션 GIF 로 배포되는
 * 도트 스프라이트다. 캔버스 크기가 제각각이고(48x44 부터 500x696 까지) 원본 도트를
 * 몇 배로 늘려 놓은 것도 있어서, scripts/gif-to-minimi.mjs 로 원본 배율을 되찾아
 * 기존 미니미 규격(320x240, 바닥 정렬)에 다시 얹는다.
 *
 * 특수 동작(이모트)은 없다 — 원본에 idle 애니메이션 한 벌뿐이라 쓸 자세가 없다.
 * 그래서 광장에서 숫자키를 눌러도 아무 일이 없고 안내도 안 뜬다.
 */

// 확장자를 붙여야 scripts/*.mjs 가 node 로 이 파일을 직접 읽을 수 있다 (generate-seed-sql)
import { MINIMI_DIR } from './dot-pack.ts';

export interface GifMinimi {
  /** <id>.gif 로 저장된다 */
  id: string;
  /** _src 안의 원본 파일 이름 */
  src: string;
  name: string;
  /** 만들 때 준 옵션 — 어떻게 뽑았는지 남겨 둔다 */
  note?: string;
}

export const GIF_MINIMI: GifMinimi[] = [
  { id: 'marioIcon', src: 'mario.gif', name: '마리오', note: '--bg --flip (흰 배경이 구워져 있었다)' },
  { id: 'yoshiIcon', src: 'yoshi.gif', name: '요시' },
  { id: 'pikachuIcon', src: 'pikachu.gif', name: '피카츄', note: '--flip' },
  { id: 'pikachuDotIcon', src: 'pikachu-original.gif', name: '피카츄 (모자)', note: '--max 16 (원본 112프레임)' },
  { id: 'laprasIcon', src: 'lapras.gif', name: '라프라스' },
  { id: 'gabumonIcon', src: 'gabumon.gif', name: '가브몬', note: '--flip' },
];

export function gifMinimiPath(id: string): string {
  return `${MINIMI_DIR}/${id}.gif`;
}
