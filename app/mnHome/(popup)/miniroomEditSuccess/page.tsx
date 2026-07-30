import type { Metadata } from 'next';
import PopupResult from '@/components/minihome/PopupResult';

export const metadata: Metadata = { title: '미니룸 설정' };

/** 구 views/miniHome/miniroomEditSuccess.jsp */
export default function MiniroomEditSuccessPage() {
  return (
    <PopupResult text="미니룸을 저장했습니다" sub="미니홈피에 바로 반영됩니다." notifyOpener />
  );
}
