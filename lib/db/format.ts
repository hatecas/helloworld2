/**
 * 구 MyBatis 쿼리들이 DATE_FORMAT / SUBSTRING 으로 만들어 주던 문자열을
 * 그대로 재현하기 위한 헬퍼. JSP 가 이 포맷을 그대로 뿌리고 있었다.
 */

function parts(value: string | Date) {
  const d = value instanceof Date ? value : new Date(value);
  const p = (n: number) => String(n).padStart(2, '0');
  return {
    y: d.getFullYear(),
    m: p(d.getMonth() + 1),
    d: p(d.getDate()),
    hh: p(d.getHours()),
    mm: p(d.getMinutes()),
    valid: !Number.isNaN(d.getTime()),
  };
}

/** DATE_FORMAT(x, '%Y-%m-%d') / SUBSTRING(x, 1, 10) */
export function ymd(value: string | Date): string {
  const p = parts(value);
  if (!p.valid) return '';
  return `${p.y}-${p.m}-${p.d}`;
}

/** DATE_FORMAT(x, '%Y.%m.%d') */
export function ymdDot(value: string | Date): string {
  const p = parts(value);
  if (!p.valid) return '';
  return `${p.y}.${p.m}.${p.d}`;
}

/** DATE_FORMAT(x, '%Y-%m-%d %H:%i') */
export function ymdhm(value: string | Date): string {
  const p = parts(value);
  if (!p.valid) return '';
  return `${p.y}-${p.m}-${p.d} ${p.hh}:${p.mm}`;
}

/** DATE_FORMAT(x, '%Y.%m.%d %H:%i') */
export function ymdhmDot(value: string | Date): string {
  const p = parts(value);
  if (!p.valid) return '';
  return `${p.y}.${p.m}.${p.d} ${p.hh}:${p.mm}`;
}

/** TIMESTAMPDIFF(HOUR, x, NOW()) <= 24 */
export function withinHours(value: string | Date, hours: number): boolean {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  return Date.now() - d.getTime() <= hours * 60 * 60 * 1000;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function todayYmd(): string {
  return ymd(new Date());
}
