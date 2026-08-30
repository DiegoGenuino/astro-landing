import { defineConfig } from 'astro/config';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://ferreiradefesa.com.br',
  output: 'static',
  integrations: [icon()],
  vite: {
    build: {
      cssMinify: true,
    },
  },
});
