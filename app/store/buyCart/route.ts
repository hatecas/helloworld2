import { NextResponse } from 'next/server';

import { clearCart, getCart, getSessionUser } from '@/lib/session';
import {
  getMyDotori,
  hasStorageItem,
  insertBuyCart,
  insertDotoriUse,
  setDotori,
} from '@/lib/db/repo';

const CATEGORY_LABEL: Record<string, string> = {
  minimi: '미니미',
  skin: '스킨',
  menu: '메뉴',
};

/** 구 StoreController.buyCart + StoreServiceImpl.buyCart */
export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, message: '로그인 후 이용해주세요.' });
    }

    const cart = await getCart();
    if (cart.length === 0) {
      return NextResponse.json({ success: false, message: '장바구니가 비어 있습니다.' });
    }

    // 이미 보유한 상품이 섞여 있으면 통째로 거절 (구 hasDuplicateCartItem)
    for (const item of cart) {
      if (await hasStorageItem(user.userNickname, item.tableCate, item.name)) {
        return NextResponse.json({
          success: false,
          message: '이미 보유하고 있는 상품이 있습니다.',
        });
      }
    }

    const total = cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    const current = await getMyDotori(user.userNickname);
    if (current - total < 0) {
      return NextResponse.json({ success: false, message: '보유한 도토리 개수가 부족합니다.' });
    }

    for (const item of cart) {
      await insertDotoriUse(
        user.userNickname,
        Number(item.price) || 0,
        `${CATEGORY_LABEL[item.tableCate] ?? item.tableCate} 구매-${item.name}`,
      );
      await insertBuyCart({
        userNickname: user.userNickname,
        category: item.tableCate,
        productName: item.name,
        contentPath: item.contentPath,
      });
    }

    await setDotori(user.userNickname, current - total);
    await clearCart();

    return NextResponse.json({ success: true, message: '상품 구매가 완료되었습니다.' });
  } catch (error) {
    console.error('[buyCart]', error);
    return NextResponse.json({ success: false, message: '구매 중 오류가 발생했습니다.' });
  }
}
