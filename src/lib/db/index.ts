import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Pool, PoolClient } from 'pg';
import { PGlite } from '@electric-sql/pglite';

export type PersistenceMode = 'TEST' | 'DEVELOP' | 'DEPLOY';

export interface QueryResultRow {
  [column: string]: any;
}

export interface DbQueryResult<T = QueryResultRow> {
  rows: T[];
  rowCount: number;
}

export interface TxClient {
  query<T = QueryResultRow>(sql: string, params?: any[]): Promise<DbQueryResult<T>>;
}

export interface SqlTraceEntry {
  id: string;
  timestamp: string;
  durationMs: number;
  mode: PersistenceMode;
  kind: 'QUERY' | 'TX_COMMIT' | 'TX_ROLLBACK' | 'ROW_LOCK';
  sqlPreview: string;
  rowCount: number;
  status: 'OK' | 'ERROR';
  error?: string;
}

interface GlobalDbState {
  pglite?: PGlite;
  pgPool?: Pool;
  initPromise?: Promise<void>;
  traces: SqlTraceEntry[];
  activeEnvOverride?: PersistenceMode;
}

const globalForDb = globalThis as unknown as { __wmsDbState?: GlobalDbState };

if (!globalForDb.__wmsDbState) {
  globalForDb.__wmsDbState = {
    traces: [],
  };
}

const state = globalForDb.__wmsDbState;

export function getPersistenceMode(): PersistenceMode {
  if (process.env.NODE_ENV === 'test' || process.env.WMS_ENV === 'test') {
    return 'TEST';
  }
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0) {
    return 'DEPLOY';
  }
  return 'DEVELOP';
}

export function getPersistenceMetadata() {
  const mode = getPersistenceMode();
  const supabaseRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'pmkdvlrjjkvkoxlqqcqx';
  return {
    mode,
    engine: mode === 'DEPLOY' ? 'PostgreSQL 17/18 (Cloud Pool / Supabase)' : 'PostgreSQL 18.6 (PGlite Persistent Engine)',
    storageLocation:
      mode === 'DEPLOY'
        ? `Cloud Postgres (${supabaseRef})`
        : mode === 'TEST'
          ? 'Isolated Ephemeral Memory (Vitest)'
          : path.resolve(process.cwd(), '.pgdata-dev'),
    supabaseCloudProject: {
      ref: supabaseRef,
      name: 'myscantool',
      region: 'ap-northeast-2',
      schemaMirrored: true,
    },
    features: [
      'ACID Transactions',
      'SELECT ... FOR UPDATE Row Locking',
      'Immutable Ledger Trigger',
      '12 Enterprise Schemas',
      'Automated JSONB Snapshots',
    ],
  };
}

function recordTrace(entry: Omit<SqlTraceEntry, 'id' | 'timestamp'>) {
  const item: SqlTraceEntry = {
    id: crypto.randomUUID().slice(0, 8),
    timestamp: new Date().toISOString(),
    ...entry,
  };
  state.traces.unshift(item);
  if (state.traces.length > 80) {
    state.traces.length = 80;
  }
}

export function getSqlTraces(): SqlTraceEntry[] {
  return state.traces;
}

function summarizeSql(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim().slice(0, 140);
}

async function getRawDriver(): Promise<{ mode: PersistenceMode; pglite?: PGlite; pool?: Pool }> {
  const mode = getPersistenceMode();

  if (mode === 'DEPLOY') {
    if (!state.pgPool) {
      const conn = process.env.DATABASE_URL!;
      const isLocal = conn.includes('localhost') || conn.includes('127.0.0.1');
      state.pgPool = new Pool({
        connectionString: conn,
        ssl: isLocal ? false : { rejectUnauthorized: false },
        max: 12,
      });
    }
    return { mode, pool: state.pgPool };
  }

  if (!state.pglite) {
    if (mode === 'TEST') {
      state.pglite = new PGlite();
    } else {
      const dataDir = path.resolve(process.cwd(), '.pgdata-dev');
      fs.mkdirSync(dataDir, { recursive: true });
      state.pglite = new PGlite(dataDir);
    }
  }
  return { mode, pglite: state.pglite };
}

