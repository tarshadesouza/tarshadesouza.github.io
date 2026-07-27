# tarshadesouza.github.io

My personal site. Built with [Astro](https://astro.build), deployed free on GitHub Pages,
and it keeps its own activity feed and blog posts up to date.

**Live at https://tarshadesouza.github.io**

---

## The one file you edit

Everything written in my own voice — bio, projects, CV, talks, mentoring — lives in
**[`src/data/profile.ts`](src/data/profile.ts)**. Nothing else needs touching for
day-to-day updates.

Anything still marked `TODO` shows up on the page as an amber placeholder chip and is
counted at the end of every build, so a half-finished section can't quietly ship looking
like a finished one.

## What updates itself

| Section | Where it comes from | How often |
|---|---|---|
| Recent activity | GitHub public events — including work in **other people's** repos, which is marked as such | every build + daily |
| Contribution graph | GitHub GraphQL API | every build + daily |
| Project cards — description, stars, licence, last commit | the repositories themselves | every build + daily |
| Tech-stack badges | each repo's detected **languages** and **topics** | every build + daily |
| Latest posts | my Medium RSS feed | every build + daily |

The tech stack is never hand-written. Add a topic to a repo on GitHub and the badge
appears here on the next build.

All of it is fetched **at build time**, not in the visitor's browser: no CORS proxy, no
API key in the client, no spinners, and the page is fully rendered for search engines. If
GitHub or Medium is unavailable during a build, the last good data is reused and the
build still succeeds.

## Running it

```bash
npm install
npm run dev        # http://localhost:4321
```

Other commands:

```bash
npm run sync       # refresh the GitHub + Medium data only
npm run build      # sync, then build to dist/
npm run test       # RSS parser + GraphQL introspection queries
npm run check      # Astro + TypeScript diagnostics
npm run og         # regenerate public/og.png (the social share card)
```

`npm run sync` works without a token but GitHub's unauthenticated rate limit is low and
the contribution graph needs auth. For a full local sync:

```bash
GITHUB_TOKEN=ghp_xxx npm run sync
```

CI passes the automatic `secrets.GITHUB_TOKEN`, so no secret needs configuring.

## Weekly report

[`.github/workflows/weekly-report.yml`](.github/workflows/weekly-report.yml) emails a
digest every Monday: visitors, countries, referrers and devices from Cloudflare Web
Analytics, plus search queries, impressions, click-through rate and average position from
Google Search Console. Every figure is compared with the previous seven days.

Preview it locally without sending:

```bash
npm run report
```

It needs five repository secrets (**Settings → Secrets and variables → Actions**). Any that
are missing simply drop their section from the report rather than failing the run:

| Secret | Where it comes from |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → Create Token → *Account Analytics: Read* |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → the ID in the URL, or Account Home sidebar |
| `CLOUDFLARE_SITE_TAG` | *Optional.* Found automatically by matching the beacon token in `profile.ts` against the sites on your account — only set it to override that. |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Google Cloud → service account → JSON key, pasted whole. Add the service account's email as a user in Search Console. |
| `RESEND_API_KEY` | resend.com → API Keys |
| `REPORT_TO` | *Optional.* Defaults to the email in `profile.ts`. |

`REPORT_FROM` is optional and defaults to `onboarding@resend.dev`, Resend's shared sender.
**That sender can only deliver to the email address on your own Resend account** — sending
anywhere else fails with *"You can only send testing emails to your own email address"*.
To send to any other address, verify a domain at resend.com/domains and set `REPORT_FROM`
to an address on it.

Note that an unset secret arrives as an empty string rather than as an absent variable, so
every one of these is read through a helper that treats blank as unset — otherwise the
defaults above would never apply.

Test the whole thing without waiting for Monday: **Actions → Weekly report → Run workflow**,
with *dry run* ticked to print the report into the log instead of emailing it.

## Deployment

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and deploys on:

- every push to `main`
- a daily schedule at 06:12 UTC — this is what keeps the feeds fresh with no push
- manual runs from the Actions tab

**One-time setup:** Settings → Pages → Source → **GitHub Actions**.

### Custom domain

1. Add a `CNAME` file at the repo root containing the domain, e.g. `tarsha.dev`
2. Point the DNS at GitHub Pages
3. Update `site.url` in `src/data/profile.ts`
4. Update the `Sitemap:` line in `public/robots.txt`

## Notes on how it's built

- **No framework runtime.** Astro ships zero JavaScript by default; the only client-side
  code is [`src/scripts/motion.ts`](src/scripts/motion.ts) (~3 kB) for the scroll
  animations.
- **Motion is additive.** Every animated element is readable with JavaScript disabled,
  and all motion is disabled under `prefers-reduced-motion: reduce`.
- **One place for design decisions.** Colours, type scale, spacing and easing are tokens
  at the top of [`src/styles/global.css`](src/styles/global.css).
- **SEO.** Per-page meta, Open Graph and Twitter cards, a `Person` JSON-LD schema built
  from the profile data, a generated sitemap, and `robots.txt`.

## Licence

Code is MIT. Written content and images are © Tarsha de Souza.
