import dayjs from 'dayjs';

/**
 * Formats a date string for display in local timezone.
 */
export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = dayjs(value);
  if (d.isValid()) {
    return d.format('M/D/YYYY');
  }
  return '—';
}

/**
 * Gets today's date as YYYY-MM-DD string in local timezone.
 */
export function getLocalToday(): string {
  return dayjs().format('YYYY-MM-DD');
}

/**
 * Extracts date portion (YYYY-MM-DD) from any date string, in local timezone.
 */
export function toLocalDateString(value: string): string {
  return dayjs(value).format('YYYY-MM-DD');
}

/**
 * Checks if a date string represents a future date (after today).
 */
export function isFutureDate(value: string): boolean {
  return dayjs(value).isAfter(dayjs(), 'day');
}

/**
 * Checks if two date strings represent the same day.
 */
export function isSameDay(a: string, b: string): boolean {
  return dayjs(a).isSame(dayjs(b), 'day');
}

/**
 * Checks if a date is within a range (inclusive).
 */
export function isWithinRange(
  value: string,
  start: string | null,
  end: string | null
): boolean {
  const d = dayjs(value);
  if (start && d.isBefore(dayjs(start), 'day')) return false;
  if (end && d.isAfter(dayjs(end), 'day')) return false;
  return true;
}

/**
 * Compares two date strings for sorting.
 */
export function compareDates(a: string, b: string): number {
  return dayjs(a).valueOf() - dayjs(b).valueOf();
}
