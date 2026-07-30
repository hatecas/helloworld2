'use client';

import Script from 'next/script';
import { useCallback, useRef } from 'react';

/**
 * map.jsp 의 카카오맵 부분.
 * appkey 는 원본에 하드코딩되어 있던 값을 기본값으로 두고,
 * NEXT_PUBLIC_KAKAO_MAP_KEY 로 덮어쓸 수 있게 했다.
 */
const APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? 'afa149d5091d552ae811a96e9423ecce';

const CORE_LAT = 37.659937;
const CORE_LNG = 126.770906;

// 카카오맵 SDK 는 타입 선언이 없으므로 최소한만 좁혀서 쓴다.
type KakaoMapsApi = {
  maps: {
    load?: (cb: () => void) => void;
    LatLng: new (lat: number, lng: number) => unknown;
    LatLngBounds: new () => { extend: (p: unknown) => void };
    Map: new (container: HTMLElement, options: unknown) => { setBounds: (b: unknown) => void };
    Marker: new (options: unknown) => { setMap: (m: unknown) => void };
    InfoWindow: new (options: unknown) => { open: (m: unknown, marker: unknown) => void };
  };
};

export default function KakaoMap() {
  const mapRef = useRef<{ setBounds: (b: unknown) => void } | null>(null);
  const boundsRef = useRef<unknown>(null);

  const init = useCallback(() => {
    const kakao = (window as unknown as { kakao?: KakaoMapsApi }).kakao;
    const container = document.getElementById('map');
    if (!kakao || !container) return;

    const build = () => {
      const center = new kakao.maps.LatLng(CORE_LAT, CORE_LNG);
      const map = new kakao.maps.Map(container, { center, level: 3 });
      mapRef.current = map;

      const bounds = new kakao.maps.LatLngBounds();
      bounds.extend(center);
      boundsRef.current = bounds;

      const marker = new kakao.maps.Marker({ position: center });
      marker.setMap(map);

      const infowindow = new kakao.maps.InfoWindow({
        position: center,
        content:
          '<a href="#" id="map-find-link" class="map-find" ' +
          'style="margin-left: 30px; color: red; font-weight: bold; text-align: center;">Core 길찾기</a>',
      });
      infowindow.open(map, marker);

      // 인포윈도우는 SDK 가 만들어 넣으므로 위임으로 클릭을 잡는다
      document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement | null;
        if (target?.id === 'map-find-link') {
          e.preventDefault();
          window.open(
            `https://map.kakao.com/link/to/Core%20팀 만나러가기!,${CORE_LAT},${CORE_LNG}`,
            'KakaoMap',
            'width=1200, height=720',
          );
        }
      });
    };

    if (typeof kakao.maps.load === 'function') {
      kakao.maps.load(build);
    } else {
      build();
    }
  }, []);

  return (
    <>
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${APP_KEY}&autoload=false&libraries=services,clusterer,drawing`}
        strategy="afterInteractive"
        onReady={init}
      />
      <div className="map-frame">
        <div id="map" />
        <p>
          <button
            className="map-rocation"
            onClick={() => {
              if (mapRef.current && boundsRef.current) mapRef.current.setBounds(boundsRef.current);
            }}
          >
            Core 위치로 돌아가기
          </button>
        </p>
      </div>
    </>
  );
}
