import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * 미니홈피 화면(로그인 필요)을 렌더링 전에 막는다.
 *
 * 원래는 페이지 안에서 redirect() 를 불렀는데, loading.tsx 가 붙으면서
 * 응답이 스트리밍으로 나가기 시작해 서버가 307 을 못 내는 상태였다.
 * (JS 가 꺼진 클라이언트에는 빈 껍데기가 그대로 노출됐다)
 * 미들웨어는 렌더링 전에 돌기 때문에 확실하게 리다이렉트된다.
 */

const SESSION_COOKIE = 'helloworld_session';

/** 로그인이 필요한 미니홈피 화면들 (팝업 창은 자체 안내 화면이 있어 제외) */
const PROTECTED_PREFIXES = [
  '/mnHome/mainView',
  '/mnHome/boardView',
  '/mnHome/boardDetail',
  '/mnHome/boardWriteView',
  '/mnHome/boardModifyView',
  '/mnHome/diaryView',
  '/mnHome/diaryWriteView',
  '/mnHome/diaryModifyView',
  '/mnHome/albumView',
  '/mnHome/albumDetailView',
  '/mnHome/albumWriteView',
  '/mnHome/visitView',
  '/mnHome/settingView',
  '/mnHome/settingBgm',
  '/mnHome/settingMenu',
  '/mnHome/settingSkin',
  '/mnHome/settingDotoriUse',
  '/mnHome/settingDotoriCharge',
  '/mnHome/settingFriends',
];

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET ?? 'helloworld-dev-secret-please-change-me-0123456789';
  return new TextEncoder().encode(value.padEnd(32, '0'));
}

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret());
    return Boolean((payload as { userNickname?: string }).userNickname);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  // 화면 조회(GET)만 대상으로 한다. POST 엔드포인트는 각자 JSON 으로 응답한다.
  if (request.method !== 'GET') return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (!PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  if (await hasValidSession(request)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = '/';
  url.search = `?msg=${encodeURIComponent('로그인이 필요합니다.')}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: '/mnHome/:path*',
};
