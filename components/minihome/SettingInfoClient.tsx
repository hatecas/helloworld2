'use client';

import { useState } from 'react';
import { showAlert } from '@/lib/ui/dialog';
import { openMiniPopup } from '@/lib/ui/popup';

/** views/miniHome/setting.jsp + resources/js/setting.js (이름/닉네임/연락처 인라인 수정) */
export default function SettingInfoClient({
  userNickname,
  userEmail,
  userName: initialName,
  phoneNumber: initialPhone,
  createDate,
  minimi,
}: {
  userNickname: string;
  userEmail: string;
  userName: string;
  phoneNumber: string;
  createDate: string;
  minimi: string;
}) {
  const [name, setName] = useState(initialName);
  const [nickname, setNickname] = useState(userNickname);
  const [phone, setPhone] = useState(initialPhone);

  const [editing, setEditing] = useState<'name' | 'nickname' | 'phone' | null>(null);
  const [original, setOriginal] = useState('');

  const post = async (url: string, body: unknown): Promise<number> => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return (await res.json()) as number;
  };

  const openMinimiChange = () =>
    openMiniPopup(
      '/mnHome/mnhMinimiChangeView',
      'width=460, height=570, scrollbars=no, resizable=no, toolbars=no, menubar=no, left=100, top=50',
    );

  const changeName = async () => {
    if (editing !== 'name') {
      setOriginal(name);
      setEditing('name');
      return;
    }
    if (/[0-9]/.test(name)) {
      void showAlert('숫자가 포함되어 있습니다.');
      return;
    }
    const result = await post('/mnHome/changeName', {
      userNickname, originalName: original, changedName: name,
    });
    if (result === 1) void showAlert('성공적으로 이름을 변경했습니다.');
    else if (result === 4) void showAlert('기존 이름에서 변경 후 시도해주세요.');
    else {
      void showAlert('변경에 실패했습니다.');
      setName(original);
    }
    setEditing(null);
  };

  const changeNickname = async () => {
    if (editing !== 'nickname') {
      setOriginal(nickname);
      setEditing('nickname');
      return;
    }
    if (nickname.length > 30) {
      void showAlert('입력 가능한 최대 길이를 초과했습니다.');
      return;
    }
    const result = await post('/mnHome/changeNickname', {
      userEmail, originalNickname: original, changedNickname: nickname,
    });
    if (result === 1) {
      await showAlert('성공적으로 닉네임을 변경했습니다.\n세션이 만료되었으니 새로 로그인해주세요.');
      window.location.href = '/index/member/logout';
      return;
    }
    if (result === 3) void showAlert('이미 사용중인 닉네임입니다.');
    else void showAlert('변경에 실패했습니다. 다시 시도하세요.');
    setNickname(original);
    setEditing(null);
  };

  const changeNumber = async () => {
    if (editing !== 'phone') {
      setOriginal(phone);
      setEditing('phone');
      return;
    }
    if (!/^[0-9-]+$/.test(phone)) {
      void showAlert('전화번호는 숫자만으로 구성되어야 합니다.');
      return;
    }
    const digits = phone.replace(/-/g, '');
    if (digits.length !== 11) {
      void showAlert('11자리가 아닙니다. 다시 한번 확인하세요');
      return;
    }
    const result = await post('/mnHome/changeNumber', {
      userNickname, originalNumber: original, changedNumber: phone,
    });
    if (result === 1) void showAlert('성공적으로 전화번호을 변경했습니다.');
    else if (result === 3) {
      void showAlert('이미 사용중인 전화번호입니다.');
      setPhone(original);
    } else {
      void showAlert('변경에 실패했습니다. 다시 시도하세요.');
      setPhone(original);
    }
    setEditing(null);
  };

  const editableStyle = (field: 'name' | 'nickname' | 'phone') =>
    editing === field
      ? { border: '1px solid black', borderRadius: 5 }
      : { border: 'none' as const };

  return (
    <div className="divForTable">
      <div className="setting-myMinimi">
        <div className="setting-myMinimi-view">
          <div className="set-mnm-circle-frame">
            <img src={minimi} className="settting-myMinimi-circle" alt="대표 미니미" />
          </div>
        </div>
        <div className="setting-myMinimi-Edit">
          <a className="setting-myMinimi-change" onClick={openMinimiChange}>
            대표미니미 변경
          </a>
        </div>
      </div>

      <div className="set-info-group">
        <div className="set-info">
          <div className="set-info-title">프로필</div>
          <div className="set-info-db">
            <div className="set-info-name">
              <div className="set-info-name-left">
                <span>🖊</span> 이름
              </div>
              <textarea
                className="textInfo"
                id="set-UserName"
                readOnly={editing !== 'name'}
                style={editableStyle('name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div className="set-info-name-a" onClick={() => void changeName()}>
                {editing === 'name' ? '확인' : '수정'}
              </div>
            </div>

            <div className="set-info-Nickname">
              <div className="set-info-Nickname-left">
                <span>🖌</span>닉네임
              </div>
              <textarea
                className="textInfo"
                id="set-UserNickname"
                readOnly={editing !== 'nickname'}
                style={editableStyle('nickname')}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
              <div className="set-info-Nickname-a" onClick={() => void changeNickname()}>
                {editing === 'nickname' ? '확인' : '수정'}
              </div>
            </div>

            <div className="set-info-phone">
              <div className="set-info-phone-left">
                <span>📞</span> 연락처
              </div>
              <textarea
                className="textInfo"
                id="set-UserPhone"
                readOnly={editing !== 'phone'}
                style={editableStyle('phone')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <div className="set-info-phone-a" onClick={() => void changeNumber()}>
                {editing === 'phone' ? '확인' : '수정'}
              </div>
            </div>

            <div className="set-info-date">
              <div className="set-info-date-left">
                <span>🗓</span> 가입일
              </div>
              <div className="set-info-date-right" id="set-UserDate">
                {createDate}
              </div>
              <div className="set-info-date-a" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
