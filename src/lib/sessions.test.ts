import { expect, it } from 'vitest';
import { sessionFamilies, weeklyGroups, weekStart } from './sessions';
import type { Entry } from './timer';

const monday = new Date(2026, 10, 9, 0, 0, 0).getTime();
const at = (minutes: number) => new Date(monday + minutes * 60_000).toISOString();
function entry(label: string, intervals: [number, number | null][]): Entry {
  const segments = intervals.map(([s, e]) => ({ startedAt: at(s), stoppedAt: e === null ? null : at(e) }));
  return { id: label, label, segments, startedAt: segments[0].startedAt, stoppedAt: segments.at(-1)!.stoppedAt, elapsedMs: 0 };
}

it('groups only this local week’s work, including a running session, and excludes breaks', () => {
  const entries = [entry('Writing', [[-60, 20], [30, 45]]), entry('Writing #2', [[60, null]]),
    entry('writing', [[5, 10]]), entry('Old', [[-60, -2]])];
  const groups = weeklyGroups(entries, sessionFamilies(entries), monday + 75 * 60_000);
  expect(groups.map(g => [g.name, g.total / 60_000, g.sessions.length])).toEqual([['Writing', 50, 2], ['writing', 5, 1]]);
  expect(groups[0].sessions.map(i => i.contribution / 60_000)).toEqual([35, 15]);
  expect(weekStart(new Date(2026, 10, 15, 23, 59).getTime())).toBe(monday);
});
it('recovers the original task name across a suffix growing from one to two digits', () => {
  const root = 'W'.repeat(160);
  const names = [root, root.slice(0, 157) + ' #9', root.slice(0, 156) + ' #10'];
  expect([...sessionFamilies(names.map(n => entry(n, [[1, 2]]))).values()]).toEqual([root, root, root]);
});
