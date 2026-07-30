import { NextResponse } from 'next/server';

import { clearSession, getSessionUser } from '@/lib/session';
import { loginOffStatus } from '@/lib/db/repo';

/** 구 MemberController.logout (/index/member/logout, GET → redirect:/) */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (user) {
    await loginOffStatus(user.userNickname);
  }
  await clearSession();

  const response = NextResponse.redirect(new URL('/', request.url));
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}
