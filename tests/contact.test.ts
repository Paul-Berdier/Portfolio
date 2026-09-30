import { describe, expect, it, vi } from 'vitest';
import { handleContact, readLimitedBody, type ContactDependencies } from '../src/server/contact';
import { getContactConfig } from '../src/server/config';
import { contactSchema } from '../src/server/contact-schema';
import { IdempotencyConflict } from '../src/server/store';
import { csvCell, toCsv } from '../src/server/csv.mjs';
import { notifyLead } from '../src/server/notification.mjs';

const valid = {
  name: '  Camille Démo  ', email: ' CAMILLE@example.invalid ', company: '', phone: '',
  need: 'automation', budget: 'undecided', deadline: 'flexible',
  message: 'Je souhaite organiser automatiquement mes fichiers de démonstration.',
  website: '', idempotencyKey: 'c1c29494-b041-4234-8fe7-06d743e8c3aa',
};
const makeRequest = (data: unknown = valid, headers: Record<string, string> = {}) => new Request('https://portfolio.example.invalid/api/contact', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://portfolio.example.invalid', ...headers }, body: JSON.stringify(data),
});
function dependencies(): ContactDependencies {
  return {
    config: { enabled: true, availability: 'open', hashSecret: 'unit-test-only-'.repeat(4), origins: ['https://portfolio.example.invalid'], retentionMonths: 12, trustedProxyHops: 0 },
    store: { rateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfter: 900 }), save: vi.fn().mockResolvedValue({ id: 'saved-reference', duplicate: false, notification: 'pending' }) },
    notify: vi.fn().mockResolvedValue('sent'), now: () => new Date('2026-09-30T10:00:00Z'), log: vi.fn(),
  };
}

