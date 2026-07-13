// Shared helpers for default trip dates so all pages agree.
// Default trip starts ~3 weeks from today (a common realistic booking window).

export const DEFAULT_TRIP_LEAD_DAYS = 21;

export function getDefaultTripStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + DEFAULT_TRIP_LEAD_DAYS);
  return d;
}

export function getDefaultTripEnd(days: number = 5, start?: Date | null): Date {
  const s = start ? new Date(start) : getDefaultTripStart();
  s.setDate(s.getDate() + Math.max(1, days) - 1);
  return s;
}

export function resolveTripDates(
  start: Date | null | undefined,
  end: Date | null | undefined,
  days: number = 5,
): { start: Date; end: Date } {
  const s = start ? new Date(start) : getDefaultTripStart();
  const e = end ? new Date(end) : getDefaultTripEnd(days, s);
  return { start: s, end: e };
}
