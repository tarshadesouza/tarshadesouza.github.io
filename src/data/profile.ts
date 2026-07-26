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
  role: 'Senior Software Engineer',
  tagline: 'iOS at the core, and the range to work across the stack.',
  /**
   * The meta description recruiters and search engines see. Keep it under ~155
   * characters and lead with the words people actually search for.
   */
  description:
    'Tarsha de Souza — Senior Software Engineer in Madrid. iOS and design systems at Expedia Group, ML pipelines, multi-agent AI tooling, and open source.',
  location: 'Madrid, Spain',
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
  /**
   * Just the slug from linkedin.com/in/<slug> — not the full URL. Filling this
   * in switches on the LinkedIn button in the hero and the "let's build
   * something" footer.
   */
  linkedin: 'tarsha-de-souza-90532b92',
  /** Optional — set to null to hide. */
  x: null as string | null,
  bluesky: null as string | null,
  email: 'tarshadesouza@hotmail.com',
};

/* ── The hero paragraph ──────────────────────────────────────────────────── */

/**
 * Two or three sentences, first person. This is the single most-read text on
 * the site — it should say what you build, not list technologies (the stack
 * badges do that for you automatically).
 */
export const intro = [
  'Seven years of production engineering, with iOS at the core — I build the design-system platform that 23 Expedia Group brands ship on. For the last two years I’ve been widening: embedded with a marketing ML team shipping production pipeline changes, and building multi-agent AI tooling.',
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
      'A GitHub App that turns a red build into a green one. Six specialised detectors classify the failure, AI enriches it with evidence and a confidence score, and — with one tick in the PR — a coding agent fixes it in an isolated sandbox, verified against your real CI rather than a local guess. Permission-gated, and it runs on your own API key.',
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
    blurb:
      'An early go at the OpenAI SDK, from back when wiring an LLM into an iOS app meant building the plumbing yourself. A questionnaire on habits and weight goals goes in; a meal plan generated around them comes out.',
    stack: ['OpenAI API'],
    links: [],
  },
];

/* ── Currently working on ────────────────────────────────────────────────── */

/**
 * The "now" strip at the top of the activity section. Short, present tense.
 * Update it whenever focus shifts — it's the thing that signals you're active.
 */
export const now = [
  { text: 'Building CyclOps — open-source CI failure triage that fixes what it finds', tag: 'building' },
  {
    text: 'Embedded with Expedia’s marketing ML team, shipping production pipeline changes in PySpark on Databricks and Airflow',
    tag: 'shipping',
  },
  {
    text: 'Multi-agent AI tooling and reusable Claude Code skills, adopted across the org through an internal skills marketplace',
    tag: 'building',
  },
  { text: TODO('the open source project you want to contribute to this year'), tag: 'contributing' },
];

/* ── CV / experience ─────────────────────────────────────────────────────── */

/**
 * Most recent first. `highlights` are impact statements — what changed because
 * you were there, with a number in it wherever you can manage one.
 */
export const experience = [
  {
    company: 'Expedia Group',
    role: 'Senior Software Engineer, iOS — Design Systems Platform',
    period: 'Dec 2020 — Present',
    location: 'Madrid, Spain',
    summary:
      'The design-system platform 23 brands build on — and, over the last two years, two deliberate steps outside it.',
    /**
     * Grouped rather than one flat list, because the three strands are the
     * point: the depth is iOS, the range is everything after it.
     */
    tracks: [
      {
        label: 'iOS & design systems',
        /** Used by the discipline filter on the CV. */
        id: 'ios',
        highlights: [
          {
            text: 'Cut iOS build times by 24% through modularisation and tooling, after profiling the build graph to find the real bottleneck rather than the obvious one.',
            tags: ['Swift', 'iOS', 'Build tooling'],
          },
          {
            text: 'Built server-driven UI authentication flows on GraphQL, so stakeholders ship login-flow changes across 23 brands without waiting for an app release cycle.',
            tags: ['GraphQL', 'iOS', 'Design Systems'],
          },
          {
            text: 'Built the automated maturity-tier promotion system for the next-generation design-system iOS library, and set up its Artifactory release pipeline.',
            tags: ['iOS', 'Design Systems', 'CI/CD', 'Artifactory'],
          },
          {
            text: 'Created Xray, an internal debugging tool for design-system components. Won a company hackathon with an iOS widget and carried it through to production.',
            tags: ['Swift', 'iOS', 'Developer Tooling'],
          },
        ],
      },
      {
        label: 'ML engineering',
        id: 'ml',
        note: 'embedded with the marketing ML team, 2026',
        highlights: [
          {
            text: 'Refactored the production cost/volume circuit breaker in a churn-prevention PySpark pipeline from hardcoded brand logic to a config-driven market registry — new markets now onboard through a YAML change with zero code changes, verified against production data on Databricks and the live Airflow job.',
            tags: ['Python', 'PySpark', 'Databricks', 'Airflow'],
          },
          {
            text: 'Found and fixed silent data-quality bugs: UK traffic skipped by region detection, crashes on legacy tables, and a rerun bug blocking every market. Wrote the architecture docs and onboarding runbook the team uses now.',
            tags: ['Python', 'Databricks', 'Data quality'],
          },
        ],
      },
      {
        label: 'AI engineering',
        id: 'ai',
        note: '2024 to present',
        highlights: [
          {
            text: 'Built multi-agent systems (Claude, Codex) for design-to-code generation from Figma, autonomous debugging and self-healing CI — agent-driven fixes gated by verification loops and human-in-the-loop checkpoints.',
            tags: ['Claude', 'Codex / OpenAI', 'Multi-agent', 'CI/CD'],
          },
          {
            text: 'Created reusable Claude Code skills and orchestration agents adopted across the org through an internal skills marketplace.',
            tags: ['Claude', 'Multi-agent', 'Developer Tooling'],
          },
        ],
      },
    ],
    highlights: [],
    stack: ['Swift', 'iOS', 'GraphQL', 'Python', 'PySpark', 'Databricks', 'Airflow'],
  },
  {
    company: 'Banco Santander',
    role: 'Software Engineer (via consultancy)',
    period: '2017 — 2019',
    location: '',
    summary: 'Customer-facing features in a large-scale, regulated banking app.',
    highlights: [
      {
        text: 'Integrated a conversational virtual assistant into the banking app — one of the earliest production deployments of conversational AI in the product.',
        tags: ['Conversational AI', 'Mobile'],
      },
    ],
    stack: [],
  },
];

