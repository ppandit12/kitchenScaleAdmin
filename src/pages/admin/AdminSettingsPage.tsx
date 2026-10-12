import { useState } from "react";
import {
  Button,
  Input,
  Checkbox,
  Select,
  DemoNotice,
  ConfirmDialog,
} from "@/components/common";
import { PageTitle } from "@/components/admin";
import { useSettingsStore, usePreferencesStore, toast } from "@/store";
import { LANGUAGES, CURRENCIES } from "@/data/settings";
import { resetDemoData } from "@/services/storage";
import type { StoreSettings, LanguageCode, CurrencyCode } from "@/types";
import i18n from "@/i18n";
export default function AdminSettingsPage() {
  const store = useSettingsStore();
  const [draft, setDraft] = useState<StoreSettings>(() =>
    structuredClone(store.settings),
  );
  const [confirm, setConfirm] = useState(false);
  const field = <K extends keyof StoreSettings>(
    key: K,
    value: StoreSettings[K],
  ) => setDraft((s) => ({ ...s, [key]: value }));
  const save = async () => {
    if (
      !draft.storeName.trim() ||
      !draft.languages.length ||
      !draft.currencies.length
    ) {
      toast.error(
        "Enter a store name and enable at least one language and currency.",
      );
      return;
    }
    if (
      !draft.languages.includes(draft.defaultLanguage) ||
      !draft.currencies.includes(draft.defaultCurrency)
    ) {
      toast.error("The default language and currency must be enabled.");
      return;
    }
    if (
      Object.values(draft.exchangeRates).some(
        (v) => !Number.isFinite(v) || v <= 0,
      ) ||
      draft.exchangeRates.USD !== 1
    ) {
      toast.error("Exchange rates must be positive; USD must equal 1.");
      return;
    }
    if (
      Object.values(draft.brandColors).some((v) => !/^#[0-9a-f]{6}$/i.test(v))
    ) {
      toast.error("Enter six-digit hex colours.");
      return;
    }
    if (Object.values(draft.social).some((v) => v && !/^https:\/\//i.test(v))) {
      toast.error("Social links must start with https://.");
      return;
    }
    if (
      draft.shippingZones.some((z) =>
        z.rates.some(
          (r) =>
            !Number.isFinite(r.base) ||
            r.base < 0 ||
            !Number.isFinite(r.per100g) ||
            r.per100g < 0,
        ),
      )
    ) {
      toast.error("Shipping rates must be non-negative numbers.");
      return;
    }
    try {
      await store.save(draft);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save settings.");
      return;
    }
    if (!draft.currencies.includes(usePreferencesStore.getState().currency))
      usePreferencesStore.getState().setCurrency(draft.defaultCurrency);
    if (!draft.languages.includes(i18n.language as LanguageCode))
      void i18n.changeLanguage(draft.defaultLanguage);
    toast.success("Store settings saved.");
  };
  return (
    <>
      <PageTitle
        title="Settings"
        description="Configure the demo storefront, preferences and shipping zones."
        demo
      />
      <DemoNotice>
        Business details and shipping rates are draft demonstration content.
        Review them before launch.
      </DemoNotice>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="mt-6 space-y-6"
      >
        <section className="card grid gap-4 p-6 sm:grid-cols-2">
          <h2 className="text-xl sm:col-span-2">Store information</h2>
          {(
            [
              "storeName",
              "supportEmail",
              "supportPhone",
              "businessAddress",
            ] as const
          ).map((key) => (
            <Input
              key={key}
              label={
                {
                  storeName: "Store name",
                  supportEmail: "Support email",
                  supportPhone: "Support phone",
                  businessAddress: "Business address",
                }[key]
              }
              value={draft[key]}
              onChange={(e) => field(key, e.target.value)}
            />
          ))}
          <Checkbox
            label="Show announcement bar"
            checked={draft.announcement.enabled}
            onChange={(e) =>
              field("announcement", {
                ...draft.announcement,
                enabled: e.target.checked,
              })
            }
          />
          <Input
            label="Announcement"
            value={draft.announcement.text}
            onChange={(e) =>
              field("announcement", {
                ...draft.announcement,
                text: e.target.value,
              })
            }
          />
        </section>
        <section className="card grid gap-4 p-6 sm:grid-cols-3">
          <h2 className="text-xl sm:col-span-3">Brand colours</h2>
          {(
            Object.keys(
              draft.brandColors,
            ) as (keyof StoreSettings["brandColors"])[]
          ).map((key) => (
            <Input
              key={key}
              type="color"
              label={key}
              value={draft.brandColors[key]}
              onChange={(e) =>
                field("brandColors", {
                  ...draft.brandColors,
                  [key]: e.target.value,
                })
              }
            />
          ))}
        </section>
        <section className="card grid gap-6 p-6 sm:grid-cols-2">
          <div>
            <h2 className="mb-4 text-xl">Languages</h2>
            <div className="space-y-3">
              {LANGUAGES.map((l) => (
                <Checkbox
                  key={l.code}
                  label={l.label}
                  checked={draft.languages.includes(l.code)}
                  onChange={(e) =>
                    field(
                      "languages",
                      e.target.checked
                        ? [...draft.languages, l.code]
                        : draft.languages.filter((v) => v !== l.code),
                    )
                  }
                />
              ))}
            </div>
            <Select
              containerClassName="mt-4"
              label="Default language"
              value={draft.defaultLanguage}
              onChange={(e) =>
                field("defaultLanguage", e.target.value as LanguageCode)
              }
              options={LANGUAGES.map((l) => ({
                value: l.code,
                label: l.label,
              }))}
            />
          </div>
          <div>
            <h2 className="mb-4 text-xl">Currencies and demo rates</h2>
            <div className="space-y-3">
              {CURRENCIES.map((c) => (
                <div
                  key={c.code}
                  className="grid grid-cols-2 items-center gap-3"
                >
                  <Checkbox
                    label={c.code}
                    checked={draft.currencies.includes(c.code)}
                    onChange={(e) =>
                      field(
                        "currencies",
                        e.target.checked
                          ? [...draft.currencies, c.code]
                          : draft.currencies.filter((v) => v !== c.code),
                      )
                    }
                  />
                  <Input
                    type="number"
                    step="0.001"
                    min="0.001"
                    disabled={c.code === "USD"}
                    label={`${c.code} per USD`}
                    value={draft.exchangeRates[c.code]}
                    onChange={(e) =>
                      field("exchangeRates", {
                        ...draft.exchangeRates,
                        [c.code]: Number(e.target.value),
                      })
                    }
                  />
                </div>
              ))}
            </div>
            <Select
              containerClassName="mt-4"
              label="Default currency"
              value={draft.defaultCurrency}
              onChange={(e) =>
                field("defaultCurrency", e.target.value as CurrencyCode)
              }
              options={CURRENCIES.map((c) => ({
                value: c.code,
                label: c.code,
              }))}
            />
          </div>
        </section>
        <section className="card space-y-6 p-6">
          <h2 className="text-xl">Shipping zones (demo USD rates)</h2>
          {draft.shippingZones.map((zone, index) => (
            <div key={zone.id} className="space-y-4 border-t border-line pt-4">
              <Checkbox
                label={zone.name}
                checked={zone.enabled}
                onChange={(e) =>
                  field(
                    "shippingZones",
                    draft.shippingZones.map((z, i) =>
                      i === index ? { ...z, enabled: e.target.checked } : z,
                    ),
                  )
                }
              />
              <p className="text-sm text-muted">{zone.countries.join(", ")}</p>
              {zone.rates.map((rate, ri) => (
                <div key={rate.id} className="grid gap-4 sm:grid-cols-3">
                  <Input
                    label="Method name"
                    value={rate.name}
                    onChange={(e) =>
                      field(
                        "shippingZones",
                        draft.shippingZones.map((z, i) =>
                          i === index
                            ? {
                                ...z,
                                rates: z.rates.map((r, j) =>
                                  j === ri ? { ...r, name: e.target.value } : r,
                                ),
                              }
                            : z,
                        ),
                      )
                    }
                  />
                  {(["base", "per100g"] as const).map((key) => (
                    <Input
                      key={key}
                      type="number"
                      min="0"
                      step="0.01"
                      label={
                        key === "base" ? "Base rate (USD)" : "Per 100g (USD)"
                      }
                      value={rate[key]}
                      onChange={(e) =>
                        field(
                          "shippingZones",
                          draft.shippingZones.map((z, i) =>
                            i === index
                              ? {
                                  ...z,
                                  rates: z.rates.map((r, j) =>
                                    j === ri
                                      ? { ...r, [key]: Number(e.target.value) }
                                      : r,
                                  ),
                                }
                              : z,
                          ),
                        )
                      }
                    />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </section>
        <section className="card grid gap-4 p-6 sm:grid-cols-2">
          <h2 className="text-xl sm:col-span-2">Social links</h2>
          {(Object.keys(draft.social) as (keyof StoreSettings["social"])[]).map(
            (key) => (
              <Input
                key={key}
                type="url"
                label={key}
                value={draft.social[key]}
                onChange={(e) =>
                  field("social", { ...draft.social, [key]: e.target.value })
                }
              />
            ),
          )}
        </section>
        <section className="card space-y-4 p-6">
          <h2 className="text-xl">Notification preferences</h2>
          {(
            Object.keys(
              draft.notifications,
            ) as (keyof StoreSettings["notifications"])[]
          ).map((key) => (
            <Checkbox
              key={key}
              label={
                {
                  newOrder: "New orders",
                  lowStock: "Low stock",
                  newReview: "New reviews",
                  newSubscriber: "New subscribers",
                }[key]
              }
              checked={draft.notifications[key]}
              onChange={(e) =>
                field("notifications", {
                  ...draft.notifications,
                  [key]: e.target.checked,
                })
              }
            />
          ))}
          <Input
            type="number"
            min="0"
            step="1"
            label="Low stock threshold"
            value={draft.lowStockThreshold}
            onChange={(e) =>
              field(
                "lowStockThreshold",
                Math.max(0, Math.floor(Number(e.target.value))),
              )
            }
          />
        </section>
        <Button type="submit">Save settings</Button>
      </form>
      <section className="card mt-8 p-6">
        <h2 className="text-xl">Reset demonstration data</h2>
        <p className="my-4 text-sm text-muted">
          Wipe the database and restore the sample products, orders, customers,
          reviews and settings. Disabled on servers without ALLOW_DEMO_RESET.
        </p>
        <Button variant="outline" onClick={() => setConfirm(true)}>
          Reset all demo data
        </Button>
      </section>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Reset demo data?"
        message="This wipes the database and restores the sample catalogue, orders, customers and settings. It only works when the server has ALLOW_DEMO_RESET=true."
        confirmLabel="Reset demo data"
        onConfirm={async () => {
          try {
            await resetDemoData();
            window.location.assign("/");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Reset failed.");
            setConfirm(false);
          }
        }}
      />
    </>
  );
}
