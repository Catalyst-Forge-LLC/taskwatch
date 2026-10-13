import type { Storage } from './types';

export const browserMode = __TASKWATCH_BROWSER__;
export async function getStorage(): Promise<Storage> {
  if (__TASKWATCH_BROWSER__) return (await import('./browser')).browserStorage();
  return (await import('./file-client')).storage;
}
