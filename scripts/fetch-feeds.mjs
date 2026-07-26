#!/usr/bin/env node
/**
 * Pulls everything that should stay fresh without you touching it:
 *
 *   • GitHub  — repo metadata, languages, topics, your public activity across
 *               *all* repos (including other people's, so open-source
 *               contributions show up automatically), and the contribution
 *               graph.
 *   • Medium  — your latest posts, straight from the RSS feed.
 *
 * Output lands in src/data/generated/*.json, which the site imports at build
 * time. Nothing is fetched in the visitor's browser: no CORS proxies, no API
 * keys shipped to the client, no layout shift while a feed loads.
 *
 * Every fetch degrades gracefully. If GitHub rate-limits us or Medium is down,
 * the previously generated file is kept and the build carries on — the site
 * never breaks because a third party had a bad day.
 *
 * Run it yourself with `npm run sync`. CI runs it before every build and on a
 * daily schedule (.github/workflows/deploy.yml).
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFeed } from './lib/rss.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'src/data/generated');

/* Read the handful of values we need out of profile.ts without a TS runtime. */
const profileSource = await readFile(resolve(ROOT, 'src/data/profile.ts'), 'utf8');
const pick = (key) => profileSource.match(new RegExp(`${key}:\\s*'([^']*)'`))?.[1] ?? null;

const GH_USER = pick('github') ?? 'tarshadesouza';
const MEDIUM = pick('medium');
const REPOS = [...profileSource.matchAll(/repo:\s*'([^']+)'/g)].map((m) => m[1]);

const TOKEN = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? null;
const MAX_ACTIVITY = 14;
const MAX_POSTS = 6;

const headers = {
  accept: 'application/vnd.github+json',
  'user-agent': `${GH_USER}-site-build`,
  ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}),
};

let degraded = false;

async function api(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status} ${res.statusText}`);
  return res.json();
}

/* ── Repositories ────────────────────────────────────────────────────────── */

/**
 * Topics and languages become the tech-stack badges, so the stack on the site
 * is whatever the code actually is — never a list that quietly goes stale.
 */
const TOPIC_LABELS = {
  ai: 'AI',
  'ai-agent': 'AI Agents',
  api: 'API',
  ci: 'CI',
  cli: 'CLI',
  'continuous-integration': 'CI/CD',
  'github-app': 'GitHub App',
  ios: 'iOS',
  macos: 'macOS',
  llm: 'LLMs',
  swiftui: 'SwiftUI',
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  nodejs: 'Node.js',
  postgres: 'PostgreSQL',
  postgresql: 'PostgreSQL',
  graphql: 'GraphQL',
  devops: 'DevOps',
  'developer-tools': 'Developer Tools',
  'unit-testing': 'Testing',
};

const titleize = (topic) =>
  TOPIC_LABELS[topic] ??
  topic.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

/** Languages worth a badge: anything that's at least 5% of the codebase. */
function significantLanguages(languages) {
  const total = Object.values(languages).reduce((a, b) => a + b, 0);
  if (!total) return [];
  return Object.entries(languages)
    .filter(([, bytes]) => bytes / total >= 0.05)
    .sort((a, b) => b[1] - a[1])
    .map(([name, bytes]) => ({ name, share: Math.round((bytes / total) * 100) }));
}

async function fetchRepos() {
  const out = {};
  for (const full of REPOS) {
    try {
      const [repo, languages] = await Promise.all([
        api(`/repos/${full}`),
        api(`/repos/${full}/languages`).catch(() => ({})),
      ]);
      out[full] = {
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        homepage: repo.homepage || null,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        openIssues: repo.open_issues_count,
        pushedAt: repo.pushed_at,
        createdAt: repo.created_at,
        license: repo.license?.spdx_id ?? null,
        archived: repo.archived,
        topics: (repo.topics ?? []).map(titleize),
        languages: significantLanguages(languages),
      };
    } catch (error) {
      degraded = true;
      console.warn(`  ! repo ${full}: ${error.message}`);
    }
  }
  return out;
}

/* ── Activity ────────────────────────────────────────────────────────────── */

/** Turn a raw GitHub event into one readable line. */
function describeEvent(event) {
  const repo = event.repo.name;
  const p = event.payload;

  switch (event.type) {
    case 'PushEvent': {
      const n = p.distinct_size ?? p.size ?? 0;
      if (!n) return null;
      const subject = p.commits?.at(-1)?.message?.split('\n')[0] ?? '';
      return {
        verb: 'pushed',
        text: `${n} commit${n === 1 ? '' : 's'}`,
        detail: subject.slice(0, 96),
      };
    }
    case 'PullRequestEvent': {
      if (p.action === 'closed' && p.pull_request?.merged) {
        return { verb: 'merged', text: `#${p.number}`, detail: p.pull_request.title };
      }
      if (p.action !== 'opened' && p.action !== 'reopened') return null;
      return { verb: 'opened PR', text: `#${p.number}`, detail: p.pull_request?.title ?? '' };
    }
    case 'IssuesEvent':
      if (p.action !== 'opened') return null;
      return { verb: 'opened issue', text: `#${p.issue.number}`, detail: p.issue.title };
    case 'PullRequestReviewEvent':
      return { verb: 'reviewed', text: `#${p.pull_request.number}`, detail: p.pull_request.title };
    case 'ReleaseEvent':
      if (p.action !== 'published') return null;
      return { verb: 'released', text: p.release.tag_name, detail: p.release.name ?? '' };
    case 'CreateEvent':
      if (p.ref_type !== 'repository') return null;
      return { verb: 'started', text: repo.split('/')[1], detail: '' };
    case 'WatchEvent':
      return null; // starring things isn't work
    case 'ForkEvent':
      return { verb: 'forked', text: repo.split('/')[1], detail: '' };
    default:
      return null;
  }
}

