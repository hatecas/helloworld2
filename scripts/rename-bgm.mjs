// 일회성: 라이브 Supabase 의 BGM '1年이 지나도/거미' → '벌써 1년/브라운아이드소울' 교정.
// 오디오 파일(Already1Year.mp3)은 그대로. contentPath 로 대상을 특정한다.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('SUPABASE 환경변수 없음');

const db = createClient(url, key, { auth: { persistSession: false } });
const PATH = '/resources/sounds/Already1Year.mp3';
const patch = { title: '벌써 1년', artist: '브라운아이드소울' };

for (const table of ['bgm', 'userBgm']) {
  const { data, error } = await db.from(table).update(patch).eq('contentPath', PATH).select();
  if (error) {
    console.error(`[${table}] 실패:`, error.message);
    process.exitCode = 1;
  } else {
    console.log(`[${table}] ${data.length}행 변경`);
  }
}
