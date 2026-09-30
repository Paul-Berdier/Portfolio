import { gsap } from 'gsap';

export function initProjects(): () => void {
  const root = document.querySelector<HTMLElement>('[data-projects]');
  const progress = document.querySelector<HTMLElement>('[data-case-progress]');
  const controller = new AbortController();
  const { signal } = controller;
  const animations: gsap.core.Tween[] = [];
  if (root) {
    const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-project-filter]')];
    const items = [...root.querySelectorAll<HTMLElement>('[data-project-item]')];
    const status = root.querySelector<HTMLElement>('[data-project-status]');
    const empty = root.querySelector<HTMLElement>('[data-project-empty]');
    buttons.forEach((button) => {
      button.disabled = false;
      button.addEventListener(
        'click',
        () => {
          animations.splice(0).forEach((animation) => animation.revert());
          const category = button.dataset.projectFilter;
          buttons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
          items.forEach((item) => {
            item.hidden =
              category !== 'all' && !item.dataset.categories?.split(' ').includes(category ?? '');
          });
          const visible = items.filter((item) => !item.hidden);
          if (status)
            status.textContent = `${visible.length} démonstrateur${visible.length > 1 ? 's' : ''} ${visible.length > 1 ? 'affichés' : 'affiché'}.`;
          if (empty) empty.hidden = visible.length > 0;
          if (document.documentElement.dataset.motion === 'auto' && visible.length) {
            animations.push(
              gsap.fromTo(
                visible,
                { y: 16, opacity: 0.45 },
                {
                  y: 0,
                  opacity: 1,
                  duration: 0.4,
                  stagger: 0.07,
                  ease: 'power2.out',
                  clearProps: 'transform,opacity',
                },
              ),
            );
          }
        },
        { signal },
      );
    });
  }
  if (progress) {
    const update = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${height > 0 ? Math.max(0, Math.min(1, window.scrollY / height)) : 0})`;
    };
    window.addEventListener('scroll', update, { passive: true, signal });
    window.addEventListener('resize', update, { passive: true, signal });
    update();
  }
  return () => {
    controller.abort();
    animations.forEach((animation) => animation.revert());
  };
}
