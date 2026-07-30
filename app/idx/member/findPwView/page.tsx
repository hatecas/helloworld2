import type { Metadata } from 'next';
import FindPwClient from '@/components/index/FindPwClient';

export const metadata: Metadata = { title: '비밀번호 찾기' };

/** 구 MemberController.findPwView + views/index/findPw.jsp */
export default async function FindPwViewPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const { msg } = await searchParams;
  return <FindPwClient msg={msg ?? ''} />;
}
