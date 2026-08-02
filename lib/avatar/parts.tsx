/**
 * 아바타 파트 카탈로그 — 레이어드 페이퍼돌.
 *
 * 모든 파트는 **같은 1024×1536 캔버스에 몸에 붙을 자리 그대로** 그린 투명 PNG 다.
 * 그래서 그냥 겹치면 정렬이 맞고, 코드에는 위치 계산이 하나도 없다.
 * (파트를 잘라 저장하고 코드에서 좌표를 잡는 방식은 파트가 늘어날수록 관리가 안 된다)
 *
 * 규격과 기준선은 public/resources/images/avatar/SPEC.md 참고.
 * 새 파일을 넣은 뒤에는 `node scripts/check-avatar-assets.mjs` 로 정렬을 확인한다.
 */

/** 갈아끼울 수 있는 부위 (base 는 항상 깔리므로 제외) */
export type Category = 'bottom' | 'top' | 'shoes' | 'eyes' | 'hair' | 'headwear' | 'acc';

export type AvatarParts = Record<Category, string>;

/**
 * 겹치는 순서 (아래 → 위).
 *
 * eyes 가 hair 보다 **아래**여야 앞머리가 눈을 덮는다. (예전엔 반대라 앞머리 있는
 * 헤어를 넣으면 눈이 머리카락 위로 떠 버렸다)
 * 머리를 덮는 후드·모자는 top 이 아니라 headwear 로 넣어야 헤어 위로 올라간다.
 */
const LAYER_ORDER: Category[] = ['bottom', 'top', 'shoes', 'eyes', 'hair', 'headwear', 'acc'];

const DIR = '/resources/images/avatar';

/** 에셋 캔버스 (base.png 실측) */
export const CANVAS = { w: 1024, h: 1536 };

/**
 * 캔버스 안에서 캐릭터가 실제로 그려진 영역 (base.png 실측).
 * 캔버스 대부분이 빈 여백이라 그대로 그리면 캐릭터가 작게 나온다.
 * 렌더할 때 이 영역만 잘라서 꽉 채운다.
 */
export const CONTENT = { x: 301, y: 394, w: 422, h: 631 };

/** 항상 맨 아래에 깔리는 몸 (민머리·눈 없음·속옷만) */
export const BASE_SRC = `${DIR}/base/base.png`;

export const DEFAULT_PARTS: AvatarParts = {
  bottom: 'none',
  top: 'none',
  shoes: 'none',
  eyes: 'round_brown',
  hair: 'hair',
  headwear: 'none',
  acc: 'none',
};

export function partSrc(cat: Category, id: string): string | null {
  return !id || id === 'none' ? null : `${DIR}/${cat}/${id}.png`;
}

/** base 부터 위로 쌓을 이미지 경로들 */
export function avatarLayerSrcs(parts: AvatarParts): string[] {
  return [
    BASE_SRC,
    ...LAYER_ORDER.map((c) => partSrc(c, parts[c])).filter((s): s is string => Boolean(s)),
  ];
}

export interface Option {
  id: string;
  label: string;
}

/**
 * 카테고리별 선택지. 파일을 추가하면 여기에 한 줄씩 등록한다.
 * (에셋을 새로 만드는 중이라 지금은 전부 '없음' 뿐이다)
 */
export const CATALOG: Record<Category, Option[]> = {
  hair: [
    { id: 'none', label: '없음' },
    { id: 'hair', label: '갈색 단발' },
  ],
  eyes: [
    { id: 'none', label: '없음' },
    { id: 'round_brown', label: '동그란 갈색' },
  ],
  top: [{ id: 'none', label: '없음' }],
  bottom: [{ id: 'none', label: '없음' }],
  shoes: [{ id: 'none', label: '없음' }],
  headwear: [{ id: 'none', label: '없음' }],
  acc: [{ id: 'none', label: '없음' }],
};

export const TABS: Array<{ key: Category; label: string }> = [
  { key: 'hair', label: '헤어' },
  { key: 'eyes', label: '눈' },
  { key: 'top', label: '상의' },
  { key: 'bottom', label: '하의' },
  { key: 'shoes', label: '신발' },
  { key: 'headwear', label: '모자' },
  { key: 'acc', label: '악세' },
];
