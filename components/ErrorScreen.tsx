import type { ReactNode } from 'react';

import Stylesheets from '@/components/Stylesheets';

/**
 * 구 views/index/error.jsp 의 디자인을 재사용하는 공통 에러 화면.
 * 404 / 렌더링 실패 / 명시적 에러 페이지가 모두 이 모양을 쓴다.
 */
export default function ErrorScreen({
  heading,
  description,
  action,
}: {
  heading: string;
  description: ReactNode;
  action?: ReactNode;
}) {
  return (
    <>
      <Stylesheets
        hrefs={[
          '/resources/css/index/main.css',
          '/resources/css/index/error.css',
          '/resources/css/minihome/fonts.css',
        ]}
      />
      <div className="error-frame font-neo">
        <div className="error-img">
          <img alt="에러 이미지" src="/resources/images/default/underConstructionIcon.gif" />
        </div>
        <div className="error-section1">{heading}</div>
        <div className="error-section2">{description}</div>
        <div className="error-section3">{action ?? <a href="/">메인으로 돌아가기</a>}</div>
      </div>
    </>
  );
}