export async function ensureDbInitialized(): Promise<void> {
  if (state.initPromise) {
    return state.initPromise;
  }

  state.initPromise = (async () => {
    const { pglite, pool } = await getRawDriver();
    const schemaPath = path.resolve(process.cwd(), 'src/lib/db/schema.sql');
    const seedPath = path.resolve(process.cwd(), 'src/lib/db/seed.sql');
    const schemaSql = fs.readFileSync(schemaSqlPathFallback(schemaPath), 'utf8');
    const seedSql = fs.readFileSync(schemaSqlPathFallback(seedPath), 'utf8');

    if (pglite) {
      await pglite.exec(schemaSql);
      const countRes = await pglite.query<{ cnt: number }>('SELECT COUNT(*)::int AS cnt FROM core.tenants');
      if ((countRes.rows[0]?.cnt ?? 0) === 0) {
        await pglite.exec(seedSql);
        await createSystemSnapshotInternal(pglite, 'Initial Seed Baseline Snapshot');
      }
    } else if (pool) {
      const client = await pool.connect();
      try {
        await client.query(schemaSql);
        const countRes = await client.query('SELECT COUNT(*)::int AS cnt FROM core.tenants');
        if ((countRes.rows[0]?.cnt ?? 0) === 0) {
          await client.query(seedSql);
        }
      } finally {
        client.release();
      }
    }
  })().catch((err) => {
    state.initPromise = undefined;
    throw err;
  });

  return state.initPromise;
}

function schemaSqlPathFallback(p: string): string {
  return p;
}

async function createSystemSnapshotInternal(pglite: PGlite, label: string) {
  const balances = await pglite.query('SELECT * FROM inventory.inventory_balances ORDER BY id');
  const orders = await pglite.query('SELECT * FROM outbound.sales_orders ORDER BY id');
  const pos = await pglite.query('SELECT * FROM inbound.purchase_orders ORDER BY id');
  const payload = {
    balances: balances.rows,
    sales_orders: orders.rows,
    purchase_orders: pos.rows,
  };
  const jsonStr = JSON.stringify(payload);
  const checksum = crypto.createHash('sha256').update(jsonStr).digest('hex').slice(0, 16);
  const code = `BKP-${Date.now().toString().slice(-6)}`;
  await pglite.query(
    `INSERT INTO audit.backups (backup_code, environment, label, row_counts, checksum, snapshot_data, created_by)
     VALUES ($1, $2, $3, $4::jsonb, $5, $6::jsonb, $7)
     ON CONFLICT (backup_code) DO NOTHING`,
    [
      code,
      getPersistenceMode(),
      label,
      JSON.stringify({
        balances: balances.rows.length,
        sales_orders: orders.rows.length,
        purchase_orders: pos.rows.length,
      }),
      checksum,
      jsonStr,
      'Automated Backup Daemon',
    ]
  );
}

export async function dbQuery<T = QueryResultRow>(sql: string, params: any[] = []): Promise<DbQueryResult<T>> {
  await ensureDbInitialized();
  const { mode, pglite, pool } = await getRawDriver();
  const start = performance.now();
  const isLock = /\bFOR\s+UPDATE\b/i.test(sql);

  try {
    if (pglite) {
      const res = await pglite.query<T>(sql, params);
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      recordTrace({
        durationMs,
        mode,
        kind: isLock ? 'ROW_LOCK' : 'QUERY',
        sqlPreview: summarizeSql(sql),
        rowCount: res.rows.length,
        status: 'OK',
      });
      return { rows: res.rows, rowCount: res.affectedRows ?? res.rows.length };
    } else {
      const res = await pool!.query(sql, params);
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      recordTrace({
        durationMs,
        mode,
        kind: isLock ? 'ROW_LOCK' : 'QUERY',
        sqlPreview: summarizeSql(sql),
        rowCount: res.rowCount ?? res.rows.length,
        status: 'OK',
      });
      return { rows: res.rows as T[], rowCount: res.rowCount ?? res.rows.length };
    }
  } catch (err: any) {
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    recordTrace({
      durationMs,
      mode,
      kind: isLock ? 'ROW_LOCK' : 'QUERY',
      sqlPreview: summarizeSql(sql),
      rowCount: 0,
      status: 'ERROR',
      error: err?.message || String(err),
    });
    throw err;
  }
}

