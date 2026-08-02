import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { modifyDiary, selectDiaryOne } from '@/lib/db/repo';
import { sanitizeRichText } from '@/lib/sanitize';
import { toScope } from '@/lib/db/visibility';

/** 구 DiaryController.diaryModify */
export async function POST(request: Request) {
  try {
    const { seq, title, content, visibility } = (await request.json()) as {
      seq?: number | string;
      title?: string;
      content?: string;
      visibility?: string;
    };

    const seqNum = Number(seq);
    const user = await getSessionUser();
    if (!user || !Number.isFinite(seqNum)) return NextResponse.json({ resultCode: '0' });

    const diary = await selectDiaryOne(seqNum);
    if (!diary || diary.userNickname !== user.userNickname) {
      return NextResponse.json({ resultCode: '0' });
    }

    await modifyDiary(seqNum, title ?? '', sanitizeRichText(content ?? ''), toScope(visibility));
    return NextResponse.json({ resultCode: '1' });
  } catch (error) {
    console.error('[diaryModify]', error);
    return NextResponse.json({ resultCode: '0' });
  }
}
