export type Segment = { startedAt: string; stoppedAt: string | null };
export type Entry = {
  id: string;
  label: string;
  startedAt: string;
  stoppedAt: string | null;
  elapsedMs: number;
  segments: Segment[];
};
export type WatchState = { version: 1; revision: number; entries: Entry[] };
export type Action = 'start' | 'pause' | 'resume' | 'stop' | 'rename' | 'delete';

export function activeEntry(state: WatchState): Entry | undefined {
  return state.entries.find((entry) => entry.stoppedAt === null);
}

export function elapsed(entry: Entry, now: number): number {
  return entry.segments.reduce((sum, segment) => sum + Math.max(0,
    (segment.stoppedAt ? Date.parse(segment.stoppedAt) : now) - Date.parse(segment.startedAt)
  ), 0);
}

export function duration(ms: number): string {
  const seconds = Math.floor(Math.max(0, ms) / 1000);
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map((part) => String(part).padStart(2, '0')).join(':');
}

export function todayElapsed(entries: Entry[], now: number): number {
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  return entries.reduce((total, entry) => total + entry.segments.reduce((sum, segment) =>
    sum + Math.max(0, Math.min(now, segment.stoppedAt ? Date.parse(segment.stoppedAt) : now)
      - Math.max(midnight.getTime(), Date.parse(segment.startedAt))), 0), 0);
}
