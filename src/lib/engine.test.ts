import { describe, expect, it } from 'vitest';
import { nextSessionLabel, transition, validate } from './engine';
import type { Entry, WatchState } from './timer';

function history(labels: string[]): WatchState {
  const stamp = '2026-11-08T14:00:00.000Z';
  return { version: 1, revision: 0, entries: labels.map((label, id): Entry => ({
    id: String(id), label, startedAt: stamp, stoppedAt: stamp,
    elapsedMs: 0, segments: [{ startedAt: stamp, stoppedAt: stamp }]
  })) };
}

describe('repeated sessions', () => {
  it('increments the highest exact family number rather than nesting suffixes or filling gaps', () => {
    const state = history(['Writing', 'Writing #2', 'Writing #9', 'Writing draft #80', 'writing #30']);
    expect(nextSessionLabel('Writing', state.entries)).toBe('Writing #10');
    expect(nextSessionLabel('Writing #2', state.entries)).toBe('Writing #10');
    expect(nextSessionLabel('Writing draft #80', state.entries)).toBe('Writing draft #81');
    expect(nextSessionLabel('Issue #42 notes', state.entries)).toBe('Issue #42 notes #2');
  });

  it('keeps long labels valid and finds existing numbers when the suffix needs more space', () => {
    const label = 'W'.repeat(160);
    const state = history([label, 'W'.repeat(157) + ' #9', 'W'.repeat(156) + ' #10']);
    const next = transition(state, { action: 'repeat', revision: 0, id: '0' });
    expect(next.entries[0].label).toBe('W'.repeat(156) + ' #11');
    expect(next.entries[0].label.length).toBe(160);
    expect(validate(next)).toEqual(next);
    expect(nextSessionLabel(state.entries[2].label, next.entries)).toBe('W'.repeat(156) + ' #12');
  });

  it('rejects a missing source or stale revision without mutating history', () => {
    const state = history(['Writing']);
    const original = JSON.stringify(state);
    expect(() => transition(state, { action: 'repeat', revision: 0, id: 'gone' })).toThrow('Task not found');
    expect(() => transition(state, { action: 'repeat', revision: -1, id: '0' })).toThrow('another tab');
    expect(JSON.stringify(state)).toBe(original);
  });
});