async function fetchActivity() {
  const events = await api(`/users/${GH_USER}/events/public?per_page=100`);
  const seen = new Set();
  const items = [];

  for (const event of events) {
    const described = describeEvent(event);
    if (!described) continue;

    // Collapse a run of pushes to the same repo on the same day into one line.
    const day = event.created_at.slice(0, 10);
    const key = `${event.type}:${event.repo.name}:${day}`;
    if (seen.has(key)) continue;
    seen.add(key);

    items.push({
      ...described,
      repo: event.repo.name,
      repoUrl: `https://github.com/${event.repo.name}`,
      /** True when the work landed in someone else's repo. */
      external: !event.repo.name.startsWith(`${GH_USER}/`),
      at: event.created_at,
    });

    if (items.length >= MAX_ACTIVITY) break;
  }

  return items;
}

/** The contribution graph needs GraphQL, which needs a token. */
async function fetchContributions() {
  if (!TOKEN) return null;

  const query = `query($login:String!){
    user(login:$login){
      contributionsCollection{
        contributionCalendar{
          totalContributions
          weeks{ contributionDays{ contributionCount date } }
        }
      }
    }
  }`;

  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables: { login: GH_USER } }),
  });

  if (!res.ok) throw new Error(`GraphQL → ${res.status}`);
  const body = await res.json();
  const calendar = body.data?.user?.contributionsCollection?.contributionCalendar;
  if (!calendar) throw new Error('no calendar in response');

  const days = calendar.weeks.flatMap((w) => w.contributionDays);
  const busiest = Math.max(...days.map((d) => d.contributionCount), 1);

  return {
    total: calendar.totalContributions,
    // Keep the last 26 weeks — a full year is unreadable on a phone.
    days: days.slice(-182).map((d) => ({
      date: d.date,
      count: d.contributionCount,
      level: d.contributionCount === 0 ? 0 : Math.min(4, Math.ceil((d.contributionCount / busiest) * 4)),
    })),
  };
}

/* ── Medium ──────────────────────────────────────────────────────────────── */

async function fetchMedium() {
  if (!MEDIUM || MEDIUM.startsWith('TODO')) return [];

  const res = await fetch(`https://medium.com/feed/${MEDIUM}`, {
    headers: { 'user-agent': `${GH_USER}-site-build`, accept: 'application/rss+xml' },
  });
  if (!res.ok) throw new Error(`Medium feed → ${res.status}`);

  return parseFeed(await res.text(), MAX_POSTS);
}

/* ── Write, keeping the last good copy on failure ────────────────────────── */

async function persist(file, produce, fallback) {
  const path = resolve(OUT_DIR, file);
  try {
    const data = await produce();
    await writeFile(path, JSON.stringify(data, null, 2) + '\n');
    return data;
  } catch (error) {
    degraded = true;
    console.warn(`  ! ${file}: ${error.message}`);
    if (existsSync(path)) {
      console.warn(`    keeping the previously generated ${file}`);
      return JSON.parse(await readFile(path, 'utf8'));
    }
    await writeFile(path, JSON.stringify(fallback, null, 2) + '\n');
    return fallback;
  }
}

await mkdir(OUT_DIR, { recursive: true });

console.log(`\n  syncing for @${GH_USER}${TOKEN ? '' : '  (no token — rate limits apply)'}\n`);

const github = await persist(
  'github.json',
  async () => ({
    fetchedAt: new Date().toISOString(),
    repos: await fetchRepos(),
    activity: await fetchActivity(),
    contributions: await fetchContributions().catch((error) => {
      console.warn(`  ! contributions: ${error.message}`);
      return null;
    }),
  }),
  { fetchedAt: null, repos: {}, activity: [], contributions: null },
);

const medium = await persist('medium.json', fetchMedium, []);

console.log(`  repos       ${Object.keys(github.repos).length}`);
console.log(`  activity    ${github.activity.length} events`);
console.log(`  posts       ${medium.length}`);
console.log(`  graph       ${github.contributions ? `${github.contributions.total} contributions` : 'skipped'}`);

/* Surface anything in profile.ts that is still a placeholder. */
const todos = [...profileSource.matchAll(/TODO\(\s*\n?\s*['"]([^'"]+)/g)].length +
  [...profileSource.matchAll(/'TODO: [^']+'/g)].length;
if (todos) console.log(`\n  ⚠ ${todos} placeholder${todos === 1 ? '' : 's'} still to fill in src/data/profile.ts`);
console.log(degraded ? '\n  finished with warnings\n' : '\n  done\n');
