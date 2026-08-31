import type { APIRoute } from 'astro';
import { siteConfig } from '@/config/site';

export const prerender = true;

export const GET: APIRoute = () => {
  const siteUrl = siteConfig.seo.siteUrl.replace(/\/$/, '');
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `# AI-readable summary: ${siteUrl}${siteConfig.aiDiscovery.llmsPath}`,
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    `Host: ${siteUrl}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
