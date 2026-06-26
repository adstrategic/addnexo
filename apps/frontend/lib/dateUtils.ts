/**
 * Date helpers shared across features.
 *
 * The backend stores several columns as `@db.Date` (no time component), so the
 * UI works with calendar dates and only attaches a time when sending.
 */

/** Strip the time component, returning a Date at local midnight (for date-only comparisons). */
export function toDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Combine a calendar date with the current time-of-day in UTC and return it as
 * an ISO string. Used when submitting `@db.Date` fields so the stored day is
 * stable regardless of the client timezone.
 */
export function combineDateWithCurrentTimeUTC(date: Date): string {
  const now = new Date();
  const combined = new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds(),
      now.getUTCMilliseconds(),
    ),
  );
  return combined.toISOString();
}
