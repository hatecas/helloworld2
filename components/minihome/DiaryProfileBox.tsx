'use client';

import ProfileIdentity from '@/components/minihome/ProfileIdentity';
import Calendar from '@/components/minihome/Calendar';
import type { MiniHomeCommon } from '@/lib/minihome-view';

/**
 * 다이어리 화면의 좌측 칸.
 * 프로필 사진 자리에 달력이 들어가는 것만 빼면 ProfileBox 와 같다 (구 diary.jsp).
 * 달력에서 날짜를 고르면 DiaryClient 가 window 이벤트로 받아 처리한다.
 */
export default function DiaryProfileBox({ common }: { common: MiniHomeCommon }) {
  const openNewWindow = (url: string, settings: string) => window.open(url, '_blank', settings);

  return (
    <div className="box profile-box diary-box">
      <div className="profile-image">
        <Calendar
          id="datepicker"
          inline
          onSelect={(isoDate) =>
            window.dispatchEvent(new CustomEvent('diary:selectDate', { detail: isoDate }))
          }
        />
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
