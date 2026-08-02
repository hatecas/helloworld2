import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { friendCheck, getDiaryComments, selectDiaryByDate } from '@/lib/db/repo';
import type { Viewer } from '@/lib/db/visibility';

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

    // 공개범위 판정은 selectDiaryByDate 안에서 한다.
    // (전체공개 / 일촌공개 / 나만보기 — 볼 수 없으면 아예 안 돌려준다)
    const viewer = await getSessionUser();
    const isOwner = viewer?.userNickname === userNickname;
    const isFriend =
      isOwner ||
      (viewer ? (await friendCheck(viewer.userNickname, userNickname)) === 1 : false);
    const scope: Viewer = { isOwner, isFriend };

    const diary = await selectDiaryByDate(userNickname, date, scope);
    if (!diary) return NextResponse.json({});

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
