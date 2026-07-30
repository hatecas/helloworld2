import { NextResponse } from 'next/server';

import { storagePublicUrl } from '@/lib/upload';

/**
 * 업로드 이미지 서빙.
 *
 * 화면은 예전 그대로 /resources/images/download/{파일명} 을 참조한다.
 * 저장소에 함께 들어있는 옛날 사진들은 public/ 아래 정적 파일로 먼저 응답되고,
 * 거기에 없는 파일(= 새로 업로드된 것)만 이 핸들러까지 내려와서
 * Supabase Storage 의 공개 URL 로 넘겨준다.
 *
 * 덕분에 화면 코드는 한 줄도 바꿀 필요가 없다.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  const decoded = decodeURIComponent(filename);

  // 경로 탈출 방지
  if (decoded.includes('/') || decoded.includes('\\') || decoded.includes('..')) {
    return new NextResponse('Not found', { status: 404 });
  }

  const url = storagePublicUrl(decoded);
  if (!url) return new NextResponse('Not found', { status: 404 });

  return NextResponse.redirect(url, 307);
}
