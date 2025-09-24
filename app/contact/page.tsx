import type { Metadata } from 'next';
import { ContactForm } from './contact-form';

export const metadata: Metadata = {
  title: 'Kontakt',
  description: 'Anreise, Öffnungszeiten und Kontaktmöglichkeiten für den Salon Excellence in Zürich.',
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-primary-600">Kontakt</p>
        <h1 className="text-4xl font-semibold text-neutral-900">Wir freuen uns auf dich</h1>
        <p className="text-neutral-600">
          Buche deinen Termin direkt online oder melde dich für ein individuelles Beratungsgespräch. Unser Team antwortet
          innerhalb eines Werktages.
        </p>
      </header>
      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <section className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Salon Excellence</h2>
            <p className="text-sm text-neutral-600">Seefeldstrasse 45, 8008 Zürich</p>
          </div>
          <div className="space-y-2 text-sm text-neutral-600">
            <p>
              Telefon: <a href="tel:+41440000000">+41 44 000 00 00</a>
            </p>
            <p>
              E-Mail: <a href="mailto:hallo@salon-excellence.ch">hallo@salon-excellence.ch</a>
            </p>
            <p>Öffnungszeiten: Di – Sa, 09:00 – 20:00 Uhr</p>
          </div>
          <div className="space-y-2 text-sm text-neutral-600">
            <p className="font-semibold text-neutral-900">Anreise</p>
            <p>Tram 2 &amp; 4 bis Höschgasse · Parkmöglichkeiten im Parkhaus Feldegg.</p>
          </div>
        </section>
        <section className="space-y-6">
          <ContactForm />
        </section>
      </div>
    </div>
  );
}
