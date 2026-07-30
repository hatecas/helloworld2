import { NextResponse } from 'next/server';

import { getCart } from '@/lib/session';

/** 구 StoreController.loadCart */
export async function GET() {
  return NextResponse.json(await getCart());
}
