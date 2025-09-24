import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.salon-excellence.ch';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: [`${siteUrl.replace(/\/$/, '')}/sitemap.xml`],
  };
}
