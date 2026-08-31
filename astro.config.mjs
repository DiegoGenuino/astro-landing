import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
import { siteConfig } from './src/config/site.ts';

export default defineConfig({
  site: siteConfig.seo.siteUrl,
  output: 'static',
  compressHTML: true,
  integrations: [icon()],
  vite: {
    build: {
      cssMinify: true,
    },
  },
});
