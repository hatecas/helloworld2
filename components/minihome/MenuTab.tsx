'use client';

import { useRouter } from 'next/navigation';

import { menuBackgroundColor, menuTextColor } from '@/lib/minihome-view';

/**
 * views/miniHome/menuTab.jsp
 *
 * 원본은 ajaxTab.js 로 .bookcover 안쪽만 갈아끼웠다. Next.js 의 클라이언트 라우팅이
 * 정확히 같은 일을 해 주므로 (레이아웃이 유지되어 BGM 이 끊기지 않는다) router.push 로 옮겼다.
 */
export default function MenuTab({
  userNickname,
  isOwner,
  menuContentPath,
}: {
  userNickname: string;
  isOwner: boolean;
  menuContentPath: string;
}) {
  const router = useRouter();

  const background = menuBackgroundColor(menuContentPath);
  const color = menuTextColor(menuContentPath);

  const tabs: Array<{ id: string; label: string; href: string; ownerOnly?: boolean }> = [
    { id: 'tabHome', label: '홈', href: `/mnHome/mainView/${userNickname}` },
    { id: 'tabDiary', label: '다이어리', href: `/mnHome/diaryView/${userNickname}` },
    { id: 'tabAlbum', label: '사진첩', href: `/mnHome/albumView/${userNickname}` },
    { id: 'tabBoard', label: '게시판', href: `/mnHome/boardView/${userNickname}` },
    { id: 'tabVisit', label: '방명록', href: `/mnHome/visitView/${userNickname}` },
    { id: 'tabSetting', label: '관리', href: `/mnHome/settingView/${userNickname}`, ownerOnly: true },
  ];

  return (
    <div className="menu-container">
      {tabs
        .filter((tab) => !tab.ownerOnly || isOwner)
        .map((tab) => (
          <div
            key={tab.id}
            id={tab.id}
            className="menu-content"
            data-tab={tab.href}
            style={{ backgroundColor: background }}
            onMouseEnter={() => router.prefetch(tab.href)}
            onClick={() => router.push(tab.href)}
          >
            <span className="menu-content-span" style={{ color }}>
              {tab.label}
            </span>
          </div>
        ))}
    </div>
  );
}
