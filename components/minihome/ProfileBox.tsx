'use client';

import ProfileIdentity from '@/components/minihome/ProfileIdentity';
import { openMiniPopup } from '@/lib/ui/popup';
import type { MiniHomeCommon } from '@/lib/minihome-view';

/**
 * 미니홈피 좌측 프로필 칸.
 * main / board / diary / album / visit JSP 에 그대로 복붙돼 있던 부분이다.
 */
export default function ProfileBox({ common }: { common: MiniHomeCommon }) {
  const openNewWindow = (url: string, settings: string) => openMiniPopup(url, settings);

  return (
    <div className="box profile-box">
      <div className="left-1">
        <div className="profile-image">
          <img
            className="profile-image-img"
            src={`/resources/images/download/${common.image}`}
            alt="프로필 이미지"
            onError={(e) => {
              // 기본 프로필 이미지는 download 가 아니라 default 폴더에 있다
              e.currentTarget.onerror = null;
              e.currentTarget.src = `/resources/images/default/${common.image}`;
            }}
          />
        </div>
      </div>

      <div className="profile-dot">-----------------------------------</div>

      <div className="left-2">
        <div
          className="profile-text font-kyobohand"
          dangerouslySetInnerHTML={{ __html: common.msg }}
        />
        <div className="profile-history">
          {common.isOwner && (
            <a
              className="profile-edit"
              onClick={() =>
                openNewWindow(
                  '/mnHome/mnhProfileEditView',
                  'width=460, height=570, scrollbars=no, resizable=no, toolbars=no, menubar=no, left=100, top=50',
                )
              }
            >
              Edit
            </a>
          )}
          <a
            className="profile-hs"
            onClick={() =>
              openNewWindow(
                `/mnHome/miniroomHistoryView?targetNickname=${encodeURIComponent(common.userNickname)}`,
                'width=800, height=600, scrollbars=no, resizable=no, toolbars=no, menubar=no, left=100, top=50',
              )
            }
          >
            History
          </a>
        </div>
      </div>

      <div className="profile-dot">-----------------------------------</div>

      <ProfileIdentity common={common} />
    </div>
  );
}
