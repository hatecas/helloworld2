import type { Metadata } from 'next';
import PurchaseResult from '@/components/store/PurchaseResult';

export const metadata: Metadata = { title: '구매 완료' };

/** 구 views/store/bgmBuySuccess.jsp */
export default function BgmBuySuccessPage() {
  return <PurchaseResult />;
}
