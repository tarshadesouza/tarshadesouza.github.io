#!/usr/bin/env node
/**
 * Book cover thumbnails for the reading shelf.
 *
 * Covers are fetched from Open Library at build time and written into
 * public/books/ as small WebPs, so the page serves them itself. Hotlinking
 * would put the only third-party requests on an otherwise self-contained site,
 * and would break the day someone else's CDN changed a URL.
 *
 * Nothing here is load-bearing. If Open Library is unreachable, or a title
 * doesn't resolve, the book simply has no thumbnail and the shelf falls back
 * to the drawn cover it already had. A missing picture is not a failed build.
 *
 * Every match is printed, because search-by-title can confidently return the
 * wrong edition — or the wrong book. Read the log occasionally.
 *
 *   node scripts/fetch-covers.mjs
 */

import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public/books');
const MANIFEST = resolve(ROOT, 'src/data/generated/books.json');

/** Width of the stored thumbnail. Rendered at ~76px, so this is a 2x asset. */
const WIDTH = 160;

export const slugify = (title) =>
  title
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * Reads the reading list straight out of profile.ts. A regex rather than an
 * import because profile.ts is TypeScript and this script has no build step —
 * the same approach the other sync scripts use.
 */
export function parseBooks(source) {
  const section = source.match(/export const reading = \{[\s\S]*?\n\};/)?.[0];
  if (!section) return [];

  // Strip line comments first. A `//` note between the brace and `title:` is
  // otherwise enough to drop that book silently, which is how the Durrell
  // entry disappeared without anything failing.
  const cleaned = section.replace(/^[ \t]*\/\/.*$/gm, '');

  return [...cleaned.matchAll(/\{\s*title:\s*'([^']+)',\s*author:\s*'([^']+)'/g)].map((m) => ({
    title: m[1],
    author: m[2],
  }));
}

/** Open Library's search, narrowed to the one field we need. */
async function findCoverId(title, author) {
  const url = new URL('https://openlibrary.org/search.json');
  url.searchParams.set('title', title);
  url.searchParams.set('author', author);
  url.searchParams.set('limit', '1');
  url.searchParams.set('fields', 'title,author_name,cover_i');

  const res = await fetch(url, { headers: { 'user-agent': 'tarshadesouza.github.io' } });
  if (!res.ok) throw new Error(`search HTTP ${res.status}`);

  const doc = (await res.json()).docs?.[0];
  if (!doc?.cover_i) return null;
  return { id: doc.cover_i, matched: `${doc.title} — ${doc.author_name?.[0] ?? 'unknown'}` };
}

async function download(coverId) {
  const res = await fetch(`https://covers.openlibrary.org/b/id/${coverId}-M.jpg`);
  if (!res.ok) throw new Error(`cover HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  // Open Library serves a 1x1 placeholder for records whose cover is missing.
  if (buffer.byteLength < 1000) throw new Error('placeholder image, not a real cover');
  return buffer;
}

async function main() {
  const source = await readFile(resolve(ROOT, 'src/data/profile.ts'), 'utf8');
  const books = parseBooks(source);
  if (!books.length) {
    console.log('covers: no books in profile.ts, nothing to do');
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });
  const manifest = {};
  let fetched = 0;
  let kept = 0;

  for (const book of books) {
    const slug = slugify(book.title);
    const file = resolve(OUT_DIR, `${slug}.webp`);

    // Already downloaded on a previous run: leave it alone. This is what makes
    // the script cheap to re-run and safe when the API is having a bad day.
    try {
      await access(file);
      manifest[slug] = `/books/${slug}.webp`;
      kept += 1;
      continue;
    } catch {
      /* not cached yet */
    }

    try {
      const found = await findCoverId(book.title, book.author);
      if (!found) {
        console.warn(`covers: no cover for "${book.title}" — falling back to the drawn one`);
        continue;
      }

      const jpeg = await download(found.id);
      await sharp(jpeg).resize({ width: WIDTH }).webp({ quality: 82 }).toFile(file);
      manifest[slug] = `/books/${slug}.webp`;
      fetched += 1;
      console.log(`covers: ${book.title} → ${found.matched}`);
    } catch (error) {
      console.warn(`covers: ${book.title} failed (${error.message}) — using the drawn cover`);
    }
  }

  await mkdir(dirname(MANIFEST), { recursive: true });
  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`covers: ${fetched} fetched, ${kept} already present, ${books.length} books total`);
}

// Importable for tests without running the fetch.
if (process.argv[1] && process.argv[1].endsWith('fetch-covers.mjs')) {
  await main().catch((error) => {
    // Still not load-bearing: warn and let the build continue.
    console.warn(`covers: skipped entirely (${error.message})`);
  });
}
