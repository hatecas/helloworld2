import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { insertFriendRequest } from '@/lib/db/repo';

/** 구 SettingController.requestFriendship */
export async function POST(request: Request) {
  try {
    const { requestUser, responseUser } = (await request.json()) as {
      requestUser?: string;
      responseUser?: string;
    };

    const user = await getSessionUser();
    if (!user || user.userNickname !== requestUser || !responseUser) {
      return NextResponse.json({ msg: '실패' });
    }

    const result = await insertFriendRequest(user.userNickname, responseUser);
    return NextResponse.json({ code: String(result) });
  } catch (error) {
    console.error('[friendRequest]', error);
    return NextResponse.json({ msg: '실패' });
  }
}
