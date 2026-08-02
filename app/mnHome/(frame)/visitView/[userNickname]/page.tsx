import { notFound } from 'next/navigation';

import Stylesheets from '@/components/Stylesheets';
import MiniHomeShell from '@/components/minihome/MiniHomeShell';
import VisitClient from '@/components/minihome/VisitClient';
import { loadMiniHomeCommon } from '@/lib/minihome';
import { getSessionUser } from '@/lib/session';
import {
  DEFAULT_MINIMI_PATH,
  selectUserMinimi,
  selectVisitComments,
  selectVisitCount,
  visitPageCount,
} from '@/lib/db/repo';

/** 구 VisitController.visitView + views/miniHome/visit.jsp */
export default async function VisitViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ userNickname: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { userNickname: raw } = await params;
  const { page } = await searchParams;
  const userNickname = decodeURIComponent(raw);
  const currentPage = Number(page) > 0 ? Number(page) : 1;

  const common = await loadMiniHomeCommon(userNickname);
  if (!common) notFound();

  const viewer = await getSessionUser();
  const [totalCnt, visits, viewerMinimi, ownerMinimi] = await Promise.all([
    selectVisitCount(userNickname, common.viewer, common.viewerNickname),
    selectVisitComments(userNickname, common.viewer, common.viewerNickname, currentPage),
    viewer ? selectUserMinimi(viewer.userNickname) : Promise.resolve(null),
    selectUserMinimi(userNickname),
  ]);

  return (
    <>
      <Stylesheets hrefs={['/resources/css/minihome/visit.css']} />
      <MiniHomeShell common={common}>
        <VisitClient
          userNickname={userNickname}
          viewerNickname={viewer?.userNickname ?? ''}
          viewerMinimi={viewerMinimi ?? DEFAULT_MINIMI_PATH}
          ownerName={common.userName}
          ownerMinimi={ownerMinimi ?? DEFAULT_MINIMI_PATH}
          visits={visits.map((v) => ({
            ...v,
            // 구 컨트롤러가 하던 개행 → <br> 치환
            contentHtml: v.content.replace(/\n/g, '<br>'),
          }))}
          totalPage={visitPageCount(totalCnt)}
        />
      </MiniHomeShell>
    </>
  );
}
