import { describe, expect, it } from 'vitest';
import { DateTime } from '@/lib/datetime';
import { computeAvailableSlots, type SlotContext } from '@/lib/slots/engine';

const baseContext: SlotContext = {
  service: {
    id: 'service-1',
    slug: 'signature-cut',
    name: 'Signature Cut',
    description: 'Haarschnitt',
    duration_minutes: 60,
    buffer_before_minutes: 10,
    buffer_after_minutes: 5,
    price_chf: 18000,
    currency: 'CHF',
    cms_status: 'published',
    is_active: true,
    created_at: '',
    updated_at: '',
  },
  staffMembers: [
    {
      id: 'staff-1',
      location_id: 'location-1',
      display_name: 'Elena',
      bio: null,
      avatar_url: null,
      calendar_color: '#7c3aed',
      active: true,
      created_at: '',
      updated_at: '',
      location: {
        id: 'location-1',
        name: 'Salon Zürich',
        canton: 'ZH',
        street: 'Limmatquai 12',
        postal_code: '8001',
        city: 'Zürich',
        timezone: 'Europe/Zurich',
        notes: null,
        created_at: '',
        updated_at: '',
      },
      override: null,
    },
  ],
  availability: [
    {
      id: 'availability-1',
      staff_id: 'staff-1',
      location_id: 'location-1',
      weekday: 1,
      start_time: '09:00:00',
      end_time: '17:00:00',
      capacity_override: null,
      notes: null,
      created_at: '',
      updated_at: '',
    },
  ],
  timeOff: [],
  appointments: [],
  appointmentResources: [],
  resources: [
    {
      id: 'resource-1',
      location_id: 'location-1',
      name: 'Color Bar',
      capacity: 2,
      created_at: '',
      updated_at: '',
    },
  ],
  serviceResources: [
    {
      service_id: 'service-1',
      resource_id: 'resource-1',
      quantity: 1,
    },
  ],
  canton: 'ZH',
};

describe('computeAvailableSlots', () => {
  it('generates slots respecting buffers and availability', () => {
    const from = DateTime.fromISO('2024-09-03T00:00:00', { zone: 'Europe/Zurich' });
    const to = from.plus({ days: 1 });

    const slots = computeAvailableSlots(baseContext, { from, to });

    expect(slots.length).toBeGreaterThan(0);
    const first = slots[0];
    expect(first.start.toISO()).toContain('T09:10');
    expect(first.end.diff(first.start).as('minutes')).toBe(60);
  });

  it('skips slots that collide with time off', () => {
    const from = DateTime.fromISO('2024-09-03T00:00:00', { zone: 'Europe/Zurich' });
    const to = from.plus({ days: 1 });
    const context: SlotContext = {
      ...baseContext,
      timeOff: [
        {
          id: 'timeoff-1',
          staff_id: 'staff-1',
          start_at: DateTime.fromISO('2024-09-03T11:00:00', { zone: 'Europe/Zurich' }).toUTC().toISO(),
          end_at: DateTime.fromISO('2024-09-03T13:00:00', { zone: 'Europe/Zurich' }).toUTC().toISO(),
          reason: null,
          created_at: '',
          updated_at: '',
        },
      ],
    };

    const slots = computeAvailableSlots(context, { from, to });
    expect(slots.every((slot) => slot.start.hour < 11 || slot.start.hour >= 13)).toBe(true);
  });

  it('prevents overlaps with existing appointments', () => {
    const from = DateTime.fromISO('2024-09-03T00:00:00', { zone: 'Europe/Zurich' });
    const to = from.plus({ days: 1 });
    const existingStart = DateTime.fromISO('2024-09-03T15:00:00', { zone: 'Europe/Zurich' });
    const context: SlotContext = {
      ...baseContext,
      appointments: [
        {
          id: 'appointment-1',
          public_id: 'A1',
          staff_id: 'staff-1',
          customer_id: 'customer-1',
          location_id: 'location-1',
          service_id: 'service-1',
          start_at: existingStart.toUTC().toISO(),
          end_at: existingStart.plus({ minutes: 60 }).toUTC().toISO(),
          appointment_range: null,
          status: 'CONFIRMED',
          payment_status: 'PAID',
          total_amount_chf: 18000,
          currency: 'CHF',
          stripe_checkout_id: null,
          stripe_payment_intent_id: null,
          sumup_checkout_id: null,
          notes: null,
          cancellation_reason: null,
          metadata: {},
          confirmed_at: null,
          cancelled_at: null,
          completed_at: null,
          created_at: '',
          updated_at: '',
        },
      ],
    };

    const slots = computeAvailableSlots(context, { from, to });
    expect(slots.some((slot) => slot.start.hour === 15)).toBe(false);
  });
});
