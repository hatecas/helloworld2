import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { friendCheck, insertFriendCmt, selectFriendCmt } from '@/lib/db/repo';

/** 구 MainController.friendCMT — 일촌평 작성 후 최신 목록을 돌려준다 */
export async function POST(request: Request) {
  try {
    const { userNickname, friendNickname, content } = (await request.json()) as {
      userNickname?: string;
      friendNickname?: string;
      content?: string;
    };

    const user = await getSessionUser();
    if (!user || !friendNickname || !content?.trim() || user.userNickname !== userNickname) {
      return NextResponse.json([]);
    }
    // 일촌만 작성 가능 (구 화면에서만 막던 것을 서버에서도 확인한다)
    if ((await friendCheck(friendNickname, user.userNickname)) !== 1) {
      return NextResponse.json(await selectFriendCmt(friendNickname));
    }

    await insertFriendCmt(user.userNickname, friendNickname, content);
    return NextResponse.json(await selectFriendCmt(friendNickname));
  } catch (error) {
    console.error('[friendCmt]', error);
    return NextResponse.json([]);
  }
}
