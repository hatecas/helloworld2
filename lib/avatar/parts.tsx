/**
 * 아바타 파트 카탈로그 — 실제 도트 이미지 레이어 (SPEC.md 규격).
 *
 * 모든 파트는 같은 2:3 캔버스(원본 1024×1536, 여기선 512×768로 저장)에 정위치로 그려진
 * 투명 PNG. 그냥 겹치면 정렬이 맞는다. 브라우저에서 <img> 를 CSS 로 겹쳐 렌더(AvatarView).
 *
 * 겹치는 순서(아래→위): base → hair → outfit → eyes
 *  (곰후드가 outfit 에 포함돼 hair 위를 덮고, 눈은 얼굴 위에 올라온다)
 * base(민머리·맨몸) 에셋은 아직 없어 없이도 렌더된다(후드 속 얼굴은 base 나오면 채워짐).
 */

export type Category = 'hair' | 'outfit' | 'eyes';

export interface AvatarParts {
  hair: string; // 'none' 가능
  outfit: string;
  eyes: string;
}

export const DEFAULT_PARTS: AvatarParts = {
  hair: 'twintail_brown',
  outfit: 'bear_hoodie',
  eyes: 'round_brown',
};

const DIR = '/resources/images/avatar';

/** 아래→위 레이어 순서 */
const LAYER_ORDER: Category[] = ['hair', 'outfit', 'eyes'];

export function partSrc(cat: Category, id: string): string | null {
  return !id || id === 'none' ? null : `${DIR}/${cat}/${id}.png`;
}

export function avatarLayerSrcs(parts: AvatarParts): string[] {
  return LAYER_ORDER.map((c) => partSrc(c, parts[c])).filter((s): s is string => Boolean(s));
}

export interface Option {
  id: string;
  label: string;
}

/** 카테고리별 선택지. 파일을 추가하면 여기에 한 줄씩 등록. */
export const CATALOG: Record<Category, Option[]> = {
  hair: [
    { id: 'none', label: '없음' },
    { id: 'twintail_brown', label: '갈색 트윈테일' },
  ],
  outfit: [
    { id: 'none', label: '없음' },
    { id: 'bear_hoodie', label: '곰돌이 후드' },
  ],
  eyes: [
    { id: 'none', label: '없음' },
    { id: 'round_brown', label: '동그란 갈색' },
  ],
};

export const TABS: Array<{ key: Category; label: string }> = [
  { key: 'hair', label: '헤어' },
  { key: 'eyes', label: '눈' },
  { key: 'outfit', label: '의상' },
];
