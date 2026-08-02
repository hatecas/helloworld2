/**
 * 미니홈피 화면이 공유하는 값/헬퍼 중 서버 의존성이 없는 것들.
 * (lib/minihome.ts 는 세션·DB 를 건드리므로 클라이언트 컴포넌트에서 못 쓴다)
 */

import type { Viewer } from '@/lib/db/visibility';

export interface MiniHomeCommon {
  userNickname: string;
  viewerNickname: string;
  isOwner: boolean;
  /**
   * 이 홈피에서 보는 사람의 자격 (주인인가 / 일촌인가).
   * 게시물 공개범위 판정에 쓰이며, 페이지마다 다시 계산하지 않도록 여기 담아 둔다.
   */
  viewer: Viewer;
  /** 미니홈피 자체를 볼 수 있는가 (비공개 홈피는 주인·일촌만) */
  canEnter: boolean;
  /** 방문자가 이 홈피 주인에게 일촌신청을 보낼 수 있는지 (이미 일촌/신청중이면 false) */
  canRequestFriend: boolean;
  todayCnt: number;
  totalCnt: number;
  image: string;
  msg: string;
  userName: string;
  userGender: string;
  title: string;
  friends: Array<{ Name: string; userEmail: string }>;
  menuContentPath: string;
}

/** menuTab.jsp 의 c:choose 를 그대로 옮긴 색상표 */
export function menuBackgroundColor(contentPath: string): string {
  const table: Record<string, string> = {
    red: 'red', yellow: 'yellow', black: 'black', blue: 'blue', purple: 'purple',
    white: 'white', green: 'green', lime: 'lime', grey: 'grey', navy: 'navy',
    'rgb(42, 140, 168)': 'rgb(42, 140, 168)',
  };
  return table[contentPath] ?? 'rgb(42, 140, 168)';
}

export function menuTextColor(contentPath: string): string {
  const table: Record<string, string> = {
    red: 'lightgreen', yellow: 'navy', black: 'white', blue: 'orange', purple: 'lightgreen',
    white: 'black', green: 'red', lime: 'pink', grey: 'brown', navy: 'yellow',
    'rgb(42, 140, 168)': 'white',
  };
  return table[contentPath] ?? 'white';
}

/** main.jsp 의 스킨 배경색 c:choose (grey → gray 로 바뀌는 것까지 동일) */
export function skinBackgroundColor(contentPath: string): string {
  const table: Record<string, string> = {
    red: 'red', yellow: 'yellow', black: 'black', blue: 'blue', purple: 'purple',
    white: 'white', green: 'green', lime: 'lime', grey: 'gray', navy: 'navy',
    'rgb(42, 140, 168)': 'rgb(42, 140, 168)',
  };
  return table[contentPath] ?? 'rgb(42, 140, 168)';
}
