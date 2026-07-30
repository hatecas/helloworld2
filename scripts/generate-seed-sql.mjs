/**
 * lib/db/seed.ts 의 시드 데이터를 그대로 supabase/seed.sql 로 뽑아낸다.
 * 인메모리(DB 미연결) 상태와 Supabase 연결 상태의 데이터를 한 곳에서 관리하기 위함.
 *
 *   npm run seed:sql
 *
 * Node 24 의 TypeScript type-stripping 을 이용하므로 별도 빌드가 필요 없다.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildSeed } from '../lib/db/seed.ts';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, '../supabase/seed.sql');

/** seq 를 SQL 에 직접 넣는 테이블(참조 무결성 때문에 값이 고정되어야 하는 것들) */
const KEEP_SEQ = new Set(['board', 'diary', 'notice', 'album', 'store', 'bgm']);

/** 외래키 순서상 먼저 들어가야 하는 순서 */
const ORDER = [
  'user', 'dotori', 'dotoriC', 'dotoriU', 'store', 'userStorage', 'bgm', 'userBgm',
  'profile', 'miniHomeTitle', 'miniroomBackground', 'miniroomMinimi', 'notice',
  'board', 'boardCMT', 'diary', 'diaryCMT', 'album', 'visit', 'visitCnt',
  'friends', 'friendCMT', 'loginStatus', 'loginLog',
];

function lit(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return `'${String(value).replace(/'/g, "''")}'`;
}

const db = buildSeed();
const lines = [
  '-- =====================================================================',
  '-- HelloWorld 미니홈피 — 시드 데이터',
  '-- lib/db/seed.ts 에서 자동 생성됨. 직접 수정하지 말고 seed.ts 를 고친 뒤',
  '--   npm run seed:sql',
  '-- 을 다시 실행할 것.',
  '--',
  '-- 적용: schema.sql 을 먼저 실행한 뒤 이 파일을 실행한다.',
  '-- 시드 계정 비밀번호는 모두 1234 이다.',
  '-- =====================================================================',
  '',
  'begin;',
  '',
];

for (const table of ORDER) {
  const rows = db[table];
  if (!rows || rows.length === 0) continue;

  const keepSeq = KEEP_SEQ.has(table);
  const columns = Object.keys(rows[0]).filter((c) => keepSeq || c !== 'seq');

  lines.push(`-- ${table} (${rows.length})`);
  const colList = columns.map((c) => `"${c}"`).join(', ');
  const values = rows
    .map((row) => `  (${columns.map((c) => lit(row[c])).join(', ')})`)
    .join(',\n');
  lines.push(`insert into "${table}" (${colList}) values`);
  lines.push(`${values};`);

  if (keepSeq) {
    // 명시적으로 넣은 seq 이후로 시퀀스를 맞춰 준다.
    lines.push(
      `select setval(pg_get_serial_sequence('"${table}"', 'seq'), (select max("seq") from "${table}"));`,
    );
  }
  lines.push('');
}

lines.push('commit;');
lines.push('');

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, lines.join('\n'), 'utf8');
console.log(`supabase/seed.sql 생성 완료 (${ORDER.filter((t) => db[t]?.length).length}개 테이블)`);
