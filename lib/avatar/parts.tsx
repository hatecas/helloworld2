import type { ReactNode } from 'react';

/**
 * 도트(픽셀) 감성 아바타 파트 카탈로그 — 프로토타입.
 *
 * 외부 이미지 없이 32×48 픽셀 그리드 위에 <rect> 블록으로 그린다.
 * (shape-rendering: crispEdges 로 도트 느낌) 나중에 실제 도트 PNG/스프라이트로
 * 교체하기 쉽도록, 각 파트는 "레이어 조각(ReactNode)" 하나로만 노출한다.
 *
 * z-순서: 몸(base) → 옷(top) → 헤어(hair) → 눈(eyes) → 악세사리(acc)
 */

export type Gender = 'm' | 'f';

export interface AvatarParts {
  gender: Gender;
  eyes: string;
  hair: string;
  top: string; // 'none' 가능
  acc: string; // 'none' 가능
}

export const DEFAULT_PARTS: AvatarParts = {
  gender: 'm',
  eyes: 'dot',
  hair: 'short',
  top: 'none',
  acc: 'none',
};

const SKIN = '#f1c7a0';
const SKIN_SHADE = '#e0b088';

/** 픽셀 한 칸(또는 블록) */
function px(x: number, y: number, w: number, h: number, fill: string, key: string): ReactNode {
  return <rect key={key} x={x} y={y} width={w} height={h} fill={fill} />;
}

/* -------------------------------- 몸(기본 프리셋) -------------------------------- */

function base(gender: Gender): ReactNode {
  const body: ReactNode[] = [
    px(10, 4, 12, 11, SKIN, 'head'),
    px(10, 13, 12, 1, SKIN_SHADE, 'chin'),
    px(14, 15, 4, 2, SKIN, 'neck'),
    px(11, 17, 10, 12, SKIN, 'torso'),
    px(7, 17, 3, 10, SKIN, 'armL'),
    px(22, 17, 3, 10, SKIN, 'armR'),
    px(12, 29, 4, 13, SKIN, 'legL'),
    px(16, 29, 4, 13, SKIN, 'legR'),
    px(11, 42, 5, 2, '#caa079', 'footL'),
    px(16, 42, 5, 2, '#caa079', 'footR'),
  ];

  // 속옷 (남: 팬티만 / 여: 브라 + 팬티)
  const underwear: ReactNode[] =
    gender === 'm'
      ? [px(11, 26, 10, 5, '#33417f', 'shorts')]
      : [
          px(11, 18, 4, 3, '#e46a8b', 'braL'),
          px(17, 18, 4, 3, '#e46a8b', 'braR'),
          px(15, 19, 2, 1, '#e46a8b', 'braMid'),
          px(12, 27, 8, 4, '#e46a8b', 'panty'),
        ];

  return (
    <>
      {body}
      {underwear}
    </>
  );
}

/* ---------------------------------- 눈 ---------------------------------- */

const EYES: Record<string, ReactNode> = {
  dot: (
    <>
      {px(13, 9, 2, 2, '#2a2a2a', 'l')}
      {px(17, 9, 2, 2, '#2a2a2a', 'r')}
    </>
  ),
  sleepy: (
    <>
      {px(13, 10, 2, 1, '#2a2a2a', 'l')}
      {px(17, 10, 2, 1, '#2a2a2a', 'r')}
    </>
  ),
  big: (
    <>
      {px(12, 8, 3, 3, '#ffffff', 'lw')}
      {px(13, 9, 2, 2, '#2a2a2a', 'l')}
      {px(17, 8, 3, 3, '#ffffff', 'rw')}
      {px(18, 9, 2, 2, '#2a2a2a', 'r')}
    </>
  ),
};

/* --------------------------------- 헤어 --------------------------------- */

const HAIR: Record<string, ReactNode> = {
  short: (
    <>
      {px(9, 3, 14, 3, '#5a3a22', 'top')}
      {px(9, 6, 2, 2, '#5a3a22', 'sideL')}
      {px(21, 6, 2, 2, '#5a3a22', 'sideR')}
    </>
  ),
  long: (
    <>
      {px(9, 3, 14, 3, '#20242c', 'top')}
      {px(9, 6, 2, 12, '#20242c', 'sideL')}
      {px(21, 6, 2, 12, '#20242c', 'sideR')}
    </>
  ),
  cap: (
    <>
      {px(9, 2, 14, 4, '#c0392b', 'crown')}
      {px(7, 6, 18, 1, '#a5301f', 'brim')}
    </>
  ),
};

