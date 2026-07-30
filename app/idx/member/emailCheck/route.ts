import { NextResponse } from 'next/server';

import { selectUserInfo } from '@/lib/db/repo';

/** 구 MemberController.emailCheck — 사용 가능하면 resultCode '1' */
export async function POST(request: Request) {
  try {
    const { userEmail } = (await request.json()) as { userEmail?: string };
    if (!userEmail) return NextResponse.json({ resultCode: '0' });

    const found = await selectUserInfo({ userEmail });
    return NextResponse.json(found ? { ...found, resultCode: '0' } : { resultCode: '1' });
  } catch (error) {
    console.error('[emailCheck]', error);
    return NextResponse.json({ resultCode: '0' });
  }
}
