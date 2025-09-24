import { DateTime, Duration, Interval, Settings } from 'luxon';

const ZURICH_ZONE = 'Europe/Zurich';

Settings.throwOnInvalid = true;

export function toZurich(date: Date | string | DateTime) {
  if (date instanceof DateTime) {
    return date.setZone(ZURICH_ZONE, { keepLocalTime: false });
  }

  if (date instanceof Date) {
    return DateTime.fromJSDate(date, { zone: 'utc' }).setZone(ZURICH_ZONE);
  }

  return DateTime.fromISO(date, { zone: 'utc' }).setZone(ZURICH_ZONE);
}

export function fromLocal(date: string, zone = ZURICH_ZONE) {
  return DateTime.fromISO(date, { zone });
}

export function formatDisplay(date: DateTime) {
  return date.setZone(ZURICH_ZONE).toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS, {
    locale: 'de-CH',
  });
}

export function calculateEnd({
  start,
  durationMinutes,
  bufferBeforeMinutes = 0,
  bufferAfterMinutes = 0,
}: {
  start: DateTime;
  durationMinutes: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
}) {
  return start
    .minus({ minutes: bufferBeforeMinutes })
    .plus({ minutes: bufferBeforeMinutes + durationMinutes + bufferAfterMinutes });
}

export function overlap(intervalA: Interval, intervalB: Interval) {
  return intervalA.overlaps(intervalB);
}

export function expandInterval(interval: Interval, minutes: number) {
  return Interval.fromDateTimes(
    interval.start.minus(Duration.fromObject({ minutes })),
    interval.end.plus(Duration.fromObject({ minutes })),
  );
}

export function roundToSlot(date: DateTime, slotMinutes: number) {
  const minute = date.minute + date.second / 60 + date.millisecond / 60000;
  const rounded = Math.ceil(minute / slotMinutes) * slotMinutes;
  return date.startOf('hour').plus({ minutes: rounded });
}

export function isHoliday(date: DateTime, cantonHolidays: string[]) {
  return cantonHolidays.includes(date.toISODate());
}

export function formatCurrencyCHF(amountInRappen: number) {
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(
    amountInRappen / 100,
  );
}

export { DateTime, Duration, Interval };
