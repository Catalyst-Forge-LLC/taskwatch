import { StoreError, validate, type Mutation } from '../engine';
import type { Snapshot, Storage } from './types';

async function request(init?: RequestInit): Promise<Snapshot> {
  const response = await fetch('/api/watch', { cache: 'no-store', ...init });
  const payload = await response.json() as { message?: string; state?: unknown; serverNow?: unknown };
  if (!response.ok) throw new StoreError(payload?.message ?? 'Could not reach the local server.', response.status);
  if (typeof payload.serverNow !== 'number' || !Number.isFinite(payload.serverNow)) throw new StoreError('Invalid timer response.');
  return { state: validate(payload.state), serverNow: payload.serverNow };
}
export const storage: Storage = {
  read: () => request(),
  mutate: (input: Mutation) => request({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) }),
  export: async () => JSON.stringify((await request()).state, null, 2),
  subscribe: () => () => {}
};
