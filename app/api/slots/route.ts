import { NextResponse } from 'next/server';
import { z } from 'zod';
import { DateTime, toISOStringOrThrow } from '@/lib/datetime';
import { rateLimit, rateLimitHeaders } from '@/lib/rate-limit';
import { computeAvailableSlots } from '@/lib/slots/engine';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import type { StaffServicesRow } from '@/lib/supabase/types';

const requestSchema = z.object({
  serviceId: z.string().uuid(),
  from: z.string(),
  to: z.string(),
  staffId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'anonymous';
  const { allowed, remaining, reset, window } = await rateLimit(`slots:${ip}`, 60, 60);
  const headers = rateLimitHeaders(60, remaining, reset, window);
  if (!allowed) {
    return new NextResponse(JSON.stringify({ message: 'Too many requests' }), {
      status: 429,
      headers,
    });
  }

  let payload: z.infer<typeof requestSchema>;
  try {
    payload = requestSchema.parse(await req.json());
  } catch (error) {
    return new NextResponse(JSON.stringify({ message: 'Ungültige Anfrage', error: String(error) }), {
      status: 400,
      headers,
    });
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('*')
    .eq('id', payload.serviceId)
    .single();

  if (serviceError || !service || !service.is_active || service.cms_status !== 'published') {
    return new NextResponse(JSON.stringify({ message: 'Service nicht gefunden oder deaktiviert.' }), {
      status: 404,
      headers,
    });
  }

  const { data: serviceResourcesData, error: serviceResourcesError } = await supabase
    .from('service_resources')
    .select('*')
    .eq('service_id', service.id);

  if (serviceResourcesError) {
    return NextResponse.json({ message: 'Ressourcen konnten nicht geladen werden.' }, { status: 500, headers });
  }

  const serviceResources = serviceResourcesData ?? [];

  const { data: overridesData, error: overridesError } = await supabase
    .from('staff_services')
    .select('*')
    .eq('service_id', service.id);

  if (overridesError) {
    return NextResponse.json({ message: 'Service-Zuweisungen konnten nicht geladen werden.' }, { status: 500, headers });
  }

  const overrides = overridesData ?? [];

  const staffIdsFromOverrides = overrides.map((override) => override.staff_id);
  const staffIds = payload.staffId
    ? staffIdsFromOverrides.includes(payload.staffId)
      ? [payload.staffId]
      : []
    : staffIdsFromOverrides;

  if (staffIds.length === 0) {
    return NextResponse.json(
      { slots: [], message: 'Kein Teammitglied für diesen Service hinterlegt.' },
      { status: 200, headers },
    );
  }

  const { data: staffRows, error: staffError } = await supabase
    .from('staff')
    .select('*')
    .in('id', staffIds);

  if (staffError || !staffRows || staffRows.length === 0) {
    return NextResponse.json({ slots: [], message: 'Teammitglieder konnten nicht geladen werden.' }, { headers });
  }

  const locationIds = Array.from(new Set(staffRows.map((member) => member.location_id)));
  const { data: locationsData, error: locationsError } = await supabase
    .from('locations')
    .select('*')
    .in('id', locationIds);

  if (locationsError) {
    return NextResponse.json({ message: 'Standorte konnten nicht geladen werden.' }, { status: 500, headers });
  }

  const locations = locationsData ?? [];
  const locationMap = new Map(locations.map((location) => [location.id, location]));

  const staffMembers = staffRows
    .map((staff) => {
      const location = locationMap.get(staff.location_id);
      if (!location) return null;
      const override = (overrides as StaffServicesRow[]).find((item) => item.staff_id === staff.id) ?? null;
      return { ...staff, location, override };
    })
    .filter(Boolean) as Array<(typeof staffRows)[number] & { location: (typeof locations)[number]; override: StaffServicesRow | null }>;

  if (staffMembers.length === 0) {
    return NextResponse.json({ slots: [], message: 'Keine gültigen Standorte gefunden.' }, { headers });
  }

  const { data: availabilityData, error: availabilityError } = await supabase
    .from('availability_blocks')
    .select('*')
    .in('staff_id', staffMembers.map((member) => member.id));

  if (availabilityError) {
    return NextResponse.json({ message: 'Verfügbarkeiten konnten nicht geladen werden.' }, { status: 500, headers });
  }

  const availability = availabilityData ?? [];

  const { data: timeOffData, error: timeOffError } = await supabase
    .from('time_off')
    .select('*')
    .in('staff_id', staffMembers.map((member) => member.id));

  if (timeOffError) {
    return NextResponse.json({ message: 'Abwesenheiten konnten nicht geladen werden.' }, { status: 500, headers });
  }

  const timeOff = timeOffData ?? [];

  const from = DateTime.fromISO(payload.from, { zone: staffMembers[0].location.timezone });
  const to = DateTime.fromISO(payload.to, { zone: staffMembers[0].location.timezone });

  const fromBufferIso = toISOStringOrThrow(from.minus({ days: 1 }).toUTC());
  const toBufferIso = toISOStringOrThrow(to.plus({ days: 1 }).toUTC());

  const { data: appointmentsData, error: appointmentsError } = await supabase
    .from('appointments')
    .select('*')
    .in('staff_id', staffMembers.map((member) => member.id))
    .gte('end_at', fromBufferIso)
    .lte('start_at', toBufferIso);

  if (appointmentsError) {
    return NextResponse.json({ message: 'Termine konnten nicht geladen werden.' }, { status: 500, headers });
  }

  const appointments = appointmentsData ?? [];

  const appointmentIds = appointments.map((item) => item.id);
  const appointmentResourcesResult =
    appointmentIds.length === 0
      ? { data: [], error: null }
      : await supabase.from('appointment_resources').select('*').in('appointment_id', appointmentIds);

  if (appointmentResourcesResult.error) {
    return NextResponse.json({ message: 'Termin-Ressourcen konnten nicht geladen werden.' }, { status: 500, headers });
  }

  const appointmentResources = appointmentResourcesResult.data ?? [];

  const { data: resourcesData, error: resourcesError } = await supabase
    .from('resources')
    .select('*')
    .in('location_id', locationIds);

  if (resourcesError) {
    return NextResponse.json({ message: 'Ressourcen konnten nicht geladen werden.' }, { status: 500, headers });
  }

  const resources = resourcesData ?? [];

  const canton = staffMembers[0]?.location?.canton ?? 'ZH';

  const slots = computeAvailableSlots(
    {
      service,
      staffMembers,
      availability,
      timeOff,
      appointments,
      appointmentResources,
      resources,
      serviceResources,
      canton,
    },
    {
      from,
      to,
      staffId: payload.staffId,
    },
  ).map((slot) => ({
    start: toISOStringOrThrow(slot.start),
    end: toISOStringOrThrow(slot.end),
    staffId: slot.staffId,
    serviceId: slot.serviceId,
    locationId: slot.locationId,
    priceChf: slot.priceChf,
  }));

  return NextResponse.json({ slots }, { headers });
}
