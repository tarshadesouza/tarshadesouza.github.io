#!/usr/bin/env node
/**
 * The Monday morning email: who visited the site last week, where they came
 * from, and what they searched to find it.
 *
 * Two sources, because neither tells the whole story on its own:
 *
 *   • Cloudflare Web Analytics (GraphQL) — the people who actually arrived.
 *     Visits, countries, referrers, devices, browsers, most-read sections.
 *   • Google Search Console (REST) — the people who saw you in search but may
 *     not have clicked. The queries, impressions, click-through rate and
 *     average position. This is the half that tells you what you rank for.
 *
 * Each block is fetched independently and failures are contained: if the
 * Cloudflare token expires, you still get the search half, with a line saying
 * what broke. A report that arrives partial beats one that doesn't arrive.
 *
 * Every number is compared with the previous seven days, because a count on
 * its own ("31 visits") means far less than its direction.
 *
 *   node scripts/weekly-report.mjs --dry-run   # print, don't send
 *   npm run report                             # same
 *
 * Environment (all set as GitHub Actions secrets):
 *   CLOUDFLARE_API_TOKEN       Account Analytics → Read
 *   CLOUDFLARE_ACCOUNT_ID      dash.cloudflare.com → right-hand sidebar
 *   CLOUDFLARE_SITE_TAG        optional — looked up automatically by matching the
 *                              beacon token in profile.ts against your sites
 *   GOOGLE_SERVICE_ACCOUNT_JSON  the whole key file, pasted in
 *   RESEND_API_KEY             resend.com → API keys
 *   REPORT_TO                  where to send it
 *   REPORT_FROM                optional; defaults to Resend's shared sender
 */

import { readFile } from 'node:fs/promises';
import { createSign } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DRY_RUN = process.argv.includes('--dry-run');

const {
  CLOUDFLARE_API_TOKEN,
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_SITE_TAG,
  GOOGLE_SERVICE_ACCOUNT_JSON,
  RESEND_API_KEY,
  REPORT_TO,
  REPORT_FROM = 'onboarding@resend.dev',
} = process.env;

/* Site URL comes from the same profile.ts that drives the site. */
const profileSource = await readFile(resolve(ROOT, 'src/data/profile.ts'), 'utf8');
const SITE_URL = profileSource.match(/url:\s*'([^']+)'/)?.[1] ?? 'https://tarshadesouza.github.io';
/** The beacon token already in the site's HTML — used to find the site tag. */
const BEACON_TOKEN = profileSource.match(/id:\s*'([0-9a-f]{32})'/)?.[1] ?? null;

/* ── Dates ───────────────────────────────────────────────────────────────── */

const DAY = 86_400_000;
const iso = (d) => d.toISOString().slice(0, 10);
const now = new Date();

const period = {
  start: new Date(now.getTime() - 7 * DAY),
  end: now,
  label: `${iso(new Date(now.getTime() - 7 * DAY))} → ${iso(now)}`,
};
const previous = {
  start: new Date(now.getTime() - 14 * DAY),
  end: new Date(now.getTime() - 7 * DAY),
};

const problems = [];

/* ── Cloudflare Web Analytics ────────────────────────────────────────────── */

/**
 * "Authentication error" from Cloudflare is ambiguous — it covers a bad token,
 * a token without the right permission, and the wrong account. Ask the token
 * verify endpoint which it is, so the log says what to actually change.
 */
/**
 * Three different Cloudflare hex strings get confused for each other during
 * setup. Their shapes differ, so say which one appears to have been pasted
 * rather than leaving it to guesswork.
 */
function describeCredential() {
  const value = (CLOUDFLARE_API_TOKEN ?? '').trim();
  const create =
    'create one at My Profile → API Tokens → Create Token → Custom, with Account · Account Analytics · Read';

  if (value !== CLOUDFLARE_API_TOKEN) {
    return `the secret has leading or trailing whitespace — re-paste it without a stray newline`;
  }
  if (value === BEACON_TOKEN) {
    return `that is the Web Analytics beacon token from the site's HTML, not an API token. ${create}`;
  }
  if (/^[0-9a-f]{32}$/.test(value)) {
    return `that looks like a Web Analytics beacon token (32 hex characters), not an API token. ${create}`;
  }
  if (/^[0-9a-f]{37}$/.test(value)) {
    return `that looks like a Global API Key (37 hex characters), which this API does not accept. ${create}`;
  }
  if (/^[0-9a-f]{32,40}$/.test(value)) {
    return `that looks like an account ID or another hex identifier rather than an API token. ${create}`;
  }
  return `it does not look like a valid API token. ${create}`;
}

