import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

/**
 * 구 HttpSession 을 대체하는 쿠키 세션.
 *
 * Tomcat 의 세션 대신 서명된 JWT 를 httpOnly 쿠키에 담는다.
 * 세션에 들어있던 값 중 도토리 수·미니미·일촌 수처럼 DB 에서 바로 구할 수 있는
 * 것들은 매 요청마다 조회하고, 순수하게 세션 성격인 값(방문 이력, 장바구니)만
 * 쿠키에 남긴다.
 */

const SESSION_COOKIE = 'helloworld_session';
const HISTORY_COOKIE = 'helloworld_history';
const CART_COOKIE = 'helloworld_cart';
const FOUND_ID_COOKIE = 'helloworld_found_id';
const PW_RESET_COOKIE = 'helloworld_pw_reset';

const MAX_AGE = 60 * 60 * 24 * 7; // 구 userEmail 쿠키와 동일하게 7일
/** 아이디 찾기 결과 · 비밀번호 재설정 티켓의 수명 */
const RECOVERY_MAX_AGE = 60 * 5;

export interface SessionUser {
  userEmail: string;
  userNickname: string;
  userName: string;
  userGender: string;
}

export interface CartItem {
  name: string;
  price: number;
  contentPath: string;
  tableCate: 'minimi' | 'skin' | 'menu';
}

/** 개발 편의용 기본 키. 프로덕션에서는 쓰지 못하게 막는다. */
const DEV_SECRET = 'helloworld-dev-secret-please-change-me-0123456789';

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET;

  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      // 기본 키로 서명하면 아무나 로그인 쿠키를 위조할 수 있다
      throw new Error(
        'SESSION_SECRET 이 설정되지 않았습니다. 배포 환경에서는 반드시 지정해야 합니다.\n' +
          '  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
      );
    }
    return new TextEncoder().encode(DEV_SECRET);
  }

  return new TextEncoder().encode(value.padEnd(32, '0'));
}

async function sign(payload: Record<string, unknown>, maxAge = MAX_AGE): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(secret());
}

async function verify<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as T;
  } catch {
    return null;
  }
}

/* ----------------------------- 로그인 세션 ----------------------------- */

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const payload = await verify<SessionUser & { exp: number }>(
    store.get(SESSION_COOKIE)?.value,
  );
  if (!payload?.userNickname) return null;
  return {
    userEmail: payload.userEmail,
    userNickname: payload.userNickname,
    userName: payload.userName,
    userGender: payload.userGender,
  };
}

export async function setSessionUser(user: SessionUser): Promise<void> {
  const token = await sign({ ...user });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(HISTORY_COOKIE);
  store.delete(CART_COOKIE);
}

/* --------------------- 아이디 찾기 / 비밀번호 재설정 --------------------- */
/*
 * 구 코드는 찾은 이메일을 URL 쿼리로 넘겼다.
 *   /index/member/findIdResult?findId=someone@gmail.com
 *   /index/member/findPwResult?findId=someone@gmail.com
 * 주소창·브라우저 기록·서버 로그·리퍼러에 남는 데다, 더 심각하게는
 * 비밀번호 변경(/index/member/findPw)이 폼으로 받은 이메일을 그대로 믿어서
 * 본인확인을 건너뛰고 아무 계정이나 탈취할 수 있었다.
 *
 * 이제 결과는 URL 대신 짧게 사는 httpOnly 쿠키로만 넘기고,
 * 비밀번호 변경은 이 쿠키(재설정 티켓)에 적힌 이메일에만 적용한다.
 */

async function setShortLived(name: string, payload: Record<string, unknown>): Promise<void> {
  const store = await cookies();
  store.set(name, await sign(payload, RECOVERY_MAX_AGE), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: RECOVERY_MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  });
}

/** 아이디 찾기 결과 */
export async function setFoundId(userEmail: string, userName: string): Promise<void> {
  await setShortLived(FOUND_ID_COOKIE, { userEmail, userName });
}

export async function getFoundId(): Promise<{ userEmail: string; userName: string } | null> {
  const store = await cookies();
  const payload = await verify<{ userEmail?: string; userName?: string }>(
    store.get(FOUND_ID_COOKIE)?.value,
  );
  if (!payload?.userEmail) return null;
  return { userEmail: payload.userEmail, userName: payload.userName ?? '' };
}

/** 비밀번호 재설정 티켓 — 본인확인을 통과해야만 발급된다 */
export async function issuePasswordResetTicket(userEmail: string): Promise<void> {
  await setShortLived(PW_RESET_COOKIE, { userEmail, purpose: 'password-reset' });
}

export async function getPasswordResetEmail(): Promise<string | null> {
  const store = await cookies();
  const payload = await verify<{ userEmail?: string; purpose?: string }>(
    store.get(PW_RESET_COOKIE)?.value,
  );
  if (payload?.purpose !== 'password-reset' || !payload.userEmail) return null;
  return payload.userEmail;
}

export async function clearPasswordResetTicket(): Promise<void> {
  const store = await cookies();
  store.delete(PW_RESET_COOKIE);
  store.delete(FOUND_ID_COOKIE);
}

/* -------------------- 방문 이력 (이전에 방문한 홈피) -------------------- */

/**
 * 구 MainController 의 session pageHistory / lastPage 대체.
 * 미니홈피를 열 때마다 호출하고, 직전에 봤던 홈피 닉네임을 돌려준다.
 */
export async function pushPageHistory(userNickname: string): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(HISTORY_COOKIE)?.value;

  let history: string[] = [];
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) history = parsed.filter((v): v is string => typeof v === 'string');
    } catch {
      history = [];
    }
  }

  if (history.length === 0 || history[history.length - 1] !== userNickname) {
    history.push(userNickname);
  }
  history = history.slice(-20);

  store.set(HISTORY_COOKIE, JSON.stringify(history), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });

  return history.length > 1 ? history[history.length - 2] : null;
}

export async function getLastPage(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(HISTORY_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < 2) return null;
    return String(parsed[parsed.length - 2]);
  } catch {
    return null;
  }
}

/* ------------------------------ 장바구니 ------------------------------ */

export async function getCart(): Promise<CartItem[]> {
  const store = await cookies();
  const raw = store.get(CART_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

export async function setCart(items: CartItem[]): Promise<void> {
  const store = await cookies();
  store.set(CART_COOKIE, JSON.stringify(items), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function clearCart(): Promise<void> {
  const store = await cookies();
  store.delete(CART_COOKIE);
}
