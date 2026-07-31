import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { selectPendingFriendRequests } from '@/lib/db/repo';

/** 메인 화면에서 "일촌 신청" 을 누르면 받은 대기중 신청 목록을 내려준다 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ requests: [] });

    const requests = await selectPendingFriendRequests(user.userNickname);
    return NextResponse.json({ requests });
  } catch (error) {
    console.error('[friendRequests]', error);
    return NextResponse.json({ requests: [] });
  }
}
