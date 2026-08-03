'use client';

/**
 * 아이폰 기본 촬영 포맷인 HEIC/HEIF 를 업로드 직전에 JPEG 로 변환한다.
 *
 * HEIC 는 Safari 외 브라우저(Chrome·Firefox·Android)에서 <img> 로 렌더링되지 않아
 * 미리보기와 저장 후 화면 모두 엑박(깨진 이미지)으로 뜬다. 또한 서버(lib/upload.ts)의
 * ALLOWED_EXT 에도 없어서 업로드 자체가 거부된다. 클라이언트에서 미리 JPEG 로 바꾸면
 * 두 문제가 모든 브라우저에서 함께 해결된다.
 *
 * heic2any 는 window 에 의존하는 브라우저 전용 라이브러리라 동적 import 로 불러온다.
 */

/** 파일이 HEIC/HEIF 인지 판별. iOS 가 type 을 비워 보내는 경우가 있어 확장자도 함께 본다. */
export function isHeic(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

/** HEIC/HEIF 이면 JPEG File 로 변환해 돌려주고, 그 외엔 원본을 그대로 돌려준다. */
export async function toUploadableImage(file: File): Promise<File> {
  if (!isHeic(file)) return file;

  const heic2any = (await import('heic2any')).default;
  const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
  const blob = Array.isArray(converted) ? converted[0] : converted;

  const name = file.name.replace(/\.hei[cf]$/i, '') + '.jpg';
  return new File([blob], name, { type: 'image/jpeg' });
}
