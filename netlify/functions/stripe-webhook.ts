import type { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { sendAppointmentConfirmationEmail } from '../../lib/mail';
import { createServiceClient } from './_shared/supabase';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecret || !webhookSecret) {
  throw new Error('Stripe credentials missing');
}

const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' as any });

export const handler: Handler = async (event) => {
  const signature = event.headers['stripe-signature'];
  if (!signature) {
    return { statusCode: 400, body: 'Missing Stripe signature' };
  }

  const rawBody = event.body ? (event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body) : '';

  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error('Stripe signature verification failed', error);
    return { statusCode: 400, body: 'Invalid signature' };
  }

  const supabase = createServiceClient();

  try {
    const { data: existingLog } = await supabase
      .from('webhook_logs')
      .select('id, status')
      .eq('provider', 'stripe')
      .eq('event_id', stripeEvent.id)
      .maybeSingle();

    if (existingLog?.status === 'success') {
      return { statusCode: 200, body: 'duplicate' };
    }

    await supabase
      .from('webhook_logs')
      .upsert(
        {
          provider: 'stripe',
          event_id: stripeEvent.id,
          event_type: stripeEvent.type,
          status: 'received',
          payload: stripeEvent as unknown as Record<string, unknown>,
        },
        { onConflict: 'provider,event_id' },
      );

    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        const appointmentIdFromMetadata = session.metadata?.appointmentId ?? null;

        const { data: appointmentByCheckout } = await supabase
          .from('appointments')
          .select('id, status, payment_status, confirmed_at')
          .eq('stripe_checkout_id', session.id)
          .maybeSingle();

        const { data: appointmentById } =
          !appointmentByCheckout && appointmentIdFromMetadata
            ? await supabase
                .from('appointments')
                .select('id, status, payment_status, confirmed_at')
                .eq('id', appointmentIdFromMetadata)
                .maybeSingle()
            : { data: null };

        const appointment = appointmentByCheckout ?? appointmentById;

        if (!appointment?.id) {
          console.warn('Stripe webhook without matching appointment', {
            appointmentIdFromMetadata,
            stripeCheckoutId: session.id,
          });
          break;
        }

        if (appointment.status === 'CONFIRMED' && appointment.payment_status === 'PAID') {
          break;
        }

        const { error: updateError } = await supabase
          .from('appointments')
          .update({
            payment_status: 'PAID',
            status: 'CONFIRMED',
            stripe_checkout_id: session.id,
            stripe_payment_intent_id: session.payment_intent?.toString() ?? null,
            confirmed_at: appointment.confirmed_at ?? new Date().toISOString(),
          })
          .eq('id', appointment.id);

        if (updateError) {
          throw updateError;
        }

        await sendAppointmentConfirmationEmail(appointment.id);
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent;
        const appointmentId = paymentIntent.metadata?.appointmentId;
        if (!appointmentId) break;

        await supabase
          .from('appointments')
          .update({
            payment_status: 'UNPAID',
          })
          .eq('id', appointmentId);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error('Stripe webhook processing failed', error);
    await supabase
      .from('webhook_logs')
      .upsert(
        {
          provider: 'stripe',
          event_id: stripeEvent.id,
          event_type: stripeEvent.type,
          status: 'error',
          payload: { message: String(error) },
        },
        { onConflict: 'provider,event_id' },
      );
    return { statusCode: 200, body: 'error' };
  }

  await supabase
    .from('webhook_logs')
    .upsert(
      {
        provider: 'stripe',
        event_id: stripeEvent.id,
        event_type: stripeEvent.type,
        status: 'success',
        payload: stripeEvent as unknown as Record<string, unknown>,
      },
      { onConflict: 'provider,event_id' },
    );

  return { statusCode: 200, body: 'ok' };
};
