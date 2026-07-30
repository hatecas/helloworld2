import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { changeName } from '@/lib/db/repo';

/** 구 SettingController.changeName — 1 성공 / 4 기존 이름 미입력 / 그 외 실패 */
export async function POST(request: Request) {
  try {
    const { userNickname, originalName, changedName } = (await request.json()) as {
      userNickname?: string;
      originalName?: string;
      changedName?: string;
    };

    if (!originalName) return NextResponse.json(4);

    const user = await getSessionUser();
    if (!user || user.userNickname !== userNickname || !changedName) {
      return NextResponse.json(0);
    }

    return NextResponse.json(await changeName(user.userNickname, originalName, changedName));
  } catch (error) {
    console.error('[changeName]', error);
    return NextResponse.json(0);
  }
}
