/**
 * 공개범위 판정 — 게시물(다이어리·사진첩·게시판·방명록)과 미니홈피 전체.
 *
 * 판정 로직을 여기 한 곳에만 둔다. 조회 경로가 여러 군데라 각자 조건을 쓰면
 * 한 곳만 빠뜨려도 안 보여야 할 글이 새어 나간다.
 */

/** 게시물 공개범위 (기존 openScope 컬럼을 그대로 쓴다) */
export const SCOPE = {
  /** 0 = 나만보기. 예전 '비공개' 글이 그대로 여기에 해당한다. */
  PRIVATE: 0,
  /** 1 = 전체공개. 예전 값 그대로. */
  PUBLIC: 1,
  /** 2 = 일촌공개 (새로 추가) */
  FRIENDS: 2,
} as const;

export type Scope = 0 | 1 | 2;

export const SCOPE_OPTIONS: Array<{ value: Scope; label: string; hint: string }> = [
  { value: 1, label: '전체공개', hint: '누구나 볼 수 있어요' },
  { value: 2, label: '일촌공개', hint: '일촌만 볼 수 있어요' },
  { value: 0, label: '나만보기', hint: '나만 볼 수 있어요' },
];

export function scopeLabel(scope: number | undefined | null): string {
  if (scope === SCOPE.FRIENDS) return '일촌공개';
  if (scope === SCOPE.PRIVATE) return '나만보기';
  return '전체공개';
}

/** 넘어온 값이 무엇이든 유효한 공개범위로 정리 (기본은 전체공개) */
export function toScope(value: unknown): Scope {
  const n = Number(value);
  return n === 0 || n === 2 ? (n as Scope) : 1;
}

/**
 * 보는 사람의 자격.
 *  - isOwner : 홈피 주인 본인
 *  - isFriend: 홈피 주인과 수락된 일촌 (주인 본인도 true 로 넘긴다)
 */
export interface Viewer {
  isOwner: boolean;
  isFriend: boolean;
}

export const OWNER_VIEWER: Viewer = { isOwner: true, isFriend: true };
export const STRANGER_VIEWER: Viewer = { isOwner: false, isFriend: false };

/** 이 공개범위의 글을 이 사람이 볼 수 있나 */
export function canView(scope: number | undefined | null, viewer: Viewer): boolean {
  if (viewer.isOwner) return true; // 주인은 자기 글을 전부 본다
  if (scope === SCOPE.PUBLIC) return true;
  if (scope === SCOPE.FRIENDS) return viewer.isFriend;
  return false; // 나만보기
}

/** 목록 필터용 */
export function visibleTo<T extends { openScope?: number | null }>(
  rows: T[],
  viewer: Viewer,
): T[] {
  return rows.filter((r) => canView(r.openScope, viewer));
}

/* ------------------------------------------------------------------ */
/* 미니홈피 전체 공개 여부 (user.homeOpenScope)                        */
/* ------------------------------------------------------------------ */

export const HOME = {
  /** 0 = 비공개. 일촌이 아니면 미니홈피 자체를 못 본다. */
  PRIVATE: 0,
  /** 1 = 공개. 모르는 사람도 들어와서 '전체공개' 글까지는 볼 수 있다. */
  PUBLIC: 1,
} as const;

/** 미니홈피에 들어갈 수 있나 (비공개 홈피는 주인과 일촌만) */
export function canEnterHome(homeOpenScope: number | undefined | null, viewer: Viewer): boolean {
  if (viewer.isOwner) return true;
  if (homeOpenScope === HOME.PRIVATE) return viewer.isFriend;
  return true;
}
