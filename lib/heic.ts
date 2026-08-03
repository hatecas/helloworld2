'use client';

/**
 * 아이폰 기본 촬영 포맷인 HEIC/HEIF 를 업로드 직전에 JPEG 로 변환한다.
 *
 * HEIC 는 Safari 외 브라우저(Chrome·Firefox·Android)에서 <img> 로 렌더링되지 않아
 * 미리보기와 저장 후 화면 모두 엑박(깨진 이미지)으로 뜬다. 또한 서버(lib/upload.ts)의
 * ALLOWED_EXT 에도 없어서 업로드 자체가 거부된다. 클라이언트에서 미리 JPEG 로 바꾸면
 * 두 문제가 모든 브라우저에서 함께 해결된다.
 *
 * 판별은 파일명/MIME 이 아니라 "실제 바이트(매직 넘버)" 로 한다. iOS 가 HEIC 를
 * IMG_xxxx.png + image/png 로 잘못 라벨해 보내는 경우가 있어서(그러면 HEIC 원본이
 * .png 이름으로 그대로 올라가 흰 화면이 된다), 확장자·타입만 믿으면 놓친다.
 *
 * heic2any 는 window 에 의존하는 브라우저 전용 라이브러리라 동적 import 로 불러온다.
 */

// ISO-BMFF ftyp major_brand 중 HEIC/HEIF 계열
const HEIC_BRANDS = new Set([
  'heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'hevm', 'hevs', 'mif1', 'msf1', 'heif',
]);

/** 앞 32바이트를 읽어 HEIC/HEIF 인지 판별. 이름·타입이 잘못 붙어 와도 잡아낸다. */
export async function isHeic(file: File): Promise<boolean> {
  // 빠른 경로: 이름/타입이 이미 HEIC 라고 말해주면 그대로 신뢰
  if (/image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)) return true;
  try {
    const buf = new Uint8Array(await file.slice(0, 32).arrayBuffer());
    // 바이트 4~7 이 'ftyp' 여야 ISO-BMFF(HEIC/MP4 계열)
    const isFtyp = buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70;
    if (!isFtyp) return false;
    const brand = String.fromCharCode(buf[8], buf[9], buf[10], buf[11]).toLowerCase();
    return HEIC_BRANDS.has(brand);
  } catch {
    return false;
  }
}

/** HEIC/HEIF 이면 JPEG File 로 변환해 돌려주고, 그 외엔 원본을 그대로 돌려준다. */
export async function toUploadableImage(file: File): Promise<File> {
  if (!(await isHeic(file))) return file;

  const heic2any = (await import('heic2any')).default;
  const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
  const blob = Array.isArray(converted) ? converted[0] : converted;

  // 원래 확장자(.png 로 잘못 붙었을 수 있음)를 떼고 .jpg 로 통일
  const base = file.name.replace(/\.[^.]+$/, '') || 'image';
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg' });
}
