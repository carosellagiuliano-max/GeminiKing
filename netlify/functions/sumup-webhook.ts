import type { Handler } from '@netlify/functions';
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
    const checkout = await fetchSumUpCheckout(checkoutId);
    await supabase.from('webhook_logs').insert({
      provider: 'sumup',
      event_id: checkout.id,
      event_type: 'checkout.webhook',
      status: 'success',
      payload: checkout as unknown as Record<string, unknown>,
    });

    if (['PAID', 'SETTLED', 'SUCCESSFUL'].includes(checkout.status.toUpperCase())) {
      await supabase
        .from('appointments')
        .update({ payment_status: 'PAID', status: 'CONFIRMED' })
        .eq('sumup_checkout_id', checkoutId);
    }

    return { statusCode: 200, body: JSON.stringify({ message: 'ok' }) };
  } catch (error) {
    console.error('SumUp webhook failed', error);
    await supabase.from('webhook_logs').insert({
      provider: 'sumup',
      event_id: checkoutId,
      event_type: 'checkout.webhook',
      status: 'error',
      payload: { message: String(error) },
    });
    return { statusCode: 500, body: JSON.stringify({ message: 'error' }) };
  }
};
