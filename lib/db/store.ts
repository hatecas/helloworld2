import type { Database } from './types';
import { buildSeed } from './seed';

/**
 * 얇은 테이블 접근 계층.
 *
 * MyBatis 매퍼가 하던 일은 lib/db/repo.ts 의 도메인 함수로 옮겼고,
 * 여기서는 "테이블에서 행을 읽고/쓰기"만 담당한다. 덕분에 저장소를
 * 메모리 → Supabase 로 바꿔도 도메인 로직은 그대로 재사용된다.
 */

export type Table = keyof Database;
export type Row<K extends Table> = Database[K][number];
export type Match<K extends Table> = Partial<Row<K>>;

export interface Store {
  select<K extends Table>(table: K, match?: Match<K>): Promise<Row<K>[]>;
  /**
   * 여러 조건 중 하나라도 맞는 행. 각 match 안의 컬럼끼리는 AND 다.
   * 일촌 관계처럼 "내가 신청했거나 / 내가 신청받았거나" 를 한 번에 조회할 때 쓴다.
   */
  selectOr<K extends Table>(table: K, matches: Match<K>[]): Promise<Row<K>[]>;
  /** 특정 컬럼이 주어진 값들 중 하나인 행 (SQL 의 IN) */
  selectIn<K extends Table>(
    table: K,
    column: keyof Row<K> & string,
    values: ReadonlyArray<string | number>,
  ): Promise<Row<K>[]>;
  insert<K extends Table>(table: K, row: Omit<Row<K>, 'seq'> & { seq?: number }): Promise<Row<K>>;
  update<K extends Table>(table: K, match: Match<K>, patch: Match<K>): Promise<number>;
  remove<K extends Table>(table: K, match: Match<K>): Promise<number>;
  /** seq 컬럼이 있는 테이블용 자동 증가값 */
  nextSeq(table: Table): Promise<number>;
}

function matches<K extends Table>(row: Row<K>, match?: Match<K>): boolean {
  if (!match) return true;
  return Object.entries(match).every(
    ([k, v]) => (row as unknown as Record<string, unknown>)[k] === v,
  );
}

/* ------------------------------------------------------------------ */
/* 인메모리 저장소 (DB 미연결 상태의 기본값)                            */
/* ------------------------------------------------------------------ */

/**
 * dev 모드의 HMR 이나 라우트별 모듈 재평가로 시드가 초기화되지 않도록
 * globalThis 에 붙여 둔다.
 */
const globalForDb = globalThis as unknown as { __helloworldDb?: Database };

function memoryDb(): Database {
  if (!globalForDb.__helloworldDb) {
    globalForDb.__helloworldDb = buildSeed();
  }
  return globalForDb.__helloworldDb;
}

export class MemoryStore implements Store {
  async select<K extends Table>(table: K, match?: Match<K>): Promise<Row<K>[]> {
    const rows = memoryDb()[table] as Row<K>[];
    return rows.filter((r) => matches(r, match));
  }

  async selectOr<K extends Table>(table: K, conditions: Match<K>[]): Promise<Row<K>[]> {
    if (conditions.length === 0) return [];
    const rows = memoryDb()[table] as Row<K>[];
    return rows.filter((r) => conditions.some((c) => matches(r, c)));
  }

  async selectIn<K extends Table>(
    table: K,
    column: keyof Row<K> & string,
    values: ReadonlyArray<string | number>,
  ): Promise<Row<K>[]> {
    if (values.length === 0) return [];
    const wanted = new Set<unknown>(values);
    const rows = memoryDb()[table] as Row<K>[];
    return rows.filter((r) => wanted.has((r as unknown as Record<string, unknown>)[column]));
  }

  async insert<K extends Table>(
    table: K,
    row: Omit<Row<K>, 'seq'> & { seq?: number },
  ): Promise<Row<K>> {
    const rows = memoryDb()[table] as Row<K>[];
    const record = { ...row } as Row<K>;
    if ('seq' in record && (record as { seq?: number }).seq == null) {
      (record as { seq: number }).seq = await this.nextSeq(table);
    }
    rows.push(record);
    return record;
  }

  async update<K extends Table>(table: K, match: Match<K>, patch: Match<K>): Promise<number> {
    const rows = memoryDb()[table] as Row<K>[];
    let n = 0;
    for (const row of rows) {
      if (matches(row, match)) {
        Object.assign(row as object, patch);
        n++;
      }
    }
    return n;
  }

  async remove<K extends Table>(table: K, match: Match<K>): Promise<number> {
    const db = memoryDb();
    const rows = db[table] as Row<K>[];
    const keep = rows.filter((r) => !matches(r, match));
    const removed = rows.length - keep.length;
    (db[table] as Row<K>[]).length = 0;
    (db[table] as Row<K>[]).push(...keep);
    return removed;
  }

  async nextSeq(table: Table): Promise<number> {
    const rows = memoryDb()[table] as Array<{ seq?: number }>;
    return rows.reduce((max, r) => Math.max(max, r.seq ?? 0), 0) + 1;
  }
}

