import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
import { siteConfig } from './src/config/site.ts';

export default defineConfig({
  site: siteConfig.seo.siteUrl,
  output: 'static',
  compressHTML: true,
  integrations: [icon()],
  build: {
    // The site has a single critical stylesheet; inlining avoids an extra
    // render-blocking request without changing the visual cascade.
    inlineStylesheets: 'always',
  },
  vite: {
    build: {
      cssMinify: true,
    },
  },
});
