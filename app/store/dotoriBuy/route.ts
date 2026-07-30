import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { chargeDotori } from '@/lib/db/repo';

const METHOD_LABEL: Record<string, string> = {
  kakaopay: '카카오페이',
  html5_inicis: '신용/체크카드',
  free: '무료충전',
};

/** 구 StoreController.dotoriBuy — 결제 성공 후 도토리를 실제로 충전한다 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL('/', request.url), 303);
  }

  const form = await request.formData();
  const dotoriCharge = Number(form.get('content'));
  const method = String(form.get('method') ?? 'free');
  const price = String(form.get('price') ?? '0');

  if (!Number.isFinite(dotoriCharge) || dotoriCharge <= 0) {
    return NextResponse.redirect(new URL('/store/dotoriView', request.url), 303);
  }

  await chargeDotori({
    userNickname: user.userNickname,
    dotoriCharge,
    dotoriMethod: METHOD_LABEL[method] ?? method,
    dotoriPrice: price,
  });

  return NextResponse.redirect(new URL('/store/dotoriBuySuccess', request.url), 303);
}
