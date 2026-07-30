import type { Metadata } from 'next';
import Stylesheets from '@/components/Stylesheets';
import Footer from '@/components/index/Footer';
import IndexHeader from '@/components/index/IndexHeader';
import StoreTabs from '@/components/store/StoreTabs';
import StoreProductsClient from '@/components/store/StoreProductsClient';
import { getSessionUser } from '@/lib/session';
import { getMyDotori, getStoreItems, getStorePageCount } from '@/lib/db/repo';

export const metadata: Metadata = { title: '상점 · 미니미' };

/** 구 StoreController.selectStoreList + views/store/minimi.jsp */
export default async function StoreMinimiPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Number(page) > 0 ? Number(page) : 1;

  const user = await getSessionUser();
  const dotori = user ? await getMyDotori(user.userNickname) : null;

  const [items, totalPage] = await Promise.all([
    getStoreItems('minimi', currentPage),
    getStorePageCount('minimi'),
  ]);

  return (
    <>
      <Stylesheets
        hrefs={[
          '/resources/css/index/main.css',
          '/resources/css/index/storeMMS.css',
          '/resources/css/minihome/fonts.css',
        ]}
      />
      <div className="index-frame">
        <IndexHeader loggedIn={Boolean(user)} dotori={dotori} active="store" />
        <StoreTabs active="minimi" />
        <StoreProductsClient
          title="미니미 상품 목록"
          variant="minimi"
          products={items.map((item) => ({
            cate: '미니미',
            tableCate: 'minimi' as const,
            name: item.productName,
            contentPath: item.contentPath,
            price: item.productPrice,
          }))}
          totalPage={totalPage}
          currentPage={currentPage}
          pageBaseUrl="/store/minimiView"
        />
      </div>
      <Footer />
    </>
  );
}
