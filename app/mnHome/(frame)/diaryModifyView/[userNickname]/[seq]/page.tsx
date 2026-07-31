import { notFound, redirect } from 'next/navigation';

import Stylesheets from '@/components/Stylesheets';
import MiniHomeShell from '@/components/minihome/MiniHomeShell';
import DiaryEditorClient from '@/components/minihome/DiaryEditorClient';
import { loadMiniHomeCommon } from '@/lib/minihome';
import { selectDiaryOne } from '@/lib/db/repo';

/** 구 DiaryController.diaryModifyView + views/miniHome/diaryModify.jsp */
export default async function DiaryModifyViewPage({
  params,
}: {
  params: Promise<{ userNickname: string; seq: string }>;
}) {
  const { userNickname: raw, seq } = await params;
  const userNickname = decodeURIComponent(raw);
  const seqNum = Number(seq);
  if (!Number.isFinite(seqNum)) notFound();

  const [common, diary] = await Promise.all([
    loadMiniHomeCommon(userNickname),
    selectDiaryOne(seqNum),
  ]);
  if (!common || !diary) notFound();
  if (!common.isOwner) redirect(`/mnHome/diaryView/${userNickname}`);

  return (
    <>
      <Stylesheets
        hrefs={['/resources/css/minihome/diary.css']}
      />
      <MiniHomeShell common={common}>
        <DiaryEditorClient
          mode="modify"
          userNickname={userNickname}
          userName={common.userName}
          seq={diary.seq}
          title={diary.title}
          content={diary.content}
          diaryDate={diary.formatted_update_date}
          openScope={diary.openScope}
        />
      </MiniHomeShell>
    </>
  );
}
