import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { isAllowedImage, saveUploadedFile } from '@/lib/upload';

/**
 * 구 BoardController.smarteditorMultiImageUpload.
 *
 * SmartEditor2 의 사진첨부 플러그인이 쓰는 엔드포인트로, 파일 본문을 그대로
 * 스트리밍하고 file-name 헤더로 원본 파일명을 넘겨 준다. 응답은 SE2 가 파싱하는
 * "&bNewLine=true&sFileName=...&sFileURL=..." 형식이어야 한다.
 *
 * 참고: 저장소에 함께 들어있는 SE2 샘플 업로더(sample/photo_uploader)는 PHP 파일을
 * 가리키고 있어서 구 프로젝트에서도 이 엔드포인트까지 연결돼 있지 않았다.
 * 여기서는 컨트롤러와 동일하게 동작하도록 살려 두었다.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return new NextResponse('NOTALLOW_login', { headers: { 'Content-Type': 'text/plain' } });
  }

  const filename = request.headers.get('file-name') ?? '';
  if (!filename || !isAllowedImage(filename)) {
    return new NextResponse(`NOTALLOW_${filename}`, {
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const body = await request.arrayBuffer();
  const saved = await saveUploadedFile(new File([body], filename));
  const fileUrl = `/resources/images/download/${saved}`;

  const info = `&bNewLine=true&sFileName=${filename}&sFileURL=${fileUrl}`;
  return new NextResponse(info, { headers: { 'Content-Type': 'text/plain' } });
}
