import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { insertBoard } from '@/lib/db/repo';
import { sanitizeRichText } from '@/lib/sanitize';

/** 구 BoardController.boardWrite */
export async function POST(request: Request) {
  try {
    const { userNickname, title, content } = (await request.json()) as {
      userNickname?: string;
      title?: string;
      content?: string;
    };

    const user = await getSessionUser();
    if (!user || user.userNickname !== userNickname || !title?.trim() || !content?.trim()) {
      return NextResponse.json({ resultCode: '0' });
    }

    await insertBoard(user.userNickname, title, sanitizeRichText(content));
    return NextResponse.json({ resultCode: '1' });
  } catch (error) {
    console.error('[boardWrite]', error);
    return NextResponse.json({ resultCode: '0' });
  }
}
