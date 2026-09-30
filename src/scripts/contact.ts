import { contactClientCopy, contactLocale } from '../i18n/contact';

interface ContactResponse {
  ok?: boolean;
  recorded?: boolean;
  message?: string;
  errors?: Record<string, string>;
}

let dispose: (() => void) | undefined;
export function initContact(): () => void {
  dispose?.();
  const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
  if (!form || form.dataset.enabled !== 'true') return () => {};
  const copy = contactClientCopy[contactLocale(form.dataset.contactLocale)];
  const lifecycle = new AbortController();
  let requestController: AbortController | undefined;
  let busy = false;
  dispose = () => {
    lifecycle.abort();
    requestController?.abort();
    // Le changement de préférence de mouvement réinitialise aussi la page.
    // Une requête annulée doit laisser ce même formulaire prêt à réessayer.
    if (busy && form.isConnected) {
      const button = form.querySelector<HTMLButtonElement>('[data-submit]');
      const label = form.querySelector<HTMLElement>('[data-submit-label]');
      const status = form.querySelector<HTMLElement>('[data-contact-status]');
      if (button) button.disabled = false;
      if (label) label.textContent = copy.retry;
      if (status) {
        status.dataset.state = 'error';
        status.textContent = copy.interrupted;
      }
      form.removeAttribute('aria-busy');
    }
    busy = false;
    dispose = undefined;
  };
  const isField = (target: EventTarget | null) =>
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement;
  // Native validation follows the page language, independently of browser settings.
  form.addEventListener(
    'invalid',
    (event) => {
      const field = event.target;
      if (!isField(field)) return;
      field.setCustomValidity('');
      const validity = field.validity;
      const min = Number(field.getAttribute('minlength'));
      const max = Number(field.getAttribute('maxlength'));
      field.setCustomValidity(
        validity.valueMissing
          ? copy.required
          : validity.typeMismatch
            ? copy.email
            : validity.tooShort
              ? copy.tooShort(min)
              : validity.tooLong
                ? copy.tooLong(max)
                : copy.invalid,
      );
    },
    { capture: true, signal: lifecycle.signal },
  );
  const clearValidity = (event: Event) => {
    if (isField(event.target)) event.target.setCustomValidity('');
  };
  form.addEventListener('input', clearValidity, { signal: lifecycle.signal });
  form.addEventListener('change', clearValidity, { signal: lifecycle.signal });
  // Re-initialisation (including a motion preference change) must not retain stale errors.
  form
    .querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      'input, select, textarea',
    )
    .forEach((field) => field.setCustomValidity(''));
  form.addEventListener(
    'submit',
    async (event) => {
      event.preventDefault();
      if (busy || !form.reportValidity()) return;
      const status = form.querySelector<HTMLElement>('[data-contact-status]');
      const button = form.querySelector<HTMLButtonElement>('[data-submit]');
      const label = form.querySelector<HTMLElement>('[data-submit-label]');
      if (!status || !button || !label) return;
      busy = true;
      button.disabled = true;
      label.textContent = copy.saving;
      form.setAttribute('aria-busy', 'true');
      status.dataset.state = 'loading';
      status.textContent = copy.savingStatus;
      form.querySelectorAll<HTMLElement>('[data-error-for]').forEach((element) => {
        element.hidden = true;
        element.textContent = '';
      });
      form
        .querySelectorAll('[aria-invalid]')
        .forEach((element) => element.removeAttribute('aria-invalid'));
      const data = Object.fromEntries(new FormData(form).entries());
      requestController = new AbortController();
      const timeout = window.setTimeout(() => requestController?.abort(), 15000);
      try {
        const response = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data),
          signal: requestController.signal,
          credentials: 'same-origin',
        });
        const result = (await response.json()) as ContactResponse;
        if (response.ok && result.ok === true && result.recorded === true) {
          status.dataset.state = 'success';
          status.textContent = result.message || copy.saved;
          label.textContent = copy.savedLabel;
          form.querySelector('fieldset')?.setAttribute('disabled', '');
          status.focus();
        } else {
          status.dataset.state = 'error';
          status.textContent = result.message || copy.failed;
          let first: HTMLElement | undefined;
          for (const [field, message] of Object.entries(result.errors || {})) {
            const control = form.elements.namedItem(field);
            const error = form.querySelector<HTMLElement>(
              `[data-error-for="${CSS.escape(field)}"]`,
            );
            if (control instanceof HTMLElement) {
              control.setAttribute('aria-invalid', 'true');
              first ||= control;
            }
            if (error) {
              error.textContent = message;
              error.hidden = false;
            }
          }
          (first || status).focus();
          button.disabled = false;
          label.textContent = copy.retry;
        }
      } catch {
        if (!lifecycle.signal.aborted) {
          status.dataset.state = 'error';
          status.textContent = copy.network;
          button.disabled = false;
          label.textContent = copy.retry;
          status.focus();
        }
      } finally {
        window.clearTimeout(timeout);
        if (!lifecycle.signal.aborted) form.removeAttribute('aria-busy');
        busy = false;
      }
    },
    { signal: lifecycle.signal },
  );
  return dispose;
}