export const education = [
  {
    institution: 'Cumberland University',
    qualification: 'Biomedical Science',
    period: '2014 — 2017',
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
    /**
     * Details confirmed from public write-ups of the event — check the title
     * reads the way you'd say it, since the sources describe the session
     * rather than quote its billing.
     */
    title: 'Building the ultimate traveller companion',
    event: 'Women of Silicon Roundabout',
    scope: 'external' as const,
    format: 'workshop' as const,
    date: '2022-11',
    location: 'London',
    description:
      'A hands-on workshop with four Expedia Group colleagues, walking through the code behind our native mobile apps — the power of mobile development, SwiftUI and server-driven UI — at the UK’s largest tech event for women.',
    link: 'https://www.linkedin.com/posts/tarsha-de-souza-90532b92_learning-wosr22-womenintech-share-7010995713866149888-B-4d/',
    video: null as string | null,
    slides: null as string | null,
    /**
     * Photos from the day. Add more by dropping files in public/talks/ and
     * listing them here; `alt` matters — it's what a screen reader and an
     * image search both read.
     */
    photos: [
      {
        src: '/talks/wosr22-speaking.jpg',
        width: 800,
        height: 1199,
        alt: 'Tarsha de Souza speaking into a handheld microphone at Women of Silicon Roundabout 2022, wearing a Speaker badge and an Expedia Group “travel is a force for good” shirt.',
      },
      {
        src: '/talks/wosr22-session.jpg',
        width: 1280,
        height: 853,
        alt: 'The workshop room at Women of Silicon Roundabout, November 2022 — a colleague presenting at the lectern beside a slide of pandemic-era news headlines, with the rest of the Expedia Group team seated alongside.',
      },
      {
        src: '/talks/wosr22-stand.jpg',
        width: 800,
        height: 1394,
        alt: 'Tarsha de Souza featured on Expedia Group’s Instagram during Women of Silicon Roundabout, talking with two colleagues at the company stand.',
      },
    ],
  },
  {
    title: 'GraphQL best practices',
    event: 'Product Academy — Expedia Group',
    scope: 'internal' as const,
    format: 'workshop' as const,
    /** Confirm the year — inferred from your "year of non-stop travel" post. */
    date: '2023',
    location: 'Internal',
    /** A travelling series: each city got the workshop in person. */
    locations: ['India', 'London', 'Chicago', 'Seattle', 'Austin', 'San Francisco'],
    description:
      'A travelling workshop on GraphQL best practices for Expedia Group’s Product Academy, taught in person across six offices on three continents — walking engineers and product people through the GraphQL gateway, the Experience API, and the shared UI components behind them.',
    video: null,
    slides: null,
    photos: [
      {
        src: '/talks/product-academy-india.jpg',
        width: 1400,
        height: 1050,
        alt: 'Tarsha de Souza on stage in a white shirt, taking questions with a fellow panellist at a packed Product Academy session in India, in front of large screens showing the GraphQL gateway, the Experience API and shared UI components for iOS, Android and web.',
      },
    ],
  },
];

/* ── Mentoring ───────────────────────────────────────────────────────────── */

/**
 * Deliberately brief — a statement, not a catalogue. Everything below the
 * intro is optional: leave the arrays empty and the section stays to the
 * point. Fill any of them in later and it grows to fit.
 */
export const mentoring = {
  intro:
    'Pairing, reviews that explain the why, the workshops I teach, and the docs and runbooks that outlast any one conversation.',

  /** Programmes or schemes. Keep mentees anonymous unless they've agreed. */
  programmes: [] as { name: string; role: string; period: string; description: string }[],

  /** Numbers, if you ever want them — these render as animated counters. */
  stats: [] as { value: number; label: string; suffix: string }[],

  /** A quote from someone you've mentored would carry real weight here. */
  testimonials: [] as { quote: string; attribution: string }[],
};

/* ── Anything else ───────────────────────────────────────────────────────── */

/** Extra links for the footer. */
export const elsewhere: { label: string; href: string }[] = [];
