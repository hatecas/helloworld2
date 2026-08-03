import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { getForestRecords, saveForestRecord } from '@/lib/db/repo';
import { RUN_KEY, RUN_MIN_MS } from '@/lib/plaza/maps';

/**
 * 인내의 숲 완주 기록.
 *  - GET        : 상위 3명 (광장 입구 팻말에 새긴다)
 *  - POST { ms }: 완주 기록을 남긴다 (개인 최고 기록만 갱신)
 *
 * 기록은 **1층 시작부터 2층(숲 깊은 곳) 정상까지** 한 번에 오른 시간이다.
 * 층별 기록은 남기지 않는다 — 팻말에 새기는 건 완주뿐이다.
 *
 * 기록은 브라우저가 재서 보낸다. 서버가 등반을 따라 계산하지 않으므로 마음먹으면
 * 꾸밀 수 있는데, 여기서는 '물리적으로 불가능한 값'(두 층의 점프 체공 시간 합) 만
 * 걸러낸다. 미니홈피 놀이에 그 이상의 검증을 붙일 이유는 없다고 봤다.
 */

const TOP = 3;

export async function GET() {
  try {
    return NextResponse.json({ [RUN_KEY]: await getForestRecords(RUN_KEY, TOP) });
  } catch (error) {
    console.error('[plazaRecords:get]', error);
    return NextResponse.json({ [RUN_KEY]: [] });
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const { ms } = (await request.json()) as { ms?: number };
    if (typeof ms !== 'number' || !Number.isFinite(ms) || ms < RUN_MIN_MS) {
      return NextResponse.json({ ok: false });
    }

    const best = await saveForestRecord(user.userNickname, RUN_KEY, Math.round(ms));
    return NextResponse.json({ ok: true, best, top: await getForestRecords(RUN_KEY, TOP) });
  } catch (error) {
    console.error('[plazaRecords:post]', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
