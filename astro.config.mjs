// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { site } from './src/data/profile.ts';

export default defineConfig({
  site: site.url,
  integrations: [sitemap({ lastmod: new Date() })],
  build: { inlineStylesheets: 'auto' },
  compressHTML: true,
});
