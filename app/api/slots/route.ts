import { NextResponse } from 'next/server';
import { z } from 'zod';
import { DateTime } from '@/lib/datetime';
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

  const { data: serviceResources = [] } = await supabase
    .from('service_resources')
    .select('*')
    .eq('service_id', service.id);

  const { data: overrides = [] } = await supabase
    .from('staff_services')
    .select('*')
    .eq('service_id', service.id);

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

  const { data: staffRows = [], error: staffError } = await supabase
    .from('staff')
    .select('*')
    .in('id', staffIds);

  if (staffError || staffRows.length === 0) {
    return NextResponse.json({ slots: [], message: 'Teammitglieder konnten nicht geladen werden.' }, { headers });
  }

  const locationIds = Array.from(new Set(staffRows.map((member) => member.location_id)));
  const { data: locations = [] } = await supabase
    .from('locations')
    .select('*')
    .in('id', locationIds);
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

  const { data: availability = [] } = await supabase
    .from('availability_blocks')
    .select('*')
    .in('staff_id', staffMembers.map((member) => member.id));

  const { data: timeOff = [] } = await supabase
    .from('time_off')
    .select('*')
    .in('staff_id', staffMembers.map((member) => member.id));

  const from = DateTime.fromISO(payload.from, { zone: staffMembers[0].location.timezone });
  const to = DateTime.fromISO(payload.to, { zone: staffMembers[0].location.timezone });

  const { data: appointments = [] } = await supabase
    .from('appointments')
    .select('*')
    .in('staff_id', staffMembers.map((member) => member.id))
    .gte('end_at', from.minus({ days: 1 }).toUTC().toISO())
    .lte('start_at', to.plus({ days: 1 }).toUTC().toISO());

  const appointmentIds = appointments.map((item) => item.id);
  const { data: appointmentResources = [] } =
    appointmentIds.length === 0
      ? { data: [] }
      : await supabase.from('appointment_resources').select('*').in('appointment_id', appointmentIds);

  const { data: resources = [] } = await supabase
    .from('resources')
    .select('*')
    .in('location_id', locationIds);

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
    start: slot.start.toISO(),
    end: slot.end.toISO(),
    staffId: slot.staffId,
    serviceId: slot.serviceId,
    locationId: slot.locationId,
    priceChf: slot.priceChf,
  }));

  return NextResponse.json({ slots }, { headers });
}
