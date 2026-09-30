import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Every pose comes from the site's range control. No alternate animation or global debug API.
const baseURL = process.env.PREVIEW_URL || 'http://127.0.0.1:4322';
const directory = join('test-results', 'brand');
const flags = new Set(process.argv.slice(2));
const channel =
  process.env.PLAYWRIGHT_CHANNEL ||
  (process.platform === 'win32' &&
  existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
    ? 'chrome'
    : undefined);
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ channel });
const report = {
  date: new Date().toISOString(),
  url: baseURL,
  browser: browser.version(),
  captures: [],
  videos: [],
};

async function bounded(promise, milliseconds, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(label)), milliseconds);
    }),
  ]).finally(() => clearTimeout(timer));
}

async function setProgress(controller, value) {
  await controller.locator('[data-brand-action="pause"]').click();
  await controller.locator('input[data-brand-progress]').evaluate((element, next) => {
    element.value = String(next);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
  await controller.page().evaluate(() => new Promise(requestAnimationFrame));
}

async function validateVideo(path, width, height, name, mimeType = 'video/webm') {
  const page = await browser.newPage({ viewport: { width, height: Math.max(height, 1000) } });
  try {
    const bytes = await readFile(path);
    if (bytes.length < 1024) throw new Error('BRAND_VIDEO_EMPTY_OR_TRUNCATED');
    await page.setContent(
      '<style>body{margin:0;background:#081026}video{display:block}</style><video muted playsinline></video>',
    );
    const metadata = await page.locator('video').evaluate(
      async (video, source) => {
        if (!(video instanceof HTMLVideoElement)) throw new Error('VIDEO_ELEMENT_MISSING');
        const waitFor = (event, timeout = 20000) =>
          new Promise((resolve, reject) => {
            const timer = setTimeout(
              () => reject(new Error(`VIDEO_${event.toUpperCase()}_TIMEOUT`)),
              timeout,
            );
            video.addEventListener(
              event,
              () => {
                clearTimeout(timer);
                resolve();
              },
              { once: true },
            );
            video.addEventListener(
              'error',
              () => {
                clearTimeout(timer);
                reject(
                  new Error(`VIDEO_DECODE_FAILED: ${video.error?.message || video.error?.code}`),
                );
              },
              { once: true },
            );
          });
        const loaded = waitFor('loadeddata');
        video.src = source;
        await loaded;
        const ended = waitFor('ended');
        await video.play();
        await ended;
        const quality = video.getVideoPlaybackQuality();
        return {
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration,
          totalFrames: quality.totalVideoFrames,
          droppedFrames: quality.droppedVideoFrames,
          error: video.error?.message || null,
        };
      },
      `data:${mimeType};base64,${bytes.toString('base64')}`,
    );
    if (
      metadata.width !== width ||
      metadata.height !== height ||
      !Number.isFinite(metadata.duration) ||
      metadata.duration < 4.7 ||
      metadata.totalFrames < 2 ||
      metadata.error
    ) {
      throw new Error(`BRAND_VIDEO_VALIDATION_FAILED: ${JSON.stringify(metadata)}`);
    }
    const previewFrames = [];
    for (const time of [0.5, 2.5, 4.7]) {
      await page.locator('video').evaluate(
        (video, next) =>
          new Promise((resolve, reject) => {
            if (!(video instanceof HTMLVideoElement)) {
              reject(new Error('VIDEO_ELEMENT_MISSING'));
              return;
            }
            const timer = setTimeout(() => reject(new Error('VIDEO_SEEK_TIMEOUT')), 10000);
            video.addEventListener(
              'seeked',
              () => {
                clearTimeout(timer);
                resolve();
              },
              { once: true },
            );
            video.currentTime = next;
          }),
        time,
      );
      const framePath = join(directory, `${name}-decoded-${time.toFixed(1)}s.png`);
      await page.locator('video').screenshot({ path: framePath });
      previewFrames.push({ time, path: framePath });
    }
    return { ...metadata, bytes: bytes.length, previewFrames };
  } finally {
    await page.close();
  }
}

async function captureVideo(page, width, height, name) {
  await page.bringToFront();
  const result = await bounded(
    page.evaluate(
      async ({ width, height }) => {
        const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(
          (mime) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime),
        );
        if (!mimeType) return { skipped: 'MediaRecorder WebM indisponible dans ce navigateur.' };
        const controller = document.querySelector('[data-brand-animation="presentation"]');
        const art = controller?.querySelector('svg[data-brand-art]');
        const input = controller?.querySelector('input[data-brand-progress]');
        if (!art || !input) throw new Error('BRAND_ART_OR_PROGRESS_MISSING');
        controller.querySelector('[data-brand-action="pause"]').click();
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context || !canvas.captureStream) return { skipped: 'Capture canvas indisponible.' };
        // An attached, painted canvas avoids an unstarted capture source in headless Chrome.
        canvas.style.cssText =
          'position:fixed;right:0;bottom:0;width:320px;height:auto;z-index:2147483647;pointer-events:none';
        canvas.setAttribute('aria-hidden', 'true');
        document.body.append(canvas);
        const toDataURL = (blob) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        // SVG images have an isolated style context. Keep any real font files self-contained.
        let fonts = '';
        if (art.querySelector('text')) {
          for (const sheet of document.styleSheets) {
            let rules;
            try {
              rules = sheet.cssRules;
            } catch {
              continue;
            }
            for (const rule of rules) {
              if (!(rule instanceof CSSFontFaceRule)) continue;
              let css = rule.cssText;
              for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
                const response = await fetch(new URL(match[1], sheet.href || document.baseURI));
                if (!response.ok) throw new Error('BRAND_VIDEO_FONT_UNAVAILABLE');
                css = css.replace(match[0], `url("${await toDataURL(await response.blob())}")`);
              }
              fonts += css;
            }
          }
        }
        const properties = [
          'fill',
          'fill-opacity',
          'fill-rule',
          'stroke',
          'stroke-opacity',
          'stroke-width',
          'stroke-dasharray',
          'stroke-dashoffset',
          'stroke-linecap',
          'stroke-linejoin',
          'opacity',
          'visibility',
          'display',
          'font-family',
          'font-size',
          'font-weight',
          'letter-spacing',
          'text-anchor',
          'transform',
          'transform-origin',
          'transform-box',
          'stop-color',
          'stop-opacity',
        ];
        const serializeCurrentFrame = () => {
          const clone = art.cloneNode(true);
          const sourceNodes = [art, ...art.querySelectorAll('*')];
          const cloneNodes = [clone, ...clone.querySelectorAll('*')];
          sourceNodes.forEach((source, index) => {
            const style = getComputedStyle(source);
            for (const property of properties) {
              const value = style
                .getPropertyValue(property)
                .replace(/url\(["']?[^"')]*#([^"')]+)["']?\)/g, 'url(#$1)');
              cloneNodes[index].style.setProperty(property, value);
            }
          });
          clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
          const box = art.viewBox.baseVal;
          clone.setAttribute('width', String(box.width || art.clientWidth));
          clone.setAttribute('height', String(box.height || art.clientHeight));
          if (fonts) {
            const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
            style.textContent = fonts;
            clone.prepend(style);
          }
          return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
        };
        const image = new Image();
        const background =
          getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#081026';
        const afterPaint = () =>
          new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const drawFrame = async (value) => {
          input.value = String(value);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          image.src = serializeCurrentFrame();
          await image.decode();
          context.fillStyle = background;
          context.fillRect(0, 0, width, height);
          const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight) * 0.88;
          context.drawImage(
            image,
            (width - image.naturalWidth * scale) / 2,
            (height - image.naturalHeight * scale) / 2,
            image.naturalWidth * scale,
            image.naturalHeight * scale,
          );
        };
        await drawFrame(0);
        await afterPaint();
        console.info('[brand capture] source peinte, création du flux');
        const chunks = [];
        const stream = canvas.captureStream(0);
        const track = stream.getVideoTracks()[0];
        if (!track || typeof track.requestFrame !== 'function') {
          stream.getTracks().forEach((item) => item.stop());
          canvas.remove();
          return { skipped: 'Émission manuelle des images canvas indisponible.' };
        }
        const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5_000_000 });
        const complete = new Promise((resolve, reject) => {
          recorder.ondataavailable = (event) => {
            if (event.data.size) chunks.push(event.data);
          };
          recorder.onstop = resolve;
          recorder.onerror = reject;
        });
        const frameCount = 150;
        const durationMs = 5000;
        recorder.addEventListener('start', () => console.info('[brand capture] encodeur démarré'), {
          once: true,
        });
        const started = performance.now();
        try {
          recorder.start(250);
          // Keep supplying frames: `start` may depend on multiple encoder input frames.
          for (let frame = 0; frame <= frameCount; frame++) {
            await drawFrame(frame / frameCount);
            track.requestFrame();
            await new Promise(requestAnimationFrame);
            const remaining = started + ((frame + 1) * durationMs) / frameCount - performance.now();
            if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
          }
          console.info('[brand capture] images émises, finalisation');
          await afterPaint();
          recorder.requestData();
          recorder.stop();
          await complete;
          const dataURL = await toDataURL(new Blob(chunks, { type: mimeType }));
          return {
            mimeType,
            width,
            height,
            framesRequested: frameCount + 1,
            elapsedMs: Math.round(performance.now() - started),
            base64: dataURL.slice(dataURL.indexOf(',') + 1),
            source:
              'SVG courant du contrôleur réel, progression 0..1, polices intégrées si présentes',
          };
        } finally {
          if (recorder.state !== 'inactive') recorder.stop();
          stream.getTracks().forEach((track) => track.stop());
          canvas.remove();
        }
      },
      { width, height },
    ),
    25000,
    'BRAND_VIDEO_CAPTURE_TIMEOUT',
  );
  if (result.skipped) {
    report.videos.push(result);
    return;
  }
  const path = join(directory, `${name}.webm`);
  await writeFile(path, Buffer.from(result.base64, 'base64'));
  const { base64: _encoded, ...metadata } = result;
  let validation;
  try {
    validation = await validateVideo(path, width, height, name);
  } catch (error) {
    report.videos.push({ path, status: 'failed', error: error.message });
    throw error;
  }
  report.videos.push({ ...metadata, path, status: 'validated', validation });
  if (flags.has('--mp4')) {
    const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
    const target = join(directory, `${name}.mp4`);
    const conversion = spawnSync(
      ffmpeg,
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-y',
        '-i',
        path,
        '-an',
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        target,
      ],
      { encoding: 'utf8', windowsHide: true },
    );
    if (conversion.status === 0) {
      const convertedValidation = await validateVideo(
        target,
        width,
        height,
        `${name}-mp4`,
        'video/mp4',
      );
      report.videos.push({
        path: target,
        codec: 'H.264',
        source: path,
        status: 'validated',
        validation: convertedValidation,
      });
    } else
      report.videos.push({
        skipped: 'Conversion MP4 non effectuée : FFmpeg/libx264 requis.',
        detail: conversion.error?.message || conversion.stderr?.trim(),
      });
  }
}

