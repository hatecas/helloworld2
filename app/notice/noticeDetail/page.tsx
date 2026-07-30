import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import Stylesheets from '@/components/Stylesheets';
import Footer from '@/components/index/Footer';
import IndexHeader from '@/components/index/IndexHeader';
import NoticeDetailClient from '@/components/notice/NoticeDetailClient';
import { getSessionUser } from '@/lib/session';
import { ADMIN_NICKNAMES, getMyDotori, getNoticeList } from '@/lib/db/repo';

export const metadata: Metadata = { title: '공지사항' };

/** 구 NoticeController.noticeDetail + views/notice/noticeDetail.jsp */
export default async function NoticeDetailPage({
  searchParams,
}: {
  searchParams: Promise<{ seq?: string; msg?: string }>;
}) {
  const { seq, msg } = await searchParams;
  const seqNum = Number(seq);
  if (!Number.isFinite(seqNum)) notFound();

  const [notice] = await getNoticeList({ seq: seqNum });
  if (!notice) notFound();

  const user = await getSessionUser();
  const dotori = user ? await getMyDotori(user.userNickname) : null;
  const isAdmin = Boolean(user && ADMIN_NICKNAMES.includes(user.userNickname));

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
        <IndexHeader loggedIn={Boolean(user)} dotori={dotori} active="notice" />
        <NoticeDetailClient
          seq={notice.seq}
          title={notice.title}
          writer={notice.writer}
          date={notice.date}
          content={notice.content}
          isAdmin={isAdmin}
          msg={msg ?? ''}
        />
        <div className="bottom-fix" />
      </div>
      <Footer />
    </>
  );
}
