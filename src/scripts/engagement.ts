/**
 * What people actually read.
 *
 * Page-view counters answer "did someone arrive". They can't answer "what held
 * their attention", because that isn't a page load — it's time spent with a
 * section on screen. This measures that and reports a handful of events.
 *
 * Deliberately few events, chosen so each one answers a question:
 *
 *   read:<section>     the section that held attention longest, one per visit
 *   reached:<section>  the furthest section reached before the visit ended
 *   depth:<n>          the furthest point reached, in quarters
 *   click:<thing>      the links that represent intent — email, CV, projects
 *
 * `read` and `reached` answer different questions and both are needed. `read`
 * says what worked. `reached` says where people stopped, which is the only way
 * to tell a section nobody likes from a section nobody ever sees.
 *
 * One event per visit for the first two, rather than a stream: at this traffic
 * a stream would be noise, and a single "what did they come away with" signal
 * is what the weekly report can actually say something about.
 *
 * No cookies, no identifiers, nothing stored on the visitor's machine. Nothing
 * here can tell you who someone was, only what a visit looked like — which is
 * both the point and the reason it needs no consent banner.
 */

import { analytics } from '../data/profile';

declare global {
  interface Window {
    goatcounter?: { count(vars: { path: string; title?: string; event?: boolean }): void };
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void;
  }
}

/**
 * The hero is deliberately included: someone who never scrolls past the first
 * screen is the single most important thing to be able to see, and excluding
 * it made that visit produce no events at all.
 */
const IGNORED = new Set(['main']);

/**
 * Sends one event. Every provider here is cookieless; if none is configured,
 * this is a no-op and the rest of the file still runs harmlessly.
 */
function send(name: string, label: string) {
  switch (analytics.provider) {
    case 'goatcounter':
      window.goatcounter?.count({ path: name, title: label, event: true });
      break;
    case 'plausible':
      window.plausible?.(name);
      break;
    default:
      // Cloudflare Web Analytics has no custom-event API. Nothing to send to.
      break;
  }
}

export function initEngagement() {
  if (!('IntersectionObserver' in window)) return;

  /** Milliseconds each section has been at least half on screen. */
  const dwell = new Map<string, number>();
  const since = new Map<string, number>();
  let deepest = 0;
  let sent = false;

  const sections = Array.from(document.querySelectorAll<HTMLElement>('section[id], header[id]'))
    .filter((el) => !IGNORED.has(el.id));
  if (!sections.length) return;

  const stop = (id: string, at: number) => {
    const started = since.get(id);
    if (started === undefined) return;
    dwell.set(id, (dwell.get(id) ?? 0) + (at - started));
    since.delete(id);
  };

  /** DOM order, so "furthest reached" is a comparison of indexes. */
  const order = new Map(sections.map((section, i) => [section.id, i]));
  let furthest = -1;

  const observer = new IntersectionObserver(
    (entries) => {
      const now = performance.now();
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).id;
        if (entry.isIntersecting) {
          if (!since.has(id)) since.set(id, now);
          furthest = Math.max(furthest, order.get(id) ?? -1);
        } else {
          stop(id, now);
        }
      }
    },
    /*
     * A reading line across the middle of the viewport: a section counts as
     * being read while it covers the centre of the screen.
     *
     * Not a visibility threshold. `threshold: 0.5` means half of the *target*
     * is on screen, which a section taller than the viewport can never satisfy
     * — the CV and the shelf would have recorded zero time no matter how long
     * someone spent on them.
     */
    { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
  );

  sections.forEach((section) => observer.observe(section));

  const trackDepth = () => {
    const scrollable = document.body.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const reached = Math.min(100, Math.round(((window.scrollY + window.innerHeight) / document.body.scrollHeight) * 100));
    deepest = Math.max(deepest, Math.floor(reached / 25) * 25);
  };

  window.addEventListener('scroll', trackDepth, { passive: true });
  trackDepth();

  /**
   * Reported when the visit ends. `visibilitychange` rather than `unload`,
   * which is unreliable on mobile — a phone backgrounding the tab often never
   * fires unload at all.
   */
  const report = () => {
    if (sent) return;
    sent = true;

    const now = performance.now();
    for (const id of [...since.keys()]) stop(id, now);

    const ranked = [...dwell.entries()].sort((a, b) => b[1] - a[1]);
    // Under a second and a half is scrolling past, not reading. Kept low
    // because smooth scrolling spends a chunk of any short visit in motion.
    const [best, ms] = ranked[0] ?? [];
    if (best && ms >= 1500) send(`read:${best}`, `Read longest: ${best}`);

    if (deepest > 0) send(`depth:${deepest}`, `Scrolled to ${deepest}%`);

    // Where the visit ended. A section that never appears here is one nobody
    // is getting to, which is a different problem from one nobody likes.
    if (furthest >= 0) {
      const id = sections[furthest].id;
      send(`reached:${id}`, `Got as far as ${id}`);
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') report();
  });
  window.addEventListener('pagehide', report);

  /* Clicks that mean intent, rather than every link on the page. */
  document.addEventListener('click', (event) => {
    const link = (event.target as HTMLElement | null)?.closest?.('a');
    if (!(link instanceof HTMLAnchorElement)) return;

    const href = link.getAttribute('href') ?? '';
    if (href.endsWith('.pdf')) return send('click:cv-pdf', 'Downloaded the CV');
    // The most important click on the page, and the easiest to miss: it is
    // neither an http link nor a file.
    if (href.startsWith('mailto:')) return send('click:email', 'Started an email');

    if (!href.startsWith('http')) return;
    try {
      const { host, pathname } = new URL(href);
      if (host === window.location.host) {
        // Own-domain project pages: /cyclops/, /AdoptAheadOS/
        const project = pathname.split('/').filter(Boolean)[0];
        if (project) send(`click:${project.toLowerCase()}`, `Opened ${project}`);
        return;
      }
      const site = host.replace(/^www\./, '').split('.')[0];
      send(`click:${site}`, `Left for ${site}`);
    } catch {
      /* not a URL we can read; nothing to report */
    }
  });
}
