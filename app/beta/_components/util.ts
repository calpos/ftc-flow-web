/** Generate a v4 UUID. The prefix is unused, kept so callers stay unchanged. */
// Ids are UUIDs because the remote id columns are uuid.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function newId(prefix: string): string {
  // Browsers only expose randomUUID in secure contexts (not a LAN http dev URL).
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export type EventTimeState = 'ended' | 'live' | 'future';
export interface EventStatus { state: EventTimeState; label: string; }

export function getEventStatus(
  event: { date: string; startTime: string; endTime?: string },
  now: Date
): EventStatus {
  const [sy, sm, sd] = event.date.split('-').map(Number);
  const [sh, smin] = (event.startTime || '00:00').split(':').map(Number);
  const start = new Date(sy, sm - 1, sd, sh, smin);
  let end: Date;
  if (event.endTime) {
    const [eh, emin] = event.endTime.split(':').map(Number);
    end = new Date(sy, sm - 1, sd, eh, emin);
  } else {
    end = new Date(start.getTime() + 60 * 60 * 1000);
  }
  if (end <= start) end = new Date(end.getTime() + 86400000);
  if (now >= end) return { state: 'ended', label: 'Ended' };
  if (now >= start) return { state: 'live', label: 'Happening now' };
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDayStart = new Date(sy, sm - 1, sd);
  const diffDays = Math.round((eventDayStart.getTime() - todayStart.getTime()) / 86400000);
  function fmt12(hh: number, mm: number) {
    const period = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 === 0 ? 12 : hh % 12;
    return h12 + ':' + String(mm).padStart(2, '0') + ' ' + period;
  }
  const startFmt = fmt12(sh, smin);
  let timeRange = startFmt;
  if (event.endTime) {
    const [eh2, emin2] = event.endTime.split(':').map(Number);
    timeRange = startFmt + '–' + fmt12(eh2, emin2);
  }
  if (diffDays === 0) return { state: 'future', label: 'Today · ' + timeRange };
  if (diffDays === 1) return { state: 'future', label: 'Tomorrow · ' + timeRange };
  return { state: 'future', label: 'In ' + diffDays + ' days' };
}
