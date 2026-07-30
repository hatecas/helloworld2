'use client';

import { useRouter } from 'next/navigation';

import ProfileIdentity from '@/components/minihome/ProfileIdentity';
import type { MiniHomeCommon } from '@/lib/minihome-view';

export type SettingMenuKey =
  | 'info'
  | 'bgm'
  | 'menu'
  | 'skin'
  | 'dotoriUse'
  | 'dotoriCharge'
  | 'friends';

/** 관리 화면 좌측의 트리 메뉴 (구 setting 계열 JSP 들이 공통으로 갖고 있던 부분) */
export default function SettingSideBox({
  common,
  active,
}: {
  common: MiniHomeCommon;
  active: SettingMenuKey;
}) {
  const router = useRouter();
  const nick = common.userNickname;

  const groups: Array<{ title: string; items: Array<{ key: SettingMenuKey; label: string; href: string; id: string }> }> = [
    {
      title: '개인정보',
      items: [
        { key: 'info', label: '개인정보변경', href: `/mnHome/settingView/${nick}`, id: 'spanSetting' },
      ],
    },
    {
      title: '미니홈피관리',
      items: [
        { key: 'bgm', label: 'BGM설정', href: `/mnHome/settingBgm/${nick}`, id: 'spanSettingBgm' },
        { key: 'menu', label: '메뉴탭설정', href: `/mnHome/settingMenu/${nick}`, id: 'spanSettingMenu' },
        { key: 'skin', label: '스킨설정', href: `/mnHome/settingSkin/${nick}`, id: 'spanSettingSkin' },
      ],
    },
    {
      title: '아이템/내역관리',
      items: [
        { key: 'dotoriUse', label: '도토리 사용내역', href: `/mnHome/settingDotoriUse/${nick}`, id: 'spanSettingDotoriU' },
        { key: 'dotoriCharge', label: '도토리 구매내역', href: `/mnHome/settingDotoriCharge/${nick}`, id: 'spanSettingDotoriC' },
      ],
    },
    {
      title: '인맥관리',
      items: [
        { key: 'friends', label: '일촌현황', href: `/mnHome/settingFriends/${nick}`, id: 'spanSettingFriends' },
      ],
    },
  ];

  return (
    <div className="box profile-box">
      <div className="setting-folder-group">
        <div>
          {groups.map((group) => (
            <div key={group.title}>
              <span>
                <img className="setting-menu-dot" src="/resources/images/minihome/menu-dot.png" alt="" />
              </span>
              <span className="setting-menu-title">{group.title}</span>
              <ul className="tree">
                {group.items.map((item) => (
                  <li key={item.key}>
                    <a>
                      <span
                        className={
                          active === item.key ? 'setting-menu-list set-on' : 'setting-menu-list'
                        }
                        id={item.id}
                        onClick={() => router.push(item.href)}
                      >
                        {item.label}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="profile-dot">-----------------------------------</div>

      <ProfileIdentity common={common} />
    </div>
  );
}
