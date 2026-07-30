import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import Stylesheets from '@/components/Stylesheets';
import Footer from '@/components/index/Footer';
import IndexHeader from '@/components/index/IndexHeader';
import NoticeEditorClient from '@/components/notice/NoticeEditorClient';
import { getSessionUser } from '@/lib/session';
import { ADMIN_NICKNAMES, getMyDotori, getNoticeList } from '@/lib/db/repo';

export const metadata: Metadata = { title: '공지사항 수정' };

/**
 * 구 NoticeController.modifyView + views/notice/noticeModify.jsp
 *
 * 원래는 상세 화면에서 제목/본문을 hidden form 으로 POST 해서 열었는데,
 * seq 만 넘기고 서버에서 다시 읽어오도록 정리했다 (URL 을 새로고침해도 동작한다).
 */
export default async function NoticeModifyPage({
  searchParams,
}: {
  searchParams: Promise<{ seq?: string }>;
}) {
  const { seq } = await searchParams;
  const seqNum = Number(seq);
  if (!Number.isFinite(seqNum)) notFound();

  const user = await getSessionUser();
  if (!user || !ADMIN_NICKNAMES.includes(user.userNickname)) {
    redirect(`/notice/noticeView?msg=${encodeURIComponent('권한이 없습니다.')}`);
  }

  const [notice] = await getNoticeList({ seq: seqNum });
  if (!notice) notFound();

  const dotori = await getMyDotori(user.userNickname);

  return (
    <>
      <Stylesheets
        hrefs={[
          '/resources/css/index/main.css',
          '/resources/css/index/store.css',
          '/resources/css/index/notice.css',
        ]}
      />
      <div className="index-frame">
        <IndexHeader loggedIn dotori={dotori} active="notice" />
        <NoticeEditorClient
          mode="modify"
          userNickname={user.userNickname}
          seq={notice.seq}
          title={notice.title}
          content={notice.content}
        />
        <div className="bottom-fix" />
      </div>
      <Footer />
    </>
  );
}
