import { DateTime, toISODateOrThrow } from './datetime';

function easterSunday(year: number) {
  const f = Math.floor;
  const G = year % 19;
  const C = f(year / 100);
  const H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30;
  const I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11));
  const J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7;
  const L = I - J;
  const month = 3 + f((L + 40) / 44);
  const day = L + 28 - 31 * f(month / 4);
  return DateTime.local(year, month, day);
}

function iso(date: DateTime) {
  return toISODateOrThrow(date);
}

export function getCantonHolidaysBetween(
  startYear: number,
  endYear: number,
  canton: string,
): string[] {
  const holidays = new Set<string>();
  for (let year = startYear; year <= endYear; year += 1) {
    const easter = easterSunday(year);
    holidays.add(`${year}-01-01`); // Neujahr
    holidays.add(`${year}-01-02`); // Berchtoldstag (ZH)
    holidays.add(iso(easter.minus({ days: 2 }))); // Karfreitag
    holidays.add(iso(easter.plus({ days: 1 }))); // Ostermontag
    holidays.add(`${year}-05-01`); // Tag der Arbeit
    holidays.add(iso(easter.plus({ days: 39 }))); // Auffahrt
    holidays.add(iso(easter.plus({ days: 50 }))); // Pfingstmontag
    holidays.add(`${year}-08-01`); // Bundesfeier
    // Knabenschiessen (2. Montag im September + Sonntag davor)
    if (canton.toUpperCase() === 'ZH') {
      const firstSeptember = DateTime.local(year, 9, 1);
      const weekday = firstSeptember.weekday; // 1 = Monday
      const daysToMonday = weekday === 1 ? 0 : (8 - weekday) % 7;
      const knabenschiessenMonday = firstSeptember.plus({ days: daysToMonday + 7 });
      holidays.add(iso(knabenschiessenMonday.minus({ days: 1 })));
      holidays.add(iso(knabenschiessenMonday));
    }
    holidays.add(`${year}-12-25`);
    holidays.add(`${year}-12-26`);
  }
  return Array.from(holidays.values()).sort();
}
