import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { getBoardComments, insertBoardComment } from '@/lib/db/repo';

/** 구 BoardController.addComment — 등록 후 최신 댓글 목록을 돌려준다 */
export async function POST(request: Request) {
  try {
    const { boardSeq, content, parentSeq } = (await request.json()) as {
      boardSeq?: string | number;
      content?: string;
      parentSeq?: number | null;
    };

    const seq = Number(boardSeq);
    const user = await getSessionUser();
    if (!user || !Number.isFinite(seq) || !content?.trim()) {
      return NextResponse.json([]);
    }

    const parent = typeof parentSeq === 'number' ? parentSeq : null;
    await insertBoardComment(seq, user.userNickname, content, parent);
    return NextResponse.json(await getBoardComments(seq));
  } catch (error) {
    console.error('[addComment]', error);
    return NextResponse.json([]);
  }
}
