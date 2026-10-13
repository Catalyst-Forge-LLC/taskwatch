import type { WatchState } from '../timer';
import type { Mutation } from '../engine';

export type Snapshot = { state: WatchState; serverNow: number };
export interface Storage {
  read(): Promise<Snapshot>;
  mutate(input: Mutation): Promise<Snapshot>;
  export(): Promise<string>;
  subscribe(listener: () => void): () => void;
}
