import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { getDiaryComments, insertDiaryComment, selectDiaryOne } from '@/lib/db/repo';

/**
 * 구 DiaryController.diaryAddCMT — 다이어리 댓글/답글 등록.
 * 등록 후 최신 댓글 목록을 돌려준다 (게시판 addComment · 사진첩 albumComment 와 동일 구조).
 */
export async function POST(request: Request) {
  try {
    const { diarySeq, content, parentSeq } = (await request.json()) as {
      diarySeq?: number | string;
      content?: string;
      parentSeq?: number | null;
    };

    const seq = Number(diarySeq);
    const user = await getSessionUser();
    if (!user || !Number.isFinite(seq) || !content?.trim()) {
      return NextResponse.json([]);
    }
    if (!(await selectDiaryOne(seq))) {
      return NextResponse.json([]);
    }

    const parent = typeof parentSeq === 'number' ? parentSeq : null;
    await insertDiaryComment(seq, user.userNickname, content, parent);
    return NextResponse.json(await getDiaryComments(seq));
  } catch (error) {
    console.error('[diaryAddCMT]', error);
    return NextResponse.json([]);
  }
}
