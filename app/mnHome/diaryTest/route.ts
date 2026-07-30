import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { getDiaryComments, selectDiaryByDate } from '@/lib/db/repo';

/**
 * 구 DiaryController.diaryTest — 달력에서 고른 날짜의 일기를 돌려준다.
 * 이름이 test 지만 실제로 다이어리 화면이 매번 쓰는 조회 API 다.
 */
export async function POST(request: Request) {
  try {
    const { date, userNickname } = (await request.json()) as {
      date?: string;
      userNickname?: string;
    };
    if (!date || !userNickname) return NextResponse.json({});

    const diary = await selectDiaryByDate(userNickname, date);
    if (!diary) return NextResponse.json({});

    // 비공개 일기는 주인에게만
    const viewer = await getSessionUser();
    if (diary.openScope === 0 && viewer?.userNickname !== userNickname) {
      return NextResponse.json({});
    }

    return NextResponse.json({
      formatted_update_date: diary.formatted_update_date,
      title: diary.title,
      content: diary.content,
      seq: diary.seq,
      openScope: diary.openScope,
      cmt: await getDiaryComments(diary.seq),
    });
  } catch (error) {
    console.error('[diaryTest]', error);
    return NextResponse.json({});
  }
}
