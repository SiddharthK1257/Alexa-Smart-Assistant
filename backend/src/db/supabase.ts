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

// PostgreSQL connection pool for direct database operations, migrations, and transactional isolation
export const dbPool = new Pool({
  connectionString: config.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
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
  const client = await dbPool.connect();
  try {
    return await client.query<T>(text, params);
  } finally {
    client.release();
  }
}
