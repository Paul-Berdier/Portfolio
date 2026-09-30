import { expect, test } from '@playwright/test';

test.describe('Démonstrateurs locaux et réalisations', () => {
  test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

  test('le CSV modifié est réellement normalisé, filtré et réinitialisé', async ({ page }) => {
    await page.goto('/lab');
    await page.getByLabel('Votre jeu de données').fill('id;categorie;montant\na; web ;12,50\nb;DATA;50\nc;web;7,50\na;web;99\nd;data;incorrect');
    await page.getByRole('button', { name: 'Transformer' }).click();
    await expect(page.locator('[data-data-status]')).toContainText('5 lignes lues : 3 valides, 1 doublon(s), 1 anomalie(s)');
    await expect(page.locator('[data-chart-category="Web"] [data-chart-value]')).toHaveText('20 €');
    await expect(page.locator('[data-chart-category="Data"] [data-chart-value]')).toHaveText('50 €');
    await page.getByLabel('Catégorie', { exact: true }).selectOption('Data');
    await expect(page.locator('[data-data-status]')).toContainText('1 ligne(s) dans la vue actuelle');
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
    await expect(page.locator('[data-data-status]')).toContainText('dernière vue valide est conservée');
    await expect(page.locator('[data-data-rows] tr')).toHaveCount(6);
  });

  test('le workflow produit un vrai export et réévalue le scénario', async ({ page }) => {
    await page.goto('/lab#workflow');
    const run = page.getByRole('button', { name: 'Lancer le flux' });
    const download = page.getByRole('button', { name: 'Télécharger le JSON' });
    await expect(download).toBeDisabled();
    await run.click();
    await expect(page.locator('[data-workflow-status]')).toContainText('2 document(s) prêt(s), 1 à vérifier');
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
    expect(json.documents.filter((doc: { destination: string }) => doc.destination === 'À vérifier')).toHaveLength(1);
    await page.getByLabel('Utiliser un jeu entièrement valide').check();
    await expect(download).toBeDisabled();
    await run.click();
    await expect(page.locator('[data-workflow-status]')).toContainText('3 document(s) prêt(s), 0 à vérifier');
    await expect(page.locator('[data-workflow-results] tr')).toHaveCount(3);
  });

  test('les filtres montrent uniquement les projets publiés et un état vide IA', async ({ page }) => {
    await page.goto('/realisations');
    await expect(page.locator('[data-project-item]:visible')).toHaveCount(2);
    await page.getByRole('button', { name: 'Data', exact: true }).click();
    await expect(page.locator('[data-project-item]:visible')).toHaveCount(1);
    await expect(page.locator('[data-project-item]:visible')).toContainText('Des lignes. Une lecture claire.');
    await page.getByRole('button', { name: 'IA', exact: true }).click();
    await expect(page.locator('[data-project-item]:visible')).toHaveCount(0);
    await expect(page.locator('[data-project-empty]')).toBeVisible();
    await page.getByRole('button', { name: /Tout voir/ }).click();
    await expect(page.locator('[data-project-item]:visible')).toHaveCount(2);
    await expect(page.getByRole('button', { name: /Tout voir/ })).toHaveAttribute('aria-pressed', 'true');
  });

  test('le lab reste utilisable après plusieurs navigations internes', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
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
    await expect(page.locator('[data-chart-category="Data"] [data-chart-value]')).toHaveText('42 €');
    await expect(page.locator('[data-data-rows] tr')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Télécharger le JSON' })).toBeEnabled();
  });
});
