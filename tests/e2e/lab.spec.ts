import { expect, test } from '@playwright/test';

test.describe('Démonstrateurs locaux et réalisations', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('le CSV modifié est réellement normalisé, filtré et réinitialisé', async ({ page }) => {
    await page.goto('/lab');
    await page
      .getByLabel('Votre jeu de données')
      .fill(
        'id;categorie;montant\na; web ;12,50\nb;DATA;50\nc;web;7,50\na;web;99\nd;data;incorrect',
      );
    await page.getByRole('button', { name: 'Transformer' }).click();
    await expect(page.locator('[data-data-status]')).toContainText(
      '5 lignes lues : 3 valides, 1 doublon(s), 1 anomalie(s)',
    );
    await expect(page.locator('[data-chart-category="Web"] [data-chart-value]')).toHaveText('20 €');
    await expect(page.locator('[data-chart-category="Data"] [data-chart-value]')).toHaveText(
      '50 €',
    );
    await page.getByLabel('Catégorie', { exact: true }).selectOption('Data');
    await expect(page.locator('[data-data-status]')).toContainText(
      '1 ligne(s) dans la vue actuelle',
    );
    await expect(page.locator('[data-data-rows] tr')).toHaveCount(1);
    await expect(page.locator('[data-chart-category="Web"] [data-chart-value]')).toHaveText('0 €');
    await page.getByRole('button', { name: 'Réinitialiser', exact: true }).click();
    await expect(page.locator('[data-stat-valid]')).toHaveText('6');
    await expect(page.locator('[data-data-rows] tr')).toHaveCount(6);
  });

  test('une erreur CSV préserve la dernière vue et le contenu saisi', async ({ page }) => {
    await page.goto('/lab');
    const input = page.getByLabel('Votre jeu de données');
    await input.fill('un;en-tete;invalide');
    await page.getByRole('button', { name: 'Transformer' }).click();
    await expect(input).toHaveValue('un;en-tete;invalide');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('[data-data-status]')).toContainText(
      'dernière vue valide est conservée',
    );
    await expect(page.locator('[data-data-rows] tr')).toHaveCount(6);
  });

  test('le workflow produit un vrai export et réévalue le scénario', async ({ page }) => {
    await page.goto('/lab#workflow');
    const run = page.getByRole('button', { name: 'Lancer le flux' });
    const download = page.getByRole('button', { name: 'Télécharger le JSON' });
    await expect(download).toBeDisabled();
    await run.click();
    await expect(page.locator('[data-workflow-status]')).toContainText(
      '2 document(s) prêt(s), 1 à vérifier',
    );
    await expect(page.locator('[data-workflow-step][data-state="done"]')).toHaveCount(4);
    const downloading = page.waitForEvent('download');
    await download.click();
    const file = await downloading;
    expect(file.suggestedFilename()).toBe('demonstrateur-documents.json');
    const stream = await file.createReadStream();
    const chunks: Buffer[] = [];
    if (!stream) throw new Error('Le fichier téléchargé doit être lisible.');
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const json = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    expect(json.synthetic).toBe(true);
    expect(json.processing).toBe('local-browser');
    expect(
      json.documents.filter((doc: { destination: string }) => doc.destination === 'À vérifier'),
    ).toHaveLength(1);
    await page.getByLabel('Utiliser un jeu entièrement valide').check();
    await expect(download).toBeDisabled();
    await run.click();
    await expect(page.locator('[data-workflow-status]')).toContainText(
      '3 document(s) prêt(s), 0 à vérifier',
    );
    await expect(page.locator('[data-workflow-results] tr')).toHaveCount(3);
  });

  test('les filtres montrent uniquement les projets publiés et un état vide IA', async ({
    page,
  }) => {
    await page.goto('/realisations');
    await expect(page.locator('[data-project-item]:visible')).toHaveCount(2);
    await page.getByRole('button', { name: 'Data', exact: true }).click();
    await expect(page.locator('[data-project-item]:visible')).toHaveCount(1);
    await expect(page.locator('[data-project-item]:visible')).toContainText(
      'Des lignes. Une lecture claire.',
    );
    await page.getByRole('button', { name: 'IA', exact: true }).click();
    await expect(page.locator('[data-project-item]:visible')).toHaveCount(0);
    await expect(page.locator('[data-project-empty]')).toBeVisible();
    await page.getByRole('button', { name: /Tout voir/ }).click();
    await expect(page.locator('[data-project-item]:visible')).toHaveCount(2);
    await expect(page.getByRole('button', { name: /Tout voir/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('le lab reste utilisable après plusieurs navigations internes', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/lab');
    for (let index = 0; index < 3; index++) {
      await page.locator('a[href="/realisations/atelier-data"]').click();
      await expect(page).toHaveURL(/\/realisations\/atelier-data$/);
      await page.getByRole('link', { name: 'Tester le démonstrateur' }).click();
      await expect(page).toHaveURL(/\/lab#data$/);
      await page.getByRole('button', { name: 'Transformer' }).click();
      await expect(page.locator('[data-data-status]')).toContainText('9 lignes lues : 6 valides');
    }
    expect(errors).toEqual([]);
  });

  test('un changement de mouvement conserve les résultats déjà calculés', async ({ page }) => {
    await page.goto('/lab');
    await page.getByLabel('Votre jeu de données').fill('id;categorie;montant\na;data;42');
    await page.getByRole('button', { name: 'Transformer' }).click();
    await page.getByRole('button', { name: 'Lancer le flux' }).click();
    await expect(page.locator('[data-workflow-status]')).toContainText('Traitement terminé');
    await page.locator('#motion-preference').selectOption('off');
    await page.getByLabel('Catégorie', { exact: true }).selectOption('Data');
    await expect(page.locator('[data-chart-category="Data"] [data-chart-value]')).toHaveText(
      '42 €',
    );
    await expect(page.locator('[data-data-rows] tr')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Télécharger le JSON' })).toBeEnabled();
  });
});

const translatedLabs = [
  {
    locale: 'en',
    input: 'Your dataset',
    transform: 'Transform',
    category: 'Category',
    reset: 'Reset',
    pending: 'Source changed.',
    result: '5 rows read: 3 valid, 1 duplicate(s), 1 invalid.',
    headerError: 'The first line must be exactly:',
    preserved: 'The last valid view has been kept.',
    view: '1 row(s) in the current view',
    initial: 'The sample has 9 rows, with 6 accepted.',
    run: 'Run the workflow',
    download: 'Download the JSON',
    completed: '2 document(s) ready, 1 needing review',
    valid: 'Use a fully valid dataset',
    allReady: '3 document(s) ready, 0 needing review',
    filename: 'document-workflow-demo.json',
    review: 'Needs review',
    reason: 'Unsupported type, or reference / amount needs review.',
    noScript: 'Enable JavaScript to edit the data',
    caseHref: '/en/work/data-workbench',
  },
  {
    locale: 'es',
    input: 'Tu conjunto de datos',
    transform: 'Transformar',
    category: 'Categoría',
    reset: 'Restablecer',
    pending: 'Datos modificados.',
    result: '5 filas leídas: 3 válidas, 1 duplicada, 1 no válida.',
    headerError: 'La primera línea debe ser exactamente:',
    preserved: 'Se conserva la última vista válida.',
    view: '1 fila en la vista actual',
    initial: 'El ejemplo contiene 9 filas, de las que se aceptan 6.',
    run: 'Ejecutar el flujo',
    download: 'Descargar el JSON',
    completed: '2 documento(s) listo(s), 1 por revisar',
    valid: 'Usar un conjunto de datos completamente válido',
    allReady: '3 documento(s) listo(s), 0 por revisar',
    filename: 'demo-flujo-documentos.json',
    review: 'Requiere revisión',
    reason: 'Tipo no admitido, o referencia / importe que requiere revisión.',
    noScript: 'Activa JavaScript para modificar los datos',
    caseHref: '/es/proyectos/taller-de-datos',
  },
] as const;

for (const copy of translatedLabs) {
  test(`le lab ${copy.locale} calcule, signale les erreurs et exporte dans sa langue sans réseau`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/${copy.locale}/lab`, { waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveAttribute('lang', copy.locale);
    const requests: string[] = [];
    page.on('request', (request) => {
      if (['fetch', 'xhr'].includes(request.resourceType())) requests.push(request.url());
    });
    const input = page.getByLabel(copy.input, { exact: true });
    const transform = page.getByRole('button', { name: copy.transform, exact: false });
    await input.fill(
      'id;categorie;montant\na;web;12,50\nb;DATA;50\nc;web;7,50\na;web;99\nd;data;incorrect',
    );
    await expect(page.locator('[data-data-status]')).toContainText(copy.pending);
    await transform.click();
    await expect(page.locator('[data-data-status]')).toContainText(copy.result);
    await expect(page.locator('[data-chart-category="Web"] [data-chart-value]')).toHaveText('20 €');
    await page.getByLabel(copy.category, { exact: true }).selectOption('Data');
    await expect(page.locator('[data-data-status]')).toContainText(copy.view);
    await expect(page.locator('[data-data-rows] tr')).toHaveCount(1);
    await input.fill('invalid;header');
    await transform.click();
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('[data-data-status]')).toContainText(copy.headerError);
    await expect(page.locator('[data-data-status]')).toContainText(copy.preserved);
    await expect(page.locator('[data-data-rows] tr')).toHaveCount(1);
    await page.getByRole('button', { name: copy.reset, exact: true }).click();
    await expect(page.locator('[data-stat-valid]')).toHaveText('6');
    await expect(page.locator('[data-data-rows] tr')).toHaveCount(6);
    await expect(page.locator(`main a[href="${copy.caseHref}"]`)).toHaveCount(1);

    await page.getByRole('button', { name: copy.run }).click();
    await expect(page.locator('[data-workflow-status]')).toContainText(copy.completed);
    await expect(page.locator('[data-workflow-results]')).toContainText(copy.review);
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: copy.download }).click();
    const file = await downloading;
    expect(file.suggestedFilename()).toBe(copy.filename);
    const stream = await file.createReadStream();
    if (!stream) throw new Error('The exported JSON must be readable.');
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const json = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    expect(json.synthetic).toBe(true);
    expect(json.processing).toBe('local-browser');
    expect(json.documents[2]).toMatchObject({
      id: 'DOC-003',
      name: 'note-003.pdf',
      kind: 'note',
      amount: 125,
      reference: '',
      destination: copy.review,
      reason: copy.reason,
    });
    await page.getByLabel(copy.valid).check();
    await expect(page.getByRole('button', { name: copy.download })).toBeDisabled();
    await page.getByRole('button', { name: copy.run }).click();
    await expect(page.locator('[data-workflow-status]')).toContainText(copy.allReady);
    expect(requests).toEqual([]);
  });

  test(`le lab ${copy.locale} conserve ses explications et résultats sans JavaScript à 360 px`, async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      javaScriptEnabled: false,
      viewport: { width: 360, height: 844 },
    });
    try {
      const page = await context.newPage();
      await page.goto(`/${copy.locale}/lab`);
      await expect(page.locator('main noscript')).toContainText(copy.noScript);
      await expect(page.locator('[data-data-status]')).toContainText(copy.initial);
      await expect(page.locator('[data-data-rows] tr')).toHaveCount(6);
      await expect(page.getByRole('button', { name: copy.transform })).toBeDisabled();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBe(true);
    } finally {
      await context.close();
    }
  });
}

test('les messages du lab suivent les navigations FR, EN, ES puis FR', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/lab');
  for (const [path, language, expected] of [
    ['/en/lab', 'en', '9 rows read: 6 valid'],
    ['/es/lab', 'es', '9 filas leídas: 6 válidas'],
    ['/lab', 'fr', '9 lignes lues : 6 valides'],
  ]) {
    await page.locator(`a[hreflang="${language}"][href="${path}"]`).first().click();
    await expect(page.locator('html')).toHaveAttribute('lang', language!);
    await page.locator('[data-normalize]').click();
    await expect(page.locator('[data-data-status]')).toContainText(expected!);
  }
});
