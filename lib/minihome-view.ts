/**
 * 미니홈피 화면이 공유하는 값/헬퍼 중 서버 의존성이 없는 것들.
 * (lib/minihome.ts 는 세션·DB 를 건드리므로 클라이언트 컴포넌트에서 못 쓴다)
 */

export interface MiniHomeCommon {
  userNickname: string;
  viewerNickname: string;
  isOwner: boolean;
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
