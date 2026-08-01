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
export const WORLD_H = 620;

/** 걸어 다닐 수 있는 영역 (위쪽은 배경, 좌우 여백) — 발 위치 기준 */
export const WALK = { minX: 46, maxX: WORLD_W - 46, minY: 286, maxY: WORLD_H - 26 };

/** 이동 속도 (px/초) */
export const SPEED = 190;

/** 미니미 렌더 폭(px). 원본 gif 가 320x240 이라 높이는 0.75배. */
export const MINIMI_W = 108;
export const MINIMI_H = MINIMI_W * 0.75;

/** 좌표 전송 주기(ms). 움직이는 동안만 보낸다. */
export const POS_INTERVAL = 80;

/** 말풍선이 머리 위에 떠 있는 시간(ms) */
export const BUBBLE_MS = 5000;

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
  const radius = 120 + (h % 70);
  return {
    x: clamp(WORLD_W / 2 + Math.cos(angle) * radius, WALK.minX, WALK.maxX),
    y: clamp(WALK.maxY - 40 + Math.sin(angle) * 50, WALK.minY, WALK.maxY),
  };
}
