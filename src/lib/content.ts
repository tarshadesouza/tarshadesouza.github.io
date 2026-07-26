import githubData from '../data/generated/github.json';
import mediumData from '../data/generated/medium.json';

/* ── Types for the generated feeds ───────────────────────────────────────── */

export interface Repo {
  name: string;
  full_name: string;
  description: string | null;
  url: string;
  homepage: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  pushedAt: string;
  createdAt: string;
  license: string | null;
  archived: boolean;
  topics: string[];
  languages: { name: string; share?: number }[];
}

export type EventKind =
  | 'commit'
  | 'pr'
  | 'merge'
  | 'issue'
  | 'review'
  | 'release'
  | 'repo'
  | 'fork';

export type EventState = 'merged' | 'open' | 'closed' | 'released' | 'new' | null;

export interface ActivityItem {
  kind: EventKind;
  state: EventState;
  /** "merged pull request", "pushed 3 commits" … */
  verb: string;
  /** The commit subject, PR title or issue title. */
  title: string;
  number?: number;
  branch?: string | null;
  count?: number;
  tag?: string;
  repo: string;
  repoUrl: string;
  url: string;
  external: boolean;
  at: string;
}

/** One row per repository touched recently, rolled up from the timeline. */
export interface ProjectActivity {
  repo: string;
  url: string;
  external: boolean;
  commits: number;
  pullRequests: number;
  issues: number;
  releases: number;
  lastAt: string;
}

export interface Account {
  login: string;
  name: string | null;
  avatar: string;
  bio: string | null;
  publicRepos: number;
  followers: number;
  joined: string;
}

export interface Post {
  title: string;
  url: string;
  publishedAt: string;
  excerpt: string;
  tags: string[];
  readingMinutes: number;
}

export const github = githubData as unknown as {
  fetchedAt: string | null;
  account: Account | null;
  repos: Record<string, Repo>;
  activity: ActivityItem[];
  projects: ProjectActivity[];
  contributions: {
    total: number;
    days: { date: string; count: number; level: number }[];
  } | null;
};

/** Totals for the dashboard tiles, all derived — nothing hand-maintained. */
export function dashboardStats() {
  const repos = Object.values(github.repos);
  const merged = github.activity.filter((item) => item.state === 'merged').length;
  const commits = github.activity
    .filter((item) => item.kind === 'commit')
    .reduce((total, item) => total + (item.count ?? 1), 0);

  return {
    contributions: github.contributions?.total ?? null,
    stars: repos.reduce((total, repo) => total + repo.stars, 0),
    publicRepos: github.account?.publicRepos ?? repos.length,
    mergedPRs: merged,
    recentCommits: commits,
    /** Repos touched recently that aren't mine — the open-source signal. */
    externalRepos: new Set(
      github.activity.filter((item) => item.external).map((item) => item.repo),
    ).size,
  };
}

export const posts = mediumData as unknown as Post[];

/* ── Placeholders ────────────────────────────────────────────────────────── */

/**
 * Content still marked TODO renders as a visible amber chip rather than
 * silently shipping filler text that reads as if it were real.
 */
export const isTodo = (value: unknown): value is string =>
  typeof value === 'string' && value.startsWith('TODO');

export const todoText = (value: string) => value.replace(/^TODO:?\s*/, '');

/** Drops entries whose every meaningful field is still a placeholder. */
export function realOnly<T extends object>(items: T[], ...keys: (keyof T)[]): T[] {
  return items.filter((item) => keys.some((key) => !isTodo(item[key])));
}

/* ── Formatting ──────────────────────────────────────────────────────────── */

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';

  const seconds = Math.round((Date.now() - then) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];

  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [unit, size] of units) {
    if (seconds >= size) return formatter.format(-Math.floor(seconds / size), unit);
  }
  return 'just now';
}

export const plural = (count: number, word: string, suffix = 's') =>
  `${count} ${word}${count === 1 ? '' : suffix}`;

export function monthYear(value: string): string {
  // Checked directly rather than via isTodo(), whose type guard would narrow
  // an already-string argument to `never` in the branch below.
  if (value.startsWith('TODO')) return todoText(value);
  // A bare year stays a bare year — parsing it would invent a January.
  if (/^\d{4}$/.test(value)) return value;
  const date = new Date(value.length === 7 ? `${value}-01` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

/* ── Tech stack ──────────────────────────────────────────────────────────── */

/** GitHub's own language colours, so the badges read as familiar. */
const LANGUAGE_COLOURS: Record<string, string> = {
  Swift: '#F05138',
  TypeScript: '#3178C6',
  JavaScript: '#F1E05A',
  Python: '#3572A5',
  Kotlin: '#A97BFF',
  Java: '#B07219',
  'Objective-C': '#438EFF',
  Ruby: '#701516',
  Go: '#00ADD8',
  Rust: '#DEA584',
  HTML: '#E34C26',
  CSS: '#563D7C',
  Shell: '#89E051',
  Dart: '#00B4AB',
  C: '#555555',
  'C++': '#F34B7D',
  Astro: '#FF5D01',
  Vue: '#41B883',
  SCSS: '#C6538C',
};

export const languageColour = (name: string) => LANGUAGE_COLOURS[name] ?? null;

/**
 * The full badge list for a project: languages GitHub detected, plus the repo
 * topics, plus anything hand-added in profile.ts that GitHub can't see
 * (databases, hosting, queues). Deduplicated, languages first.
 */
export function stackFor(repo: Repo | undefined, extra: string[] = []) {
  const seen = new Set<string>();
  const badges: { label: string; colour: string | null }[] = [];

  const add = (label: string, colour: string | null) => {
    const key = label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    badges.push({ label, colour });
  };

  repo?.languages.forEach((lang) => add(lang.name, languageColour(lang.name)));
  repo?.topics.forEach((topic) => add(topic, null));
  extra.forEach((item) => add(item, languageColour(item)));

  return badges;
}

/** Every technology mentioned anywhere, for the "what I work with" strip. */
export function allTech(extras: string[][] = []): string[] {
  const seen = new Map<string, number>();
  for (const repo of Object.values(github.repos)) {
    repo.languages.forEach((l) => seen.set(l.name, (seen.get(l.name) ?? 0) + 3));
    repo.topics.forEach((t) => seen.set(t, (seen.get(t) ?? 0) + 1));
  }
  for (const extra of extras) {
    extra.forEach((item) => seen.set(item, (seen.get(item) ?? 0) + 2));
  }
  return [...seen.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
}
