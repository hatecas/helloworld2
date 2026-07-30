import { notFound, redirect } from 'next/navigation';

import Stylesheets from '@/components/Stylesheets';
import MiniHomeShell from '@/components/minihome/MiniHomeShell';
import DiaryEditorClient from '@/components/minihome/DiaryEditorClient';
import { loadMiniHomeCommon } from '@/lib/minihome';

/** 구 DiaryController.diaryWriteView + views/miniHome/diaryWrite.jsp */
export default async function DiaryWriteViewPage({
  params,
}: {
  params: Promise<{ userNickname: string }>;
}) {
  const { userNickname: raw } = await params;
  const userNickname = decodeURIComponent(raw);

  const common = await loadMiniHomeCommon(userNickname);
  if (!common) notFound();
  if (!common.isOwner) redirect(`/mnHome/diaryView/${userNickname}`);

  return (
    <>
      <Stylesheets
        hrefs={[
          '/resources/css/minihome/diary.css',
          '/resources/css/minihome/jquery-ui(1.13.2).css',
        ]}
      />
      <MiniHomeShell common={common}>
        <DiaryEditorClient mode="write" userNickname={userNickname} userName={common.userName} />
      </MiniHomeShell>
    </>
  );
}
