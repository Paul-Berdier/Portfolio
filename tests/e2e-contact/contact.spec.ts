import { expect, test, type Page, type Route } from '@playwright/test';

// Les succès et erreurs de validation sont des réponses HTTP simulées côté
// navigateur. Le test de panne DB appelle réellement le serveur local, qui
// pointe exclusivement vers le port fermé 127.0.0.1:1. Aucune collecte externe.
const message =
  'Démonstration synthétique : organiser des fichiers et automatiser les étapes répétitives.';
const response = {
  ok: true,
  recorded: true,
  code: 'recorded',
  message: 'Votre demande est bien enregistrée.',
  reference: 'synthetic-reference',
  notification: 'sent',
};

async function prepare(page: Page, path = '/contact') {
  await page.goto(path);
  await expect(page.locator('[data-contact-form]')).toHaveAttribute('data-enabled', 'true');
  await expect(page.locator('#contact-name')).toBeEnabled();
  await page.locator('#contact-name').fill('Camille Démo');
  await page.locator('#contact-email').fill('camille@example.invalid');
  await page.locator('#contact-need').selectOption('automation');
  await page.locator('#contact-message').fill(message);
}
const submit = (page: Page) => page.locator('[data-submit]');
const status = (page: Page) => page.locator('[data-contact-status]');

test('la validation native bloque un formulaire incomplet sans requête', async ({ page }) => {
  let sent = 0;
  await page.route('**/api/contact', async (route) => {
    sent++;
    await route.abort();
  });
  await page.goto('/contact');
  await expect(submit(page)).toBeEnabled();
  await submit(page).click();
  await expect(page.locator('#contact-name')).toBeFocused();
  expect(
    await page
      .locator('[data-contact-form]')
      .evaluate((element) => (element as HTMLFormElement).checkValidity()),
  ).toBe(false);
  expect(sent).toBe(0);
  await expect(status(page)).not.toHaveAttribute('data-state', 'success');
});

