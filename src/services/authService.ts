import type { AdminSession, CustomerSession } from '@/types';
import { ApiError, http } from './http';

/**
 * Authentication against the API. Passwords go over HTTPS to the server, which stores only a
 * bcrypt hash; the session is an httpOnly cookie that JavaScript cannot read.
 *
 * Errors are thrown as i18n keys in the `account` namespace (e.g. 'errors.invalidCredentials').
 */
function toI18nError(e: unknown): Error {
  if (e instanceof ApiError) {
    if (e.code === 'invalid_credentials') return new Error('errors.invalidCredentials');
    if (e.code === 'email_taken' || e.code === 'duplicate_email') return new Error('errors.exists');
    if (e.status === 429) return new Error('errors.tooManyAttempts');
    if (e.code === 'network_error') return new Error('errors.network');
  }
  return new Error('errors.generic');
}

export const authService = {
  async login(email: string, password: string): Promise<CustomerSession> {
    try {
      return (await http.post<{ customer: CustomerSession }>('/auth/login', { email, password })).customer;
    } catch (e) {
      throw toI18nError(e);
    }
  },

  async register(input: { fullName: string; email: string; password: string; country: string; marketingOptIn: boolean }): Promise<CustomerSession> {
    try {
      return (await http.post<{ customer: CustomerSession }>('/auth/register', input)).customer;
    } catch (e) {
      throw toI18nError(e);
    }
  },

  async adminLogin(email: string, password: string): Promise<AdminSession> {
    try {
      return (await http.post<{ admin: AdminSession }>('/auth/admin/login', { email, password })).admin;
    } catch (e) {
      throw toI18nError(e);
    }
  },

  /** Current server session (null fields when signed out). */
  me: () => http.get<{ customer: CustomerSession | null; admin: AdminSession | null }>('/auth/me'),

  logout: () => http.post<void>('/auth/logout'),

  changePassword: (currentPassword: string, newPassword: string) =>
    http.post<void>('/auth/change-password', { currentPassword, newPassword }),

  /** The API accepts the request; no email is sent until an email provider is connected. */
  async requestPasswordReset(email?: string): Promise<void> {
    await http.post('/auth/forgot-password', { email });
  },
};
