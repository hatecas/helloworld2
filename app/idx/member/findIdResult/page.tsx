import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import FindIdResultClient from '@/components/index/FindIdResultClient';
import { getFoundId } from '@/lib/session';

export const metadata: Metadata = { title: '아이디 찾기' };

/**
 * 구 MemberController.afterFindId 의 결과 화면.
 * 찾은 이메일은 URL 이 아니라 짧게 사는 httpOnly 쿠키에서 읽는다.
 */
export default async function FindIdResultPage() {
  const found = await getFoundId();
  if (!found) {
    redirect(`/index/member/findId?msg=${encodeURIComponent('다시 조회해주세요.')}`);
  }

  return <FindIdResultClient findId={found.userEmail} userName={found.userName} />;
}
