import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

/**
 * 구 project.properties 의 file.upload.path 를 대체한다.
 * 업로드된 이미지는 예전과 똑같이 resources/images/download 아래에 쌓이고,
 * 화면에서도 같은 경로(/resources/images/download/{파일명})로 참조된다.
 */
export const UPLOAD_DIR = path.join(process.cwd(), 'public', 'resources', 'images', 'download');

const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']);

export function isAllowedImage(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return ALLOWED_EXT.has(ext);
}

/** 저장 후 파일명(경로 아님)을 돌려준다. 구 AlbumServiceImpl 과 같은 UUID-원본명 형식. */
export async function saveUploadedFile(file: File): Promise<string> {
  const original = path.basename(file.name).replace(/[\\/]/g, '');
  const filename = `${randomUUID()}-${original}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return filename;
}
