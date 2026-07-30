import { notFound, redirect } from 'next/navigation';

import Stylesheets from '@/components/Stylesheets';
import MiniHomeShell from '@/components/minihome/MiniHomeShell';
import SettingSideBox from '@/components/minihome/SettingSideBox';
import SettingBgmClient from '@/components/minihome/SettingBgmClient';
import { loadMiniHomeCommon } from '@/lib/minihome';
import { selectMyBgm } from '@/lib/db/repo';

/** 구 SettingController.settingBgmView + views/miniHome/settingBgm.jsp */
export default async function SettingBgmPage({
  params,
}: {
  params: Promise<{ userNickname: string }>;
}) {
  const { userNickname: raw } = await params;
  const userNickname = decodeURIComponent(raw);

  const common = await loadMiniHomeCommon(userNickname);
  if (!common) notFound();
  if (!common.isOwner) redirect(`/mnHome/mainView/${userNickname}`);

  const myBgm = await selectMyBgm(userNickname);

  return (
    <>
      <Stylesheets hrefs={['/resources/css/minihome/setting.css']} />
      <MiniHomeShell common={common} profileSlot={<SettingSideBox common={common} active="bgm" />}>
        <SettingBgmClient
          userNickname={userNickname}
          playList={myBgm.filter((b) => b.allocation === 1)}
          ownedList={myBgm}
        />
      </MiniHomeShell>
    </>
  );
}
