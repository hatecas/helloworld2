import { NextResponse } from 'next/server';

import { getDiaryComments } from '@/lib/db/repo';

/** 구 DiaryController.getDiaryCmt */
export async function POST(request: Request) {
  try {
    const { seq } = (await request.json()) as { seq?: number | string };
    const seqNum = Number(seq);
    if (!Number.isFinite(seqNum)) return NextResponse.json({ cmt: [] });

    return NextResponse.json({ cmt: await getDiaryComments(seqNum) });
  } catch (error) {
    console.error('[getDiaryCmt]', error);
    return NextResponse.json({ cmt: [] });
  }
}
