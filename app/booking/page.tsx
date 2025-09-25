import type { Metadata } from 'next';
import { DateTime, toISODateOrThrow } from '@/lib/datetime';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import type { LocationRow, StaffRow } from '@/lib/supabase/types';
import { BookingWizard } from '@/components/booking/booking-wizard';

export const metadata: Metadata = {
  title: 'Buchung',
  description: 'Starte den vierstufigen Buchungsprozess für deinen nächsten Salon Excellence Termin.',
};

export default async function BookingPage() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-neutral-900">Buchung aktuell nicht möglich</h1>
        <p className="mt-4 text-neutral-600">
          Die Buchungsplattform ist noch nicht vollständig konfiguriert. Bitte setze die Supabase-Umgebungsvariablen, um die
          Online-Buchung zu aktivieren.
        </p>
      </div>
    );
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: servicesData, error: servicesError } = await supabase
    .from('services')
    .select('*')
    .eq('cms_status', 'published')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (servicesError) {
    throw new Error('Services konnten nicht geladen werden.');
  }

  const services = servicesData ?? [];

  if (services.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-neutral-900">Buchung aktuell nicht möglich</h1>
        <p className="mt-4 text-neutral-600">
          Aktuell sind keine Services freigeschaltet. Bitte versuche es später erneut oder kontaktiere unser Team direkt.
        </p>
      </div>
    );
  }

  const serviceIds = services.map((service) => service.id);

  const { data: overridesData, error: overridesError } = await supabase
    .from('staff_services')
    .select('*')
    .in('service_id', serviceIds);

  if (overridesError) {
    throw new Error('Service-Zuweisungen konnten nicht geladen werden.');
  }

  const overrides = overridesData ?? [];

  const staffIds = Array.from(new Set(overrides.map((override) => override.staff_id)));
  const staffRowsResult =
    staffIds.length > 0
      ? await supabase
          .from('staff')
          .select('*')
          .in('id', staffIds)
          .eq('active', true)
      : { data: [], error: null };

  if (staffRowsResult.error) {
    throw new Error('Teammitglieder konnten nicht geladen werden.');
  }

  const staffRows = staffRowsResult.data ?? [];

  const locationIds = Array.from(new Set(staffRows.map((member) => member.location_id)));
  const locationRowsResult =
    locationIds.length > 0
      ? await supabase
          .from('locations')
          .select('*')
          .in('id', locationIds)
      : { data: [], error: null };

  if (locationRowsResult.error) {
    throw new Error('Standorte konnten nicht geladen werden.');
  }

  const locationRows = locationRowsResult.data ?? [];

  const staffMap = new Map(staffRows.map((staff) => [staff.id, staff]));
  const locationMap = new Map(locationRows.map((location) => [location.id, location]));

  const serviceView = services.map((service) => {
    const serviceStaff = overrides
      .filter((override) => override.service_id === service.id)
      .map((override) => {
        const staff = staffMap.get(override.staff_id) as StaffRow | undefined;
        if (!staff) return null;
        const location = locationMap.get(staff.location_id) as LocationRow | undefined;
        if (!location) return null;
        return {
          id: staff.id,
          displayName: staff.display_name,
          locationName: location.name,
        };
      })
      .filter(Boolean) as Array<{ id: string; displayName: string; locationName: string }>;

    return {
      id: service.id,
      name: service.name,
      description: service.description,
      durationMinutes: service.duration_minutes,
      priceChf: service.price_chf,
      staff: serviceStaff,
    };
  });

  const defaultDate = toISODateOrThrow(DateTime.now().setZone('Europe/Zurich'));

  return <BookingWizard services={serviceView} defaultDate={defaultDate} />;
}
