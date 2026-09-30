import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { contactSchema, createContactSchema, type ContactData } from './contact-schema';
import { contactLocale, contactServerCopy } from '../i18n/contact';
import { localizePath, type Locale } from '../i18n';
import { getContactConfig, type ContactConfig } from './config';
import { contactStore, getPool, IdempotencyConflict, type ContactStore } from './store';
import { notifyLead } from './notification.mjs';

const MAX_BODY_BYTES = 16384;
const schemas = { fr: contactSchema, en: createContactSchema('en'), es: createContactSchema('es') };
export interface ContactResult {
  ok: boolean;
  code: string;
  message: string;
  recorded?: boolean;
  notification?: string;
  reference?: string;
  errors?: Record<string, string>;
}
export interface ContactDependencies {
  config: ContactConfig;
  store: ContactStore;
  notify: (id: string) => Promise<string>;
  now: () => Date;
  log: (event: string) => void;
}

class RequestError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function readLimitedBody(request: Request, locale: Locale = 'fr'): Promise<string> {
  const copy = contactServerCopy[locale];
  const length = Number(request.headers.get('content-length'));
  if (Number.isFinite(length) && length > MAX_BODY_BYTES)
    throw new RequestError(413, 'too_large', copy.tooLarge);
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  const deadline = Date.now() + 5000;
  try {
    for (;;) {
      let timeout: ReturnType<typeof setTimeout> | undefined;
      const next = await Promise.race([
        reader.read(),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () => reject(new RequestError(408, 'timeout', copy.timeout)),
            Math.max(1, deadline - Date.now()),
          );
        }),
      ]).finally(() => clearTimeout(timeout));
      if (next.done) break;
      size += next.value.byteLength;
      if (size > MAX_BODY_BYTES) throw new RequestError(413, 'too_large', copy.tooLarge);
      chunks.push(next.value);
    }
  } catch (error) {
    void reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks).toString('utf8');
}

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ||
      character,
  );
function respond(
  request: Request,
  status: number,
  result: ContactResult,
  extraHeaders: Record<string, string> = {},
) {
  const locale = contactLocale(new URL(request.url).searchParams.get('lang'));
  const copy = contactServerCopy[locale];
  const headers = {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Language': locale,
    ...extraHeaders,
  };
  if (request.headers.get('accept')?.includes('text/html')) {
    const errors = Object.values(result.errors || {})
      .map((message) => `<li>${escapeHtml(message)}</li>`)
      .join('');
    return new Response(
      `<!doctype html><html lang="${locale}"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex"><title>${result.ok ? copy.successTitle : copy.errorTitle}</title><body><main><h1>${result.ok ? copy.successHeading : copy.errorHeading}</h1><p>${escapeHtml(result.message)}</p>${errors ? `<ul>${errors}</ul>` : ''}<p>${result.ok ? copy.thanks : copy.backHint}</p><a href="${localizePath('/contact', locale)}">${copy.backLink}</a></main></body></html>`,
      {
        status,
        headers: {
          ...headers,
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Security-Policy': "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
        },
      },
    );
  }
  return new Response(JSON.stringify(result), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export async function handleContact(
  request: Request,
  clientAddress = 'unknown',
  dependencies?: ContactDependencies,
) {
  const locale = contactLocale(new URL(request.url).searchParams.get('lang'));
  const copy = contactServerCopy[locale];
  const deps = dependencies || {
    config: getContactConfig(),
    store: contactStore,
    notify: (id: string) => notifyLead(getPool(), id),
    now: () => new Date(),
    log: (event: string) => console.error(JSON.stringify({ event })),
  };
  const fail = (status: number, code: string, message: string, errors?: Record<string, string>) =>
    respond(request, status, { ok: false, code, message, errors });
  if (request.method !== 'POST')
    return respond(
      request,
      405,
      { ok: false, code: 'method', message: copy.method },
      { Allow: 'POST' },
    );
  if (!deps.config.enabled)
    return fail(
      503,
      'contact_disabled',
      deps.config.availability === 'preview' ? copy.preview : copy.disabled,
    );
  const origin = request.headers.get('origin');
  if (
    !origin ||
    !deps.config.origins.includes(origin) ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  )
    return fail(403, 'origin', copy.origin);
  const type = request.headers.get('content-type')?.split(';')[0]?.trim();
  if (type !== 'application/json' && type !== 'application/x-www-form-urlencoded')
    return fail(415, 'content_type', copy.contentType);
  try {
    const body = await readLimitedBody(request, locale);
    let input: unknown;
    try {
      if (type === 'application/json') input = JSON.parse(body);
      else {
        const fields = new URLSearchParams(body);
        if ([...fields.keys()].some((key) => fields.getAll(key).length !== 1))
          return fail(400, 'invalid', copy.duplicateField);
        input = Object.fromEntries(fields.entries());
      }
    } catch {
      return fail(400, 'invalid', copy.invalid);
    }
    const hash = (value: string) =>
      createHmac('sha256', deps.config.hashSecret).update(value).digest('hex');
    // Astro peut déjà avoir remplacé clientAddress par X-Forwarded-For quand
    // allowedDomains est configuré. Sans confiance explicite, on partage un
    // quota prudent plutôt que d'accepter cette adresse usurpable.
    let address = request.headers.has('x-forwarded-for') ? 'unverified-proxy' : clientAddress;
    if (deps.config.trustedProxyHops > 0) {
      const chain = [
        ...(request.headers.get('x-forwarded-for') || '')
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        clientAddress,
      ];
      const candidate = chain[chain.length - 1 - deps.config.trustedProxyHops];
      if (candidate && isIP(candidate)) address = candidate;
    }
    const rate = await deps.store.rateLimit(hash(`ip:${address}`), deps.now());
    if (!rate.allowed)
      return respond(
        request,
        429,
        {
          ok: false,
          code: 'rate_limit',
          message: copy.rateLimit,
        },
        { 'Retry-After': String(rate.retryAfter) },
      );
    const parsed = schemas[locale].safeParse(input);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || 'form');
        errors[key] ||= issue.message;
      }
      return fail(422, 'validation', copy.validation, errors);
    }
    const { website: _website, idempotencyKey, ...data } = parsed.data;
    const saved = await deps.store.save(
      data satisfies ContactData,
      hash(`key:${idempotencyKey}`),
      hash(JSON.stringify(data)),
    );
    let notification = saved.notification;
    if (!saved.duplicate) {
      try {
        notification = await deps.notify(saved.id);
      } catch {
        deps.log('contact_notification_failed');
        notification = 'pending';
      }
    }
    return respond(request, saved.duplicate ? 200 : 201, {
      ok: true,
      code: saved.duplicate ? 'already_recorded' : 'recorded',
      recorded: true,
      message: saved.duplicate ? copy.alreadyRecorded : copy.recorded,
      reference: saved.id,
      notification,
    });
  } catch (error) {
    if (error instanceof RequestError) return fail(error.status, error.code, error.message);
    if (error instanceof IdempotencyConflict)
      return fail(409, 'idempotency_conflict', copy.conflict);
    deps.log('contact_storage_unavailable');
    return fail(503, 'unavailable', copy.unavailable);
  }
}
