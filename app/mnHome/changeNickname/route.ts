import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { changeNickname } from '@/lib/db/repo';

/** 구 SettingController.changeNickname — 1 성공 / 3 중복 / 0 실패 */
export async function POST(request: Request) {
  try {
    const { userEmail, originalNickname, changedNickname } = (await request.json()) as {
      userEmail?: string;
      originalNickname?: string;
      changedNickname?: string;
    };

    const user = await getSessionUser();
    if (!user || user.userEmail !== userEmail || !originalNickname || !changedNickname) {
      return NextResponse.json(0);
    }

    return NextResponse.json(
      await changeNickname(user.userEmail, originalNickname, changedNickname),
    );
  } catch (error) {
    console.error('[changeNickname]', error);
    return NextResponse.json(0);
  }
}
