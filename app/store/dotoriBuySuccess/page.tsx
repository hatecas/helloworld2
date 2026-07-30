import type { Metadata } from 'next';
import PurchaseResult from '@/components/store/PurchaseResult';

export const metadata: Metadata = { title: '충전 완료' };

/** 구 views/store/dotoriBuySuccess.jsp */
export default function DotoriBuySuccessPage() {
  return <PurchaseResult />;
}
