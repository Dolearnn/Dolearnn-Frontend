export const TIMEZONES = [
  'UTC',
  'Africa/Lagos',
  'Africa/Accra',
  'Africa/Johannesburg',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Dubai',
  'Asia/Kolkata',
] as const;

function formatParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? '0');

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
    second: read('second'),
  };
}

function offsetForUtc(date: Date, timeZone: string) {
  const parts = formatParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return asUtc - date.getTime();
}

export function zonedDateTimeToUtcIso(localDateTime: string, timeZone: string) {
  const match = localDateTime.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
  );

  if (!match) {
    throw new Error('Pick a valid local date and time');
  }

  const [, year, month, day, hour, minute] = match;
  const guess = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      0,
      0,
    ),
  );

  let utc = new Date(guess.getTime() - offsetForUtc(guess, timeZone));
  const refinedOffset = offsetForUtc(utc, timeZone);
  utc = new Date(guess.getTime() - refinedOffset);
  return utc.toISOString();
}

export function formatInTimeZone(
  value: string,
  timeZone: string,
  options?: Intl.DateTimeFormatOptions,
) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';

  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(date);
}
