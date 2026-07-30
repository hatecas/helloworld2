import type { Metadata } from 'next';
import Stylesheets from '@/components/Stylesheets';
import MinimiChangeClient from '@/components/minihome/MinimiChangeClient';
import { getSessionUser } from '@/lib/session';
import { selectUserStorage } from '@/lib/db/repo';

export const metadata: Metadata = { title: '미니미 설정' };

/** 구 SettingController.selectSettingUserStorage + views/miniHome/mnhMinimiChange.jsp (팝업) */
export default async function MinimiChangePage() {
  const user = await getSessionUser();
  const items = user ? await selectUserStorage(user.userNickname, 'minimi') : [];

  return (
    <>
      <Stylesheets hrefs={['/resources/css/minihome/minimiChange.css']} />
      <MinimiChangeClient
        items={items.map((i) => ({
          productName: i.productName,
          contentPath: i.contentPath,
          allocation: i.allocation,
        }))}
      />
    </>
  );
}
