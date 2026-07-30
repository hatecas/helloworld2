import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { deleteDiary, selectDiaryOne } from '@/lib/db/repo';

/** 구 DiaryController.diaryDelete */
export async function POST(request: Request) {
  try {
    const { seq } = (await request.json()) as { seq?: number | string };
    const seqNum = Number(seq);

    const user = await getSessionUser();
    if (!user || !Number.isFinite(seqNum)) return NextResponse.json({ resultCode: '0' });

    const diary = await selectDiaryOne(seqNum);
    if (!diary || diary.userNickname !== user.userNickname) {
      return NextResponse.json({ resultCode: '0' });
    }

    await deleteDiary(seqNum);
    return NextResponse.json({ resultCode: '1' });
  } catch (error) {
    console.error('[diaryDelete]', error);
    return NextResponse.json({ resultCode: '0' });
  }
}
