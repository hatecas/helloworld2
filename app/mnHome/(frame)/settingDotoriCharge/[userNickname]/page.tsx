import { notFound, redirect } from 'next/navigation';

import Stylesheets from '@/components/Stylesheets';
import MiniHomeShell from '@/components/minihome/MiniHomeShell';
import SettingSideBox from '@/components/minihome/SettingSideBox';
import { loadMiniHomeCommon } from '@/lib/minihome';
import { selectDotoriCharge } from '@/lib/db/repo';

/** 구 SettingController.settingDotoriChargeView + views/miniHome/settingDotoriCharge.jsp */
export default async function SettingDotoriChargePage({
  params,
}: {
  params: Promise<{ userNickname: string }>;
}) {
  const { userNickname: raw } = await params;
  const userNickname = decodeURIComponent(raw);

  const common = await loadMiniHomeCommon(userNickname);
  if (!common) notFound();
  if (!common.isOwner) redirect(`/mnHome/mainView/${userNickname}`);

  const dotoriCharge = await selectDotoriCharge(userNickname);

  return (
    <>
      <Stylesheets
        hrefs={['/resources/css/minihome/setting.css', '/resources/css/minihome/settingDotori.css']}
      />
      <MiniHomeShell
        common={common}
        profileSlot={<SettingSideBox common={common} active="dotoriCharge" />}
      >
        <div className="set-dtr-use-frame">
          <div className="set-dtr-use-title">전체 충전내역</div>
          <div className="set-dtr-use-list">
            <div className="set-dtr-use-list-header">
              <table className="set-dtr-use-list-table">
                <thead>
                  <tr>
                    <th>충전 일시</th>
                    <th>충전 도토리</th>
                    <th>충전 금액</th>
                    <th>결제 방식</th>
                  </tr>
                </thead>
                <tbody>
                  {dotoriCharge.map((row) => (
                    <tr key={row.seq}>
                      <td>{row.formattedDotoriChargeDate}</td>
                      <td>{row.dotoriCharge}</td>
                      <td>{row.dotoriPrice}</td>
                      <td>{row.dotoriChargeMethod}</td>
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
