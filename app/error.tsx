'use client';

import { useEffect } from 'react';

import ErrorScreen from '@/components/ErrorScreen';

/** 렌더링 중 예외가 났을 때 (기본 Next.js 오류 화면 대신) */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[render]', error);
  }, [error]);

  return (
    <ErrorScreen
      heading="문제가 발생하였습니다."
      description={
        <>
          잠시 후 다시 시도해 주세요.
          {error.digest && <div style={{ fontSize: 12, opacity: 0.6 }}>코드 {error.digest}</div>}
        </>
      }
      action={
        <>
          <a onClick={reset} style={{ cursor: 'pointer' }}>
            다시 시도
          </a>
          {' · '}
          <a href="/">메인으로 돌아가기</a>
        </>
      }
    />
  );
}
