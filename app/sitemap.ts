import type { MetadataRoute } from 'next';

const staticRoutes = ['/', '/services', '/team', '/contact', '/booking', '/portal', '/admin'];
const legalRoutes = ['/legal/impressum', '/legal/datenschutz', '/legal/agb'];

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.salon-excellence.ch';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl.replace(/\/$/, '');
  const now = new Date();
  return [...staticRoutes, ...legalRoutes].map(route => ({
    url: `${base}${route}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: route === '/' ? 1 : 0.6,
  }));
}
