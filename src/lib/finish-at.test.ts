import { expect, it } from 'vitest';
import { transition, validate } from './engine';
import type { WatchState } from './timer';

const base = Date.parse('2026-11-08T19:00:00Z');
const at = (minutes: number) => new Date(base + minutes * 60_000).toISOString();
const original: WatchState = { version: 1, revision: 5, entries: [{
  id: 'task', label: 'Writing', startedAt: at(0), stoppedAt: null, elapsedMs: 600_000,
  segments: [{ startedAt: at(0), stoppedAt: at(10) }, { startedAt: at(30), stoppedAt: null }]
}] };
const save = (minute: number, state = original, id = 'task') => transition(state,
  { action: 'stopAt', id, revision: state.revision, stoppedAt: at(minute) }, base + 60 * 60_000);

it.each([[5, 5, 1], [20, 10, 1], [45, 25, 2], [0, 0, 1]])(
  'corrects a finish at minute %i to %i minutes of work across %i intervals', (cut, work, segments) => {
    const result = validate(save(cut));
    expect(result.entries[0]).toMatchObject({ stoppedAt: at(cut), elapsedMs: work * 60_000 });
    expect(result.entries[0].segments).toHaveLength(segments);
    expect(original.entries[0].stoppedAt).toBeNull();
  });
it('can finish a paused session without counting the break', () => {
  const paused = transition(original, { action: 'pause', revision: 5 }, base + 40 * 60_000);
  expect(validate(save(50, paused)).entries[0].elapsedMs).toBe(20 * 60_000);
});
it('rejects impossible cutoffs and a correction targeting a different task', () => {
  expect(() => save(-1)).toThrow(/start/);
  expect(() => save(61)).toThrow(/future/);
  expect(() => save(30, original, 'other')).toThrow(/changed/);
});
