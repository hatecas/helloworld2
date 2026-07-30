import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { deleteBoards, getBoardContent } from '@/lib/db/repo';

/** 구 BoardController.boardDelete — seq 배열을 그대로 받는다 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Array<string | number>;
    const user = await getSessionUser();
    if (!user || !Array.isArray(body)) {
      return NextResponse.json({ resultCode: '0' });
    }

    const seqs: number[] = [];
    for (const raw of body) {
      const seq = Number(raw);
      if (!Number.isFinite(seq)) continue;
      const board = await getBoardContent(seq);
      if (board?.userNickname === user.userNickname) seqs.push(seq);
    }

    await deleteBoards(seqs);
    return NextResponse.json({ resultCode: '1' });
  } catch (error) {
    console.error('[boardDelete]', error);
    return NextResponse.json({ resultCode: '0' });
  }
}
