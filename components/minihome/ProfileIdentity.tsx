'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { MiniHomeCommon } from '@/lib/minihome-view';
import { showAlert, showConfirm } from '@/lib/ui/dialog';

/**
 * 프로필 칸 맨 아래 블록 (홈피 주인 이름 + 일촌신청 팝업 + 파도타기 셀렉트).
 * main / board / diary / … / settingSkin 이 전부 같은 마크업을 갖고 있어 따로 뺐다.
 */
export default function ProfileIdentity({ common }: { common: MiniHomeCommon }) {
  const router = useRouter();
  const [popupOpen, setPopupOpen] = useState(false);

  const requestFriendship = async () => {
    if (!common.viewerNickname) {
      void showAlert('로그인이 필요합니다.');
      return;
    }
    if (!await showConfirm(`${common.userNickname}님께 일촌신청을 보내겠습니까?`)) return;

    try {
      const res = await fetch('/mnHome/friendRequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestUser: common.viewerNickname,
          responseUser: common.userNickname,
        }),
      });
      const data = (await res.json()) as { code?: string };
      if (data.code === '1') void showAlert('일촌신청을 보냈습니다.');
      else if (data.code === '-1') void showAlert('이미 신청 내역이 있습니다.');
      else void showAlert('잠시 후 다시 시도해주세요.');
    } catch {
      void showAlert('잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <div className="left-3">
      <div
        className="profile-username font-kyobohand mainpopup"
        onClick={() => setPopupOpen((v) => !v)}
      >
        {!common.isOwner && (
          <div
            className={popupOpen ? 'mainpopuptext show' : 'mainpopuptext'}
            id="myPopup"
            onClick={(e) => {
              e.stopPropagation();
              void requestFriendship();
            }}
          >
            일촌신청
          </div>
        )}
        {common.userName}
        {common.userGender === 'M' ? '👦' : '👧'}
      </div>

      <div className="profile-dropDown">
        <select
          id="friendSelect"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) router.push(`/mnHome/mainView/${e.target.value}`);
          }}
        >
          <option value="" disabled hidden>
            파도타기
          </option>
          {common.friends.map((friend) => (
            <option value={friend.Name} key={friend.Name}>
              {friend.Name}({friend.userEmail})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
