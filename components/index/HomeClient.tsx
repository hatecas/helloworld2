'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import Stylesheets from '@/components/Stylesheets';
import Footer from '@/components/index/Footer';
import { showAlert } from '@/lib/ui/dialog';

interface Props {
  userNickname: string;
  userEmail: string;
  dotori: number | null;
  userMinimi: string;
  msg: string;
}

interface NewInfo {
  newContent: number;
  newFriend: number;
  todayCnt: number;
  onFriendCnt: number;
  friendList: string[];
}

const SLIDES = [
  '/resources/images/mainSlideImg1.jpg',
  '/resources/images/slideImg1.png',
  '/resources/images/slideImg2.png',
];

/** 체험용 계정. 시드 데이터(lib/db/seed.ts)와 같은 값이다. */
const DEMO = { email: 'demo@gmail.com', password: '1234' };

/** views/home.jsp — 로그인 전/후 화면과 메인 슬라이드 */
export default function HomeClient({ userNickname, userEmail, dotori, userMinimi, msg }: Props) {
  const loggedIn = Boolean(userNickname);

  const [slideIndex, setSlideIndex] = useState(0);
  const [info, setInfo] = useState<NewInfo | null>(null);
  const [friendListOpen, setFriendListOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const alerted = useRef(false);

  // 리다이렉트로 넘어온 메시지 한 번만 띄운다
  useEffect(() => {
    if (msg && !alerted.current) {
      alerted.current = true;
      void showAlert(msg);
      window.history.replaceState(null, '', '/');
    }
  }, [msg]);

  // 구 newContent(): 로그인 상태면 새 글/일촌신청/오늘 방문자 수를 가져온다
  useEffect(() => {
    if (!loggedIn) return;
    let cancelled = false;

    fetch('/index/member/getNew', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userNickname }),
    })
      .then((res) => res.json())
      .then((json: NewInfo) => {
        if (!cancelled) setInfo(json);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [loggedIn, userNickname]);

  // 자동 슬라이드 (5초)
  useEffect(() => {
    const timer = window.setInterval(() => {
      setSlideIndex((i) => (i + 1) % SLIDES.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const moveSlide = (delta: number) =>
    setSlideIndex((i) => (i + delta + SLIDES.length) % SLIDES.length);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/index/member/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: email, userPassword: password }),
      });
      const json = (await res.json()) as { resultCode: string };

      if (json.resultCode === '1') {
        window.location.href = '/';
      } else {
        void showAlert('아이디와 비밀번호를 다시 확인해 주세요.');
      }
    } catch {
      void showAlert('잠시 후 다시 시도해주세요.');
    }
  }, []);

  const openMiniHomepage = () => {
    const width = 1200;
    const height = 720;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    const newWindow = window.open(
      `/mnHome/mainView/${encodeURIComponent(userNickname)}`,
      'MiniHomepage',
      `width=${width}, height=${height}, left=${left}, top=${top}`,
    );
    newWindow?.focus();
  };

  return (
    <>
      <Stylesheets hrefs={['/resources/css/index/main.css']} />

      <div className="index-frame">
        <div className="divIndexMenu index-header">
          <div className="index-header-left">
            <a className="logoATag" href="/">
              <img
                className="index-header-logo"
                id="loginLogo"
                src="/resources/images/mainLogo.png"
                alt="HelloWorld"
              />
            </a>
          </div>
          <div className="index-header-right">
            {loggedIn && (
              <h5 className="right" id="userDotori">
                <img
                  id="indexDotoriImg"
                  src="/resources/images/store/storeDotoriIcon.png"
                  alt="도토리"
                />
                <span id="userDotoriCnt">{dotori ?? 0}</span>
              </h5>
            )}
            <a href="/store/minimiView" className="index-a-store">
              상점
            </a>
            <a href="/notice/noticeView" className="index-a-notice">
              공지사항
            </a>
            <a href="/index/mapView" className="index-a-map">
              찾아오는 길
            </a>
            {loggedIn && (
              <a id="linkLogout" href="/index/member/logout" className="index-a-logout">
                로그아웃
              </a>
            )}
          </div>
        </div>

        <div id="divHiUser">
          <p className="hello-message" id="helloMessage">
            {loggedIn ? `${userNickname} 님, 환영합니다.` : '그때 그 미니홈피, 다시.'}
          </p>
        </div>

        <div className="divIndexMain">
          {/* 로그인 전 */}
          {!loggedIn && (
            <div id="divHome" className="divLogin">
              <form
                className="frmLogin"
                id="frmLogin"
                onSubmit={(e) => {
                  e.preventDefault();
                  void login(loginEmail, loginPassword);
                }}
              >
                <input
                  type="email"
                  id="userEmail"
                  name="userEmail"
                  placeholder="이메일"
                  autoComplete="username"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
                <input
                  type="password"
                  id="userPassword"
                  name="userPassword"
                  placeholder="비밀번호"
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
                <input type="submit" id="btnLogin" value="로그인" />
              </form>

              <div>
                <a className="signUpATag idx-su" href="/index/member/signUp">
                  회원가입
                </a>
                <a href="/index/member/findId" className="idx-id">
                  아이디
                </a>
                <span className="index-idpw-span">/</span>
                <a href="/index/member/findPwView" className="idx-pw">
                  비밀번호 찾기
                </a>
              </div>

              <div className="demo-hint">
                가입 없이 둘러보고 싶다면
                <br />
                <button type="button" onClick={() => void login(DEMO.email, DEMO.password)}>
                  체험 계정으로 로그인
                </button>
              </div>
            </div>
          )}

          {/* 로그인 후 */}
          {loggedIn && (
            <div id="divLogin" className="divLogin">
              <div className="login-frame">
                <div className="login-top">
                  <div className="login-top-left">
                    <span id="userNickname">{userNickname}</span>
                  </div>
                  <div
                    className="login-top-right"
                    onClick={() => setFriendListOpen((v) => !v)}
                  >
                    <span className="login-top-right-imz">🌈</span>일촌 ON
                    <span id="spanOnfriendCnt" className="login-top-right-bfCnt">
                      {info?.onFriendCnt ?? '-'}
                    </span>
                  </div>
                </div>

                <div className="login-profile-frame">
                  <div className="login-profile-minimi" id="divMainMinimi">
                    <img
                      className="index-my-minimi"
                      id="mainMinimi"
                      src={userMinimi}
                      alt="미니미"
                    />
                  </div>
                  <div className="login-profile-information">
                    <div className="login-profile-info">
                      <div className="login-profile-section2">
                        <span>👣</span>
                        <span>오늘 방문자</span>
                        <span id="todayCnt" className="login-profile-info-2">
                          {info?.todayCnt ?? '-'}
                        </span>
                      </div>
                      <div className="login-profile-section3">
                        <span>📋</span>
                        <span>새 게시물</span>
                        <span className="login-profile-info-3" id="newContent">
                          {info?.newContent ?? '-'}
                        </span>
                      </div>
                      <div className="login-profile-section4">
                        <span>💕</span>
                        <span>일촌 신청</span>
                        <span className="login-profile-info-4" id="newFriend">
                          {info?.newFriend ?? '-'}
                        </span>
                      </div>
                    </div>
                    <div className="my-btn">
                      <input
                        type="button"
                        className="mainBtn1"
                        id="btnGoMinihome"
                        value="내 미니홈피"
                        onClick={openMiniHomepage}
                      />
                      <input
                        type="button"
                        className="mainBtn2"
                        id="btnLogout"
                        value="로그아웃"
                        onClick={() => {
                          window.location.href = '/index/member/logout';
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {friendListOpen && (
                <div id="friendListContainer">
                  {(info?.friendList ?? []).length === 0 ? (
                    <div>접속중인 일촌이 없습니다.</div>
                  ) : (
                    info?.friendList.map((name) => (
                      <div key={name}>
                        <a href={`/mnHome/mainView/${encodeURIComponent(name)}`}>{name}</a>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <div id="divMainSlide">
            <div className="slideshow-container">
              <div className="btnContainer">
                <div className="btnLeft">
                  <a className="btnClick" onClick={() => moveSlide(-1)}>
                    ❮
                  </a>
                </div>
                <div className="btnRight">
                  <a className="btnClick" onClick={() => moveSlide(1)}>
                    ❯
                  </a>
                </div>
              </div>
              {SLIDES.map((src, i) => (
                <div
                  key={src}
                  className="mySlides fade"
                  style={{
                    opacity: i === slideIndex ? 1 : 0,
                    zIndex: i === slideIndex ? 1 : 0,
                  }}
                >
                  <img src={src} alt="" />
                </div>
              ))}
              <div className="divdot">
                {SLIDES.map((src, i) => (
                  <span
                    key={src}
                    className={i === slideIndex ? 'dot active' : 'dot'}
                    onClick={() => setSlideIndex(i)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bottom-fix" />
      <Footer />

      {/* 미니홈피 창에서 window.opener.reloadParentWindow() 를 호출한다 */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.reloadParentWindow = function () { location.href = '/index/member/logout'; };`,
        }}
      />
      <span hidden data-user-email={userEmail} />
    </>
  );
}
