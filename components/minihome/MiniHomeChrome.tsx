'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import AudioPlayer, { type Track } from '@/components/minihome/AudioPlayer';
import NotificationBell from '@/components/minihome/NotificationBell';
import { showAlert } from '@/lib/ui/dialog';

interface ChromeData {
  skinColor: string;
  playList: Track[];
  notices: Array<{ seq: number; title: string }>;
  lastPage: string | null;
  viewerNickname: string;
}

/** /mnHome/xxxView/{userNickname} 에서 닉네임만 뽑아낸다 */
function nicknameFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean); // ['mnHome', 'boardView', '제인', ...]
  return segments.length >= 3 ? decodeURIComponent(segments[2]) : '';
}

export default function MiniHomeChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const userNickname = nicknameFromPath(pathname);

  const [data, setData] = useState<ChromeData | null>(null);
  const [noticeIndex, setNoticeIndex] = useState(0);

  // 닉네임이 바뀔 때만 다시 불러온다 → 같은 홈피 안에서 탭을 옮기면 BGM 이 안 끊긴다
  useEffect(() => {
    if (!userNickname) return;
    let cancelled = false;

    fetch(`/api/mnHome/chrome?userNickname=${encodeURIComponent(userNickname)}`)
      .then((res) => res.json())
      .then((json: ChromeData) => {
        if (!cancelled) setData(json);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [userNickname]);

  // 팝업 창들이 닫히면서 window.opener.onChildButtonClick() / quickSetting() 을 부른다
  useEffect(() => {
    const refresh = () => router.refresh();
    const w = window as unknown as Record<string, () => void>;
    w.onChildButtonClick = refresh;
    w.quickSetting = refresh;
    return () => {
      delete w.onChildButtonClick;
      delete w.quickSetting;
    };
  }, [router]);

  // 하단 공지 롤링
  const noticeCount = data?.notices.length ?? 0;
  useEffect(() => {
    if (noticeCount === 0) return;
    const timer = window.setInterval(() => {
      setNoticeIndex((i) => (i + 1) % noticeCount);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [noticeCount]);

  const goToMyHome = () => {
    if (!data?.viewerNickname) {
      void showAlert('로그인이 필요합니다.');
      return;
    }
    router.push(`/mnHome/mainView/${data.viewerNickname}`);
  };

  const lastPage = () => {
    if (!data?.lastPage) {
      void showAlert('이전에 방문한 페이지가 없습니다.');
      return;
    }
    router.push(`/mnHome/mainView/${data.lastPage}`);
  };

  // 미니홈피는 팝업 창으로 열리므로, 로그아웃하면 부모 창도 같이 정리한다
  const logout = () => {
    const opener = window.opener as (Window & { reloadParentWindow?: () => void }) | null;
    if (opener && !opener.closed) {
      opener.reloadParentWindow?.();
      window.close();
      return;
    }
    window.location.href = '/index/member/logout';
  };

  const openNotice = (seq: number) => {
    const opener = window.opener as Window | null;
    if (opener && !opener.closed) {
      opener.location.href = `/notice/noticeDetail?seq=${seq}`;
    } else {
      window.open(`/notice/noticeDetail?seq=${seq}`, '_blank');
    }
  };

  return (
    <div className="main-frame-skin" style={{ backgroundColor: data?.skinColor }}>
      <div className="main-frame">
        {data?.viewerNickname && <NotificationBell />}
        {children}
        <AudioPlayer
          playlist={data?.playList ?? []}
          autoPlay={Boolean(userNickname) && data?.viewerNickname === userNickname}
        />
      </div>

      <div className="main-under-bar font-neo">
        <div className="main-udb-myhome">
          <input
            type="button"
            className="udb-myhome-a font-neo"
            value="내 미니홈피"
            onClick={goToMyHome}
          />
          {data?.viewerNickname && (
            <input
              type="button"
              className="udb-plaza-a font-neo"
              value="🌳 광장"
              onClick={() => {
                window.location.href = '/plaza';
              }}
            />
          )}
        </div>
        <div className="main-udb-notice">
          <div id="notice-container">
            <div className="rolling-notice-container">
              {(data?.notices ?? []).map((notice, i) => (
                <div
                  key={notice.seq}
                  className={i === noticeIndex ? 'rolling-notice active' : 'rolling-notice'}
                  id={i === noticeIndex ? 'rolling-notice-active' : undefined}
                  onClick={() => openNotice(notice.seq)}
                >
                  {notice.title}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="main-udb-past" onClick={lastPage}>
          이전에 방문한 홈피
        </div>
        <div className="main-udb-logout">
          <input type="button" className="udb-logout-a font-neo" value="로그아웃" onClick={logout} />
        </div>
      </div>
    </div>
  );
}
