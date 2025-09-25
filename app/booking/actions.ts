'use server';

import { revalidatePath } from 'next/cache';
import Stripe from 'stripe';
import { z } from 'zod';
import { DateTime, toISOStringOrThrow } from '@/lib/datetime';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import type {
  AppointmentResourceRow,
  AppointmentRow,
  ServiceResourceRow,
  ServicesRow,
  StaffRow,
} from '@/lib/supabase/types';
import { getSiteUrl } from '@/lib/url';
import { createSumUpCheckoutLink } from '@/lib/sumup';
import { nanoid } from 'nanoid';

const bookingSchema = z.object({
  serviceId: z.string().uuid(),
  staffId: z.string().uuid(),
  slotStart: z.string(),
  customer: z.object({
    email: z.string().email(),
    phone: z.string().min(4),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    marketingOptIn: z.boolean().optional().default(false),
  }),
  notes: z.string().max(1000).optional(),
  paymentMethod: z.enum(['stripe', 'sumup']),
});

interface BookingResult {
  appointmentId: string;
  status: 'PENDING' | 'CONFIRMED';
  paymentStatus: 'UNPAID' | 'PAID';
  stripeCheckoutUrl?: string;
  sumupCheckoutUrl?: string;
}

async function ensureCustomer(
  supabase: ReturnType<typeof createSupabaseServiceRoleClient>,
  customer: z.infer<typeof bookingSchema>['customer'],
) {
  const { data: existing } = await supabase
    .from('customers')
    .select('*')
    .eq('email', customer.email)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('customers')
      .update({
        phone: customer.phone,
        preferred_name: `${customer.firstName} ${customer.lastName}`.trim(),
        marketing_opt_in: customer.marketingOptIn,
      })
      .eq('id', existing.id);
    return existing.id;
  }

  const { data: inserted, error } = await supabase
    .from('customers')
    .insert({
      email: customer.email,
      phone: customer.phone,
      preferred_name: `${customer.firstName} ${customer.lastName}`.trim(),
      marketing_opt_in: customer.marketingOptIn,
    })
    .select('*')
    .single();

  if (error || !inserted) {
    throw new Error('Kundendaten konnten nicht gespeichert werden.');
  }

  return inserted.id;
}