/* ------------------------------------------------------------------ */
/* Supabase 저장소 (환경변수를 채우면 자동으로 이쪽을 쓴다)             */
/* ------------------------------------------------------------------ */

export class SupabaseStore implements Store {
  private client: import('@supabase/supabase-js').SupabaseClient | null = null;

  constructor(
    private url: string,
    private key: string,
  ) {}

  private async getClient() {
    if (!this.client) {
      const { createClient } = await import('@supabase/supabase-js');
      this.client = createClient(this.url, this.key, {
        auth: { persistSession: false },
      });
    }
    return this.client;
  }

  async select<K extends Table>(table: K, match?: Match<K>): Promise<Row<K>[]> {
    const client = await this.getClient();
    let query = client.from(table).select('*');
    for (const [k, v] of Object.entries(match ?? {})) {
      query = query.eq(k, v as never);
    }
    const { data, error } = await query;
    if (error) throw new Error(`[supabase] select ${table}: ${error.message}`);
    return (data ?? []) as Row<K>[];
  }

  async selectOr<K extends Table>(table: K, conditions: Match<K>[]): Promise<Row<K>[]> {
    if (conditions.length === 0) return [];
    const client = await this.getClient();

    // PostgREST 문법: or=(and(a.eq."x",b.eq."y"),and(a.eq."z"))
    // 값에 쉼표·괄호가 들어가도 깨지지 않도록 큰따옴표로 감싼다.
    const quote = (value: unknown) => `"${String(value).replace(/"/g, '\\"')}"`;
    const filter = conditions
      .map((condition) => {
        const parts = Object.entries(condition).map(([k, v]) => `${k}.eq.${quote(v)}`);
        return parts.length === 1 ? parts[0] : `and(${parts.join(',')})`;
      })
      .join(',');

    const { data, error } = await client.from(table).select('*').or(filter);
    if (error) throw new Error(`[supabase] selectOr ${table}: ${error.message}`);
    return (data ?? []) as Row<K>[];
  }

  async selectIn<K extends Table>(
    table: K,
    column: keyof Row<K> & string,
    values: ReadonlyArray<string | number>,
  ): Promise<Row<K>[]> {
    if (values.length === 0) return [];
    const client = await this.getClient();
    const { data, error } = await client
      .from(table)
      .select('*')
      .in(column, values as never);
    if (error) throw new Error(`[supabase] selectIn ${table}: ${error.message}`);
    return (data ?? []) as Row<K>[];
  }

  async insert<K extends Table>(
    table: K,
    row: Omit<Row<K>, 'seq'> & { seq?: number },
  ): Promise<Row<K>> {
    const client = await this.getClient();
    // seq 는 Postgres 쪽 identity 에 맡긴다.
    const payload = { ...row } as Record<string, unknown>;
    if (payload.seq == null) delete payload.seq;
    const { data, error } = await client.from(table).insert(payload).select().single();
    if (error) throw new Error(`[supabase] insert ${table}: ${error.message}`);
    return data as Row<K>;
  }

  async update<K extends Table>(table: K, match: Match<K>, patch: Match<K>): Promise<number> {
    const client = await this.getClient();
    let query = client.from(table).update(patch as never);
    for (const [k, v] of Object.entries(match)) {
      query = query.eq(k, v as never);
    }
    const { data, error } = await query.select();
    if (error) throw new Error(`[supabase] update ${table}: ${error.message}`);
    return (data ?? []).length;
  }

  async remove<K extends Table>(table: K, match: Match<K>): Promise<number> {
    const client = await this.getClient();
    let query = client.from(table).delete();
    for (const [k, v] of Object.entries(match)) {
      query = query.eq(k, v as never);
    }
    const { data, error } = await query.select();
    if (error) throw new Error(`[supabase] delete ${table}: ${error.message}`);
    return (data ?? []).length;
  }

  async nextSeq(): Promise<number> {
    // Postgres identity 컬럼이 채워주므로 쓰이지 않는다.
    return 0;
  }
}

/* ------------------------------------------------------------------ */

let store: Store | null = null;

/**
 * Supabase 접속 정보. 서버에서만 쓰므로 SUPABASE_URL 을 권장하지만,
 * NEXT_PUBLIC_SUPABASE_URL 로 적어 둔 경우도 그대로 받아 준다.
 */
function supabaseConfig(): { url?: string; key?: string } {
  return {
    url: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

/**
 * 현재 저장소를 돌려준다.
 *
 * 접속 URL 과 SUPABASE_SERVICE_ROLE_KEY 가 모두 설정되어 있으면 Supabase 를,
 * 아니면 인메모리 시드 데이터를 쓴다. (지금은 DB 미연결이 기본)
 */
export function getStore(): Store {
  if (store) return store;

  const { url, key } = supabaseConfig();
  store = url && key ? new SupabaseStore(url, key) : new MemoryStore();
  return store;
}

export function isUsingSupabase(): boolean {
  const { url, key } = supabaseConfig();
  return Boolean(url && key);
}
