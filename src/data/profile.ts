/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  THIS IS THE ONLY FILE YOU NEED TO EDIT.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Everything on the site is driven from here, except the two things that keep
 *  themselves up to date: your GitHub activity and your Medium posts. Those are
 *  fetched at build time (see scripts/fetch-feeds.mjs) and refreshed daily by
 *  GitHub Actions, so you never hand-write them.
 *
 *  Anything still marked TODO renders a visible amber badge in local dev and is
 *  reported by `npm run build`, so nothing half-finished ships by accident.
 *  A section with an empty array simply does not render.
 */

export const TODO = (text: string) => `TODO: ${text}`;

/* ── Site + SEO ──────────────────────────────────────────────────────────── */

export const site = {
  /** Change this (and public/CNAME) if you move to a custom domain. */
  url: 'https://tarshadesouza.github.io',
  name: 'Tarsha de Souza',
  /** Shown under your name in the hero, and as the SEO meta description. */
  role: 'Software Engineer',
  tagline: 'I build things end to end — mobile, backend, and the tooling in between.',
  /**
   * The meta description recruiters and search engines see. Keep it under ~155
   * characters and lead with the words people actually search for.
   */
  description:
    'Tarsha de Souza — software engineer building across iOS, backend and developer tooling. Open source, writing, conference talks and mentoring.',
  location: 'TODO: City, Country',
  /** Used for the "available for" line in the hero. Set to null to hide it. */
  status: 'Open to interesting problems',
} as const;

/* ── Where to find you ───────────────────────────────────────────────────── */

export const social = {
  github: 'tarshadesouza',
  /**
   * Your Medium handle, including the @. The live feed reads
   * medium.com/feed/<handle>. Set to null if you don't want the writing section.
   */
  medium: '@Theunanimouscoder',
  linkedin: 'TODO: your-linkedin-slug',
  /** Optional — set to null to hide. */
  x: null as string | null,
  bluesky: null as string | null,
  email: 'TODO: the address you want recruiters to use',
};

/* ── The hero paragraph ──────────────────────────────────────────────────── */

/**
 * Two or three sentences, first person. This is the single most-read text on
 * the site — it should say what you build, not list technologies (the stack
 * badges do that for you automatically).
 */
export const intro = [
  'I’m a software engineer who started in iOS and kept going — into backend services, CI infrastructure and the AI tooling that sits alongside them.',
  'Right now I’m building CyclOps, an open-source GitHub App that reads failing CI, explains it in plain language, and fixes it with a coding agent that loops until the build is green.',
];

/* ── Projects ────────────────────────────────────────────────────────────── */

/**
 * `repo` pulls the description, stars, languages and last-commit date straight
 * from GitHub at build time — you don't restate any of it here. The tech stack
 * badges are derived from the repo's languages and topics automatically.
 *
 * `blurb` is your voice: why the project exists and what it demonstrates.
 * Add `stack: [...]` only to add things GitHub can't see (Postgres, Redis, …).
 */
export const projects = [
  {
    repo: 'tarshadesouza/cyclops',
    featured: true,
    blurb:
      'A GitHub App that turns a red build into a green one. It reads the CI logs, explains the failure, and — with one tick in the PR — hands the fix to a coding agent that iterates against your real CI until it passes. Runs on your own API key.',
    stack: ['PostgreSQL', 'Redis', 'BullMQ', 'Prisma', 'Turborepo', 'Railway'],
    links: [
      { label: 'Live docs', href: 'https://tarshadesouza.github.io/cyclops/' },
    ],
  },
  {
    repo: 'tarshadesouza/AdoptAheadOS',
    featured: true,
    blurb: TODO('one or two sentences on what AdoptAheadOS is and why you built it'),
    stack: [],
    links: [],
  },
  {
    repo: 'tarshadesouza/SmartMealPlanner',
    featured: false,
    blurb: TODO('what this one does — or delete this entry'),
    stack: [],
    links: [],
  },
];

/* ── Currently working on ────────────────────────────────────────────────── */

/**
 * The "now" strip at the top of the activity section. Short, present tense.
 * Update it whenever focus shifts — it's the thing that signals you're active.
 */
export const now = [
  { text: 'Shipping autofix reliability improvements in CyclOps', tag: 'building' },
  { text: TODO('an open source project you want to contribute to this year'), tag: 'contributing' },
  { text: TODO('something you are learning'), tag: 'learning' },
];

/* ── CV / experience ─────────────────────────────────────────────────────── */

/**
 * Most recent first. `highlights` are impact statements — what changed because
 * you were there, with a number in it wherever you can manage one.
 */
export const experience = [
  {
    company: 'Expedia Group',
    role: TODO('your exact job title'),
    period: 'TODO: 2021 — Present',
    location: 'TODO: City',
    summary: TODO('one line on what your team owns'),
    highlights: [
      TODO('an impact statement with a number in it'),
      TODO('a second one — scope, scale, or something you led'),
    ],
    stack: ['Swift', 'SwiftUI', 'iOS'],
  },
  {
    company: TODO('previous company'),
    role: TODO('title'),
    period: 'TODO: 2019 — 2021',
    location: 'TODO: City',
    summary: TODO('one line'),
    highlights: [TODO('impact statement')],
    stack: [],
  },
];

export const education = [
  {
    institution: TODO('university or bootcamp'),
    qualification: TODO('degree'),
    period: 'TODO: years',
  },
];

/** Optional PDF. Drop the file in public/ and set the path, or leave null. */
export const cvPdf: string | null = null; // e.g. '/tarsha-de-souza-cv.pdf'

/* ── Speaking ────────────────────────────────────────────────────────────── */

/**
 * `scope: 'external'` for public conferences and meetups, `'internal'` for
 * company-wide talks and guilds — the site groups and labels them for you.
 * `video` / `slides` are optional; a talk with a video gets a play affordance.
 */
export const talks = [
  {
    title: TODO('talk title'),
    event: TODO('conference or meetup name'),
    scope: 'external' as const,
    date: 'TODO: 2025-06',
    location: TODO('city, or “remote”'),
    description: TODO('one line on what the talk was about'),
    video: null as string | null,
    slides: null as string | null,
  },
  {
    title: TODO('internal talk title'),
    event: TODO('e.g. Expedia Group iOS Guild'),
    scope: 'internal' as const,
    date: 'TODO: 2024-11',
    location: 'Internal',
    description: TODO('one line'),
    video: null,
    slides: null,
  },
];

/* ── Mentoring ───────────────────────────────────────────────────────────── */

export const mentoring = {
  /** The paragraph that opens the section — your philosophy, briefly. */
  intro: TODO(
    'two sentences on how you mentor and what you get out of it — this is the section that makes people trust you with their juniors',
  ),
  /**
   * Programmes, schemes, or ongoing relationships. Keep names anonymous if the
   * mentee hasn't agreed to be named.
   */
  programmes: [
    {
      name: TODO('programme or scheme name'),
      role: TODO('e.g. Mentor'),
      period: 'TODO: 2023 — Present',
      description: TODO('what you do there'),
    },
  ],
  /** Numbers, if you have them — these render as animated counters. */
  stats: [
    { value: 0, label: 'engineers mentored', suffix: '' },
    { value: 0, label: 'years mentoring', suffix: '' },
  ],
  /** Optional. A quote from someone you've mentored is worth a lot here. */
  testimonials: [] as { quote: string; attribution: string }[],
};

/* ── Anything else ───────────────────────────────────────────────────────── */

/** Extra links for the footer. */
export const elsewhere: { label: string; href: string }[] = [];
