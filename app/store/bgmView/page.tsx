import type { Metadata } from 'next';
import Stylesheets from '@/components/Stylesheets';
import Footer from '@/components/index/Footer';
import IndexHeader from '@/components/index/IndexHeader';
import StoreTabs from '@/components/store/StoreTabs';
import BgmListClient from '@/components/store/BgmListClient';
import { getSessionUser } from '@/lib/session';
import { getBgmList, getMyDotori } from '@/lib/db/repo';

export const metadata: Metadata = { title: '상점 · BGM' };

/** 구 StoreController.getBgmList + views/store/bgm.jsp */
export default async function StoreBgmPage() {
  const user = await getSessionUser();
  const dotori = user ? await getMyDotori(user.userNickname) : null;
  const bgmList = await getBgmList();

  return (
    <>
      <Stylesheets
        hrefs={[
          '/resources/css/index/main.css',
          '/resources/css/index/store.css',
          '/resources/css/index/bgm.css',
        ]}
      />
      <div className="index-frame">
        <IndexHeader loggedIn={Boolean(user)} dotori={dotori} active="store" />
        <StoreTabs active="bgm" />
        <BgmListClient initialList={bgmList} />
      </div>
      <div className="bottom-fix" />
      <Footer />
    </>
  );
}
