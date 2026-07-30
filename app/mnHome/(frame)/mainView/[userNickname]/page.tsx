import { notFound, redirect } from 'next/navigation';

import Stylesheets from '@/components/Stylesheets';
import MiniHomeShell from '@/components/minihome/MiniHomeShell';
import MainContent from '@/components/minihome/MainContent';
import { getSessionUser } from '@/lib/session';
import { loadMiniHomeCommon } from '@/lib/minihome';
import {
  friendCheck,
  selectCurrentContent,
  selectFriendCmt,
  selectMiniroomBackground,
  selectMiniroomMinimi,
  tabs,
  updateVisitCnt,
} from '@/lib/db/repo';

// 방문자 수를 매 요청마다 올리므로 캐시하지 않는다
export const dynamic = 'force-dynamic';

/** 구 MainController.mainView + views/miniHome/main.jsp */
export default async function MainViewPage({
  params,
}: {
  params: Promise<{ userNickname: string }>;
}) {
  const { userNickname: raw } = await params;
  const userNickname = decodeURIComponent(raw);

  const viewer = await getSessionUser();
  if (!viewer) {
    redirect(`/?msg=${encodeURIComponent('로그인이 필요합니다.')}`);
  }

  // 방문자 수 증가 (구 MainServiceImpl.updateVisitCnt)
  const visit = await updateVisitCnt(userNickname);

  const common = await loadMiniHomeCommon(userNickname);
  if (!common) notFound();

  const [tabCounts, current, minimiList, background, friendCmtList] = await Promise.all([
    tabs(userNickname),
    selectCurrentContent(userNickname),
    selectMiniroomMinimi(userNickname),
    selectMiniroomBackground(userNickname),
    selectFriendCmt(userNickname),
  ]);

  // 0 = 일촌 아님, 1 = 일촌, 2 = 본인
  const check =
    userNickname === viewer.userNickname
      ? 2
      : await friendCheck(userNickname, viewer.userNickname);

  const news = current.map((row) => ({
    seq: row.seq,
    tableName: row.tableName === 'album' ? '사진첩' : '게시판',
    category: row.tableName === 'album' ? 'news-category category-pic' : 'news-category category-post',
    url:
      row.tableName === 'album'
        ? `/mnHome/albumDetailView/${userNickname}/${row.seq}`
        : `/mnHome/boardDetail/${userNickname}/${row.seq}`,
    title: row.title.length > 12 ? `${row.title.slice(0, 12)}...` : row.title,
  }));

  return (
    <>
      <Stylesheets hrefs={['/resources/css/minihome/miniroom.css']} />
      <MiniHomeShell common={{ ...common, todayCnt: visit.todayCnt, totalCnt: visit.totalCnt }}>
        <MainContent
          common={common}
          tabs={tabCounts}
          news={news}
          minimiList={minimiList}
          backgroundPath={background.backgroundPath}
          friendCheck={check}
          friendCmtList={friendCmtList}
        />
      </MiniHomeShell>
    </>
  );
}
