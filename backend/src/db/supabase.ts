import { createClient, SupabaseClient } from '@supabase/supabase-js';
import pg from 'pg';
import ws from 'ws';
import { config } from '../config.js';

const { Pool } = pg;

// Standard public client
export const supabasePublic: SupabaseClient = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      transport: ws as any,
    },
  }
);

// User-scoped client factory that attaches user JWT for RLS enforcement
export function getAuthenticatedSupabaseClient(accessToken: string): SupabaseClient {
  return createClient(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      transport: ws as any,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

// PostgreSQL connection string normalizer for IPv4 cloud compatibility (e.g. Render / Docker)
export function normalizeDatabaseUrl(rawUrl?: string): string {
  const fallbackUrl = 'postgresql://postgres.qlwzprsqudhzqzxyzmyf:9608300407Sid@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';
  if (!rawUrl || !rawUrl.trim()) {
    return fallbackUrl;
  }

  const trimmed = rawUrl.trim();
  // Detect direct db.<ref>.supabase.co host which only resolves to IPv6 (unreachable from Render IPv4 network)
  const directMatch = trimmed.match(/^postgresql:\/\/([^:]+):([^@]+)@db\.([a-z0-9]+)\.supabase\.co(?::\d+)?\/(.*)$/);
  if (directMatch) {
    const [, user, password, ref, db] = directMatch;
    // Map to official Supabase IPv4 connection pooler
    return `postgresql://${user}.${ref}:${password}@aws-0-ap-northeast-1.pooler.supabase.com:6543/${db || 'postgres'}`;
  }

  return trimmed;
}

const resolvedDbUrl = normalizeDatabaseUrl(config.DATABASE_URL);

// PostgreSQL connection pool for direct database operations, migrations, and transactional isolation
export const dbPool = new Pool({
  connectionString: resolvedDbUrl,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 8000,
});

// Non-fatal error handling on pool to prevent uncaught process termination
dbPool.on('error', (err) => {
  console.warn('⚠️ Supabase dbPool connection warning (non-fatal):', err.message);
});

// Helper for direct SQL queries with typed results
export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  try {
    return await dbPool.query<T>(text, params);
  } catch (err: any) {
    // If pool checkout or transient network glitch occurs, retry once
    console.warn(`Database query attempt failed (${err.message}), retrying once...`);
    const client = await dbPool.connect();
    try {
      return await client.query<T>(text, params);
    } finally {
      client.release();
    }
  }
}
