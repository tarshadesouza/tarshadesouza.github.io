#!/usr/bin/env node
/**
 * Raster icons, generated from public/favicon.svg so there is one source of
 * truth for the mark. Re-run after editing the SVG:
 *
 *   npm run icons
 *
 * Only the Apple touch icon really needs to exist as a PNG — every browser
 * that matters takes the SVG. iOS does not, and it also ignores rounded
 * corners and applies its own mask, so the artwork is flattened onto an opaque
 * square. Transparency there renders as black on some iOS versions.
 */

import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Matches the tile colour in favicon.svg. */
const BACKGROUND = { r: 0x0e, g: 0x10, b: 0x15, alpha: 1 };

const OUTPUTS = [
  { file: 'public/apple-touch-icon.png', size: 180 },
  // Used by Android/Chrome when a visitor adds the site to their home screen.
  { file: 'public/icon-192.png', size: 192 },
  { file: 'public/icon-512.png', size: 512 },
];

const svg = await readFile(resolve(ROOT, 'public/favicon.svg'));

for (const { file, size } of OUTPUTS) {
  const info = await sharp(svg, { density: 600 })
    .resize(size, size)
    .flatten({ background: BACKGROUND })
    .png({ compressionLevel: 9 })
    .toFile(resolve(ROOT, file));
  console.log(`icons: ${file} ${info.width}×${info.height} (${info.size} bytes)`);
}
