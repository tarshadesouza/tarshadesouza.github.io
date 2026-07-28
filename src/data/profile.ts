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
 *
 *  Before writing copy here, read CONTENT.md in the repo root. It has the voice
 *  rules — facts rather than self-description, no unverifiable superlatives,
 *  and nothing addressed to whoever is editing this file.
 */

export const TODO = (text: string) => `TODO: ${text}`;

/* ── Site + SEO ──────────────────────────────────────────────────────────── */

export const site = {
  /** Change this (and public/CNAME) if you move to a custom domain. */
  url: 'https://tarshadesouza.github.io',
  name: 'Tarsha de Souza',
  /** Shown under your name in the hero, and as the SEO meta description. */
  role: 'Senior Software Engineer',
  /**
   * Optional line under the name. Currently empty on purpose: the role,
   * location and opening paragraph already say this, and a fourth restatement
   * was where the tone kept going wrong. Put a string here and it renders.
   */
  tagline: '',
  /**
   * The meta description recruiters and search engines see. Keep it under ~155
   * characters and lead with the words people actually search for.
   */
  description:
    'Tarsha de Souza — Senior Software Engineer in Madrid. AI agent tooling, data pipelines, and seven years of iOS at Expedia Group. Open source on GitHub.',
  location: 'Madrid, Spain',
  /** Used for the "available for" line in the hero. Set to null to hide it. */
  status: 'Excited by all things tech',
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

/* ── Analytics ───────────────────────────────────────────────────────────── */

/**
 * All three options below are cookieless and store no personal data, which
 * matters: analytics that sets cookies or profiles visitors needs a consent
 * banner under GDPR, and a consent banner on a personal site is a worse
 * trade than slightly coarser numbers.
 *
 *   'none'         — nothing loads at all (the default)
 *   'cloudflare'   — Cloudflare Web Analytics. Free, unlimited. Sign up, add
 *                    the site, paste the beacon token below.
 *   'goatcounter'  — free for personal use, open source. `id` is the
 *                    subdomain you pick: <id>.goatcounter.com
 *   'plausible'    — paid (~€9/mo), the nicest dashboard of the three. `id`
 *                    is the domain you registered with them.
 *
 * Whichever you choose, it's one script, loaded with `defer`, and it never
 * blocks the page.
 */
export const analytics = {
  provider: 'cloudflare' as 'none' | 'cloudflare' | 'goatcounter' | 'plausible',
  /**
   * Cloudflare beacon token, GoatCounter subdomain, or Plausible domain.
   *
   * This is deliberately not a secret. The beacon token is a public site
   * identifier: it ships in the HTML of every page, so every visitor already
   * has it. It grants no access to the Cloudflare account and can't read the
   * dashboard — hiding it in an Actions secret would achieve nothing, since
   * the built HTML publishes it either way.
   */
  id: '4b39c4bf227148f1a7bd6759cd35583a',
};

/**
 * Search engine ownership proofs. Paste the code the tool gives you — it
 * renders as a meta tag, which is the verification method that survives a
 * redeploy (an uploaded HTML file would be wiped by the next build).
 */
export const verification = {
  /** Search Console → Add property → URL prefix → HTML tag. */
  google: '',
  /** Bing Webmaster Tools, if you bother — it also feeds DuckDuckGo. */
  bing: '',
};

/* ── The hero paragraph ──────────────────────────────────────────────────── */

/**
 * Two or three sentences, first person. This is the single most-read text on
 * the site — it should say what you build, not list technologies (the stack
 * badges do that for you automatically).
 */
export const intro = [
  'Seven years a software engineer, primarily iOS, branching out wherever there’s been room — a six-month rotation on Expedia’s marketing ML team, open source in my own time. I like to build and fix things, I like work with room to be creative, and most of all I like learning something I didn’t know.',
  // Inline links use [label](url) — see inlineLinks() in src/lib/content.ts.
  'My two most recent builds are open source. [CyclOps](https://tarshadesouza.github.io/cyclops/) reads a failing CI build, explains it in plain language, and fixes it with a coding agent that loops until the build is green. [AdoptAheadOS](https://tarshadesouza.github.io/AdoptAheadOS/) watches Apple’s developer news for SDK deadlines and API deprecations, then scans a Swift codebase in CI to flag what will break before the cut-off.',
];

/* ── Projects ────────────────────────────────────────────────────────────── */

/**
 * Optional line above the project cards. Empty on purpose: the cards state
 * what each project does, the hero already names the two recent ones, and a
 * sentence here was repeating both. Put a string back and it renders.
 */
export const projectsIntro = '';

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
      'A GitHub App for failing CI. Six specialised detectors classify the failure, AI enriches it with evidence and a confidence score, and — with one tick in the PR — a coding agent fixes it in an isolated sandbox, verified against your real CI rather than a local guess. Permission-gated, and it runs on your own API key.',
    stack: ['PostgreSQL', 'Redis', 'BullMQ', 'Prisma', 'Turborepo', 'Railway'],
    links: [
      { label: 'Live docs', href: 'https://tarshadesouza.github.io/cyclops/' },
    ],
  },
  {
    repo: 'tarshadesouza/AdoptAheadOS',
    featured: true,
    blurb:
      'Adoption work is the first thing a roadmap pushes down, so teams find out they’re behind when Apple’s cut-off is already close. This monitors Apple Developer News, turns SDK requirements and API deprecations into structured rules, and scans a Swift codebase in CI to flag the files affected — while there’s still time to do something about it.',
    stack: [],
    links: [],
  },
  {
    repo: 'tarshadesouza/SmartMealPlanner',
    featured: false,
    blurb:
      'Built in December 2023, when there was no official Swift SDK and putting a model behind an iOS feature meant writing the plumbing yourself. A questionnaire on habits and weight goals goes in; a meal plan built around them comes out.',
    stack: ['OpenAI API'],
    links: [],
  },
];

