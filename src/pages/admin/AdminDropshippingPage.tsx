import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ExternalLink, Link2, PackagePlus, RefreshCw, Search, Unlink, Zap } from 'lucide-react';
import { Badge, Button, Checkbox, ConfirmDialog, DemoNotice, ErrorState, Input, LoadingState, Toggle } from '@/components/common';
import { AdminCard, PageTitle, useUsd } from '@/components/admin';
import { useAsync, useDocumentTitle } from '@/hooks';
import { ApiError, dropshipService } from '@/services';
import { toast } from '@/store';
import type { DropshipLink, DropshipSettings, DropshipStatusInfo, SupplierProduct } from '@/types';
import { formatDateTime } from '@/utils';

const STATE_KEY = 'ksc:aliexpress-oauth-state';
const errorMessage = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);
const callbackUrl = () => `${window.location.origin}/admin/dropshipping`;

export default function AdminDropshippingPage() {
  useDocumentTitle('Dropshipping · Admin');
  const { data, loading, error, reload, setData } = useAsync(() => dropshipService.status(), []);
  const links = useAsync(() => dropshipService.links(), []);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const handled = useRef(false);

  // AliExpress redirects back here with ?code=…&state=… after the account owner approves access.
  useEffect(() => {
    const code = params.get('code');
    if (!code || handled.current) return;
    handled.current = true;
    let expected: string | null = null;
    try {
      expected = sessionStorage.getItem(STATE_KEY);
      sessionStorage.removeItem(STATE_KEY);
    } catch {
      /* storage unavailable */
    }
    navigate('/admin/dropshipping', { replace: true });
    if (!expected || params.get('state') !== expected) {
      toast.error('The AliExpress sign-in could not be verified. Please try connecting again.');
      return;
    }
    dropshipService
      .connect(code)
      .then((s) => {
        setData(s);
        toast.success('AliExpress account connected.');
      })
      .catch((e) => toast.error(errorMessage(e, 'Could not connect the AliExpress account.')));
  }, [params, navigate, setData]);

  if (loading) return <LoadingState className="min-h-[50vh]" />;
  if (error || !data) return <ErrorState onRetry={reload} />;

  return (
    <>
      <PageTitle
        title="Dropshipping"
        description="Import products from AliExpress, sell them in your store, and send paid orders to the supplier for fulfilment."
      />
      {!data.configured && <SetupNotice />}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          <ImportCard status={data} onImported={links.reload} />
          <LinkedProducts links={links.data ?? []} loading={links.loading} onChange={links.reload} />
        </div>
        <aside className="space-y-5">
          <ConnectionCard status={data} onChange={setData} />
          <SettingsCard settings={data.settings} onSaved={setData} />
        </aside>
      </div>
    </>
  );
}

/* --------------------------------- Setup --------------------------------- */

function SetupNotice() {
  return (
    <DemoNotice tone="info" className="mb-5">
      <strong>Finish the AliExpress setup.</strong> Create a <em>Dropshipping</em> app at{' '}
      <a href="https://openservice.aliexpress.com" target="_blank" rel="noreferrer" className="underline">
        openservice.aliexpress.com
      </a>{' '}
      and set its callback URL to <code className="font-mono text-xs">{callbackUrl()}</code>. Then add <code>ALIEXPRESS_APP_KEY</code> and{' '}
      <code>ALIEXPRESS_APP_SECRET</code> to the backend environment and restart it.
    </DemoNotice>
  );
}

/* ------------------------------- Connection ------------------------------ */

