/** Keep the server-rendered relative URLs stable after hydration and hash navigation. */
export function syncLanguageLinks() {
  document.querySelectorAll<HTMLAnchorElement>('[data-language-switcher] a').forEach((link) => {
    const destination = new URL(link.href, location.href);
    if (destination.origin !== location.origin) return;
    link.setAttribute('href', destination.pathname + location.search + location.hash);
  });
}
