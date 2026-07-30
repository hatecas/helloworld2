import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { applyStorageItem } from '@/lib/db/repo';

/** 구 SettingController.MinimiChange */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL('/mnhProfileEditFail?loggedOut=1', request.url), 303);
  }

  const form = await request.formData();
  const productName = String(form.get('selectedUserStorage') ?? '').trim();

  if (productName) {
    await applyStorageItem(user.userNickname, 'minimi', productName);
  }

  return NextResponse.redirect(new URL('/mnHome/mnhMinimiChangeSuccess', request.url), 303);
}
