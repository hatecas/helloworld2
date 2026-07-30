import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import Stylesheets from '@/components/Stylesheets';
import Footer from '@/components/index/Footer';
import IndexHeader from '@/components/index/IndexHeader';
import NoticeEditorClient from '@/components/notice/NoticeEditorClient';
import { getSessionUser } from '@/lib/session';
import { ADMIN_NICKNAMES, getMyDotori } from '@/lib/db/repo';

export const metadata: Metadata = { title: '공지사항 글쓰기' };

/** 구 NoticeController.noticeWrite + views/notice/noticeWrite.jsp */
export default async function NoticeWritePage() {
  const user = await getSessionUser();
  if (!user || !ADMIN_NICKNAMES.includes(user.userNickname)) {
    redirect(`/notice/noticeView?msg=${encodeURIComponent('권한이 없습니다.')}`);
  }

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
        <NoticeEditorClient mode="write" userNickname={user.userNickname} />
        <div className="bottom-fix" />
      </div>
      <Footer />
    </>
  );
}
