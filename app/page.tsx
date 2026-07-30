import { getSessionUser } from '@/lib/session';
import { getMyDotori, selectUserMinimi, DEFAULT_MINIMI_PATH } from '@/lib/db/repo';
import HomeClient from '@/components/index/HomeClient';

/** 구 HomeController.home + views/home.jsp */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const { msg } = await searchParams;
  const user = await getSessionUser();

  const dotori = user ? await getMyDotori(user.userNickname) : null;
  const userMinimi = user
    ? ((await selectUserMinimi(user.userNickname)) ?? DEFAULT_MINIMI_PATH)
    : DEFAULT_MINIMI_PATH;

  return (
    <HomeClient
      userNickname={user?.userNickname ?? ''}
      userEmail={user?.userEmail ?? ''}
      dotori={dotori}
      userMinimi={userMinimi}
      msg={msg ?? ''}
    />
  );
}