test('une réponse 422 associe les erreurs aux champs et conserve la saisie', async ({ page }) => {
  await page.route('**/api/contact', (route) =>
    route.fulfill({
      status: 422,
      json: {
        ok: false,
        code: 'validation',
        message: 'Vérifiez les champs indiqués.',
        errors: { email: 'Indiquez une adresse email valide.' },
      },
    }),
  );
  await prepare(page);
  await submit(page).click();
  await expect(page.locator('#contact-email')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#contact-email')).toBeFocused();
  await expect(page.locator('#error-email')).toBeVisible();
  await expect(page.locator('#error-email')).toHaveText('Indiquez une adresse email valide.');
  await expect(page.locator('#contact-message')).toHaveValue(message);
  await expect(submit(page)).toBeEnabled();
});

test('une coupure réseau conserve la saisie et la clé pour un nouvel essai', async ({ page }) => {
  await page.route('**/api/contact', (route) => route.abort('failed'));
  await prepare(page);
  const key = await page.locator('[name=idempotencyKey]').inputValue();
  await submit(page).click();
  await expect(status(page)).toContainText('Votre saisie est conservée');
  await expect(status(page)).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#contact-message')).toHaveValue(message);
  await expect(page.locator('[name=idempotencyKey]')).toHaveValue(key);
  await expect(submit(page)).toBeEnabled();
});

test('aucun succès ne précède la confirmation HTTP du serveur', async ({ page }) => {
  let pending: Route | undefined;
  await page.route('**/api/contact', (route) => {
    pending = route;
  });
  await prepare(page);
  await submit(page).click();
  await expect(status(page)).toHaveAttribute('data-state', 'loading');
  await expect(submit(page)).toBeDisabled();
  await expect(status(page)).not.toContainText('bien enregistrée');
  await expect.poll(() => !!pending).toBe(true);
  await pending!.fulfill({ status: 201, json: response });
  await expect(status(page)).toHaveAttribute('data-state', 'success');
  await expect(status(page)).toContainText('bien enregistrée');
  await expect(page.locator('#contact-message')).toBeDisabled();
});

test('un 200 sans confirmation recorded ne devient pas un faux succès', async ({ page }) => {
  await page.route('**/api/contact', (route) =>
    route.fulfill({ status: 200, json: { ok: true, message: 'Réponse incomplète.' } }),
  );
  await prepare(page);
  await submit(page).click();
  await expect(status(page)).toHaveAttribute('data-state', 'error');
  await expect(submit(page)).toBeEnabled();
  await expect(page.locator('#contact-message')).toHaveValue(message);
});

test('un email échoué n’annule pas une demande confirmée enregistrée', async ({ page }) => {
  await page.route('**/api/contact', (route) =>
    route.fulfill({ status: 201, json: { ...response, notification: 'failed' } }),
  );
  await prepare(page);
  await submit(page).click();
  await expect(status(page)).toHaveAttribute('data-state', 'success');
  await expect(status(page)).toHaveText('Votre demande est bien enregistrée.');
  await expect(status(page)).not.toContainText(/email envoyé/i);
});

test('une vraie panne du stockage local retourne 503 et conserve le formulaire', async ({
  page,
}) => {
  await prepare(page);
  const resultPromise = page.waitForResponse(
    (result) => result.url().endsWith('/api/contact') && result.request().method() === 'POST',
  );
  await submit(page).click();
  const result = await resultPromise;
  expect(result.status()).toBe(503);
  expect(await result.json()).toMatchObject({ ok: false, code: 'unavailable' });
  await expect(status(page)).toHaveAttribute('data-state', 'error');
  await expect(status(page)).toContainText('temporairement indisponible');
  await expect(page.locator('#contact-message')).toHaveValue(message);
  await expect(submit(page)).toBeEnabled();
});

test('changer les animations pendant l’envoi permet ensuite de réessayer', async ({ page }) => {
  let attempts = 0;
  let first: Route | undefined;
  await page.route('**/api/contact', async (route) => {
    attempts++;
    if (attempts === 1) first = route;
    else await route.fulfill({ status: 201, json: response });
  });
  await prepare(page);
  const key = await page.locator('[name=idempotencyKey]').inputValue();
  await submit(page).click();
  await expect(status(page)).toHaveAttribute('data-state', 'loading');
  await expect.poll(() => !!first).toBe(true);
  await page.locator('#motion-preference').selectOption('off');
  await expect(submit(page)).toBeEnabled();
  await expect(status(page)).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#contact-message')).toHaveValue(message);
  await expect(page.locator('[name=idempotencyKey]')).toHaveValue(key);
  await first!.abort().catch(() => {});
  await submit(page).click();
  await expect(status(page)).toHaveAttribute('data-state', 'success');
  expect(attempts).toBe(2);
});

test('un lien de service présélectionne seulement un besoin reconnu', async ({ page }) => {
  await page.goto('/contact?besoin=intelligence-artificielle');
  await expect(page.locator('#contact-need')).toHaveValue('ai');
  await page.goto('/contact?besoin=inconnu');
  await expect(page.locator('#contact-need')).toHaveValue('');
});

const translations = [
  {
    locale: 'en',
    path: '/en/contact',
    privacy: '/en/privacy',
    need: 'artificial-intelligence',
    required: 'Please fill in this field.',
    email: 'Enter a valid email address.',
    invalid: 'Check the highlighted fields. Your enquiry has not been saved.',
    retry: 'Try sending again',
    saved: 'Your enquiry has been saved. I will review your project.',
    savedLabel: 'Enquiry saved',
    network: 'The connection was interrupted.',
    nameLabel: 'Your name',
    heading: 'It all starts',
  },
  {
    locale: 'es',
    path: '/es/contacto',
    privacy: '/es/privacidad',
    need: 'inteligencia-artificial',
    required: 'Completa este campo.',
    email: 'Indica una dirección de correo válida.',
    invalid: 'Revisa los campos indicados. Tu solicitud no se ha guardado.',
    retry: 'Volver a enviar',
    saved: 'Tu solicitud se ha guardado. Revisaré tu proyecto.',
    savedLabel: 'Solicitud guardada',
    network: 'La conexión se ha interrumpido.',
    nameLabel: 'Tu nombre',
    heading: 'Todo empieza',
  },
] as const;

for (const copy of translations) {
  test(`${copy.locale} : libellés, lien, présélection et validation native localisés`, async ({
    page,
  }) => {
    let sent = 0;
    await page.route(`**/api/contact?lang=${copy.locale}`, async (route) => {
      sent++;
      await route.abort();
    });
    await page.goto(`${copy.path}?besoin=${copy.need}`);
    await expect(page.locator('html')).toHaveAttribute('lang', copy.locale);
    await expect(page.locator('h1')).toContainText(copy.heading);
    await expect(page.locator('label[for=contact-name]')).toContainText(copy.nameLabel);
    await expect(page.locator('#contact-privacy a')).toHaveAttribute('href', copy.privacy);
    await expect(page.locator('[data-contact-form]')).toHaveAttribute(
      'action',
      `/api/contact?lang=${copy.locale}`,
    );
    await expect(page.locator('#contact-need')).toHaveValue('ai');
    await submit(page).click();
    await expect(page.locator('#contact-name')).toBeFocused();
    // Browser locale is French: the page still supplies English/Spanish validation.
    expect(
      await page
        .locator('#contact-name')
        .evaluate((field) => (field as HTMLInputElement).validationMessage),
    ).toBe(copy.required);
    expect(sent).toBe(0);
  });

  test(`${copy.locale} : erreur 422 puis succès simulé sans changer les valeurs canoniques`, async ({
    page,
  }) => {
    let attempts = 0;
    await page.route(`**/api/contact?lang=${copy.locale}`, async (route) => {
      attempts++;
      const payload = route.request().postDataJSON();
      expect(payload.need).toBe('automation');
      expect(payload.budget).toBe('undecided');
      expect(payload.deadline).toBe('flexible');
      expect(payload).not.toHaveProperty('locale');
      await route.fulfill(
        attempts === 1
          ? {
              status: 422,
              json: {
                ok: false,
                code: 'validation',
                message: copy.invalid,
                errors: { email: copy.email },
              },
            }
          : { status: 201, json: { ...response, message: copy.saved, notification: 'failed' } },
      );
    });
    await prepare(page, copy.path);
    await submit(page).click();
    await expect(status(page)).toHaveText(copy.invalid);
    await expect(page.locator('#error-email')).toHaveText(copy.email);
    await expect(page.locator('#contact-email')).toBeFocused();
    await expect(page.locator('[data-submit-label]')).toHaveText(copy.retry);
    await expect(page.locator('#contact-message')).toHaveValue(message);
    await submit(page).click();
    await expect(status(page)).toHaveAttribute('data-state', 'success');
    await expect(status(page)).toHaveText(copy.saved);
    await expect(page.locator('[data-submit-label]')).toHaveText(copy.savedLabel);
    expect(attempts).toBe(2);
  });

  test(`${copy.locale} : coupure simulée, saisie et clé conservées`, async ({ page }) => {
    await page.route(`**/api/contact?lang=${copy.locale}`, (route) => route.abort('failed'));
    await prepare(page, copy.path);
    const key = await page.locator('[name=idempotencyKey]').inputValue();
    await submit(page).click();
    await expect(status(page)).toHaveAttribute('data-state', 'error');
    await expect(status(page)).toContainText(copy.network);
    await expect(page.locator('[data-submit-label]')).toHaveText(copy.retry);
    await expect(page.locator('#contact-message')).toHaveValue(message);
    await expect(page.locator('[name=idempotencyKey]')).toHaveValue(key);
    await expect(submit(page)).toBeEnabled();
  });
}
