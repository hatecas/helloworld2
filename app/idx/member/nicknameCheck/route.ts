import { NextResponse } from 'next/server';

import { selectUserInfo } from '@/lib/db/repo';

/** 구 MemberController.nicknameCheck — 사용 가능하면 resultCode '1' */
export async function POST(request: Request) {
  try {
    const { userNickname } = (await request.json()) as { userNickname?: string };
    if (!userNickname) return NextResponse.json({ resultCode: '0' });

    const found = await selectUserInfo({ userNickname });
    return NextResponse.json(found ? { ...found, resultCode: '0' } : { resultCode: '1' });
  } catch (error) {
    console.error('[nicknameCheck]', error);
    return NextResponse.json({ resultCode: '0' });
  }
}
