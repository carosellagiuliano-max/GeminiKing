import type { Metadata } from 'next';
import { DateTime } from '@/lib/datetime';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import type { LocationRow, StaffRow } from '@/lib/supabase/types';
import { BookingWizard } from '@/components/booking/booking-wizard';

export const metadata: Metadata = {
  title: 'Buchung',
  description: 'Starte den vierstufigen Buchungsprozess für deinen nächsten Salon Excellence Termin.',
};

export default async function BookingPage() {
  const supabase = createSupabaseServiceRoleClient();

  const { data: servicesData = [] } = await supabase
    .from('services')
    .select('*')
    .eq('cms_status', 'published')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (servicesData.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-neutral-900">Buchung aktuell nicht möglich</h1>
        <p className="mt-4 text-neutral-600">
          Aktuell sind keine Services freigeschaltet. Bitte versuche es später erneut oder kontaktiere unser Team direkt.
        </p>
      </div>
    );
  }

  const serviceIds = servicesData.map((service) => service.id);

  const { data: overrides = [] } = await supabase
    .from('staff_services')
    .select('*')
    .in('service_id', serviceIds);

  const staffIds = Array.from(new Set(overrides.map((override) => override.staff_id)));
  const { data: staffRows = [] } =
    staffIds.length > 0
      ? await supabase
          .from('staff')
          .select('*')
          .in('id', staffIds)
          .eq('active', true)
      : { data: [] };

  const locationIds = Array.from(new Set(staffRows.map((member) => member.location_id)));
  const { data: locationRows = [] } =
    locationIds.length > 0
      ? await supabase
          .from('locations')
          .select('*')
          .in('id', locationIds)
      : { data: [] };

  const staffMap = new Map(staffRows.map((staff) => [staff.id, staff]));
  const locationMap = new Map(locationRows.map((location) => [location.id, location]));

  const services = servicesData.map((service) => {
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

  const defaultDate = DateTime.now().setZone('Europe/Zurich').toISODate() ?? DateTime.now().toISODate();

  return <BookingWizard services={services} defaultDate={defaultDate} />;
}
