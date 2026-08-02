import { notFound, redirect } from 'next/navigation';

import Stylesheets from '@/components/Stylesheets';
import MiniHomeShell from '@/components/minihome/MiniHomeShell';
import SettingSideBox from '@/components/minihome/SettingSideBox';
import SettingInfoClient from '@/components/minihome/SettingInfoClient';
import { loadMiniHomeCommon } from '@/lib/minihome';
import { getSessionUser } from '@/lib/session';
import {
  DEFAULT_MINIMI_PATH,
  getHomeOwnerInfo,
  selectPhone,
  selectUserInfo,
  selectUserMinimi,
} from '@/lib/db/repo';

/** 구 SettingController.settingView + views/miniHome/setting.jsp */
export default async function SettingViewPage({
  params,
}: {
  params: Promise<{ userNickname: string }>;
}) {
  const { userNickname: raw } = await params;
  const userNickname = decodeURIComponent(raw);

  const common = await loadMiniHomeCommon(userNickname);
  if (!common) notFound();
  if (!common.isOwner) redirect(`/mnHome/mainView/${userNickname}`);

  const viewer = await getSessionUser();
  const [phoneNumber, minimi, info, owner] = await Promise.all([
    selectPhone(userNickname),
    selectUserMinimi(userNickname),
    selectUserInfo({ userNickname }),
    getHomeOwnerInfo(userNickname),
  ]);

  return (
    <>
      <Stylesheets hrefs={['/resources/css/minihome/setting.css']} />
      <MiniHomeShell common={common} profileSlot={<SettingSideBox common={common} active="info" />}>
        <SettingInfoClient
          userNickname={userNickname}
          userEmail={viewer?.userEmail ?? ''}
          userName={common.userName}
          phoneNumber={phoneNumber}
          createDate={info?.createDate ?? ''}
          homeOpenScope={owner?.homeOpenScope ?? 1}
          minimi={minimi ?? DEFAULT_MINIMI_PATH}
        />
      </MiniHomeShell>
    </>
  );
}
