import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  // 각 페이지가 title 을 정하면 "○○ · 헬로월드" 로 붙는다
  title: {
    default: '헬로월드',
    template: '%s · 헬로월드',
  },
  description: '그때 그 미니홈피, 다시. 다이어리 · 사진첩 · 방명록 · 일촌 · 미니룸.',
  icons: { icon: '/resources/images/minihome/favicon.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

/**
 * 구 프로젝트는 JSP 마다 <head> 를 직접 들고 있었다.
 * 여기서는 루트 레이아웃이 문서 뼈대만 잡고, 페이지별 CSS 는 각 페이지가
 * <Stylesheets> 로 선언한다 (React 19 가 <head> 로 끌어올려 준다).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* 알림/확인 모달은 어느 화면에서나 뜰 수 있어 전역으로 둔다 */}
        <link rel="stylesheet" href="/resources/css/ui.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
