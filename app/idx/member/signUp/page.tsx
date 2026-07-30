import type { Metadata } from 'next';
import SignUpClient from '@/components/index/SignUpClient';

export const metadata: Metadata = { title: '회원가입' };

/** 구 MemberController.signUp + views/index/signUp.jsp */
export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const { msg } = await searchParams;
  return <SignUpClient msg={msg ?? ''} />;
}
