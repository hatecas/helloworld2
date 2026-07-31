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
          // 보유 BGM 은 아직 재생목록에 없는 곡만 (allocation 0).
          // 예전엔 전체를 넘겨, 재생목록에 넣은 곡이 양쪽 목록에 동시에 떠서 두 개로 보였다.
          ownedList={myBgm.filter((b) => b.allocation === 0)}
        />
      </MiniHomeShell>
    </>
  );
}
