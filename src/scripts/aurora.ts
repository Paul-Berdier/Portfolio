import { gsap } from 'gsap';
import { AURORA, auroraParticle, auroraVeil } from '../brand/aurora';
import { getMotion } from '../config/motion';

/** Page-scoped ambience: no new canvas, dependency, network request or global FPS change. */
export function initAuroras(): () => void {
  const cleanups: (() => void)[] = [];
  document.querySelectorAll<HTMLElement>('[data-aurora]').forEach((host) => {
    const animation = host.closest<HTMLElement>('[data-brand-animation]');
    if (!animation) return;
    const engine = host.closest<HTMLElement>('.morph-engine[data-engine]');
    const button = animation.querySelector<HTMLButtonElement>('[data-aurora-toggle]');
    const veils = Array.from(host.querySelectorAll<SVGPathElement>('[data-aurora-veil]'));
    const edges = Array.from(host.querySelectorAll<SVGPathElement>('[data-aurora-edge]'));
    const particles = Array.from(host.querySelectorAll<SVGCircleElement>('[data-aurora-particle]'));
    const abort = new AbortController();
    const { signal } = abort;
    const mobile = matchMedia('(max-width: 760px)');
    let disposed = false;
    let visible = false;
    let attached = false;
    let paused = false;
    let elapsed = 0;
    let pending = 0;

    const draw = () => {
      veils.forEach((path, index) => {
        const shape = auroraVeil(elapsed, index);
        path.setAttribute('d', shape.fill);
        edges[index]?.setAttribute('d', shape.edge);
      });
      const count = mobile.matches ? AURORA.mobileParticles : AURORA.desktopParticles;
      particles.slice(0, count).forEach((particle, index) => {
        const point = auroraParticle(index, elapsed);
        particle.setAttribute('transform', `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`);
        particle.setAttribute('opacity', point.opacity.toFixed(3));
      });
    };
    const tick = (_time: number, delta: number) => {
      if (disposed || !attached) return;
      const step = Math.min(Math.max(delta, 0), 64) / 1000;
      elapsed += step;
      pending += step;
      if (pending < 1 / (mobile.matches ? AURORA.mobileFps : AURORA.desktopFps)) return;
      pending = 0;
      draw();
    };
    const stop = () => {
      if (attached) gsap.ticker.remove(tick);
      attached = false;
      pending = 0;
    };
    const sync = () => {
      if (disposed) return;
      const motion = getMotion();
      const allowed = motion === 'auto';
      const brandVisible = !engine || engine.dataset.state === 'brand';
      const timelinePaused = animation.dataset.brandState === 'paused';
      if (button) {
        button.hidden = !allowed;
        button.setAttribute('aria-pressed', String(paused));
        const pauseLabel = button.querySelector<HTMLElement>('[data-aurora-pause-label]');
        const resumeLabel = button.querySelector<HTMLElement>('[data-aurora-resume-label]');
        if (pauseLabel) pauseLabel.hidden = paused;
        if (resumeLabel) resumeLabel.hidden = !paused;
      }
      if (!allowed) {
        stop();
        elapsed = 0;
        draw();
        host.dataset.auroraState = motion;
      } else if (!visible || document.hidden || paused || timelinePaused || !brandVisible) {
        stop();
        host.dataset.auroraState = 'paused';
      } else {
        if (!attached) {
          attached = true;
          gsap.ticker.add(tick);
        }
        host.dataset.auroraState = 'running';
      }
    };
    button?.addEventListener('click', () => { paused = !paused; sync(); }, { signal });
    document.addEventListener('visibilitychange', sync, { signal });
    mobile.addEventListener('change', sync, { signal });
    const visibility = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      sync();
    }, { threshold: 0.08 });
    visibility.observe(animation.querySelector('[data-brand-stage]') ?? animation);
    const state = new MutationObserver(sync);
    state.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
    state.observe(animation, { attributes: true, attributeFilter: ['data-brand-state'] });
    if (engine) state.observe(engine, { attributes: true, attributeFilter: ['data-state'] });
    draw();
    sync();
    host.dataset.auroraReady = 'true';
    cleanups.push(() => {
      disposed = true;
      stop();
      abort.abort();
      visibility.disconnect();
      state.disconnect();
      if (button) button.hidden = true;
      delete host.dataset.auroraReady;
      host.dataset.auroraState = 'disposed';
    });
  });
  return () => cleanups.reverse().forEach((cleanup) => cleanup());
}
