import type { Handler } from '@netlify/functions';
import { DateTime } from 'luxon';
import { sendReminderEmail } from '../../lib/mail';
import { createServiceClient } from './_shared/supabase';

export const handler: Handler = async () => {
  const supabase = createServiceClient();
  const now = DateTime.utc();
  const windowStart = now.plus({ hours: 24 }).startOf('hour');
  const windowEnd = windowStart.plus({ hours: 24 });

  const { data: appointments = [], error } = await supabase
    .from('appointments')
    .select(
      `id, start_at, end_at, status, metadata,
      service:services(name, price_chf, description),
      staff:staff(display_name, location_id),
      location:locations(id, name, street, postal_code, city, timezone),
      customer:customers(email, preferred_name)`
    )
    .eq('status', 'CONFIRMED')
    .gte('start_at', windowStart.toISO())
    .lt('start_at', windowEnd.toISO());

  if (error) {
    console.error('Reminder fetch failed', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Failed to load appointments' }) };
  }

  let processed = 0;
  for (const appointment of appointments as any[]) {
    const metadata = (appointment.metadata ?? {}) as Record<string, unknown>;
    if (metadata.reminder_sent_at) {
      continue;
    }

    const preferredName: string = appointment.customer?.preferred_name ?? '';
    const [firstName = '', lastName = ''] = preferredName.split(' ');
    const email = appointment.customer?.email;
    if (!email) continue;

    await sendReminderEmail({
      appointment,
      service: appointment.service,
      staff: appointment.staff,
      customer: { email, firstName: firstName || 'Kundin', lastName },
      location: appointment.location,
    });

    await supabase
      .from('appointments')
      .update({ metadata: { ...metadata, reminder_sent_at: now.toISO() } })
      .eq('id', appointment.id);

    processed += 1;
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Reminder job executed', processed }),
  };
};
