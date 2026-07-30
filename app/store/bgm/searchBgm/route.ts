import { NextResponse } from 'next/server';

import { getBgmList } from '@/lib/db/repo';

/** 구 StoreController.searchBgmList */
export async function POST(request: Request) {
  try {
    const { content } = (await request.json()) as { content?: string };
    return NextResponse.json({ result: 'success', data: await getBgmList({ content }) });
  } catch (error) {
    console.error('[searchBgm]', error);
    return NextResponse.json({ result: 'fail', data: [] });
  }
}
