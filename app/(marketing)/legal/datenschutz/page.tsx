import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Datenschutz',
  description: 'Informationen zum Umgang mit personenbezogenen Daten im Salon Excellence.',
};

export default function DatenschutzPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold text-neutral-900">Datenschutz</h1>
      <div className="mt-6 space-y-4 text-sm text-neutral-600">
        <p>
          Wir verarbeiten personenbezogene Daten ausschliesslich zur Terminverwaltung, Zahlungsabwicklung und Kommunikation.
          Rechtsgrundlagen sind Art. 13 BV, DSG sowie – sofern anwendbar – Art. 6 DSGVO.
        </p>
        <p>
          Die Daten werden in der Schweiz und der EU (Supabase, Stripe, Resend) verarbeitet. Sämtliche Anbieter verfügen über
          geeignete Garantien gemäss DSG/DSGVO.
        </p>
        <p>
          Kund:innen haben das Recht auf Auskunft, Berichtigung, Löschung und Datenportabilität. Anfragen richten Sie bitte an
          privacy@salon-excellence.ch.
        </p>
        <p>
          Für die Online-Zahlung nutzen wir Stripe. Zahlungsdaten werden nicht auf unseren Systemen gespeichert. Für
          Vor-Ort-Zahlungen setzen wir SumUp ein.
        </p>
      </div>
      <section className="mt-10 space-y-3 text-sm text-neutral-600">
        <h2 className="text-xl font-semibold text-neutral-900">Cookies &amp; Tracking</h2>
        <p>
          Wir verwenden nur technisch notwendige Cookies sowie optionale Analytics (Opt-in). Die Einwilligung kann jederzeit im
          Portal widerrufen werden.
        </p>
      </section>
    </div>
  );
}
