import { createStore, get, set, type UseStore } from 'idb-keyval';
import { sanitizeState, type AppState } from '../state/store';

let _store: UseStore | undefined;
/** One IndexedDB database holds both the work-in-progress and the gallery. */
export const kv = (): UseStore => (_store ??= createStore('rangoli-time', 'kv'));

const WIP_KEY = 'wip';

export async function saveWip(s: AppState): Promise<void> {
  try {
    await set(WIP_KEY, s, kv());
  } catch {
    /* storage can be blocked (private mode); the app keeps working in memory */
  }
}
export async function loadWip(): Promise<AppState> {
  try {
    return sanitizeState(await get(WIP_KEY, kv()));
  } catch {
    return sanitizeState(null);
  }
}

/** Ask the browser not to evict our data. Safe to call repeatedly; resolves false if unsupported or refused. */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted?.()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
