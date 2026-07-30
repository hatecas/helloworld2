import type { Metadata } from 'next';
import Stylesheets from '@/components/Stylesheets';
import Footer from '@/components/index/Footer';
import IndexHeader from '@/components/index/IndexHeader';
import StoreTabs from '@/components/store/StoreTabs';
import StoreProductsClient from '@/components/store/StoreProductsClient';
import { getSessionUser } from '@/lib/session';
import { getMyDotori } from '@/lib/db/repo';
import { SKIN_COLORS } from '@/lib/db/seed';

export const metadata: Metadata = { title: '상점 · 스킨' };

/** 구 StoreController.skin + views/store/skin.jsp (상품 목록이 JSP 에 하드코딩돼 있었다) */
export default async function StoreSkinPage() {
  const user = await getSessionUser();
  const dotori = user ? await getMyDotori(user.userNickname) : null;

  return (
    <>
      <Stylesheets
        hrefs={['/resources/css/index/main.css', '/resources/css/index/storeMMS.css']}
      />
      <div className="index-frame">
        <IndexHeader loggedIn={Boolean(user)} dotori={dotori} active="store" />
        <StoreTabs active="skin" />
        <StoreProductsClient
          title="스킨 상품 목록"
          variant="color"
          products={SKIN_COLORS.filter((c) => c.name !== '기본 스킨').map((c) => ({
            cate: '스킨',
            tableCate: 'skin' as const,
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
