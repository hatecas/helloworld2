import type { Metadata } from 'next';
import PopupResult from '@/components/minihome/PopupResult';

export const metadata: Metadata = { title: '프로필 수정' };

/** 구 ProfileController.mnhProfileEditSuccess + views/miniHome/mnhProfileEditSuccess.jsp */
export default function ProfileEditSuccessPage() {
  return (
    <PopupResult text="프로필이 저장되었습니다" sub="미니홈피에 바로 반영됩니다." notifyOpener />
  );
}
