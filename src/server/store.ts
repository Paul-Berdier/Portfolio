import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { databaseConfig } from './database-config.mjs';
import type { ContactData } from './contact-schema';

let pool: pg.Pool | undefined;
export function getPool() {
  if (!pool) {
    pool = new pg.Pool(databaseConfig());
    pool.on('error', () => console.error(JSON.stringify({ event: 'database_pool_error' })));
  }
  return pool;
}

export class IdempotencyConflict extends Error {}
export interface StoredContact {
  id: string;
  duplicate: boolean;
  notification: string;
}
export interface ContactStore {
  rateLimit: (fingerprint: string, now: Date) => Promise<{ allowed: boolean; retryAfter: number }>;
  save: (data: ContactData, keyHash: string, payloadHash: string) => Promise<StoredContact>;
}

export function createContactStore(getDatabase: () => pg.Pool = getPool): ContactStore {
  return {
    async rateLimit(fingerprint, now) {
      const db = getDatabase();
      // UPDATE atomique : partagé entre réplicas et conservé après redémarrage.
      // Fenêtres fixes de 15 minutes + quota global journalier anti-inondation.
      const windowSeconds = 900;
      const start = Math.floor(now.getTime() / (windowSeconds * 1000)) * windowSeconds;
      const dailyStart = Math.floor(now.getTime() / 86400000) * 86400;
      const result = await db.query<{ bucket_key: string; attempts: number }>(
        `
      INSERT INTO contact_rate_limits (bucket_key, window_start, expires_at, attempts)
      VALUES ($1, to_timestamp($2), to_timestamp($2 + 1800), 1),
             ('global', to_timestamp($3), to_timestamp($3 + 172800), 1)
      ON CONFLICT (bucket_key, window_start)
      DO UPDATE SET attempts = contact_rate_limits.attempts + 1
      RETURNING bucket_key, attempts
    `,
        [fingerprint, start, dailyStart],
      );
      const globalExceeded = result.rows.some(
        (row) => row.bucket_key === 'global' && row.attempts > 200,
      );
      const ipExceeded = result.rows.some((row) => row.bucket_key !== 'global' && row.attempts > 5);
      return {
        allowed: !globalExceeded && !ipExceeded,
        retryAfter: Math.max(
          1,
          Math.ceil(
            (globalExceeded ? dailyStart + 86400 : start + windowSeconds) - now.getTime() / 1000,
          ),
        ),
      };
    },
    async save(data, keyHash, payloadHash) {
      const client = await getDatabase().connect();
      try {
        await client.query('BEGIN');
        await client.query(
          'DELETE FROM contact_idempotency WHERE key_hash = $1 AND expires_at <= now()',
          [keyHash],
        );
        const id = randomUUID();
        const reservation = await client.query<{ lead_id: string }>(
          `
        INSERT INTO contact_idempotency (key_hash, payload_hash, lead_id, expires_at)
        VALUES ($1, $2, $3, now() + interval '24 hours')
        ON CONFLICT (key_hash) DO NOTHING RETURNING lead_id
      `,
          [keyHash, payloadHash, id],
        );
        if (reservation.rowCount === 0) {
          const existing = await client.query<{
            payload_hash: string;
            lead_id: string;
            notification_status: string;
          }>(
            `
          SELECT k.payload_hash, k.lead_id, l.notification_status
          FROM contact_idempotency k JOIN contact_leads l ON l.id = k.lead_id
          WHERE k.key_hash = $1
        `,
            [keyHash],
          );
          const row = existing.rows[0];
          if (!row || row.payload_hash !== payloadHash)
            throw new IdempotencyConflict('KEY_ALREADY_USED');
          await client.query('COMMIT');
          return { id: row.lead_id, duplicate: true, notification: row.notification_status };
        }
        await client.query(
          `
        INSERT INTO contact_leads (id, name, email, company, phone, need, budget, deadline, message)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `,
          [
            id,
            data.name,
            data.email,
            data.company,
            data.phone,
            data.need,
            data.budget,
            data.deadline,
            data.message,
          ],
        );
        await client.query('COMMIT');
        return { id, duplicate: false, notification: 'pending' };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
  };
}

export const contactStore = createContactStore();
