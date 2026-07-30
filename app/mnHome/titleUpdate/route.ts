import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { updateHomeTitle } from '@/lib/db/repo';

/** 구 MainController.setTitle */
export async function POST(request: Request) {
  try {
    const { title, userNickname } = (await request.json()) as {
      title?: string;
      userNickname?: string;
    };
    const user = await getSessionUser();

    if (!user || !userNickname || user.userNickname !== userNickname) {
      return NextResponse.json({ msg: '실패' });
    }

    await updateHomeTitle(userNickname, title ?? '');
    return NextResponse.json({ msg: '성공' });
  } catch (error) {
    console.error('[titleUpdate]', error);
    return NextResponse.json({ msg: '실패' });
  }
}
