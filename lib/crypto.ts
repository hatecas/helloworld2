import { createHash } from 'node:crypto';

/**
 * 구 com.core.tjoeun.util.SHA256.encryptSHA256 과 동일한 결과를 낸다.
 * (SHA-256 → 소문자 hex) 덕분에 기존 DB 의 비밀번호를 그대로 쓸 수 있다.
 */
export function sha256(plain: string): string {
  return createHash('sha256').update(plain, 'utf8').digest('hex');
}
