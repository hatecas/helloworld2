import type { Metadata } from 'next';
import Stylesheets from '@/components/Stylesheets';
import MiniroomEditClient from '@/components/minihome/MiniroomEditClient';
import PopupResult from '@/components/minihome/PopupResult';
import { getSessionUser } from '@/lib/session';
import { getOwnedMinimi } from '@/lib/db/repo';

export const metadata: Metadata = { title: '미니룸 설정' };

/** 구 MainController.miniroomEdit + views/miniHome/miniroomEdit.jsp (팝업) */
export default async function MiniroomEditPage() {
  const user = await getSessionUser();

  return (
    <>
      <Stylesheets
        hrefs={[
          '/resources/css/minihome/fonts.css',
          '/resources/css/minihome/miniroomEdit.css',
        ]}
      />
      <div className="mnr-frame">
        {!user ? (
          <PopupResult tone="fail" text="로그인이 필요합니다" sub="로그인 후 다시 열어주세요." />
        ) : (
          <MiniroomEditClient
            minimi={(await getOwnedMinimi(user.userNickname)).map((m) => m.contentPath)}
          />
        )}
      </div>
    </>
  );
}
