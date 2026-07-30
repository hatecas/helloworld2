import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { deleteVisitComment } from '@/lib/db/repo';

/** 구 VisitController.visitCommentDelete */
export async function POST(request: Request) {
  try {
    const { content, targetNickname } = (await request.json()) as {
      content?: string;
      targetNickname?: string;
    };

    const user = await getSessionUser();
    if (!user || !targetNickname || content == null) {
      return NextResponse.json({ result: 'Fail' });
    }

    const removed = await deleteVisitComment({
      userNickname: user.userNickname,
      targetNickname,
      content,
    });
    return NextResponse.json({ result: removed === 1 ? 'Success' : 'Fail' });
  } catch (error) {
    console.error('[visitCommentDelete]', error);
    return NextResponse.json({ result: 'Fail' });
  }
}
