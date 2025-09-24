import ical from 'ical-generator';
import { DateTime } from '@/lib/datetime';
import type { AppointmentRow, LocationRow, ServicesRow, StaffRow } from '@/lib/supabase/types';

interface ICSEventOptions {
  appointment: AppointmentRow;
  service: ServicesRow;
  staff: StaffRow;
  location: LocationRow;
}

export function createICSEvent({ appointment, service, staff, location }: ICSEventOptions) {
  const calendar = ical({
    name: 'Salon Excellence Buchung',
    timezone: 'Europe/Zurich',
    prodId: {
      company: 'Salon Excellence',
      product: 'Booking Platform',
      language: 'DE',
    },
  });

  calendar.timezone({
    name: 'Europe/Zurich',
    generator: (timezone) =>
      `BEGIN:VTIMEZONE\nTZID:${timezone}\nBEGIN:STANDARD\nTZOFFSETFROM:+0200\nTZOFFSETTO:+0100\nTZNAME:CET\nDTSTART:19701025T030000\nRRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU\nEND:STANDARD\nBEGIN:DAYLIGHT\nTZOFFSETFROM:+0100\nTZOFFSETTO:+0200\nTZNAME:CEST\nDTSTART:19700329T020000\nRRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU\nEND:DAYLIGHT\nEND:VTIMEZONE`,
  });

  const start = DateTime.fromISO(appointment.start_at, { zone: 'utc' }).setZone(location.timezone);
  const end = DateTime.fromISO(appointment.end_at, { zone: 'utc' }).setZone(location.timezone);

  const event = calendar.createEvent({
    start: start.toJSDate(),
    end: end.toJSDate(),
    summary: `${service.name} mit ${staff.display_name}`,
    description: service.description ?? 'Salon Excellence Termin',
    location: `${location.name}, ${location.street ?? ''} ${location.postal_code ?? ''} ${location.city ?? ''}`.trim(),
    timezone: 'Europe/Zurich',
    organizer: {
      name: 'Salon Excellence',
      email: process.env.RESEND_FROM_EMAIL ?? 'salon@salon-excellence.ch',
    },
    method: 'REQUEST',
    uid: `${appointment.id}@salon-excellence.ch`,
  });

  event.createAlarm({
    type: 'display',
    trigger: -24 * 60, // 24 hours before
    description: 'Erinnerung: Dein Termin bei Salon Excellence steht an.',
  });

  return {
    filename: `salon-excellence-${appointment.public_id}.ics`,
    content: calendar.toString(),
  };
}
