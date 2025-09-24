import { DateTime, Interval } from '@/lib/datetime';
import { getCantonHolidaysBetween } from '@/lib/holidays';
import type {
  AppointmentResourceRow,
  AppointmentRow,
  AvailabilityBlockRow,
  LocationRow,
  ResourceRow,
  ServiceResourceRow,
  ServicesRow,
  StaffRow,
  StaffServicesRow,
  TimeOffRow,
} from '@/lib/supabase/types';

export interface SlotRequest {
  from: DateTime;
  to: DateTime;
  staffId?: string;
}

export interface SlotResult {
  start: DateTime;
  end: DateTime;
  staffId: string;
  serviceId: string;
  locationId: string;
  priceChf: number;
}

export interface SlotContext {
  service: ServicesRow;
  staffMembers: Array<StaffRow & { location: LocationRow; override: StaffServicesRow | null }>;
  availability: AvailabilityBlockRow[];
  timeOff: TimeOffRow[];
  appointments: AppointmentRow[];
  appointmentResources: AppointmentResourceRow[];
  resources: ResourceRow[];
  serviceResources: ServiceResourceRow[];
  canton: string;
}

const SLOT_STEP_MINUTES = 5;

function gcd(a: number, b: number) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const temp = y;
    y = x % y;
    x = temp;
  }
  return x || 1;
}

interface ResourceCapacityWindow {
  resourceId: string;
  interval: Interval;
  quantity: number;
}

function buildResourceWindows(
  appointments: AppointmentRow[],
  appointmentResources: AppointmentResourceRow[],
) {
  const grouped: Record<string, ResourceCapacityWindow[]> = {};
  for (const appt of appointments) {
    const interval = Interval.fromDateTimes(
      DateTime.fromISO(appt.start_at, { zone: 'utc' }),
      DateTime.fromISO(appt.end_at, { zone: 'utc' }),
    );

    const resourcesForAppointment = appointmentResources.filter(
      (item) => item.appointment_id === appt.id,
    );

    for (const resource of resourcesForAppointment) {
      if (!grouped[resource.resource_id]) {
        grouped[resource.resource_id] = [];
      }
      grouped[resource.resource_id].push({
        resourceId: resource.resource_id,
        interval,
        quantity: resource.quantity,
      });
    }
  }
  return grouped;
}

function getDurationForStaff(service: ServicesRow, override: StaffServicesRow | null) {
  return {
    duration: override?.duration_minutes ?? service.duration_minutes,
    bufferBefore: override?.buffer_before_minutes ?? service.buffer_before_minutes,
    bufferAfter: override?.buffer_after_minutes ?? service.buffer_after_minutes,
    price: override?.price_chf ?? service.price_chf,
  };
}

function hasTimeOff(timeOff: TimeOffRow[], staffId: string, candidate: Interval) {
  return timeOff.some((block) => {
    if (block.staff_id !== staffId) return false;
    const interval = Interval.fromDateTimes(
      DateTime.fromISO(block.start_at, { zone: 'utc' }),
      DateTime.fromISO(block.end_at, { zone: 'utc' }),
    );
    return interval.overlaps(candidate);
  });
}

function hasAppointmentConflict(appointments: AppointmentRow[], staffId: string, candidate: Interval) {
  return appointments.some((appt) => {
    if (appt.staff_id !== staffId) return false;
    if (!['PENDING', 'CONFIRMED'].includes(appt.status)) return false;
    const interval = Interval.fromDateTimes(
      DateTime.fromISO(appt.start_at, { zone: 'utc' }),
      DateTime.fromISO(appt.end_at, { zone: 'utc' }),
    );
    return interval.overlaps(candidate);
  });
}

function hasResourceCapacityIssue(
  resources: ResourceRow[],
  serviceResources: ServiceResourceRow[],
  resourceWindows: Record<string, ResourceCapacityWindow[]>,
  candidate: Interval,
) {
  if (serviceResources.length === 0) {
    return false;
  }

  for (const requirement of serviceResources) {
    const resource = resources.find((item) => item.id === requirement.resource_id);
    if (!resource) continue;
    const windows = resourceWindows[requirement.resource_id] ?? [];
    let currentLoad = 0;
    for (const window of windows) {
      if (window.interval.overlaps(candidate)) {
        currentLoad += window.quantity;
      }
    }
    if (currentLoad + requirement.quantity > resource.capacity) {
      return true;
    }
  }
  return false;
}

