import type { Storage } from './types';
import { browserStorage } from './browser';

export const browserMode = __TASKWATCH_BROWSER__;
export { browserStorage };

export async function getStorage(): Promise<Storage> {
  if (__TASKWATCH_BROWSER__) return browserStorage();
  return (await import('./file-client')).storage;
}
