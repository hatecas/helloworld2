import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { insertVisitComment } from '@/lib/db/repo';
import { sanitizePlainText } from '@/lib/sanitize';
import { toScope } from '@/lib/db/visibility';

/** 구 VisitController.visitComment */
export async function POST(request: Request) {
  try {
    const { content, targetNickname, visibility } = (await request.json()) as {
      content?: string;
      targetNickname?: string;
      visibility?: string | number;
    };

    const user = await getSessionUser();
    if (!user || !targetNickname || !content?.trim() || user.userNickname === targetNickname) {
      return NextResponse.json({ result: 'Fail' });
    }

    await insertVisitComment(
      user.userNickname,
      targetNickname,
      sanitizePlainText(content),
      toScope(visibility),
    );
    return NextResponse.json({ result: 'Success' });
  } catch (error) {
    console.error('[visitComment]', error);
    return NextResponse.json({ result: 'Fail' });
  }
}
