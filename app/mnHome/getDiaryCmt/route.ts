import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import {
  canSeeHome,
  getDiaryComments,
  resolveViewer,
  selectDiaryOne,
} from '@/lib/db/repo';
import { canView } from '@/lib/db/visibility';

/**
 * 구 DiaryController.getDiaryCmt
 *
 * seq 만 주면 무조건 댓글을 돌려주던 곳이라, 비공개 홈피나 일촌공개 일기의
 * 댓글이 주소만 알면 새어 나갔다. 일기의 공개범위와 홈피 공개 여부를 먼저 확인한다.
 */
export async function POST(request: Request) {
  try {
    const { seq } = (await request.json()) as { seq?: number | string };
    const seqNum = Number(seq);
    if (!Number.isFinite(seqNum)) return NextResponse.json({ cmt: [] });

    const diary = await selectDiaryOne(seqNum);
    if (!diary) return NextResponse.json({ cmt: [] });

    const session = await getSessionUser();
    const viewer = await resolveViewer(diary.userNickname, session?.userNickname);
    if (!canView(diary.openScope, viewer)) return NextResponse.json({ cmt: [] });
    if (!(await canSeeHome(diary.userNickname, viewer))) return NextResponse.json({ cmt: [] });

    return NextResponse.json({ cmt: await getDiaryComments(seqNum) });
  } catch (error) {
    console.error('[getDiaryCmt]', error);
    return NextResponse.json({ cmt: [] });
  }
}
