import { NextResponse } from 'next/server';

import { getCart, setCart, type CartItem } from '@/lib/session';

/** 구 StoreController.addToCart — 세션 장바구니를 쿠키 장바구니로 옮겼다 */
export async function POST(request: Request) {
  const body = (await request.json()) as Partial<CartItem> & { cate?: string };

  if (!body.name || !body.tableCate || !body.contentPath) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const item: CartItem = {
    name: body.name,
    price: Number(body.price) || 0,
    contentPath: body.contentPath,
    tableCate: body.tableCate,
  };

  const cart = await getCart();
  const duplicated = cart.some((c) => c.tableCate === item.tableCate && c.name === item.name);
  if (!duplicated) {
    await setCart([...cart, item]);
  }

  return NextResponse.json({ success: true, duplicated });
}