function ConnectionCard({ status, onChange }: { status: DropshipStatusInfo; onChange: (s: DropshipStatusInfo) => void }) {
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const connect = async () => {
    setBusy(true);
    try {
      const state = crypto.randomUUID().replace(/-/g, '');
      sessionStorage.setItem(STATE_KEY, state);
      const { url } = await dropshipService.authorizeUrl(callbackUrl(), state);
      window.location.assign(url);
    } catch (e) {
      toast.error(errorMessage(e, 'Could not start the AliExpress sign-in.'));
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      onChange(await dropshipService.disconnect());
      setConfirm(false);
      toast.success('AliExpress account disconnected.');
    } catch (e) {
      toast.error(errorMessage(e, 'Could not disconnect.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminCard
      title={
        <span className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-muted" aria-hidden /> AliExpress account
        </span>
      }
    >
      {status.connected ? (
        <div className="space-y-3 text-sm">
          <p className="flex items-center gap-2">
            <Badge tone="success">Connected</Badge>
            {status.account && <span className="truncate font-medium">{status.account}</span>}
          </p>
          {status.expiresAt && <p className="text-xs text-muted">Access renews automatically · token valid until {formatDateTime(status.expiresAt)}</p>}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" loading={busy} onClick={connect} disabled={!status.configured}>
              Reconnect
            </Button>
            <Button size="sm" variant="ghost" className="text-danger" onClick={() => setConfirm(true)}>
              Disconnect
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          <p className="text-muted">Sign in to the AliExpress account that will buy and ship products for your customers.</p>
          <Button size="sm" fullWidth loading={busy} onClick={connect} disabled={!status.configured}>
            Connect AliExpress
          </Button>
          {!status.configured && <p className="text-xs text-muted">Available once the app key and secret are set on the backend.</p>}
        </div>
      )}
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={disconnect}
        loading={busy}
        title="Disconnect AliExpress?"
        confirmLabel="Disconnect"
        message="Imported products stay in your catalog, but you won’t be able to sync stock or send orders until you reconnect."
      />
    </AdminCard>
  );
}

/* -------------------------------- Settings ------------------------------- */

function SettingsCard({ settings, onSaved }: { settings: DropshipSettings; onSaved: (s: DropshipStatusInfo) => void }) {
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  useEffect(() => setForm(settings), [settings]);

  const save = async () => {
    setSaving(true);
    try {
      onSaved(await dropshipService.saveSettings({ ...form, shipToCountry: form.shipToCountry.toUpperCase() }));
      toast.success('Dropshipping settings saved.');
    } catch (e) {
      toast.error(errorMessage(e, 'Could not save the settings.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminCard title="Defaults">
      <div className="space-y-3">
        <Input
          label="Markup (%)"
          type="number"
          min={0}
          max={1000}
          value={form.markupPercent}
          onChange={(e) => setForm({ ...form, markupPercent: Number(e.target.value) })}
          hint="Storefront price = AliExpress cost × (1 + markup). Cost excludes supplier shipping."
          className="py-2.5 text-sm"
        />
        <Input
          label="Ship-to country"
          maxLength={2}
          value={form.shipToCountry}
          onChange={(e) => setForm({ ...form, shipToCountry: e.target.value.toUpperCase() })}
          hint="2-letter code used for supplier prices and stock, e.g. US."
          className="py-2.5 text-sm uppercase"
        />
        <Input
          label="Shipping service (optional)"
          value={form.logisticsService}
          onChange={(e) => setForm({ ...form, logisticsService: e.target.value.trim() })}
          placeholder="CAINIAO_STANDARD"
          hint="Leave empty to let AliExpress choose."
          className="py-2.5 font-mono text-sm"
        />
        <Button size="sm" fullWidth loading={saving} onClick={save}>
          Save defaults
        </Button>
      </div>
    </AdminCard>
  );
}

/* --------------------------------- Import -------------------------------- */

function ImportCard({ status, onImported }: { status: DropshipStatusInfo; onImported: () => void }) {
  const usd = useUsd();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ product: SupplierProduct; alreadyImportedAs?: string } | null>(null);
  const [name, setName] = useState('');
  const [markup, setMarkup] = useState(status.settings.markupPercent);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [publish, setPublish] = useState(false);
  const [importing, setImporting] = useState(false);
  const ready = status.configured && status.connected;

  const fetchPreview = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await dropshipService.preview(input.trim());
      setPreview(res);
      setName(res.product.title.slice(0, 160));
      setMarkup(res.markupPercent);
      setSelected(new Set(res.product.skus.slice(0, 100).map((s) => s.skuId)));
    } catch (e) {
      toast.error(errorMessage(e, 'Could not load that product from AliExpress.'));
    } finally {
      setLoading(false);
    }
  };

  const doImport = async () => {
    if (!preview) return;
    setImporting(true);
    try {
      const product = await dropshipService.importProduct({
        supplierProductId: preview.product.productId,
        name: name.trim() || undefined,
        markupPercent: markup,
        skuIds: [...selected],
        status: publish ? 'active' : 'draft',
      });
      toast.success(`“${product.name}” added to your catalog${publish ? '' : ' as a draft'}.`);
      setPreview(null);
      setInput('');
      onImported();
    } catch (e) {
      toast.error(errorMessage(e, 'Could not import the product.'));
    } finally {
      setImporting(false);
    }
  };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const p = preview?.product;
  return (
    <AdminCard
      title={
        <span className="flex items-center gap-2">
          <PackagePlus className="h-4 w-4 text-muted" aria-hidden /> Import from AliExpress
        </span>
      }
      description="Paste a product link, review the variants and prices, then add it to your catalog."
    >
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void fetchPreview();
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://www.aliexpress.com/item/1005….html"
          aria-label="AliExpress product link or id"
          className="field-input py-2.5 text-sm"
          disabled={!ready}
        />
        <Button type="submit" size="sm" className="h-auto" loading={loading} disabled={!ready || !input.trim()} leftIcon={<Search className="h-4 w-4" />}>
          Preview
        </Button>
      </form>
      {!ready && <p className="mt-2 text-xs text-muted">Connect an AliExpress account to import products.</p>}

      {p && (
        <div className="mt-5 space-y-4 border-t border-line/70 pt-5">
          <div className="flex gap-4">
            {p.images[0] && <img src={p.images[0]} alt="" className="h-24 w-24 shrink-0 rounded-xl border border-line/60 object-cover" />}
            <div className="min-w-0 flex-1 space-y-1">
              <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                AliExpress #{p.productId} <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <p className="line-clamp-2 text-sm text-muted">{p.title}</p>
              <p className="text-xs text-muted">
                {p.images.length} images · {p.skus.length} variants · prices for {p.shipToCountry}
              </p>
            </div>
          </div>
          {preview.alreadyImportedAs && (
            <DemoNotice tone="info">
              Already in your catalog —{' '}
              <Link to={`/admin/products/${preview.alreadyImportedAs}`} className="underline">
                open the product
              </Link>
              .
            </DemoNotice>
          )}
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
            <Input label="Product name" value={name} maxLength={160} onChange={(e) => setName(e.target.value)} className="py-2.5 text-sm" />
            <Input label="Markup (%)" type="number" min={0} max={1000} value={markup} onChange={(e) => setMarkup(Number(e.target.value))} className="py-2.5 text-sm" />
          </div>

          <div className="overflow-x-auto rounded-xl border border-line/70">
            <table className="w-full text-sm">
              <thead className="bg-cream/40 text-left text-xs text-muted">
                <tr>
                  <th className="px-3 py-2">
                    <span className="sr-only">Import</span>
                  </th>
                  <th className="px-3 py-2">Variant</th>
                  <th className="px-3 py-2 text-right">Cost</th>
                  <th className="px-3 py-2 text-right">Your price</th>
                  <th className="px-3 py-2 text-right">Supplier stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {p.skus.slice(0, 100).map((s) => (
                  <tr key={s.skuId}>
                    <td className="px-3 py-2">
                      <Checkbox label={<span className="sr-only">Import variant</span>} checked={selected.has(s.skuId)} onChange={() => toggle(s.skuId)} />
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-2">
                        {s.image && <img src={s.image} alt="" className="h-8 w-8 rounded-md object-cover" />}
                        {Object.values(s.options).join(' / ') || 'Default'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{usd(s.cost)}</td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">{usd(Math.round(s.cost * (1 + markup / 100) * 100) / 100)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{s.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-3 text-sm">
              <Toggle checked={publish} onChange={setPublish} label="Publish immediately" />
              Publish immediately
            </label>
            <Button loading={importing} disabled={!selected.size || Boolean(preview.alreadyImportedAs)} onClick={doImport}>
              Import {selected.size} variant{selected.size === 1 ? '' : 's'}
            </Button>
          </div>
        </div>
      )}
    </AdminCard>
  );
}

/* ---------------------------- Linked products ---------------------------- */

function LinkedProducts({ links, loading, onChange }: { links: DropshipLink[]; loading: boolean; onChange: () => void }) {
  const usd = useUsd();
  const [busy, setBusy] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState<DropshipLink | null>(null);
  const sorted = useMemo(() => links.filter((l) => l.product), [links]);

  const sync = async (link: DropshipLink, reprice: boolean) => {
    setBusy(link.productId);
    try {
      await dropshipService.syncProduct(link.productId, reprice);
      toast.success(reprice ? 'Stock and prices updated from AliExpress.' : 'Stock and costs updated from AliExpress.');
      onChange();
    } catch (e) {
      toast.error(errorMessage(e, 'Could not sync this product.'));
    } finally {
      setBusy(null);
    }
  };

  const unlink = async () => {
    if (!unlinking) return;
    setBusy(unlinking.productId);
    try {
      await dropshipService.unlink(unlinking.productId);
      toast.success('Supplier link removed. The product stays in your catalog.');
      setUnlinking(null);
      onChange();
    } catch (e) {
      toast.error(errorMessage(e, 'Could not remove the link.'));
    } finally {
      setBusy(null);
    }
  };

  const range = (values: number[]) => {
    if (!values.length) return '—';
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    return lo === hi ? usd(lo) : `${usd(lo)} – ${usd(hi)}`;
  };

  return (
    <AdminCard title="Dropshipped products" description="Catalog products fulfilled by AliExpress." padded={false}>
      {loading ? (
        <LoadingState className="py-10" />
      ) : !sorted.length ? (
        <p className="px-5 py-8 text-center text-sm text-muted">No AliExpress products imported yet.</p>
      ) : (
        <ul className="divide-y divide-line/60">
          {sorted.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2">
                  <Link to={`/admin/products/${l.productId}`} className="truncate font-medium hover:text-primary">
                    {l.product!.name}
                  </Link>
                  <Badge tone={l.product!.status === 'active' ? 'success' : 'neutral'}>{l.product!.status === 'active' ? 'Active' : 'Draft'}</Badge>
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  <a href={l.supplierUrl} target="_blank" rel="noreferrer" className="hover:text-primary hover:underline">
                    AliExpress #{l.supplierProductId}
                  </a>{' '}
                  · cost {range(l.skus.map((s) => s.cost))} · price {range(l.product!.prices.map((p) => p.price))} · {l.skus.reduce((n, s) => n + s.stock, 0)} in
                  supplier stock
                  {l.lastSyncedAt && <> · synced {formatDateTime(l.lastSyncedAt)}</>}
                </p>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="ghost" loading={busy === l.productId} onClick={() => sync(l, false)} leftIcon={<RefreshCw className="h-4 w-4" />}>
                  Sync
                </Button>
                <Button size="sm" variant="ghost" disabled={busy === l.productId} onClick={() => sync(l, true)} leftIcon={<Zap className="h-4 w-4" />}>
                  Reprice
                </Button>
                <Button size="sm" variant="ghost" className="text-danger" disabled={busy === l.productId} onClick={() => setUnlinking(l)} leftIcon={<Unlink className="h-4 w-4" />}>
                  Unlink
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={Boolean(unlinking)}
        onClose={() => setUnlinking(null)}
        onConfirm={unlink}
        loading={Boolean(busy)}
        title="Remove the AliExpress link?"
        confirmLabel="Unlink"
        message="The product stays in your catalog, but its orders will no longer be sent to AliExpress and its stock won’t sync."
      />
    </AdminCard>
  );
}
