import type { Handler } from '@netlify/functions';
import { sendAppointmentConfirmationEmail } from '../../lib/mail';
import { fetchSumUpCheckout } from '../../lib/sumup';
import { createServiceClient } from './_shared/supabase';

export const handler: Handler = async (event) => {
  const supabase = createServiceClient();
  const payload = event.body ? JSON.parse(event.body) : {};
  const checkoutId = payload?.id ?? payload?.checkout_id ?? payload?.checkoutId;

  if (!checkoutId) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Missing checkout id' }) };
  }

  try {
    const { data: existingLog } = await supabase
      .from('webhook_logs')
      .select('id, status')
      .eq('provider', 'sumup')
      .eq('event_id', checkoutId)
      .maybeSingle();

    if (existingLog?.status === 'success') {
      return { statusCode: 200, body: JSON.stringify({ message: 'duplicate' }) };
    }

    const checkout = await fetchSumUpCheckout(checkoutId);

    await supabase
      .from('webhook_logs')
      .upsert(
        {
          provider: 'sumup',
          event_id: checkout.id,
          event_type: 'checkout.webhook',
          status: 'received',
          payload: checkout as unknown as Record<string, unknown>,
        },
        { onConflict: 'provider,event_id' },
      );

    if (['PAID', 'SETTLED', 'SUCCESSFUL'].includes(checkout.status.toUpperCase())) {
      const { data: appointment } = await supabase
        .from('appointments')
        .select('id, status, payment_status, confirmed_at')
        .eq('sumup_checkout_id', checkoutId)
        .maybeSingle();

      if (appointment && appointment.status === 'CONFIRMED' && appointment.payment_status === 'PAID') {
        return { statusCode: 200, body: JSON.stringify({ message: 'ok' }) };
      }

      if (appointment?.id) {
        await supabase
          .from('appointments')
          .update({
            payment_status: 'PAID',
            status: 'CONFIRMED',
            confirmed_at: appointment.confirmed_at ?? new Date().toISOString(),
          })
          .eq('id', appointment.id);

        await sendAppointmentConfirmationEmail(appointment.id);
      }
    }

    await supabase
      .from('webhook_logs')
      .upsert(
        {
          provider: 'sumup',
          event_id: checkoutId,
          event_type: 'checkout.webhook',
          status: 'success',
          payload: checkout as unknown as Record<string, unknown>,
        },
        { onConflict: 'provider,event_id' },
      );

    return { statusCode: 200, body: JSON.stringify({ message: 'ok' }) };
  } catch (error) {
    console.error('SumUp webhook failed', error);
    await supabase
      .from('webhook_logs')
      .upsert(
        {
          provider: 'sumup',
          event_id: checkoutId,
          event_type: 'checkout.webhook',
          status: 'error',
          payload: { message: String(error) },
        },
        { onConflict: 'provider,event_id' },
      );
    return { statusCode: 200, body: JSON.stringify({ message: 'error' }) };
  }
};
