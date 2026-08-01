import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import Stylesheets from '@/components/Stylesheets';
import Footer from '@/components/index/Footer';
import IndexHeader from '@/components/index/IndexHeader';
import PlazaClient from '@/components/plaza/PlazaClient';
import { getSessionUser } from '@/lib/session';
import { DEFAULT_MINIMI_PATH, getMyDotori, selectUserMinimi } from '@/lib/db/repo';

export const metadata: Metadata = { title: '광장' };

/**
 * 광장 — 내 미니미로 돌아다니며 다른 사람들과 실시간으로 만나고 채팅하는 곳.
 *
 * 실시간 연결은 브라우저가 Supabase Realtime 에 직접 붙는다. 그래서 anon 키가 필요한데,
 * 빌드 타임에 박아 넣는 NEXT_PUBLIC_ 방식 대신 서버에서 읽어 props 로 내려 준다.
 * (환경변수만 넣고 재시작하면 되고, 재빌드가 필요 없다. anon 키는 원래 공개용이다)
 */
export default async function PlazaPage() {
  const user = await getSessionUser();
  if (!user) redirect('/?msg=' + encodeURIComponent('광장은 로그인 후 이용할 수 있어요.'));

  const [dotori, minimi] = await Promise.all([
    getMyDotori(user.userNickname),
    selectUserMinimi(user.userNickname),
  ]);

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  return (
    <>
      <Stylesheets hrefs={['/resources/css/index/main.css', '/resources/css/plaza.css']} />
      <div className="index-frame">
        <IndexHeader loggedIn dotori={dotori} active="plaza" />
        <PlazaClient
          nickname={user.userNickname}
          minimi={minimi ?? DEFAULT_MINIMI_PATH}
          supabaseUrl={supabaseUrl}
          supabaseAnonKey={supabaseAnonKey}
        />
      </div>
      <div className="bottom-fix" />
      <Footer />
    </>
  );
}
