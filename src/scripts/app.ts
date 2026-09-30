import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { motion, getMotion, type MotionPreference } from '../config/motion';
import { initLab } from './lab';
import { initProjects } from './projects';
import { initContact } from './contact';

gsap.registerPlugin(ScrollTrigger, SplitText);
let disposePage: (() => void) | undefined;
const media = matchMedia('(prefers-reduced-motion: reduce)');
function readPreference(): MotionPreference {
  try {
    const value = localStorage.getItem('motion-preference');
    return value === 'off' || value === 'reduced' ? value : 'auto';
  } catch {
    return 'auto';
  }
}
function applyPreference() {
  const preference = readPreference();
  document.documentElement.dataset.motion =
    preference === 'auto' && media.matches ? 'reduced' : preference;
}

function initialize() {
  disposePage?.();
  applyPreference();
  const cleanups: (() => void)[] = [];
  const controller = new AbortController();
  const { signal } = controller;
  let alive = true;
  const preference = document.querySelector<HTMLSelectElement>('#motion-preference');
  if (preference) {
    preference.value = readPreference();
    preference.addEventListener(
      'change',
      () => {
        try {
          localStorage.setItem('motion-preference', preference.value);
        } catch {}
        initialize();
      },
      { signal },
    );
  }
  const menu = document.querySelector<HTMLDialogElement>('#mobile-menu');
  const toggle = document.querySelector<HTMLButtonElement>('.menu-toggle');
  if (menu && toggle) {
    const close = () => {
      menu.close();
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus({ preventScroll: true });
    };
    toggle.addEventListener(
      'click',
      () => {
        menu.showModal();
        toggle.setAttribute('aria-expanded', 'true');
        if (getMotion() === 'auto')
          gsap.fromTo(
            menu.querySelectorAll('nav a'),
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.45, stagger: 0.045, clearProps: 'all' },
          );
      },
      { signal },
    );
    menu.querySelector('.menu-close')?.addEventListener('click', close, { signal });
    menu.addEventListener(
      'cancel',
      (e) => {
        e.preventDefault();
        close();
      },
      { signal },
    );
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', close, { signal }));
    cleanups.push(() => {
      gsap.killTweensOf(menu.querySelectorAll('nav a'));
      if (menu.open) menu.close();
    });
  }
  cleanups.push(initLab(), initProjects(), initContact());
  const engine = document.querySelector<HTMLElement>('[data-engine]');
  if (engine) {
    const captions: Record<string, string> = {
      web: 'Des fragments deviennent une interface. Un point d’entrée pour vos idées.',
      automation: 'Des modules se connectent. Les tâches trouvent leur chemin.',
      data: 'La matière s’ordonne. Vos données prennent une forme lisible.',
      ai: 'Des documents, des liens, des sources. L’information se met en relation.',
    };
    engine.querySelectorAll<HTMLButtonElement>('[data-engine-mode]').forEach((button, index) => {
      button.addEventListener(
        'click',
        () => {
          const mode = button.dataset.engineMode!;
          engine.dataset.state = mode;
          engine
            .querySelectorAll('button')
            .forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
          const caption = engine.querySelector('[data-engine-caption]');
          if (caption) caption.textContent = captions[mode]!;
          const number = engine.querySelector('[data-engine-number]');
          if (number) number.textContent = `0${index + 1}`;
          engine.dispatchEvent(new CustomEvent('engine:mode', { detail: mode }));
        },
        { signal },
      );
    });
    if (getMotion() === 'auto') {
      import('./engine')
        .then(({ createEngine }) => {
          if (alive && getMotion() === 'auto') {
            try {
              cleanups.push(createEngine(engine));
              engine.dispatchEvent(
                new CustomEvent('engine:mode', { detail: engine.dataset.state }),
              );
            } catch {
              engine.dataset.fallback = 'unavailable';
            }
          }
        })
        .catch(() => {
          engine.dataset.fallback = 'unavailable';
        });
    }
  }
  if (getMotion() === 'auto') {
    const splits: SplitText[] = [];
    // Keep off-screen text untouched until it is needed. One observer replaces
    // eager line measurement and dozens of ScrollTrigger refreshes on startup.
    const pending = new Map<Element, () => void>();
    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || !alive) continue;
          const animate = pending.get(entry.target);
          if (!animate) continue;
          revealObserver.unobserve(entry.target);
          pending.delete(entry.target);
          context.add(animate);
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    const onEnter = (element: Element, animate: () => void) => {
      pending.set(element, animate);
      revealObserver.observe(element);
    };
    const context = gsap.context(() => {
      gsap.from('.brand .mark-piece', {
        x: (i) => (i ? -5 : 5),
        y: (i) => (i ? -8 : 8),
        opacity: 0.3,
        duration: 0.8,
        stagger: 0.1,
        ease: motion.ease,
      });
      const heroArt = document.querySelector('.hero-art');
      if (heroArt) gsap.from(heroArt, { opacity: 0.45, duration: 1.1, ease: 'power2.out' });
      const underline = document.querySelector('.hero-emphasis svg path');
      if (underline)
        gsap.from(underline, {
          strokeDasharray: 520,
          strokeDashoffset: 520,
          duration: 1.1,
          delay: 0.25,
          ease: 'power2.inOut',
        });
      document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element) => {
        onEnter(element, () => {
          if (/^H[2-4]$/.test(element.tagName)) {
            const split = SplitText.create(element, {
              type: 'lines',
              mask: 'lines',
              autoSplit: true,
              onSplit(self) {
                return gsap.from(self.lines, {
                  yPercent: 100,
                  rotate: 0.4,
                  duration: 0.85,
                  stagger: 0.08,
                  ease: motion.ease,
                });
              },
            });
            splits.push(split);
          } else {
            gsap.from(element, {
              y: 22,
              duration: 0.75,
              ease: motion.ease,
            });
          }
        });
      });
      document.querySelectorAll<HTMLElement>('[data-line]').forEach((element) => {
        gsap.from(element, { y: 14, duration: 0.65, ease: motion.ease });
      });
      document.querySelectorAll<HTMLElement>('[data-service-scene]').forEach((element) => {
        onEnter(element, () => {
          const parts = element.querySelectorAll('.scene-part');
          const kind = element.dataset.serviceScene;
          const timeline = gsap.timeline();
          if (kind === 'data')
            timeline.from(parts, {
              scaleY: 0.15,
              transformOrigin: '50% 100%',
              opacity: 0.2,
              stagger: 0.1,
              duration: 0.85,
              ease: 'power3.out',
            });
          else if (kind === 'automatisation')
            timeline.from(parts, {
              x: -25,
              opacity: 0.1,
              stagger: 0.2,
              duration: 0.65,
              ease: motion.ease,
            });
          else if (kind === 'intelligence-artificielle')
            timeline.from(parts, {
              scale: 0.8,
              transformOrigin: 'center center',
              opacity: 0.15,
              stagger: 0.16,
              duration: 0.65,
            });
          else
            timeline.from(parts, {
              y: 15,
              ...(parts[0] instanceof SVGElement ? { opacity: 0.1 } : {}),
              stagger: 0.16,
              duration: 0.7,
              ease: motion.ease,
            });
        });
      });
      document.querySelectorAll('[data-story] .story-step').forEach((element, i) => {
        onEnter(element, () => {
          gsap.from(element, {
            x: 18,
            duration: 0.7,
            delay: i * 0.04,
          });
        });
      });
      const fragments = document.querySelector('.story-fragments');
      if (fragments)
        onEnter(fragments, () => {
          gsap.from(fragments.querySelectorAll('i'), {
            rotation: 0,
            y: 0,
            stagger: 0.06,
            duration: 0.8,
            scrollTrigger: { trigger: fragments, start: 'top 90%', scrub: 1 },
          });
        });
      document.querySelectorAll('[data-method-step]').forEach((element) => {
        onEnter(element, () => {
          gsap.from(element.querySelector('.method-track i'), {
            scale: 0,
            duration: 0.5,
          });
          gsap.from(element.querySelector('.method-number'), {
            color: '#f1814b',
            duration: 1,
          });
        });
      });
      document.querySelectorAll('[data-project-image]').forEach((element) => {
        onEnter(element, () => {
          gsap.from(element, {
            clipPath: 'inset(12% 0 12% 0)',
            duration: 1,
            ease: motion.ease,
          });
        });
      });
      document.querySelectorAll('[data-architecture]').forEach((element) => {
        onEnter(element, () => {
          gsap.from(element.children, {
            y: 16,
            stagger: 0.16,
            duration: 0.7,
          });
        });
      });
      if (document.querySelector('.read-progress'))
        gsap.to('.read-progress', {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: { start: 0, end: 'max', scrub: 0.2 },
        });
      if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
        document.querySelectorAll<HTMLElement>('[data-project-image]').forEach((element) => {
          const x = gsap.quickTo(element, 'rotationY', { duration: 0.5, ease: 'power3.out' });
          const y = gsap.quickTo(element, 'rotationX', { duration: 0.5, ease: 'power3.out' });
          element.addEventListener(
            'pointermove',
            (event) => {
              const r = element.getBoundingClientRect();
              x(((event.clientX - r.left - r.width / 2) / r.width) * 3);
              y(((event.clientY - r.top - r.height / 2) / r.height) * -3);
            },
            { signal, passive: true },
          );
          element.addEventListener(
            'pointerleave',
            () => {
              x(0);
              y(0);
            },
            { signal },
          );
        });
      }
    }, document.body);
    cleanups.push(() => {
      revealObserver.disconnect();
      pending.clear();
      context.revert();
      splits.forEach((split) => split.revert());
    });
  }
  disposePage = () => {
    alive = false;
    controller.abort();
    cleanups.reverse().forEach((cleanup) => cleanup());
  };
}
document.addEventListener('astro:page-load', initialize);
document.addEventListener('astro:before-swap', (event) => {
  disposePage?.();
  disposePage = undefined;
  const newDocument = (event as Event & { newDocument: Document }).newDocument;
  if (newDocument) {
    newDocument.documentElement.dataset.motion = document.documentElement.dataset.motion;
    newDocument.documentElement.classList.add('js');
  }
});
media.addEventListener('change', initialize);