function enumerateDays(start: DateTime, end: DateTime) {
  const dates: DateTime[] = [];
  let cursor = start.startOf('day');
  const limit = end.endOf('day');
  while (cursor <= limit) {
    dates.push(cursor);
    cursor = cursor.plus({ days: 1 });
  }
  return dates;
}

export function computeAvailableSlots(context: SlotContext, request: SlotRequest): SlotResult[] {
  const { from, to, staffId } = request;
  const { service, staffMembers, availability, timeOff, appointments, appointmentResources, resources, serviceResources, canton } =
    context;

  const filteredStaff = staffMembers.filter((member) => member.active && (!staffId || member.id === staffId));
  if (filteredStaff.length === 0) {
    return [];
  }

  const cantonCode = canton || 'ZH';
  const results: SlotResult[] = [];
  const resourceWindows = buildResourceWindows(appointments, appointmentResources);
  const days = enumerateDays(from, to);
  const holidayLookup = new Set<string>();
  for (const year of [from.year, to.year, from.year - 1, to.year + 1]) {
    for (const day of getCantonHolidaysBetween(year, year, cantonCode)) {
      holidayLookup.add(day);
    }
  }

  for (const staffMember of filteredStaff) {
    const { duration, bufferBefore, bufferAfter, price } = getDurationForStaff(service, staffMember.override);
    const slotStep = gcd(duration, SLOT_STEP_MINUTES);

    for (const day of days) {
      if (holidayLookup.has(day.toISODate())) {
        continue;
      }

      const weekdayIndex = (day.weekday + 6) % 7; // convert Monday=1 to 0-6
      const dayBlocks = availability.filter(
        (block) => block.staff_id === staffMember.id && block.weekday === weekdayIndex,
      );

      if (dayBlocks.length === 0) {
        continue;
      }

      for (const block of dayBlocks) {
        const blockStart = DateTime.fromObject(
          {
            year: day.year,
            month: day.month,
            day: day.day,
            hour: Number.parseInt(block.start_time.slice(0, 2), 10),
            minute: Number.parseInt(block.start_time.slice(3, 5), 10),
          },
          { zone: staffMember.location.timezone },
        ).toUTC();
        const blockEnd = DateTime.fromObject(
          {
            year: day.year,
            month: day.month,
            day: day.day,
            hour: Number.parseInt(block.end_time.slice(0, 2), 10),
            minute: Number.parseInt(block.end_time.slice(3, 5), 10),
          },
          { zone: staffMember.location.timezone },
        ).toUTC();

        let cursor = blockStart.plus({ minutes: bufferBefore });
        const finalSlotLatestStart = blockEnd.minus({ minutes: duration + bufferAfter });

        while (cursor <= finalSlotLatestStart) {
          if (
            cursor.toMillis() < from.toUTC().toMillis() ||
            cursor.plus({ minutes: duration }).toMillis() > to.toUTC().toMillis()
          ) {
            cursor = cursor.plus({ minutes: slotStep });
            continue;
          }

          const candidate = Interval.fromDateTimes(
            cursor.minus({ minutes: bufferBefore }),
            cursor.plus({ minutes: duration + bufferAfter }),
          );

          if (hasTimeOff(timeOff, staffMember.id, candidate)) {
            cursor = cursor.plus({ minutes: slotStep });
            continue;
          }

          if (hasAppointmentConflict(appointments, staffMember.id, candidate)) {
            cursor = cursor.plus({ minutes: slotStep });
            continue;
          }

          if (
            hasResourceCapacityIssue(resources, serviceResources, resourceWindows, candidate) ||
            (block.capacity_override && block.capacity_override < 1)
          ) {
            cursor = cursor.plus({ minutes: slotStep });
            continue;
          }

          results.push({
            start: cursor.setZone(staffMember.location.timezone),
            end: cursor.plus({ minutes: duration }).setZone(staffMember.location.timezone),
            staffId: staffMember.id,
            serviceId: service.id,
            locationId: staffMember.location_id,
            priceChf: price,
          });

          cursor = cursor.plus({ minutes: slotStep });
        }
      }
    }
  }

  return results
    .filter((slot) => slot.start >= from && slot.end <= to)
    .sort((a, b) => a.start.toMillis() - b.start.toMillis());
}
