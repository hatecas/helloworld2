'use client';

import { useEffect, useRef, useState } from 'react';

import Stylesheets from '@/components/Stylesheets';
import { showAlert } from '@/lib/ui/dialog';

/**
 * 새 비밀번호 설정 화면.
 * 어떤 계정인지는 서버가 재설정 티켓으로만 알고 있어서 폼에 담지 않는다.
 */
export default function FindPwResultClient({
  updateResult,
  msg,
}: {
  updateResult: string;
  msg: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const handled = useRef(false);

  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  useEffect(() => {
    if (!updateResult || handled.current) return;
    handled.current = true;
    void showAlert(msg).then(() => {
      window.location.href = updateResult === '1' ? '/' : '/index/member/findPwView';
    });
  }, [updateResult, msg]);

  const matched = password.length > 0 && password === password2;

  const submit = () => {
    if (password.length < 4) {
      void showAlert('비밀번호는 4자 이상이어야 합니다.');
      return;
    }
    if (!matched) {
      void showAlert('비밀번호가 일치하지 않습니다.');
      return;
    }
    formRef.current?.submit();
  };

  return (
    <>
      <Stylesheets
        hrefs={[
          '/resources/css/index/main.css',
          '/resources/css/index/signUp.css',
          '/resources/css/index/find.css',
        ]}
      />
      <div className="grid-container">
        <div className="grid-item" />
        <div className="grid-item">
          <div id="divUserInfo">
            <a href="/">
              <img
                className="findId-logo"
                id="loginLogo"
                src="/resources/images/mainLogo.png"
                alt="HelloWorld"
              />
            </a>
            <div className="findId-title">비밀번호 변경</div>
            <p className="find-desc">본인 확인이 완료되었습니다. 새 비밀번호를 입력해주세요.</p>

            <div className="find-tag">
              <label htmlFor="userPassword">새 비밀번호</label>
              <input
                type="password"
                id="userPassword"
                placeholder="4자 이상 입력하세요"
                className="widthFull"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="find-tag">
              <div className="pw-group">
                <div className="pw-left">
                  <label htmlFor="userPassword2">비밀번호 확인</label>
                </div>
                <div className="pw-right">
                  <span id="passwordMatchMessage">
                    {password2.length > 0 && (
                      <span className={matched ? 'msg-ok' : 'msg-ng'}>
                        {matched ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <input
                type="password"
                id="userPassword2"
                className="widthFull"
                autoComplete="new-password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit();
                }}
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
                변경
              </button>
            </div>
          </div>
        </div>
        <div className="grid-item" />

        {/* 변경할 계정은 서버의 재설정 티켓에서만 읽는다 */}
        <form id="frm1" ref={formRef} action="/index/member/findPw" method="POST">
          <input type="hidden" name="newPw" value={password} readOnly />
        </form>
      </div>
    </>
  );
}
