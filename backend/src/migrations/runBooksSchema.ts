import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const file = path.join(__dirname, '001_books_catalog_schema.sql');
  const sql = fs.readFileSync(file, 'utf8');
  console.log('Applying books_catalog schema...');
  await pool.query(sql);
  console.log('✅ Schema applied');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Migration failed', err);
  process.exit(1);
});
