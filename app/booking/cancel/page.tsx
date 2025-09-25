import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Buchung abgebrochen',
  description: 'Die Zahlung wurde abgebrochen. Du kannst deine Buchung jederzeit erneut starten und einen neuen Termin wählen.',
};

export default function BookingCancelPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-neutral-900">Buchung abgebrochen</h1>
        <p className="mt-4 text-neutral-700">
          Deine Zahlung wurde nicht abgeschlossen. Keine Sorge – dein Terminplatz wurde wieder freigegeben und es wurden keine
          Kosten belastet.
        </p>
        <p className="mt-2 text-neutral-700">
          Starte den Buchungsprozess einfach erneut, um einen neuen Termin auszuwählen oder kontaktiere uns direkt, falls du
          Unterstützung brauchst.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/booking"
            className="inline-flex items-center rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2"
          >
            Neue Buchung starten
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
