import type { Metadata } from 'next';
import Stylesheets from '@/components/Stylesheets';
import PopupResult from '@/components/minihome/PopupResult';
import { getSessionUser } from '@/lib/session';
import { getProfileHistory } from '@/lib/db/repo';

export const metadata: Metadata = { title: '프로필 히스토리' };

/** 구 MainController.mnhProfileHistory + views/miniHome/mnhProfileHistory.jsp (팝업) */
export default async function MiniroomHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ targetNickname?: string }>;
}) {
  const { targetNickname } = await searchParams;
  const user = await getSessionUser();

  if (!user) {
    return (
      <>
        <Stylesheets hrefs={['/resources/css/minihome/mnhProfileEdit.css']} />
        <PopupResult tone="fail" text="로그인이 필요합니다" sub="로그인 후 다시 열어주세요." />
      </>
    );
  }

  const history = targetNickname ? await getProfileHistory(targetNickname) : [];

  return (
    <>
      <Stylesheets hrefs={['/resources/css/minihome/mnhProfileEdit.css']} />
      <div className="edit-frame">
        {history.length === 0 && (
          <div className="history-fail">
            <div className="fail-text">히스토리가 존재하지 않습니다.</div>
          </div>
        )}
        {history.map((profile) => (
          <div className="profile-history" key={profile.seq}>
            <div className="history-date">{profile.create_date}</div>
            <div className="history-image">
              <img
                src={`/resources/images/download/${profile.image}`}
                alt="프로필"
                // 기본 프로필 이미지는 default 폴더에 있다
                // eslint-disable-next-line react/no-unknown-property
                data-fallback={`/resources/images/default/${profile.image}`}
              />
            </div>
            <div
              className="history-msg"
              dangerouslySetInnerHTML={{ __html: (profile.msg ?? '').replace(/\n/g, '<br>') }}
            />
          </div>
        ))}
      </div>
    </>
  );
}
