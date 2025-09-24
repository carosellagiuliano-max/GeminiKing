import type { Handler } from '@netlify/functions';
import { fetchSumUpCheckout } from '../../lib/sumup';
import { createServiceClient } from './_shared/supabase';

const PAID_STATES = ['PAID', 'SETTLED', 'SUCCESSFUL'];

export const handler: Handler = async () => {
  const supabase = createServiceClient();
  const { data: appointments = [], error } = await supabase
    .from('appointments')
    .select('id, sumup_checkout_id, payment_status, status, metadata')
    .not('sumup_checkout_id', 'is', null)
    .eq('payment_status', 'UNPAID');

  if (error) {
    console.error('Failed to load SumUp appointments', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Failed to load appointments' }) };
  }

  let reconciled = 0;

  for (const appointment of appointments) {
    if (!appointment.sumup_checkout_id) continue;
    try {
      const checkout = await fetchSumUpCheckout(appointment.sumup_checkout_id);
      if (PAID_STATES.includes(checkout.status.toUpperCase())) {
        await supabase
          .from('appointments')
          .update({ payment_status: 'PAID', status: appointment.status === 'PENDING' ? 'CONFIRMED' : appointment.status })
          .eq('id', appointment.id);

        await supabase.from('webhook_logs').insert({
          provider: 'sumup',
          event_id: checkout.id,
          event_type: 'checkout.reconciled',
          status: 'success',
          payload: checkout as unknown as Record<string, unknown>,
        });

        reconciled += 1;
      }
    } catch (reconcileError) {
      console.error('Failed to reconcile SumUp checkout', appointment.sumup_checkout_id, reconcileError);
      await supabase.from('webhook_logs').insert({
        provider: 'sumup',
        event_id: appointment.sumup_checkout_id,
        event_type: 'checkout.reconcile_failed',
        status: 'error',
        payload: { message: String(reconcileError) },
      });
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'SumUp reconciliation complete', reconciled }),
  };
};
