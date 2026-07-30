import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { insertDiaryComment, selectDiaryOne } from '@/lib/db/repo';

/** 구 DiaryController.diaryAddCMT */
export async function POST(request: Request) {
  try {
    const { diarySeq, content } = (await request.json()) as {
      diarySeq?: number | string;
      content?: string;
    };

    const seq = Number(diarySeq);
    const user = await getSessionUser();
    if (!user || !Number.isFinite(seq) || !content?.trim()) {
      return NextResponse.json({ resultCode: '0' });
    }
    if (!(await selectDiaryOne(seq))) {
      return NextResponse.json({ resultCode: '0' });
    }

    await insertDiaryComment(seq, user.userNickname, content);
    return NextResponse.json({ resultCode: '1' });
  } catch (error) {
    console.error('[diaryAddCMT]', error);
    return NextResponse.json({ resultCode: '0' });
  }
}
