import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Buchung erfolgreich',
  description:
    'Vielen Dank für deine Zahlung. Die finale Terminbestätigung folgt per E-Mail, sobald die Zahlung verbucht wurde.',
};

export default function BookingSuccessPage({ searchParams }: { searchParams: { provider?: string | string[]; session_id?: string } }) {
  const provider = Array.isArray(searchParams.provider) ? searchParams.provider[0] : searchParams.provider;
  const providerLabel = provider === 'sumup' ? 'SumUp' : 'Stripe';

  return (
    <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-emerald-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-emerald-700">Merci vielmals!</h1>
        <p className="mt-4 text-neutral-700">
          Deine Zahlung über {providerLabel} wurde angenommen. Unser System bestätigt deinen Termin automatisch, sobald der
          Zahlungseingang final durch den Zahlungsanbieter bestätigt ist.
        </p>
        <p className="mt-2 text-neutral-700">
          Du erhältst anschliessend eine E-Mail mit allen Termindetails sowie einer Kalendereinladung. Im Kundenportal findest du
          jederzeit den aktuellen Status deiner Buchung.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/portal"
            className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
          >
            Zum Kundenportal
          </Link>
          <Link
            href="/"
            className="inline-flex items-center rounded-md border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
