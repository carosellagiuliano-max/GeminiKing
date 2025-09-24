import Link from 'next/link';

const features = [
  {
    title: 'Digitale Exzellenz',
    description:
      'Direkte Online-Buchung mit Echtzeit-Verfügbarkeiten, automatischen Erinnerungen und sicherem Kundenportal.',
  },
  {
    title: 'Premium Treatments',
    description:
      'Massgeschneiderte Stylings, Colouring, Make-up und Spa-Rituale – abgestimmt auf deinen Typ und deinen Alltag.',
  },
  {
    title: 'Transparente Preise',
    description:
      'Alle Services in CHF inkl. Rappen-genauer Abrechnung. Bezahle online via Stripe oder vor Ort via SumUp.',
  },
];

export default function Page() {
  return (
    <div className="bg-neutral-50">
      <section className="relative isolate overflow-hidden bg-gradient-to-b from-primary-50 via-white to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:px-8">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-primary-600">Salon Excellence</p>
            <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
              Schweizer Präzision trifft auf sinnliche Schönheit.
            </h1>
            <p className="text-lg text-neutral-600">
              Wir verbinden Haute Coiffure mit smarter Technologie. Plane deinen Termin in wenigen Sekunden, erhalte
              personalisierte Empfehlungen und erlebe ein Salon-Erlebnis, das noch lange nachklingt.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/booking"
                className="rounded-full bg-primary-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-primary-200 transition hover:-translate-y-0.5 hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                Termin buchen
              </Link>
              <Link
                href="/services"
                className="rounded-full border border-neutral-300 px-6 py-3 text-base font-semibold text-neutral-700 transition hover:border-primary-500 hover:text-primary-600"
              >
                Leistungen entdecken
              </Link>
            </div>
            <dl className="grid gap-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-neutral-500">Durchschnittliche Bewertung</dt>
                <dd className="mt-1 text-2xl font-semibold text-neutral-900">4.9 / 5.0</dd>
                <p className="text-sm text-neutral-500">Verifiziert über mehr als 1’200 Gästefeedbacks.</p>
              </div>
              <div>
                <dt className="text-sm font-medium text-neutral-500">Nachhaltigkeit</dt>
                <dd className="mt-1 text-2xl font-semibold text-neutral-900">100% klimaneutral</dd>
                <p className="text-sm text-neutral-500">Regionale Partner:innen &amp; CO₂-kompensierte Lieferketten.</p>
              </div>
            </dl>
          </div>
          <div className="relative hidden aspect-[3/4] overflow-hidden rounded-3xl border border-white/60 bg-neutral-900/5 shadow-2xl shadow-primary-100/50 lg:block">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200')] bg-cover bg-center" aria-hidden />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/70 via-neutral-900/10 to-transparent" aria-hidden />
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/85 p-6 text-neutral-900 shadow-xl backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">Signature Ritual</p>
              <p className="mt-2 text-lg font-semibold">Glow &amp; Grace Treatment</p>
              <p className="mt-1 text-sm text-neutral-600">90 Minuten · CHF 260.–</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-neutral-900">Warum Gäste uns lieben</h2>
          <p className="mt-4 text-neutral-600">
            Wir kombinieren luxuriöse Treatments mit einem digitalen Erlebnis, das genauso hochwertig ist wie unsere
            Handwerkskunst.
          </p>
        </div>
        <dl className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(feature => (
            <div
              key={feature.title}
              className="rounded-3xl border border-neutral-200 bg-white/70 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <dt className="text-lg font-semibold text-neutral-900">{feature.title}</dt>
              <dd className="mt-3 text-sm text-neutral-600">{feature.description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="bg-neutral-900 py-16 text-neutral-100">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold text-white">Tailored Beauty Journeys</h2>
            <p className="text-neutral-300">
              Ob Business-Styling vor dem Meeting, moderne Balayage oder entspannendes Kopfhaut-Spa – unsere Expert:innen
              kreieren Looks, die deine Persönlichkeit feiern. Mit unserem Slot-Engine-Framework planen wir deine Zeit effizient
              und berücksichtigen Feiertage im Kanton Zürich.
            </p>
            <ul className="space-y-3 text-neutral-200">
              <li>• Flexible Terminfenster dank intelligenter Slot-Berechnung</li>
              <li>• Erinnerungen per E-Mail inkl. ICS-Kalenderdatei</li>
              <li>• Sichere Zahlungsabwicklung über Stripe &amp; SumUp</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-lg">
            <h3 className="text-xl font-semibold text-white">Unsere Signature Services</h3>
            <ul className="mt-6 space-y-4 text-sm text-neutral-200">
              <li className="flex justify-between">
                <span>Precision Haircut &amp; Finish</span>
                <span>CHF 140.– · 60 Min.</span>
              </li>
              <li className="flex justify-between">
                <span>Balayage Lumière</span>
                <span>CHF 320.– · 150 Min.</span>
              </li>
              <li className="flex justify-between">
                <span>Luxury Scalp Spa</span>
                <span>CHF 180.– · 75 Min.</span>
              </li>
              <li className="flex justify-between">
                <span>Bridal Glow Experience</span>
                <span>CHF 490.– · 180 Min.</span>
              </li>
            </ul>
            <Link
              href="/services"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-200"
            >
              Zur Leistungsübersicht
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 px-8 py-10 text-white shadow-xl">
          <h2 className="text-3xl font-semibold">Bereit für deinen nächsten Glow?</h2>
          <p className="mt-4 max-w-3xl text-base text-primary-50">
            Sichere dir jetzt deinen Platz. Unser digitales System erinnert dich automatisch, verwaltet Wartelisten und
            synchronisiert Termine mit deinem Kalender.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/booking"
              className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
            >
              Jetzt Termin sichern
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-white/60 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Beratungsgespräch anfragen
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
