export const OPENING_HOURS = {
  /** Café opens daily at this time. */
  opensAt: "09:30",
  /**
   * Latest bookable slot. Tied to when the kitchen closes rather than the
   * café: a guest who books a table should still be able to order food.
   * Drinks run until closing and need no reservation.
   */
  lastSlotAt: "18:00",
  closesAt: "19:00",
  kitchenClosesAt: "18:00",
  slotMinutes: 15,
  /** Guests cannot book further ahead than this. */
  maxDaysAhead: 180,
  /** A same-day booking needs at least this much lead time. */
  minLeadMinutes: 30,
} as const;

export const CAFE_TIME_ZONE = "Europe/Berlin";

export function timeToMinutes(time: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Every bookable slot, e.g. 09:30, 09:45, ... 18:30. */
export function bookableTimeSlots(): string[] {
  const start = timeToMinutes(OPENING_HOURS.opensAt);
  const end = timeToMinutes(OPENING_HOURS.lastSlotAt);
  if (start === null || end === null) return [];

  const slots: string[] = [];
  for (let m = start; m <= end; m += OPENING_HOURS.slotMinutes) {
    slots.push(minutesToTime(m));
  }
  return slots;
}

export function isWithinOpeningHours(time: string): boolean {
  const minutes = timeToMinutes(time);
  const start = timeToMinutes(OPENING_HOURS.opensAt);
  const end = timeToMinutes(OPENING_HOURS.lastSlotAt);
  if (minutes === null || start === null || end === null) return false;
  return minutes >= start && minutes <= end;
}

/**
 * "Now" as the café experiences it. The server runs in UTC, so comparing a
 * reservation against the server clock would reject or accept the wrong
 * slots around midnight and across daylight saving changes.
 */
export function cafeNow(): { date: string; time: string; minutes: number } {
  // "sv-SE" formats as YYYY-MM-DD HH:mm, which sorts and parses predictably.
  const formatted = new Intl.DateTimeFormat("sv-SE", {
    timeZone: CAFE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());

  const [date, time] = formatted.split(" ");
  return { date, time, minutes: timeToMinutes(time) ?? 0 };
}

/** Latest date guests may book, as YYYY-MM-DD in café time. */
export function latestBookableDate(): string {
  const now = new Date();
  now.setUTCDate(now.getUTCDate() + OPENING_HOURS.maxDaysAhead);
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: CAFE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export const openingHoursLabel = `${OPENING_HOURS.opensAt} – ${OPENING_HOURS.closesAt} Uhr`;
export const bookingWindowLabel = `Reservierungen ${OPENING_HOURS.opensAt} – ${OPENING_HOURS.lastSlotAt} Uhr`;