try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    locale: 'fr-FR',
    reducedMotion: 'no-preference',
  });
  page.on('console', (message) => {
    if (message.text().startsWith('[brand capture]')) console.log(message.text());
  });
  await page.goto(new URL('/dev/brand', baseURL).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const controller = page.locator('[data-brand-animation="presentation"]').first();
  await controller.scrollIntoViewIfNeeded();
  await controller.locator('[data-brand-stage]').waitFor();
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-brand-animation="presentation"]')
        ?.getAttribute('data-brand-ready') === 'true',
  );
  for (const [name, value] of [
    ['impulsion', 0.08],
    ['transformation', 0.38],
    ['stabilisation', 0.68],
    ['final', 1],
  ]) {
    await setProgress(controller, value);
    const path = join(directory, `presentation-${name}.png`);
    await controller.locator('[data-brand-stage]').screenshot({ path, animations: 'allow' });
    report.captures.push({ path, progress: value });
  }
  if (flags.has('--video') || flags.has('--mp4')) {
    await captureVideo(page, 1280, 720, 'presentation-horizontal');
    if (flags.has('--square')) await captureVideo(page, 900, 900, 'presentation-square');
  }
  await page.close();
  for (const width of [360, 390, 768, 1440, 1920]) {
    const view = await browser.newPage({
      viewport: { width, height: width < 768 ? 844 : 1000 },
      reducedMotion: 'reduce',
      locale: 'fr-FR',
    });
    await view.goto(baseURL, { waitUntil: 'networkidle' });
    await view.evaluate(() => document.fonts.ready);
    const path = join(directory, `home-reduced-${width}.png`);
    await view.screenshot({ path, fullPage: true });
    report.captures.push({ path, width, motion: 'reduced' });
    await view.close();
  }
  for (const width of [390, 1440]) {
    const view = await browser.newPage({
      viewport: { width, height: width < 768 ? 844 : 1000 },
      reducedMotion: 'no-preference',
      locale: 'fr-FR',
    });
    const errors = [];
    view.on('pageerror', (error) => errors.push(error.message));
    await view.goto(baseURL, { waitUntil: 'networkidle' });
    await view.locator('.morph-engine[data-ready="true"]').waitFor({ timeout: 30000 });
    await view.waitForTimeout(3200);
    const path = join(directory, `home-auto-${width}.png`);
    await view.screenshot({ path });
    report.captures.push({
      path,
      width,
      motion: 'auto',
      canvas: await view.locator('.morph-engine canvas').count(),
      errors,
    });
    await view.close();
  }
} finally {
  await browser.close();
  await writeFile(join(directory, 'capture-report.json'), JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report, null, 2));
