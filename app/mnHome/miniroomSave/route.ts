import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { saveMiniroom } from '@/lib/db/repo';

/** 구 MainController.miniroomSave — 배경 1개 + 미니미 N개의 좌표를 저장한다 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL('/mnhProfileEditFail?loggedOut=1', request.url), 303);
  }

  const form = await request.formData();
  const backgroundName = String(form.get('backgroundName') ?? '').trim();
  if (!backgroundName) {
    return NextResponse.redirect(new URL('/mnHome/miniroomEditView', request.url), 303);
  }

  const minimis: Array<{ minimiName: string; minimiLeft: string; minimiTop: string }> = [];
  for (let i = 0; form.has(`minimiName${i}`); i++) {
    minimis.push({
      minimiName: String(form.get(`minimiName${i}`)),
      minimiLeft: String(form.get(`minimiLeft${i}`) ?? '0px'),
      minimiTop: String(form.get(`minimiTop${i}`) ?? '0px'),
    });
  }

  await saveMiniroom(user.userNickname, backgroundName, minimis);

  return NextResponse.redirect(new URL('/mnHome/miniroomEditSuccess', request.url), 303);
}
