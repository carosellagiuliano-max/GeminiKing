import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Buchung bestätigt',
};

export default function BookingSuccessPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold text-neutral-900">Merci – deine Buchung ist bestätigt!</h1>
      <p className="mt-4 text-neutral-600">
        Wir haben dir soeben eine Bestätigung mit allen Details per E-Mail inklusive ICS-Kalendereintrag gesendet. Du kannst
        deine Termine jederzeit im Portal verwalten.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href="/portal"
          className="rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
        >
          Zum Portal
        </Link>
        <Link
          href="/services"
          className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-700 transition hover:border-violet-400 hover:text-violet-600"
        >
          Weitere Services ansehen
        </Link>
      </div>
    </div>
  );
}
