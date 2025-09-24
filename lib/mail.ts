import { Resend } from 'resend';
import { DateTime } from '@/lib/datetime';
import type { AppointmentRow, LocationRow, ServicesRow, StaffRow } from '@/lib/supabase/types';
import { formatCurrencyCHF } from '@/lib/datetime';
import { getSiteUrl } from '@/lib/url';

interface BookingMailParams {
  appointment: AppointmentRow;
  service: ServicesRow;
  staff: StaffRow;
  customer: {
    email: string;
    firstName: string;
    lastName: string;
  };
  location: LocationRow;
  ics: { filename: string; content: string };
}

async function ensureClient() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.warn('Resend credentials missing, skipping email dispatch.');
    return null;
  }

  return { resend: new Resend(apiKey), from };
}

export async function sendBookingConfirmation({
  appointment,
  service,
  staff,
  customer,
  location,
  ics,
}: BookingMailParams) {
  const client = await ensureClient();
  if (!client) return;
  const { resend, from } = client;
  const start = DateTime.fromISO(appointment.start_at, { zone: 'utc' }).setZone(location.timezone);
  const end = DateTime.fromISO(appointment.end_at, { zone: 'utc' }).setZone(location.timezone);

  const html = `
    <div style="font-family: 'Source Sans Pro', Arial, sans-serif; color: #0f172a;">
      <h1>Vielen Dank für deine Buchung, ${customer.firstName}!</h1>
      <p>Wir freuen uns darauf, dich im Salon Excellence begrüssen zu dürfen.</p>
      <p><strong>Termin:</strong> ${start.toFormat('dd.LL.yyyy HH:mm')} – ${end.toFormat('HH:mm')} (${location.timezone})</p>
      <p><strong>Service:</strong> ${service.name}</p>
      <p><strong>Stylist:in:</strong> ${staff.display_name}</p>
      <p><strong>Preis:</strong> ${formatCurrencyCHF(appointment.total_amount_chf)}</p>
      <p>Salon-Adresse: ${location.name}, ${location.street ?? ''} ${location.postal_code ?? ''} ${location.city ?? ''}</p>
      <p>Solltest du Fragen haben oder umbuchen müssen, kannst du deinen Termin jederzeit im <a href="${getSiteUrl()}/portal">Kundenportal</a> verwalten.</p>
      <p>Herzliche Grüsse<br/>Dein Salon Excellence Team</p>
    </div>
  `;

  await resend.emails.send({
    from: `Salon Excellence <${from}>`,
    to: customer.email,
    subject: `Termin bestätigt: ${service.name} am ${start.toFormat('dd.LL.yyyy HH:mm')}`,
    html,
    attachments: [
      {
        filename: ics.filename,
        content: ics.content,
      },
    ],
  });
}

interface ReminderMailParams {
  appointment: AppointmentRow;
  service: ServicesRow;
  staff: StaffRow;
  customer: { email: string; firstName: string; lastName: string };
  location: LocationRow;
}

export async function sendReminderEmail({ appointment, service, staff, customer, location }: ReminderMailParams) {
  const client = await ensureClient();
  if (!client) return;
  const { resend, from } = client;
  const start = DateTime.fromISO(appointment.start_at, { zone: 'utc' }).setZone(location.timezone);
  const end = DateTime.fromISO(appointment.end_at, { zone: 'utc' }).setZone(location.timezone);

  const html = `
    <div style="font-family: 'Source Sans Pro', Arial, sans-serif; color: #0f172a;">
      <h1>Erinnerung an deinen Termin, ${customer.firstName}</h1>
      <p>Morgen ist es so weit – wir freuen uns auf dich im Salon Excellence.</p>
      <p><strong>Wann:</strong> ${start.toFormat('dd.LL.yyyy HH:mm')} – ${end.toFormat('HH:mm')} (${location.timezone})</p>
      <p><strong>Service:</strong> ${service.name}</p>
      <p><strong>Stylist:in:</strong> ${staff.display_name}</p>
      <p>Adresse: ${location.name}, ${location.street ?? ''} ${location.postal_code ?? ''} ${location.city ?? ''}</p>
      <p>Wenn du dich verspätest oder verschieben musst, gib uns bitte kurz Bescheid.</p>
      <p>Bis bald!<br/>Dein Salon Excellence Team</p>
    </div>
  `;

  await resend.emails.send({
    from: `Salon Excellence <${from}>`,
    to: customer.email,
    subject: `Reminder: ${service.name} am ${start.toFormat('dd.LL.yyyy HH:mm')}`,
    html,
  });
}
