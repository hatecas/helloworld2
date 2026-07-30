import type { ReactNode } from 'react';

import ContentTitle from '@/components/minihome/ContentTitle';
import MenuTab from '@/components/minihome/MenuTab';
import ProfileBox from '@/components/minihome/ProfileBox';
import type { MiniHomeCommon } from '@/lib/minihome-view';

/**
 * 미니홈피 한 페이지의 뼈대 (.bookcover > .bookdot > .page).
 *
 * 구 JSP 들은 이 마크업을 파일마다 통째로 복사해 갖고 있었다.
 * ajaxTab.js 가 .bookcover 안쪽만 교체했던 것과 동일하게, 이 컴포넌트가
 * 페이지 전환 시 교체되는 범위가 된다. 바깥 프레임(스킨/BGM/하단바)은
 * app/mnHome/layout.tsx 가 유지하므로 탭을 옮겨도 음악이 끊기지 않는다.
 */
export default function MiniHomeShell({
  common,
  profileSlot,
  children,
}: {
  common: MiniHomeCommon;
  /** 관리 화면처럼 좌측 칸을 통째로 바꿔 끼울 때 사용 */
  profileSlot?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="bookcover">
      <div className="bookdot">
        <div className="page">
          <div className="profile-container">
            <div className="header profile-title font-neo">
              TODAY&nbsp;<span className="today-span">{common.todayCnt}</span>&nbsp;| TOTAL{' '}
              {common.totalCnt}
            </div>
            {profileSlot ?? <ProfileBox common={common} />}
          </div>

          <div className="content-container">
            <ContentTitle
              userNickname={common.userNickname}
              title={common.title}
              isOwner={common.isOwner}
            />
            <div className="box content-box">{children}</div>
          </div>

          <MenuTab
            userNickname={common.userNickname}
            isOwner={common.isOwner}
            menuContentPath={common.menuContentPath}
          />
        </div>
      </div>
    </div>
  );
}