/* ── Internal work ───────────────────────────────────────────────────────── */

/**
 * Work with no public repository — internal tools, design-system work. Unlike
 * the open-source projects, none of this can be read off an API, so everything
 * here is written by hand.
 *
 * Clips should be MP4 (H.264) with a poster frame; they autoplay muted and
 * looping, and fall back to the poster for anyone who's asked for reduced
 * motion.
 */
/**
 * Empty pending sign-off: the Xray case study and its screen recordings were
 * removed until it's confirmed that internal tooling and pre-release debug
 * surfaces over production UI are cleared for publication.
 */
export const internalWork: {
  name: string;
  org: string;
  role: string;
  summary: string;
  blurb: string;
  points: string[];
  stack: string[];
  /** Screen recordings. Omit for a case study that only has stills. */
  clips?: {
    src: string;
    poster: string;
    width: number;
    height: number;
    caption: string;
    alt: string;
  }[];
  /** Stills. `src` is the WebP; the PNG beside it is the fallback. */
  shots?: {
    src: string;
    width: number;
    height: number;
    caption: string;
    alt: string;
  }[];
}[] = [
  {
    name: 'App Intents with live data',
    org: 'Expedia Group',
    role: 'Senior Software Engineer',
    summary: 'Built in a hackathon, shipped to production, still running two years later.',
    blurb:
      'Expedia’s core journeys surfaced as App Intents, so a traveller can start a search from Spotlight or Siri without opening the app first — backed by live data rather than static shortcuts.',
    points: [
      'Five days, built straight onto the production codebase rather than a demo target.',
      'Most of that time went on integration: routing each intent through to the right destination across points of sale — search, trips, and the rest of a large app.',
      '130,000+ events between 25 September and 7 October 2024.',
      '120,000 of those came from the lodging intent alone.',
      'Still shipping in the Expedia app today.',
    ],
    stack: ['Swift', 'App Intents', 'iOS'],
    shots: [
      {
        src: '/work/app-intents.webp',
        width: 1170,
        height: 490,
        caption: 'Find Places to Stay, Find flights and Find Packages, surfaced in iOS Spotlight.',
        alt: 'iOS Spotlight search for “expedia”, showing the Expedia app alongside three App Intent shortcuts: Find Places to Stay, Find flights, and Find Packages.',
      },
    ],
  },
];

/* ── Currently working on ────────────────────────────────────────────────── */

/**
 * The "now" strip at the top of the activity section. Short, present tense.
 * Update it whenever focus shifts — it's the thing that signals you're active.
 */
export const now = [
  {
    text: 'Looking for work where I can use and build with new technology — agentic AI especially: MCP servers, agent frameworks, and the evaluation harnesses that keep agents honest',
    tag: 'looking for',
  },
  {
    text: 'Six-month rotation on Expedia Group’s marketing ML team — data-quality checks, consolidating per-market workflows into one, and making sure a skewed day or a late backfill raises an alert with enough context to act on',
    tag: 'rotation',
  },
  {
    text: 'Multi-agent AI tooling and reusable Claude Code skills at Expedia Group, shared across the org through an internal skills marketplace',
    tag: 'building',
  },
  {
    text: 'Maintaining CyclOps and AdoptAheadOS in the open, and writing up what I learn building them',
    tag: 'open source',
  },
];

