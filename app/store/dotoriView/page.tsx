import type { Metadata } from 'next';
import Stylesheets from '@/components/Stylesheets';
import Footer from '@/components/index/Footer';
import IndexHeader from '@/components/index/IndexHeader';
import StoreTabs from '@/components/store/StoreTabs';
import DotoriProductsClient from '@/components/store/DotoriProductsClient';
import { getSessionUser } from '@/lib/session';
import { getMyDotori } from '@/lib/db/repo';

export const metadata: Metadata = { title: '상점 · 도토리' };

/** 구 StoreController.dotori + views/store/dotori.jsp */
export default async function StoreDotoriPage() {
  const user = await getSessionUser();
  const dotori = user ? await getMyDotori(user.userNickname) : null;

  return (
    <>
      <Stylesheets hrefs={['/resources/css/index/main.css', '/resources/css/index/store.css']} />
      <div className="index-frame">
        <IndexHeader loggedIn={Boolean(user)} dotori={dotori} active="store" />
        <StoreTabs active="dotori" />
        <DotoriProductsClient />
      </div>
      <Footer />
    </>
  );
}
