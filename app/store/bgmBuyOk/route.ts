import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { getBgmList, getMyDotori, putBgm, selectMyBgm, setDotori } from '@/lib/db/repo';

interface SelectedBgm {
  title: string;
  artist: string;
  price: string;
}

/** 구 StoreController.bgmBuyOk */
export async function POST(request: Request) {
  const fail = (reason: string) =>
    NextResponse.redirect(
      new URL(`/store/bgmBuyFail?reason=${encodeURIComponent(reason)}`, request.url),
      303,
    );

  try {
    const user = await getSessionUser();
    if (!user) return fail(' 로그인 후 이용해주세요.');

    const form = await request.formData();
    const totalPrice = Number(form.get('totalPrice')) || 0;

    let selected: SelectedBgm[] = [];
    try {
      const parsed: unknown = JSON.parse(String(form.get('selectedData') ?? '[]'));
      if (Array.isArray(parsed)) selected = parsed as SelectedBgm[];
    } catch {
      selected = [];
    }
    if (selected.length === 0) return fail(' 선택된 곡이 없습니다.');

    // 도토리 잔액 확인
    const current = await getMyDotori(user.userNickname);
    const amount = current - totalPrice;
    if (amount < 0) {
      return fail(` [${-amount}] 개 의 도토리가 부족합니다.`);
    }

    // 이미 보유한 곡이 섞여 있으면 통째로 거절
    const owned = new Set((await selectMyBgm(user.userNickname)).map((b) => b.title));
    const duplicated = selected.find((item) => owned.has(item.title));
    if (duplicated) {
      return fail(` [${duplicated.title}] BGM 은 이미 보유하고있습니다.`);
    }

    for (const item of selected) {
      const [found] = await getBgmList({ title: item.title, artist: item.artist });
      if (!found) continue;
      await putBgm({
        userNickname: user.userNickname,
        title: found.title,
        artist: found.artist,
        runningTime: found.runningTime,
        contentPath: found.contentPath,
        bgmPrice: found.bgmPrice,
      });
    }

    await setDotori(user.userNickname, amount);

    return NextResponse.redirect(new URL('/store/bgmBuySuccess', request.url), 303);
  } catch (error) {
    console.error('[bgmBuyOk]', error);
    return NextResponse.redirect(new URL('/error', request.url), 303);
  }
}
