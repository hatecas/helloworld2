import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { getForestRecords, saveForestRecord } from '@/lib/db/repo';
import { mapOf } from '@/lib/plaza/maps';
import type { MapId } from '@/lib/plaza/protocol';

/**
 * 인내의 숲 등반 기록.
 *  - GET       : 맵별 상위 3명 (광장 입구 팻말에 새긴다)
 *  - POST { map, ms } : 정상에 오른 기록을 남긴다 (개인 최고 기록만 갱신)
 *
 * 기록은 브라우저가 재서 보낸다. 서버가 등반을 따라 계산하지 않으므로 마음먹으면
 * 꾸밀 수 있는데, 여기서는 '물리적으로 불가능한 값'(맵마다 정해 둔 하한) 만 걸러낸다.
 * 미니홈피 놀이에 그 이상의 검증을 붙일 이유는 없다고 봤다.
 */

const TOP = 3;
const RECORD_MAPS: MapId[] = ['forest', 'forest2'];

export async function GET() {
  try {
    const [forest, forest2] = await Promise.all(
      RECORD_MAPS.map((map) => getForestRecords(map, TOP)),
    );
    return NextResponse.json({ forest, forest2 });
  } catch (error) {
    console.error('[plazaRecords:get]', error);
    return NextResponse.json({ forest: [], forest2: [] });
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const { map, ms } = (await request.json()) as { map?: string; ms?: number };

    if (!RECORD_MAPS.includes(map as MapId) || typeof ms !== 'number' || !Number.isFinite(ms)) {
      return NextResponse.json({ ok: false });
    }

    // 사람이 낼 수 없는 시간은 받지 않는다 (하한은 시뮬레이션으로 잰 값)
    const floor = mapOf(map as MapId).minClimbMs ?? 0;
    if (ms < floor) return NextResponse.json({ ok: false });

    const best = await saveForestRecord(user.userNickname, map as MapId, Math.round(ms));
    return NextResponse.json({ ok: true, best, top: await getForestRecords(map as MapId, TOP) });
  } catch (error) {
    console.error('[plazaRecords:post]', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
