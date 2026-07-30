import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import Stylesheets from '@/components/Stylesheets';
import MiniHomeChrome from '@/components/minihome/MiniHomeChrome';

// 구 미니홈피 JSP 들이 전부 <title>미니홈피</title> 였다
export const metadata: Metadata = { title: '미니홈피' };

/**
 * 미니홈피 바깥 프레임.
 *
 * 구 main.jsp 는 스킨 배경 · 오디오 플레이어 · 하단 바를 페이지 안에 갖고 있었고,
 * 탭 이동은 ajaxTab.js 가 .bookcover 안쪽만 갈아끼워서 음악이 안 끊기게 했다.
 * 여기서는 그 바깥 부분을 레이아웃으로 올려 Next.js 클라이언트 라우팅이 같은 효과를 내게 했다.
 */
export default function MiniHomeFrameLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Stylesheets
        hrefs={[
          '/resources/css/minihome/fonts.css',
          '/resources/css/minihome/frame.css',
          '/resources/css/minihome/audio.css',
        ]}
      />
      <MiniHomeChrome>{children}</MiniHomeChrome>
    </>
  );
}
