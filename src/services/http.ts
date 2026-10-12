/**
 * Thin fetch wrapper for the KitchenScaleCo Express API.
 *
 * - Dev: requests go to `/api`, which Vite proxies to the backend (see vite.config.ts),
 *   so the session cookie is same-origin.
 * - Prod: set VITE_API_URL (e.g. https://api.example.com/api) when the API lives elsewhere.
 * The session is an httpOnly cookie, so no token is ever stored in JavaScript.
 */

const BASE = ((import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api') as string;

export class ApiError extends Error {
  status: number;
  code: string;
  details?: Record<string, string[]>;
  constructor(status: number, code: string, message: string, details?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** Fired on window when an API call is rejected because the session is missing or expired. */
export const UNAUTHORIZED_EVENT = 'ksc:unauthorized';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'network_error', 'Cannot reach the server. Please check your connection and try again.');
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // Session expired/revoked: let the app re-check auth so guards can redirect to sign-in.
    if (res.status === 401 && !path.startsWith('/auth/')) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    const err = (data as { error?: { code?: string; message?: string; details?: Record<string, string[]> } } | null)?.error;
    throw new ApiError(res.status, err?.code ?? 'http_error', err?.message ?? `Request failed (${res.status})`, err?.details);
  }
  return data as T;
}

export const http = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T = void>(path: string) => request<T>('DELETE', path),
};

/** `undefined` instead of throwing for 404s — matches the old `Promise<T | undefined>` service signatures. */
export async function orUndefined<T>(p: Promise<T>): Promise<T | undefined> {
  try {
    return await p;
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 403)) return undefined;
    throw e;
  }
}

export const enc = encodeURIComponent;
