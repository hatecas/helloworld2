import { notFound } from 'next/navigation';

import Stylesheets from '@/components/Stylesheets';
import MiniHomeShell from '@/components/minihome/MiniHomeShell';
import BoardListClient from '@/components/minihome/BoardListClient';
import { loadMiniHomeCommon } from '@/lib/minihome';
import { getBoardList, getBoardPageCount } from '@/lib/db/repo';

/**
 * 구 BoardController.boardView
 * ("/mnHome/boardView/{userNickname}" 와 ".../{page}" 두 형태를 모두 받는다)
 */
export default async function BoardViewPage({
  params,
}: {
  params: Promise<{ userNickname: string; page?: string[] }>;
}) {
  const { userNickname: raw, page } = await params;
  const userNickname = decodeURIComponent(raw);
  const currentPage = Number(page?.[0]) > 0 ? Number(page?.[0]) : 1;

  const common = await loadMiniHomeCommon(userNickname);
  if (!common) notFound();

  const [list, totalPage] = await Promise.all([
    getBoardList({ userNickname, page: currentPage, viewer: common.viewer }),
    getBoardPageCount(userNickname, common.viewer),
  ]);

  return (
    <>
      <Stylesheets
        hrefs={['/resources/css/minihome/board.css', '/resources/css/minihome/album.css']}
      />
      <MiniHomeShell common={common}>
        <BoardListClient
          userNickname={userNickname}
          isOwner={common.isOwner}
          list={list.map((b) => ({
            seq: b.seq,
            userNickname: b.userNickname,
            title: b.title,
            hits: b.hits,
            newcontent: b.newcontent,
            commentCnt: b.commentCnt,
          }))}
          totalPage={totalPage}
        />
      </MiniHomeShell>
    </>
  );
}
