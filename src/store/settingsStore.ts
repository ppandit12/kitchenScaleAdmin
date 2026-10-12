import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StoreSettings } from "@/types";
import { DEFAULT_SETTINGS } from "@/data/settings";
import { http } from "@/services/http";

function migrateSocial(social: StoreSettings["social"] | undefined) {
  const result = { ...DEFAULT_SETTINGS.social, ...social };
  for (const network of ["instagram", "facebook"] as const) {
    if (result[network] === `https://www.${network}.com/`) {
      result[network] = DEFAULT_SETTINGS.social[network];
    }
  }
  return result;
}

const previousColors: Record<string, string[]> = {
  primary: ["#263B32", "#4F8038", "#A8792C"],
  secondary: ["#A8B9A5", "#DDEBCF", "#DCEFE9"],
  background: ["#FAF8F3", "#FFFFFF", "#FFFAF1"],
  text: ["#202722", "#161916", "#563909"],
  accent: ["#C9A77A", "#F5E6CB"],
};
function migrateColors(colors: StoreSettings["brandColors"] | undefined) {
  const result = { ...DEFAULT_SETTINGS.brandColors, ...colors };
  for (const key of Object.keys(result) as (keyof typeof result)[]) {
    if (previousColors[key].includes(colors?.[key]?.toUpperCase() ?? ""))
      result[key] = DEFAULT_SETTINGS.brandColors[key];
  }
  return result;
}

interface SettingsState {
  settings: StoreSettings;
  /** Local-only change (e.g. live preview). Use `save` to persist. */
  update: (patch: Partial<StoreSettings>) => void;
  /** Admin: persist to the API, then apply. */
  save: (patch: Partial<StoreSettings>) => Promise<void>;
  /** Load the store settings from the API (called once on app start). */
  hydrate: () => Promise<void>;
  reset: () => void;
}

/**
 * Store configuration from the API (Admin → Settings), cached in localStorage so the
 * storefront renders instantly before the fresh copy arrives.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      update: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
      save: async (patch) => {
        const settings = await http.put<StoreSettings>("/settings", patch);
        set({ settings: { ...DEFAULT_SETTINGS, ...settings, social: migrateSocial(settings.social) } });
      },
      hydrate: async () => {
        try {
          const settings = await http.get<StoreSettings>("/settings");
          set({ settings: { ...DEFAULT_SETTINGS, ...settings, social: migrateSocial(settings.social) } });
        } catch {
          // Offline / API down: keep the cached copy so the storefront still renders.
        }
      },
      reset: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: "ksc:settings",
      version: 1,
      // Merge so newly added default keys appear for users with older saved settings.
      merge: (persisted, current) => ({
        ...current,
        settings: {
          ...current.settings,
          ...((persisted as Partial<SettingsState>)?.settings ?? {}),
          social: migrateSocial(
            (persisted as Partial<SettingsState>)?.settings?.social,
          ),
          brandColors: migrateColors(
            (persisted as Partial<SettingsState>)?.settings?.brandColors,
          ),
        },
      }),
    },
  ),
);
