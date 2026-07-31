import { notFound, redirect } from 'next/navigation';
import { after } from 'next/server';

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

  const isSelf = userNickname === viewer.userNickname;

  // 예전에는 방문자수 증가(select+update) → 공통 조회 → 콘텐츠 조회 → 일촌확인 을
  // 순차적으로 기다려 왕복이 여러 겹 쌓였다. 서로 독립인 조회들을 한 번에 병렬로 돌린다.
  const [common, tabCounts, current, minimiList, background, friendCmtList, check] =
    await Promise.all([
      loadMiniHomeCommon(userNickname),
      tabs(userNickname),
      selectCurrentContent(userNickname),
      selectMiniroomMinimi(userNickname),
      selectMiniroomBackground(userNickname),
      selectFriendCmt(userNickname),
      // 0 = 일촌 아님, 1 = 일촌, 2 = 본인
      isSelf ? Promise.resolve(2) : friendCheck(userNickname, viewer.userNickname),
    ]);

  if (!common) notFound();

  // 방문자 수 증가는 화면 렌더를 막지 않도록 응답 이후로 미룬다 (구 updateVisitCnt).
  // 화면에는 이미 조회한 값에 +1 한 낙관적 수치를 보여 준다.
  const todayCnt = common.todayCnt + 1;
  const totalCnt = common.totalCnt + 1;
  after(() => updateVisitCnt(userNickname));

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
      <MiniHomeShell common={{ ...common, todayCnt, totalCnt }}>
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
