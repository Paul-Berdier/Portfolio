import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import type pg from 'pg';
import { createContactStore, IdempotencyConflict, type ContactStore } from '../src/server/store';
import type { ContactData } from '../src/server/contact-schema';
import { notifyLead } from '../src/server/notification.mjs';

// Vrai moteur PostgreSQL WASM local. PGlite n'a qu'une connexion : ce petit
// adaptateur sérialise les connexions empruntées, sans simuler le SQL.
let database: PGlite;
let pool: pg.Pool;
let store: ContactStore;
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const data: ContactData = {
  name: 'Camille Démo', email: 'camille@example.invalid', company: '', phone: '',
  need: 'automation', budget: 'undecided', deadline: 'flexible',
  message: 'Je souhaite automatiser les fichiers de cette démonstration locale.',
};

beforeAll(async () => {
  database = await PGlite.create();
  await database.exec(await readFile(new URL('../migrations/001_contact.sql', import.meta.url), 'utf8'));
  let queue = Promise.resolve();
  const acquire = async () => {
    const prior = queue;
    let release!: () => void;
    queue = new Promise<void>((resolve) => { release = resolve; });
    await prior;
    return release;
  };
  const query = async (sql: string, params?: unknown[]) => {
    const result = await database.query(sql, params);
    return { ...result, rowCount: result.affectedRows ?? result.rows.length };
  };
  pool = {
    query: async (sql: string, params?: unknown[]) => {
      const release = await acquire();
      try { return await query(sql, params); } finally { release(); }
    },
    connect: async () => {
      const release = await acquire();
      return { query, release };
    },
  } as unknown as pg.Pool;
  store = createContactStore(() => pool);
}, 30000);

beforeEach(async () => { await database.exec('TRUNCATE contact_idempotency, contact_leads, contact_rate_limits'); });
afterAll(async () => { await database?.close(); });

describe('PostgreSQL embarqué : migration, transactions et quotas', () => {
  it('applique la migration et enregistre toutes les données avec notification pending', async () => {
    const result = await store.save(data, hash('one'), hash('payload'));
    expect(result.duplicate).toBe(false);
    const stored = await database.query('SELECT * FROM contact_leads WHERE id = $1', [result.id]);
    expect(stored.rows[0]).toMatchObject({ ...data, notification_status: 'pending', notification_attempts: 0 });
  });
  it('sérialise deux demandes simultanées de même clé en un seul enregistrement', async () => {
    const results = await Promise.all([
      store.save(data, hash('same'), hash('same-payload')),
      store.save(data, hash('same'), hash('same-payload')),
    ]);
    expect(results[0]?.id).toBe(results[1]?.id);
    expect(results.filter((item) => item.duplicate)).toHaveLength(1);
    expect((await database.query<{ count: number }>('SELECT count(*)::integer AS count FROM contact_leads')).rows[0]?.count).toBe(1);
  });
  it('refuse la même clé associée à une autre demande', async () => {
    await store.save(data, hash('same'), hash('payload'));
    await expect(store.save({ ...data, name: 'Autre démo' }, hash('same'), hash('different'))).rejects.toBeInstanceOf(IdempotencyConflict);
    expect((await database.query<{ count: number }>('SELECT count(*)::integer AS count FROM contact_leads')).rows[0]?.count).toBe(1);
  });
  it('annule la réservation si une contrainte empêche le stockage', async () => {
    await expect(store.save({ ...data, message: 'Court' }, hash('broken'), hash('payload'))).rejects.toThrow();
    expect((await database.query<{ count: number }>('SELECT count(*)::integer AS count FROM contact_idempotency')).rows[0]?.count).toBe(0);
    expect((await database.query<{ count: number }>('SELECT count(*)::integer AS count FROM contact_leads')).rows[0]?.count).toBe(0);
  });
  it('autorise une nouvelle demande après expiration de la clé, sans effacer l’historique', async () => {
    const first = await store.save(data, hash('expired'), hash('payload'));
    await database.query("UPDATE contact_idempotency SET expires_at = now() - interval '1 hour'");
    const next = await store.save(data, hash('expired'), hash('payload'));
    expect(next.id).not.toBe(first.id);
    expect(next.duplicate).toBe(false);
    expect((await database.query<{ count: number }>('SELECT count(*)::integer AS count FROM contact_leads')).rows[0]?.count).toBe(2);
  });
  it('retourne le statut courant d’une notification pour un doublon', async () => {
    const first = await store.save(data, hash('same'), hash('payload'));
    await database.query("UPDATE contact_leads SET notification_status = 'failed' WHERE id = $1", [first.id]);
    expect(await store.save(data, hash('same'), hash('payload'))).toMatchObject({ id: first.id, duplicate: true, notification: 'failed' });
  });
  it('n’accepte que cinq des sept tentatives parallèles dans une fenêtre', async () => {
    const now = new Date('2026-09-30T10:01:00Z');
    const results = await Promise.all(Array.from({ length: 7 }, () => store.rateLimit(hash('ip'), now)));
    expect(results.filter((item) => item.allowed)).toHaveLength(5);
    expect(results[6]?.retryAfter).toBe(840);
    expect((await database.query<{ attempts: number }>('SELECT attempts FROM contact_rate_limits WHERE bucket_key = $1', [hash('ip')])).rows[0]?.attempts).toBe(7);
  });
  it('ouvre une nouvelle fenêtre quinze minutes plus tard', async () => {
    for (let count = 0; count < 6; count++) await store.rateLimit(hash('ip'), new Date('2026-09-30T10:01:00Z'));
    expect((await store.rateLimit(hash('ip'), new Date('2026-09-30T10:16:00Z'))).allowed).toBe(true);
  });
  it('applique le quota journalier global même à une nouvelle empreinte', async () => {
    const now = new Date('2026-09-30T10:01:00Z');
    await database.query("INSERT INTO contact_rate_limits VALUES ('global', '2026-09-30T00:00:00Z', '2026-10-02T00:00:00Z', 200)");
    expect((await store.rateLimit(hash('new-ip'), now)).allowed).toBe(false);
  });
  it('purge les demandes expirées et leurs clés par cascade, conserve les récentes', async () => {
    const old = await store.save(data, hash('old'), hash('old-payload'));
    await database.query("UPDATE contact_leads SET created_at = now() - interval '13 months' WHERE id = $1", [old.id]);
    const recent = await store.save(data, hash('recent'), hash('recent-payload'));
    await database.query('DELETE FROM contact_leads WHERE created_at < now() - make_interval(months => $1)', [12]);
    const leads = await database.query<{ id: string }>('SELECT id FROM contact_leads');
    const keys = await database.query<{ lead_id: string }>('SELECT lead_id FROM contact_idempotency');
    expect(leads.rows).toEqual([{ id: recent.id }]);
    expect(keys.rows).toEqual([{ lead_id: recent.id }]);
  });
  it('réserve la notification une seule fois lors de deux reprises concurrentes', async () => {
    const saved = await store.save(data, hash('notification'), hash('payload'));
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'synthetic-provider-id' }), { status: 200 }));
    const options = { env: { RESEND_API_KEY: 'fake-test-key', CONTACT_FROM_EMAIL: 'sender@example.invalid', CONTACT_TO_EMAIL: 'owner@example.invalid' }, fetcher };
    const results = await Promise.all([notifyLead(pool, saved.id, options), notifyLead(pool, saved.id, options)]);
    expect(results).toContain('sent');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect((await database.query('SELECT notification_status, notification_attempts FROM contact_leads')).rows[0]).toEqual({ notification_status: 'sent', notification_attempts: 1 });
  });
});
