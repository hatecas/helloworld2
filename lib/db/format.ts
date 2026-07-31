/**
 * 구 MyBatis 쿼리들이 DATE_FORMAT / SUBSTRING 으로 만들어 주던 문자열을
 * 그대로 재현하기 위한 헬퍼. JSP 가 이 포맷을 그대로 뿌리고 있었다.
 *
 * 표기는 전부 한국 시간(KST, UTC+9) 기준이다.
 * 배포 서버(Vercel 등)는 UTC 로 도니까 서버 로컬 시간을 쓰면 오전 9시 이전에
 * 쓴 글이 '어제' 로 찍히고, 다이어리의 '오늘' 도 하루 밀린다.
 * DB 에는 UTC(timestamptz) 로 넣고, 화면에 낼 때만 여기서 KST 로 돌린다.
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** UTC 게터로 읽으면 KST 벽시계 값이 나오도록 밀어 둔 Date */
function toKst(value: string | Date): Date {
  const d = value instanceof Date ? value : new Date(value);
  return new Date(d.getTime() + KST_OFFSET_MS);
}

function parts(value: string | Date) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    return { y: 0, m: '', d: '', hh: '', mm: '', valid: false };
  }
  const k = toKst(d);
  const p = (n: number) => String(n).padStart(2, '0');
  return {
    y: k.getUTCFullYear(),
    m: p(k.getUTCMonth() + 1),
    d: p(k.getUTCDate()),
    hh: p(k.getUTCHours()),
    mm: p(k.getUTCMinutes()),
    valid: true,
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

/**
 * 한국 시간 기준 '오늘'의 연/월/일. (month 는 0-based — Date 와 맞춤)
 * 달력·글쓰기 화면처럼 숫자로 날짜 계산을 하는 곳에서 쓴다.
 * 서버(UTC)와 브라우저(로컬)가 서로 다른 '오늘'을 그려 hydration 이 어긋나는 것도 막는다.
 */
export function kstTodayParts(): { year: number; month: number; day: number } {
  const k = toKst(new Date());
  return { year: k.getUTCFullYear(), month: k.getUTCMonth(), day: k.getUTCDate() };
}