async function explainCloudflareAuth() {
  try {
    const res = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
      headers: { authorization: `Bearer ${CLOUDFLARE_API_TOKEN}` },
    });
    const body = await res.json();

    if (res.ok && body.success) {
      return (
        'the token itself is valid, so it is missing the permission or pointing at the wrong ' +
        'account — it needs Account · Account Analytics · Read, and CLOUDFLARE_ACCOUNT_ID must ' +
        'be the account that owns the Web Analytics site'
      );
    }
    return `the credential was rejected outright — ${describeCredential()}`;
  } catch {
    return 'could not reach the token verify endpoint to say why';
  }
}

async function cloudflareQuery(query) {
  const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    // A 403 here carries its reason in the body; losing it leaves you staring
    // at a status code.
    const first = body.errors?.[0];
    throw new Error(`GraphQL HTTP ${res.status}${first?.message ? ` — ${first.message}` : ''}`);
  }
  if (body.errors?.length) {
    throw new Error(
      body.errors.map((e) => `${e.message}${e.extensions?.code ? ` [${e.extensions.code}]` : ''}`).join('; '),
    );
  }
  return body.data?.viewer?.accounts?.[0] ?? {};
}

/**
 * The GraphQL analytics API wants a *site tag*, which is not the beacon token
 * in the page and isn't shown anywhere obvious in the dashboard. Rather than
 * make you hunt for it, look it up: the RUM site list returns both, so the
 * site whose token matches the one in profile.ts is by definition the right
 * one — which also side-steps the confusion of several sites on one hostname.
 */
