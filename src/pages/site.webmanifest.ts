import type { APIRoute } from 'astro';
import { siteConfig } from '@/config/site';

export const prerender = true;

export const GET: APIRoute = () => {
  const manifest = {
    name: siteConfig.identity.siteName,
    short_name: siteConfig.identity.siteName,
    description: siteConfig.seo.defaultDescription,
    lang: siteConfig.seo.language,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#fbfbfa',
    theme_color: siteConfig.seo.themeColor,
    icons: [
      { src: siteConfig.seo.favicon, sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
};
