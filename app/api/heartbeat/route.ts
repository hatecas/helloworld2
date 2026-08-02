import { NextResponse } from 'next/server';

import { getSessionUser, setSessionUser } from '@/lib/session';
import { touchLoginStatus } from '@/lib/db/repo';

/**
 * 살아있다는 신호. 로그인 상태로 탭이 열려 있는 동안 주기적으로 들어온다.
 *
 * 두 가지를 한꺼번에 갱신한다.
 *  1) loginStatus.last_seen — '일촌 ON' 판정 기준.
 *     예전엔 로그아웃 버튼을 눌러야만 접속중이 풀려서, 브라우저를 닫거나
 *     PC 를 끈 사람이 며칠씩 ON 으로 남아 있었다.
 *  2) 세션 쿠키 수명 — 신호가 들어올 때마다 만료 시각을 미룬다.
 *     그래서 자리를 뜬 채 방치되면 SESSION_IDLE 이 지난 뒤 자동 로그아웃된다.
 */
export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    await touchLoginStatus(user.userNickname);
    // 활동이 있었으므로 만료 시각을 지금 기준으로 다시 잡는다 (sliding expiration)
    await setSessionUser(user);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[heartbeat]', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
