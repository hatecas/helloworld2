'use client';

import { useState } from 'react';

import Stylesheets from '@/components/Stylesheets';

/** 아이디 찾기 결과 화면 */
export default function FindIdResultClient({
  findId,
  userName,
}: {
  findId: string;
  userName: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(findId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // 클립보드 권한이 없으면 조용히 넘어간다
    }
  };

  return (
    <>
      <Stylesheets
        hrefs={[
          '/resources/css/index/main.css',
          '/resources/css/index/signUp.css',
          '/resources/css/index/findIdResult.css',
        ]}
      />
      <div className="grid-container container1">
        <div className="grid-item" />
        <div className="grid-item">
          <div className="container2">
            <div id="signUplogo">
              <a href="/">
                <img id="mainLogo" src="/resources/images/mainLogo.png" alt="HelloWorld" />
              </a>
            </div>
            <div id="divFindIdResult">
              <p className="p-userInfo">{userName}님의 아이디입니다.</p>
              <p className="p-userEmail">{findId}</p>
              <button type="button" className="copy-id-btn" onClick={() => void copy()}>
                {copied ? '복사되었습니다' : '아이디 복사'}
              </button>
              <div className="after-link">
                <a href="/">로그인</a> / <a href="/index/member/findPwView">비밀번호 찾기</a>
              </div>
            </div>
          </div>
        </div>
        <div className="grid-item" />
      </div>
    </>
  );
}
