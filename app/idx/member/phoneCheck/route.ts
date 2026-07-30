import { NextResponse } from 'next/server';

import { selectUserInfo } from '@/lib/db/repo';

/** 구 MemberController.phoneCheck — 사용 가능하면 resultCode '1' */
export async function POST(request: Request) {
  try {
    const { userPhone } = (await request.json()) as { userPhone?: string };
    if (!userPhone) return NextResponse.json({ resultCode: '0' });

    const found = await selectUserInfo({ userPhone });
    return NextResponse.json(found ? { ...found, resultCode: '0' } : { resultCode: '1' });
  } catch (error) {
    console.error('[phoneCheck]', error);
    return NextResponse.json({ resultCode: '0' });
  }
}
