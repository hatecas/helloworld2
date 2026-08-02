import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { updateHomeOpenScope } from '@/lib/db/repo';

/**
 * 미니홈피 전체 공개/비공개 전환 (관리 화면).
 *  - 1 = 공개   : 모르는 사람도 들어와서 '전체공개' 글까지 볼 수 있다
 *  - 0 = 비공개 : 일촌이 아니면 미니홈피 자체를 못 본다
 */
export async function POST(request: Request) {
  try {
    const { scope } = (await request.json()) as { scope?: number | string };
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ resultCode: '0' }, { status: 401 });

    const next = Number(scope) === 0 ? 0 : 1;
    await updateHomeOpenScope(user.userNickname, next);
    return NextResponse.json({ resultCode: '1', scope: next });
  } catch (error) {
    console.error('[homeScope]', error);
    return NextResponse.json({ resultCode: '0' });
  }
}
