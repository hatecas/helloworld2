import { NextResponse } from 'next/server';

import { selectUserId } from '@/lib/db/repo';
import { setFoundId } from '@/lib/session';

/**
 * 구 MemberController.afterFindId — findId 화면의 form POST.
 *
 * 찾은 이메일은 URL 쿼리가 아니라 5분짜리 httpOnly 쿠키로 넘긴다.
 * (주소창·브라우저 기록·서버 로그·리퍼러에 남지 않도록)
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const userName = String(form.get('userName') ?? '').trim();
  const userPhone = String(form.get('userPhone') ?? '').trim();

  const found = await selectUserId({ userName, userPhone });

  if (!found) {
    const params = new URLSearchParams({ msg: '정보를 찾을 수 없습니다.' });
    return NextResponse.redirect(new URL(`/index/member/findId?${params}`, request.url), 303);
  }

  await setFoundId(found.userEmail, userName);
  return NextResponse.redirect(new URL('/index/member/findIdResult', request.url), 303);
}
