/** Generate a reasonably unique id with a readable prefix. */
export function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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
