/**
 * 아바타 파트 카탈로그 — 실제 픽셀아트(LPC) 이미지 레이어.
 *
 * 각 파트는 64×64 투명 PNG(정면 서있는 프레임)이고, 같은 좌표계라 그냥 겹치면 맞는다.
 * 출처: Universal LPC Spritesheet (CC-BY-SA 3.0 / GPL 3.0) — public/resources/images/avatar/ 에 저장.
 *
 * 렌더는 브라우저에서 <img> 를 CSS 로 겹쳐서 한다(AvatarView). z-순서: base → bottom → hair.
 * (상의/신발 등은 시트 포맷이 달라 다음 단계에서 정렬 맞춰 추가 예정)
 */

export type Gender = 'm' | 'f';

export interface AvatarParts {
  gender: Gender;
  hair: string; // 'none' 가능
  bottom: string; // 'none' 가능
}

export const DEFAULT_PARTS: AvatarParts = {
  gender: 'm',
  hair: 'bob_blonde',
  bottom: 'pants_black',
};

const DIR = '/resources/images/avatar';

/** 파트 id → 이미지 경로 (none 이면 null) */
export function partSrc(cat: 'base' | 'hair' | 'bottom', id: string): string | null {
  if (!id || id === 'none') return null;
  if (cat === 'base') return `${DIR}/base/${id === 'f' ? 'female_light' : 'male_light'}.png`;
  return `${DIR}/${cat}/${id}.png`;
}

/** z-순서대로 그릴 레이어 이미지 경로들 */
export function avatarLayerSrcs(parts: AvatarParts): string[] {
  return [
    partSrc('base', parts.gender),
    partSrc('bottom', parts.bottom),
    partSrc('hair', parts.hair),
  ].filter((s): s is string => Boolean(s));
}

export interface Option {
  id: string;
  label: string;
}

export const CATALOG: {
  gender: Array<{ id: Gender; label: string }>;
  hair: Option[];
  bottom: Option[];
} = {
  gender: [
    { id: 'm', label: '남자' },
    { id: 'f', label: '여자' },
  ],
  hair: [
    { id: 'none', label: '민머리' },
    { id: 'bob_black', label: '검정 단발' },
    { id: 'bob_blonde', label: '금발 단발' },
    { id: 'bob_red', label: '빨강 단발' },
  ],
  bottom: [
    { id: 'none', label: '없음' },
    { id: 'pants_black', label: '검정 바지' },
    { id: 'pants_blue', label: '파랑 바지' },
  ],
};
