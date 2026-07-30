import { notFound, redirect } from 'next/navigation';

import Stylesheets from '@/components/Stylesheets';
import MiniHomeShell from '@/components/minihome/MiniHomeShell';
import BoardEditorClient from '@/components/minihome/BoardEditorClient';
import { loadMiniHomeCommon } from '@/lib/minihome';
import { getBoardContent } from '@/lib/db/repo';

/** 구 BoardController.boardModifyView + views/miniHome/boardModify.jsp */
export default async function BoardModifyViewPage({
  params,
}: {
  params: Promise<{ userNickname: string; seq: string }>;
}) {
  const { userNickname: raw, seq } = await params;
  const userNickname = decodeURIComponent(raw);
  const seqNum = Number(seq);
  if (!Number.isFinite(seqNum)) notFound();

  const [common, board] = await Promise.all([
    loadMiniHomeCommon(userNickname),
    getBoardContent(seqNum),
  ]);
  if (!common || !board) notFound();
  if (!common.isOwner) redirect(`/mnHome/boardView/${userNickname}`);

  return (
    <>
      <Stylesheets
        hrefs={['/resources/css/minihome/board.css', '/resources/css/minihome/album.css']}
      />
      <MiniHomeShell common={common}>
        <BoardEditorClient
          mode="modify"
          userNickname={userNickname}
          userName={common.userName}
          seq={board.seq}
          title={board.title}
          content={board.content}
        />
      </MiniHomeShell>
    </>
  );
}
