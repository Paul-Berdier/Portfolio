import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import pg from 'pg';
import { databaseConfig } from '../src/server/database-config.mjs';

const db = new pg.Client(databaseConfig());
try {
  await db.connect();
  await db.query('SELECT pg_advisory_lock(720916010)');
  await db.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, checksum char(64) NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())',
  );
  const directory = new URL('../migrations/', import.meta.url);
  const files = (await readdir(directory))
    .filter((name) => /^\d+_[a-z0-9_-]+\.sql$/.test(name))
    .sort();
  for (const name of files) {
    const sql = await readFile(new URL(name, directory), 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const existing = await db.query('SELECT checksum FROM schema_migrations WHERE name = $1', [
      name,
    ]);
    if (existing.rows.length) {
      if (existing.rows[0].checksum !== checksum) throw new Error('MIGRATION_CHECKSUM_MISMATCH');
      continue;
    }
    await db.query('BEGIN');
    try {
      await db.query(sql);
      await db.query('INSERT INTO schema_migrations (name, checksum) VALUES ($1,$2)', [
        name,
        checksum,
      ]);
      await db.query('COMMIT');
      console.log(JSON.stringify({ event: 'migration_applied', name }));
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }
  console.log(JSON.stringify({ event: 'migrations_complete' }));
} catch {
  console.error(
    'Migration impossible. Vérifiez l’accès PostgreSQL, les permissions et l’intégrité des migrations. Aucun secret affiché.',
  );
  process.exitCode = 1;
} finally {
  await db.end().catch(() => {});
}
