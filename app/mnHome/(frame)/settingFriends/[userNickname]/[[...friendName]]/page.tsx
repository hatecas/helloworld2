import { notFound, redirect } from 'next/navigation';

import Stylesheets from '@/components/Stylesheets';
import MiniHomeShell from '@/components/minihome/MiniHomeShell';
import SettingSideBox from '@/components/minihome/SettingSideBox';
import SettingFriendsClient from '@/components/minihome/SettingFriendsClient';
import { loadMiniHomeCommon } from '@/lib/minihome';
import { selectFriends } from '@/lib/db/repo';

/**
 * 구 SettingController.settingFriends
 * ("/mnHome/settingFriends/{userNickname}" 와 ".../{friendName}" 두 형태를 모두 받는다)
 */
export default async function SettingFriendsPage({
  params,
}: {
  params: Promise<{ userNickname: string; friendName?: string[] }>;
}) {
  const { userNickname: raw, friendName } = await params;
  const userNickname = decodeURIComponent(raw);
  const nameFilter = friendName?.[0] ? decodeURIComponent(friendName[0]) : '';

  const common = await loadMiniHomeCommon(userNickname);
  if (!common) notFound();
  if (!common.isOwner) redirect(`/mnHome/mainView/${userNickname}`);

  const friends = await selectFriends(userNickname, nameFilter || undefined);

  // 승인 / 내가 보낸 신청 / 내가 받은 신청 으로 나눈다 (구 컨트롤러의 bf / fReq / fRes)
  const bf = friends.filter((f) => f.fStatus === 1);
  const fReq = friends.filter((f) => f.fStatus === 0 && f.userNickname === userNickname);
  const fRes = friends.filter((f) => f.fStatus === 0 && f.friendNickname === userNickname);

  const withOther = (rows: typeof friends) =>
    rows.map((f) => ({
      seq: f.seq,
      userName: f.userName,
      createDate: f.createDate,
      otherNickname: f.userNickname === userNickname ? f.friendNickname : f.userNickname,
    }));

  return (
    <>
      <Stylesheets
        hrefs={[
          '/resources/css/minihome/setting.css',
          '/resources/css/minihome/settingFriends.css',
        ]}
      />
      <MiniHomeShell
        common={common}
        profileSlot={<SettingSideBox common={common} active="friends" />}
      >
        <SettingFriendsClient
          userNickname={userNickname}
          searchName={nameFilter}
          bf={withOther(bf)}
          fReq={withOther(fReq)}
          fRes={withOther(fRes)}
        />
      </MiniHomeShell>
    </>
  );
}