/* ── CV / experience ─────────────────────────────────────────────────────── */

/**
 * Most recent first. `highlights` are impact statements — what changed because
 * you were there, with a number in it wherever you can manage one.
 */
export const experience = [
  {
    company: 'Expedia Group',
    role: 'Senior Software Engineer — Design Systems Platform',
    period: 'Dec 2020 — Present',
    location: 'Madrid, Spain',
    summary:
      'The design-system platform 23 brands build on, plus work outside it.',
    /**
     * Grouped rather than one flat list, because the three strands are the
     * point: the depth is iOS, the range is everything after it.
     */
    tracks: [
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
      {
        label: 'ML engineering',
        id: 'ml',
        note: 'six-month rotation with the marketing ML team, Feb — Aug 2026',
        highlights: [
          {
            text: 'Refactored the production cost/volume circuit breaker in a churn-prevention PySpark pipeline from hardcoded brand logic to a config-driven market registry — new markets now onboard through a YAML change with zero code changes, verified against production data on Databricks and the live Airflow job.',
            tags: ['Python', 'PySpark', 'Databricks', 'Airflow'],
          },
          {
            text: 'Found and fixed silent data-quality bugs: UK traffic skipped by region detection, crashes on legacy tables, and a rerun bug blocking every market. Wrote the architecture docs and onboarding runbook for the team.',
            tags: ['Python', 'Databricks', 'Data quality'],
          },
          {
            text: 'Added regression handling for bad days — a skewed dataset or a late backfill now raises an alert carrying the context needed to diagnose it, rather than passing silently.',
            tags: ['Python', 'Airflow', 'Data quality'],
          },
        ],
      },
      {
        label: 'iOS & design systems',
        /** Used by the discipline filter on the CV. */
        id: 'ios',
        highlights: [
          {
            text: 'Cut iOS build times by 24% through modularisation and tooling, after profiling the build graph.',
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
            text: 'Built App Intents backed by live data in a five-day hackathon and took them to production — 130,000+ events between 25 September and 7 October 2024, 120,000 of them from the lodging intent alone. Still shipping in the Expedia app.',
            tags: ['Swift', 'iOS', 'App Intents'],
          },
          {
            text: 'Created Xray, an internal debugging tool for design-system components.',
            tags: ['Swift', 'iOS', 'Developer Tooling'],
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
        text: 'Integrated a conversational virtual assistant into the banking app.',
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
    'Mentoring is continuous, and it takes different forms — meeting with more junior engineers, teaching workshops, speaking at events, and writing runbooks.',

  /** Programmes or schemes. Keep mentees anonymous unless they've agreed. */
  programmes: [] as { name: string; role: string; period: string; description: string }[],

  /** Numbers, if you ever want them — these render as animated counters. */
  stats: [] as { value: number; label: string; suffix: string }[],

  /** A quote from someone you've mentored would carry real weight here. */
  testimonials: [] as { quote: string; attribution: string }[],
};

/* ── Reading ─────────────────────────────────────────────────────────────── */

/**
 * Books worth saying out loud. Deliberately not all engineering — a shelf of
 * programming titles reads as professional development, whereas a shelf with
 * Grandin and Hawking on it says something about how you think.
 *
 * `note` is optional and appears under the title. Leave it out and the card
 * shows title, author and subject. An empty `books` array hides the section.
 */
export const reading = {
  intro:
    'Reading is what I do with most of my spare time. Mostly non-fiction — some of it about building software, most of it not.',
  books: [
    {
      title: 'The Pragmatic Programmer',
      author: 'Andrew Hunt & David Thomas',
      subject: 'Engineering',
      note: '',
    },
    { title: 'Atomic Habits', author: 'James Clear', subject: 'Behaviour', note: '' },
    { title: 'Flow', author: 'Mihaly Csikszentmihalyi', subject: 'Psychology', note: '' },
    { title: 'Contagious', author: 'Jonah Berger', subject: 'Behaviour', note: '' },
    { title: 'Lean In', author: 'Sheryl Sandberg', subject: 'Work', note: '' },
    {
      title: 'Brief Answers to the Big Questions',
      author: 'Stephen Hawking',
      subject: 'Science',
      note: '',
    },
    {
      title: 'Different Kinds of Minds',
      author: 'Temple Grandin',
      subject: 'Science',
      note: '',
    },
    { title: 'Outliers', author: 'Malcolm Gladwell', subject: 'Behaviour', note: '' },
  ],
};

/* ── Anything else ───────────────────────────────────────────────────────── */

/** Extra links for the footer. */
export const elsewhere: { label: string; href: string }[] = [];
