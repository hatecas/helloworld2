import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { getNotifications, getReadNotiIds, markNotiRead } from '@/lib/db/repo';

/**
 * 로그인 사용자의 알림.
 *  - GET             : 아직 안 읽은 알림 목록 + 개수
 *  - POST { all }    : 지금 떠 있는 알림을 전부 읽음 처리
 *  - POST { id }     : 그 알림 하나만 읽음 (클릭해서 이동한 경우)
 *
 * 알림 자체는 기존 테이블에서 파생하고(이벤트 테이블 없음), "읽었다"는 사실만
 * notiRead 테이블에 남긴다. 읽은 알림은 목록에서 아예 빠진다.
 *
 * 예전에는 읽음 상태를 httpOnly 쿠키에 뒀다. 쿠키는 브라우저마다 따로라
 * 다른 PC 에서 접속하면 읽은 알림이 다시 안 읽음으로 떴다. 그래서 DB 로 옮겼다.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ items: [], unread: 0 });

  const readIds = await getReadNotiIds(user.userNickname);
  return NextResponse.json(await getNotifications(user.userNickname, readIds));
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { id?: string; all?: boolean };

  // 알림 하나만 읽음 (클릭해서 이동)
  if (typeof body.id === 'string' && !body.all) {
    await markNotiRead(user.userNickname, [body.id]);
    return NextResponse.json({ ok: true });
  }

  // 모두 읽음: 지금 안 읽음으로 떠 있는 것들의 id 를 통째로 읽음 처리한다.
  // (기준 시각 하나로 처리하면 나중에 도착한 과거 날짜 알림이 묻힐 수 있다)
  const readIds = await getReadNotiIds(user.userNickname);
  const { items } = await getNotifications(user.userNickname, readIds);
  await markNotiRead(user.userNickname, items.map((it) => it.id));
  return NextResponse.json({ ok: true });
}
