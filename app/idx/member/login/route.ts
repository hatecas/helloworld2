import { NextResponse } from 'next/server';

import { sha256 } from '@/lib/crypto';
import { setSessionUser } from '@/lib/session';
import {
  insertLoginLog,
  loginOnStatus,
  selectOnFriends,
  selectUserInfo,
  selectUserMinimi,
  DEFAULT_MINIMI_PATH,
} from '@/lib/db/repo';

/**
 * 구 MemberController.login (/index/member/login, POST, JSON)
 * 응답 형태(resultCode / userNickname / userDotoriCnt / contentPath / friendCnt)는
 * home.jsp 의 ajax 코드가 그대로 쓰고 있어 동일하게 유지한다.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { userEmail?: string; userPassword?: string };

    if (!body.userEmail || !body.userPassword) {
      return NextResponse.json({ resultCode: '0' });
    }

    const user = await selectUserInfo({
      userEmail: body.userEmail,
      userPassword: sha256(body.userPassword),
    });

    if (!user) {
      return NextResponse.json({ resultCode: '0' });
    }

    await insertLoginLog(user.userNickname);
    await loginOnStatus(user.userNickname);

    await setSessionUser({
      userEmail: user.userEmail,
      userNickname: user.userNickname,
      userName: user.userName,
      userGender: user.userGender,
    });

    const minimi = (await selectUserMinimi(user.userNickname)) ?? DEFAULT_MINIMI_PATH;
    const onFriends = await selectOnFriends(user.userNickname);

    return NextResponse.json({
      resultCode: '1',
      userEmail: user.userEmail,
      userNickname: user.userNickname,
      userDotoriCnt: user.currentDotori,
      contentPath: minimi,
      friendCnt: onFriends.length,
    });
  } catch (error) {
    console.error('[login]', error);
    return NextResponse.json({ resultCode: '-1' });
  }
}