/* ---------------------------------- 옷 ---------------------------------- */

const TOP: Record<string, ReactNode> = {
  none: null,
  tee: (
    <>
      {px(11, 17, 10, 9, '#3b87ab', 'body')}
      {px(7, 17, 3, 5, '#3b87ab', 'sleeveL')}
      {px(22, 17, 3, 5, '#3b87ab', 'sleeveR')}
    </>
  ),
  stripe: (
    <>
      {px(11, 17, 10, 9, '#f1f1f1', 'body')}
      {px(11, 19, 10, 1, '#d94f4f', 's1')}
      {px(11, 22, 10, 1, '#d94f4f', 's2')}
      {px(11, 25, 10, 1, '#d94f4f', 's3')}
      {px(7, 17, 3, 5, '#f1f1f1', 'sleeveL')}
      {px(22, 17, 3, 5, '#f1f1f1', 'sleeveR')}
    </>
  ),
  dress: (
    <>
      {px(11, 17, 10, 6, '#c86fb0', 'top')}
      {px(9, 23, 14, 8, '#c86fb0', 'skirt')}
      {px(7, 17, 3, 5, '#c86fb0', 'sleeveL')}
      {px(22, 17, 3, 5, '#c86fb0', 'sleeveR')}
    </>
  ),
};

/* ------------------------------- 악세사리 ------------------------------- */

const ACC: Record<string, ReactNode> = {
  none: null,
  glasses: (
    <>
      {px(12, 9, 3, 2, '#2a2a2a', 'lensL')}
      {px(17, 9, 3, 2, '#2a2a2a', 'lensR')}
      {px(15, 9, 2, 1, '#2a2a2a', 'bridge')}
      {px(12, 9, 3, 1, '#ffffff', 'glL')}
      {px(17, 9, 3, 1, '#ffffff', 'glR')}
    </>
  ),
  hat: (
    <>
      {px(9, 1, 14, 3, '#2c3e50', 'crown')}
      {px(6, 4, 20, 1, '#22303d', 'brim')}
    </>
  ),
  earring: (
    <>
      {px(10, 12, 1, 2, '#f4c430', 'l')}
      {px(21, 12, 1, 2, '#f4c430', 'r')}
    </>
  ),
};

const MAPS = { eyes: EYES, hair: HAIR, top: TOP, acc: ACC } as const;

/** AvatarView 가 쓰는 레이어 조각들을 z-순서대로 돌려준다 */
export function avatarLayers(parts: AvatarParts): ReactNode[] {
  return [
    base(parts.gender),
    MAPS.top[parts.top] ?? null,
    MAPS.hair[parts.hair] ?? null,
    MAPS.eyes[parts.eyes] ?? null,
    MAPS.acc[parts.acc] ?? null,
  ];
}

/* ------------------------------- 에디터용 카탈로그 ------------------------------- */

export interface Option {
  id: string;
  label: string;
}

export const CATALOG: {
  gender: Array<{ id: Gender; label: string }>;
  eyes: Option[];
  hair: Option[];
  top: Option[];
  acc: Option[];
} = {
  gender: [
    { id: 'm', label: '남자' },
    { id: 'f', label: '여자' },
  ],
  eyes: [
    { id: 'dot', label: '점눈' },
    { id: 'sleepy', label: '졸린눈' },
    { id: 'big', label: '큰눈' },
  ],
  hair: [
    { id: 'short', label: '단발' },
    { id: 'long', label: '긴머리' },
    { id: 'cap', label: '모자머리' },
  ],
  top: [
    { id: 'none', label: '없음' },
    { id: 'tee', label: '티셔츠' },
    { id: 'stripe', label: '줄무늬' },
    { id: 'dress', label: '원피스' },
  ],
  acc: [
    { id: 'none', label: '없음' },
    { id: 'glasses', label: '안경' },
    { id: 'hat', label: '모자' },
    { id: 'earring', label: '귀걸이' },
  ],
};
