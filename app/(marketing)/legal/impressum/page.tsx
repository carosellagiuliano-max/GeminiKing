import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Rechtliche Angaben zum Salon Excellence gemäss Schweizer Recht.',
};

export default function ImpressumPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold text-neutral-900">Impressum</h1>
      <div className="mt-6 space-y-4 text-sm text-neutral-600">
        <p>SALON EXCELLENCE GmbH</p>
        <p>Seefeldstrasse 45, 8008 Zürich, Schweiz</p>
        <p>UID: CHE-123.456.789</p>
        <p>E-Mail: hallo@salon-excellence.ch · Telefon: +41 44 000 00 00</p>
        <p>Geschäftsführung: Aylin Kaya</p>
      </div>
      <section className="mt-10 space-y-3 text-sm text-neutral-600">
        <h2 className="text-xl font-semibold text-neutral-900">Aufsichtsbehörde</h2>
        <p>Stadt Zürich, Gewerbepolizei. Mitglied beim Schweizerischen Coiffeurverband.</p>
      </section>
      <section className="mt-10 space-y-3 text-sm text-neutral-600">
        <h2 className="text-xl font-semibold text-neutral-900">Haftungsausschluss</h2>
        <p>
          Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für externe Links. Für den Inhalt der
          verlinkten Seiten sind ausschliesslich deren Betreiber:innen verantwortlich.
        </p>
      </section>
    </div>
  );
}
