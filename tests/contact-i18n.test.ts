import { describe, expect, it, vi } from 'vitest';
import { handleContact, type ContactDependencies } from '../src/server/contact';
import { createContactSchema } from '../src/server/contact-schema';
import { contactLocale } from '../src/i18n/contact';
import type { Locale } from '../src/i18n';

const valid = {
  name: 'Camille Demo',
  email: 'camille@example.invalid',
  company: '',
  phone: '',
  need: 'automation',
  budget: 'undecided',
  deadline: 'flexible',
  message: 'Synthetic enquiry to organise demonstration documents automatically.',
  website: '',
  idempotencyKey: 'c1c29494-b041-4234-8fe7-06d743e8c3aa',
};
const origin = 'https://portfolio.example.invalid';
function dependencies(): ContactDependencies {
  return {
    config: {
      enabled: true,
      availability: 'open',
      hashSecret: 'unit-test-only-'.repeat(4),
      origins: [origin],
      retentionMonths: 12,
      trustedProxyHops: 0,
    },
    store: {
      rateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfter: 900 }),
      save: vi
        .fn()
        .mockResolvedValue({
          id: 'synthetic-reference',
          duplicate: false,
          notification: 'pending',
        }),
    },
    notify: vi.fn().mockResolvedValue('failed'),
    now: () => new Date('2026-09-30T10:00:00Z'),
    log: vi.fn(),
  };
}
function request(locale: string, data: unknown = valid, headers: Record<string, string> = {}) {
  return new Request(`${origin}/api/contact?lang=${encodeURIComponent(locale)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin, ...headers },
    body: JSON.stringify(data),
  });
}

const languages: {
  locale: Locale;
  email: string;
  saved: string;
  back: string;
  preview: string;
  origin: string;
  tooLarge: string;
}[] = [
  {
    locale: 'fr',
    email: 'Indiquez une adresse email valide.',
    saved: 'Votre demande est enregistrée.',
    back: '/contact',
    preview: 'Le formulaire est désactivé en préproduction.',
    origin: 'Cette origine de soumission n’est pas autorisée.',
    tooLarge: 'Votre demande est trop volumineuse.',
  },
  {
    locale: 'en',
    email: 'Enter a valid email address.',
    saved: 'Your enquiry has been saved.',
    back: '/en/contact',
    preview: 'The form is disabled in this preview.',
    origin: 'Submissions from this origin are not allowed.',
    tooLarge: 'Your enquiry is too large.',
  },
  {
    locale: 'es',
    email: 'Indica una dirección de correo válida.',
    saved: 'Tu solicitud se ha guardado.',
    back: '/es/contacto',
    preview: 'El formulario está desactivado en esta versión de preproducción.',
    origin: 'No se permiten envíos desde este origen.',
    tooLarge: 'Tu solicitud es demasiado grande.',
  },
];

describe.each(languages)(
  'contact localisé : $locale',
  ({ locale, email, saved, back, preview, origin: originError, tooLarge }) => {
    it('localise les erreurs par champ sans enregistrer ni notifier', async () => {
      const deps = dependencies();
      const result = await handleContact(
        request(locale, { ...valid, email: 'invalid', message: '' }),
        '127.0.0.1',
        deps,
      );
      expect(result.status).toBe(422);
      expect(result.headers.get('Content-Language')).toBe(locale);
      expect(await result.json()).toMatchObject({
        ok: false,
        code: 'validation',
        errors: { email },
      });
      expect(deps.store.save).not.toHaveBeenCalled();
      expect(deps.notify).not.toHaveBeenCalled();
    });
    it('conserve la fermeture et le contrôle d’origine dans cette langue', async () => {
      const deps = dependencies();
      deps.config.enabled = false;
      deps.config.availability = 'preview';
      const closed = await handleContact(request(locale), '127.0.0.1', deps);
      expect(closed.status).toBe(503);
      expect((await closed.json()).message).toContain(preview);
      deps.config.enabled = true;
      const foreign = await handleContact(
        request(locale, valid, { Origin: 'https://foreign.example.invalid' }),
        '127.0.0.1',
        deps,
      );
      expect(foreign.status).toBe(403);
      expect((await foreign.json()).message).toBe(originError);
      expect(deps.store.rateLimit).not.toHaveBeenCalled();
      expect(deps.store.save).not.toHaveBeenCalled();
    });
    it('traduit aussi une erreur de taille avant parsing', async () => {
      const result = await handleContact(
        request(locale, valid, { 'Content-Length': '99999' }),
        '127.0.0.1',
        dependencies(),
      );
      expect(result.status).toBe(413);
      expect(await result.json()).toMatchObject({
        ok: false,
        code: 'too_large',
        message: tooLarge,
      });
    });
    it('retourne le HTML sans JS et le lien de retour dans la même langue', async () => {
      const result = await handleContact(
        new Request(`${origin}/api/contact?lang=${locale}`, {
          method: 'POST',
          headers: {
            Origin: origin,
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'text/html',
          },
          body: new URLSearchParams(valid),
        }),
        '127.0.0.1',
        dependencies(),
      );
      expect(result.status).toBe(201);
      expect(result.headers.get('Content-Language')).toBe(locale);
      const html = await result.text();
      expect(html).toContain(`<html lang="${locale}">`);
      expect(html).toContain(saved);
      expect(html).toContain(`href="${back}"`);
    });
    it('garde le schéma strict et les mêmes données normalisées', () => {
      const schema = createContactSchema(locale);
      expect(schema.parse(valid)).toEqual(valid);
      expect(schema.safeParse({ ...valid, locale }).success).toBe(false);
      expect(schema.safeParse({ ...valid, website: 'bot' }).success).toBe(false);
      expect(schema.safeParse({ ...valid, name: 'x'.repeat(101) }).success).toBe(false);
    });
  },
);

it('la langue ne change ni le contenu stocké ni les hashes d’idempotence', async () => {
  const deps = dependencies();
  for (const locale of ['fr', 'en', 'es']) {
    const result = await handleContact(request(locale), '127.0.0.1', deps);
    expect(result.status).toBe(201);
    expect(await result.json()).toMatchObject({ ok: true, recorded: true, notification: 'failed' });
  }
  const calls = vi.mocked(deps.store.save).mock.calls;
  expect(calls[1]).toEqual(calls[0]);
  expect(calls[2]).toEqual(calls[0]);
  expect(calls[0]?.[0]).not.toHaveProperty('locale');
});

it('borne explicitement la langue et conserve le français par défaut', async () => {
  expect(contactLocale('en')).toBe('en');
  expect(contactLocale('es')).toBe('es');
  for (const value of [undefined, null, 'de', 'EN', '<script>alert(1)</script>'])
    expect(contactLocale(value)).toBe('fr');
  const result = await handleContact(
    request('<script>alert(1)</script>', valid, { Accept: 'text/html' }),
    '127.0.0.1',
    dependencies(),
  );
  expect(result.headers.get('Content-Language')).toBe('fr');
  const html = await result.text();
  expect(html).toContain('Votre demande est enregistrée.');
  expect(html).not.toContain('<script>');
});
