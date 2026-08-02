import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { getPlazaChat, insertPlazaChat } from '@/lib/db/repo';
import { cleanChat } from '@/lib/plaza/protocol';

/**
 * 광장 채팅 기록.
 *  - GET  : 지난 대화 (새로고침하거나 나중에 들어온 사람이 앞의 대화를 볼 수 있게)
 *  - POST : 한 줄 저장
 *
 * 실시간 전달은 Supabase Realtime broadcast 가 맡고, 여기는 기록만 담당한다.
 * 저장할 때 닉네임은 요청 본문이 아니라 세션에서 가져오므로 로그는 사칭할 수 없다.
 */
export async function GET() {
  try {
    return NextResponse.json({ log: await getPlazaChat() });
  } catch (error) {
    console.error('[plazaChat:get]', error);
    return NextResponse.json({ log: [] });
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const { text } = (await request.json()) as { text?: string };
    const clean = cleanChat(text ?? '');
    if (!clean) return NextResponse.json({ ok: false });

    await insertPlazaChat(user.userNickname, clean);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[plazaChat:post]', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
