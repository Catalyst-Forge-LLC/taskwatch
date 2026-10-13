import { describe, expect, it } from 'vitest';
import { createBrowserStorage, STORAGE_KEY } from './browser';
import { transition, validate } from '../engine';
import { elapsed, type WatchState } from '../timer';

function fixture() {
  const data = new Map<string, string>();
  const disk = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
  let queue = Promise.resolve();
  const locks = { request: <T>(_name: string, callback: () => Promise<T>) => {
    const next = queue.then(callback);
    queue = next.then(() => undefined, () => undefined);
    return next;
  } } as Pick<LockManager, 'request'>;
  let now = Date.parse('2026-10-13T12:00:00Z');
  return { data, disk, locks, store: createBrowserStorage(disk, locks, () => now), advance: (ms: number) => { now += ms; }, clock: () => now };
}

describe('browser history', () => {
  it('restores a running timer and excludes pauses using the shared rules', async () => {
    const f = fixture();
    await f.store.mutate({ action: 'start', label: 'Browser task', revision: 0 });
    f.advance(10_000);
    await f.store.mutate({ action: 'pause', revision: 1 });
    f.advance(50_000);
    const restored = createBrowserStorage(f.disk, f.locks, f.clock);
    expect(elapsed((await restored.read()).state.entries[0], f.clock())).toBe(10_000);
    await restored.mutate({ action: 'resume', revision: 2 });
    f.advance(15_000);
    expect(elapsed((await restored.read()).state.entries[0], f.clock())).toBe(25_000);
    const stopped = await restored.mutate({ action: 'stop', revision: 3 });
    expect(stopped.state.entries[0].elapsedMs).toBe(25_000);
  });

  it('locks competing tabs so a stale update cannot overwrite the winner', async () => {
    const f = fixture();
    const otherTab = createBrowserStorage(f.disk, f.locks, f.clock);
    const results = await Promise.allSettled([
      f.store.mutate({ action: 'start', label: 'One', revision: 0 }),
      otherTab.mutate({ action: 'start', label: 'Two', revision: 0 })
    ]);
    expect(results.map((r) => r.status)).toEqual(['fulfilled', 'rejected']);
    expect((await f.store.read()).state.entries).toHaveLength(1);
  });

  it('does not report or retain a successful update when storage is full', async () => {
    const f = fixture();
    const disk = { ...f.disk, setItem: () => { throw new Error('QuotaExceededError'); } };
    const store = createBrowserStorage(disk, f.locks, f.clock);
    await expect(store.mutate({ action: 'start', label: 'Work', revision: 0 })).rejects.toThrow('full or blocked');
    expect((await store.read()).state.revision).toBe(0);
  });

  it('leaves corrupt history untouched and permits exporting its raw backup', async () => {
    const f = fixture();
    f.data.set(STORAGE_KEY, '{corrupt');
    await expect(f.store.read()).rejects.toThrow('left untouched');
    await expect(f.store.mutate({ action: 'start', label: 'Work', revision: 0 })).rejects.toThrow();
    expect(await f.store.export()).toBe('{corrupt');
    const restored = await f.store.mutate({ action: 'import', revision: 0, data: { version: 1, revision: 20, entries: [] } });
    expect(restored.state).toEqual({ version: 1, revision: 1, entries: [] });
  });

  it('rejects unavailable storage and unsafe writes without cross-tab locking', async () => {
    const f = fixture();
    const blocked = createBrowserStorage({ ...f.disk, getItem: () => { throw new Error('SecurityError'); } }, f.locks);
    await expect(blocked.read()).rejects.toThrow('unavailable');
    await expect(createBrowserStorage(f.disk, undefined).mutate({ action: 'start', label: 'Work', revision: 0 })).rejects.toThrow('coordinate');
  });

  it('imports existing file-format JSON while preserving the local revision sequence', async () => {
    const f = fixture();
    await f.store.mutate({ action: 'start', label: 'Old', revision: 0 });
    const incoming = transition({ version: 1, revision: 0, entries: [] }, { action: 'start', label: 'Imported', revision: 0 }, f.clock());
    incoming.revision = 90;
    incoming.entries = new Proxy(incoming.entries, {});
    const result = await f.store.mutate({ action: 'import', revision: 1, data: incoming });
    expect(result.state.revision).toBe(2);
    expect(result.state.entries[0].label).toBe('Imported');
    const exportState = validate(JSON.parse(await f.store.export()));
    expect(exportState).toEqual(result.state);
    await expect(f.store.mutate({ action: 'import', revision: 2, data: { version: 2 } })).rejects.toThrow();
    expect((await f.store.read()).state).toEqual(result.state);
  });

  it('rejects duplicate IDs, multiple active tasks, and forged elapsed totals on import', () => {
    const f = fixture();
    const state = transition({ version: 1, revision: 0, entries: [] }, { action: 'start', label: 'Work', revision: 0 }, f.clock());
    const duplicate = structuredClone(state);
    duplicate.entries.push(duplicate.entries[0]);
    expect(() => validate(duplicate)).toThrow();
    const multiple = structuredClone(state);
    multiple.entries.push({ ...multiple.entries[0], id: 'other' });
    expect(() => validate(multiple)).toThrow('Multiple active');
    const forged: WatchState = structuredClone(state);
    forged.entries[0].elapsedMs = 100_000;
    expect(() => validate(forged)).toThrow('elapsed');
  });
});
