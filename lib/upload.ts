import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

/**
 * 업로드된 이미지 저장.
 *
 * 구 project.properties 의 file.upload.path 를 대체한다. DB 에는 예전과 똑같이
 * "파일명"만 저장하고, 화면도 /resources/images/download/{파일명} 으로 참조한다.
 * 저장 위치만 환경에 따라 달라진다.
 *
 *  - Supabase 설정됨  → Supabase Storage 의 uploads 버킷
 *  - 설정 안 됨(로컬) → public/resources/images/download 폴더
 *
 * Vercel 같은 서버리스는 파일시스템이 읽기 전용이고 인스턴스마다 분리돼 있어서
 * 로컬 저장 방식으로는 업로드가 동작하지 않는다.
 */

export const UPLOAD_DIR = path.join(process.cwd(), 'public', 'resources', 'images', 'download');

/** Storage 버킷 이름. 공개 버킷이라 URL 로 바로 접근된다. */
export const UPLOAD_BUCKET = 'uploads';
/** 버킷 안에서의 경로 — 구 폴더 구조를 그대로 따른다 */
const UPLOAD_PREFIX = 'download';

// heic/heif 는 저장 직전 saveUploadedFile 에서 JPEG 로 변환되지만,
// 라우트의 isAllowedImage 게이트를 통과해 여기까지 오도록 허용 목록에 넣어 둔다.
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'heic', 'heif']);

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  bmp: 'image/bmp',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};

// ISO-BMFF ftyp major_brand 중 HEIC/HEIF 계열
const HEIC_BRANDS = new Set([
  'heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'hevm', 'hevs', 'mif1', 'msf1', 'heif',
]);

/**
 * 버퍼가 HEIC/HEIF 인지 "실제 바이트"로 판별한다.
 * iOS 가 HEIC 를 .png/image_png 로 잘못 라벨해 보내는 경우가 있어 확장자·타입은 못 믿는다.
 */
function isHeicBuffer(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  // 바이트 4~7 이 'ftyp'
  if (!(buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70)) return false;
  const brand = buf.toString('latin1', 8, 12).toLowerCase();
  return HEIC_BRANDS.has(brand);
}

/** HEIC/HEIF 버퍼를 JPEG 버퍼로 변환. heic-convert 는 순수 JS/WASM 이라 서버리스에서도 동작한다. */
async function heicBufferToJpeg(buf: Buffer): Promise<Buffer> {
  const convert = (await import('heic-convert')).default;
  const out = await convert({ buffer: buf, format: 'JPEG', quality: 0.9 });
  return Buffer.from(out);
}

function extensionOf(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

export function isAllowedImage(filename: string): boolean {
  return ALLOWED_EXT.has(extensionOf(filename));
}

function supabaseConfig(): { url?: string; key?: string } {
  return {
    url: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function isUsingStorage(): boolean {
  const { url, key } = supabaseConfig();
  return Boolean(url && key);
}

async function storageClient() {
  const { url, key } = supabaseConfig();
  if (!url || !key) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, key, { auth: { persistSession: false } });
}

/** 버킷이 없으면 만든다. 한 번 확인하면 프로세스가 살아있는 동안 다시 확인하지 않는다. */
let bucketReady: Promise<void> | null = null;

async function ensureBucket(
  client: NonNullable<Awaited<ReturnType<typeof storageClient>>>,
): Promise<void> {
  bucketReady ??= (async () => {
    const { data } = await client.storage.getBucket(UPLOAD_BUCKET);
    if (data) return;

    const { error } = await client.storage.createBucket(UPLOAD_BUCKET, {
      public: true,
      fileSizeLimit: '10MB',
      allowedMimeTypes: [...new Set(Object.values(MIME))],
    });
    // 동시에 여러 요청이 만들려다 부딪히는 건 무시한다
    if (error && !/already exists/i.test(error.message)) {
      bucketReady = null;
      throw new Error(`[storage] 버킷 생성 실패: ${error.message}`);
    }
  })();

  return bucketReady;
}

/**
 * 저장 후 파일명(경로 아님)을 돌려준다.
 * 구 AlbumServiceImpl 과 같은 "UUID-원본명" 형식을 유지한다.
 */
export async function saveUploadedFile(file: File): Promise<string> {
  let name = path.basename(file.name).replace(/[\\/]/g, '');
  let buffer: Buffer = Buffer.from(await file.arrayBuffer());

  // 서버 최종 안전망: 클라이언트 변환을 거치지 않았거나(SmartEditor 등) 잘못 라벨된
  // HEIC 가 그대로 올라오면 여기서 JPEG 로 바꿔 저장한다. (안 그러면 흰 화면이 된다)
  if (isHeicBuffer(buffer)) {
    buffer = await heicBufferToJpeg(buffer);
    name = `${name.replace(/\.[^.]+$/, '') || 'image'}.jpg`;
  }

  const filename = `${randomUUID()}-${name}`;

  const client = await storageClient();

  if (client) {
    await ensureBucket(client);
    const { error } = await client.storage
      .from(UPLOAD_BUCKET)
      .upload(`${UPLOAD_PREFIX}/${filename}`, buffer, {
        contentType: MIME[extensionOf(filename)] ?? file.type ?? 'application/octet-stream',
        upsert: false,
      });
    if (error) throw new Error(`[storage] 업로드 실패: ${error.message}`);
    return filename;
  }

  // Supabase 미설정(로컬 개발) — 예전처럼 public 폴더에 쓴다
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return filename;
}

/** Storage 에 올라간 파일의 공개 URL */
export function storagePublicUrl(filename: string): string | null {
  const { url } = supabaseConfig();
  if (!url) return null;
  return `${url.replace(/\/$/, '')}/storage/v1/object/public/${UPLOAD_BUCKET}/${UPLOAD_PREFIX}/${encodeURIComponent(filename)}`;
}
