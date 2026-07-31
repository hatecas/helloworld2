import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { searchUsers } from '@/lib/db/repo';

/** 메인 화면의 "미니홈피 검색" — 닉네임/이름 부분검색으로 방문할 사람을 찾는다 */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ results: [] });

    const { keyword } = (await request.json()) as { keyword?: string };
    if (!keyword?.trim()) return NextResponse.json({ results: [] });

    const results = await searchUsers(keyword, { exclude: user.userNickname });
    return NextResponse.json({ results });
  } catch (error) {
    console.error('[searchMinihome]', error);
    return NextResponse.json({ results: [] });
  }
}
