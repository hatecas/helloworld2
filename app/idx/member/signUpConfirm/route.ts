import { NextResponse } from 'next/server';

import { sha256 } from '@/lib/crypto';
import { selectUserInfo, signUp } from '@/lib/db/repo';

/**
 * 구 MemberController.signUpConfirm — signUp.jsp 의 form 이 그대로 POST 한다.
 * 성공하면 홈으로, 실패하면 가입 화면으로 메시지와 함께 돌려보낸다.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const get = (key: string) => String(form.get(key) ?? '').trim();

  const userEmail = get('userEmail');
  const userPassword = get('userPassword');
  const userName = get('userName');
  const userNickname = get('userNickname');
  const userPhone = get('userPhone');
  const userGender = get('userGender') === 'F' ? 'F' : 'M';
  const rawBirth = get('userBirth'); // signUp.jsp 는 19931013 형태로 보낸다

  const back = (msg: string) =>
    NextResponse.redirect(
      new URL(`/index/member/signUp?msg=${encodeURIComponent(msg)}`, request.url),
      303,
    );

  if (!userEmail || !userPassword || !userName || !userNickname || !userPhone) {
    return back('모든 항목을 입력해주세요.');
  }
  if (!/^\d{8}$/.test(rawBirth)) {
    return back('올바른 생년월일을 입력해주세요.');
  }

  const userBirth = `${rawBirth.slice(0, 4)}-${rawBirth.slice(4, 6)}-${rawBirth.slice(6, 8)}`;

  if (await selectUserInfo({ userEmail })) return back('이미 사용 중인 이메일 입니다.');
  if (await selectUserInfo({ userNickname })) return back('이미 사용 중인 닉네임 입니다.');
  if (await selectUserInfo({ userPhone })) return back('이미 사용 중인 전화번호 입니다.');

  try {
    await signUp({
      userEmail,
      userPassword: sha256(userPassword),
      userName,
      userNickname,
      userGender,
      userBirth,
      userPhone,
    });
  } catch (error) {
    console.error('[signUpConfirm]', error);
    return back('잠시 후 다시 시도해주세요.');
  }

  return NextResponse.redirect(
    new URL(`/?msg=${encodeURIComponent('회원가입이 완료되었습니다. 로그인해 주세요.')}`, request.url),
    303,
  );
}
