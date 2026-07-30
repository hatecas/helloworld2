import type { Metadata } from 'next';
import PopupResult from '@/components/minihome/PopupResult';

export const metadata: Metadata = { title: '프로필 수정' };

/** 구 ProfileController.mnhProfileEditFail + views/miniHome/mnhProfileEditFail.jsp */
export default async function ProfileEditFailPage({
  searchParams,
}: {
  searchParams: Promise<{ loggedOut?: string }>;
}) {
  const { loggedOut } = await searchParams;

  return (
    <>
      <PopupResult
        tone="fail"
        text={loggedOut ? '로그인이 필요합니다' : '저장하지 못했습니다'}
        sub={loggedOut ? '로그인 후 다시 시도해주세요.' : '잠시 후 다시 시도해주세요.'}
      />
    </>
  );
}
