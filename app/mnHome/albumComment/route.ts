import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { getAlbumComments, insertAlbumComment } from '@/lib/db/repo';

/** 사진첩 댓글/답글 등록 — 등록 후 최신 댓글 목록을 돌려준다 (게시판 addComment 와 동일 구조) */
export async function POST(request: Request) {
  try {
    const { albumSeq, content, parentSeq } = (await request.json()) as {
      albumSeq?: string | number;
      content?: string;
      parentSeq?: number | null;
    };

    const seq = Number(albumSeq);
    const user = await getSessionUser();
    if (!user || !Number.isFinite(seq) || !content?.trim()) {
      return NextResponse.json([]);
    }

    const parent = typeof parentSeq === 'number' ? parentSeq : null;
    await insertAlbumComment(seq, user.userNickname, content, parent);
    return NextResponse.json(await getAlbumComments(seq));
  } catch (error) {
    console.error('[albumComment]', error);
    return NextResponse.json([]);
  }
}
