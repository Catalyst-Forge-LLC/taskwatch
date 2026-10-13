import { activeEntry, elapsed, type Action, type Entry, type WatchState } from './timer';

export class StoreError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

const isDate = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));

export function validate(value: unknown): WatchState {
  const state = value as WatchState;
  if (!state || state.version !== 1 || !Number.isSafeInteger(state.revision) || state.revision < 0 || !Array.isArray(state.entries)) {
    throw new Error('Invalid Taskwatch file format');
  }
  const ids = new Set<string>();
  for (const entry of state.entries) {
    if (!entry || typeof entry.id !== 'string' || !entry.id || ids.has(entry.id) || typeof entry.label !== 'string' || !entry.label.trim() || entry.label.length > 160
      || !isDate(entry.startedAt) || !(entry.stoppedAt === null || isDate(entry.stoppedAt))
      || !Number.isFinite(entry.elapsedMs) || entry.elapsedMs < 0 || !Array.isArray(entry.segments) || !entry.segments.length) {
      throw new Error('Invalid Taskwatch entry');
    }
    ids.add(entry.id);
    let previousEnd = Date.parse(entry.startedAt);
    entry.segments.forEach((segment, index) => {
      if (!segment || !isDate(segment.startedAt) || !(segment.stoppedAt === null || isDate(segment.stoppedAt))
        || Date.parse(segment.startedAt) < previousEnd
        || (segment.stoppedAt !== null && Date.parse(segment.stoppedAt) < Date.parse(segment.startedAt))
        || (segment.stoppedAt === null && (index !== entry.segments.length - 1 || entry.stoppedAt !== null))) {
        throw new Error('Invalid Taskwatch interval');
      }
      previousEnd = Date.parse(segment.stoppedAt ?? segment.startedAt);
    });
    if (entry.startedAt !== entry.segments[0].startedAt || (entry.stoppedAt !== null && Date.parse(entry.stoppedAt) < previousEnd)) {
      throw new Error('Invalid Taskwatch timestamps');
    }
    if (entry.elapsedMs !== elapsed(entry, previousEnd)) throw new Error('Invalid Taskwatch elapsed time');
  }
  if (state.entries.filter((entry) => entry.stoppedAt === null).length > 1) throw new Error('Multiple active tasks in file');
  return state;
}


export type Mutation = { action?: unknown; revision?: unknown; label?: unknown; id?: unknown; data?: unknown };

export function transition(current: WatchState, input: Mutation, now = Date.now(), uuid = () => crypto.randomUUID()): WatchState {
  // Timer documents are JSON values. JSON cloning also accepts reactive UI
  // proxies, which structuredClone rejects even when their contents are valid.
  const state: WatchState = JSON.parse(JSON.stringify(current));
  if (state.revision >= Number.MAX_SAFE_INTEGER) throw new StoreError('History revision limit reached.');
      if (!Number.isSafeInteger(input.revision)) throw new StoreError('A valid revision is required.');
      if (input.revision !== state.revision) throw new StoreError('The timer changed in another tab. It has been refreshed; please try again.', 409);
      const action = input.action as Action;
      const stamp = new Date(now).toISOString();
      const active = activeEntry(state);
      const label = () => {
        if (typeof input.label !== 'string' || !input.label.trim() || input.label.trim().length > 160) {
          throw new StoreError('Give your task a label of 1–160 characters.');
        }
        return input.label.trim();
      };
      const close = (entry: Entry) => {
        const segment = entry.segments.at(-1)!;
        if (segment.stoppedAt === null) segment.stoppedAt = stamp;
        entry.elapsedMs = elapsed(entry, now);
      };
      if (action === 'import') {
        let imported: WatchState;
        try { imported = validate(input.data); }
        catch (error) { throw new StoreError(error instanceof Error ? error.message : 'Invalid import.'); }
        state.entries = JSON.parse(JSON.stringify(imported.entries));
      } else if (action === 'start') {
        if (active) throw new StoreError('Stop the current task before starting another.', 409);
        state.entries.unshift({ id: uuid(), label: label(), startedAt: stamp, stoppedAt: null,
          elapsedMs: 0, segments: [{ startedAt: stamp, stoppedAt: null }] });
      } else if (action === 'rename' || action === 'delete') {
        const entry = state.entries.find((entry) => entry.id === input.id);
        if (!entry) throw new StoreError('Task not found.', 404);
        if (action === 'rename') entry.label = label();
        else {
          if (!entry.stoppedAt) throw new StoreError('Stop the task before deleting it.');
          state.entries = state.entries.filter((item) => item.id !== entry.id);
        }
      } else if (action === 'pause' || action === 'resume' || action === 'stop') {
        if (!active) throw new StoreError('There is no active task.', 409);
        const running = active.segments.at(-1)!.stoppedAt === null;
        const lastTime = Date.parse(active.segments.at(-1)!.stoppedAt ?? active.segments.at(-1)!.startedAt);
        if (now < lastTime) throw new StoreError('Your system clock moved backwards. Correct it before changing the timer.');
        if (action === 'pause') {
          if (!running) throw new StoreError('The timer is already paused.', 409);
          close(active);
        } else if (action === 'resume') {
          if (running) throw new StoreError('The timer is already running.', 409);
          active.segments.push({ startedAt: stamp, stoppedAt: null });
        } else { close(active); active.stoppedAt = stamp; }
      } else throw new StoreError('Unknown timer action.');
      state.revision++;
  return state;
}
