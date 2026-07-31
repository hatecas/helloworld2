import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { getSessionUser } from '@/lib/session';
import { getNotifications } from '@/lib/db/repo';

/**
 * 로그인 사용자의 알림.
 *  - GET             : 목록 + 안 읽은 개수
 *  - POST { all }    : 모두 읽음 (읽음 기준 시각을 지금으로, 개별 읽음 목록 초기화)
 *  - POST { id }     : 그 알림 하나만 읽음 (클릭해서 이동한 경우)
 *
 * 이벤트 테이블 없이 파생하고, 읽음 상태만 httpOnly 쿠키로 들고 있어 마이그레이션이 없다.
 *  - helloworld_noti_read : "모두 읽음" 기준 시각(ISO)
 *  - helloworld_noti_seen : 개별로 읽은 알림 id 목록(JSON, 최근 것 위주로 상한)
 */
const READ_COOKIE = 'helloworld_noti_read';
const SEEN_COOKIE = 'helloworld_noti_seen';
const ONE_YEAR = 60 * 60 * 24 * 365;
const SEEN_MAX = 100;

const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: ONE_YEAR,
};

function readSeen(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ items: [], unread: 0 });

  const store = await cookies();
  const readAt = store.get(READ_COOKIE)?.value ?? '';
  const seen = readSeen(store.get(SEEN_COOKIE)?.value);
  return NextResponse.json(await getNotifications(user.userNickname, readAt, seen));
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { id?: string; all?: boolean };
  const store = await cookies();

  // 알림 하나만 읽음 (클릭해서 이동)
  if (typeof body.id === 'string' && !body.all) {
    const seen = readSeen(store.get(SEEN_COOKIE)?.value);
    if (!seen.includes(body.id)) seen.push(body.id);
    store.set(SEEN_COOKIE, JSON.stringify(seen.slice(-SEEN_MAX)), cookieOpts);
    return NextResponse.json({ ok: true });
  }

  // 모두 읽음: 기준 시각을 지금으로, 개별 목록 비움
  store.set(READ_COOKIE, new Date().toISOString(), cookieOpts);
  store.set(SEEN_COOKIE, '[]', cookieOpts);
  return NextResponse.json({ ok: true });
}
