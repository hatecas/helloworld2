import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { changeNumber } from '@/lib/db/repo';

/** 구 SettingController.changeNumber — 1 성공 / 3 중복 / 0 실패 */
export async function POST(request: Request) {
  try {
    const { userNickname, originalNumber, changedNumber } = (await request.json()) as {
      userNickname?: string;
      originalNumber?: string;
      changedNumber?: string;
    };

    const user = await getSessionUser();
    if (!user || user.userNickname !== userNickname || !originalNumber || !changedNumber) {
      return NextResponse.json(0);
    }

    return NextResponse.json(
      await changeNumber(user.userNickname, originalNumber, changedNumber),
    );
  } catch (error) {
    console.error('[changeNumber]', error);
    return NextResponse.json(0);
  }
}
