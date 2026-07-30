import { NextResponse } from 'next/server';

import { clearCart } from '@/lib/session';

/** 구 StoreController.clearCart */
export async function POST() {
  await clearCart();
  return NextResponse.json({ success: true });
}
