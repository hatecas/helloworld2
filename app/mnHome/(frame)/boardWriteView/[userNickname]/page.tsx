import { notFound, redirect } from 'next/navigation';

import Stylesheets from '@/components/Stylesheets';
import MiniHomeShell from '@/components/minihome/MiniHomeShell';
import BoardEditorClient from '@/components/minihome/BoardEditorClient';
import { loadMiniHomeCommon } from '@/lib/minihome';

/** 구 BoardController.boardWriteView + views/miniHome/boardWrite.jsp */
export default async function BoardWriteViewPage({
  params,
}: {
  params: Promise<{ userNickname: string }>;
}) {
  const { userNickname: raw } = await params;
  const userNickname = decodeURIComponent(raw);

  const common = await loadMiniHomeCommon(userNickname);
  if (!common) notFound();
  if (!common.isOwner) redirect(`/mnHome/boardView/${userNickname}`);

  return (
    <>
      <Stylesheets
        hrefs={['/resources/css/minihome/board.css', '/resources/css/minihome/album.css']}
      />
      <MiniHomeShell common={common}>
        <BoardEditorClient mode="write" userNickname={userNickname} userName={common.userName} />
      </MiniHomeShell>
    </>
  );
}
