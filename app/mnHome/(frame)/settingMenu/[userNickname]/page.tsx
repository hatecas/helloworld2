import { notFound, redirect } from 'next/navigation';

import Stylesheets from '@/components/Stylesheets';
import MiniHomeShell from '@/components/minihome/MiniHomeShell';
import SettingSideBox from '@/components/minihome/SettingSideBox';
import SettingColorClient from '@/components/minihome/SettingColorClient';
import { loadMiniHomeCommon } from '@/lib/minihome';
import { getAppliedItem, selectUserStorage } from '@/lib/db/repo';

/** 구 SettingController.settingMenuView + views/miniHome/settingMenu.jsp */
export default async function SettingMenuPage({
  params,
}: {
  params: Promise<{ userNickname: string }>;
}) {
  const { userNickname: raw } = await params;
  const userNickname = decodeURIComponent(raw);

  const common = await loadMiniHomeCommon(userNickname);
  if (!common) notFound();
  if (!common.isOwner) redirect(`/mnHome/mainView/${userNickname}`);

  const [applied, owned] = await Promise.all([
    getAppliedItem(userNickname, 'menu'),
    selectUserStorage(userNickname, 'menu'),
  ]);

  return (
    <>
      <Stylesheets
        hrefs={['/resources/css/minihome/setting.css', '/resources/css/minihome/settingMenu.css']}
      />
      <MiniHomeShell common={common} profileSlot={<SettingSideBox common={common} active="menu" />}>
        <SettingColorClient
          variant="menu"
          applied={applied}
          owned={owned.map((s) => ({ productName: s.productName, contentPath: s.contentPath }))}
        />
      </MiniHomeShell>
    </>
  );
}