describe('contact : validation et fermetures de sécurité', () => {
  it('ferme la collecte par défaut sans accéder à la base', async () => {
    const deps = dependencies();
    deps.config = getContactConfig({});
    const result = await handleContact(makeRequest(), '127.0.0.1', deps);
    expect(result.status).toBe(503);
    expect((await result.json()).code).toBe('contact_disabled');
    expect(deps.store.rateLimit).not.toHaveBeenCalled();
    expect(deps.store.save).not.toHaveBeenCalled();
  });
  it('exige les trois validations ET une configuration complète', () => {
    const env = { PUBLIC_SITE_MODE: 'production', PUBLIC_LEGAL_VALIDATED: 'true', CONTACT_ENABLED: 'true', DATABASE_URL: 'postgres://unit.invalid/test', CONTACT_HASH_SECRET: 'test'.repeat(16), CONTACT_ALLOWED_ORIGINS: 'https://portfolio.example.invalid' };
    expect(getContactConfig(env).enabled).toBe(true);
    for (const key of ['PUBLIC_SITE_MODE', 'PUBLIC_LEGAL_VALIDATED', 'CONTACT_ENABLED', 'DATABASE_URL', 'CONTACT_HASH_SECRET', 'CONTACT_ALLOWED_ORIGINS']) expect(getContactConfig({ ...env, [key]: '' }).enabled).toBe(false);
    expect(getContactConfig({ ...env, CONTACT_ALLOWED_ORIGINS: 'https://portfolio.example.invalid/path' }).enabled).toBe(false);
  });
  it('rejette une origine étrangère, absente ou cross-site avant le stockage', async () => {
    const cases: Record<string, string>[] = [{ Origin: 'https://attacker.example.invalid' }, { Origin: '' }, { 'Sec-Fetch-Site': 'cross-site' }];
    for (const headers of cases) {
      const deps = dependencies();
      expect((await handleContact(makeRequest(valid, headers), '127.0.0.1', deps)).status).toBe(403);
      expect(deps.store.rateLimit).not.toHaveBeenCalled();
    }
  });
  it('ne fournit aucun endpoint de lecture', async () => {
    const response = await handleContact(new Request('https://portfolio.example.invalid/api/contact'), '127.0.0.1', dependencies());
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST');
  });
  it('rejette les formats arbitraires et un JSON malformé', async () => {
    expect((await handleContact(makeRequest(valid, { 'Content-Type': 'text/plain' }), '127.0.0.1', dependencies())).status).toBe(415);
    const request = new Request('https://portfolio.example.invalid/api/contact', { method: 'POST', headers: { Origin: 'https://portfolio.example.invalid', 'Content-Type': 'application/json' }, body: '{broken' });
    expect((await handleContact(request, '127.0.0.1', dependencies())).status).toBe(400);
  });
  it('limite le flux réel même sans Content-Length', async () => {
    const request = new Request('https://portfolio.example.invalid/api/contact', { method: 'POST', body: 'é'.repeat(10000) });
    await expect(readLimitedBody(request)).rejects.toMatchObject({ status: 413 });
    const response = await handleContact(makeRequest(valid, { 'Content-Length': '9999999' }), '127.0.0.1', dependencies());
    expect(response.status).toBe(413);
  });
  it('normalise raisonnablement et garde les caractères français', () => {
    const data = contactSchema.parse(valid);
    expect(data.name).toBe('Camille Démo');
    expect(data.email).toBe('camille@example.invalid');
  });
  it.each([
    { email: 'incorrect' }, { name: 'A' }, { message: 'Trop court' },
    { website: 'https://bot.invalid' }, { need: 'hacking' }, { phone: 'javascript:alert(1)' },
    { name: 'Camille\nInjected' }, { message: 'z'.repeat(5001) }, { idempotencyKey: 'bad' },
  ])('refuse un champ non valide : %j', async (invalid) => {
    const deps = dependencies();
    const response = await handleContact(makeRequest({ ...valid, ...invalid }), '127.0.0.1', deps);
    expect(response.status).toBe(422);
    expect(deps.store.save).not.toHaveBeenCalled();
    expect(deps.notify).not.toHaveBeenCalled();
  });
  it('limite les tentatives avec Retry-After', async () => {
    const deps = dependencies();
    vi.mocked(deps.store.rateLimit).mockResolvedValue({ allowed: false, retryAfter: 432 });
    const response = await handleContact(makeRequest(), '127.0.0.1', deps);
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('432');
    expect(deps.store.save).not.toHaveBeenCalled();
  });
  it('ignore les adresses proxy forgées sans configuration explicite', async () => {
    const deps = dependencies();
    await handleContact(makeRequest(valid, { 'X-Forwarded-For': '203.0.113.123' }), '127.0.0.1', deps);
    await handleContact(makeRequest(valid, { 'X-Forwarded-For': '192.0.2.123' }), '127.0.0.1', deps);
    const calls = vi.mocked(deps.store.rateLimit).mock.calls;
    expect(calls[0]?.[0]).toBe(calls[1]?.[0]);
    expect(calls[0]?.[0]).not.toContain('127.0.0.1');
  });
});

