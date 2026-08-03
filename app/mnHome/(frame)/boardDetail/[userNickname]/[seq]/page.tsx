import { notFound } from 'next/navigation';

import Stylesheets from '@/components/Stylesheets';
import MiniHomeShell from '@/components/minihome/MiniHomeShell';
import BoardDetailClient from '@/components/minihome/BoardDetailClient';
import { loadMiniHomeCommon } from '@/lib/minihome';
import { getSessionUser } from '@/lib/session';
import { friendCheck, getBoardComments, getBoardContent, updateBoardHit } from '@/lib/db/repo';
import { canView } from '@/lib/db/visibility';
import { ymdhm } from '@/lib/db/format';

// 조회수를 매 요청마다 올리므로 캐시하지 않는다
export const dynamic = 'force-dynamic';

/** 구 BoardController.boardDetail + views/miniHome/boardDetail.jsp */
export default async function BoardDetailPage({
  params,
}: {
  params: Promise<{ userNickname: string; seq: string }>;
}) {
  const { userNickname: raw, seq } = await params;
  const userNickname = decodeURIComponent(raw);
  const seqNum = Number(seq);
  if (!Number.isFinite(seqNum)) notFound();

  await updateBoardHit(seqNum, userNickname);

  const [common, board] = await Promise.all([
    loadMiniHomeCommon(userNickname),
    getBoardContent(seqNum),
  ]);
  if (!common || !board || board.userNickname !== userNickname) notFound();
  // 볼 수 없는 공개범위의 글은 없는 것처럼 다룬다 (존재 여부도 알려주지 않는다)
  if (board.del_yn.toUpperCase() === 'Y' || !canView(board.openScope, common.viewer)) notFound();

  const viewer = await getSessionUser();
  const check = viewer
    ? viewer.userNickname === userNickname
      ? 1
      : await friendCheck(viewer.userNickname, userNickname)
    : 0;

  const comments = await getBoardComments(seqNum);

  return (
    <>
      <Stylesheets
        hrefs={['/resources/css/minihome/board.css', '/resources/css/minihome/album.css']}
      />
      <MiniHomeShell common={common}>
        <BoardDetailClient
          userNickname={userNickname}
          viewerNickname={viewer?.userNickname ?? ''}
          isOwner={common.isOwner}
          seq={board.seq}
          title={board.title}
          content={board.content}
          writer={board.userNickname}
          createDate={ymdhm(board.create_date)}
          canComment={check === 1}
          // 남(일촌)의 글만 퍼갈 수 있다
          canScrap={check === 1 && !common.isOwner && viewer?.userNickname !== userNickname}
          comments={comments}
        />
      </MiniHomeShell>
    </>
  );
}
