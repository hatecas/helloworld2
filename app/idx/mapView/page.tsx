import type { Metadata } from 'next';
import Stylesheets from '@/components/Stylesheets';
import Footer from '@/components/index/Footer';
import IndexHeader from '@/components/index/IndexHeader';
import KakaoMap from '@/components/index/KakaoMap';
import { getSessionUser } from '@/lib/session';
import { getMyDotori } from '@/lib/db/repo';

export const metadata: Metadata = { title: '찾아오는 길' };

/** 구 MapController.mapView + views/index/map.jsp */
export default async function MapPage() {
  const user = await getSessionUser();
  const dotori = user ? await getMyDotori(user.userNickname) : null;

  return (
    <>
      <Stylesheets hrefs={['/resources/css/index/main.css', '/resources/css/index/map.css']} />
      <div className="index-frame">
        <IndexHeader
          loggedIn={Boolean(user)}
          dotori={dotori}
          active="map"
          greeting={user ? `${user.userNickname} 님, 환영합니다.` : '찾아오는 길'}
        />
        <KakaoMap />
      </div>
      <div className="bottom-fix" />
      <Footer />
    </>
  );
}
