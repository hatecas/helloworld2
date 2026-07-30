'use client';

import { useEffect, useRef, useState } from 'react';

import Stylesheets from '@/components/Stylesheets';
import { showAlert } from '@/lib/ui/dialog';

/** views/index/findPw.jsp — 아이디/이름/연락처로 본인 확인 */
export default function FindPwClient({ msg }: { msg: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const alerted = useRef(false);

  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');

  useEffect(() => {
    if (msg && !alerted.current) {
      alerted.current = true;
      void showAlert(msg);
      window.history.replaceState(null, '', '/index/member/findPwView');
    }
  }, [msg]);

  const submit = () => {
    if (userPhone.length < 1 || userName.length < 1 || userId.length < 1) {
      void showAlert('모든 내용을 입력해주세요.');
      return;
    }
    if (!/^\d+$/.test(userPhone)) {
      void showAlert('숫자만 입력해주세요.');
      return;
    }
    if (userPhone.length > 11 || userPhone.length < 10) {
      void showAlert('입력하신 번호를 확인해주세요.');
      return;
    }
    if (userName.length < 2) {
      void showAlert('입력하신 이름을 확인해주세요.');
      return;
    }
    if (/\d+/.test(userName)) {
      void showAlert('이름은 숫자를 포함할 수 없습니다.');
      return;
    }
    formRef.current?.submit();
  };

  return (
    <>
      <Stylesheets
        hrefs={[
          '/resources/css/index/main.css',
          '/resources/css/index/find.css',
          '/resources/css/index/signUp.css',
        ]}
      />
      <div className="grid-container">
        <div className="grid-item" />
        <div className="grid-item">
          <div id="divUserInfo">
            <img
              className="findId-logo"
              id="loginLogo"
              src="/resources/images/mainLogo.png"
              alt="HelloWorld"
            />
            <div className="findId-title"> 비밀번호 찾기 </div>
            <div className="find-tag">
              <label htmlFor="userId">아이디</label>
              <br />
              <input
                type="text"
                id="userId"
                placeholder="아이디"
                className="widthFull"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
              <br />
            </div>
            <div className="find-tag">
              <label htmlFor="userName">이름</label>
              <br />
              <input
                type="text"
                id="userName"
                placeholder="이름"
                className="widthFull"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
            <div className="find-tag">
              <label htmlFor="userPhone">연락처</label>
              <br />
              <input
                type="text"
                id="userPhone"
                placeholder="' ㅡ ' 를 제외한 숫자만 입력하세요"
                className="widthFull"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
              />
            </div>
            <div className="find-btn">
              <button
                id="btnCancle"
                type="button"
                onClick={() => {
                  window.location.href = '/';
                }}
              >
                취소
              </button>
              <button id="btnSubmit" type="button" onClick={submit}>
                찾기
              </button>
            </div>
          </div>
        </div>
        <div className="grid-item" />
        <form id="frm1" ref={formRef} action="/index/member/afterFindPw" method="POST">
          <input id="hiddenUserId" type="hidden" name="userId" value={userId} readOnly />
          <input id="hiddenUserName" type="hidden" name="userName" value={userName} readOnly />
          <input id="hiddenUserPhone" type="hidden" name="userPhone" value={userPhone} readOnly />
        </form>
      </div>
    </>
  );
}
