import { mkdir, readFile, rename, writeFile, unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { type WatchState } from '../timer';
import { validate, transition, type Mutation } from '../engine';
export { StoreError } from '../engine';

export function createStore(file: string, clock = Date.now) {
  // Serialize reads and writes in this server process; revisions protect stale browser tabs.
  let queue: Promise<unknown> = Promise.resolve();
  function exclusive<T>(fn: () => Promise<T>): Promise<T> {
    const result = queue.then(fn);
    queue = result.catch(() => undefined);
    return result;
  }

  async function read(): Promise<WatchState> {
    let contents: string;
    try { contents = await readFile(file, 'utf8'); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { version: 1, revision: 0, entries: [] };
      throw error;
    }
    // Never replace an unreadable or malformed file with an empty history.
    return validate(JSON.parse(contents));
  }

  async function write(state: WatchState) {
    await mkdir(dirname(file), { recursive: true });
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, JSON.stringify(state, null, 2) + '\n', { flag: 'wx' });
      await rename(temporary, file);
    } finally { await unlink(temporary).catch(() => undefined); }
  }

  return {
    read: () => exclusive(read),
    mutate: (input: Mutation) => exclusive(async () => {
      const state = transition(await read(), input, clock(), randomUUID);
      await write(state);
      return state;
    })
  };
}

export const store = createStore(resolve(process.env.TASKWATCH_DATA_FILE || 'data/taskwatch.json'));
