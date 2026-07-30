import { notFound, redirect } from 'next/navigation';

import Stylesheets from '@/components/Stylesheets';
import MiniHomeShell from '@/components/minihome/MiniHomeShell';
import SettingSideBox from '@/components/minihome/SettingSideBox';
import { loadMiniHomeCommon } from '@/lib/minihome';
import { selectDotoriUse } from '@/lib/db/repo';

/** 구 SettingController.settingDotoriUseView + views/miniHome/settingDotoriUse.jsp */
export default async function SettingDotoriUsePage({
  params,
}: {
  params: Promise<{ userNickname: string }>;
}) {
  const { userNickname: raw } = await params;
  const userNickname = decodeURIComponent(raw);

  const common = await loadMiniHomeCommon(userNickname);
  if (!common) notFound();
  if (!common.isOwner) redirect(`/mnHome/mainView/${userNickname}`);

  const dotoriUse = await selectDotoriUse(userNickname);

  return (
    <>
      <Stylesheets
        hrefs={['/resources/css/minihome/setting.css', '/resources/css/minihome/settingDotori.css']}
      />
      <MiniHomeShell
        common={common}
        profileSlot={<SettingSideBox common={common} active="dotoriUse" />}
      >
        <div className="set-dtr-use-frame">
          <div className="set-dtr-use-title">전체 사용내역</div>
          <div className="set-dtr-use-list">
            <div className="set-dtr-use-list-header">
              <table className="set-dtr-use-list-table">
                <thead>
                  <tr>
                    <th>카테고리</th>
                    <th>세부항목</th>
                    <th>사용 도토리</th>
                    <th>사용 일시</th>
                  </tr>
                </thead>
                <tbody>
                  {dotoriUse.map((row) => (
                    <tr key={row.seq}>
                      <td>{row.category}</td>
                      <td>{row.detail}</td>
                      <td>{row.dotoriUse}</td>
                      <td>{row.formattedDotoriUseDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </MiniHomeShell>
    </>
  );
}
