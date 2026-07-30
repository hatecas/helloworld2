import type { Metadata } from 'next';
import PopupResult from '@/components/minihome/PopupResult';

export const metadata: Metadata = { title: '미니미 설정' };

/** 구 views/miniHome/mnhMinimiChangeSuccess.jsp */
export default function MinimiChangeSuccessPage() {
  return (
    <PopupResult text="대표 미니미를 바꿨습니다" sub="미니홈피에 바로 반영됩니다." notifyOpener />
  );
}
