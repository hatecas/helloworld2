import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { insertDiary, selectDiaryByDate } from '@/lib/db/repo';
import { sanitizeRichText } from '@/lib/sanitize';

/** 구 DiaryController.diaryAdd — 같은 날짜에 이미 일기가 있으면 -1 */
export async function POST(request: Request) {
  try {
    const { userNickname, title, content, diary_date, visibility } = (await request.json()) as {
      userNickname?: string;
      title?: string;
      content?: string;
      diary_date?: string;
      visibility?: string;
    };

    const user = await getSessionUser();
    if (!user || user.userNickname !== userNickname || !title?.trim() || !diary_date) {
      return NextResponse.json({ resultCode: '0' });
    }

    if (await selectDiaryByDate(user.userNickname, diary_date)) {
      return NextResponse.json({ resultCode: '-1' });
    }

    await insertDiary({
      userNickname: user.userNickname,
      title,
      content: sanitizeRichText(content ?? ''),
      visibility: visibility === '0' ? 0 : 1,
      diary_date,
    });
    return NextResponse.json({ resultCode: '1' });
  } catch (error) {
    console.error('[diaryAdd]', error);
    return NextResponse.json({ resultCode: '0' });
  }
}
