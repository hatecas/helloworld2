import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { insertVisitComment } from '@/lib/db/repo';
import { sanitizePlainText } from '@/lib/sanitize';

/** 구 VisitController.visitComment */
export async function POST(request: Request) {
  try {
    const { content, targetNickname } = (await request.json()) as {
      content?: string;
      targetNickname?: string;
    };

    const user = await getSessionUser();
    if (!user || !targetNickname || !content?.trim() || user.userNickname === targetNickname) {
      return NextResponse.json({ result: 'Fail' });
    }

    await insertVisitComment(user.userNickname, targetNickname, sanitizePlainText(content));
    return NextResponse.json({ result: 'Success' });
  } catch (error) {
    console.error('[visitComment]', error);
    return NextResponse.json({ result: 'Fail' });
  }
}