async function createStripeCheckout(
  appointment: AppointmentRow,
  service: ServicesRow,
  customer: z.infer<typeof bookingSchema>['customer'],
): Promise<string> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY ist nicht gesetzt.');
  }
  const stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' as any });
  const successUrl =
    process.env.STRIPE_SUCCESS_URL ?? `${getSiteUrl()}/booking/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = process.env.STRIPE_CANCEL_URL ?? `${getSiteUrl()}/booking`;

  const session = await stripe.checkout.sessions.create(
    {
      mode: 'payment',
      currency: 'chf',
      locale: 'de',
      metadata: {
        appointmentId: appointment.id,
        appointmentPublicId: appointment.public_id,
      },
      customer_email: customer.email,
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'chf',
            unit_amount: service.price_chf,
            product_data: {
              name: service.name,
              description: service.description ?? undefined,
            },
          },
        },
      ],
      expires_at: Math.floor(Date.now() / 1000) + 60 * 30,
    },
    {
      idempotencyKey: `checkout-${appointment.id}`,
    },
  );

  if (!session.url) {
    throw new Error('Stripe Checkout URL konnte nicht erzeugt werden.');
  }

  return session.url;
}

async function createSumUpCheckout(
  appointment: AppointmentRow,
  service: ServicesRow,
  customer: z.infer<typeof bookingSchema>['customer'],
): Promise<{ id: string; url: string }> {
  const merchantCode = process.env.SUMUP_MERCHANT_CODE;
  const redirectUrl = process.env.SUMUP_REDIRECT_URL ?? `${getSiteUrl()}/api/sumup/return`;

  if (!merchantCode) {
    throw new Error('SumUp Credentials fehlen.');
  }

  const checkout = await createSumUpCheckoutLink({
    amount: service.price_chf / 100,
    description: `${service.name} – ${customer.firstName} ${customer.lastName}`,
    checkoutReference: appointment.id,
    email: customer.email,
    returnUrl: redirectUrl,
    merchantCode,
  });

  return { id: checkout.checkout_id, url: checkout.checkout_url };
}

async function persistAppointmentResources(
  supabase: ReturnType<typeof createSupabaseServiceRoleClient>,
  appointmentId: string,
  serviceResources: ServiceResourceRow[],
) {
  if (serviceResources.length === 0) {
    return;
  }

  const rows = serviceResources.map((resource) => ({
    appointment_id: appointmentId,
    resource_id: resource.resource_id,
    quantity: resource.quantity,
  })) as AppointmentResourceRow[];

  await supabase.from('appointment_resources').insert(rows);
}

export async function createBooking(input: z.infer<typeof bookingSchema>): Promise<BookingResult> {
  const payload = bookingSchema.parse(input);
  const supabase = createSupabaseServiceRoleClient();

  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('*')
    .eq('id', payload.serviceId)
    .single();

  if (serviceError || !service) {
    throw new Error('Service konnte nicht geladen werden.');
  }

  const { data: staffOverride, error: staffOverrideError } = await supabase
    .from('staff_services')
    .select('*')
    .eq('service_id', payload.serviceId)
    .eq('staff_id', payload.staffId)
    .maybeSingle();

  if (staffOverrideError) {
    throw new Error('Service-Verfügbarkeit konnte nicht geprüft werden.');
  }

  const { data: staffMember, error: staffError } = await supabase
    .from('staff')
    .select('*')
    .eq('id', payload.staffId)
    .single();

  if (staffError || !staffMember) {
    throw new Error('Teammitglied konnte nicht gefunden werden.');
  }

  const { data: location, error: locationError } = await supabase
    .from('locations')
    .select('*')
    .eq('id', staffMember.location_id)
    .single();

  if (locationError || !location) {
    throw new Error('Standort nicht gefunden.');
  }

  const { data: serviceResourcesData, error: serviceResourcesError } = await supabase
    .from('service_resources')
    .select('*')
    .eq('service_id', payload.serviceId);

  if (serviceResourcesError) {
    throw new Error('Service-Ressourcen konnten nicht geladen werden.');
  }

  const serviceResources = serviceResourcesData ?? [];

  const from = DateTime.fromISO(payload.slotStart, { zone: location.timezone });
  const durationMinutes = staffOverride?.duration_minutes ?? service.duration_minutes;
  const bufferBefore = staffOverride?.buffer_before_minutes ?? service.buffer_before_minutes;
  const bufferAfter = staffOverride?.buffer_after_minutes ?? service.buffer_after_minutes;
  const start = from.toUTC();
  const end = start.plus({ minutes: durationMinutes });
  const startIso = toISOStringOrThrow(start);
  const endIso = toISOStringOrThrow(end);

  const appointmentPublicId = nanoid(10);
  const customerId = await ensureCustomer(supabase, payload.customer);

  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .insert({
      public_id: appointmentPublicId,
      staff_id: payload.staffId,
      customer_id: customerId,
      location_id: staffMember.location_id,
      service_id: payload.serviceId,
      start_at: startIso,
      end_at: endIso,
      status: 'PENDING',
      payment_status: payload.paymentMethod === 'stripe' ? 'UNPAID' : 'UNPAID',
      total_amount_chf: staffOverride?.price_chf ?? service.price_chf,
      notes: payload.notes ?? null,
      metadata: {
        locale: 'de-CH',
        buffer_before_minutes: bufferBefore,
        buffer_after_minutes: bufferAfter,
      },
    })
    .select('*')
    .single();

  if (appointmentError || !appointment) {
    throw new Error('Termin konnte nicht gespeichert werden.');
  }

  await persistAppointmentResources(supabase, appointment.id, serviceResources);

  let stripeCheckoutUrl: string | undefined;
  let sumupCheckout: { id: string; url: string } | undefined;

  if (payload.paymentMethod === 'stripe') {
    stripeCheckoutUrl = await createStripeCheckout(appointment, service, payload.customer);
    await supabase
      .from('appointments')
      .update({ stripe_checkout_id: stripeCheckoutUrl })
      .eq('id', appointment.id);
  } else {
    sumupCheckout = await createSumUpCheckout(appointment, service, payload.customer);
    await supabase
      .from('appointments')
      .update({ sumup_checkout_id: sumupCheckout.id })
      .eq('id', appointment.id);
  }

  await supabase.from('analytics_events').insert({
    event_name: 'booking.created',
    event_properties: {
      appointment_id: appointment.id,
      payment_method: payload.paymentMethod,
      service_id: payload.serviceId,
    },
  });

  revalidatePath('/portal');

  const normalizedStatus: BookingResult['status'] = appointment.status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING';
  const normalizedPaymentStatus: BookingResult['paymentStatus'] =
    appointment.payment_status === 'PAID' ? 'PAID' : 'UNPAID';

  return {
    appointmentId: appointment.id,
    status: normalizedStatus,
    paymentStatus: normalizedPaymentStatus,
    stripeCheckoutUrl,
    sumupCheckoutUrl: sumupCheckout?.url,
  };
}
