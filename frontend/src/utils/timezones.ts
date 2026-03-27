import { parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export function getLocalTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function formatTimeInLocalzone(utcIsoString: string): string {
  try {
    const date = parseISO(utcIsoString);
    const timeZone = getLocalTimezone();
    return formatInTimeZone(date, timeZone, 'h:mm a'); 
  } catch (e) {
    return "";
  }
}

export function formatDayInLocalzone(utcIsoString: string): string {
  try {
    const date = parseISO(utcIsoString);
    const timeZone = getLocalTimezone();
    return formatInTimeZone(date, timeZone, 'EEEE, MMMM do');
  } catch (e) {
    return "";
  }
}
