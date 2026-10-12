import { http } from './http';

/**
 * Browser storage is now used only for per-visitor preferences (cart, currency, language,
 * chat history, cached settings). All store data lives in MongoDB behind the API.
 */

const PREFIX = 'ksc:';

/** Remove this site's local preferences and cached state from this browser. */
export function clearLocalData(): void {
  try {
    for (const store of [localStorage, sessionStorage]) {
      Object.keys(store)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => store.removeItem(k));
    }
  } catch {
    /* storage unavailable */
  }
}

/**
 * Admin → Settings → "Reset demo data": wipes and re-seeds the database
 * (only when the server has ALLOW_DEMO_RESET=true), then clears local state.
 */
export async function resetDemoData(): Promise<void> {
  await http.post('/admin/reset-demo');
  clearLocalData();
}