export async function withTransaction<R>(fn: (tx: TxClient) => Promise<R>): Promise<R> {
  await ensureDbInitialized();
  const { mode, pglite, pool } = await getRawDriver();
  const start = performance.now();

  if (pglite) {
    try {
      const result = await pglite.transaction(async (pgTx) => {
        const client: TxClient = {
          async query<T = QueryResultRow>(sql: string, params: any[] = []) {
            const qStart = performance.now();
            const isLock = /\bFOR\s+UPDATE\b/i.test(sql);
            const r = await pgTx.query<T>(sql, params);
            if (isLock) {
              recordTrace({
                durationMs: Math.round((performance.now() - qStart) * 100) / 100,
                mode,
                kind: 'ROW_LOCK',
                sqlPreview: summarizeSql(sql),
                rowCount: r.rows.length,
                status: 'OK',
              });
            }
            return { rows: r.rows, rowCount: r.affectedRows ?? r.rows.length };
          },
        };
        return await fn(client);
      });

      recordTrace({
        durationMs: Math.round((performance.now() - start) * 100) / 100,
        mode,
        kind: 'TX_COMMIT',
        sqlPreview: 'BEGIN ... COMMIT (ACID Transaction)',
        rowCount: 1,
        status: 'OK',
      });
      return result;
    } catch (err: any) {
      recordTrace({
        durationMs: Math.round((performance.now() - start) * 100) / 100,
        mode,
        kind: 'TX_ROLLBACK',
        sqlPreview: 'ROLLBACK (ACID Transaction Aborted)',
        rowCount: 0,
        status: 'ERROR',
        error: err?.message || String(err),
      });
      throw err;
    }
  }

  const pgClient: PoolClient = await pool!.connect();
  try {
    await pgClient.query('BEGIN');
    const txWrapper: TxClient = {
      async query<T = QueryResultRow>(sql: string, params: any[] = []) {
        const qStart = performance.now();
        const isLock = /\bFOR\s+UPDATE\b/i.test(sql);
        const r = await pgClient.query(sql, params);
        if (isLock) {
          recordTrace({
            durationMs: Math.round((performance.now() - qStart) * 100) / 100,
            mode,
            kind: 'ROW_LOCK',
            sqlPreview: summarizeSql(sql),
            rowCount: r.rowCount ?? r.rows.length,
            status: 'OK',
          });
        }
        return { rows: r.rows as T[], rowCount: r.rowCount ?? r.rows.length };
      },
    };
    const result = await fn(txWrapper);
    await pgClient.query('COMMIT');
    recordTrace({
      durationMs: Math.round((performance.now() - start) * 100) / 100,
      mode,
      kind: 'TX_COMMIT',
      sqlPreview: 'BEGIN ... COMMIT (Cloud Pool ACID)',
      rowCount: 1,
      status: 'OK',
    });
    return result;
  } catch (err: any) {
    await pgClient.query('ROLLBACK');
    recordTrace({
      durationMs: Math.round((performance.now() - start) * 100) / 100,
      mode,
      kind: 'TX_ROLLBACK',
      sqlPreview: 'ROLLBACK (Cloud Pool ACID Aborted)',
      rowCount: 0,
      status: 'ERROR',
      error: err?.message || String(err),
    });
    throw err;
  } finally {
    pgClient.release();
  }
}

export async function resetDemoDatabase(): Promise<void> {
  await ensureDbInitialized();
  const { pglite, pool } = await getRawDriver();
  const dropSql = `
    DROP SCHEMA IF EXISTS reporting CASCADE;
    DROP SCHEMA IF EXISTS audit CASCADE;
    DROP SCHEMA IF EXISTS integration CASCADE;
    DROP SCHEMA IF EXISTS returns CASCADE;
    DROP SCHEMA IF EXISTS transport CASCADE;
    DROP SCHEMA IF EXISTS replenishment CASCADE;
    DROP SCHEMA IF EXISTS outbound CASCADE;
    DROP SCHEMA IF EXISTS inventory CASCADE;
    DROP SCHEMA IF EXISTS inbound CASCADE;
    DROP SCHEMA IF EXISTS location CASCADE;
    DROP SCHEMA IF EXISTS master CASCADE;
    DROP SCHEMA IF EXISTS core CASCADE;
  `;
  const schemaSql = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/db/schema.sql'), 'utf8');
  const seedSql = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/db/seed.sql'), 'utf8');

  if (pglite) {
    await pglite.exec(dropSql);
    await pglite.exec(schemaSql);
    await pglite.exec(seedSql);
    await createSystemSnapshotInternal(pglite, 'Post-Reset Fresh Baseline');
  } else if (pool) {
    const client = await pool.connect();
    try {
      await client.query(dropSql);
      await client.query(schemaSql);
      await client.query(seedSql);
    } finally {
      client.release();
    }
  }
}
