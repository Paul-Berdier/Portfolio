import { gsap } from 'gsap';
import { ribbonCenterPath, ribbonFramePath, ribbonPath } from '../brand/ribbon.mjs';
import { getMotion } from '../config/motion';

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => {
  const p = clamp(n);
  return p * p * (3 - 2 * p);
};

export function initBrandAnimations() {
  const cleanup: (() => void)[] = [];
  document.querySelectorAll<HTMLElement>('[data-brand-animation]').forEach((host) => {
    const abort = new AbortController(),
      { signal } = abort;
    const engine = host.closest<HTMLElement>('[data-engine]');
    const paths = host.querySelectorAll<SVGPathElement>(
      '[data-ribbon-shape],[data-ribbon-shade],[data-ribbon-clip]',
    );
    const edge = host.querySelector<SVGPathElement>('[data-ribbon-edge]');
    const impulse = host.querySelector<SVGPathElement>('[data-brand-impulse]');
    const light = host.querySelector<SVGCircleElement>('[data-brand-light]');
    const name = host.querySelector<SVGGElement>('[data-brand-name]');
    const signature = host.querySelector<SVGGElement>('[data-brand-signature]');
    const slider = host.querySelector<HTMLInputElement>('[data-brand-progress]');
    const output = host.querySelector<HTMLOutputElement>('[data-brand-step]');
    const state = { progress: 1 };
    let tween: gsap.core.Tween | undefined;
    let visible = false,
      wantsPlay = false,
      started = false,
      disposed = false;
    const duration = host.dataset.brandAnimation === 'hero' ? 2.8 : 4.8;
    const draw = () => {
      const p = state.progress,
        formation = smooth((p - 0.12) / 0.48);
      const path = formation === 1 ? ribbonPath : ribbonFramePath(formation);
      paths.forEach((node) => node.setAttribute('d', path));
      edge?.setAttribute('opacity', formation === 1 ? '1' : '0');
      const impulseOpacity = clamp(p / 0.045) * (1 - smooth((p - 0.18) / 0.2));
      impulse?.setAttribute('opacity', String(impulseOpacity));
      impulse?.setAttribute('stroke-dasharray', '1');
      impulse?.setAttribute('stroke-dashoffset', String(1 - clamp(p / 0.24)));
      if (impulse && light && impulseOpacity > 0) {
        impulse.setAttribute('d', ribbonCenterPath(formation));
        const tip = impulse.getPointAtLength(impulse.getTotalLength() * clamp(p / 0.24));
        light.setAttribute('cx', String(tip.x));
        light.setAttribute('cy', String(tip.y));
      }
      light?.setAttribute('opacity', String(impulseOpacity));
      name?.setAttribute('opacity', String(smooth((p - 0.62) / 0.16)));
      signature?.setAttribute('opacity', String(smooth((p - 0.8) / 0.13)));
      host.dataset.brandProgressValue = p.toFixed(4);
      host.dataset.brandFormation = formation.toFixed(4);
      if (slider) slider.value = String(p);
      const label =
        p < 0.18
          ? 'Impulsion'
          : p < 0.6
            ? 'Transformation'
            : p < 0.7
              ? 'Stabilisation'
              : p < 0.88
                ? 'Révélation'
                : 'Logo final';
      if (output && output.textContent !== label) output.textContent = label;
      engine?.dispatchEvent(
        new CustomEvent('engine:progress', { detail: { formation, light: p } }),
      );
    };
    const sync = () => {
      if (!tween || disposed) return;
      if (wantsPlay && visible && !document.hidden) {
        tween.resume();
        host.dataset.brandState = 'playing';
      } else {
        tween.pause();
        host.dataset.brandState = state.progress === 1 ? 'complete' : 'paused';
      }
    };
    const play = (restart = false) => {
      tween?.kill();
      if (getMotion() !== 'auto') {
        state.progress = 1;
        draw();
        host.dataset.brandState = 'complete';
        return;
      }
      if (engine && engine.dataset.state !== 'brand')
        engine.querySelector<HTMLButtonElement>('[data-engine-mode="brand"]')?.click();
      if (restart || state.progress >= 1) state.progress = 0;
      draw();
      wantsPlay = true;
      tween = gsap.to(state, {
        progress: 1,
        duration: duration * (1 - state.progress),
        ease: 'none',
        paused: true,
        onUpdate: draw,
        onComplete: () => {
          wantsPlay = false;
          host.dataset.brandState = 'complete';
        },
      });
      sync();
    };
    const pause = () => {
      wantsPlay = false;
      sync();
    };
    const finalize = () => {
      tween?.kill();
      wantsPlay = false;
      state.progress = 1;
      draw();
      host.dataset.brandState = 'complete';
    };
    host.querySelectorAll<HTMLButtonElement>('[data-brand-action]').forEach((button) =>
      button.addEventListener(
        'click',
        () => {
          if (button.dataset.brandAction === 'pause') pause();
          else play(button.dataset.brandAction === 'replay');
        },
        { signal },
      ),
    );
    slider?.addEventListener(
      'input',
      () => {
        tween?.kill();
        wantsPlay = false;
        state.progress = getMotion() === 'auto' ? clamp(Number(slider.value)) : 1;
        draw();
        host.dataset.brandState = state.progress === 1 ? 'complete' : 'paused';
      },
      { signal },
    );
    engine?.addEventListener('engine:mode', finalize, { signal });
    document.addEventListener('visibilitychange', sync, { signal });
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        if (
          visible &&
          !started &&
          host.dataset.brandAnimation === 'hero' &&
          getMotion() === 'auto'
        ) {
          started = true;
          play(true);
        } else sync();
      },
      { threshold: 0.12 },
    );
    observer.observe(host);
    draw();
    host.dataset.brandReady = 'true';
    cleanup.push(() => {
      disposed = true;
      tween?.kill();
      observer.disconnect();
      abort.abort();
      state.progress = 1;
      draw();
      delete host.dataset.brandReady;
    });
  });
  return () => cleanup.forEach((dispose) => dispose());
}
