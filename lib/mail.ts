import { Resend } from 'resend';
import { DateTime } from '@/lib/datetime';
import { formatCurrencyCHF } from '@/lib/datetime';
import { createICSEvent } from '@/lib/ics';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import type { AppointmentRow, LocationRow, ServicesRow, StaffRow } from '@/lib/supabase/types';
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

function buildComplianceHeaders() {
  const mailto = process.env.RESEND_LIST_UNSUBSCRIBE_MAILTO?.trim();
  const url = process.env.RESEND_LIST_UNSUBSCRIBE_URL?.trim();

  const entries: string[] = [];
  if (mailto) {
    entries.push(`<mailto:${mailto}>`);
  }
  if (url) {
    entries.push(`<${url}>`);
  }

  if (entries.length === 0) {
    return undefined;
  }

  const headers: Record<string, string> = {
    'List-Unsubscribe': entries.join(', '),
  };

  if (url) {
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
  }

  return headers;
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
    headers: buildComplianceHeaders(),
    attachments: [
      {
        filename: ics.filename,
        content: ics.content,
      },
    ],
  });
}

interface ContactMailParams {
  name: string;
  email: string;
  message: string;
  source?: string;
}

export async function sendContactRequest({ name, email, message, source }: ContactMailParams) {
  const client = await ensureClient();
  if (!client) return;
  const { resend, from } = client;
  const to = process.env.CONTACT_INBOX_EMAIL ?? from;

  const safeMessage = message.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  await resend.emails.send({
    from: `Salon Excellence <${from}>`,
    to,
    subject: `Neue Kontaktanfrage von ${name}`,
    reply_to: email,
    html: `
      <div style="font-family: 'Source Sans Pro', Arial, sans-serif; color: #0f172a;">
        <h1 style="font-size: 20px; margin-bottom: 12px;">Neue Nachricht über das Kontaktformular</h1>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>E-Mail:</strong> <a href="mailto:${email}">${email}</a></p>
        ${source ? `<p><strong>Quelle:</strong> ${source}</p>` : ''}
        <p style="margin-top: 16px; white-space: pre-line;">${safeMessage}</p>
      </div>
    `,
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
    headers: buildComplianceHeaders(),
  });
}

export async function sendAppointmentConfirmationEmail(appointmentId: string) {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('appointments')
    .select('*, service:services(*), staff:staff(*), location:locations(*), customer:customers(email, preferred_name)')
    .eq('id', appointmentId)
    .single();

  if (error || !data) {
    console.error('Appointment lookup for confirmation failed', { appointmentId, error });
    return;
  }

  const { service, staff, location, customer, ...appointmentFields } = data as typeof data & {
    service: ServicesRow;
    staff: StaffRow;
    location: LocationRow;
    customer: { email: string | null; preferred_name: string | null } | null;
  };

  const email = customer?.email ?? '';
  if (!email) {
    console.warn('Skipping confirmation email due to missing customer email', { appointmentId });
    return;
  }

  const preferred = customer?.preferred_name?.trim() ?? email;
  const [firstName, ...rest] = preferred.split(' ');
  const lastName = rest.join(' ') || firstName;

  const appointment = appointmentFields as AppointmentRow;
  const ics = createICSEvent({ appointment, service, staff, location });

  await sendBookingConfirmation({
    appointment,
    service,
    staff,
    customer: { email, firstName, lastName },
    location,
    ics,
  });
}
