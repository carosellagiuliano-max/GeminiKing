import type { Metadata } from 'next';

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
          <form className="space-y-4 rounded-3xl border border-neutral-200 bg-white/90 p-6 shadow-sm">
            <div>
              <label className="text-sm font-medium text-neutral-700" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Vor- und Nachname"
                required
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700" htmlFor="email">
                E-Mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.ch"
                required
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700" htmlFor="message">
                Nachricht
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                placeholder="Wie können wir unterstützen?"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              Anfrage senden
            </button>
            <p className="text-xs text-neutral-400">
              Mit dem Absenden akzeptierst du unsere{' '}
              <a href="/legal/datenschutz" className="underline">
                Datenschutzbestimmungen
              </a>
              .
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
