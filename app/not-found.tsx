import type { Metadata } from 'next';

import ErrorScreen from '@/components/ErrorScreen';

export const metadata: Metadata = { title: '페이지를 찾을 수 없습니다 · 헬로월드' };

/** 없는 주소로 들어왔을 때 (기본 Next.js 404 대신 프로젝트 디자인을 쓴다) */
export default function NotFound() {
  return (
    <ErrorScreen
      heading="찾으시는 페이지가 없습니다."
      description={
        <>
          주소가 바뀌었거나 <span className="error-core">삭제된 미니홈피</span>일 수 있어요.
        </>
      }
    />
  );
}
