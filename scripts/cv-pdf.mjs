#!/usr/bin/env node
/**
 * Prints /cv to public/tarsha-de-souza-cv.pdf.
 *
 * The PDF is generated from the same page the site builds from profile.ts, so
 * it can't drift out of step with the CV on the site — there is no second copy
 * of the content to keep in sync.
 *
 *   npm run build      # dist/ must exist first
 *   npm run cv
 *
 * The result is committed, because public/ is copied into the build: writing
 * it here and rebuilding is what puts it on the site.
 *
 * Playwright is not a dependency of this project — it's needed only by this
 * script and the OG card, both of which are run by hand. Install it when you
 * need them: npm i -D playwright && npx playwright install chromium
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');
const OUT = resolve(ROOT, 'public/tarsha-de-souza-cv.pdf');

try {
  await stat(DIST);
} catch {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(1);
}

const TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = createServer(async (req, res) => {
  let path = join(DIST, decodeURIComponent(req.url.split('?')[0]));
  if (path.endsWith('/')) path += 'index.html';
  try {
    const body = await readFile(path);
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});

await new Promise((done) => server.listen(0, done));
const { port } = server.address();

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
});
const page = await browser.newPage();
await page.goto(`http://localhost:${port}/cv/`, { waitUntil: 'networkidle' });
// Web fonts load after networkidle in some builds; a PDF with the fallback
// face in it is worse than waiting a moment.
await page.evaluate(() => document.fonts.ready);

await page.pdf({
  path: OUT,
  format: 'A4',
  printBackground: true,
  margin: { top: '14mm', bottom: '14mm', left: '15mm', right: '15mm' },
});

await browser.close();
server.close();

const { size } = await stat(OUT);
console.log(`  wrote public/tarsha-de-souza-cv.pdf (${Math.round(size / 1024)} kB)`);
