#!/usr/bin/env node
/**
 * Renders public/og.png — the 1200×630 card that shows up when the site is
 * shared on LinkedIn, Slack, X or in a Google result's preview.
 *
 * You only need to re-run this if your name, role or tagline changes:
 *   npx playwright install chromium   # once
 *   node scripts/og-image.mjs
 *
 * The generated PNG is committed, so the site build never depends on a browser.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const profile = await readFile(resolve(ROOT, 'src/data/profile.ts'), 'utf8');
const pick = (key) => profile.match(new RegExp(`${key}:\\s*'([^']*)'`))?.[1] ?? '';

const name = pick('name');
const role = pick('role');
const tagline = pick('tagline');
const [first, ...rest] = name.split(' ');

const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500&display=swap">
<style>
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; background: #08090c; color: #e9eaef;
    font-family: 'Inter', system-ui, sans-serif; padding: 84px; position: relative;
    display: flex; flex-direction: column; justify-content: center; overflow: hidden;
  }
  .glow {
    position: absolute; width: 780px; height: 780px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,112,77,.42), transparent 62%);
    top: -280px; right: -180px; filter: blur(28px);
  }
  .grid {
    position: absolute; inset: 0;
    background-image: linear-gradient(rgba(233,234,239,.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(233,234,239,.07) 1px, transparent 1px);
    background-size: 80px 80px;
    mask-image: radial-gradient(ellipse 70% 70% at 30% 0%, #000, transparent 75%);
  }
  .role {
    font-family: ui-monospace, monospace; font-size: 21px; letter-spacing: .22em;
    text-transform: uppercase; color: #9aa0b0; margin-bottom: 26px; position: relative;
  }
  h1 {
    font-family: 'Instrument Serif', Georgia, serif; font-weight: 400; font-size: 128px;
    line-height: .95; letter-spacing: -.02em; position: relative;
  }
  h1 em { font-style: italic; color: #ff704d; }
  p {
    font-size: 27px; color: #9aa0b0; margin-top: 34px; max-width: 760px;
    line-height: 1.45; position: relative;
  }
  .rule {
    position: absolute; left: 84px; bottom: 74px; width: 96px; height: 4px;
    background: #ff704d; border-radius: 2px;
  }
</style></head><body>
  <div class="glow"></div><div class="grid"></div>
  <div class="role">${role}</div>
  <h1>${first}<br><em>${rest.join(' ')}</em></h1>
  <p>${tagline}</p>
  <div class="rule"></div>
</body></html>`;

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'networkidle' }).catch(() => page.setContent(html));
await page.waitForTimeout(600);
await page.screenshot({ path: resolve(ROOT, 'public/og.png') });
await browser.close();

console.log('  wrote public/og.png');
