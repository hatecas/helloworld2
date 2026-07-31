import { NextResponse } from 'next/server';

import { getSessionUser } from '@/lib/session';
import { isAllowedImage, saveUploadedFile } from '@/lib/upload';

/**
 * 자체 경량 에디터(RichTextEditor)의 이미지 버튼용 업로드 엔드포인트.
 *
 * multipart/form-data 의 file 필드를 받아 저장하고, 본문에 삽입할 URL 을 JSON 으로 돌려준다.
 * 저장 방식(로컬/Storage)은 saveUploadedFile 이 알아서 처리하고, 화면 참조 경로는
 * 예전과 동일하게 /resources/images/download/{파일명} 을 쓴다.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File) || !file.size) {
    return NextResponse.json({ message: '파일이 없습니다.' }, { status: 400 });
  }
  if (!isAllowedImage(file.name)) {
    return NextResponse.json(
      { message: '이미지 파일(jpg, png, gif 등)만 올릴 수 있습니다.' },
      { status: 400 },
    );
  }

  try {
    const saved = await saveUploadedFile(file);
    return NextResponse.json({ url: `/resources/images/download/${saved}` });
  } catch (error) {
    console.error('[uploadImage]', error);
    return NextResponse.json({ message: '이미지 업로드에 실패했습니다.' }, { status: 500 });
  }
}
