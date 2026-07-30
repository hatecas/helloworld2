import type { Metadata } from 'next';

import FindIdClient from '@/components/index/FindIdClient';

export const metadata: Metadata = { title: '아이디 찾기' };

/** 구 MemberController.findId + views/index/findId.jsp */
export default async function FindIdPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const { msg } = await searchParams;
  return <FindIdClient msg={msg ?? ''} />;
}
