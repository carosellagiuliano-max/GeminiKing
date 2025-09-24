import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatCurrencyCHF } from '@/lib/datetime';

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

  const [{ data: services = [] }, { data: staff = [] }, { data: pendingAppointments = [] }] = await Promise.all([
    supabase.from('services').select('*').order('name', { ascending: true }),
    supabase.from('staff').select('*, location:locations(name)').order('display_name', { ascending: true }),
    supabase
      .from('appointments')
      .select('id, start_at, service:services(name, price_chf), customer:customers(email)')
      .eq('status', 'PENDING')
      .order('start_at', { ascending: true }),
  ]);

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
          <p className="mt-2 text-3xl font-bold text-neutral-900">{staff.length}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-neutral-500">Offene Bestätigungen</p>
          <p className="mt-2 text-3xl font-bold text-neutral-900">{pendingAppointments.length}</p>
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
          {staff.map((member) => (
            <li key={member.id} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
              <p className="text-lg font-semibold text-neutral-900">{member.display_name}</p>
              <p className="text-sm text-neutral-600">Standort: {member.location?.name}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900">Offene Buchungen</h2>
        {pendingAppointments.length === 0 ? (
          <p className="text-sm text-neutral-500">Keine offenen Bestätigungen.</p>
        ) : (
          <ul className="space-y-3">
            {pendingAppointments.map((appointment) => (
              <li key={appointment.id} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-neutral-800">{appointment.service?.name}</p>
                <p className="text-sm text-neutral-600">{appointment.customer?.email}</p>
                <p className="text-sm text-neutral-600">
                  {new Date(appointment.start_at).toLocaleString('de-CH', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
