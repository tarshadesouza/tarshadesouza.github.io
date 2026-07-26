/**
 * All client-side motion for the site, in one small module.
 *
 * Rules it follows:
 *  - It only ever *adds* visibility. If this script never runs, every element
 *    is still readable (see the `.no-js` fallbacks in global.css).
 *  - It bails out entirely when the visitor asks for reduced motion.
 *  - Scroll work happens once per frame via rAF, never directly in the
 *    scroll handler.
 */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Scroll reveals ──────────────────────────────────────────────────────── */

function initReveals() {
  const targets = document.querySelectorAll<HTMLElement>('[data-reveal], [data-rule]');

  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
  );

  targets.forEach((el) => io.observe(el));
}

/* ── Stagger children of a [data-stagger] container ──────────────────────── */

function initStagger() {
  document.querySelectorAll<HTMLElement>('[data-stagger]').forEach((group) => {
    const step = Number(group.dataset.stagger) || 70;
    Array.from(group.children).forEach((child, i) => {
      (child as HTMLElement).style.setProperty('--reveal-delay', `${i * step}ms`);
    });
  });
}

/* ── Parallax + sticky nav + scrollspy, all on one rAF loop ──────────────── */

function initScrollEffects() {
  const nav = document.querySelector<HTMLElement>('.nav');
  const parallaxItems = Array.from(
    document.querySelectorAll<HTMLElement>('[data-parallax]'),
  ).map((el) => ({ el, strength: Number(el.dataset.parallax) || 0.1 }));

  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.nav-link'));
  const sections = links
    .map((link) => document.querySelector<HTMLElement>(link.hash))
    .filter((el): el is HTMLElement => Boolean(el));

  let ticking = false;

  const update = () => {
    ticking = false;
    const y = window.scrollY;
    const vh = window.innerHeight;

    nav?.classList.toggle('is-stuck', y > 24);

    if (!reduced) {
      for (const { el, strength } of parallaxItems) {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -vh || rect.top > vh * 2) continue;
        // -1 (just below the fold) → 1 (just above it)
        const progress = (vh / 2 - (rect.top + rect.height / 2)) / (vh / 2 + rect.height / 2);
        el.style.transform = `translate3d(0, ${(progress * strength * 100).toFixed(2)}px, 0)`;
      }
    }

    // Scrollspy: the last section whose top has passed the reading line wins.
    let current = -1;
    sections.forEach((section, i) => {
      if (section.getBoundingClientRect().top <= vh * 0.35) current = i;
    });
    links.forEach((link, i) => link.classList.toggle('is-current', i === current));
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

/* ── Pointer-tracked glow on cards ───────────────────────────────────────── */

function initCardGlow() {
  if (reduced || !window.matchMedia('(hover: hover)').matches) return;

  document.querySelectorAll<HTMLElement>('.card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      card.style.setProperty('--my', `${event.clientY - rect.top}px`);
    });
  });
}

/* ── Counters ────────────────────────────────────────────────────────────── */

function initCounters() {
  const counters = document.querySelectorAll<HTMLElement>('[data-count]');
  if (!counters.length) return;

  const run = (el: HTMLElement) => {
    const target = Number(el.dataset.count) || 0;
    if (reduced) {
      el.textContent = String(target);
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (!('IntersectionObserver' in window)) {
    counters.forEach(run);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target as HTMLElement);
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.4 },
  );

  counters.forEach((el) => io.observe(el));
}

/* ── Talk scope filter (external / internal / all) ───────────────────────── */

function initTalkFilter() {
  const tabs = document.querySelectorAll<HTMLButtonElement>('.scope-tab');
  const talks = document.querySelectorAll<HTMLElement>('[data-scope]');
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const scope = tab.dataset.filter ?? 'all';
      tabs.forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
      talks.forEach((talk) => {
        const show = scope === 'all' || talk.dataset.scope === scope;
        talk.hidden = !show;
      });
    });
  });
}

/* ── Theme ───────────────────────────────────────────────────────────────── */

function initTheme() {
  const toggle = document.querySelector<HTMLButtonElement>('.theme-toggle');
  toggle?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    toggle.setAttribute('aria-label', `Switch to ${next === 'light' ? 'dark' : 'light'} theme`);
  });
}

/* ── Boot ────────────────────────────────────────────────────────────────── */

document.documentElement.classList.remove('no-js');
initStagger();
initReveals();
initScrollEffects();
initCardGlow();
initCounters();
initTalkFilter();
initTheme();
