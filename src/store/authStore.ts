import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminSession, CustomerSession } from '@/types';
import { authService } from '@/services/authService';

interface AuthState {
  /**
   * Display info for the signed-in customer. The real session is an httpOnly cookie set by the
   * API; this copy only avoids a flash of "signed out" UI and is re-checked by `sync()`.
   */
  customer: CustomerSession | null;
  /** Display info for a signed-in admin (the API enforces the admin role on every request). */
  admin: AdminSession | null;
  setCustomer: (s: CustomerSession | null) => void;
  setAdmin: (s: AdminSession | null) => void;
  updateCustomerName: (fullName: string) => void;
  signOut: () => Promise<void>;
  signOutAdmin: () => Promise<void>;
  /** Re-read the session from the API (on app start / after the cookie may have expired). */
  sync: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      customer: null,
      admin: null,
      setCustomer: (customer) => set({ customer, admin: customer ? null : get().admin }),
      setAdmin: (admin) => set({ admin, customer: admin ? null : get().customer }),
      updateCustomerName: (fullName) => {
        const c = get().customer;
        if (c) set({ customer: { ...c, fullName } });
      },
      signOut: async () => {
        set({ customer: null });
        await authService.logout().catch(() => undefined);
      },
      signOutAdmin: async () => {
        set({ admin: null });
        await authService.logout().catch(() => undefined);
      },
      sync: async () => {
        try {
          const me = await authService.me();
          set({ customer: me.customer, admin: me.admin });
        } catch {
          // API unreachable: keep the cached display state; protected calls will still be rejected.
        }
      },
    }),
    { name: 'ksc:auth', version: 2, migrate: () => ({ customer: null, admin: null }) },
  ),
);
