import type { Metadata } from 'next';
import Stylesheets from '@/components/Stylesheets';
import Footer from '@/components/index/Footer';
import IndexHeader from '@/components/index/IndexHeader';
import StoreTabs from '@/components/store/StoreTabs';
import StoreProductsClient from '@/components/store/StoreProductsClient';
import { getSessionUser } from '@/lib/session';
import { getMyDotori } from '@/lib/db/repo';
import { MENU_COLORS } from '@/lib/db/seed';

export const metadata: Metadata = { title: '상점 · 메뉴' };

/** 구 StoreController.menu + views/store/menu.jsp */
export default async function StoreMenuPage() {
  const user = await getSessionUser();
  const dotori = user ? await getMyDotori(user.userNickname) : null;

  return (
    <>
      <Stylesheets
        hrefs={['/resources/css/index/main.css', '/resources/css/index/storeMMS.css']}
      />
      <div className="index-frame">
        <IndexHeader loggedIn={Boolean(user)} dotori={dotori} active="store" />
        <StoreTabs active="menu" />
        <StoreProductsClient
          title="메뉴 상품 목록"
          variant="color"
          products={MENU_COLORS.filter((c) => c.name !== '기본 메뉴').map((c) => ({
            cate: '메뉴',
            tableCate: 'menu' as const,
            name: c.name,
            contentPath: c.value,
            price: c.price,
          }))}
        />
      </div>
      <Footer />
    </>
  );
}
