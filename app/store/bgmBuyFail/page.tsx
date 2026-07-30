import type { Metadata } from 'next';
import PurchaseResult from '@/components/store/PurchaseResult';

export const metadata: Metadata = { title: '구매 실패' };

/** 구 views/store/bgmBuyFail.jsp */
export default async function BgmBuyFailPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  return <PurchaseResult reason={reason ?? ''} />;
}
