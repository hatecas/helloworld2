import { NextResponse } from 'next/server';

import { searchUser } from '@/lib/db/repo';

/** 구 SettingController.searchFriends (와 동일 동작이던 /miniHome/setting) */
export async function POST(request: Request) {
  try {
    const { userNickname } = (await request.json()) as { userNickname?: string };
    if (!userNickname) return NextResponse.json({ resultCode: '0' });

    const found = await searchUser(userNickname);
    if (!found) return NextResponse.json({ resultCode: '0' });

    return NextResponse.json({ ...found, resultCode: '1' });
  } catch (error) {
    console.error('[searchFriends]', error);
    return NextResponse.json({ resultCode: '0' });
  }
}
