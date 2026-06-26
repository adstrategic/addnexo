/** Business timezone for date-only comparisons (avoids UTC vs local mismatches). */
export const BUSINESS_TZ = "America/Bogota";

/**
 * Timezone for invoice issue/due dates stored as UTC midnight (balance-invoice date picker).
 * Use when formatting or comparing those timestamps so the calendar day matches the DB.
 */
export const INVOICE_DATE_ONLY_TZ = "UTC";

/**
 * Returns calendar date YYYY-MM-DD in the given timezone (default Bogota).
 */
export function toDateStringInTimezone(
  date: Date,
  timeZone: string = BUSINESS_TZ,
): string {
  return date.toLocaleDateString("en-CA", { timeZone });
}

/**
 * Whole calendar days from `fromDate`'s calendar day to `toDate`'s calendar day in `timeZone`
 * (en-CA strings compared as dates). Non-negative.
 */
export function calendarDaysBetweenInTimezone(
  fromDate: Date,
  toDate: Date,
  timeZone: string = BUSINESS_TZ,
): number {
  const fromStr = toDateStringInTimezone(fromDate, timeZone);
  const toStr = toDateStringInTimezone(toDate, timeZone);
  const fromParts = fromStr.split("-").map(Number);
  const toParts = toStr.split("-").map(Number);
  const fy = fromParts[0]!;
  const fm = fromParts[1]!;
  const fd = fromParts[2]!;
  const ty = toParts[0]!;
  const tm = toParts[1]!;
  const td = toParts[2]!;
  const fromUtc = Date.UTC(fy, fm - 1, fd);
  const toUtc = Date.UTC(ty, tm - 1, td);
  return Math.max(0, Math.floor((toUtc - fromUtc) / 86_400_000));
}

/** Short weekday in English for the calendar day in `timeZone` (e.g. "Mon", "Thu"). */
export function getWeekdayShortInTimezone(
  date: Date,
  timeZone: string = BUSINESS_TZ,
): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone,
  }).format(date);
}

export function isMondayOrThursdayInBogota(date: Date): boolean {
  const w = getWeekdayShortInTimezone(date, BUSINESS_TZ);
  return w === "Mon" || w === "Thu";
}

/**
 * True when `asOf` falls on a calendar day strictly after the due date's calendar day in
 * `timeZone` (day boundaries at 00:00), so a due timestamp late in the day does not shorten
 * the grace period.
 */
export function isInvoicePastDue(
  dueDate: Date | string,
  asOf: Date = new Date(),
  timeZone: string = BUSINESS_TZ,
): boolean {
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const dueStr = toDateStringInTimezone(due, timeZone);
  const asOfStr = toDateStringInTimezone(asOf, timeZone);
  return dueStr < asOfStr;
}

/** Calendar date as dd-mm-yyyy in the given timezone. */
export function formatDateDdMmYyyyInTimezone(
  date: Date | string,
  timeZone: string = BUSINESS_TZ,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const [year, month, day] = toDateStringInTimezone(d, timeZone).split("-");
  return `${day}-${month}-${year}`;
}
