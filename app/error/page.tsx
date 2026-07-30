import type { Metadata } from 'next';

import ErrorScreen from '@/components/ErrorScreen';

export const metadata: Metadata = { title: '오류' };

/** 구 NoticeController.error + views/index/error.jsp */
export default function ErrorPage() {
  return (
    <ErrorScreen
      heading="문제가 발생하였습니다."
      description={
        <>
          <span className="error-core">Core 개발자</span>분들께 문의해주시기 바랍니다.
        </>
      }
    />
  );
}
