import { notFound } from 'next/navigation';

import Stylesheets from '@/components/Stylesheets';
import MiniHomeShell from '@/components/minihome/MiniHomeShell';
import DiaryProfileBox from '@/components/minihome/DiaryProfileBox';
import DiaryClient from '@/components/minihome/DiaryClient';
import { loadMiniHomeCommon } from '@/lib/minihome';
import { getDiaryComments, selectTodayDiary } from '@/lib/db/repo';
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

  const diary = await selectTodayDiary(userNickname);
  const comments = diary ? await getDiaryComments(diary.seq) : [];

  const visible = diary != null && (diary.openScope === 1 || common.isOwner);

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
          initialComments={visible ? comments.map((c) => ({
            seq: c.seq,
            userNickname: c.userNickname,
            content: c.content,
            cmtDate: c.cmtDate,
          })) : []}
        />
      </MiniHomeShell>
    </>
  );
}
