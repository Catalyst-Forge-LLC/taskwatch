const calendar = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
const clock = new Intl.DateTimeFormat(undefined, { timeStyle: 'medium' });

export function timeRange(start: string, stop: string | null): string {
  const from = new Date(start);
  const first = calendar.format(from) + ' · ' + clock.format(from);
  if (!stop) return first;
  const to = new Date(stop);
  return first + ' → ' + (to.toDateString() === from.toDateString() ? '' : calendar.format(to) + ' · ') + clock.format(to);
}

export function workingTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600), m = Math.floor(total / 60) % 60, s = total % 60;
  return [h && h + 'h', m && m + 'm', s && s + 's'].filter(Boolean).join(' ') || '0s';
}
