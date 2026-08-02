import { notFound } from 'next/navigation';

import Stylesheets from '@/components/Stylesheets';
import MiniHomeShell from '@/components/minihome/MiniHomeShell';
import DiaryProfileBox from '@/components/minihome/DiaryProfileBox';
import DiaryClient from '@/components/minihome/DiaryClient';
import { loadMiniHomeCommon } from '@/lib/minihome';
import { getDiaryComments, selectLatestDiary, selectTodayDiary } from '@/lib/db/repo';
import { todayYmd } from '@/lib/db/format';

/** 구 DiaryController.diaryView + views/miniHome/diary.jsp */
export default async function DiaryViewPage({
  params,
}: {
  params: Promise<{ userNickname: string }>;
}) {
  const { userNickname: raw } = await params;
  const userNickname = decodeURIComponent(raw);

  const common = await loadMiniHomeCommon(userNickname);
  if (!common) notFound();

  // 오늘 글이 있으면(그리고 볼 수 있으면) 그걸, 없으면 가장 최근 글을 보여 준다.
  // → 작성 직후 서버/작성자 시간대 차이로 "오늘"이 어긋나도 방금 쓴 글이 바로 뜬다.
  const today = await selectTodayDiary(userNickname, common.viewer);
  const diary = today ?? (await selectLatestDiary(userNickname, common.viewer));
  const comments = diary ? await getDiaryComments(diary.seq) : [];

  const visible = diary != null;

  return (
    <>
      <Stylesheets
        hrefs={['/resources/css/minihome/diary.css']}
      />
      <MiniHomeShell common={common} profileSlot={<DiaryProfileBox common={common} />}>
        <DiaryClient
          userNickname={userNickname}
          viewerNickname={common.viewerNickname}
          isOwner={common.isOwner}
          initialDate={todayYmd()}
          initialDiary={
            visible && diary
              ? {
                  seq: diary.seq,
                  title: diary.title,
                  content: diary.content,
                  openScope: diary.openScope,
                  formatted_update_date: diary.formatted_update_date,
                }
              : null
          }
          initialComments={visible ? comments : []}
        />
      </MiniHomeShell>
    </>
  );
}
