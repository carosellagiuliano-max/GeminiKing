import type { Metadata } from 'next';

const services = [
  {
    name: 'Precision Haircut & Finish',
    duration: '60 Min.',
    price: 'CHF 140.–',
    description: 'Individuell abgestimmter Schnitt inklusive Stylingberatung und Finishing-Produkte.',
  },
  {
    name: 'Balayage Lumière',
    duration: '150 Min.',
    price: 'CHF 320.–',
    description: 'Natürliche Lichtreflexe mit pflegendem Glossing und Bond-Buildern für maximale Haarintegrität.',
  },
  {
    name: 'Luxury Scalp Spa',
    duration: '75 Min.',
    price: 'CHF 180.–',
    description: 'Detox-Ritual für die Kopfhaut inklusive Massage, Hochfrequenz und personalisierter Pflege.',
  },
  {
    name: 'Bridal Glow Experience',
    duration: '180 Min.',
    price: 'CHF 490.–',
    description: 'Probetermin, Make-up & Hair-Styling am Hochzeitstag inklusive Touch-up Kit.',
  },
];

export const metadata: Metadata = {
  title: 'Leistungen',
  description: 'Massgeschneiderte Beauty-Services mit minutengenauer Planung und Abrechnung in CHF.',
};

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-sm uppercase tracking-[0.3em] text-primary-600">Angebot</p>
        <h1 className="mt-3 text-4xl font-semibold text-neutral-900">Services &amp; Rituale</h1>
        <p className="mt-4 text-neutral-600">
          Alle Preise verstehen sich in Schweizer Franken inklusive Mehrwertsteuer. Online buchbar mit direkter Stripe-Zahlung
          oder vor Ort via SumUp-Terminal.
        </p>
      </header>
      <div className="mt-12 space-y-6">
        {services.map(service => (
          <article
            key={service.name}
            className="rounded-3xl border border-neutral-200 bg-white/80 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-neutral-900">{service.name}</h2>
                <p className="mt-2 text-sm text-neutral-600">{service.description}</p>
              </div>
              <dl className="grid shrink-0 gap-1 text-sm text-neutral-600">
                <div className="font-semibold text-neutral-900">{service.price}</div>
                <div>{service.duration}</div>
              </dl>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
