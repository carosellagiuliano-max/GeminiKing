import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Allgemeine Geschäftsbedingungen',
  description: 'AGB für Dienstleistungen des Salon Excellence in Zürich.',
};

export default function AgbPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold text-neutral-900">Allgemeine Geschäftsbedingungen</h1>
      <div className="mt-6 space-y-4 text-sm text-neutral-600">
        <p>
          Termine können bis 24 Stunden vor Beginn kostenlos storniert werden. Bei späterer Absage oder Nichterscheinen
          behalten wir uns vor, 80% des Behandlungspreises zu verrechnen.
        </p>
        <p>
          Preise verstehen sich in Schweizer Franken inkl. MwSt. Zahlungsarten: Stripe (Kredit-/Debitkarten, TWINT sofern
          verfügbar) sowie SumUp (Kartenzahlung vor Ort).
        </p>
        <p>
          Gutscheine sind zwei Jahre ab Ausstellungsdatum gültig. Restbeträge bleiben bis zum Ablaufdatum bestehen.
        </p>
        <p>
          Es gelten die Datenschutzbestimmungen gemäss separater Erklärung. Gerichtsstand ist Zürich, Schweiz.
        </p>
      </div>
    </div>
  );
}
