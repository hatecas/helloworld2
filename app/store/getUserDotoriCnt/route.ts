import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { getMyDotori } from '@/lib/db/repo';

/** 구 StoreController.afterBuyMyDotori */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ userDotoriCnt: 0 });
  return NextResponse.json({ userDotoriCnt: await getMyDotori(user.userNickname) });
}
