import { expect, test, type Page, type Route } from '@playwright/test';

// Les succès et erreurs de validation sont des réponses HTTP simulées côté
// navigateur. Le test de panne DB appelle réellement le serveur local, qui
// pointe exclusivement vers le port fermé 127.0.0.1:1. Aucune collecte externe.
const message = 'Démonstration synthétique : organiser des fichiers et automatiser les étapes répétitives.';
const response = { ok: true, recorded: true, code: 'recorded', message: 'Votre demande est bien enregistrée.', reference: 'synthetic-reference', notification: 'sent' };

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
  await page.route('**/api/contact', async (route) => { sent++; await route.abort(); });
  await page.goto('/contact');
  await expect(submit(page)).toBeEnabled();
  await submit(page).click();
  await expect(page.locator('#contact-name')).toBeFocused();
  expect(await page.locator('[data-contact-form]').evaluate((element) => (element as HTMLFormElement).checkValidity())).toBe(false);
  expect(sent).toBe(0);
  await expect(status(page)).not.toHaveAttribute('data-state', 'success');
});

test('une réponse 422 associe les erreurs aux champs et conserve la saisie', async ({ page }) => {
  await page.route('**/api/contact', (route) => route.fulfill({ status: 422, json: { ok: false, code: 'validation', message: 'Vérifiez les champs indiqués.', errors: { email: 'Indiquez une adresse email valide.' } } }));
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
  await page.route('**/api/contact', (route) => { pending = route; });
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
  await page.route('**/api/contact', (route) => route.fulfill({ status: 200, json: { ok: true, message: 'Réponse incomplète.' } }));
  await prepare(page);
  await submit(page).click();
  await expect(status(page)).toHaveAttribute('data-state', 'error');
  await expect(submit(page)).toBeEnabled();
  await expect(page.locator('#contact-message')).toHaveValue(message);
});

test('un email échoué n’annule pas une demande confirmée enregistrée', async ({ page }) => {
  await page.route('**/api/contact', (route) => route.fulfill({ status: 201, json: { ...response, notification: 'failed' } }));
  await prepare(page);
  await submit(page).click();
  await expect(status(page)).toHaveAttribute('data-state', 'success');
  await expect(status(page)).toHaveText('Votre demande est bien enregistrée.');
  await expect(status(page)).not.toContainText(/email envoyé/i);
});

test('une vraie panne du stockage local retourne 503 et conserve le formulaire', async ({ page }) => {
  await prepare(page);
  const resultPromise = page.waitForResponse((result) => result.url().endsWith('/api/contact') && result.request().method() === 'POST');
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
