/**
 * 미니미 특수 동작(이모트).
 *
 * 광장에서 숫자키를 누르면 미니미 그림이 잠깐 다른 동작으로 바뀐다.
 * 도트 시트에서 뽑은 미니미는 걷기 말고도 쓸 수 있는 자세가 여러 장 들어 있어서
 * 그 프레임들을 따로 GIF 로 뽑아 두고 여기서 이어 준다.
 *
 * 어떤 동작이 있고 어느 프레임에서 나오는지는 lib/minimi/dot-pack.ts 가 갖고 있다.
 * 이모트가 없는 미니미(메이플 몹들)는 목록이 비어 있고, 숫자키를 눌러도 아무 일도 없다.
 */

import { DOT_EMOTES, DOT_MINIMI, iconPath } from '@/lib/minimi/dot-pack';

export interface Emote {
  /** 통신에 쓰는 이름. 화면에 보이는 말이 아니라 규약이므로 바꾸면 안 된다. */
  name: string;
  /** 화면 안내에 쓰는 이름 */
  label: string;
  src: string;
}

/** 미니미 경로 → 그 미니미가 할 수 있는 동작들. 순서가 곧 숫자키 1, 2, 3... 이다. */
const BY_MINIMI: Record<string, Emote[]> = Object.fromEntries(
  DOT_MINIMI.map((m) => [
    iconPath(m.id),
    DOT_EMOTES.map((a) => ({ name: a.name, label: a.label, src: iconPath(m.id, a.suffix) })),
  ]),
);

export function emotesFor(minimi: string): Emote[] {
  return BY_MINIMI[minimi] ?? [];
}

/** 숫자키(1부터) → 이모트. 없으면 null */
export function emoteByIndex(minimi: string, index: number): Emote | null {
  return emotesFor(minimi)[index] ?? null;
}

/**
 * 이름으로 그림 경로를 찾는다.
 * 남이 보낸 이모트를 그릴 때 쓴다 — 그 사람의 미니미 기준으로 찾아야 한다.
 */
export function emoteSrc(minimi: string, name: string): string | null {
  return emotesFor(minimi).find((e) => e.name === name)?.src ?? null;
}
