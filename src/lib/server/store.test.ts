import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore } from './store';
import { duration, elapsed, todayElapsed } from '../timer';

describe('durable task stopwatch', () => {
  let dir: string;
  let file: string;
  let now: number;
  let store: ReturnType<typeof createStore>;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'taskwatch-'));
    file = join(dir, 'watch.json');
    now = Date.parse('2026-10-12T14:00:00.000Z');
    store = createStore(file, () => now);
  });
  afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

  it('saves exact timestamps, excludes pauses and survives a server restart', async () => {
    await store.mutate({ action: 'start', revision: 0, label: '  Build the thing  ' });
    now += 10_000;
    const paused = await store.mutate({ action: 'pause', revision: 1 });
    expect(paused.entries[0].elapsedMs).toBe(10_000);
    now += 60_000;
    store = createStore(file, () => now);
    expect(elapsed((await store.read()).entries[0], now)).toBe(10_000);
    await store.mutate({ action: 'resume', revision: 2 });
    now += 20_000;
    const stopped = await store.mutate({ action: 'stop', revision: 3 });
    const entry = stopped.entries[0];
    expect(entry.label).toBe('Build the thing');
    expect(entry.elapsedMs).toBe(30_000);
    expect(entry.startedAt).toBe('2026-10-12T14:00:00.000Z');
    expect(entry.stoppedAt).toBe('2026-10-12T14:01:30.000Z');
    expect(entry.segments).toHaveLength(2);
    expect(JSON.parse(await readFile(file, 'utf8'))).toEqual(stopped);
  });

  it('continues running while the page or server is closed', async () => {
    await store.mutate({ action: 'start', revision: 0, label: 'Work' });
    now += 65_000;
    const restarted = createStore(file, () => now);
    expect(elapsed((await restarted.read()).entries[0], now)).toBe(65_000);
  });

  it('serializes competing starts and rejects a stale revision', async () => {
    const results = await Promise.allSettled([
      store.mutate({ action: 'start', revision: 0, label: 'One' }),
      store.mutate({ action: 'start', revision: 0, label: 'Two' })
    ]);
    expect(results.map((result) => result.status)).toEqual(['fulfilled', 'rejected']);
    expect((await store.read()).entries).toHaveLength(1);
    await expect(store.mutate({ action: 'stop', revision: 0 })).rejects.toMatchObject({ status: 409 });
  });

  it('does not overwrite malformed JSON or invalid persisted records', async () => {
    await writeFile(file, '{broken');
    await expect(store.mutate({ action: 'start', revision: 0, label: 'Work' })).rejects.toThrow();
    expect(await readFile(file, 'utf8')).toBe('{broken');
    await writeFile(file, JSON.stringify({ version: 1, revision: 0, entries: [{}] }));
    await expect(store.read()).rejects.toThrow('Invalid Taskwatch entry');
  });

  it('stops a paused task without counting the final pause', async () => {
    await store.mutate({ action: 'start', revision: 0, label: 'Work' });
    now += 12_000;
    await store.mutate({ action: 'pause', revision: 1 });
    now += 99_000;
    const entry = (await store.mutate({ action: 'stop', revision: 2 })).entries[0];
    expect(entry.elapsedMs).toBe(12_000);
    expect(entry.stoppedAt).toBe(new Date(now).toISOString());
  });

  it('validates labels and transitions and permits renaming and deleting finished entries', async () => {
    await expect(store.mutate({ action: 'start', revision: 0, label: '  ' })).rejects.toThrow('label');
    await store.mutate({ action: 'start', revision: 0, label: 'Work' });
    await expect(store.mutate({ action: 'resume', revision: 1 })).rejects.toThrow('already running');
    const id = (await store.read()).entries[0].id;
    await expect(store.mutate({ action: 'delete', revision: 1, id })).rejects.toThrow('Stop');
    await store.mutate({ action: 'stop', revision: 1 });
    const renamed = await store.mutate({ action: 'rename', revision: 2, id, label: 'Better label' });
    expect(renamed.entries[0].label).toBe('Better label');
    expect((await store.mutate({ action: 'delete', revision: 3, id })).entries).toEqual([]);
  });

  it('counts only work after local midnight in today’s total', async () => {
    const midnight = new Date(2026, 9, 12, 0, 0, 0).getTime();
    now = midnight - 10_000;
    await store.mutate({ action: 'start', revision: 0, label: 'Late work' });
    now = midnight + 20_000;
    expect(todayElapsed((await store.read()).entries, now)).toBe(20_000);
    expect(duration(100 * 3600_000 + 62_000)).toBe('100:01:02');
  });
});
