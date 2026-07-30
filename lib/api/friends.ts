import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { selectFriends, updateFriendStatus } from '@/lib/db/repo';
import type { FriendStatus } from '@/lib/db/types';

/**
 * 구 SettingController 의 accept / reject / cancle / getFriends 는 전부
 * 같은 updateFriends 호출이었다. 본인이 관여한 관계인지만 추가로 확인한다.
 */
export async function updateFriendshipFromRequest(request: Request) {
  try {
    const body = (await request.json()) as { seq?: number; fStatus?: number; del?: string };
    const user = await getSessionUser();

    if (!user || typeof body.seq !== 'number') {
      return NextResponse.json({ msg: '실패' });
    }

    const mine = (await selectFriends(user.userNickname)).some((f) => f.seq === body.seq);
    if (!mine) {
      return NextResponse.json({ msg: '실패' });
    }

    await updateFriendStatus(body.seq, {
      fStatus: body.fStatus as FriendStatus | undefined,
      del: body.del === 'Y' ? 'Y' : body.del === 'N' ? 'N' : undefined,
    });

    return NextResponse.json({ msg: '성공' });
  } catch (error) {
    console.error('[friends]', error);
    return NextResponse.json({ msg: '실패' });
  }
}
