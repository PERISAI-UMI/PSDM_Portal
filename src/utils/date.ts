/**
 * Utilitas format tanggal & waktu zona WITA (UTC+8 / Asia/Makassar)
 */

export const WITA_TIMEZONE = 'Asia/Makassar';

/**
 * Format jam dalam 24 jam zona WITA (HH:mm atau HH:mm:ss)
 */
export function formatWitaTime(date: Date | string | number, includeSeconds = false): string {
  const d = typeof date === 'object' ? date : new Date(date);
  if (isNaN(d.getTime())) return '-';

  const parts = new Intl.DateTimeFormat('id-ID', {
    timeZone: WITA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: false,
  }).formatToParts(d);

  const hour = parts.find((p) => p.type === 'hour')?.value.padStart(2, '0') || '00';
  const minute = parts.find((p) => p.type === 'minute')?.value.padStart(2, '0') || '00';
  
  if (includeSeconds) {
    const second = parts.find((p) => p.type === 'second')?.value.padStart(2, '0') || '00';
    return `${hour}:${minute}:${second}`;
  }

  return `${hour}:${minute}`;
}

/**
 * Format tanggal dalam zona WITA
 */
export function formatWitaDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }
): string {
  const d = typeof date === 'object' ? date : new Date(date);
  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    timeZone: WITA_TIMEZONE,
    ...options,
  }).format(d);
}
