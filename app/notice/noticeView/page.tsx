import type { Metadata } from 'next';
import Stylesheets from '@/components/Stylesheets';
import Footer from '@/components/index/Footer';
import IndexHeader from '@/components/index/IndexHeader';
import NoticeListClient from '@/components/notice/NoticeListClient';
import { getSessionUser } from '@/lib/session';
import { ADMIN_NICKNAMES, getMyDotori, getNoticeList, getNoticePageCount } from '@/lib/db/repo';

export const metadata: Metadata = { title: '공지사항' };

/** 구 NoticeController.noticeView + views/notice/notice.jsp */
export default async function NoticeViewPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; msg?: string }>;
}) {
  const { page, msg } = await searchParams;
  const currentPage = Number(page) > 0 ? Number(page) : 1;

  const user = await getSessionUser();
  const dotori = user ? await getMyDotori(user.userNickname) : null;
  const isAdmin = Boolean(user && ADMIN_NICKNAMES.includes(user.userNickname));

  const [list, totalPage] = await Promise.all([
    getNoticeList({ page: currentPage }),
    getNoticePageCount(),
  ]);

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
        <NoticeListClient
          list={list.map((n) => ({ seq: n.seq, title: n.title, date: n.date }))}
          totalPage={totalPage}
          currentPage={currentPage}
          isAdmin={isAdmin}
          msg={msg ?? ''}
        />
        <div className="bottom-fix" />
      </div>
      <Footer />
    </>
  );
}
