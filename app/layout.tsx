import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import Script from 'next/script';
import './globals.css';
import { Playfair_Display, Source_Sans_3 } from 'next/font/google';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

const sans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const serif = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'SALON EXCELLENCE',
    template: '%s | SALON EXCELLENCE',
  },
  description:
    'Boutique Coiffeur-Erlebnisse in Zürich mit exzellentem Service, sicherer Online-Buchung und Zahlung in CHF.',
  keywords: ['Coiffeur', 'Salon', 'Zürich', 'Beauty', 'Online Buchung'],
  authors: [{ name: 'SALON EXCELLENCE' }],
  openGraph: {
    title: 'SALON EXCELLENCE – Premium Hair Atelier in Zürich',
    description:
      'Buche individuelle Beauty-Treatments mit zertifizierten Stylist:innen. Online-Zahlung und Verfügbarkeiten in Echtzeit.',
    type: 'website',
    locale: 'de_CH',
    url: siteUrl,
    siteName: 'SALON EXCELLENCE',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SALON EXCELLENCE',
    description:
      'Premium Beauty-Salon in Zürich mit smarter Terminplanung, Stripe-Zahlungen und kantonalen Feiertagen im Blick.',
  },
  alternates: {
    canonical: '/',
  },
};

export const viewport: Viewport = {
  themeColor: '#6d28d9',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const headerList = headers();
  const nonce = headerList.get('x-csp-nonce') ?? undefined;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'HairSalon',
    name: 'Salon Excellence',
    url: siteUrl,
    '@id': `${siteUrl}/#salon-excellence`,
    telephone: '+41 44 123 45 67',
    priceRange: '$$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Limmatquai 12',
      postalCode: '8001',
      addressLocality: 'Zürich',
      addressRegion: 'ZH',
      addressCountry: 'CH',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 47.3725,
      longitude: 8.5425,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '10:00',
        closes: '16:00',
      },
    ],
    sameAs: ['https://www.instagram.com/salonexcellence', 'https://www.facebook.com/salonexcellence'],
  } as const;

  return (
    <html lang="de-CH" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        <Script
          id="ld-json-local-business"
          type="application/ld+json"
          nonce={nonce}
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
