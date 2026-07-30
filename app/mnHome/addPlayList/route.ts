import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { setPlayList } from '@/lib/db/repo';

/** 구 SettingController.addPlayList */
export async function POST(request: Request) {
  try {
    const { userNickname, title } = (await request.json()) as {
      userNickname?: string;
      title?: string[];
    };

    const user = await getSessionUser();
    if (!user || user.userNickname !== userNickname || !Array.isArray(title)) {
      return NextResponse.json(0);
    }

    return NextResponse.json(await setPlayList(user.userNickname, title, 1));
  } catch (error) {
    console.error('[addPlayList]', error);
    return NextResponse.json(0);
  }
}
