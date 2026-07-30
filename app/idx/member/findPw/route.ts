import { NextResponse } from 'next/server';

import { sha256 } from '@/lib/crypto';
import { updatePw } from '@/lib/db/repo';
import { clearPasswordResetTicket, getPasswordResetEmail } from '@/lib/session';

/**
 * 구 MemberController.findPw — 새 비밀번호 저장.
 *
 * 바꿀 계정은 폼이 아니라 재설정 티켓(본인확인을 통과해야 발급되는 httpOnly 쿠키)에서만 읽는다.
 * 구 코드는 폼의 userId 를 그대로 믿어서, 본인확인 없이 아무 계정의 비밀번호나
 * 바꿀 수 있었다(계정 탈취).
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const newPw = String(form.get('newPw') ?? '');

  const params = new URLSearchParams();

  const userEmail = await getPasswordResetEmail();
  if (!userEmail) {
    params.set('msg', '본인 확인이 만료되었습니다. 다시 시도해주세요.');
    return NextResponse.redirect(
      new URL(`/index/member/findPwView?${params}`, request.url),
      303,
    );
  }

  if (newPw.length < 4) {
    params.set('msg', '비밀번호는 4자 이상이어야 합니다.');
    return NextResponse.redirect(
      new URL(`/index/member/findPwResult?${params}`, request.url),
      303,
    );
  }

  try {
    const updated = await updatePw(userEmail, sha256(newPw));
    if (updated !== 1) throw new Error('user not found');

    // 티켓은 한 번만 쓰이도록 즉시 폐기
    await clearPasswordResetTicket();

    params.set('updateResult', '1');
    params.set('msg', '변경되었습니다.');
  } catch (error) {
    console.error('[findPw]', error);
    params.set('updateResult', '0');
    params.set('msg', '잠시 후 다시 시도해주세요.');
  }

  return NextResponse.redirect(
    new URL(`/index/member/findPwResult?${params}`, request.url),
    303,
  );
}
