import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { getSessionUser } from '@/lib/session';
import { getNotifications } from '@/lib/db/repo';

/**
 * 로그인 사용자의 알림 목록.
 *  - GET  : 알림 목록 + 안 읽은 개수 (읽음 기준 시각은 쿠키에 저장)
 *  - POST : 모두 읽음 처리 (읽음 기준 시각을 지금으로 갱신)
 *
 * 별도 이벤트 테이블 없이 기존 데이터에서 파생하고, "언제까지 읽었는지"만
 * httpOnly 쿠키로 들고 있어 마이그레이션이 필요 없다.
 */
const NOTI_READ_COOKIE = 'helloworld_noti_read';
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ items: [], unread: 0 });

  const store = await cookies();
  const readAt = store.get(NOTI_READ_COOKIE)?.value ?? '';
  return NextResponse.json(await getNotifications(user.userNickname, readAt));
}

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const store = await cookies();
  store.set(NOTI_READ_COOKIE, new Date().toISOString(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_YEAR,
  });
  return NextResponse.json({ ok: true });
}
