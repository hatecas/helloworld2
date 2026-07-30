import type { Metadata } from 'next';
import Stylesheets from '@/components/Stylesheets';
import OrderClient from '@/components/store/OrderClient';
import { getSessionUser } from '@/lib/session';

export const metadata: Metadata = { title: '도토리 충전' };

/** 구 StoreController.orderView + views/store/order.jsp (도토리 충전 결제창) */
export default async function OrderViewPage({
  searchParams,
}: {
  searchParams: Promise<{ selectedProduct?: string }>;
}) {
  const { selectedProduct } = await searchParams;
  const user = await getSessionUser();

  return (
    <>
      <Stylesheets
        hrefs={['/resources/css/index/order.css', '/resources/css/index/bgm.css']}
      />
      <OrderClient
        selectedProduct={Number(selectedProduct) || 0}
        loggedIn={Boolean(user)}
      />
    </>
  );
}
