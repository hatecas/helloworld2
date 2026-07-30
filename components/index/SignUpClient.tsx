'use client';

import { useEffect, useRef, useState } from 'react';

import Stylesheets from '@/components/Stylesheets';
import { showAlert } from '@/lib/ui/dialog';

/** views/index/signUp.jsp — 중복체크 3종 + 입력 검증을 그대로 옮겼다 */
export default function SignUpClient({ msg }: { msg: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const alerted = useRef(false);

  const [userBirth, setUserBirth] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [emailValid, setEmailValid] = useState(true);
  const [agreed, setAgreed] = useState(true);

  useEffect(() => {
    if (msg && !alerted.current) {
      alerted.current = true;
      void showAlert(msg);
      window.history.replaceState(null, '', '/index/member/signUp');
    }
  }, [msg]);

  const passwordMatch = password.length > 0 && password === password2;

  const onlyDigits = (value: string) => value.replace(/[^0-9]/g, '');

  const checkBirth = () => {
    if (userBirth.length !== 8) return false;
    const year = Number(userBirth.slice(0, 4));
    const month = Number(userBirth.slice(4, 6));
    const day = Number(userBirth.slice(6, 8));
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    );
  };

  const duplicateCheck = async (
    url: string,
    payload: Record<string, string>,
    okMsg: string,
    ngMsg: string,
  ) => {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { resultCode: string };
      void showAlert(json.resultCode === '1' ? okMsg : ngMsg);
      return json.resultCode === '1';
    } catch {
      void showAlert('잠시 후 다시 시도해주세요.');
      return false;
    }
  };

  const onEmailCheck = async () => {
    const value = (document.getElementById('userEmail') as HTMLInputElement).value;
    if (/\s/.test(value)) return void showAlert('이메일은 공백을 포함할 수 없습니다.');
    if (value === '') return void showAlert('이메일을 입력해주세요.');
    await duplicateCheck(
      '/index/member/emailCheck',
      { userEmail: value },
      '사용 가능한 이메일 입니다.',
      '이미 사용 중인 이메일 입니다.',
    );
  };

  const onNicknameCheck = async () => {
    const value = (document.getElementById('userNickname') as HTMLInputElement).value;
    if (/\s/.test(value)) return void showAlert('닉네임은 공백을 포함할 수 없습니다.');
    if (value === '') return void showAlert('닉네임을 입력해주세요.');
    if (value.length < 2) return void showAlert('닉네임은 2글자 이상이어야 합니다.');
    await duplicateCheck(
      '/index/member/nicknameCheck',
      { userNickname: value },
      '사용 가능한 닉네임 입니다.',
      '이미 사용 중인 닉네임 입니다.',
    );
  };

  const onPhoneCheck = async () => {
    if (userPhone.length !== 11) {
      void showAlert('입력하신 핸드폰 번호를 확인해주세요.');
      setUserPhone(userPhone.slice(0, 11));
      return;
    }
    if (!userPhone.startsWith('010')) {
      void showAlert('전화번호는 "010"으로 시작해야 합니다.');
      setUserPhone('');
      return;
    }
    const ok = await duplicateCheck(
      '/index/member/phoneCheck',
      { userPhone },
      '사용 가능한 전화번호 입니다.',
      '이미 사용 중인 전화번호 입니다.',
    );
    if (!ok) setUserPhone(userPhone.slice(0, 3));
  };

  const onSubmit = () => {
    if (!checkBirth()) {
      void showAlert('올바른 생년월일을 입력해주세요.');
      setUserBirth('');
      return;
    }
    if (!agreed) {
      void showAlert('개인정보수집 약관에 동의하지 않았습니다.');
      return;
    }
    formRef.current?.submit();
  };

  // 구 JSP 는 section 을 클릭하면 라벨을 주황색 굵게 바꿨는데,
  // 지금은 입력칸 자체에 포커스 링이 생겨서 따로 강조하지 않는다.
  const sectionProps = () => ({});

  return (
    <>
      <Stylesheets
        hrefs={['/resources/css/index/main.css', '/resources/css/index/signUp.css']}
      />
      <div className="grid-container">
        <div className="grid-item" />
        <div className="grid-item content">
          <div id="divUserInfo">
            <a className="logoATag" href="/">
              <img
                className="index-header-logo otherPage-logo"
                id="loginLogo"
                src="/resources/images/mainLogo.png"
                alt="HelloWorld"
              />
            </a>
          </div>
          <div className="signUp-title no-cursor" onMouseDown={(e) => e.preventDefault()}>
            회원가입
          </div>

          <form
            className="signUp-frame"
            id="frmSignUp"
            ref={formRef}
            method="POST"
            action="/index/member/signUpConfirm"
          >
            <div className="section" {...sectionProps()}>
              <label htmlFor="userName">
                이름
              </label>
              <input type="text" id="userName" name="userName" placeholder="이름" className="widthFull" />
            </div>

            <div className="section" {...sectionProps()}>
              <label htmlFor="userBirth">
                생년월일
              </label>
              <input
                type="text"
                id="userBirth"
                name="userBirth"
                placeholder="생년월일 ex)19931013"
                className="widthFull"
                value={userBirth}
                onChange={(e) => {
                  const digits = onlyDigits(e.target.value);
                  if (digits.length > 8) {
                    void showAlert('생년월일은 8자리를 초과할 수 없습니다.');
                    setUserBirth(digits.slice(0, 8));
                  } else {
                    setUserBirth(digits);
                  }
                }}
              />
            </div>

            <div className="section" {...sectionProps()}>
              <div className="divGender no-cursor" onMouseDown={(e) => e.preventDefault()}>
                <label>성별</label>
                <input type="radio" id="userGenderM" name="userGender" value="M" defaultChecked />
                <label htmlFor="userGenderM">남자</label>
                <input type="radio" id="userGenderF" name="userGender" value="F" />
                <label htmlFor="userGenderF">여자</label>
              </div>
            </div>

            <div className="section no-cursor" {...sectionProps()}>
              <div className="email-group">
                <div className="email-left">
                  <label htmlFor="userEmail">
                    이메일주소
                  </label>
                  <input
                    type="button"
                    className="btn-hover"
                    id="btnEmailDuplcheck"
                    value="중복체크"
                    onClick={() => void onEmailCheck()}
                  />
                </div>
                <div className="email-right" id="emailFormMessage">
                  {!emailValid && (
                    <span className="msg-ng">올바른 이메일 주소를 입력하세요.</span>
                  )}
                </div>
              </div>
              <input
                type="email"
                id="userEmail"
                name="userEmail"
                placeholder="이메일주소"
                className="widthFull"
                onBlur={(e) =>
                  setEmailValid(
                    /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(e.target.value),
                  )
                }
              />
            </div>

            <div className="section" {...sectionProps()}>
              <label htmlFor="userPassword">
                비밀번호
              </label>
              <input
                type="password"
                id="userPassword"
                name="userPassword"
                placeholder="비밀번호"
                className="widthFull"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="section" {...sectionProps()}>
              <div className="pw-group">
                <div className="pw-left">
                  <label htmlFor="userPassword2">
                    비밀번호 확인{' '}
                  </label>
                </div>
                <div className="pw-right">
                  <span id="passwordMatchMessage" className="MatchMessage">
                    {password2.length > 0 && (
                      <span className={passwordMatch ? 'msg-ok' : 'msg-ng'}>
                        {passwordMatch ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <input
                type="password"
                id="userPassword2"
                name="userPassword2"
                placeholder="비밀번호"
                className="widthFull"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
              />
            </div>

            <div className="section no-cursor" {...sectionProps()}>
              <label htmlFor="userNickname">
                닉네임
              </label>
              <input
                type="button"
                className="btn-hover"
                id="btnNicknameDuplcheck"
                value="중복체크"
                onClick={() => void onNicknameCheck()}
              />
              <input
                type="text"
                id="userNickname"
                name="userNickname"
                placeholder="닉네임"
                className="widthFull"
              />
            </div>

            <div className="section no-cursor" {...sectionProps()}>
              <label htmlFor="userPhone">
                핸드폰번호
              </label>
              <input
                type="button"
                className="btn-hover"
                id="btnPhoneDuplCheck"
                value="중복체크"
                onClick={() => void onPhoneCheck()}
              />
              <input
                type="text"
                id="userPhone"
                name="userPhone"
                placeholder="하이푼 ( - ) 을 제외하고 입력해주세요"
                className="widthFull"
                value={userPhone}
                onChange={(e) => setUserPhone(onlyDigits(e.target.value))}
              />
            </div>

            <div
              className="section info-check"
              onMouseDown={(e) => e.preventDefault()}
              style={{ cursor: 'default' }}
            >
              <b>개인정보 수집 및 이용 동의서</b>
              <p>1. 개인정보 수집 목적</p>
              <p> - 수집항목: 이름, 생년월일, 성별, 이메일, 연락처, 아이디, 비밀번호, 닉네임</p>
              <p> - 수집목적: 홈페이지 서비스 제공 및 관리, 연락 및 안내, 서비스 개선 및 맞춤화</p>
              <p>2. 개인정보의 수집 및 이용 동의</p>
              <p> 본인은 주식회사 [회사명] (이하 &quot;회사&quot;라 함)가 제공하는 홈페이지 [helloworld]를</p>
              <p> 이용하기 위해 위와 같이 개인정보를 제공합니다.</p>
              <p>3. 개인정보의 보유 및 이용 기간</p>
              <p> 개인정보는 회원 탈퇴 시까지 보유 및 이용됩니다.</p>
              <p> 탈퇴 시에는 개인정보가 정해진 기한 없이 일괄적으로 파기될 것입니다.</p>
              <p>4. 동의 철회 및 개인정보 파기</p>
              <p> 회원은 언제든지 개인정보 수집 및 이용에 대한 동의를 철회할 수 있으며,</p>
              <p> 이 경우 회사는 해당 개인정보를 즉시 파기합니다.</p>
              <p>5. 기타</p>
              <p> 본 동의서는 [홈페이지명] 이용 시 필수적으로 동의해야 하는 내용으로,</p>
              <p> 동의하지 않을 경우 [홈페이지명]의 일부 서비스 이용이 제한될 수 있습니다.</p>
              <p> 본 동의서에 동의하신다면,</p>
              <p> 아래의 정보를 확인 후 [동의] 버튼을 클릭하여 동의를 완료해주세요.</p>
              <p> ※ 동의를 철회하실 수 있으며,동의 철회 시에는 서비스 이용이 제한될 수 있습니다.</p>
            </div>

            <div className="section no-cursor" onMouseDown={(e) => e.preventDefault()}>
              <div className="confirm-group">
                <input
                  type="radio"
                  id="confirm"
                  name="confirm"
                  value="confirm"
                  checked={agreed}
                  onChange={() => setAgreed(true)}
                />
                <label htmlFor="confirm">동의</label>
                <input
                  type="radio"
                  id="noConfirm"
                  name="confirm"
                  value="noConfirm"
                  checked={!agreed}
                  onChange={() => setAgreed(false)}
                />
                <label htmlFor="noConfirm">비동의</label>
              </div>
            </div>

            <div className="join-ok">
              <input
                type="button"
                id="btnSignUp"
                className="btn-hover"
                value="회원가입"
                disabled={password2.length > 0 && !passwordMatch}
                onClick={onSubmit}
              />
            </div>
          </form>
        </div>
        <div className="grid-item" />
      </div>
    </>
  );
}
