import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { replyVisitComment } from '@/lib/db/repo';

/**
 * 미니홈피 주인이 방명록 방문글에 답글을 달거나 수정/삭제한다.
 * targetNickname 은 세션의 본인으로 고정하므로, 자기 방명록에만 답글을 달 수 있다.
 */
export async function POST(request: Request) {
  try {
    const { seq, reply } = (await request.json()) as { seq?: number; reply?: string };

    const user = await getSessionUser();
    if (!user) return NextResponse.json({ result: 'NeedLogin' }, { status: 401 });
    if (typeof seq !== 'number') return NextResponse.json({ result: 'Fail' }, { status: 400 });

    const changed = await replyVisitComment({
      seq,
      targetNickname: user.userNickname,
      reply: reply ?? '',
    });

    return NextResponse.json({ result: changed > 0 ? 'Success' : 'Fail' });
  } catch (error) {
    console.error('[visitReply]', error);
    return NextResponse.json({ result: 'Fail' }, { status: 500 });
  }
}
