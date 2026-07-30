import { NextResponse } from 'next/server';

/**
 * 구 NoticeController.modifyView 호환용.
 * 예전 상세 화면이 제목/본문을 통째로 POST 하던 자리인데, 이제는 seq 만 받아
 * /notice/noticeModify 로 넘긴다.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const seq = String(form.get('seq') ?? '');
  return NextResponse.redirect(new URL(`/notice/noticeModify?seq=${seq}`, request.url), 303);
}
