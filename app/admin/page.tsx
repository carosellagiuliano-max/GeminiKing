import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatCurrencyCHF } from '@/lib/datetime';
import type { StaffRow } from '@/lib/supabase/types';

export const metadata: Metadata = {
  title: 'Admin',
  description: 'Administrationsbereich für Team, Services und Richtlinien – Zugriff nur für autorisierte Personen.',
};

export default async function AdminPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirectTo=/admin');
  }

  const [servicesResult, staffResult, pendingResult] = await Promise.all([
    supabase.from('services').select('*').order('name', { ascending: true }),
    supabase.from('staff').select('*, location:locations(name)').order('display_name', { ascending: true }),
    supabase
      .from('appointments')
      .select('id, start_at, service:services(name, price_chf), customer:customers(email)')
      .eq('status', 'PENDING')
      .order('start_at', { ascending: true }),
  ]);

  if (servicesResult.error) {
    throw new Error('Services konnten nicht geladen werden.');
  }

  if (staffResult.error) {
    throw new Error('Teamdaten konnten nicht geladen werden.');
  }

  if (pendingResult.error) {
    throw new Error('Offene Termine konnten nicht geladen werden.');
  }

  const services = servicesResult.data ?? [];
  type StaffWithLocation = StaffRow & { location: { name: string } | { name: string }[] | null };
  const staff = (staffResult.data ?? []) as StaffWithLocation[];
  type PendingAppointment = {
    id: string;
    start_at: string;
    service: { name: string } | { name: string }[] | null;
    customer: { email: string } | { email: string }[] | null;
  };
  const pendingAppointments = (pendingResult.data ?? []) as PendingAppointment[];

  const staffCards = staff.map((member) => ({
    id: member.id,
    displayName: member.display_name,
    locationName: Array.isArray(member.location)
      ? member.location[0]?.name ?? 'Unbekannter Standort'
      : member.location?.name ?? 'Unbekannter Standort',
  }));

  const pendingView = pendingAppointments.map((appointment) => ({
    id: appointment.id,
    startAt: appointment.start_at,
    serviceName: Array.isArray(appointment.service)
      ? appointment.service[0]?.name ?? 'Service unbekannt'
      : appointment.service?.name ?? 'Service unbekannt',
    customerEmail: Array.isArray(appointment.customer)
      ? appointment.customer[0]?.email ?? 'Unbekannte E-Mail'
      : appointment.customer?.email ?? 'Unbekannte E-Mail',
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold text-neutral-900">Admin-Dashboard</h1>
        <p className="mt-2 text-neutral-600">Überblicke Services, Teammitglieder und offene Buchungen.</p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-neutral-500">Services aktiv</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900">{services.length}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-neutral-500">Teammitglieder</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900">{staffCards.length}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-neutral-500">Offene Bestätigungen</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900">{pendingView.length}</p>
        </div>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900">Service-Katalog</h2>
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Dauer</th>
                <th className="px-4 py-3 font-semibold">Preis</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-neutral-700">
              {services.map((service) => (
                <tr key={service.id}>
                  <td className="px-4 py-3">{service.name}</td>
                  <td className="px-4 py-3">{service.duration_minutes} min</td>
                  <td className="px-4 py-3">{formatCurrencyCHF(service.price_chf)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        service.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {service.cms_status === 'published' && service.is_active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900">Team</h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {staffCards.map((member) => (
            <li key={member.id} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-lg font-semibold text-neutral-900">{member.displayName}</p>
              <p className="text-sm text-neutral-600">Standort: {member.locationName}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900">Offene Buchungen</h2>
        {pendingView.length === 0 ? (
          <p className="text-sm text-neutral-500">Keine offenen Bestätigungen.</p>
        ) : (
          <ul className="space-y-3">
            {pendingView.map((appointment) => (
              <li key={appointment.id} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-neutral-800">{appointment.serviceName}</p>
                <p className="text-sm text-neutral-600">{appointment.customerEmail}</p>
                <p className="text-sm text-neutral-600">
                  {new Date(appointment.startAt).toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
