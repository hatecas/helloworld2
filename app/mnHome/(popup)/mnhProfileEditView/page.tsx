import type { Metadata } from 'next';
import Stylesheets from '@/components/Stylesheets';
import ProfileEditClient from '@/components/minihome/ProfileEditClient';

export const metadata: Metadata = { title: '프로필 수정' };

/** 구 MainController.mnhProfileEdit + views/miniHome/mnhProfileEdit.jsp (팝업 창) */
export default function ProfileEditPage() {
  return (
    <>
      <Stylesheets hrefs={['/resources/css/minihome/mnhProfileEdit.css']} />
      <ProfileEditClient />
    </>
  );
}
