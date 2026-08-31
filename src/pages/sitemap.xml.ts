import type { APIRoute } from 'astro';
import { siteConfig } from '@/config/site';

export const prerender = true;

const escapeXml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

export const GET: APIRoute = () => {
  const siteUrl = siteConfig.seo.siteUrl.replace(/\/$/, '');
  const entries = siteConfig.seo.sitemap.map(({ path, changeFrequency, priority }) => `
  <url>
    <loc>${escapeXml(new URL(path, `${siteUrl}/`).toString())}</loc>
    <changefreq>${changeFrequency}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`).join('');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}
</urlset>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
