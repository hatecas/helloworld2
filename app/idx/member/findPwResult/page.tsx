import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import FindPwResultClient from '@/components/index/FindPwResultClient';
import { getPasswordResetEmail } from '@/lib/session';

export const metadata: Metadata = { title: '비밀번호 변경' };

/**
 * 새 비밀번호 설정 화면.
 *
 * 본인확인을 통과해 재설정 티켓(httpOnly 쿠키)이 있는 사람만 들어올 수 있다.
 * 변경 대상 계정은 화면에도, URL 에도 싣지 않는다.
 */
export default async function FindPwResultPage({
  searchParams,
}: {
  searchParams: Promise<{ updateResult?: string; msg?: string }>;
}) {
  const params = await searchParams;

  // 변경 완료 화면은 티켓이 이미 폐기된 뒤라 결과만 보여준다
  if (!params.updateResult) {
    const ticket = await getPasswordResetEmail();
    if (!ticket) {
      redirect(
        `/index/member/findPwView?msg=${encodeURIComponent('본인 확인 후 이용해주세요.')}`,
      );
    }
  }

  return (
    <FindPwResultClient updateResult={params.updateResult ?? ''} msg={params.msg ?? ''} />
  );
}
