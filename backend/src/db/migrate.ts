import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbPool } from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations(): Promise<void> {
  const client = await dbPool.connect();
  try {
    console.log('🔄 Starting database migrations...');

    // Locate migrations folder
    let migrationsDir = path.resolve(__dirname, '../../../supabase/migrations');
    if (!fs.existsSync(migrationsDir)) {
      migrationsDir = path.resolve(process.cwd(), 'supabase/migrations');
    }
    if (!fs.existsSync(migrationsDir)) {
      migrationsDir = path.resolve(process.cwd(), '../supabase/migrations');
    }

    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found at: ${migrationsDir}`);
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration files in ${migrationsDir}`);

    for (const file of files) {
      console.log(`Applying migration: ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('COMMIT');
        console.log(`✅ Applied: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Migration failed in ${file}:`, err);
        throw err;
      }
    }

    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('📋 Verified public tables:', result.rows.map(r => r.table_name));
    console.log('✨ All migrations completed successfully!');
  } finally {
    client.release();
  }
}

// If invoked directly from CLI
if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
