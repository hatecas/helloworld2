import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { deleteBoardComment } from '@/lib/db/repo';
import { getStore } from '@/lib/db/store';

/** 구 BoardController.deleteComment (form-urlencoded 로 seq 를 받는다) */
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const seq = Number(form.get('seq'));
    const user = await getSessionUser();
    if (!user || !Number.isFinite(seq)) return NextResponse.json(0);

    const [comment] = await getStore().select('boardCMT', { seq });
    if (!comment || comment.userNickname !== user.userNickname) return NextResponse.json(0);

    const removed = await deleteBoardComment(seq);
    return NextResponse.json(removed > 0 ? 1 : 0);
  } catch (error) {
    console.error('[deleteComment]', error);
    return NextResponse.json(0);
  }
}
