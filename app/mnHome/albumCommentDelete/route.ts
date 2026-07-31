import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { deleteAlbumComment } from '@/lib/db/repo';
import { getStore } from '@/lib/db/store';

/** 사진첩 댓글/답글 삭제 — 작성자 본인만 (게시판 deleteComment 와 동일 구조, JSON body) */
export async function POST(request: Request) {
  try {
    const { seq: raw } = (await request.json()) as { seq?: number | string };
    const seq = Number(raw);
    const user = await getSessionUser();
    if (!user || !Number.isFinite(seq)) return NextResponse.json(0);

    const [comment] = await getStore().select('albumCMT', { seq });
    if (!comment || comment.userNickname !== user.userNickname) return NextResponse.json(0);

    const removed = await deleteAlbumComment(seq);
    return NextResponse.json(removed > 0 ? 1 : 0);
  } catch (error) {
    console.error('[albumCommentDelete]', error);
    return NextResponse.json(0);
  }
}
