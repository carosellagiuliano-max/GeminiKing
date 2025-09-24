import type { Handler } from '@netlify/functions';
import Stripe from 'stripe';
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
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        const appointmentId = session.metadata?.appointmentId;
        if (!appointmentId) break;

        await supabase
          .from('appointments')
          .update({
            payment_status: 'PAID',
            status: 'CONFIRMED',
            stripe_checkout_id: session.id,
            stripe_payment_intent_id: session.payment_intent?.toString() ?? null,
          })
          .eq('id', appointmentId);

        await supabase.from('webhook_logs').insert({
          provider: 'stripe',
          event_id: stripeEvent.id,
          event_type: stripeEvent.type,
          status: 'success',
          payload: session as unknown as Record<string, unknown>,
        });
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

        await supabase.from('webhook_logs').insert({
          provider: 'stripe',
          event_id: stripeEvent.id,
          event_type: stripeEvent.type,
          status: 'error',
          payload: paymentIntent as unknown as Record<string, unknown>,
        });
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error('Stripe webhook processing failed', error);
    await supabase.from('webhook_logs').insert({
      provider: 'stripe',
      event_id: stripeEvent.id,
      event_type: stripeEvent.type,
      status: 'error',
      payload: { message: String(error) },
    });
    return { statusCode: 500, body: 'Webhook error' };
  }

  return { statusCode: 200, body: 'ok' };
};
