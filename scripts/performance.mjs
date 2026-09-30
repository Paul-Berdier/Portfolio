import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const url = process.env.PREVIEW_URL || 'http://127.0.0.1:4322';
await mkdir('test-results/performance', { recursive: true });
const summaries = [];
for (const formFactor of ['desktop', 'mobile'])
  for (const reduced of [false, true]) {
    const name = `${formFactor}-${reduced ? 'reduced' : 'auto'}`;
    const chrome = await launch({
      chromeFlags: [
        '--headless=new',
        '--no-first-run',
        ...(reduced ? ['--force-prefers-reduced-motion=reduce'] : []),
      ],
    });
    try {
      const result = await lighthouse(url, {
        port: chrome.port,
        output: 'json',
        logLevel: 'error',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        formFactor,
        screenEmulation:
          formFactor === 'desktop'
            ? { mobile: false, width: 1440, height: 1000, deviceScaleFactor: 1, disabled: false }
            : { mobile: true, width: 390, height: 844, deviceScaleFactor: 2, disabled: false },
        ...(formFactor === 'desktop'
          ? {
              throttling: {
                rttMs: 40,
                throughputKbps: 10240,
                cpuSlowdownMultiplier: 1,
                requestLatencyMs: 0,
                downloadThroughputKbps: 0,
                uploadThroughputKbps: 0,
              },
            }
          : {}),
      });
      if (!result) throw new Error('LIGHTHOUSE_NO_RESULT');
      await writeFile(`test-results/performance/${name}.json`, JSON.stringify(result.lhr, null, 2));
      const audits = result.lhr.audits;
      const auditedScreenshot = audits['final-screenshot']?.details?.data;
      if (auditedScreenshot?.startsWith('data:image/jpeg;base64,')) {
        await writeFile(
          `test-results/performance/${name}-audit.jpg`,
          Buffer.from(auditedScreenshot.split(',')[1], 'base64'),
        );
      }
      const connection = await chromium.connectOverCDP(`http://127.0.0.1:${chrome.port}`);
      // Lighthouse may close its audited target. Verify the exact same mode in a fresh tab after the timed audit.
      const context = connection.contexts()[0];
      const page = await context.newPage();
      await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
      await page.setViewportSize(
        formFactor === 'desktop' ? { width: 1440, height: 1000 } : { width: 390, height: 844 },
      );
      await page.goto(url, { waitUntil: 'networkidle' });
      if (!reduced)
        await page.locator('[data-engine][data-ready="true"]').waitFor({ timeout: 15000 });
      const scene = await page.evaluate(() => ({
        reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
        preference: document.documentElement.dataset.motion,
        canvas: document.querySelectorAll('[data-engine] canvas').length,
        ready: document.querySelector('[data-engine]')?.getAttribute('data-ready'),
      }));
      const summary = {
        name,
        scores: Object.fromEntries(
          Object.entries(result.lhr.categories).map(([key, value]) => [
            key,
            Math.round((value.score ?? 0) * 100),
          ]),
        ),
        lcpMs: audits['largest-contentful-paint']?.numericValue,
        cls: audits['cumulative-layout-shift']?.numericValue,
        tbtMs: audits['total-blocking-time']?.numericValue,
        transferBytes: audits['total-byte-weight']?.numericValue,
        engineRequests: (audits['network-requests']?.details?.items ?? [])
          .filter((request) => /\/engine\.[^/]+\.js/.test(request.url))
          .map((request) => ({ url: request.url, transferSize: request.transferSize })),
        scene,
      };
      summaries.push(summary);
      console.log(JSON.stringify(summary));
      await connection.close();
    } finally {
      chrome.kill();
    }
  }
await writeFile('test-results/performance/summary.json', JSON.stringify(summaries, null, 2));
