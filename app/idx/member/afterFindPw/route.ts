import { NextResponse } from 'next/server';

import { selectUserId } from '@/lib/db/repo';
import { issuePasswordResetTicket } from '@/lib/session';

/**
 * 구 MemberController.afterFindPw — 아이디/이름/연락처로 본인 확인.
 *
 * 확인에 성공하면 5분짜리 재설정 티켓을 httpOnly 쿠키로 발급한다.
 * 예전처럼 찾은 이메일을 URL 에 실어 보내지 않는다.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const userName = String(form.get('userName') ?? '').trim();
  const userPhone = String(form.get('userPhone') ?? '').trim();
  const userId = String(form.get('userId') ?? '').trim();

  const found = await selectUserId({ userName, userPhone, userId });

  if (!found) {
    const params = new URLSearchParams({ msg: '정보를 찾을 수 없습니다.' });
    return NextResponse.redirect(
      new URL(`/index/member/findPwView?${params}`, request.url),
      303,
    );
  }

  await issuePasswordResetTicket(found.userEmail);

  return NextResponse.redirect(new URL('/index/member/findPwResult', request.url), 303);
}
