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

interface FriendReq {
  seq: number;
  requesterNickname: string;
  requesterName: string;
  createDate: string;
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
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [reqOpen, setReqOpen] = useState(false);
  const [friendReqs, setFriendReqs] = useState<FriendReq[]>([]);

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

  // 미니홈피 팝업이 로그아웃할 때 window.opener.reloadParentWindow() 를 부른다.
  // 예전에는 인라인 <script> 로 심었는데, 하이드레이션에 끼어들 여지가 있어 effect 로 옮겼다.
  useEffect(() => {
    const w = window as unknown as Record<string, () => void>;
    w.reloadParentWindow = () => {
      window.location.href = '/index/member/logout';
    };
    return () => {
      delete w.reloadParentWindow;
    };
  }, []);

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
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await fetch('/index/member/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: email, userPassword: password }),
      });
      const json = (await res.json()) as { resultCode: string };

      if (json.resultCode === '1') {
        window.location.href = '/';
        return;
      }

      // resultCode '-1' 은 서버에서 예외가 난 경우 (예: SESSION_SECRET 미설정)
      const message =
        json.resultCode === '-1'
          ? '로그인 처리 중 오류가 발생했습니다. 서버 설정을 확인해주세요.'
          : '아이디와 비밀번호를 다시 확인해 주세요.';
      setLoginError(message);
      void showAlert(message);
    } catch {
      const message = '서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.';
      setLoginError(message);
      void showAlert(message);
    } finally {
      setLoggingIn(false);
    }
  }, []);

  const openMiniHomepage = (nickname: string = userNickname) => {
    const url = `/mnHome/mainView/${encodeURIComponent(nickname)}`;

    // 모바일/터치·좁은 화면에서는 팝업이 막히거나 화면을 넘치므로 같은 탭에서 전체화면으로 연다
    const isMobile =
      typeof window !== 'undefined' &&
      (window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches);
    if (isMobile) {
      window.location.href = url;
      return;
    }

    const width = 1200;
    const height = 720;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    const newWindow = window.open(
      url,
      'MiniHomepage',
      `width=${width}, height=${height}, left=${left}, top=${top}`,
    );
    newWindow?.focus();
  };

  const loadFriendReqs = async () => {
    try {
      const res = await fetch('/index/friendRequests');
      const json = (await res.json()) as { requests: FriendReq[] };
      setFriendReqs(json.requests ?? []);
    } catch {
      setFriendReqs([]);
    }
  };

  const toggleReqs = () => {
    const next = !reqOpen;
    setReqOpen(next);
    if (next) void loadFriendReqs();
  };

  const respondFriend = async (seq: number, accept: boolean) => {
    try {
      await fetch(accept ? '/mnHome/acceptFriends' : '/mnHome/rejectFriends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seq, fStatus: accept ? 1 : -1 }),
      });
      await showAlert(accept ? '일촌신청을 수락했습니다.' : '일촌신청을 거절했습니다.');
      setFriendReqs((prev) => prev.filter((r) => r.seq !== seq));
      // 상단 카운트도 갱신
      fetch('/index/member/getNew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userNickname }),
      })
        .then((r) => r.json())
        .then((j: NewInfo) => setInfo(j))
        .catch(() => undefined);
    } catch {
      void showAlert('잠시 후 다시 시도해주세요.');
    }
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
            {loggedIn && (
              <a href="/plaza" className="index-a-plaza">
                광장
              </a>
            )}
            <a href="/store/minimiView" className="index-a-store">
              상점
            </a>
            <a href="/notice/noticeView" className="index-a-notice">
              공지사항
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
                <input
                  type="submit"
                  id="btnLogin"
                  value={loggingIn ? '로그인 중…' : '로그인'}
                  disabled={loggingIn}
                />
              </form>

              {/* 모달이 뜨지 않는 환경에서도 실패 사유가 보이도록 카드 안에도 표시한다 */}
              {loginError && <div className="login-error">{loginError}</div>}

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
                <button
                  type="button"
                  disabled={loggingIn}
                  onClick={() => void login(DEMO.email, DEMO.password)}
                >
                  {loggingIn ? '로그인 중…' : '체험 계정으로 로그인'}
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
                      <div
                        className="login-profile-section4 login-profile-clickable"
                        onClick={toggleReqs}
                        title="클릭하면 받은 일촌신청을 확인합니다"
                      >
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
                        onClick={() => openMiniHomepage()}
                      />
                      <input
                        type="button"
                        className="mainBtnPlaza"
                        id="btnGoPlaza"
                        value="🌳 광장"
                        onClick={() => {
                          window.location.href = '/plaza';
                        }}
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

              {reqOpen && (
                <div id="friendReqContainer">
                  {friendReqs.length === 0 ? (
                    <div className="friend-req-empty">받은 일촌신청이 없습니다.</div>
                  ) : (
                    friendReqs.map((req) => (
                      <div className="friend-req-row" key={req.seq}>
                        <div className="friend-req-info">
                          <a href={`/mnHome/mainView/${encodeURIComponent(req.requesterNickname)}`}>
                            {req.requesterName}
                          </a>
                          <span className="friend-req-nick">({req.requesterNickname})</span>
                        </div>
                        <div className="friend-req-actions">
                          <button
                            type="button"
                            className="friend-req-accept"
                            onClick={() => void respondFriend(req.seq, true)}
                          >
                            수락
                          </button>
                          <button
                            type="button"
                            className="friend-req-reject"
                            onClick={() => void respondFriend(req.seq, false)}
                          >
                            거절
                          </button>
                        </div>
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

      <span hidden data-user-email={userEmail} />
    </>
  );
}
