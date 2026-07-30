import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { applyStorageItem } from '@/lib/db/repo';

/** 구 SettingController.skinChoice */
export async function POST(request: Request) {
  try {
    const { selectedProductName } = (await request.json()) as { selectedProductName?: string };
    const user = await getSessionUser();
    if (!user || !selectedProductName) return NextResponse.json({});

    const applied = await applyStorageItem(user.userNickname, 'skin', selectedProductName);
    return NextResponse.json(applied ? { ...applied, resultCode: '1' } : {});
  } catch (error) {
    console.error('[skinChoice]', error);
    return NextResponse.json({});
  }
}