describe('contact : enregistrement et notification séparés', () => {
  it('enregistre avant de notifier et retourne une vraie confirmation', async () => {
    const deps = dependencies();
    deps.notify = vi.fn(async () => { expect(deps.store.save).toHaveBeenCalledTimes(1); return 'sent'; });
    const response = await handleContact(makeRequest(), '127.0.0.1', deps);
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ ok: true, recorded: true, notification: 'sent' });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it('ne confirme rien si la base échoue et ne journalise aucune donnée personnelle', async () => {
    const deps = dependencies();
    vi.mocked(deps.store.save).mockRejectedValue(new Error('private email leaked by dependency'));
    const response = await handleContact(makeRequest(), '127.0.0.1', deps);
    expect(response.status).toBe(503);
    expect((await response.json()).ok).toBe(false);
    expect(deps.notify).not.toHaveBeenCalled();
    expect(deps.log).toHaveBeenCalledWith('contact_storage_unavailable');
    expect(JSON.stringify(vi.mocked(deps.log).mock.calls)).not.toContain('private email');
  });
  it('conserve le succès du stockage quand le mail échoue', async () => {
    const deps = dependencies();
    vi.mocked(deps.notify).mockResolvedValue('failed');
    const response = await handleContact(makeRequest(), '127.0.0.1', deps);
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ recorded: true, notification: 'failed' });
  });
  it('conserve le succès même si le statut de notification ne peut être écrit', async () => {
    const deps = dependencies();
    vi.mocked(deps.notify).mockRejectedValue(new Error('database disconnected'));
    const response = await handleContact(makeRequest(), '127.0.0.1', deps);
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ recorded: true, notification: 'pending' });
  });
  it('reconnaît une tentative déjà enregistrée sans notifier à nouveau', async () => {
    const deps = dependencies();
    vi.mocked(deps.store.save).mockResolvedValue({ id: 'saved-reference', duplicate: true, notification: 'sent' });
    const response = await handleContact(makeRequest(), '127.0.0.1', deps);
    expect(response.status).toBe(200);
    expect((await response.json()).code).toBe('already_recorded');
    expect(deps.notify).not.toHaveBeenCalled();
  });
  it('ne réutilise pas une clé avec un contenu différent', async () => {
    const deps = dependencies();
    vi.mocked(deps.store.save).mockRejectedValue(new IdempotencyConflict());
    const response = await handleContact(makeRequest(), '127.0.0.1', deps);
    expect(response.status).toBe(409);
    expect(deps.notify).not.toHaveBeenCalled();
  });
  it('accepte un formulaire HTML sans JavaScript et retourne un message lisible', async () => {
    const request = new Request('https://portfolio.example.invalid/api/contact', {
      method: 'POST', headers: { Origin: 'https://portfolio.example.invalid', 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'text/html' },
      body: new URLSearchParams(valid),
    });
    const response = await handleContact(request, '127.0.0.1', dependencies());
    expect(response.status).toBe(201);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(await response.text()).toContain('Votre demande est enregistrée.');
  });
});

describe('notification Resend : transport simulé, aucun email réel', () => {
  const env = { RESEND_API_KEY: 'unit-test-not-a-key', CONTACT_FROM_EMAIL: 'sender@example.invalid', CONTACT_TO_EMAIL: 'owner@example.invalid' };
  const lead = { ...valid, id: 'saved-reference' };
  it('n’appelle pas le fournisseur non configuré', async () => {
    const db = { query: vi.fn() };
    const fetcher = vi.fn();
    expect(await notifyLead(db as never, lead.id, { env: {}, fetcher })).toBe('pending');
    expect(fetcher).not.toHaveBeenCalled();
    expect(db.query).not.toHaveBeenCalled();
  });
  it('réserve, envoie avec clé stable, puis marque la notification', async () => {
    const db = { query: vi.fn().mockResolvedValueOnce({ rows: [lead] }).mockResolvedValue({ rows: [] }) };
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'provider-reference' }), { status: 200 }));
    expect(await notifyLead(db as never, lead.id, { env, fetcher })).toBe('sent');
    expect(fetcher.mock.calls[0]?.[1].headers['Idempotency-Key']).toBe('contact/saved-reference');
    expect(db.query.mock.calls[1]?.[0]).toContain("notification_status = 'sent'");
  });
  it('marque failed si le fournisseur échoue', async () => {
    const db = { query: vi.fn().mockResolvedValueOnce({ rows: [lead] }).mockResolvedValue({ rows: [] }) };
    const fetcher = vi.fn().mockRejectedValue(new Error('network unavailable'));
    expect(await notifyLead(db as never, lead.id, { env, fetcher })).toBe('failed');
    expect(db.query.mock.calls[1]?.[0]).toContain("notification_status = 'failed'");
  });
  it('ne renvoie pas une notification déjà prise en charge', async () => {
    const db = { query: vi.fn().mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ notification_status: 'sent' }] }) };
    const fetcher = vi.fn();
    expect(await notifyLead(db as never, lead.id, { env, fetcher })).toBe('sent');
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe('export privé', () => {
  it.each(['=1+1', '+SUM(A1)', '-2+3', '@SUM(A1)', '  =HYPERLINK("x")', '\tformula'])('neutralise la formule %j', (value) => {
    expect(csvCell(value).startsWith('"\'')).toBe(true);
  });
  it('échappe les guillemets et les retours sans casser les colonnes', () => {
    const csv = toCsv([{ name: 'Camille "Démo"', message: 'ligne 1\nligne 2' }], ['name', 'message']);
    expect(csv).toContain('"Camille ""Démo"""');
    expect(csv).toContain('"ligne 1\nligne 2"');
  });
});
