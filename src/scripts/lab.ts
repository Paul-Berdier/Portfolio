import {
  normalizeCsv,
  sampleCsv,
  summarizeRows,
  formatAmount,
  sampleDocuments,
  routeDocuments,
} from '../content/lab';
import type { DataResult, DataRow, RoutedDocument } from '../content/lab';
import type { Locale } from '../i18n';
import { getLabMessages, labCategoryLabel } from '../i18n/lab';

// Le changement de préférence de mouvement réinitialise les listeners, pas les résultats.
const dataResults = new WeakMap<HTMLElement, DataResult>();
const workflowOutputs = new WeakMap<HTMLElement, RoutedDocument[]>();

export function initLab(): () => void {
  // Astro can swap language without reloading this module.
  const language = document.documentElement.lang;
  const locale: Locale = language === 'en' || language === 'es' ? language : 'fr';
  const messages = getLabMessages(locale);
  const categoryLabel = (category: string) => labCategoryLabel(category, locale);
  const amount = (value: number) => formatAmount(value, locale);
  const controller = new AbortController();
  const { signal } = controller;
  let disposed = false;
  const timerIds = new Set<ReturnType<typeof setTimeout>>();
  const waits = new Set<() => void>();
  const urls = new Set<string>();
  const dataRoot = document.querySelector<HTMLElement>('[data-data-lab]');

  const renderTable = (body: HTMLTableSectionElement | null, rows: string[][]) => {
    if (!body) return;
    const fragment = document.createDocumentFragment();
    for (const row of rows) {
      const tr = document.createElement('tr');
      for (const cell of row) {
        const td = document.createElement('td');
        td.textContent = cell;
        tr.append(td);
      }
      fragment.append(tr);
    }
    body.replaceChildren(fragment);
  };

  if (dataRoot) {
    const form = dataRoot.querySelector<HTMLFormElement>('[data-data-form]');
    const input = dataRoot.querySelector<HTMLTextAreaElement>('[data-csv-input]');
    const filter = dataRoot.querySelector<HTMLSelectElement>('[data-data-filter]');
    const status = dataRoot.querySelector<HTMLElement>('[data-data-status]');
    const reset = dataRoot.querySelector<HTMLButtonElement>('[data-reset-csv]');
    let result: DataResult = dataResults.get(dataRoot) ?? normalizeCsv(sampleCsv, locale);
    dataRoot
      .querySelectorAll<HTMLButtonElement | HTMLSelectElement>('button,select')
      .forEach((control) => {
        control.disabled = false;
      });
    const setStat = (selector: string, value: number) => {
      const el = dataRoot.querySelector(selector);
      if (el) el.textContent = String(value);
    };
    const showResult = () => {
      const category = filter?.value ?? 'all';
      const rows: DataRow[] = result.rows.filter(
        (row) => category === 'all' || row.category === category,
      );
      const summary = summarizeRows(rows);
      const maxAmount = Math.max(1, ...summary.map((item) => item.amount));
      setStat('[data-stat-valid]', result.rows.length);
      setStat('[data-stat-duplicate]', result.duplicateCount);
      setStat('[data-stat-invalid]', result.invalidCount);
      for (const item of summary) {
        const chartRow = [...dataRoot.querySelectorAll<HTMLElement>('[data-chart-category]')].find(
          (row) => row.dataset.chartCategory === item.category,
        );
        const bar = chartRow?.querySelector<HTMLElement>('[data-chart-bar]');
        const value = chartRow?.querySelector<HTMLElement>('[data-chart-value]');
        if (bar) bar.style.width = `${(item.amount / maxAmount) * 100}%`;
        if (value) value.textContent = `${amount(item.amount)} €`;
      }
      dataRoot
        .querySelector('[data-data-chart]')
        ?.setAttribute(
          'aria-label',
          `${messages.chartLabel} : ${summary.map((item) => `${categoryLabel(item.category)} : ${amount(item.amount)} euros`).join(', ')}`,
        );
      renderTable(
        dataRoot.querySelector('[data-data-rows]'),
        rows.map((row) => [row.id, categoryLabel(row.category), `${amount(row.amount)} €`]),
      );
      const issueList = dataRoot.querySelector('[data-data-issues]');
      if (issueList) {
        const issues = result.issues.length ? result.issues : [messages.noExcludedRows];
        issueList.replaceChildren(
          ...issues.map((message) => {
            const li = document.createElement('li');
            li.textContent = message;
            return li;
          }),
        );
      }
      if (status) {
        status.dataset.state = 'success';
        status.textContent = messages.dataStatus(
          result.inputCount,
          result.rows.length,
          result.duplicateCount,
          result.invalidCount,
          rows.length,
        );
      }
      input?.removeAttribute('aria-invalid');
    };
    form?.addEventListener(
      'submit',
      (event) => {
        event.preventDefault();
        try {
          result = normalizeCsv(input?.value ?? '', locale);
          dataResults.set(dataRoot, result);
          showResult();
        } catch (error) {
          if (status) {
            status.dataset.state = 'error';
            status.textContent = `${error instanceof Error ? error.message : messages.unreadableData} ${messages.viewPreserved}`;
          }
          input?.setAttribute('aria-invalid', 'true');
          input?.focus();
        }
      },
      { signal },
    );
    filter?.addEventListener('change', showResult, { signal });
    input?.addEventListener(
      'input',
      () => {
        if (status) {
          status.dataset.state = 'pending';
          status.textContent = messages.sourceChanged;
        }
      },
      { signal },
    );
    reset?.addEventListener(
      'click',
      () => {
        if (input) input.value = sampleCsv;
        if (filter) filter.value = 'all';
        result = normalizeCsv(sampleCsv, locale);
        dataResults.set(dataRoot, result);
        showResult();
      },
      { signal },
    );
  }

  const workflowRoot = document.querySelector<HTMLElement>('[data-workflow-lab]');
  if (workflowRoot) {
    const run = workflowRoot.querySelector<HTMLButtonElement>('[data-run-workflow]');
    const download = workflowRoot.querySelector<HTMLButtonElement>('[data-download-workflow]');
    const valid = workflowRoot.querySelector<HTMLInputElement>('[data-workflow-valid]');
    const status = workflowRoot.querySelector<HTMLElement>('[data-workflow-status]');
    const steps = [...workflowRoot.querySelectorAll<HTMLElement>('[data-workflow-step]')];
    const body = workflowRoot.querySelector<HTMLTableSectionElement>('[data-workflow-results]');
    let output: RoutedDocument[] | null = workflowOutputs.get(workflowRoot) ?? null;
    let running = false;
    if (run) {
      run.disabled = false;
      run.removeAttribute('aria-busy');
    }
    if (valid) valid.disabled = false;
    if (download) download.disabled = !output;
    if (steps.some((step) => step.dataset.state === 'active')) {
      steps.forEach((step) => {
        delete step.dataset.state;
        const label = step.querySelector('[data-step-state]');
        if (label) label.textContent = messages.idle;
      });
      if (status) status.textContent = messages.interrupted;
    }
    const pause = () =>
      new Promise<void>((resolve) => {
        if (document.documentElement.dataset.motion !== 'auto' || document.hidden) {
          resolve();
          return;
        }
        const done = () => {
          waits.delete(done);
          resolve();
        };
        const id = setTimeout(() => {
          timerIds.delete(id);
          done();
        }, 420);
        timerIds.add(id);
        waits.add(done);
      });
    const resetOutput = () => {
      output = null;
      workflowOutputs.delete(workflowRoot);
      if (download) download.disabled = true;
      steps.forEach((step) => {
        delete step.dataset.state;
        const label = step.querySelector('[data-step-state]');
        if (label) label.textContent = messages.idle;
      });
      if (status) status.textContent = messages.configurationChanged;
      renderTable(
        body,
        sampleDocuments.map((doc) => [doc.name, `${amount(doc.amount)} €`, messages.pending]),
      );
    };
    valid?.addEventListener('change', resetOutput, { signal });
    run?.addEventListener(
      'click',
      async () => {
        if (running) return;
        running = true;
        output = null;
        run.disabled = true;
        workflowOutputs.delete(workflowRoot);
        run.setAttribute('aria-busy', 'true');
        if (download) download.disabled = true;
        if (valid) valid.disabled = true;
        const documents = sampleDocuments.map((doc) => ({ ...doc }));
        if (valid?.checked) {
          documents[2]!.reference = 'REF-003';
          documents[2]!.kind = 'commande';
        }
        steps.forEach((step) => {
          delete step.dataset.state;
          const label = step.querySelector('[data-step-state]');
          if (label) label.textContent = messages.idle;
        });
        for (const [index, step] of steps.entries()) {
          if (disposed) return;
          step.dataset.state = 'active';
          const label = step.querySelector('[data-step-state]');
          if (label) label.textContent = messages.running;
          if (status)
            status.textContent = messages.stepStatus(
              index + 1,
              steps.length,
              messages.steps[index]?.label ?? '',
            );
          if (index === 0)
            renderTable(
              body,
              documents.map((doc) => [doc.name, `${amount(doc.amount)} €`, messages.received]),
            );
          if (index === 1) {
            output = routeDocuments(documents, locale);
            renderTable(
              body,
              output.map((doc) => [doc.name, `${amount(doc.amount)} €`, doc.reason]),
            );
          }
          if (index === 2 && output)
            renderTable(
              body,
              output.map((doc) => [doc.name, `${amount(doc.amount)} €`, doc.destination]),
            );
          await pause();
          if (disposed) return;
          step.dataset.state = 'done';
          if (label) label.textContent = messages.done;
        }
        const ready = output?.filter((doc) => doc.destination === messages.ready).length ?? 0;
        if (output) workflowOutputs.set(workflowRoot, output);
        if (status) status.textContent = messages.completed(ready, documents.length - ready);
        if (download) download.disabled = false;
        run.disabled = false;
        run.removeAttribute('aria-busy');
        if (valid) valid.disabled = false;
        running = false;
      },
      { signal },
    );
    download?.addEventListener(
      'click',
      () => {
        if (!output) return;
        const blob = new Blob(
          [
            JSON.stringify(
              { synthetic: true, processing: 'local-browser', documents: output },
              null,
              2,
            ),
          ],
          { type: 'application/json;charset=utf-8' },
        );
        const url = URL.createObjectURL(blob);
        urls.add(url);
        const link = document.createElement('a');
        link.href = url;
        link.download = messages.downloadName;
        link.click();
        const id = setTimeout(() => {
          URL.revokeObjectURL(url);
          urls.delete(url);
          timerIds.delete(id);
        }, 1500);
        timerIds.add(id);
        if (status) status.textContent = messages.downloadRequested;
      },
      { signal },
    );
  }
  return () => {
    disposed = true;
    controller.abort();
    timerIds.forEach(clearTimeout);
    waits.forEach((resolve) => resolve());
    urls.forEach((url) => URL.revokeObjectURL(url));
  };
}
