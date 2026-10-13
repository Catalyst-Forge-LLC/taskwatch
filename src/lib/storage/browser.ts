import { StoreError, transition, validate, type Mutation } from '../engine';
import type { WatchState } from '../timer';
import type { Storage } from './types';

export const STORAGE_KEY = 'taskwatch.v1';
const LOCK_NAME = 'taskwatch.v1.write';

export function createBrowserStorage(
  disk: Pick<StorageType, 'getItem' | 'setItem'>,
  locks: Pick<LockManager, 'request'> | undefined,
  clock = Date.now
): Storage {
  function readState(): WatchState {
    let raw: string | null;
    try { raw = disk.getItem(STORAGE_KEY); }
    catch { throw new StoreError('Browser storage is unavailable. Allow site storage to use Taskwatch.'); }
    if (raw === null) return { version: 1, revision: 0, entries: [] };
    try { return validate(JSON.parse(raw)); }
    catch { throw new StoreError('The saved history is invalid. It has been left untouched. Export a backup before restoring a valid file.', 422); }
  }
  return {
    async read() { return { state: readState(), serverNow: clock() }; },
    async export() { return disk.getItem(STORAGE_KEY) ?? JSON.stringify({ version: 1, revision: 0, entries: [] }); },
    async mutate(input: Mutation) {
      if (!locks) throw new StoreError('This browser cannot safely coordinate timer changes. Use a current browser over HTTPS or localhost.');
      return locks.request(LOCK_NAME, async () => {
        const now = clock();
        let current: WatchState;
        try { current = readState(); }
        catch (error) {
          // Only an explicitly confirmed import may replace corrupt JSON.
          // Read-access failures and ordinary timer actions remain failures.
          if (input.action !== 'import' || !(error instanceof StoreError) || error.status !== 422) throw error;
          current = { version: 1, revision: 0, entries: [] };
          input = { ...input, revision: 0 };
        }
        const next = transition(current, input, now);
        try { disk.setItem(STORAGE_KEY, JSON.stringify(next)); }
        catch { throw new StoreError('Could not save: browser storage is full or blocked. Export your history and free some space before retrying.'); }
        return { state: next, serverNow: now };
      });
    },
    subscribe(listener) {
      const changed = (event: StorageEvent) => { if (event.key === STORAGE_KEY || event.key === null) listener(); };
      window.addEventListener('storage', changed);
      return () => window.removeEventListener('storage', changed);
    }
  };
}

// Resolve browser globals lazily, after mount, so static prerendering stays safe.
type StorageType = globalThis.Storage;
export function browserStorage(): Storage {
  try { return createBrowserStorage(window.localStorage, navigator.locks); }
  catch { throw new StoreError('Browser storage is unavailable. Allow site storage to use Taskwatch.'); }
}
