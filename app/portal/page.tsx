import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { DateTime } from '@/lib/datetime';
import { formatCurrencyCHF } from '@/lib/datetime';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Portal',
  description: 'Melde dich an, um Termine zu verwalten, Rechnungen einzusehen und Datenexporte anzufordern.',
};

export default async function PortalPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/portal');
  }

  const { data: appointments = [] } = await supabase
    .from('appointments')
    .select(
      `id, start_at, end_at, status, payment_status,
      service:services(name, price_chf),
      staff:staff(display_name),
      location:locations(name, street, city, postal_code, timezone)`
    )
    .order('start_at', { ascending: true });

  const now = DateTime.utc();
  const parsed = (appointments as any[]).map((entry) => ({
    id: entry.id as string,
    start: DateTime.fromISO(entry.start_at, { zone: 'utc' }).setZone(entry.location?.timezone ?? 'Europe/Zurich'),
    end: DateTime.fromISO(entry.end_at, { zone: 'utc' }).setZone(entry.location?.timezone ?? 'Europe/Zurich'),
    status: entry.status as string,
    paymentStatus: entry.payment_status as string,
    service: entry.service?.name as string,
    amount: entry.service?.price_chf as number,
    staff: entry.staff?.display_name as string,
    location: entry.location,
  }));

  const upcoming = parsed.filter((appointment) => appointment.start.toUTC() >= now);
  const past = parsed.filter((appointment) => appointment.start.toUTC() < now).reverse();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold text-neutral-900">Deine Termine</h1>
        <p className="mt-2 text-neutral-600">Verwalte deine Buchungen, Belege und persönlichen Daten.</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900">Bevorstehende Termine</h2>
        {upcoming.length === 0 ? (
          <p className="rounded-md border border-dashed border-neutral-300 p-6 text-neutral-500">
            Aktuell sind keine kommenden Termine geplant. Buche deinen nächsten Besuch direkt über den Booking-Assistenten.
          </p>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((appointment) => (
              <li key={appointment.id} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">{appointment.service}</p>
                    <p className="text-lg font-semibold text-neutral-900">
                      {appointment.start.toFormat('dd.LL.yyyy HH:mm')} – {appointment.end.toFormat('HH:mm')}
                    </p>
                    <p className="text-sm text-neutral-600">
                      {appointment.location?.name} · {appointment.location?.street} {appointment.location?.postal_code}{' '}
                      {appointment.location?.city}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-neutral-500">Stylist:in</p>
                    <p className="font-medium text-neutral-800">{appointment.staff}</p>
                    <p className="mt-2 text-sm font-semibold text-neutral-900">
                      {formatCurrencyCHF(appointment.amount ?? 0)}
                    </p>
                    <span className="mt-2 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {appointment.paymentStatus === 'PAID' ? 'Bezahlt' : 'Zahlung offen'}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900">Vergangene Termine</h2>
        {past.length === 0 ? (
          <p className="text-sm text-neutral-500">Sobald Termine abgeschlossen sind, erscheinen sie hier als Historie.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
            {past.slice(0, 5).map((appointment) => (
              <li key={appointment.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-medium text-neutral-700">{appointment.service}</p>
                  <p className="text-sm text-neutral-500">
                    {appointment.start.toFormat('dd.LL.yyyy HH:mm')} – {appointment.end.toFormat('HH:mm')}
                  </p>
                </div>
                <div className="text-right text-sm text-neutral-600">
                  {formatCurrencyCHF(appointment.amount ?? 0)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
