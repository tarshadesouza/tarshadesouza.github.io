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

/* ── Photo lightbox ──────────────────────────────────────────────────────── */

/**
 * Uses a native <dialog>, so Escape, focus trapping and the backdrop all come
 * from the platform rather than from us. Without JavaScript the thumbnails are
 * still real images with real alt text — they just don't enlarge.
 */
function initLightbox() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox-dialog]');
  const image = document.querySelector<HTMLImageElement>('[data-lightbox-image]');
  if (!dialog || !image) return;

  document.querySelectorAll<HTMLButtonElement>('[data-lightbox]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const source = trigger.dataset.lightbox!;
      const thumb = trigger.querySelector('img');
      image.src = source;
      image.alt = thumb?.alt ?? '';
      dialog.showModal();
    });
  });

  dialog
    .querySelector('[data-lightbox-close]')
    ?.addEventListener('click', () => dialog.close());

  // Clicking the backdrop — anywhere outside the image — closes it too.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  // Don't hold a full-size image in memory once it's dismissed.
  dialog.addEventListener('close', () => {
    image.src = '';
  });
}

/* ── The interactive CV ──────────────────────────────────────────────────── */

/**
 * Filter the CV by discipline or by technology, and fill the year rail as the
 * section scrolls. Everything here is additive: without JavaScript the CV is
 * simply shown in full, which is the correct fallback for a CV.
 */
function initCV() {
  const cv = document.querySelector<HTMLElement>('[data-cv]');
  if (!cv) return;

  const chips = cv.querySelectorAll<HTMLButtonElement>('[data-filter-track]');
  const allButtons = document.querySelectorAll<HTMLButtonElement>('[data-filter-all]');
  const tags = cv.querySelectorAll<HTMLButtonElement>('[data-filter-tag]');
  const highlights = Array.from(cv.querySelectorAll<HTMLElement>('[data-highlight]'));
  const tracks = Array.from(cv.querySelectorAll<HTMLElement>('.track'));
  const roles = Array.from(cv.querySelectorAll<HTMLElement>('[data-role]'));
  const status = cv.querySelector<HTMLElement>('[data-cv-status]');
  const empty = cv.querySelector<HTMLElement>('[data-cv-empty]');
  const total = Number(cv.dataset.total) || highlights.length;

  /** null = show everything. `label` is what the status line says. */
  let active: { type: 'track' | 'tag'; value: string; label: string } | null = null;

  const matches = (el: HTMLElement) => {
    if (!active) return true;
    if (active.type === 'track') return el.dataset.track === active.value;
    return (el.dataset.tags ?? '').split('|').includes(active.value);
  };

  const apply = () => {
    let shown = 0;

    for (const el of highlights) {
      const show = matches(el);
      if (show) shown += 1;

      if (show) {
        el.hidden = false;
        // Let the browser see the un-hidden element before animating it back in.
        requestAnimationFrame(() => el.classList.remove('is-out'));
      } else {
        el.classList.add('is-out');
        window.setTimeout(() => {
          if (!matches(el)) el.hidden = true;
        }, reduced ? 0 : 260);
      }
    }

    // A container with nothing left to show goes too.
    const collapse = (containers: HTMLElement[]) => {
      for (const container of containers) {
        const any = Array.from(
          container.querySelectorAll<HTMLElement>('[data-highlight]'),
        ).some(matches);
        window.setTimeout(() => {
          container.hidden = !any;
        }, any || reduced ? 0 : 260);
      }
    };

    collapse(tracks);
    collapse(roles);

    // Reflect state on the controls.
    chips.forEach((chip) => {
      const on = active?.type === 'track' && active.value === chip.dataset.filterTrack;
      chip.classList.toggle('is-on', on);
      chip.setAttribute('aria-pressed', String(on));
    });

    tags.forEach((tag) => {
      const on = active?.type === 'tag' && active.value === tag.dataset.filterTag;
      tag.classList.toggle('is-on', on);
    });

    allButtons.forEach((button) => {
      button.classList.toggle('is-on', active === null);
      if (button.hasAttribute('aria-pressed')) {
        button.setAttribute('aria-pressed', String(active === null));
      }
    });

    if (status) {
      status.textContent = active
        ? `Showing ${shown} of ${total} highlights · ${active.label}`
        : `Showing all ${total} highlights`;
    }

    if (empty) empty.hidden = shown > 0;
  };

  /**
   * Filtering removes content, which can leave the reader scrolled past the
   * whole section looking at a blank page. Pull them back to the top of the CV
   * whenever that would happen.
   */
  const keepInView = () => {
    const section = document.getElementById('cv');
    if (!section) return;
    if (section.getBoundingClientRect().top >= 0) return;
    section.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };

  const toggle = (next: { type: 'track' | 'tag'; value: string; label: string }) => {
    const same = active?.type === next.type && active.value === next.value;
    active = same ? null : next;
    apply();
    keepInView();
  };

  chips.forEach((chip) =>
    chip.addEventListener('click', () =>
      toggle({
        type: 'track',
        value: chip.dataset.filterTrack!,
        label: chip.textContent?.trim() ?? chip.dataset.filterTrack!,
      }),
    ),
  );

  tags.forEach((tag) =>
    tag.addEventListener('click', () => {
      const value = tag.dataset.filterTag!;
      toggle({ type: 'tag', value, label: value });
    }),
  );

  allButtons.forEach((button) =>
    button.addEventListener('click', () => {
      active = null;
      apply();
      keepInView();
    }),
  );

  /* The year rail fills in step with the section's own scroll. */
  const fill = cv.querySelector<HTMLElement>('[data-rail-fill]');
  const body = cv.querySelector<HTMLElement>('.cv-body');

  if (fill && body) {
    let ticking = false;

    const updateRail = () => {
      ticking = false;
      const rect = body.getBoundingClientRect();
      const viewportMiddle = window.innerHeight * 0.5;
      const progress = (viewportMiddle - rect.top) / rect.height;
      fill.style.setProperty('--progress', String(Math.min(Math.max(progress, 0), 1)));
    };

    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(updateRail);
      },
      { passive: true },
    );

    updateRail();
  }
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
initLightbox();
initCV();
initTheme();
