import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { getBoardContent, modifyBoard } from '@/lib/db/repo';
import { sanitizeRichText } from '@/lib/sanitize';
import { toScope } from '@/lib/db/visibility';

/** 구 BoardController.boardModify */
export async function POST(request: Request) {
  try {
    const { seq, title, content, visibility } = (await request.json()) as {
      seq?: number | string;
      title?: string;
      content?: string;
      visibility?: string | number;
    };

    const seqNum = Number(seq);
    if (!Number.isFinite(seqNum)) {
      return NextResponse.json({ resultCode: '0', message: '잘못된 요청입니다.' });
    }

    const user = await getSessionUser();
    const board = await getBoardContent(seqNum);
    if (!user || !board || board.userNickname !== user.userNickname) {
      return NextResponse.json({ resultCode: '0' });
    }

    await modifyBoard(seqNum, title ?? '', sanitizeRichText(content ?? ''), toScope(visibility));
    return NextResponse.json({ resultCode: '1' });
  } catch (error) {
    console.error('[boardModify]', error);
    return NextResponse.json({ resultCode: '0' });
  }
}