async function resolveSiteTag() {
  if (CLOUDFLARE_SITE_TAG) return CLOUDFLARE_SITE_TAG;

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/rum/site_info/list`,
    { headers: { authorization: `Bearer ${CLOUDFLARE_API_TOKEN}` } },
  );
  const body = await res.json();
  if (!res.ok || !body.success) {
    const first = body.errors?.[0];
    throw new Error(
      `site list: ${first?.message ?? `HTTP ${res.status}`}${first?.code ? ` [code ${first.code}]` : ''}`,
    );
  }

  const sites = body.result ?? [];
  const host = new URL(SITE_URL).host;

  const byToken = BEACON_TOKEN && sites.find((s) => s.site_token === BEACON_TOKEN);
  if (byToken) return byToken.site_tag;

  // No token match — fall back to the hostname, taking the busiest if the
  // dashboard has duplicates for it.
  const byHost = sites.filter((s) => JSON.stringify(s).includes(host));
  if (byHost.length === 1) return byHost[0].site_tag;
  if (byHost.length > 1) {
    problems.push(
      `${byHost.length} Cloudflare sites match ${host}; using the first. Delete the spares, or set CLOUDFLARE_SITE_TAG.`,
    );
    return byHost[0].site_tag;
  }

  throw new Error(`no Cloudflare site found for ${host} (${sites.length} site(s) on the account)`);
}

let siteTag = null;

const q = (value) => JSON.stringify(value);

/**
 * The filter is inlined rather than passed as a typed GraphQL variable: the
 * name of its input type differs between Cloudflare's datasets, and naming it
 * wrong fails the entire query. Everything interpolated here is ours — an
 * account id, a site tag from their API, and two ISO timestamps.
 */
const filterLiteral = (start, end) =>
  `{ siteTag: ${q(siteTag)}, datetime_geq: ${q(start.toISOString())}, datetime_leq: ${q(end.toISOString())} }`;

async function cloudflareTotals(start, end) {
  const build = (metrics) => `{
    viewer {
      accounts(filter: { accountTag: ${q(CLOUDFLARE_ACCOUNT_ID)} }) {
        rumPageloadEventsAdaptiveGroups(limit: 1, filter: ${filterLiteral(start, end)}) {
          ${metrics}
        }
      }
    }
  }`;

  let data;
  try {
    data = await cloudflareQuery(build('count\n          sum { visits }'));
  } catch (error) {
    // `visits` isn't present on every dataset version. Page views alone still
    // makes a useful headline, so degrade rather than lose the whole section —
    // but only for that specific complaint. Anything else (auth, a bad site
    // tag) would fail the retry too, and reporting it as a missing metric
    // would send you looking in the wrong place.
    if (!/visits|sum/i.test(error.message)) throw error;
    problems.push(
      `Cloudflare visit counts unavailable (${error.message}); reporting page views only`,
    );
    data = await cloudflareQuery(build('count'));
  }

  const row = data.rumPageloadEventsAdaptiveGroups?.[0];
  return { pageViews: row?.count ?? 0, visits: row?.sum?.visits ?? row?.count ?? 0 };
}

/**
 * Each breakdown is its own request. If Cloudflare renames a dimension, one
 * table goes missing and says so, instead of the whole report failing.
 */
const BREAKDOWNS = [
  { key: 'countryName', title: 'Where they were' },
  { key: 'refererHost', title: 'How they got here' },
  { key: 'deviceType', title: 'On what' },
  { key: 'userAgentBrowser', title: 'In which browser' },
  { key: 'requestPath', title: 'Most-read pages' },
];

async function cloudflareBreakdown(dimension, start, end) {
  const data = await cloudflareQuery(`{
    viewer {
      accounts(filter: { accountTag: ${q(CLOUDFLARE_ACCOUNT_ID)} }) {
        rumPageloadEventsAdaptiveGroups(
          limit: 8
          filter: ${filterLiteral(start, end)}
          orderBy: [count_DESC]
        ) {
          count
          dimensions { ${dimension} }
        }
      }
    }
  }`);

  return (data.rumPageloadEventsAdaptiveGroups ?? []).map((row) => ({
    label: row.dimensions?.[dimension] || '(direct / unknown)',
    value: row.count ?? 0,
  }));
}

async function collectCloudflare() {
  if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
    problems.push('Cloudflare skipped — CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID not set');
    return null;
  }

  try {
    siteTag = await resolveSiteTag();

    const [current, prior] = await Promise.all([
      cloudflareTotals(period.start, period.end),
      cloudflareTotals(previous.start, previous.end).catch(() => null),
    ]);

    const tables = [];
    for (const { key, title } of BREAKDOWNS) {
      try {
        const rows = await cloudflareBreakdown(key, period.start, period.end);
        if (rows.length) tables.push({ title, rows });
      } catch (error) {
        problems.push(`Cloudflare "${title}" unavailable: ${error.message}`);
      }
    }

    return { current, prior, tables };
  } catch (error) {
    const why = /auth/i.test(error.message) ? ` — ${await explainCloudflareAuth()}` : '';
    problems.push(`Cloudflare unavailable: ${error.message}${why}`);
    return null;
  }
}

/* ── Google Search Console ───────────────────────────────────────────────── */

/** Service-account JWT → access token, signed with node's crypto. No deps. */
async function googleAccessToken(credentials) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const issued = Math.floor(Date.now() / 1000);
  const claim = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: issued + 3600,
    iat: issued,
  };

  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsigned = `${b64(header)}.${b64(claim)}`;
  const signature = createSign('RSA-SHA256')
    .update(unsigned)
    .sign(credentials.private_key, 'base64url');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  });

  const body = await res.json();
  if (!res.ok) throw new Error(body.error_description || body.error || `HTTP ${res.status}`);
  return body.access_token;
}

async function searchAnalytics(token, dimensions, start, end, rowLimit = 10) {
  const site = encodeURIComponent(SITE_URL.endsWith('/') ? SITE_URL : `${SITE_URL}/`);
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${site}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ startDate: iso(start), endDate: iso(end), dimensions, rowLimit }),
    },
  );

  const body = await res.json();
  if (!res.ok) throw new Error(body.error?.message || `HTTP ${res.status}`);
  return body.rows ?? [];
}

const sumRows = (rows) =>
  rows.reduce(
    (acc, r) => ({
      clicks: acc.clicks + (r.clicks ?? 0),
      impressions: acc.impressions + (r.impressions ?? 0),
      position: acc.position + (r.position ?? 0) * (r.impressions ?? 0),
    }),
    { clicks: 0, impressions: 0, position: 0 },
  );

async function collectSearch() {
  if (!GOOGLE_SERVICE_ACCOUNT_JSON) {
    problems.push('Search Console skipped — GOOGLE_SERVICE_ACCOUNT_JSON not set');
    return null;
  }

  try {
    const credentials = JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON);
    const token = await googleAccessToken(credentials);

    const [queries, countries, devices, pages, priorTotals] = await Promise.all([
      searchAnalytics(token, ['query'], period.start, period.end),
      searchAnalytics(token, ['country'], period.start, period.end),
      searchAnalytics(token, ['device'], period.start, period.end),
      searchAnalytics(token, ['page'], period.start, period.end, 5),
      searchAnalytics(token, [], previous.start, previous.end).catch(() => []),
    ]);

    const totals = sumRows(queries);
    const prior = sumRows(priorTotals);

    return {
      totals: {
        clicks: totals.clicks,
        impressions: totals.impressions,
        ctr: totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0,
        position: totals.impressions ? totals.position / totals.impressions : 0,
      },
      prior,
      queries,
      countries,
      devices,
      pages,
    };
  } catch (error) {
    problems.push(`Search Console unavailable: ${error.message}`);
    return null;
  }
}

/* ── Rendering ───────────────────────────────────────────────────────────── */

const pct = (current, before) => {
  if (!before) return current ? '(new)' : '';
  const change = Math.round(((current - before) / before) * 100);
  if (change === 0) return '(level)';
  return change > 0 ? `(▲ ${change}%)` : `(▼ ${Math.abs(change)}%)`;
};

const bar = (value, max) => '█'.repeat(Math.max(1, Math.round((value / (max || 1)) * 18)));

const clicks = (n) => `${n} click${n === 1 ? '' : 's'}`;

function renderText(cloudflare, search) {
  const out = [`Weekly report · ${period.label}`, '='.repeat(46), ''];

  if (cloudflare) {
    const { current, prior, tables } = cloudflare;
    out.push('VISITORS (Cloudflare)');
    out.push(`  ${current.visits} visits ${prior ? pct(current.visits, prior.visits) : ''}`);
    out.push(`  ${current.pageViews} page views ${prior ? pct(current.pageViews, prior.pageViews) : ''}`);
    out.push('');

    for (const table of tables) {
      const max = Math.max(...table.rows.map((r) => r.value));
      out.push(`  ${table.title}`);
      for (const row of table.rows) {
        out.push(`    ${String(row.value).padStart(4)}  ${bar(row.value, max).padEnd(19)} ${row.label}`);
      }
      out.push('');
    }
  }

  if (search) {
    const { totals, prior, queries, countries, devices, pages } = search;
    out.push('SEARCH (Google)');
    out.push(`  ${clicks(totals.clicks)} ${pct(totals.clicks, prior.clicks)}`);
    out.push(`  ${totals.impressions} impressions ${pct(totals.impressions, prior.impressions)}`);
    out.push(`  ${totals.ctr.toFixed(1)}% click-through · average position ${totals.position.toFixed(1)}`);
    out.push('');

    if (queries.length) {
      out.push('  What they searched');
      for (const row of queries) {
        out.push(`    ${clicks(row.clicks).padStart(9)} / ${String(row.impressions).padStart(4)} seen  "${row.keys[0]}"  (pos ${row.position.toFixed(0)})`);
      }
      out.push('');
    }

    for (const [title, rows] of [['Where from', countries], ['On what', devices], ['Which page', pages]]) {
      if (!rows.length) continue;
      out.push(`  ${title}`);
      for (const row of rows.slice(0, 8)) {
        out.push(`    ${clicks(row.clicks).padStart(9)} / ${String(row.impressions).padStart(4)} seen  ${row.keys[0]}`);
      }
      out.push('');
    }
  }

  if (problems.length) {
    out.push('NOTES');
    problems.forEach((p) => out.push(`  · ${p}`));
    out.push('');
  }

  if (!cloudflare && !search) {
    out.push('No data sources are configured yet — see scripts/weekly-report.mjs for the');
    out.push('environment variables this needs.');
  }

  return out.join('\n');
}

function renderHtml(cloudflare, search) {
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  const css = {
    body: 'margin:0;padding:24px;background:#08090c;color:#e9eaef;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.6',
    wrap: 'max-width:640px;margin:0 auto',
    h1: 'font-size:22px;margin:0 0 4px;font-weight:600',
    sub: 'color:#6b7183;font-size:13px;margin:0 0 28px',
    h2: 'font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#ff704d;margin:32px 0 12px;font-weight:600',
    big: 'font-size:30px;font-weight:600;color:#fff;margin:0',
    label: 'color:#9aa0b0;font-size:13px',
    delta: 'color:#6b7183;font-size:12px;margin-left:6px',
    table: 'width:100%;border-collapse:collapse;margin:8px 0 4px;font-size:13px',
    th: 'text-align:left;color:#6b7183;font-weight:400;font-size:11px;text-transform:uppercase;letter-spacing:.08em;padding:6px 0;border-bottom:1px solid #23252c',
    td: 'padding:7px 0;border-bottom:1px solid #16181d;color:#c9ccd6',
    num: 'padding:7px 0;border-bottom:1px solid #16181d;color:#fff;text-align:right;white-space:nowrap',
    note: 'color:#8b7040;font-size:12px;background:#1a1608;border:1px solid #2e2510;border-radius:8px;padding:12px;margin-top:28px',
  };

  const table = (head, rows) => `
    <table style="${css.table}">
      <tr>${head.map((h) => `<th style="${css.th}">${esc(h)}</th>`).join('')}</tr>
      ${rows
        .map(
          (r) =>
            `<tr>${r
              .map((cell, i) => `<td style="${i === 0 ? css.td : css.num}">${esc(cell)}</td>`)
              .join('')}</tr>`,
        )
        .join('')}
    </table>`;

  let html = `<div style="${css.body}"><div style="${css.wrap}">
    <h1 style="${css.h1}">Your week on ${esc(SITE_URL.replace('https://', ''))}</h1>
    <p style="${css.sub}">${esc(period.label)}</p>`;

  if (cloudflare) {
    const { current, prior, tables } = cloudflare;
    html += `<h2 style="${css.h2}">Visitors</h2>
      <p style="${css.big}">${current.visits}<span style="${css.delta}">${prior ? esc(pct(current.visits, prior.visits)) : ''}</span></p>
      <p style="${css.label}">visits · ${current.pageViews} page views ${prior ? esc(pct(current.pageViews, prior.pageViews)) : ''}</p>`;

    for (const t of tables) {
      html += `<h2 style="${css.h2}">${esc(t.title)}</h2>`;
      html += table(['', 'views'], t.rows.map((r) => [r.label, r.value]));
    }
  }

  if (search) {
    const { totals, prior, queries, countries, devices } = search;
    html += `<h2 style="${css.h2}">Found in search</h2>
      <p style="${css.big}">${totals.clicks}<span style="${css.delta}">${esc(pct(totals.clicks, prior.clicks))}</span></p>
      <p style="${css.label}">clicks from ${totals.impressions} impressions ${esc(pct(totals.impressions, prior.impressions))} · ${totals.ctr.toFixed(1)}% CTR · avg position ${totals.position.toFixed(1)}</p>`;

    if (queries.length) {
      html += `<h2 style="${css.h2}">What they searched</h2>`;
      html += table(
        ['query', 'clicks', 'seen', 'pos'],
        queries.map((r) => [r.keys[0], r.clicks, r.impressions, r.position.toFixed(0)]),
      );
    }
    if (countries.length) {
      html += `<h2 style="${css.h2}">Where from</h2>`;
      html += table(['country', 'clicks', 'seen'], countries.slice(0, 8).map((r) => [r.keys[0], r.clicks, r.impressions]));
    }
    if (devices.length) {
      html += `<h2 style="${css.h2}">On what</h2>`;
      html += table(['device', 'clicks', 'seen'], devices.map((r) => [r.keys[0], r.clicks, r.impressions]));
    }
  }

  if (!cloudflare && !search) {
    html += `<p style="${css.label}">No data sources are configured yet.</p>`;
  }

  if (problems.length) {
    html += `<div style="${css.note}">${problems.map((p) => esc(p)).join('<br>')}</div>`;
  }

  return `${html}</div></div>`;
}

/* ── Send ────────────────────────────────────────────────────────────────── */

async function send(subject, html, text) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: REPORT_FROM, to: [REPORT_TO], subject, html, text }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || `Resend HTTP ${res.status}`);
  return body.id;
}

/* ── Schema introspection ────────────────────────────────────────────────── */

/**
 * `--introspect` asks Cloudflare's GraphQL API what it actually offers, and
 * prints it. Cloudflare's analytics schema varies by account and plan, and
 * their docs lag it, so this replaces guessing at field names with reading
 * them. Run it from the Actions tab and paste the output.
 */
async function introspect() {
  const named = (type) => {
    let t = type;
    while (t && !t.name) t = t.ofType;
    return t?.name ?? '(unnamed)';
  };

  console.log('Cloudflare GraphQL schema\n' + '='.repeat(46));

  const account = await cloudflareQueryRaw(
    '{ __type(name: "Account") { fields { name type { name kind ofType { name kind ofType { name } } } } } }',
  );
  const fields = account?.__type?.fields ?? [];
  const rum = fields.filter((f) => /rum/i.test(f.name));

  console.log(`\nAccount fields mentioning RUM (${rum.length} of ${fields.length} total):`);
  rum.forEach((f) => console.log(`  ${f.name}  →  ${named(f.type)}`));

  if (!rum.length) {
    console.log('  none — this account may not expose Web Analytics over GraphQL');
    return;
  }

  // Walk into the dataset we intend to use, or the first RUM one available.
  const chosen = rum.find((f) => f.name === 'rumPageloadEventsAdaptiveGroups') ?? rum[0];
  const groupType = named(chosen.type);
  console.log(`\nInspecting ${chosen.name} (${groupType})`);

  const group = await cloudflareQueryRaw(
    `{ __type(name: ${q(groupType)}) { fields { name type { name kind ofType { name kind ofType { name } } } } } }`,
  );
  const groupFields = group?.__type?.fields ?? [];
  console.log('  metrics / selections:');
  groupFields.forEach((f) => console.log(`    ${f.name}  →  ${named(f.type)}`));

  for (const wanted of ['dimensions', 'sum']) {
    const field = groupFields.find((f) => f.name === wanted);
    if (!field) continue;
    const typeName = named(field.type);
    const sub = await cloudflareQueryRaw(`{ __type(name: ${q(typeName)}) { fields { name } } }`);
    const names = (sub?.__type?.fields ?? []).map((f) => f.name);
    console.log(`\n  ${wanted} (${typeName}) — ${names.length} available:`);
    console.log('    ' + names.join(', '));
  }
}

/** Introspection needs the raw data envelope, not viewer.accounts[0]. */
async function cloudflareQueryRaw(query) {
  const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  const body = await res.json();
  if (body.errors?.length) throw new Error(body.errors.map((e) => e.message).join('; '));
  return body.data;
}

if (process.argv.includes('--introspect')) {
  if (!CLOUDFLARE_API_TOKEN) {
    console.error('CLOUDFLARE_API_TOKEN is not set');
    process.exit(1);
  }
  await introspect().catch((error) => {
    console.error(`introspection failed: ${error.message}`);
    process.exit(1);
  });
  process.exit(0);
}

/* ── Run ─────────────────────────────────────────────────────────────────── */

const [cloudflare, search] = await Promise.all([collectCloudflare(), collectSearch()]);

const text = renderText(cloudflare, search);
const html = renderHtml(cloudflare, search);
const subject = cloudflare
  ? `Your week: ${cloudflare.current.visits} visits${search ? `, ${search.totals.clicks} from search` : ''}`
  : 'Your weekly site report';

if (DRY_RUN || !RESEND_API_KEY || !REPORT_TO) {
  console.log(text);
  if (!DRY_RUN) console.log('\n(not sent — RESEND_API_KEY or REPORT_TO missing)');
} else {
  const id = await send(subject, html, text);
  console.log(text);
  console.log(`\nSent to ${REPORT_TO} (${id})`);
}

// A missing credential is a setup problem, not a broken build: report it in
// the log and the email, but don't fail the workflow and send a red X every
// Monday morning.
if (problems.length) console.warn(`\n${problems.length} note(s):\n  ${problems.join('\n  ')}`);
