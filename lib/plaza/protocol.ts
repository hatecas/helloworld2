/**
 * 광장(실시간 다중 접속) 규약.
 *
 * 클라이언트끼리 Supabase Realtime 채널 하나("plaza")로 주고받는다.
 *  - presence  : 지금 광장에 누가 있는지 (접속/이탈은 Supabase 가 알아서 정리)
 *  - broadcast : 좌표(pos) · 채팅(chat) · 신규 접속자의 인사(hello)
 *
 * Vercel 서버리스는 WebSocket 서버를 띄울 수 없어서 자체 소켓 서버 대신
 * 이미 쓰고 있는 Supabase 의 Realtime 을 그대로 쓴다.
 */

/** 광장 논리 크기(px). 화면에는 이 비율 그대로 축소/확대해 보여 준다. */
export const WORLD_W = 1000;
/** 세로는 조금 낮춰 아래 채팅 칸에 자리를 내준다 */
export const WORLD_H = 500;

/**
 * 걸어 다닐 수 있는 영역 — 발 위치 기준.
 * 예전엔 위쪽이 하늘이라 minY 를 크게 잡아 위로 못 올라갔다.
 * 이제 바닥이 화면 전체를 덮으므로 위아래로 다 다닐 수 있다.
 */
export const WALK = { minX: 34, maxX: WORLD_W - 34, minY: 34, maxY: WORLD_H - 18 };

/** 이동 속도 (px/초) */
export const SPEED = 190;

/** 점프 (ALT) — 화면상 높이만 바뀌고 좌표(y)는 그대로다 */
export const JUMP_V0 = 420;
export const GRAVITY = 1500;

/**
 * 멀리 있을수록(=y 가 작을수록) 조금 작게 그려 깊이를 준다.
 * 히트박스는 그대로 두고 보이는 크기만 바꾼다.
 */
export const DEPTH_MIN_SCALE = 0.82;
export function depthScale(y: number): number {
  const t = (y - WALK.minY) / (WALK.maxY - WALK.minY);
  return DEPTH_MIN_SCALE + (1 - DEPTH_MIN_SCALE) * Math.min(1, Math.max(0, t));
}

/** 미니미 렌더 폭(px). 원본 gif 가 320x240 이라 높이는 0.75배. */
export const MINIMI_W = 108;
export const MINIMI_H = MINIMI_W * 0.75;

/** 좌표 전송 주기(ms). 움직이는 동안만 보낸다. */
export const POS_INTERVAL = 80;

/** 말풍선이 머리 위에 떠 있는 시간(ms) */
export const BUBBLE_MS = 8000;

/** 채팅 한 줄 최대 길이 / 로그 보관 수 */
export const CHAT_MAX = 120;
export const CHAT_LOG_MAX = 60;

export const CHANNEL = 'plaza';

export type Facing = 'left' | 'right';

/** 광장에 서 있는 한 명 */
export interface Player {
  /** 접속 단위 id (같은 사람이 두 탭을 열면 둘로 보인다) */
  id: string;
  nickname: string;
  /** 미니미 이미지 경로 */
  minimi: string;
  x: number;
  y: number;
  facing: Facing;
  moving: boolean;
}

/** broadcast 'pos' — 좌표 갱신 */
export interface PosMsg {
  id: string;
  nickname: string;
  minimi: string;
  x: number;
  y: number;
  facing: Facing;
  moving: boolean;
  /** 점프로 떠 있는 높이(px). 0 이면 바닥. */
  jump?: number;
}

/** broadcast 'chat' — 채팅 한 줄 */
export interface ChatMsg {
  id: string;
  msgId: string;
  nickname: string;
  text: string;
}

/** broadcast 'hello' — 새로 들어온 사람이 "나 왔어요" 하면 다들 좌표를 한 번 쏴 준다 */
export interface HelloMsg {
  id: string;
}

export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/**
 * 채팅 입력 정리 — 제어문자(줄바꿈·탭 등)를 공백으로 바꾸고 길이 제한.
 * 표시는 React 가 이스케이프하므로 태그를 따로 막을 필요는 없다.
 */
export function cleanChat(raw: string): string {
  let out = '';
  for (const ch of raw) {
    const code = ch.charCodeAt(0);
    out += code < 32 || code === 127 ? ' ' : ch;
  }
  return out.trim().slice(0, CHAT_MAX);
}

/** 광장 입장 시 시작 위치 — 분수 주변에 흩어지게 */
export function spawnPoint(seed: string): { x: number; y: number } {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const angle = (h % 360) * (Math.PI / 180);
  const radius = 150 + (h % 60);
  return {
    x: clamp(WORLD_W / 2 + Math.cos(angle) * radius, WALK.minX, WALK.maxX),
    y: clamp(WORLD_H * 0.68 + Math.sin(angle) * radius * 0.45, WALK.minY, WALK.maxY),
  };
}
