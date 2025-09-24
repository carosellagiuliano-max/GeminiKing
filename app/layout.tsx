import type { Metadata, Viewport } from 'next';
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
  return (
    <html lang="de-CH" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
