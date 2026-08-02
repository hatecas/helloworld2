import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { insertDiary, selectDiaryByDate } from '@/lib/db/repo';
import { OWNER_VIEWER, toScope } from '@/lib/db/visibility';
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

    // 중복 검사는 내 글 전체를 대상으로 한다 (공개범위와 무관)
    if (await selectDiaryByDate(user.userNickname, diary_date, OWNER_VIEWER)) {
      return NextResponse.json({ resultCode: '-1' });
    }

    await insertDiary({
      userNickname: user.userNickname,
      title,
      content: sanitizeRichText(content ?? ''),
      visibility: toScope(visibility),
      diary_date,
    });
    return NextResponse.json({ resultCode: '1' });
  } catch (error) {
    console.error('[diaryAdd]', error);
    return NextResponse.json({ resultCode: '0' });
  }
}
