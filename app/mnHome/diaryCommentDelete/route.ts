import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { deleteDiaryComment } from '@/lib/db/repo';
import { getStore } from '@/lib/db/store';

/** 다이어리 댓글/답글 삭제 — 작성자 본인만 (사진첩 albumCommentDelete 와 동일 구조) */
export async function POST(request: Request) {
  try {
    const { seq: raw } = (await request.json()) as { seq?: number | string };
    const seq = Number(raw);
    const user = await getSessionUser();
    if (!user || !Number.isFinite(seq)) return NextResponse.json(0);

    const [comment] = await getStore().select('diaryCMT', { seq });
    if (!comment || comment.userNickname !== user.userNickname) return NextResponse.json(0);

    const removed = await deleteDiaryComment(seq);
    return NextResponse.json(removed > 0 ? 1 : 0);
  } catch (error) {
    console.error('[diaryCommentDelete]', error);
    return NextResponse.json(0);
  }
}
